/**
 * A map of keys used for preview features.
 */
export enum PREVIEW_FEATURE_KEYS {
  DASHBOARD = 'dashboard',
  EXPENSE_PIPELINE = 'EXPENSE_PIPELINE',
  DYNAMIC_TOP_BAR = 'DYNAMIC_TOP_BAR',
  COLLECTIVE_OVERVIEW = 'COLLECTIVE_OVERVIEW',
}

export type PreviewFeature = {
  key: PREVIEW_FEATURE_KEYS | `${PREVIEW_FEATURE_KEYS}`;
  title: string;
  description?: string;
  publicBeta: boolean; // If true, the feature will be available to toggle for all users.
  closedBetaAccessFor?: string[]; // Account slugs. Members and admins of these accounts will see this feature as a Closed Beta preview in the Preview Features modal.
  enabledByDefaultFor?: ('*' | string)[]; // Account slugs. Members and admins of these accounts will have the feature enabled by default.
  env?: Array<'development' | 'test' | 'e2e' | 'staging' | 'production'>; // If set, the feature will be available only in the specified environments.
  alwaysEnableInDev?: boolean; // If true, the feature will be enabled by default in development.
  dependsOn?: PREVIEW_FEATURE_KEYS;
};

/**
 * List of current preview features.
 */
export const previewFeatures: PreviewFeature[] = [
  {
    key: PREVIEW_FEATURE_KEYS.DASHBOARD,
    title: 'Dashboard',
    description:
      'A central space to keep on top of everything you do in Open Collective, from tracking your expenses to managing organizations.',
    publicBeta: true,
    enabledByDefaultFor: ['*'],
    env: ['development', 'staging', 'production'],
  },
  {
    key: PREVIEW_FEATURE_KEYS.DYNAMIC_TOP_BAR,
    title: 'Dynamic top bar',
    publicBeta: false,
    dependsOn: PREVIEW_FEATURE_KEYS.DASHBOARD,
  },
  {
    key: PREVIEW_FEATURE_KEYS.EXPENSE_PIPELINE,
    title: 'Host Expense Pipeline',
    description: 'Introducing tabs in the host expenses dashboard to help you manage paying expenses.',
    publicBeta: false,
    closedBetaAccessFor: ['opencollective', 'opensource', 'foundation', 'europe', 'design', 'engineering'],
  },
  {
    key: PREVIEW_FEATURE_KEYS.COLLECTIVE_OVERVIEW,
    title: 'Collective Overview',
    description: 'Overview page for Collectives in Dashboard',
    publicBeta: true,
    alwaysEnableInDev: true,
    enabledByDefaultFor: ['*'],
    closedBetaAccessFor: ['opencollective', 'opensource', 'foundation', 'europe', 'design', 'engineering'],
  },
];
