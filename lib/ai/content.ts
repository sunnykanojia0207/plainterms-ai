/**
 * Document-content representation — the abstraction the AI layer reads.
 * Today it adapts the deterministic fixture; tomorrow PDF/DOCX/TXT parser
 * output plugs in here. Prompts, schemas, and services never see raw files.
 */
import { FIXTURE_ID, getFixtureSections } from "@/lib/documents/fixture";
import { FIXTURE_V1_ID, getFixtureV1Sections } from "@/lib/documents/fixture-v1";

export interface ContentSection {
  readonly id: string;
  readonly title: string;
  readonly pageNumber: number;
  readonly text: string;
}

export interface DocumentContent {
  readonly documentId: string;
  readonly title: string;
  readonly documentType: "service-agreement" | "nda" | "statement-of-work";
  readonly sections: readonly ContentSection[];
}

/** Fixture identifiers the AI layer accepts. Nothing else — yet. */
const KNOWN_FIXTURES: readonly string[] = [FIXTURE_ID, FIXTURE_V1_ID];

/** Builds AI-ready content for a known fixture. Throws for unknown ids. */
export function contentFromFixture(
  documentId: string,
  title: string,
  fixtureId: string,
): DocumentContent {
  if (!KNOWN_FIXTURES.includes(fixtureId)) {
    throw new Error(`Unknown fixture: ${fixtureId}.`);
  }
  const sections =
    fixtureId === FIXTURE_V1_ID ? getFixtureV1Sections(documentId) : getFixtureSections(documentId);
  return {
    documentId,
    title,
    documentType: "service-agreement",
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      pageNumber: section.pageNumber,
      text: section.paragraphs.join("\n"),
    })),
  };
}

/** Renders content as delimited, section-addressable prompt text. */
export function contentToPromptText(content: DocumentContent): string {
  return content.sections
    .map(
      (section) =>
        `[SECTION id="${section.id}" title="${section.title}" page=${section.pageNumber}]\n${section.text}`,
    )
    .join("\n\n");
}
