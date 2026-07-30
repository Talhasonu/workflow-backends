const mongoose  = require("mongoose");
const httpStatus = require("http-status");
const ApiError   = require("../../utils/ApiError");
const { IrisReportingRequirement } = require("./model");
const defaultRequirements = require("./defaultData");
const { buildIrisReportingSummary } = require("./summary");

// ─── Cloudinary setup ─────────────────────────────────────────────────────────
const cloudinary = require("cloudinary").v2;
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ url: process.env.CLOUDINARY_URL });
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
    api_key:     process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRET,
  });
}

const isCloudinaryReady = () => !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalizeDueDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const serializeRequirement = (item) => ({
  ...item,
  dueDate:    item.dueDate    ? new Date(item.dueDate).toISOString()    : null,
  approvedAt: item.approvedAt ? new Date(item.approvedAt).toISOString() : null,
});

// ─── Overview ─────────────────────────────────────────────────────────────────
const getOverview = async ({ workspaceId }) => {
  const existing = await IrisReportingRequirement.find({ workspaceId }).lean();

  if (existing.length) {
    const requirements = existing.map(serializeRequirement);
    return { requirements, summary: buildIrisReportingSummary(requirements) };
  }

  // Seed default data on first load
  const seeded = await IrisReportingRequirement.insertMany(
    defaultRequirements.map((item) => ({
      workspaceId,
      ...item,
      dueDate: normalizeDueDate(item.dueDate),
      // Give each approval step a proper ObjectId
      approvalSteps: (item.approvalSteps || []).map((step) => ({
        ...step,
        _id: new mongoose.Types.ObjectId(),
      })),
    }))
  );

  const requirements = seeded.map((item) => serializeRequirement(item.toObject()));
  return { requirements, summary: buildIrisReportingSummary(requirements) };
};

// ─── Report Pack ──────────────────────────────────────────────────────────────
const getReportPack = async ({ workspaceId }) => {
  const overview = await getOverview({ workspaceId });
  return {
    generatedAt:     new Date().toISOString(),
    summary:         overview.summary,
    requirements:    overview.requirements,
    recommendation:  "Maintain a single evidence register per obligation and link each item to the appropriate report template before sign-off.",
  };
};

// ─── Create Requirement ───────────────────────────────────────────────────────
const createRequirement = async ({ workspaceId, payload }) => {
  const requirement = await IrisReportingRequirement.create({
    workspaceId,
    title:              payload.title,
    source:             payload.source             || "Client requirement",
    legislationRef:     payload.legislationRef     || "",
    category:           payload.category           || "Reporting",
    obligationType:     payload.obligationType     || "reporting",
    status:             payload.status             || "planned",
    dueDate:            normalizeDueDate(payload.dueDate),
    owner:              payload.owner              || "Operations",
    reportType:         payload.reportType         || "Statutory report",
    materiality:        payload.materiality        || "Standard",
    approvalRequired:   Boolean(payload.approvalRequired),
    evidenceRequired:   Array.isArray(payload.evidenceRequired) ? payload.evidenceRequired.filter(Boolean) : [],
    details:            payload.details            || "",
    legislationVersion: payload.legislationVersion || "",
    ruleVersion:        payload.ruleVersion        || "1.0",
    reportingPeriod:    payload.reportingPeriod    || "",
    approvalSteps: (Array.isArray(payload.approvalSteps) ? payload.approvalSteps : []).map((step) => ({
      ...step,
      _id:    new mongoose.Types.ObjectId(),
      status: "pending",
    })),
  });
  return serializeRequirement(requirement.toObject());
};

// ─── Update Requirement ───────────────────────────────────────────────────────
const updateRequirement = async ({ workspaceId, requirementId, payload }) => {
  const req = await IrisReportingRequirement.findOne({ _id: requirementId, workspaceId });
  if (!req) throw new ApiError(httpStatus.NOT_FOUND, "Reporting requirement not found");

  const fields = [
    "title", "source", "legislationRef", "category", "obligationType",
    "status", "owner", "reportType", "materiality", "details",
    "legislationVersion", "ruleVersion", "reportingPeriod",
  ];
  fields.forEach((f) => { if (payload[f] !== undefined) req[f] = payload[f]; });

  if (payload.dueDate          !== undefined) req.dueDate          = normalizeDueDate(payload.dueDate);
  if (payload.approvalRequired !== undefined) req.approvalRequired = Boolean(payload.approvalRequired);
  if (payload.evidenceRequired !== undefined) req.evidenceRequired = Array.isArray(payload.evidenceRequired) ? payload.evidenceRequired.filter(Boolean) : [];

  // Replace approval steps if provided
  if (Array.isArray(payload.approvalSteps)) {
    req.approvalSteps = payload.approvalSteps.map((step) => ({
      ...step,
      _id: step._id ? new mongoose.Types.ObjectId(step._id) : new mongoose.Types.ObjectId(),
    }));
  }

  await req.save();
  return serializeRequirement(req.toObject());
};

// ─── Delete Requirement ───────────────────────────────────────────────────────
const deleteRequirement = async ({ workspaceId, requirementId }) => {
  const req = await IrisReportingRequirement.findOneAndDelete({ _id: requirementId, workspaceId });
  if (!req) throw new ApiError(httpStatus.NOT_FOUND, "Reporting requirement not found");
  return { id: requirementId };
};

