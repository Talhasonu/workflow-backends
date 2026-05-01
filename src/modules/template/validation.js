const Joi = require('joi');

const TEMPLATE_STATUS = ['draft', 'inprogress', 'completed'];

const stepSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().optional().allow(''),
    timeEstimate: Joi.string().optional().allow(''),
    notes: Joi.string().optional().allow(''),
    status: Joi.string().valid(...TEMPLATE_STATUS).optional(),
    coordinates: Joi.object({
        x: Joi.number().optional().allow(null),
        y: Joi.number().optional().allow(null),
    }).optional(),
    sequence: Joi.number().integer().min(0).required(),
});

const updateStepSchema = Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional().allow(''),
    timeEstimate: Joi.string().optional().allow(''),
    notes: Joi.string().optional().allow(''),
    status: Joi.string().valid(...TEMPLATE_STATUS).optional(),
    coordinates: Joi.object({
        x: Joi.number().optional().allow(null),
        y: Joi.number().optional().allow(null),
    }).optional(),
    sequence: Joi.number().integer().min(0).optional(),
});

const settingsSchema = Joi.object({
    notifications: Joi.object({
        email: Joi.boolean().optional(),
        slack: Joi.boolean().optional(),
        inApp: Joi.boolean().optional(),
    }).optional(),
    automation: Joi.object({
        autoAssignTasks: Joi.boolean().optional(),
        dueDateReminders: Joi.boolean().optional(),
        escalateOverdueTasks: Joi.boolean().optional(),
    }).optional(),
}).optional();

const validateCreateTemplate = (data) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional().allow(''),
        category: Joi.string().optional().allow(''),
        settings: settingsSchema,
        status: Joi.string().valid(...TEMPLATE_STATUS).optional(),
        steps: Joi.array().items(stepSchema).optional(),
    });

    const result = schema.validate(data, { abortEarly: false, stripUnknown: true });
    return {
        error: result?.error,
        msg: result?.error?.details?.[0]?.message,
        value: result?.value,
    };
};

const validateUpdateTemplate = (data) => {
    const schema = Joi.object({
        name: Joi.string().optional(),
        description: Joi.string().optional().allow(''),
        category: Joi.string().optional().allow(''),
        settings: settingsSchema,
        status: Joi.string().valid(...TEMPLATE_STATUS).optional(),
        steps: Joi.array().items(updateStepSchema).optional(),
    }).min(1);

    const result = schema.validate(data, { abortEarly: false, stripUnknown: true });
    return {
        error: result?.error,
        msg: result?.error?.details?.[0]?.message,
        value: result?.value,
    };
};

const validateTemplateIdParam = (data) => {
    const schema = Joi.object({
        templateId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required(),
    });

    const result = schema.validate(data, { abortEarly: false, stripUnknown: true });
    return {
        error: result?.error,
        msg: result?.error?.details?.[0]?.message,
        value: result?.value,
    };
};

const validateListTemplatesQuery = (data) => {
    const schema = Joi.object({
        search: Joi.string().optional().allow(''),
        status: Joi.string().valid(...TEMPLATE_STATUS).optional(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
    });

    const result = schema.validate(data, { abortEarly: false, stripUnknown: true });
    return {
        error: result?.error,
        msg: result?.error?.details?.[0]?.message,
        value: result?.value,
    };
};

module.exports = {
    validateCreateTemplate,
    validateUpdateTemplate,
    validateTemplateIdParam,
    validateListTemplatesQuery,
};
