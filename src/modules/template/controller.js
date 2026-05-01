const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const templateService = require('./service');
const templateValidation = require('./validation');

const createTemplate = catchAsync(async (req, res) => {
    const validationResult = templateValidation.validateCreateTemplate(req.body);
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

    const template = await templateService.createTemplate({
        workspaceId: req.user.workspaceId,
        payload: validationResult.value,
    });

    return res.status(httpStatus.CREATED).send({
        success: true,
        template,
    });
});

const updateTemplate = catchAsync(async (req, res) => {
    const paramResult = templateValidation.validateTemplateIdParam(req.params);
    if (paramResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: paramResult.msg,
        });
    }

    const validationResult = templateValidation.validateUpdateTemplate(req.body);
    if (validationResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: validationResult.msg,
        });
    }

    const template = await templateService.updateTemplateById({
        templateId: paramResult.value.templateId,
        workspaceId: req.user.workspaceId,
        payload: validationResult.value,
    });

    return res.send({
        success: true,
        template,
    });
});

const deleteTemplate = catchAsync(async (req, res) => {
    const paramResult = templateValidation.validateTemplateIdParam(req.params);
    if (paramResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: paramResult.msg,
        });
    }

    const result = await templateService.deleteTemplateById({
        templateId: paramResult.value.templateId,
        workspaceId: req.user.workspaceId,
    });

    return res.send({
        success: true,
        message: 'Template deleted successfully.',
        template: result,
    });
});

const listTemplates = catchAsync(async (req, res) => {
    const validationResult = templateValidation.validateListTemplatesQuery(req.query);
    if (validationResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: validationResult.msg,
        });
    }

    const result = await templateService.listTemplates({
        workspaceId: req.user.workspaceId,
        query: validationResult.value,
    });

    return res.send({
        success: true,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        templates: result.templates,
    });
});

const getTemplateById = catchAsync(async (req, res) => {
    const paramResult = templateValidation.validateTemplateIdParam(req.params);
    if (paramResult?.error) {
        return res.status(httpStatus.BAD_REQUEST).send({
            isSuccess: false,
            message: paramResult.msg,
        });
    }

    const template = await templateService.getTemplateById({
        templateId: paramResult.value.templateId,
        workspaceId: req.user.workspaceId,
    });

    return res.send({
        success: true,
        template,
    });
});

module.exports = {
    createTemplate,
    updateTemplate,
    deleteTemplate,
    listTemplates,
    getTemplateById,
};
