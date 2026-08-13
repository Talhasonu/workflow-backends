"use strict";
/**
 * LegislationLibrary — MongoDB model
 * ------------------------------------
 * Stores the IRIS legislation reference library in the database.
 * This replaces the static legislationLibrary.js file approach so that
 * future legislation updates are configuration changes, not code deploys.
 *
 * The GET /iris-reporting/legislation-library endpoint reads from here.
 * The seed script (scripts/seedLegislationLibrary.js) populates this collection.
 */

const mongoose = require("mongoose");

const legislationLibrarySchema = new mongoose.Schema(
  {
    ref:                { type: String, required: true, trim: true, unique: true },
    title:              { type: String, required: true, trim: true },
    source:             { type: String, required: true, trim: true },
    category:           { type: String, required: true, trim: true, default: "Policy" },
    obligationType:     { type: String, required: true, trim: true, default: "compliance_review" },
    defaultMateriality: { type: String, required: true, trim: true, default: "Standard" },
    // Which file version this entry came from — useful for tracking updates
    sourceVersion:      { type: String, default: "" },
    // Soft-delete: archived entries won't appear in the dropdown
    archived:           { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "legislationlibrary",
  }
);

// Index for fast lookup by source (used when filtering by legislation type)
legislationLibrarySchema.index({ source: 1 });
legislationLibrarySchema.index({ archived: 1 });

const LegislationLibrary = mongoose.model("LegislationLibrary", legislationLibrarySchema);

module.exports = { LegislationLibrary };
