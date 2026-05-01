const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError');
const { Template } = require('./model');

const normalizeStep = (s) => ({
    title: s.title,
    description: s.description || '',
    timeEstimate: s.timeEstimate || '',
    notes: s.notes || '',
    status: s.status || 'draft',
    coordinates: s.coordinates || { x: null, y: null },
    sequence: s.sequence,
});

const createTemplate = async ({ workspaceId, payload }) => {
    const template = await Template.create({
        workspaceId,
        name: payload.name,
        description: payload.description || '',
        category: payload.category || '',
        settings: payload.settings || {},
        status: payload.status || 'draft',
        steps: (payload.steps || []).map(normalizeStep),
    });

    return Template.findById(template._id);
};

const updateTemplateById = async ({ templateId, workspaceId, payload }) => {
    const template = await Template.findOne({ _id: templateId, workspaceId });
    if (!template) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
    }

    if (payload.name !== undefined) template.name = payload.name;
    if (payload.description !== undefined) template.description = payload.description;
    if (payload.category !== undefined) template.category = payload.category;
    if (payload.settings !== undefined) {
        template.settings = { ...template.settings.toObject(), ...payload.settings };
    }
    if (payload.status !== undefined) template.status = payload.status;
    if (payload.steps !== undefined) {
        template.steps = payload.steps.map(normalizeStep);
    }

    await template.save();
    return Template.findById(template._id);
};

const deleteTemplateById = async ({ templateId, workspaceId }) => {
    const template = await Template.findOne({ _id: templateId, workspaceId });
    if (!template) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
    }

    await Template.deleteOne({ _id: template._id });
    return { id: template._id };
};

const listTemplates = async ({ workspaceId, query }) => {
    const { search, status, page = 1, limit = 10 } = query;
    const filter = { workspaceId };

    if (status) filter.status = status;
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
        Template.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Template.countDocuments(filter),
    ]);

    return {
        templates,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

const getTemplateById = async ({ templateId, workspaceId }) => {
    const template = await Template.findOne({ _id: templateId, workspaceId })
        .lean();

    if (!template) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
    }

    return template;
};

module.exports = {
    createTemplate,
    updateTemplateById,
    deleteTemplateById,
    listTemplates,
    getTemplateById,
};
