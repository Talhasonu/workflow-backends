const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError');
const { IrisReportingRequirement } = require('./model');
const defaultRequirements = require('./defaultData');
const { buildIrisReportingSummary } = require('./summary');

const normalizeDueDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getOverview = async ({ workspaceId }) => {
  const existing = await IrisReportingRequirement.find({ workspaceId }).lean();

  if (existing.length) {
    const requirements = existing.map((item) => ({
      ...item,
      dueDate: item.dueDate ? item.dueDate.toISOString() : null,
    }));

    return {
      requirements,
      summary: buildIrisReportingSummary(requirements),
    };
  }

  const seeded = await IrisReportingRequirement.insertMany(
    defaultRequirements.map((item) => ({
      workspaceId,
      ...item,
      dueDate: normalizeDueDate(item.dueDate),
    }))
  );

  const requirements = seeded.map((item) => ({
    ...item.toObject(),
    dueDate: item.dueDate ? item.dueDate.toISOString() : null,
  }));

  return {
    requirements,
    summary: buildIrisReportingSummary(requirements),
  };
};

const getReportPack = async ({ workspaceId }) => {
  const overview = await getOverview({ workspaceId });
  return {
    generatedAt: new Date().toISOString(),
    summary: overview.summary,
    requirements: overview.requirements,
    recommendation: 'Maintain a single evidence register per obligation and link each item to the appropriate report pack.',
  };
};

const createRequirement = async ({ workspaceId, payload }) => {
  const requirement = await IrisReportingRequirement.create({
    workspaceId,
    title: payload.title,
    source: payload.source || 'Client requirement',
    category: payload.category || 'Reporting',
    obligationType: payload.obligationType || 'reporting',
    status: payload.status || 'planned',
    dueDate: normalizeDueDate(payload.dueDate),
    owner: payload.owner || 'Operations',
    reportType: payload.reportType || 'Statutory report',
    materiality: payload.materiality || 'Standard',
    approvalRequired: Boolean(payload.approvalRequired),
    evidenceRequired: Array.isArray(payload.evidenceRequired) ? payload.evidenceRequired : [],
    details: payload.details || '',
  });

  return requirement.toObject();
};

const updateRequirement = async ({ workspaceId, requirementId, payload }) => {
  const requirement = await IrisReportingRequirement.findOne({ _id: requirementId, workspaceId });
  if (!requirement) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reporting requirement not found');
  }

  if (payload.title !== undefined) requirement.title = payload.title;
  if (payload.source !== undefined) requirement.source = payload.source;
  if (payload.category !== undefined) requirement.category = payload.category;
  if (payload.obligationType !== undefined) requirement.obligationType = payload.obligationType;
  if (payload.status !== undefined) requirement.status = payload.status;
  if (payload.dueDate !== undefined) requirement.dueDate = normalizeDueDate(payload.dueDate);
  if (payload.owner !== undefined) requirement.owner = payload.owner;
  if (payload.reportType !== undefined) requirement.reportType = payload.reportType;
  if (payload.materiality !== undefined) requirement.materiality = payload.materiality;
  if (payload.approvalRequired !== undefined) requirement.approvalRequired = Boolean(payload.approvalRequired);
  if (payload.evidenceRequired !== undefined) requirement.evidenceRequired = Array.isArray(payload.evidenceRequired) ? payload.evidenceRequired : [];
  if (payload.details !== undefined) requirement.details = payload.details;

  await requirement.save();
  return requirement.toObject();
};

const deleteRequirement = async ({ workspaceId, requirementId }) => {
  const requirement = await IrisReportingRequirement.findOneAndDelete({ _id: requirementId, workspaceId });
  if (!requirement) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reporting requirement not found');
  }

  return { id: requirementId };
};

const cloudinary = require('cloudinary').v2;

// configure cloudinary from environment if present
if (process.env.CLOUDINARY_URL) {
  // CLOUDINARY_URL takes precedence
  cloudinary.config({ url: process.env.CLOUDINARY_URL });
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadEvidenceFile = async ({ workspaceId, requirementId, fileBuffer, fileName, fileType }) => {
  const requirement = await IrisReportingRequirement.findOne({ _id: requirementId, workspaceId });
  if (!requirement) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reporting requirement not found');
  }

  const fileSize = fileBuffer.length;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudinaryReady = !!(cloudName && apiKey && apiSecret);

  let fileUrl;
  let publicId = null;

  if (cloudinaryReady) {
    // ── Upload to Cloudinary ──────────────────────────────────────────────
    const dataUri = `data:${fileType};base64,${fileBuffer.toString('base64')}`;
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: process.env.CLOUDINARY_FOLDER || 'iris_reporting',
      resource_type: 'auto',
    });
    fileUrl  = uploadResult.secure_url || uploadResult.url;
    publicId = uploadResult.public_id;
  } else {
    // ── Fallback: store as base64 data URI in MongoDB ─────────────────────
    // Fine for dev/demo; replace with cloud storage in production.
    console.warn('[IRIS] Cloudinary not configured — storing file as base64 in DB (dev fallback)');
    fileUrl  = `data:${fileType};base64,${fileBuffer.toString('base64')}`;
    publicId = null;
  }

  const fileId = new (require('mongoose')).Types.ObjectId();
  requirement.evidenceFiles.push({
    _id:        fileId,
    fileName,
    fileType,
    fileSize,
    url:        fileUrl,
    publicId:   publicId || '',   // always a string — empty when Cloudinary not used
    uploadedBy: 'System',
    uploadedAt: new Date(),
  });

  await requirement.save();

  return {
    fileId:     fileId.toString(),
    fileName,
    fileType,
    fileSize,
    url:        fileUrl,
    publicId:   publicId || '',
    uploadedAt: new Date().toISOString(),
  };
};

const getEvidenceFile = async ({ workspaceId, requirementId, fileId }) => {
  const requirement = await IrisReportingRequirement.findOne(
    { _id: requirementId, workspaceId, 'evidenceFiles._id': fileId },
    { 'evidenceFiles.$': 1 }
  );

  if (!requirement || !requirement.evidenceFiles || requirement.evidenceFiles.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Evidence file not found');
  }

  const file = requirement.evidenceFiles[0];
  return {
    fileName: file.fileName,
    fileType: file.fileType,
    url: file.url,
    publicId: file.publicId,
  };
};

const deleteEvidenceFile = async ({ workspaceId, requirementId, fileId }) => {
  const requirement = await IrisReportingRequirement.findOne({ _id: requirementId, workspaceId });
  if (!requirement) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reporting requirement not found');
  }

  const file = requirement.evidenceFiles.find((f) => f._id.toString() === fileId);
  if (file && file.publicId) {
    const cloudinaryReady = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    if (cloudinaryReady) {
      try {
        await cloudinary.uploader.destroy(file.publicId, { resource_type: 'auto' });
      } catch (err) {
        console.warn('Cloudinary delete error', err.message || err);
      }
    }
  }

  requirement.evidenceFiles = requirement.evidenceFiles.filter((f) => f._id.toString() !== fileId);
  await requirement.save();

  return { fileId };
};

module.exports = {
  getOverview,
  getReportPack,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  uploadEvidenceFile,
  getEvidenceFile,
  deleteEvidenceFile,
};
