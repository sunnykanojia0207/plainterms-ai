/**
 * DEMO FIXTURE — synthetic content for development and demos.
 * Original text written for PlainTerms. NOT a real contract, NOT legal advice,
 * NOT affiliated with any real company or person. Names are fictional.
 *
 * Every successful upload in this milestone resolves to this fixture so the
 * journey is fully deterministic. The real document pipeline (parsing,
 * extraction) will replace `fixtureId` resolution in a later milestone —
 * UI code must depend on domain types + the document store, never on this
 * module's shape beyond `getFixtureSections()`.
 */
import type { DocumentParty, DocumentSection } from "@/lib/domain/types";

export const FIXTURE_ID = "sample-service-agreement";

export const FIXTURE_TITLE = "Independent Contractor Services Agreement";

export const FIXTURE_PARTIES: readonly DocumentParty[] = [
  { name: "Maya Chen", role: "Contractor" },
  { name: "Brightline Studio LLC", role: "Client" },
];

export const FIXTURE_EFFECTIVE_DATE = "2026-10-01";

export interface FixtureSection extends DocumentSection {
  readonly paragraphs: readonly string[];
}

export const FIXTURE_SECTIONS: readonly FixtureSection[] = [
  {
    id: "sec-parties",
    documentId: "",
    title: "1. Parties and Purpose",
    level: 1,
    pageNumber: 1,
    clauseIds: [],
    paragraphs: [
      "This Independent Contractor Services Agreement (the “Agreement”) is entered into as of October 1, 2026, by and between Brightline Studio LLC (the “Client”) and Maya Chen (the “Contractor”).",
      "The Client wishes to engage the Contractor to provide brand design services, and the Contractor wishes to accept the engagement, on the terms set out in this Agreement and its exhibits.",
    ],
  },
  {
    id: "sec-services",
    documentId: "",
    title: "2. Services and Deliverables",
    level: 1,
    pageNumber: 1,
    clauseIds: [],
    paragraphs: [
      "The Contractor will provide the design services described in Exhibit A, including a logo suite, color palette, typography recommendations, and a brand usage guide.",
      "Deliverables are due on the milestone dates listed in Exhibit A. Source files will be delivered in the Contractor's working formats alongside exported production files.",
      "The Client will provide timely feedback within five business days of each delivery. Delays in feedback extend milestone dates by an equal period.",
    ],
  },
  {
    id: "sec-payment",
    documentId: "",
    title: "3. Payment Terms",
    level: 1,
    pageNumber: 2,
    clauseIds: [],
    paragraphs: [
      "The Client will pay the Contractor a fixed fee of $4,500 per month, invoiced on the first business day of each month.",
      "Invoices are payable net thirty (30) days from receipt. This Agreement does not provide for a late-payment fee or interest on overdue amounts.",
      "The Contractor is responsible for all taxes on amounts paid under this Agreement. No amounts will be withheld by the Client.",
    ],
  },
  {
    id: "sec-term",
    documentId: "",
    title: "4. Term",
    level: 1,
    pageNumber: 2,
    clauseIds: [],
    paragraphs: [
      "This Agreement begins on the effective date and continues for three months, ending on December 31, 2026, unless terminated earlier under Section 5.",
      "The parties may extend the term by written agreement signed by both parties before the end date.",
    ],
  },
  {
    id: "sec-termination",
    documentId: "",
    title: "5. Termination",
    level: 1,
    pageNumber: 3,
    clauseIds: [],
    paragraphs: [
      "Either party may terminate this Agreement for convenience with thirty (30) days written notice to the other party.",
      "Either party may terminate immediately if the other party materially breaches this Agreement and fails to cure within ten (10) days of written notice.",
      "On termination, the Client will pay for all work completed through the effective date of termination. This Agreement does not provide the Contractor a right to suspend work for late payment.",
    ],
  },
  {
    id: "sec-confidentiality",
    documentId: "",
    title: "6. Confidentiality",
    level: 1,
    pageNumber: 3,
    clauseIds: [],
    paragraphs: [
      "Each party will keep confidential all non-public information received from the other party in connection with this Agreement.",
      "Confidentiality obligations survive termination for a period of two (2) years. Information that becomes public through no fault of the receiving party is excluded.",
    ],
  },
  {
    id: "sec-ip",
    documentId: "",
    title: "7. Intellectual Property",
    level: 1,
    pageNumber: 4,
    clauseIds: [],
    paragraphs: [
      "The Contractor assigns to the Client all right, title, and interest in the final deliverables on receipt of final payment in full.",
      "Until final payment, the Contractor retains ownership of all work product. The Contractor retains ownership of pre-existing methods, templates, and tools, granting the Client a non-exclusive license to use them as embedded in the deliverables.",
    ],
  },
  {
    id: "sec-restrictions",
    documentId: "",
    title: "8. Restrictive Covenants",
    level: 1,
    pageNumber: 4,
    clauseIds: [],
    paragraphs: [
      "For twelve (12) months following termination, the Contractor will not provide brand design services to direct competitors of the Client identified in Exhibit B.",
      "This section does not state a geographic limitation. The Contractor should confirm the intended scope before signing.",
    ],
  },
  {
    id: "sec-liability",
    documentId: "",
    title: "9. Liability and Indemnity",
    level: 1,
    pageNumber: 5,
    clauseIds: [],
    paragraphs: [
      "Neither party's total liability under this Agreement will exceed the amounts paid or payable in the three months preceding the claim.",
      "The Contractor will indemnify the Client against third-party claims arising from the Contractor's work. This indemnity is not subject to a separate cap in this Agreement.",
    ],
  },
  {
    id: "sec-disputes",
    documentId: "",
    title: "10. Dispute Resolution",
    level: 1,
    pageNumber: 5,
    clauseIds: [],
    paragraphs: [
      "The parties will first attempt to resolve disputes through good-faith mediation within thirty (30) days of written notice.",
      "Unresolved disputes will be settled by binding arbitration under the rules of the American Arbitration Association. Each party bears its own costs unless the arbitrator decides otherwise.",
    ],
  },
  {
    id: "sec-signatures",
    documentId: "",
    title: "11. Signatures",
    level: 1,
    pageNumber: 6,
    clauseIds: [],
    paragraphs: [
      "IN WITNESS WHEREOF, the parties have executed this Agreement as of the effective date.",
      "Brightline Studio LLC — Signature: ______________________ Date: __________",
      "Maya Chen — Signature: ______________________ Date: __________",
    ],
  },
];

export const FIXTURE_PAGE_COUNT = 6;

export function getFixtureSections(documentId: string): readonly FixtureSection[] {
  return FIXTURE_SECTIONS.map((section) => ({ ...section, documentId }));
}
