// ─── ISO 27001:2022 Annex A — Technological Controls Registry ─────────────────
// Only includes controls that are directly auto-evidenceable from the existing
// infrastructure (audit logs, user tables, session tables, static config).
//
// Physical controls (A.7.*), organizational controls (A.5.*), and people
// controls (A.6.*) are excluded — they require manual evidence.

export const ISO_27001_CONTROLS = [
  {
    controlId:    'A.8.2',
    name:         'Privileged Access Rights',
    description:  'The allocation and use of privileged access rights shall be restricted and managed.',
    category:     'Technological',
    evidenceType: 'automated',
  },
  {
    controlId:    'A.8.3',
    name:         'Information Access Restriction',
    description:  'Access to information and other associated assets shall be restricted in accordance with access control policy.',
    category:     'Technological',
    evidenceType: 'automated',
  },
  {
    controlId:    'A.8.5',
    name:         'Secure Authentication',
    description:  'Secure authentication technologies and procedures shall be implemented based on information access restrictions.',
    category:     'Technological',
    evidenceType: 'automated',
  },
  {
    controlId:    'A.8.6',
    name:         'Capacity Management',
    description:  'The use of resources shall be monitored and adjusted in line with current and expected capacity requirements.',
    category:     'Technological',
    evidenceType: 'automated',
  },
  {
    controlId:    'A.8.7',
    name:         'Protection Against Malware',
    description:  'Protection against malware shall be implemented and supported by appropriate user awareness.',
    category:     'Technological',
    evidenceType: 'automated',
  },
  {
    controlId:    'A.8.15',
    name:         'Logging',
    description:  'Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.',
    category:     'Technological',
    evidenceType: 'automated',
  },
  {
    controlId:    'A.8.16',
    name:         'Monitoring Activities',
    description:  'Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents.',
    category:     'Technological',
    evidenceType: 'automated',
  },
  {
    controlId:    'A.8.17',
    name:         'Clock Synchronisation',
    description:  'The clocks of information processing systems used by the organisation shall be synchronised to approved time sources.',
    category:     'Technological',
    evidenceType: 'automated',
  },
  {
    controlId:    'A.8.28',
    name:         'Secure Coding',
    description:  'Secure coding principles shall be applied to software development.',
    category:     'Technological',
    evidenceType: 'automated',
  },
  {
    controlId:    'A.8.29',
    name:         'Security Testing in Development and Acceptance',
    description:  'Security testing processes shall be defined and implemented in the development lifecycle.',
    category:     'Technological',
    evidenceType: 'automated',
  },
  {
    controlId:    'A.8.32',
    name:         'Change Management',
    description:  'Changes to information processing facilities and information systems shall be subject to change management procedures.',
    category:     'Technological',
    evidenceType: 'automated',
  },
  {
    controlId:    'A.8.33',
    name:         'Test Information',
    description:  'Test information shall be appropriately selected, protected and managed.',
    category:     'Technological',
    evidenceType: 'automated',
  },
  {
    controlId:    'A.8.34',
    name:         'Protection of Information Systems During Audit Testing',
    description:  'Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed between the tester and appropriate management.',
    category:     'Technological',
    evidenceType: 'automated',
  },
] as const;

export type ControlId = (typeof ISO_27001_CONTROLS)[number]['controlId'];
