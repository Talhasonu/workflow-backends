const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const processService = require('./service');
const processValidation = require('./valadition');
const { emailService } = require('../../services');

const createProcess = catchAsync(async (req, res) => {
    const validationResult = processValidation.validateCreateProcessInputs(req.body);
    if (validationResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: validationResult.msg,
        });
    }

    if (!req.user?.workspaceId) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: 'No active workspace found for user.',
        });
    }

    const result = await processService.createProcessWithSteps({
        workspaceId: req.user.workspaceId,
        payload: validationResult.value,
        actor: req.user,
    });

    if (validationResult.value?.settings?.notifications?.email) {
        const emails = await processService.getAssigneeEmails(validationResult.value.assignees, req.user.workspaceId);
        const subject = `New process assigned: ${result.process.name}`;
        const text = `A new process has been created and assigned to you.\n\nProcess: ${result.process.name}\nStatus: ${result.process.status}`;

        await Promise.all(emails.map((email) => emailService.sendEmail(email, subject, text)));
    }

    return res.status(httpStatus.CREATED).send({
        success: true,
        process: result.process,
        steps: result.steps,
    });
});

const updateProcess = catchAsync(async (req, res) => {
    const paramResult = processValidation.validateProcessIdParam(req.params);
    if (paramResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: paramResult.msg,
        });
    }

    const validationResult = processValidation.validateUpdateProcessInputs(req.body);
    if (validationResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: validationResult.msg,
        });
    }

    const process = await processService.updateProcessById({
        processId: paramResult.value.processId,
        workspaceId: req.user.workspaceId,
        payload: validationResult.value,
        actor: req.user,
    });

    return res.send({
        success: true,
        process,
    });
});

const deleteProcess = catchAsync(async (req, res) => {
    const paramResult = processValidation.validateProcessIdParam(req.params);
    if (paramResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: paramResult.msg,
        });
    }

    const result = await processService.deleteProcessById({
        processId: paramResult.value.processId,
        workspaceId: req.user.workspaceId,
        actor: req.user,
    });

    return res.send({
        success: true,
        message: 'Process deleted successfully.',
        process: result,
    });
});

const getWorkspaceProcesses = catchAsync(async (req, res) => {
    const validationResult = processValidation.validateListProcessesQuery(req.query);
    if (validationResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: validationResult.msg,
        });
    }

    const result = await processService.listWorkspaceProcesses({
        workspaceId: req.user.workspaceId,
        query: validationResult.value,
    });

    return res.send({
        success: true,
        analytics: result.analytics,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        processes: result.processes,
    });
});

const getProcessById = catchAsync(async (req, res) => {
    const paramResult = processValidation.validateProcessIdParam(req.params);
    if (paramResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: paramResult.msg,
        });
    }

    const process = await processService.getProcessById({
        processId: paramResult.value.processId,
        workspaceId: req.user.workspaceId,
    });

    return res.send({
        success: true,
        process,
    });
});

const getAssignedProcesses = catchAsync(async (req, res) => {
    const validationResult = processValidation.validateListProcessesQuery(req.query);
    if (validationResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: validationResult.msg,
        });
    }

    const processes = await processService.listUserAssignedProcesses({
        userId: validationResult.value.userId || req.user._id,
        workspaceId: req.user.workspaceId,
        userRole: req.user.role,
        userType: req.user.userType,
        query: validationResult.value,
    });

    return res.send({
        success: true,
        count: processes.length,
        processes,
    });
});

module.exports = {
    createProcess,
    updateProcess,
    deleteProcess,
    getWorkspaceProcesses,
    getProcessById,
    getAssignedProcesses,
};
