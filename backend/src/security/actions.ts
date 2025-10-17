// Centralized action identifiers to avoid string literal drift and enable test matrix coverage
export const Actions = Object.freeze({
  PROJECT_CREATE: 'project.create',
  PROJECT_UPDATE: 'project.update',
  PROJECT_DELETE: 'project.delete',
  PROJECT_READ: 'project.read',
  ORDER_CREATE: 'order.create',
  ORDER_UPDATE: 'order.update',
  ORDER_DELETE: 'order.delete',
  USER_LIST: 'user.list',
  USER_CREATE: 'user.create',
  USER_DELETE: 'user.delete',
  FEATURE_FLAG_LIST: 'feature.flag.list',
  FEATURE_FLAG_UPSERT: 'feature.flag.upsert',
  INVENTORY_TRANSACTION_CREATE: 'inventory.transaction.create',
  WORK_ORDER_CREATE: 'work_order.create',
  WORK_ORDER_UPDATE: 'work_order.update'
} as const);

export type ActionValue = typeof Actions[keyof typeof Actions];
