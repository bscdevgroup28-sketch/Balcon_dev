import { DataTypes } from 'sequelize';

// Baseline schema migration (snapshot). Future changes should be incremental.
// NOTE: If tables already exist (dev/test), this migration should be considered applied manually; ensure fresh environments run migrations from scratch.

export async function up(qi: any) {
  // Collect existing tables once for idempotency. Different dialects may return case variations; normalize to lowercase.
  let existing: string[] = [];
  try {
    const tables = await qi.showAllTables();
    existing = (tables || []).map((t: any) => (typeof t === 'string' ? t : '')).filter(Boolean).map((t: string) => t.toLowerCase());
  } catch { /* ignore – fallback to attempt creation */ }

  const hasTable = (name: string) => existing.includes(name.toLowerCase());

  async function safeCreateTable(name: string, attrs: any) {
    if (hasTable(name)) {
      // eslint-disable-next-line no-console
      console.info(`[baseline-migration] Table ${name} already exists – skipping creation`);
      return false;
    }
    await qi.createTable(name, attrs);
    existing.push(name.toLowerCase());
    return true;
  }

  async function safeAddIndex(table: string, cols: string[]) {
    try {
      await qi.addIndex(table, cols);
    } catch (err: any) {
      const msg = err?.message || '';
      if (/already exists|duplicate/i.test(msg)) {
        // eslint-disable-next-line no-console
        console.info(`[baseline-migration] Index on ${table}(${cols.join(',')}) already exists – skipping`);
        return;
      }
      // Re-throw non-duplicate errors.
      throw err;
    }
  }

  // Users (enhanced)
  await safeCreateTable('users', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    firstName: { type: DataTypes.STRING(100), allowNull: false },
    lastName: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    role: { type: DataTypes.STRING(50), allowNull: false },
    permissions: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
    passwordHash: { type: DataTypes.STRING(255), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true }
  });
  if (hasTable('users')) {
    await safeAddIndex('users', ['email']);
  }

  // Projects
  await safeCreateTable('projects', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    assignedSalesRepId: { type: DataTypes.INTEGER, allowNull: true },
    inquiryNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    projectType: { type: DataTypes.STRING(50), allowNull: false },
    status: { type: DataTypes.STRING(50), allowNull: false },
    priority: { type: DataTypes.STRING(50), allowNull: false },
    requirements: { type: DataTypes.TEXT, allowNull: false, defaultValue: '{}' },
    materials: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    targetCompletionDate: { type: DataTypes.DATE, allowNull: true },
    actualCompletionDate: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  if (hasTable('projects')) {
    await safeAddIndex('projects', ['inquiryNumber']);
    await safeAddIndex('projects', ['userId']);
    await safeAddIndex('projects', ['assignedSalesRepId']);
  }

  // Quotes
  await safeCreateTable('quotes', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    quoteNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    status: { type: DataTypes.STRING(50), allowNull: false },
    items: { type: DataTypes.TEXT, allowNull: false },
    subtotal: { type: DataTypes.FLOAT, allowNull: false },
    taxAmount: { type: DataTypes.FLOAT, allowNull: false },
    totalAmount: { type: DataTypes.FLOAT, allowNull: false },
    validUntil: { type: DataTypes.DATE, allowNull: false },
    terms: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    taxRate: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.0825 },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  if (hasTable('quotes')) {
    await safeAddIndex('quotes', ['quoteNumber']);
    await safeAddIndex('quotes', ['projectId']);
    await safeAddIndex('quotes', ['userId']);
  }

  // Orders
  await safeCreateTable('orders', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    quoteId: { type: DataTypes.INTEGER, allowNull: true },
    orderNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    status: { type: DataTypes.STRING(50), allowNull: false },
    items: { type: DataTypes.TEXT, allowNull: false },
    subtotal: { type: DataTypes.FLOAT, allowNull: false },
    taxAmount: { type: DataTypes.FLOAT, allowNull: false },
    totalAmount: { type: DataTypes.FLOAT, allowNull: false },
    amountPaid: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    priority: { type: DataTypes.STRING(50), allowNull: false },
    estimatedDelivery: { type: DataTypes.DATE, allowNull: true },
    confirmedAt: { type: DataTypes.DATE, allowNull: true },
    shippedAt: { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  if (hasTable('orders')) {
    await safeAddIndex('orders', ['orderNumber']);
    await safeAddIndex('orders', ['projectId']);
    await safeAddIndex('orders', ['userId']);
  }

  // Work Orders
  await safeCreateTable('work_orders', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    priority: { type: DataTypes.STRING(20), allowNull: false },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pending' },
    estimatedHours: { type: DataTypes.FLOAT, allowNull: true },
    actualHours: { type: DataTypes.FLOAT, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    assignedUserId: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  if (hasTable('work_orders')) {
    await safeAddIndex('work_orders', ['projectId']);
    await safeAddIndex('work_orders', ['assignedUserId']);
  }

  // Sequences
  await safeCreateTable('sequences', {
    name: { type: DataTypes.STRING(100), primaryKey: true },
    nextValue: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 1 },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
}

export async function down(qi: any) {
  await qi.dropTable('sequences');
  await qi.dropTable('work_orders');
  await qi.dropTable('orders');
  await qi.dropTable('quotes');
  await qi.dropTable('projects');
  await qi.dropTable('users');
}
