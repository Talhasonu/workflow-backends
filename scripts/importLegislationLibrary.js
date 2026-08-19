#!/usr/bin/env node
/**
 * IRIS Legislation Library Import Script
 * ----------------------------------------
 * Reads the source files provided by the client and outputs a refreshed
 * legislationLibrary.js in the exact shape the IRIS module already uses.
 *
 * Sources:
 *   1. Compliance-Attestation-Checklist-2025-26 (Excel)
 *      Sheet: "Standing Directions Checklist"
 *      Columns expected: Direction reference, Requirement text
 *
 *   2. Financial Management Act 1994 (docx) — FMA sections
 *
 *   3. Standing-Directions-2018 (docx) — Direction headings (as cross-check)
 *
 * Output:
 *   src/modules/irisReporting/legislationLibrary.generated.js
 *   (review this file, then overwrite legislationLibrary.js when satisfied)
 *
 * Usage:
 *   node scripts/importLegislationLibrary.js
 *
 * Re-runnable — when the client sends updated files, replace the source files
 * in D:\Workflow project\ and re-run this script.
 */

"use strict";

const path   = require("path");
const fs     = require("fs");
const XLSX   = require("xlsx");
const mammoth = require("mammoth");

// ─── Source file paths ────────────────────────────────────────────────────────
// Place the three source files in the `legislation-sources/` folder at the
// root of the backend repo (same level as package.json).
// That folder is gitignored — checked in locally only, not committed.
//
// Expected layout:
//   workflow-backend/
//     legislation-sources/
//       Compliance-Attestation-Checklist-2025-26-(Updated-January-2026).xlsx
//       94-18a069.docx
//       Standing-Directions-2018-(updated-September-2025).docx
//     scripts/
//       importLegislationLibrary.js   ← this file
//
// When the client sends updated files, replace the files in legislation-sources/
// and re-run: npm run import:legislation

const SOURCES_DIR = path.resolve(__dirname, "../legislation-sources");

const EXCEL_PATH = path.join(SOURCES_DIR,
  "Compliance-Attestation-Checklist-2025-26-(Updated-January-2026).xlsx");

const FMA_DOCX_PATH = path.join(SOURCES_DIR, "94-18a069.docx");

const SD_DOCX_PATH  = path.join(SOURCES_DIR,
  "Standing-Directions-2018-(updated-September-2025).docx");

// ─── Output path ─────────────────────────────────────────────────────────────
const OUTPUT_PATH = path.resolve(__dirname,
  "../src/modules/irisReporting/legislationLibrary.generated.js");

// ─── Materiality heuristic ────────────────────────────────────────────────────
// Default is Standard / compliance_review.
// Bump to High if the text mentions Accountable Officer, CFO, Secretary,
// financial statements, audit, or Parliament.
const HIGH_KEYWORDS = [
  "accountable officer", "cfo", "chief finance", "secretary",
  "financial statement", "annual report", "audit", "parliament",
  "appropriation", "borrowing", "investment", "ministerial",
];

function inferMateriality(text) {
  const lower = (text || "").toLowerCase();
  return HIGH_KEYWORDS.some((kw) => lower.includes(kw)) ? "High" : "Standard";
}

function inferObligationType(text) {
  const lower = (text || "").toLowerCase();
  if (lower.includes("financial statement") || lower.includes("annual report")) return "statutory_reporting";
  if (lower.includes("audit")) return "audit_evidence";
  return "compliance_review";
}

