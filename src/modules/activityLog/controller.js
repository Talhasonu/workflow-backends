const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const activityLogService = require('./service');
const activityLogValidation = require('./valadition');

const getActivityLogs = catchAsync(async (req, res) => {
    const validationResult = activityLogValidation.validateGetActivityLogsQuery(req.query);
    if (validationResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: validationResult.msg,
        });
    }

    const { page, limit, action, userId } = validationResult.value;

    const result = await activityLogService.getWorkspaceActivityLogs({
        workspaceId: req.user.workspaceId,
        page,
        limit,
        action,
        userId,
    });

    return res.status(httpStatus.OK).send({
        success: true,
        ...result,
    });
});

const getActivityLogById = catchAsync(async (req, res) => {
    const validationResult = activityLogValidation.validateLogIdParam(req.params);
    if (validationResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: validationResult.msg,
        });
    }

    const log = await activityLogService.getActivityLogById({
        logId: validationResult.value.logId,
        workspaceId: req.user.workspaceId,
    });

    return res.status(httpStatus.OK).send({
        success: true,
        log,
    });
});

const getActivityLogsByEntityId = catchAsync(async (req, res) => {
    const paramResult = activityLogValidation.validateEntityIdParam(req.params);
    if (paramResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: paramResult.msg,
        });
    }

    const result = await activityLogService.getActivityLogsByEntityId({
        entityId: paramResult.value.entityId,
        workspaceId: req.user.workspaceId,
    });

    return res.status(httpStatus.OK).send({
        success: true,
        ...result,
    });
});

module.exports = {
    getActivityLogs,
    getActivityLogById,
    getActivityLogsByEntityId,
};
