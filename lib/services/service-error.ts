/** Base error for all service-layer failures. Never carries document content. */
export class ServiceError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}

/** Thrown by foundation stubs until a later milestone implements the service. */
export class ServiceNotImplementedError extends ServiceError {
  constructor(service: string, method: string) {
    super("NOT_IMPLEMENTED", `${service}.${method} is scheduled for a later milestone.`);
    this.name = "ServiceNotImplementedError";
  }
}