// ─── Approval Step decision ───────────────────────────────────────────────────
const decideApprovalStep = async ({ workspaceId, requirementId, stepId, decision, notes, decidedBy }) => {
  if (!["approved", "rejected"].includes(decision)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "decision must be 'approved' or 'rejected'");
  }

  const req = await IrisReportingRequirement.findOne({ _id: requirementId, workspaceId });
  if (!req) throw new ApiError(httpStatus.NOT_FOUND, "Reporting requirement not found");

  const step = req.approvalSteps.id(stepId);
  if (!step) throw new ApiError(httpStatus.NOT_FOUND, "Approval step not found");

  step.status     = decision;
  step.decidedAt  = new Date();
  step.decidedBy  = decidedBy || "System";
  step.notes      = notes     || "";

  await req.save(); // pre-save hook recalculates req.approvalStatus
  return serializeRequirement(req.toObject());
};

// ─── Add Comment ─────────────────────────────────────────────────────────────
const addComment = async ({ workspaceId, requirementId, text, authorId, authorName }) => {
  const req = await IrisReportingRequirement.findOne({ _id: requirementId, workspaceId });
  if (!req) throw new ApiError(httpStatus.NOT_FOUND, "Reporting requirement not found");

  const commentId = new mongoose.Types.ObjectId();
  req.comments.push({
    _id:        commentId,
    text:       text.trim(),
    authorId:   authorId   || "system",
    authorName: authorName || "System",
    createdAt:  new Date(),
  });

  await req.save();
  const added = req.comments.id(commentId);
  return { _id: added._id, text: added.text, authorName: added.authorName, createdAt: added.createdAt };
};

// ─── Delete Comment ───────────────────────────────────────────────────────────
const deleteComment = async ({ workspaceId, requirementId, commentId }) => {
  const req = await IrisReportingRequirement.findOne({ _id: requirementId, workspaceId });
  if (!req) throw new ApiError(httpStatus.NOT_FOUND, "Reporting requirement not found");

  const comment = req.comments.id(commentId);
  if (!comment) throw new ApiError(httpStatus.NOT_FOUND, "Comment not found");

  comment.deleteOne();
  await req.save();
  return { commentId };
};

// ─── Upload Evidence File ─────────────────────────────────────────────────────
const uploadEvidenceFile = async ({ workspaceId, requirementId, fileBuffer, fileName, fileType }) => {
  const req = await IrisReportingRequirement.findOne({ _id: requirementId, workspaceId });
  if (!req) throw new ApiError(httpStatus.NOT_FOUND, "Reporting requirement not found");

  const fileSize = fileBuffer.length;
  let fileUrl, publicId = null;

  if (isCloudinaryReady()) {
    const dataUri    = `data:${fileType};base64,${fileBuffer.toString("base64")}`;
    const result     = await cloudinary.uploader.upload(dataUri, {
      folder:        process.env.CLOUDINARY_FOLDER || "iris_reporting",
      resource_type: "auto",
    });
    fileUrl  = result.secure_url || result.url;
    publicId = result.public_id;
  } else {
    console.warn("[IRIS] Cloudinary not configured — storing file as base64 (dev fallback)");
    fileUrl = `data:${fileType};base64,${fileBuffer.toString("base64")}`;
  }

  const fileId = new mongoose.Types.ObjectId();
  req.evidenceFiles.push({
    _id:        fileId,
    fileName,
    fileType,
    fileSize,
    url:        fileUrl,
    publicId:   publicId || "",
    uploadedBy: "System",
    uploadedAt: new Date(),
  });

  await req.save();

  return {
    fileId:     fileId.toString(),
    fileName, fileType, fileSize,
    url:        fileUrl,
    publicId:   publicId || "",
    uploadedAt: new Date().toISOString(),
  };
};

// ─── Get Evidence File ────────────────────────────────────────────────────────
const getEvidenceFile = async ({ workspaceId, requirementId, fileId }) => {
  const req = await IrisReportingRequirement.findOne(
    { _id: requirementId, workspaceId, "evidenceFiles._id": fileId },
    { "evidenceFiles.$": 1 }
  );
  if (!req?.evidenceFiles?.length) {
    throw new ApiError(httpStatus.NOT_FOUND, "Evidence file not found");
  }
  const file = req.evidenceFiles[0];
  return { fileName: file.fileName, fileType: file.fileType, url: file.url, publicId: file.publicId };
};

// ─── Delete Evidence File ─────────────────────────────────────────────────────
const deleteEvidenceFile = async ({ workspaceId, requirementId, fileId }) => {
  const req = await IrisReportingRequirement.findOne({ _id: requirementId, workspaceId });
  if (!req) throw new ApiError(httpStatus.NOT_FOUND, "Reporting requirement not found");

  const file = req.evidenceFiles.find((f) => f._id.toString() === fileId);
  if (file?.publicId && isCloudinaryReady()) {
    try {
      await cloudinary.uploader.destroy(file.publicId, { resource_type: "auto" });
    } catch (err) {
      console.warn("[IRIS] Cloudinary delete error:", err.message);
    }
  }

  req.evidenceFiles = req.evidenceFiles.filter((f) => f._id.toString() !== fileId);
  await req.save();
  return { fileId };
};

module.exports = {
  getOverview,
  getReportPack,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  decideApprovalStep,
  addComment,
  deleteComment,
  uploadEvidenceFile,
  getEvidenceFile,
  deleteEvidenceFile,
};
