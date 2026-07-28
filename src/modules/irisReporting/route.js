const express = require("express");
const multer = require("multer");
const auth = require("../../middlewares/auth");
const { isSuperAdmin } = require("../../middlewares/auth");
const irisReportingController = require("./controller");

const router = express.Router();

// Configure multer for in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

router
  .get("/overview", auth(), isSuperAdmin(), irisReportingController.getOverview)
  .get(
    "/report-pack",
    auth(),
    isSuperAdmin(),
    irisReportingController.getReportPack,
  )
  .post(
    "/requirements",
    auth(),
    isSuperAdmin(),
    irisReportingController.createRequirement,
  )
  .patch(
    "/requirements/:requirementId",
    auth(),
    isSuperAdmin(),
    irisReportingController.updateRequirement,
  )
  .delete(
    "/requirements/:requirementId",
    auth(),
    isSuperAdmin(),
    irisReportingController.deleteRequirement,
  )
  .post(
    "/requirements/:requirementId/files",
    auth(),
    isSuperAdmin(),
    upload.single("file"),
    irisReportingController.uploadEvidenceFile,
  )
  .get(
    "/requirements/:requirementId/files/:fileId",
    auth(),
    isSuperAdmin(),
    irisReportingController.downloadEvidenceFile,
  )
  .delete(
    "/requirements/:requirementId/files/:fileId",
    auth(),
    isSuperAdmin(),
    irisReportingController.deleteEvidenceFile,
  );

module.exports = router;
