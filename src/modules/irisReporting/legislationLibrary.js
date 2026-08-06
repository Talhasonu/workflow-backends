/**
 * IRIS Legislation Reference Library
 * ------------------------------------
 * Pre-loaded references from:
 *   - Financial Management Act 1994 (Vic)
 *   - Standing Directions 2018 (Vic)
 *   - Treasurer's Directions
 *   - Audit Act 1994 (Vic)
 *   - AASB / IFRS standards
 *   - Privacy Act 1988 (Cth) / GDPR
 *   - Department Policy templates
 *
 * When the client supplies the Word document, these entries can be
 * expanded to include every clause with its exact text.
 *
 * Shape: { ref, title, source, category, obligationType, defaultMateriality }
 */

const legislationLibrary = [
  // ── Financial Management Act 1994 (Vic) ────────────────────────────────────
  { ref: "FMA s.8",   title: "Accountable officer responsibilities",                    source: "Financial Management Act 1994 (Vic)", category: "Legislation", obligationType: "compliance_review",   defaultMateriality: "High"     },
  { ref: "FMA s.51",  title: "Preparation of annual financial statements",              source: "Financial Management Act 1994 (Vic)", category: "Legislation", obligationType: "statutory_reporting", defaultMateriality: "Critical" },
  { ref: "FMA s.52",  title: "Audit of financial statements by Auditor-General",        source: "Financial Management Act 1994 (Vic)", category: "Legislation", obligationType: "audit_evidence",      defaultMateriality: "Critical" },
  { ref: "FMA s.53",  title: "Presentation of financial statements to Parliament",      source: "Financial Management Act 1994 (Vic)", category: "Legislation", obligationType: "statutory_reporting", defaultMateriality: "High"     },
  { ref: "FMA s.54",  title: "Monthly financial reports to Minister",                   source: "Financial Management Act 1994 (Vic)", category: "Legislation", obligationType: "reporting",           defaultMateriality: "Standard" },
  { ref: "FMA s.60",  title: "Borrowings — approval and conditions",                    source: "Financial Management Act 1994 (Vic)", category: "Legislation", obligationType: "compliance_review",   defaultMateriality: "High"     },
  { ref: "FMA s.65",  title: "Investments — authorised investments only",               source: "Financial Management Act 1994 (Vic)", category: "Legislation", obligationType: "compliance_review",   defaultMateriality: "High"     },

  // ── Standing Directions 2018 (Vic) ─────────────────────────────────────────
  { ref: "SD 2.1",    title: "Governance — accountable officer obligations",             source: "Standing Directions 2018 (Vic)", category: "Policy", obligationType: "compliance_review",   defaultMateriality: "High"     },
  { ref: "SD 3.1",    title: "Financial management compliance framework",               source: "Standing Directions 2018 (Vic)", category: "Policy", obligationType: "compliance_review",   defaultMateriality: "High"     },
  { ref: "SD 3.2",    title: "Audit and risk committee requirements",                   source: "Standing Directions 2018 (Vic)", category: "Policy", obligationType: "compliance_review",   defaultMateriality: "High"     },
  { ref: "SD 3.3",    title: "Internal audit function",                                 source: "Standing Directions 2018 (Vic)", category: "Policy", obligationType: "audit_evidence",      defaultMateriality: "High"     },
  { ref: "SD 4.1.3",  title: "Financial reporting — budget information",                source: "Standing Directions 2018 (Vic)", category: "Policy", obligationType: "statutory_reporting", defaultMateriality: "High"     },
  { ref: "SD 4.2.1",  title: "Annual report — financial disclosures",                  source: "Standing Directions 2018 (Vic)", category: "Policy", obligationType: "statutory_reporting", defaultMateriality: "High"     },
  { ref: "SD 4.2.2",  title: "Annual report — non-financial performance",              source: "Standing Directions 2018 (Vic)", category: "Policy", obligationType: "compliance_review",   defaultMateriality: "Standard" },
  { ref: "SD 4.3.1",  title: "Accounts payable — payment timeframes",                  source: "Standing Directions 2018 (Vic)", category: "Policy", obligationType: "compliance_review",   defaultMateriality: "Standard" },
  { ref: "SD 4.3.4",  title: "Purchasing cards policy and reconciliation",              source: "Standing Directions 2018 (Vic)", category: "Policy", obligationType: "compliance_review",   defaultMateriality: "Medium"   },
  { ref: "SD 4.4",    title: "Revenue management and collections",                      source: "Standing Directions 2018 (Vic)", category: "Policy", obligationType: "compliance_review",   defaultMateriality: "Medium"   },
  { ref: "SD 4.5.5",  title: "Asset management attestation",                           source: "Standing Directions 2018 (Vic)", category: "Policy", obligationType: "compliance_review",   defaultMateriality: "High"     },
  { ref: "SD 5.1",    title: "Risk management — risk framework attestation",            source: "Standing Directions 2018 (Vic)", category: "Policy", obligationType: "compliance_review",   defaultMateriality: "High"     },
  { ref: "SD 5.2",    title: "Insurance coverage attestation",                          source: "Standing Directions 2018 (Vic)", category: "Policy", obligationType: "compliance_review",   defaultMateriality: "Medium"   },

  // ── Treasurer's Directions ─────────────────────────────────────────────────
  { ref: "TD Part 1", title: "Public Account — transactions and accounting",            source: "Treasurer's Directions", category: "Policy", obligationType: "compliance_review", defaultMateriality: "High"     },
  { ref: "TD Part 2", title: "Appropriations — expenditure controls",                   source: "Treasurer's Directions", category: "Policy", obligationType: "compliance_review", defaultMateriality: "High"     },
  { ref: "TD Part 3", title: "Grants and transfer payments",                            source: "Treasurer's Directions", category: "Policy", obligationType: "compliance_review", defaultMateriality: "Medium"   },
  { ref: "TD Part 5", title: "Banking and investment compliance",                       source: "Treasurer's Directions", category: "Policy", obligationType: "compliance_review", defaultMateriality: "Medium"   },

  // ── Audit Act 1994 (Vic) ───────────────────────────────────────────────────
  { ref: "Audit Act s.7A", title: "VAGO annual financial audit — evidence pack",        source: "Audit Act 1994 (Vic)", category: "Legislation", obligationType: "audit_evidence", defaultMateriality: "Critical" },
  { ref: "Audit Act s.16", title: "Special investigations cooperation obligations",     source: "Audit Act 1994 (Vic)", category: "Legislation", obligationType: "compliance_review", defaultMateriality: "High"  },

  // ── AASB / IFRS ────────────────────────────────────────────────────────────
  { ref: "AASB 7",    title: "Financial instruments — disclosures",                     source: "AASB 7 / IFRS 7",  category: "Accounting standard", obligationType: "disclosure_pack", defaultMateriality: "High"  },
  { ref: "AASB 9",    title: "Financial instruments — recognition and measurement",     source: "AASB 9 / IFRS 9",  category: "Accounting standard", obligationType: "disclosure_pack", defaultMateriality: "High"  },
  { ref: "AASB 13",   title: "Fair value measurement disclosures",                      source: "AASB 13 / IFRS 13",category: "Accounting standard", obligationType: "disclosure_pack", defaultMateriality: "High"  },
  { ref: "AASB 16",   title: "Lease accounting — right-of-use assets and liabilities", source: "AASB 16 / IFRS 16",category: "Accounting standard", obligationType: "disclosure_pack", defaultMateriality: "High"  },
  { ref: "AASB 101",  title: "Presentation of financial statements",                    source: "AASB 101 / IAS 1", category: "Accounting standard", obligationType: "statutory_reporting", defaultMateriality: "Critical" },
  { ref: "AASB 107",  title: "Statement of cash flows",                                 source: "AASB 107 / IAS 7", category: "Accounting standard", obligationType: "statutory_reporting", defaultMateriality: "High"  },
  { ref: "AASB 108",  title: "Accounting policies, changes and errors",                 source: "AASB 108 / IAS 8", category: "Accounting standard", obligationType: "disclosure_pack",    defaultMateriality: "Medium"},
  { ref: "AASB 110",  title: "Events after reporting period",                           source: "AASB 110 / IAS 10",category: "Accounting standard", obligationType: "disclosure_pack",    defaultMateriality: "Medium"},
  { ref: "AASB 112",  title: "Income taxes",                                            source: "AASB 112 / IAS 12",category: "Accounting standard", obligationType: "disclosure_pack",    defaultMateriality: "High"  },
  { ref: "AASB 116",  title: "Property, plant and equipment",                           source: "AASB 116 / IAS 16",category: "Accounting standard", obligationType: "disclosure_pack",    defaultMateriality: "High"  },
  { ref: "AASB 119",  title: "Employee benefits — superannuation and leave",            source: "AASB 119 / IAS 19",category: "Accounting standard", obligationType: "disclosure_pack",    defaultMateriality: "High"  },
  { ref: "AASB 137",  title: "Provisions, contingent liabilities and assets",           source: "AASB 137 / IAS 37",category: "Accounting standard", obligationType: "disclosure_pack",    defaultMateriality: "High"  },
  { ref: "AASB 1058", title: "Income of not-for-profit entities",                       source: "AASB 1058",        category: "Accounting standard", obligationType: "disclosure_pack",    defaultMateriality: "High"  },

  // ── Privacy / GDPR ─────────────────────────────────────────────────────────
  { ref: "Privacy Act s.15",  title: "Privacy policy and APP compliance",               source: "Privacy Act 1988 (Cth)", category: "Compliance", obligationType: "compliance_review", defaultMateriality: "Medium" },
  { ref: "Privacy Act s.26WA",title: "Notifiable data breaches — reporting obligation", source: "Privacy Act 1988 (Cth)", category: "Compliance", obligationType: "statutory_reporting", defaultMateriality: "High"  },
  { ref: "GDPR Art.30",       title: "Records of processing activities (ROPA)",          source: "GDPR",                   category: "Compliance", obligationType: "compliance_review", defaultMateriality: "Medium" },
  { ref: "GDPR Art.32",       title: "Security of processing — technical measures",     source: "GDPR",                   category: "Compliance", obligationType: "compliance_review", defaultMateriality: "High"   },
  { ref: "GDPR Art.33",       title: "Data breach notification to supervisory authority",source: "GDPR",                   category: "Compliance", obligationType: "statutory_reporting", defaultMateriality: "High" },
];

module.exports = legislationLibrary;
