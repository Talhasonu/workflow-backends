const Joi = require('joi');
const { ACTIVITY_ACTIONS } = require('./model');

const validateGetActivityLogsQuery = (query) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        action: Joi.string().valid(...Object.values(ACTIVITY_ACTIONS)).optional(),
        userId: Joi.string().hex().length(24).optional(),
    });

    const { error, value } = schema.validate(query, { abortEarly: false, stripUnknown: true });
    if (error) {
        return { error: true, msg: error.details.map((d) => d.message).join(', ') };
    }
    return { error: false, value };
};

const validateLogIdParam = (params) => {
    const schema = Joi.object({
        logId: Joi.string().hex().length(24).required().label('logId'),
    });

    const { error, value } = schema.validate(params, { abortEarly: false, stripUnknown: true });
    if (error) {
        return { error: true, msg: error.details.map((d) => d.message).join(', ') };
    }
    return { error: false, value };
};

const validateEntityIdParam = (params) => {
    const schema = Joi.object({
        entityId: Joi.string().hex().length(24).required().label('entityId'),
    });

    const { error, value } = schema.validate(params, { abortEarly: false, stripUnknown: true });
    if (error) {
        return { error: true, msg: error.details.map((d) => d.message).join(', ') };
    }
    return { error: false, value };
};

const validateGetByEntityQuery = (query) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
    });

    const { error, value } = schema.validate(query, { abortEarly: false, stripUnknown: true });
    if (error) {
        return { error: true, msg: error.details.map((d) => d.message).join(', ') };
    }
    return { error: false, value };
};

module.exports = {
    validateGetActivityLogsQuery,
    validateLogIdParam,
    validateEntityIdParam,
    validateGetByEntityQuery,
};