// ─── 1. Parse Standing Directions Excel ───────────────────────────────────────
function parseExcel(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARN] Excel file not found: ${filePath}`);
    return [];
  }

  console.log(`[INFO] Reading Excel: ${filePath}`);
  const wb = XLSX.readFile(filePath);

  // The SD checklist is on "Standing Directions Checklist" sheet
  const sheetName = wb.SheetNames.find(
    (n) => n.toLowerCase().includes("standing direction")
  ) || wb.SheetNames.find(
    (n) => n.toLowerCase().includes("checklist")
  ) || wb.SheetNames[0];

  console.log(`[INFO] Using sheet: "${sheetName}"`);
  const ws = wb.Sheets[sheetName];

  // Read raw rows (header: 1 means first array index = array of values, not header map)
  // Row 0 = title row, Row 1 = blank, Row 2 = column headers, Row 3+ = data
  const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  // Find the header row — the row that contains "Direction" or "Reference" in column 0
  let headerRowIdx = 2; // default
  for (let i = 0; i < Math.min(rawRows.length, 6); i++) {
    const cell = String(rawRows[i][0] || "").toLowerCase();
    if (cell.includes("direction") && cell.includes("reference") || cell.includes("instruction reference")) {
      headerRowIdx = i;
      break;
    }
  }

  // Data starts on the row after headers
  const dataRows = rawRows.slice(headerRowIdx + 1);
  console.log(`[INFO] Header row: ${headerRowIdx}, data rows: ${dataRows.length}`);

  // Column 0 = Direction reference group (e.g. "Direction 2.1 Overview of roles")
  // Column 1 = Sub-clause text (e.g. "Direction 2.1(a) — ...")
  const seen = new Map(); // normRef → title

  for (const row of dataRows) {
    const col0 = String(row[0] || "").trim();
    const col1 = String(row[1] || "").trim();

    if (!col0 && !col1) continue;

    // Use col0 (group heading) as the Direction-level reference
    // It looks like "Direction 2.1 Overview of roles" or "Direction 4.2.1 ..."
    const normRef = normaliseSDRef(col0);
    if (!normRef) continue;

    if (!seen.has(normRef)) {
      // Extract title from col0 (strip the "Direction X.X" prefix)
      const titleFromCol0 = col0
        .replace(/^direction\s+[\d.]+\s*/i, "")
        .trim();

      // Fallback to first sub-clause text if col0 title is empty
      const title = titleFromCol0 || cleanTitle(col1) || `Direction ${normRef}`;
      seen.set(normRef, title);
    }
  }

  const entries = [];
  for (const [ref, title] of seen.entries()) {
    entries.push({
      ref,
      title,
      source:             "Standing Directions 2018 (Vic)",
      category:           "Policy",
      obligationType:     inferObligationType(title),
      defaultMateriality: inferMateriality(title),
    });
  }

  console.log(`[INFO] Excel: ${entries.length} unique Direction references extracted`);
  return entries;
}

/** Normalise a raw Direction reference to "SD X.X.X" format */
function normaliseSDRef(raw) {
  // Strip "Direction" or "direction" prefix
  let s = raw.replace(/^direction\s+/i, "").trim();

  // Extract just the leading number (e.g. "2.1 Overview of roles" → "2.1")
  const numMatch = s.match(/^([\d]+(?:\.[\d]+)*)/);
  if (!numMatch) return null;

  const num = numMatch[1];
  // Reject pure integers that look like years or table row numbers
  if (/^\d{4}$/.test(num)) return null;

  return `SD ${num}`;
}

/** Clean a requirement text into a short title (max 80 chars) */
function cleanTitle(text) {
  if (!text) return "";
  // Take first sentence or first 80 chars
  const sentence = text.split(/[.;]/)[0].trim();
  return sentence.length > 80 ? sentence.slice(0, 77) + "…" : sentence;
}

// ─── 2. Parse FMA docx ────────────────────────────────────────────────────────
async function parseFMADocx(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARN] FMA docx not found: ${filePath}`);
    return [];
  }

  console.log(`[INFO] Reading FMA docx: ${filePath}`);
  const result = await mammoth.extractRawText({ path: filePath });
  const text   = result.value;

  // Match patterns like "51  Preparation of annual financial statements"
  // or "s. 51   Annual financial statements"
  // or plain "51." at line start
  const sectionPattern = /^s(?:ection)?\.?\s*(\d+[A-Z]?)\s+(.{5,100})/gim;
  const entries = [];
  const seen    = new Set();

  let match;
  while ((match = sectionPattern.exec(text)) !== null) {
    const sectionNum = match[1].trim();
    const rawTitle   = match[2].trim().replace(/\s+/g, " ");

    // Skip definitions, commencement, transitional, and administrative sections
    const skip = /^(definition|commence|transitional|repeal|amend|schedule|part\s+\d|division|interpret)/i;
    if (skip.test(rawTitle)) continue;

    const ref = `FMA s.${sectionNum}`;
    if (seen.has(ref)) continue;
    seen.add(ref);

    const title = cleanTitle(rawTitle);
    entries.push({
      ref,
      title,
      source:             "Financial Management Act 1994 (Vic)",
      category:           "Legislation",
      obligationType:     inferObligationType(title),
      defaultMateriality: inferMateriality(title),
    });
  }

  console.log(`[INFO] FMA docx: ${entries.length} sections extracted`);
  return entries;
}

