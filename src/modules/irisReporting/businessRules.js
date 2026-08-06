/**
 * IRIS Business Rules Engine
 * ----------------------------
 * Validates an obligation payload against configurable rules.
 * Returns { valid: boolean, violations: [{rule, message, severity}] }
 *
 * Severity levels:
 *   "error"   — blocks the action (save/status change refused)
 *   "warning" — allows save but surfaces to user
 */

const RULES = [
  // ── Rule 1: Cannot mark Completed if approval is required but not approved ──
  {
    id:       "COMPLETION_REQUIRES_APPROVAL",
    severity: "error",
    check:    (req) =>
      req.status === "completed" &&
      req.approvalRequired &&
      req.approvalStatus !== "approved",
    message:  "This obligation cannot be marked Completed until all approval steps are approved.",
  },

  // ── Rule 2: Cannot mark Completed with no evidence files if evidence is listed ──
  {
    id:       "COMPLETION_REQUIRES_EVIDENCE",
    severity: "error",
    check:    (req) =>
      req.status === "completed" &&
      Array.isArray(req.evidenceRequired) &&
      req.evidenceRequired.filter(Boolean).length > 0 &&
      (!Array.isArray(req.evidenceFiles) || req.evidenceFiles.length === 0),
    message:  "This obligation lists evidence requirements but has no files attached. Upload evidence before marking Completed.",
  },

  // ── Rule 3: Critical/High materiality auto-requires approval ─────────────
  {
    id:       "HIGH_MATERIALITY_NEEDS_APPROVAL",
    severity: "warning",
    check:    (req) =>
      ["Critical", "High"].includes(req.materiality) &&
      !req.approvalRequired,
    message:  "Obligations with High or Critical materiality are recommended to have an approval workflow.",
  },

  // ── Rule 4: Past due date should be Blocked or Completed, not Planned ────
  {
    id:       "OVERDUE_NOT_PLANNED",
    severity: "warning",
    check:    (req) => {
      if (!req.dueDate) return false;
      const due = new Date(req.dueDate);
      return due < new Date() && req.status === "planned";
    },
    message:  "This obligation is past its due date but is still marked Planned. Consider updating to In Progress or Blocked.",
  },

  // ── Rule 5: No due date on Critical obligations ───────────────────────────
  {
    id:       "CRITICAL_NEEDS_DUE_DATE",
    severity: "warning",
    check:    (req) => req.materiality === "Critical" && !req.dueDate,
    message:  "Critical obligations should have a due date set.",
  },

  // ── Rule 6: Approval required but no approval steps defined ──────────────
  {
    id:       "APPROVAL_STEPS_REQUIRED",
    severity: "warning",
    check:    (req) =>
      req.approvalRequired &&
      (!Array.isArray(req.approvalSteps) || req.approvalSteps.length === 0),
    message:  "Approval workflow is required but no approval steps have been defined.",
  },
];

/**
 * Validate a requirement object against all business rules.
 * @param {object} req - plain object representing the obligation (not a Mongoose doc)
 * @returns {{ valid: boolean, errors: string[], warnings: string[], violations: object[] }}
 */
function validateRequirement(req) {
  const violations = RULES
    .filter((rule) => rule.check(req))
    .map((rule) => ({ rule: rule.id, message: rule.message, severity: rule.severity }));

  const errors   = violations.filter((v) => v.severity === "error").map((v) => v.message);
  const warnings = violations.filter((v) => v.severity === "warning").map((v) => v.message);

  return {
    valid:      errors.length === 0,
    errors,
    warnings,
    violations,
  };
}

/**
 * Auto-apply materiality rules to a requirement before saving.
 * Mutates the object in-place and returns it.
 */
function applyMaterialityRules(req) {
  // Critical/High materiality — auto-set approvalRequired
  if (["Critical", "High"].includes(req.materiality) && req.approvalRequired === undefined) {
    req.approvalRequired = true;
  }
  return req;
}

module.exports = { validateRequirement, applyMaterialityRules, RULES };
