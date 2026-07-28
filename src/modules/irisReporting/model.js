const mongoose = require("mongoose");

const IRIS_STATUS = ["planned", "in_progress", "completed", "blocked"];

const evidenceFileSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    url: { type: String, required: true },
    // publicId is Cloudinary's asset identifier.
    // Not required — will be empty string when using the base64 fallback
    // (i.e. when Cloudinary credentials are not configured in .env).
    publicId: { type: String, default: "" },
    uploadedBy: { type: String, default: "System" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const irisRequirementSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    source: { type: String, default: "Client requirement", trim: true },
    category: { type: String, default: "Reporting", trim: true },
    obligationType: { type: String, default: "reporting", trim: true },
    status: { type: String, enum: IRIS_STATUS, default: "planned" },
    dueDate: { type: Date, default: null },
    owner: { type: String, default: "Operations", trim: true },
    reportType: { type: String, default: "Statutory report", trim: true },
    materiality: { type: String, default: "Standard", trim: true },
    approvalRequired: { type: Boolean, default: false },
    evidenceRequired: [{ type: String, trim: true }],
    evidenceFiles: [evidenceFileSchema],
    details: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

const IrisReportingRequirement = mongoose.model(
  "IrisReportingRequirement",
  irisRequirementSchema,
);

module.exports = {
  IrisReportingRequirement,
  IRIS_STATUS,
};
