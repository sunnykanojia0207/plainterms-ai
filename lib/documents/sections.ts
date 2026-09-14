/**
 * Fixture-aware section access. Review, Ready, and comparison flows resolve
 * sections through here so V1- and V2-backed documents each render their
 * own text. Unknown fixture ids fall back to V2 (current terms).
 */
import { FIXTURE_ID, getFixtureSections, type FixtureSection } from "@/lib/documents/fixture";
import { FIXTURE_V1_ID, getFixtureV1Sections } from "@/lib/documents/fixture-v1";

export function getSectionsForFixture(
  fixtureId: string,
  documentId: string,
): readonly FixtureSection[] {
  if (fixtureId === FIXTURE_V1_ID) {
    return getFixtureV1Sections(documentId);
  }
  if (fixtureId === FIXTURE_ID) {
    return getFixtureSections(documentId);
  }
  return getFixtureSections(documentId);
}

export function isKnownFixture(fixtureId: string): boolean {
  return fixtureId === FIXTURE_ID || fixtureId === FIXTURE_V1_ID;
}
