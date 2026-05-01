const express = require("express");
const auth = require("../../middlewares/auth");
const { isSuperAdmin } = require("../../middlewares/auth");
const stepController = require("./controller");
const API_ROUTES = require("../../config/apiRoutes");

const router = express.Router();

router
  .patch(
    API_ROUTES.STEP.UPDATE_STEP,
    auth(),
    isSuperAdmin(),
    stepController.updateStep,
  )
  .patch(API_ROUTES.STEP.COMPLETE_STEP, auth(), stepController.completeStep)
  .delete(
    API_ROUTES.STEP.DELETE_STEP,
    auth(),
    isSuperAdmin(),
    stepController.deleteStep,
  );

module.exports = router;
