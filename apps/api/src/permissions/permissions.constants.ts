export const OPERIX_MODULES = [
  'CRM','DEBTS','PAYMENTS','REPORTS','INVENTORY','QR','POS','DDS','ANALYTICS','DELIVERY','HR','SERVICE','MARKETING','CALL_CENTER','BILLING','SETTINGS'
] as const;

export type OperixModule = (typeof OPERIX_MODULES)[number];

export const ROLE_PERMISSION_PRESETS: Record<string, Record<string, { canView: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }>> = {
  OWNER: Object.fromEntries(OPERIX_MODULES.map((m) => [m, { canView: true, canCreate: true, canUpdate: true, canDelete: true }])),
  MANAGER: {
    CRM: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
    DEBTS: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
    PAYMENTS: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
    REPORTS: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
  },
  CASHIER: {
    POS: { canView: true, canCreate: true, canUpdate: false, canDelete: false },
    DDS: { canView: true, canCreate: true, canUpdate: false, canDelete: false },
    PAYMENTS: { canView: true, canCreate: true, canUpdate: false, canDelete: false },
  },
  STOREKEEPER: {
    INVENTORY: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
    QR: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
    REPORTS: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
  },
  HR: {
    HR: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
  },
  ACCOUNTANT: {
    DDS: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
    REPORTS: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
    ANALYTICS: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
  },
};
