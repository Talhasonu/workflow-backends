const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError');
const { User } = require('../../models');
const { Process } = require('./model');
const { AUDIT_ACTIONS, buildAuditChanges, addProcessAudit } = require('./audit');
const stepService = require('../step/service');
const { logActivity } = require('../activityLog/service');
const { ACTIVITY_ACTIONS } = require('../activityLog/model');

const createProcessWithSteps = async ({ workspaceId, payload, actor }) => {
    const process = await Process.create({
        workspaceId,
        name: payload.name,
        description: payload.description || '',
        category: payload.category || '',
        visibility: payload.visibility,
        assignees: payload.assignees || [],
        settings: payload.settings || {},
        status: payload.status || 'draft',
    });

    const steps = await stepService.createStepsForProcess({
        workspaceId,
        processId: process._id,
        steps: payload.steps || [],
        actor,
        processName: process.name,
    });

    await logActivity({
        workspaceId,
        actor,
        action: ACTIVITY_ACTIONS.CREATE_PROCESS,
        entityType: 'process',
        entityId: process._id,
        message: `${actor.name || actor.email} created process "${process.name}"`,
        data: { name: process.name, status: process.status, category: process.category },
    });

    const populatedProcess = await Process.findById(process._id)
        .populate('assignees', 'name email role userType');

    return {
        process: populatedProcess,
        steps,
    };
};

const updateProcessById = async ({ processId, workspaceId, payload, actor }) => {
    const process = await Process.findOne({ _id: processId, workspaceId });
    if (!process) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Process not found');
    }

    const before = {
        name: process.name,
        description: process.description,
        category: process.category,
        visibility: process.visibility,
        assignees: (process.assignees || []).map(String),
        settings: process.settings,
        status: process.status,
    };

    if (payload.name !== undefined) process.name = payload.name;
    if (payload.description !== undefined) process.description = payload.description;
    if (payload.category !== undefined) process.category = payload.category;
    if (payload.visibility !== undefined) process.visibility = payload.visibility;
    if (payload.assignees !== undefined) process.assignees = payload.assignees;
    if (payload.settings !== undefined) process.settings = { ...process.settings.toObject(), ...payload.settings };
    if (payload.status !== undefined) process.status = payload.status;

    await process.save();

    if (Array.isArray(payload.steps) && payload.steps.length) {
        for (const stepItem of payload.steps) {
            const { _id, ...stepPayload } = stepItem;

            if (_id) {
                await stepService.updateStepById({
                    stepId: _id,
                    workspaceId,
                    payload: stepPayload,
                    actor,
                });
            } else {
                await stepService.createStepForProcess({
                    workspaceId,
                    payload: {
                        ...stepPayload,
                        processId: process._id,
                    },
                    actor,
                });
            }
        }
    }

    const after = {
        name: process.name,
        description: process.description,
        category: process.category,
        visibility: process.visibility,
        assignees: (process.assignees || []).map(String),
        settings: process.settings,
        status: process.status,
    };

    const changes = buildAuditChanges(before, after, [
        'name',
        'description',
        'category',
        'visibility',
        'assignees',
        'settings',
        'status',
    ]);

    if (changes.length) {
        await addProcessAudit({
            processId: process._id,
            action: AUDIT_ACTIONS.UPDATE_PROCESS,
            actor,
            entityType: 'process',
            entityId: process._id,
            message: `Process ${process.name} updated`,
            changes,
        });
    }

    await logActivity({
        workspaceId,
        actor,
        action: ACTIVITY_ACTIONS.UPDATE_PROCESS,
        entityType: 'process',
        entityId: process._id,
        message: `${actor.name || actor.email} updated process "${process.name}"`,
        data: { changes },
    });

    return Process.findById(process._id)
        .populate('assignees', 'name email role userType')
        .populate('auditTrail.actorId', 'name email');
};

const deleteProcessById = async ({ processId, workspaceId, actor }) => {
    const process = await Process.findOne({ _id: processId, workspaceId });
    if (!process) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Process not found');
    }

    await addProcessAudit({
        processId: process._id,
        action: AUDIT_ACTIONS.DELETE_PROCESS,
        actor,
        entityType: 'process',
        entityId: process._id,
        message: `Process ${process.name} deleted`,
        changes: [{ field: 'deleted', oldValue: false, newValue: true }],
    });

    await logActivity({
        workspaceId,
        actor,
        action: ACTIVITY_ACTIONS.DELETE_PROCESS,
        entityType: 'process',
        entityId: process._id,
        message: `${actor.name || actor.email} deleted process "${process.name}"`,
        data: { processName: process.name },
    });

    await stepService.deleteStepsByProcessId({ processId: process._id, workspaceId });
    await Process.deleteOne({ _id: process._id });

    return { id: process._id };
};

