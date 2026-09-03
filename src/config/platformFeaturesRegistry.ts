import type { FeatureCategory, FeatureType, FeatureStatus } from '../types';

export interface FeatureDefinition {
  key: string;
  name: string;
  description: string;
  category: FeatureCategory;
  featureType: FeatureType;
  featureStatus: FeatureStatus;
  defaultEnabled: boolean;
  dependsOn?: string[];
  isCoreInfrastructure?: boolean;
}

export const FEATURE_DEPENDENCY_GRAPH: Record<string, string[]> = {
  'music.instruments': ['music.core'],
  'music.repertoire': ['music.core'],
  'music.practice': ['music.core'],
  'music.assessments': ['music.core'],
  'dance.choreography': ['dance.core'],
  'dance.practice': ['dance.core'],
  'dance.assessments': ['dance.core'],
  'dance.costumes': ['dance.core'],
  'events.transport': ['events.core'],
  'events.consent': ['events.core'],
  'finance.reporting': ['finance.core'],
  'analytics.advanced': ['analytics.core'],
  'integrations.payments': ['finance.core']
};

export const STANDARD_PLATFORM_FEATURES: FeatureDefinition[] = [
  // Core Module
  {
    key: 'core.learners',
    name: 'Learners Directory',
    description: 'Basic student profiles and management',
    category: 'core',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    isCoreInfrastructure: true
  },
  {
    key: 'core.guardians',
    name: 'Guardians Directory',
    description: 'Parent and guardian emergency contact records',
    category: 'core',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    isCoreInfrastructure: true
  },
  {
    key: 'core.staff',
    name: 'Staff & Teachers',
    description: 'Instructor and employee personnel records',
    category: 'core',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    isCoreInfrastructure: true
  },
  {
    key: 'core.programmes',
    name: 'Programmes & Curriculum',
    description: 'Educational offerings, terms, and levels',
    category: 'core',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    isCoreInfrastructure: true
  },
  {
    key: 'core.groups',
    name: 'Classes & Groups',
    description: 'Enrolment groupings and class rosters',
    category: 'core',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    isCoreInfrastructure: true
  },
  {
    key: 'core.attendance',
    name: 'Attendance Tracking',
    description: 'Session roll-call and attendance registers',
    category: 'core',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    isCoreInfrastructure: true
  },

  // Music Module
  {
    key: 'music.core',
    name: 'Music Department',
    description: 'Core music education management and dashboard',
    category: 'music',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true
  },
  {
    key: 'music.instruments',
    name: 'Instrument Inventory',
    description: 'Instrument catalog and allocation tracking',
    category: 'music',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    dependsOn: ['music.core']
  },
  {
    key: 'music.repertoire',
    name: 'Music Repertoire',
    description: 'Score library, pieces, and ensemble assignments',
    category: 'music',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    dependsOn: ['music.core']
  },
  {
    key: 'music.practice',
    name: 'Music Practice Logs',
    description: 'Student practice tracking and time logging',
    category: 'music',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    dependsOn: ['music.core']
  },
  {
    key: 'music.assessments',
    name: 'Music Assessments',
    description: 'Rubric-based grading and performance evaluations',
    category: 'music',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    dependsOn: ['music.core']
  },

  // Dance Module
  {
    key: 'dance.core',
    name: 'Dance Academy',
    description: 'Core dance education, classes, and levels',
    category: 'dance',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true
  },
  {
    key: 'dance.choreography',
    name: 'Choreography & Pieces',
    description: 'Choreography catalog and rehearsal planning',
    category: 'dance',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    dependsOn: ['dance.core']
  },
  {
    key: 'dance.practice',
    name: 'Dance Practice Logs',
    description: 'Practice routines and rehearsal logs',
    category: 'dance',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    dependsOn: ['dance.core']
  },
  {
    key: 'dance.assessments',
    name: 'Dance Assessments',
    description: 'Technique evaluation, exam levels, and grading',
    category: 'dance',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    dependsOn: ['dance.core']
  },
  {
    key: 'dance.costumes',
    name: 'Costume Wardrobe',
    description: 'Costume inventory, sizes, and allocations',
    category: 'dance',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    dependsOn: ['dance.core']
  },

  // Events Module
  {
    key: 'events.core',
    name: 'Events & Performances',
    description: 'Concert, showcase, and competition management',
    category: 'events',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true
  },
  {
    key: 'events.transport',
    name: 'Transport Management',
    description: 'Bus manifests, routes, and passenger rosters',
    category: 'events',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    dependsOn: ['events.core']
  },
  {
    key: 'events.consent',
    name: 'Consent & Permissions',
    description: 'Digital parent consent requests and signatures',
    category: 'events',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    dependsOn: ['events.core']
  },

  // Finance Module
  {
    key: 'finance.core',
    name: 'Finance & Invoicing',
    description: 'School invoicing, fee payments, and receipts',
    category: 'finance',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true
  },
  {
    key: 'finance.reporting',
    name: 'Financial Reporting',
    description: 'Ledger summaries, revenue breakdown, and exports',
    category: 'finance',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true,
    dependsOn: ['finance.core']
  },

  // Communication & Documents
  {
    key: 'communication.core',
    name: 'Messaging & Communications',
    description: 'Email broadcasts, SMS templates, and logs',
    category: 'communication',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true
  },
  {
    key: 'documents.core',
    name: 'Document Management',
    description: 'Document generator, templates, and storage',
    category: 'documents',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true
  },

  // Analytics & Automation
  {
    key: 'analytics.core',
    name: 'Operational Analytics',
    description: 'Basic school operational reports and charts',
    category: 'analytics',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true
  },
  {
    key: 'analytics.advanced',
    name: 'Advanced Analytics',
    description: 'Retention metrics, cross-department insights',
    category: 'analytics',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: false,
    dependsOn: ['analytics.core']
  },
  {
    key: 'automation.core',
    name: 'Workflow Automation',
    description: 'Configurable automated event triggers and rules',
    category: 'automation',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true
  },

  // Staff Operations
  {
    key: 'staff_operations.core',
    name: 'Staff Operations & Timesheets',
    description: 'Timesheet logging, verification, and workload tracking',
    category: 'staff',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true
  },

  // Portals
  {
    key: 'guardian_portal',
    name: 'Guardian Portal',
    description: 'External parent self-service portal',
    category: 'portals',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true
  },
  {
    key: 'learner_portal',
    name: 'Learner Portal',
    description: 'Student self-service portal',
    category: 'portals',
    featureType: 'boolean',
    featureStatus: 'experimental',
    defaultEnabled: false
  },

  // Integrations
  {
    key: 'integrations.email',
    name: 'Email Integration',
    description: 'Direct transactional email provider integration',
    category: 'integrations',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true
  },
  {
    key: 'integrations.sms',
    name: 'SMS Integration',
    description: 'Transactional SMS gateway integration',
    category: 'integrations',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: false
  },
  {
    key: 'integrations.whatsapp',
    name: 'WhatsApp Integration',
    description: 'Direct WhatsApp communication gateway',
    category: 'integrations',
    featureType: 'boolean',
    featureStatus: 'experimental',
    defaultEnabled: false
  },
  {
    key: 'integrations.payments',
    name: 'Payment Gateway',
    description: 'Online parent fee payment collection integration',
    category: 'integrations',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: false,
    dependsOn: ['finance.core']
  },
  {
    key: 'integrations.calendar',
    name: 'Calendar Sync',
    description: 'External iCal and Google Calendar feeds',
    category: 'integrations',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: false
  },

  // Platform & API
  {
    key: 'platform.advanced_exports',
    name: 'Advanced Data Exports',
    description: 'Bulk CSV, JSON, and compliance export engines',
    category: 'platform',
    featureType: 'boolean',
    featureStatus: 'active',
    defaultEnabled: true
  },
  {
    key: 'api.access',
    name: 'Developer API Access',
    description: 'Programmatic API tokens and webhook access',
    category: 'platform',
    featureType: 'boolean',
    featureStatus: 'experimental',
    defaultEnabled: false
  },

  // Feature Limits Foundations (SaaS 2A)
  {
    key: 'limits.learners',
    name: 'Maximum Active Learners',
    description: 'Maximum number of active learner profiles permitted',
    category: 'core',
    featureType: 'limit',
    featureStatus: 'active',
    defaultEnabled: true
  },
  {
    key: 'limits.staff_users',
    name: 'Maximum Staff Users',
    description: 'Maximum number of staff user seats',
    category: 'staff',
    featureType: 'limit',
    featureStatus: 'active',
    defaultEnabled: true
  },
  {
    key: 'limits.storage_mb',
    name: 'Document Storage (MB)',
    description: 'Cloud document and asset storage limit in Megabytes',
    category: 'documents',
    featureType: 'limit',
    featureStatus: 'active',
    defaultEnabled: true
  },
  {
    key: 'limits.monthly_communications',
    name: 'Monthly Communications Limit',
    description: 'Monthly outgoing message quota',
    category: 'communication',
    featureType: 'limit',
    featureStatus: 'active',
    defaultEnabled: true
  },
  {
    key: 'limits.automation_runs',
    name: 'Monthly Automation Executions',
    description: 'Monthly limit on automated rule triggers',
    category: 'automation',
    featureType: 'limit',
    featureStatus: 'active',
    defaultEnabled: true
  }
];

export function validateFeatureDependencies(
  features: string[] | Record<string, boolean | { enabled: boolean }>
): {
  valid: boolean;
  missingDependencies: { feature: string; required: string }[];
  errors: string[];
} {
  let enabledList: string[];
  if (Array.isArray(features)) {
    enabledList = features;
  } else {
    enabledList = Object.entries(features)
      .filter(([, val]) => (typeof val === 'boolean' ? val : val?.enabled))
      .map(([k]) => k);
  }

  const missing: { feature: string; required: string }[] = [];
  const errors: string[] = [];
  const enabledSet = new Set(enabledList);

  for (const feature of enabledList) {
    const required = FEATURE_DEPENDENCY_GRAPH[feature];
    if (required) {
      for (const req of required) {
        if (!enabledSet.has(req)) {
          missing.push({ feature, required: req });
          errors.push(`Feature '${feature}' requires '${req}', but '${req}' is not enabled.`);
        }
      }
    }
  }

  return {
    valid: missing.length === 0,
    missingDependencies: missing,
    errors
  };
}
