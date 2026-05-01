const mongoose = require('mongoose');

const STEP_STATUS = ['draft', 'completed', 'inprogress'];

const stepSchema = new mongoose.Schema(
    {
        workspaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
            index: true,
        },
        processId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Process',
            required: true,
            index: true,
        },
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        timeEstimate: { type: String, default: '', trim: true },
        assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
        notes: { type: String, default: '', trim: true },
        status: { type: String, enum: STEP_STATUS, default: 'draft' },
        coordinates: {
            x: { type: Number, default: null },
            y: { type: Number, default: null },
        },
        sequenceNo: { type: Number, required: true },
    },
    {
        timestamps: true,
    }
);

const Step = mongoose.model('Step', stepSchema);

module.exports = {
    Step,
    STEP_STATUS,
};
