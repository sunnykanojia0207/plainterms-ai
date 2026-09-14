/**
 * DocumentStorage abstraction: store/read/delete/exists over opaque ids.
 * Business logic depends on this interface, never on the filesystem, so a
 * later move to cloud storage touches one file. Ids are validated to block
 * path traversal — filenames never reach the filesystem.
 */
import "server-only";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export interface DocumentStorage {
  store(id: string, bytes: Uint8Array): Promise<void>;
  read(id: string): Promise<Uint8Array>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

function assertSafeId(id: string): void {
  if (!ID_PATTERN.test(id)) {
    throw new Error("Invalid document id.");
  }
}

/** Local temp-directory storage for the upload pipeline's working files. */
export class LocalTempStorage implements DocumentStorage {
  private readonly dir: string;

  constructor(subdir = "plainterms-uploads") {
    this.dir = path.join(os.tmpdir(), subdir);
  }

  private filePath(id: string): string {
    assertSafeId(id);
    return path.join(this.dir, `${id}.bin`);
  }

  async store(id: string, bytes: Uint8Array): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(this.filePath(id), bytes);
  }

  async read(id: string): Promise<Uint8Array> {
    return new Uint8Array(await fs.readFile(this.filePath(id)));
  }

  async delete(id: string): Promise<void> {
    try {
      await fs.unlink(this.filePath(id));
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | null)?.code;
      if (code !== "ENOENT") {
        throw error;
      }
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      await fs.access(this.filePath(id));
      return true;
    } catch {
      return false;
    }
  }
}
