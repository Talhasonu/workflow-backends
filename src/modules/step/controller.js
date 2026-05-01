const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const stepService = require("./service");
const stepValidation = require("./valadition");

const updateStep = catchAsync(async (req, res) => {
  const { stepId } = req.params;
  let step;

  if (!stepId) {
    const createValidationResult = stepValidation.validateCreateStepInputs(
      req.body,
    );
    if (createValidationResult?.error) {
      return res.status(httpStatus.BAD_REQUEST).send({
        isSuccess: false,
        message: createValidationResult.msg,
      });
    }

    step = await stepService.createStepForProcess({
      workspaceId: req.user.workspaceId,
      payload: createValidationResult.value,
      actor: req.user,
    });
  } else {
    const paramResult = stepValidation.validateStepIdParam(req.params);
    if (paramResult?.error) {
      return res.status(httpStatus.BAD_REQUEST).send({
        isSuccess: false,
        message: paramResult.msg,
      });
    }

    const validationResult = stepValidation.validateUpdateStepInputs(req.body);
    if (validationResult?.error) {
      return res.status(httpStatus.BAD_REQUEST).send({
        isSuccess: false,
        message: validationResult.msg,
      });
    }

    step = await stepService.updateStepById({
      stepId: paramResult.value.stepId,
      workspaceId: req.user.workspaceId,
      payload: validationResult.value,
      actor: req.user,
    });
  }

  return res.send({
    success: true,
    step,
  });
});

const deleteStep = catchAsync(async (req, res) => {
  const paramResult = stepValidation.validateStepIdParam(req.params);
  if (paramResult?.error) {
    return res.status(httpStatus.BAD_REQUEST).send({
      isSuccess: false,
      message: paramResult.msg,
    });
  }

  const result = await stepService.deleteStepById({
    stepId: paramResult.value.stepId,
    workspaceId: req.user.workspaceId,
    actor: req.user,
  });

  return res.send({
    success: true,
    message: "Step deleted successfully.",
    step: result,
  });
});

const completeStep = catchAsync(async (req, res) => {
  const paramResult = stepValidation.validateStepIdParam(req.params);
  if (paramResult?.error) {
    return res.status(httpStatus.BAD_REQUEST).send({
      isSuccess: false,
      message: paramResult.msg,
    });
  }

  const step = await stepService.completeStepById({
    stepId: paramResult.value.stepId,
    workspaceId: req.user.workspaceId,
    actor: req.user,
  });

  return res.send({
    success: true,
    message: "Step completed successfully.",
    step,
  });
});

module.exports = {
  updateStep,
  deleteStep,
  completeStep,
};
