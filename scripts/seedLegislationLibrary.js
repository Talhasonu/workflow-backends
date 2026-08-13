#!/usr/bin/env node
/**
 * Seed IRIS Legislation Library into MongoDB
 * --------------------------------------------
 * Reads legislationLibrary.js (or .generated.js if it exists and is newer)
 * and upserts every entry into the MongoDB LegislationLibrary collection.
 *
 * Upsert on `ref` — safe to re-run without creating duplicates.
 * Existing entries are updated in-place; new entries are added.
 * No entries are deleted — archive manually if a direction is removed.
 *
 * Usage:
 *   node scripts/seedLegislationLibrary.js
 *   node scripts/seedLegislationLibrary.js --source generated   (use .generated.js)
 *   node scripts/seedLegislationLibrary.js --dry-run            (print without saving)
 */

"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const path     = require("path");
const fs       = require("fs");

const { LegislationLibrary } = require("../src/modules/irisReporting/legislationLibraryModel");

const MONGO_URL = process.env.MONGODB_URL;
if (!MONGO_URL) {
  console.error("[ERROR] MONGODB_URL not set in .env");
  process.exit(1);
}

const args       = process.argv.slice(2);
const useGenerated = args.includes("--source") && args[args.indexOf("--source") + 1] === "generated";
const dryRun     = args.includes("--dry-run");

async function main() {
  // Choose source file
  const generatedPath = path.resolve(__dirname,
    "../src/modules/irisReporting/legislationLibrary.generated.js");
  const staticPath    = path.resolve(__dirname,
    "../src/modules/irisReporting/legislationLibrary.js");

  let sourcePath = staticPath;
  if (useGenerated && fs.existsSync(generatedPath)) {
    sourcePath = generatedPath;
  } else if (fs.existsSync(generatedPath)) {
    const genStat    = fs.statSync(generatedPath);
    const staticStat = fs.statSync(staticPath);
    // Auto-use generated if it's newer
    if (genStat.mtimeMs > staticStat.mtimeMs) {
      sourcePath = generatedPath;
      console.log("[INFO] Auto-selecting .generated.js (it is newer)");
    }
  }

  const library = require(sourcePath);
  console.log(`[INFO] Source: ${path.basename(sourcePath)}`);
  console.log(`[INFO] Entries to seed: ${library.length}`);

  if (dryRun) {
    console.log("\n[DRY RUN] First 5 entries:");
    library.slice(0, 5).forEach((e) => {
      console.log(`  ${e.ref.padEnd(20)} ${e.title.slice(0, 60)}`);
    });
    console.log(`\n[DRY RUN] Would upsert ${library.length} entries. No changes made.`);
    return;
  }

  console.log(`\n[INFO] Connecting to MongoDB...`);
  await mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log(`[INFO] Connected`);

  let inserted = 0, updated = 0, errors = 0;

  for (const entry of library) {
    try {
      const result = await LegislationLibrary.findOneAndUpdate(
        { ref: entry.ref },
        {
          $set: {
            title:              entry.title,
            source:             entry.source,
            category:           entry.category,
            obligationType:     entry.obligationType,
            defaultMateriality: entry.defaultMateriality,
            sourceVersion:      path.basename(sourcePath),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Mongoose doesn't tell us insert vs update directly on findOneAndUpdate,
      // so check if updatedAt ~ createdAt (newly inserted)
      const isNew = result.createdAt &&
        Math.abs(result.updatedAt - result.createdAt) < 1000;

      if (isNew) inserted++;
      else updated++;

    } catch (err) {
      console.error(`[ERROR] Failed to upsert ${entry.ref}: ${err.message}`);
      errors++;
    }
  }

  await mongoose.disconnect();

  console.log(`\n✅ Seed complete:`);
  console.log(`   ${inserted} inserted`);
  console.log(`   ${updated} updated`);
  if (errors) console.log(`   ${errors} errors (check logs above)`);
  console.log(`\nThe GET /iris-reporting/legislation-library endpoint now reads from MongoDB.`);
}

main().catch((err) => {
  console.error("[FATAL]", err.message);
  process.exit(1);
});