const listWorkspaceProcesses = async ({ workspaceId, query }) => {
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

    const [processes, total, analyticsRaw, totalSteps] = await Promise.all([
        Process.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('assignees', 'name email role userType')
            .lean(),
        Process.countDocuments(filter),
        Process.aggregate([
            { $match: { workspaceId: filter.workspaceId } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        stepService.countStepsByWorkspaceId(workspaceId),
    ]);

    const statusCounts = analyticsRaw.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
    }, {});

    const totalAll = Object.values(statusCounts).reduce((s, c) => s + c, 0);
    const completedCount = statusCounts['completed'] || 0;
    const activeCount = statusCounts['inprogress'] || 0;
    const avgCompletion = totalAll > 0 ? Math.round((completedCount / totalAll) * 100) : 0;

    const analytics = {
        total: totalAll,
        active: activeCount,
        avgCompletion,
        totalSteps,
    };

    if (!processes.length) {
        return { processes: [], total, page, limit, totalPages: Math.ceil(total / limit), analytics };
    }

    const processIds = processes.map((item) => item._id);
    const steps = await stepService.getStepsByProcessIds({ processIds, workspaceId });

    const stepsByProcessId = steps.reduce((acc, step) => {
        const key = String(step.processId);
        if (!acc[key]) acc[key] = [];
        acc[key].push(step);
        return acc;
    }, {});

    const enriched = processes.map((process) => {
        const processSteps = stepsByProcessId[String(process._id)] || [];
        return {
            ...process,
            stepCount: processSteps.length,
            steps: processSteps,
        };
    });

    return {
        processes: enriched,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        analytics,
    };
};

const getProcessById = async ({ processId, workspaceId }) => {
    const process = await Process.findOne({ _id: processId, workspaceId })
        .populate('assignees', 'name email role userType')
        .populate('auditTrail.actorId', 'name email')
        .lean();

    if (!process) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Process not found');
    }

    const steps = await stepService.getStepsByProcessId({ processId: process._id, workspaceId });

    return { ...process, steps };
};

const mongoose = require('mongoose');
const { Step } = require('../step/model');

const listUserAssignedProcesses = async ({ userId, workspaceId, userRole, userType, query = {} }) => {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    const assignedSteps = await Step.find({ assignee: userObjectId, workspaceId }).select('processId').lean();
    const processIdsFromSteps = assignedSteps.map(s => s.processId);

    const filter = {
        workspaceId,
        $or: [
            { assignees: userObjectId },
            { _id: { $in: processIdsFromSteps } }
        ]
    };

    if (query.status) {
        filter.status = query.status;
    }

    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: 'i' } },
            { description: { $regex: query.search, $options: 'i' } },
            { category: { $regex: query.search, $options: 'i' } },
        ];
    }

    const processes = await Process.find(filter)
        .sort({ createdAt: -1 })
        .populate('assignees', 'name email role userType')
        .lean();

    if (!processes.length) {
        return [];
    }

    const processIds = processes.map((item) => item._id);
    const steps = await stepService.getStepsByProcessIds({ processIds, workspaceId });

    const stepsByProcessId = steps.reduce((acc, step) => {
        const key = String(step.processId);
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(step);
        return acc;
    }, {});

    return processes.map((process) => ({
        ...process,
        steps: stepsByProcessId[String(process._id)] || [],
    }));
};

const getAssigneeEmails = async (assigneeIds, workspaceId) => {
    if (!assigneeIds?.length) {
        return [];
    }

    const users = await User.find({
        _id: { $in: assigneeIds },
        workspaceId,
    }).select('email');

    return users.map((user) => user.email).filter(Boolean);
};

module.exports = {
    createProcessWithSteps,
    updateProcessById,
    deleteProcessById,
    listWorkspaceProcesses,
    getProcessById,
    listUserAssignedProcesses,
    getAssigneeEmails,
};
