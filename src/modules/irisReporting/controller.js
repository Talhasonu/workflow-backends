const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const irisReportingService = require('./service');

const getOverview = catchAsync(async (req, res) => {
  const workspaceId = req.user?.workspaceId || req.user?.workspace?._id;
  const result = await irisReportingService.getOverview({ workspaceId });

  return res.status(httpStatus.OK).send({
    success: true,
    ...result,
  });
});

const getReportPack = catchAsync(async (req, res) => {
  const workspaceId = req.user?.workspaceId || req.user?.workspace?._id;
  const result = await irisReportingService.getReportPack({ workspaceId });

  return res.status(httpStatus.OK).send({
    success: true,
    ...result,
  });
});

const createRequirement = catchAsync(async (req, res) => {
  const workspaceId = req.user?.workspaceId || req.user?.workspace?._id;
  const requirement = await irisReportingService.createRequirement({ workspaceId, payload: req.body });

  return res.status(httpStatus.CREATED).send({
    success: true,
    requirement,
  });
});

const updateRequirement = catchAsync(async (req, res) => {
  const workspaceId = req.user?.workspaceId || req.user?.workspace?._id;
  const requirement = await irisReportingService.updateRequirement({
    workspaceId,
    requirementId: req.params.requirementId,
    payload: req.body,
  });

  return res.status(httpStatus.OK).send({
    success: true,
    requirement,
  });
});

const deleteRequirement = catchAsync(async (req, res) => {
  const workspaceId = req.user?.workspaceId || req.user?.workspace?._id;
  const result = await irisReportingService.deleteRequirement({ workspaceId, requirementId: req.params.requirementId });

  return res.status(httpStatus.OK).send({
    success: true,
    ...result,
  });
});

const uploadEvidenceFile = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new Error('No file uploaded');
  }

  const workspaceId = req.user?.workspaceId || req.user?.workspace?._id;
  const { requirementId } = req.params;
  const { originalname, buffer, mimetype } = req.file;

  const result = await irisReportingService.uploadEvidenceFile({
    workspaceId,
    requirementId,
    fileBuffer: buffer,
    fileName: originalname,
    fileType: mimetype,
  });

  return res.status(httpStatus.OK).send({
    success: true,
    file: result,
  });
});

const downloadEvidenceFile = catchAsync(async (req, res) => {
  const workspaceId = req.user?.workspaceId || req.user?.workspace?._id;
  const { requirementId, fileId } = req.params;

  const result = await irisReportingService.getEvidenceFile({
    workspaceId,
    requirementId,
    fileId,
  });

  // Return file URL so client can download directly from Cloudinary
  return res.status(httpStatus.OK).send({
    success: true,
    file: {
      fileName: result.fileName,
      fileType: result.fileType,
      url: result.url,
      publicId: result.publicId,
    },
  });
});

const deleteEvidenceFile = catchAsync(async (req, res) => {
  const workspaceId = req.user?.workspaceId || req.user?.workspace?._id;
  const { requirementId, fileId } = req.params;

  const result = await irisReportingService.deleteEvidenceFile({
    workspaceId,
    requirementId,
    fileId,
  });

  return res.status(httpStatus.OK).send({
    success: true,
    ...result,
  });
});

module.exports = {
  getOverview,
  getReportPack,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  uploadEvidenceFile,
  downloadEvidenceFile,
  deleteEvidenceFile,
};
