// Export enhanced user model as canonical User for unified feature set
import { User as UserEnhanced } from './UserEnhanced';
// Preserve legacy simple User model (optional) only if needed elsewhere
// import { User as BasicUser } from './User';
import { Project } from './Project';
import { Quote } from './Quote';
import { Order } from './Order';
import { Material } from './Material';
import { WorkOrder } from './WorkOrder';
import { EventLog } from './EventLog';
import { ProjectFile, defineProjectFileAssociations } from './ProjectFile';
import { InventoryTransaction } from './InventoryTransaction';
import { KpiDailySnapshot } from './KpiDailySnapshot';
import { ExportJob } from './ExportJob';
import { DownloadToken } from './DownloadToken';
import { WebhookSubscription } from './WebhookSubscription';
import { WebhookDelivery } from './WebhookDelivery';
import { JobRecord } from './JobRecord';
import { CustomerApprovalToken } from './CustomerApprovalToken';
import { ChangeOrder } from './ChangeOrder';
import { Invoice } from './Invoice';
import { PurchaseOrder } from './PurchaseOrder';

// Define associations
UserEnhanced.hasMany(Project, { foreignKey: 'userId', as: 'projects' });
Project.belongsTo(UserEnhanced, { foreignKey: 'userId', as: 'user' });

// Sales rep assignment associations
UserEnhanced.hasMany(Project, { foreignKey: 'assignedSalesRepId', as: 'assignedProjects' });
Project.belongsTo(UserEnhanced, { foreignKey: 'assignedSalesRepId', as: 'assignedSalesRep' });

UserEnhanced.hasMany(Quote, { foreignKey: 'userId', as: 'quotes' });
Quote.belongsTo(UserEnhanced, { foreignKey: 'userId', as: 'user' });

Project.hasMany(Quote, { foreignKey: 'projectId', as: 'quotes' });
Quote.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

UserEnhanced.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(UserEnhanced, { foreignKey: 'userId', as: 'user' });

Project.hasMany(Order, { foreignKey: 'projectId', as: 'orders' });
Order.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Quote.hasMany(Order, { foreignKey: 'quoteId', as: 'orders' });
Order.belongsTo(Quote, { foreignKey: 'quoteId', as: 'quote' });

// ChangeOrder associations
Project.hasMany(ChangeOrder, { foreignKey: 'projectId', as: 'changeOrders' });
ChangeOrder.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
ChangeOrder.belongsTo(UserEnhanced, { foreignKey: 'createdByUserId', as: 'createdBy' });
ChangeOrder.belongsTo(UserEnhanced, { foreignKey: 'approvedByUserId', as: 'approvedBy' });
ChangeOrder.belongsTo(Quote, { foreignKey: 'quoteId', as: 'quote' });

// Invoice associations
Project.hasMany(Invoice, { foreignKey: 'projectId', as: 'invoices' });
Invoice.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// ProjectFile associations
Project.hasMany(ProjectFile, { foreignKey: 'projectId', as: 'files' });
defineProjectFileAssociations();

export {
  UserEnhanced as User,
  Project,
  Quote,
  Order,
  Material,
  ProjectFile,
  WorkOrder,
  EventLog,
  InventoryTransaction,
  KpiDailySnapshot,
  ExportJob,
  DownloadToken,
  WebhookSubscription,
  WebhookDelivery,
  JobRecord,
  CustomerApprovalToken,
  ChangeOrder,
  Invoice,
  PurchaseOrder,
};

export default {
  User: UserEnhanced,
  Project,
  Quote,
  Order,
  Material,
  WorkOrder,
  EventLog,
  InventoryTransaction,
  KpiDailySnapshot,
  ExportJob,
  DownloadToken,
  WebhookSubscription,
  WebhookDelivery,
  JobRecord,
  CustomerApprovalToken,
  ChangeOrder,
  Invoice,
  PurchaseOrder,
};
