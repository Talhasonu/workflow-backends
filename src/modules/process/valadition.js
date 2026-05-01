const Joi = require('joi');
const { stepCreateSchema } = require('../step/valadition');

const statusValues = ['draft', 'completed', 'inprogress'];

const processUpdateStepSchema = Joi.object({
    _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    title: Joi.string().when('_id', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
    }),
    description: Joi.string().optional().allow(''),
    timeEstimate: Joi.string().optional().allow(''),
    assignee: Joi.string().optional().allow(null, ''),
    notes: Joi.string().optional().allow(''),
    status: Joi.string().valid(...statusValues).optional(),
    coordinates: Joi.object({
        x: Joi.number().optional().allow(null),
        y: Joi.number().optional().allow(null),
    }).optional(),
    sequenceNo: Joi.number().integer().min(0).when('_id', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
    }),
});

const processSettingsSchema = Joi.object({
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

const validateCreateProcessInputs = (data) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional().allow(''),
        category: Joi.string().optional().allow(''),
        visibility: Joi.string().valid('private', 'public').required(),
        assignees: Joi.array().items(Joi.string()).optional(),
        settings: processSettingsSchema,
        status: Joi.string().valid(...statusValues).optional(),
        steps: Joi.array().items(stepCreateSchema).required(),
    });

    const result = schema.validate(data, { abortEarly: false, stripUnknown: true });
    return {
        error: result?.error,
        msg: result?.error?.details?.[0]?.message,
        value: result?.value,
    };
};

const validateUpdateProcessInputs = (data) => {
    const schema = Joi.object({
        name: Joi.string().optional(),
        description: Joi.string().optional().allow(''),
        category: Joi.string().optional().allow(''),
        visibility: Joi.string().valid('private', 'public').optional(),
        assignees: Joi.array().items(Joi.string()).optional(),
        settings: processSettingsSchema,
        status: Joi.string().valid(...statusValues).optional(),
        steps: Joi.array().items(processUpdateStepSchema).optional(),
    }).min(1);

    const result = schema.validate(data, { abortEarly: false, stripUnknown: true });
    return {
        error: result?.error,
        msg: result?.error?.details?.[0]?.message,
        value: result?.value,
    };
};

const validateProcessIdParam = (data) => {
    const schema = Joi.object({
        processId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    });

    const result = schema.validate(data, { abortEarly: false, stripUnknown: true });
    return {
        error: result?.error,
        msg: result?.error?.details?.[0]?.message,
        value: result?.value,
    };
};

const validateListProcessesQuery = (data) => {
    const schema = Joi.object({
        search: Joi.string().optional().allow(''),
        status: Joi.string().valid(...statusValues).optional(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    });

    const result = schema.validate(data, { abortEarly: false, stripUnknown: true });
    return {
        error: result?.error,
        msg: result?.error?.details?.[0]?.message,
        value: result?.value,
    };
};

module.exports = {
    validateCreateProcessInputs,
    validateUpdateProcessInputs,
    validateProcessIdParam,
    validateListProcessesQuery,
};
