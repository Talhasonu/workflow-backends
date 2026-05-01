const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        companyEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        companyName: { type: String, default: '' },
        userName: { type: String, required: true, unique: true, index: true },
        companyType: { type: String, default: '' },
        industry: { type: String, default: '' },
        headquarters: { type: String, default: '' },
        website: { type: String, default: '' },
        automationPriority: { type: String, default: '' },
        currency: { type: String, default: '' },
        taxId: { type: String, default: '' },
        registrationNumber: { type: String, default: '' },
        timezone: { type: String, default: '' },
        employeeCount: { type: String, default: '' },
        initialTeamSize: { type: String, default: '' },
        expectedWorkflows: { type: String, default: '' },
        primaryWorkflowTypes: { type: [String], default: [] },
        foundedYear: { type: String, default: '' },
        phoneNumber: { type: String, default: '' },
        adminEmail: { type: String, default: '' },
        notificationPreferences: {
            email: { type: Boolean, default: true },
            slack: { type: Boolean, default: false },
            teams: { type: Boolean, default: false },
            inApp: { type: Boolean, default: true },
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Workspace', WorkspaceSchema);