// ─── 3. Existing handcrafted entries (AASB, Privacy, Audit, TD) ───────────────
// Keep these as-is — they're not in the Excel/docx sources
function getHandcraftedEntries() {
  return require("../src/modules/irisReporting/legislationLibrary")
    .filter((e) =>
      !e.source.includes("Standing Directions") &&
      !e.source.includes("Financial Management Act")
    );
}

// ─── 4. Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== IRIS Legislation Library Import ===\n");

  const [sdEntries, fmaEntries] = await Promise.all([
    Promise.resolve(parseExcel(EXCEL_PATH)),
    parseFMADocx(FMA_DOCX_PATH),
  ]);

  const handcrafted = getHandcraftedEntries();

  // Merge: SD from Excel → FMA from docx → everything else handcrafted
  // Deduplicate by ref (SD entries take precedence over any existing handcrafted SD entries)
  const all = new Map();

  // Load handcrafted first (lowest priority)
  for (const e of handcrafted) all.set(e.ref, e);

  // FMA docx entries override
  for (const e of fmaEntries) all.set(e.ref, e);

  // SD Excel entries override (highest priority — primary source per client brief)
  for (const e of sdEntries) all.set(e.ref, e);

  // Sort: SD entries first, then FMA, then others
  const sorted = [...all.values()].sort((a, b) => {
    const order = ["Standing Directions", "Financial Management", "Treasurer", "Audit Act",
                   "AASB", "Privacy", "GDPR"];
    const ai = order.findIndex((o) => a.source.includes(o));
    const bi = order.findIndex((o) => b.source.includes(o));
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.ref.localeCompare(b.ref, undefined, { numeric: true });
  });

  // ── Generate output file ────────────────────────────────────────────────────
  const lines = [
    `/**`,
    ` * IRIS Legislation Reference Library — AUTO-GENERATED`,
    ` * Generated: ${new Date().toISOString()}`,
    ` * Sources:`,
    ` *   - ${path.basename(EXCEL_PATH)}`,
    ` *   - ${path.basename(FMA_DOCX_PATH)}`,
    ` *   - ${path.basename(SD_DOCX_PATH)}`,
    ` *   - Handcrafted entries (AASB, Privacy, TD, Audit Act)`,
    ` *`,
    ` * Shape: { ref, title, source, category, obligationType, defaultMateriality }`,
    ` *`,
    ` * To regenerate: node scripts/importLegislationLibrary.js`,
    ` */`,
    ``,
    `"use strict";`,
    ``,
    `const legislationLibrary = [`,
  ];

  let currentSource = null;
  for (const e of sorted) {
    if (e.source !== currentSource) {
      currentSource = e.source;
      lines.push(`  // ── ${e.source} ${"─".repeat(Math.max(0, 60 - e.source.length))}`);
    }
    lines.push(
      `  { ref: ${JSON.stringify(e.ref).padEnd(24)}, ` +
      `title: ${JSON.stringify(e.title).padEnd(70)}, ` +
      `source: ${JSON.stringify(e.source).padEnd(40)}, ` +
      `category: ${JSON.stringify(e.category).padEnd(24)}, ` +
      `obligationType: ${JSON.stringify(e.obligationType).padEnd(26)}, ` +
      `defaultMateriality: ${JSON.stringify(e.defaultMateriality)} },`
    );
  }

  lines.push(`];`);
  lines.push(``);
  lines.push(`module.exports = legislationLibrary;`);
  lines.push(``);

  const output = lines.join("\n");
  fs.writeFileSync(OUTPUT_PATH, output, "utf8");

  console.log(`\n✅ Generated ${sorted.length} entries → ${OUTPUT_PATH}`);
  console.log(`\nBreakdown:`);

  const bySource = {};
  for (const e of sorted) {
    bySource[e.source] = (bySource[e.source] || 0) + 1;
  }
  for (const [src, count] of Object.entries(bySource)) {
    console.log(`   ${count.toString().padStart(3)} entries  ${src}`);
  }

  console.log(`\nNext steps:`);
  console.log(`  1. Review: ${OUTPUT_PATH}`);
  console.log(`  2. If happy: copy to legislationLibrary.js`);
  console.log(`     cp src/modules/irisReporting/legislationLibrary.generated.js \\`);
  console.log(`        src/modules/irisReporting/legislationLibrary.js`);
  console.log(`  3. Run seed script to push to MongoDB:`);
  console.log(`     node scripts/seedLegislationLibrary.js`);
}

main().catch((err) => {
  console.error("[ERROR]", err.message);
  process.exit(1);
});
