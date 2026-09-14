/**
 * Generates committed test fixtures: a real (if tiny) PDF, DOCX, and TXT
 * service agreement with distinctive markers the test suite asserts on.
 * Run: node scripts/generate-test-fixtures.mjs
 *
 * All content is original synthetic text for parser testing — not legal
 * advice, not a real contract.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "tests", "fixtures");
mkdirSync(root, { recursive: true });

const TITLE = "Test Services Agreement";
const MARKER = "ZXQ-TEST-7741";

const SECTIONS = [
  {
    heading: "1. Parties and Purpose",
    body: [
      `This Test Services Agreement (${MARKER}) is between Acme Client LLC and Test Contractor.`,
      "The Client engages the Contractor for test design services described here.",
    ],
  },
  {
    heading: "2. Payment Terms",
    body: [
      "The Client will pay a fixed test fee of $9,999 per month, invoiced monthly.",
      "Invoices are payable net seven (7) days from receipt under this test agreement.",
    ],
  },
  {
    heading: "3. Termination",
    body: ["Either party may terminate this test agreement with five (5) days written notice."],
  },
];

async function writePdf() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([612, 792]);
  let y = 750;
  const draw = (text, size, useBold, indent = 72) => {
    if (y < 80) {
      page = pdf.addPage([612, 792]);
      y = 750;
    }
    page.drawText(text.slice(0, 95), {
      x: indent,
      y,
      size,
      font: useBold ? bold : font,
      color: rgb(0, 0, 0),
    });
    y -= size + 8;
  };
  draw(TITLE, 18, true);
  y -= 8;
  for (const section of SECTIONS) {
    draw(section.heading, 13, true);
    for (const paragraph of section.body) {
      draw(paragraph, 11, false);
    }
    y -= 6;
  }
  const bytes = await pdf.save();
  writeFileSync(join(root, "sample-agreement.pdf"), bytes);
}

async function writeDocx() {
  const children = [new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(TITLE)] })];
  for (const section of SECTIONS) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(section.heading)] }),
    );
    for (const paragraph of section.body) {
      children.push(new Paragraph({ children: [new TextRun(paragraph)] }));
    }
  }
  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  writeFileSync(join(root, "sample-agreement.docx"), buffer);
}

function writeTxt() {
  const lines = [TITLE, ""];
  for (const section of SECTIONS) {
    lines.push(section.heading, "", ...section.body, "");
  }
  writeFileSync(join(root, "sample-agreement.txt"), lines.join("\n"));
}

await writePdf();
await writeDocx();
writeTxt();
