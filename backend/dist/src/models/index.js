"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRecord = exports.WebhookDelivery = exports.WebhookSubscription = exports.DownloadToken = exports.ExportJob = exports.KpiDailySnapshot = exports.InventoryTransaction = exports.EventLog = exports.WorkOrder = exports.ProjectFile = exports.Material = exports.Order = exports.Quote = exports.Project = exports.User = void 0;
// Export enhanced user model as canonical User for unified feature set
const UserEnhanced_1 = require("./UserEnhanced");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return UserEnhanced_1.User; } });
// Preserve legacy simple User model (optional) only if needed elsewhere
// import { User as BasicUser } from './User';
const Project_1 = require("./Project");
Object.defineProperty(exports, "Project", { enumerable: true, get: function () { return Project_1.Project; } });
const Quote_1 = require("./Quote");
Object.defineProperty(exports, "Quote", { enumerable: true, get: function () { return Quote_1.Quote; } });
const Order_1 = require("./Order");
Object.defineProperty(exports, "Order", { enumerable: true, get: function () { return Order_1.Order; } });
const Material_1 = require("./Material");
Object.defineProperty(exports, "Material", { enumerable: true, get: function () { return Material_1.Material; } });
const WorkOrder_1 = require("./WorkOrder");
Object.defineProperty(exports, "WorkOrder", { enumerable: true, get: function () { return WorkOrder_1.WorkOrder; } });
const EventLog_1 = require("./EventLog");
Object.defineProperty(exports, "EventLog", { enumerable: true, get: function () { return EventLog_1.EventLog; } });
const ProjectFile_1 = require("./ProjectFile");
Object.defineProperty(exports, "ProjectFile", { enumerable: true, get: function () { return ProjectFile_1.ProjectFile; } });
const InventoryTransaction_1 = require("./InventoryTransaction");
Object.defineProperty(exports, "InventoryTransaction", { enumerable: true, get: function () { return InventoryTransaction_1.InventoryTransaction; } });
const KpiDailySnapshot_1 = require("./KpiDailySnapshot");
Object.defineProperty(exports, "KpiDailySnapshot", { enumerable: true, get: function () { return KpiDailySnapshot_1.KpiDailySnapshot; } });
const ExportJob_1 = require("./ExportJob");
Object.defineProperty(exports, "ExportJob", { enumerable: true, get: function () { return ExportJob_1.ExportJob; } });
const DownloadToken_1 = require("./DownloadToken");
Object.defineProperty(exports, "DownloadToken", { enumerable: true, get: function () { return DownloadToken_1.DownloadToken; } });
const WebhookSubscription_1 = require("./WebhookSubscription");
Object.defineProperty(exports, "WebhookSubscription", { enumerable: true, get: function () { return WebhookSubscription_1.WebhookSubscription; } });
const WebhookDelivery_1 = require("./WebhookDelivery");
Object.defineProperty(exports, "WebhookDelivery", { enumerable: true, get: function () { return WebhookDelivery_1.WebhookDelivery; } });
const JobRecord_1 = require("./JobRecord");
Object.defineProperty(exports, "JobRecord", { enumerable: true, get: function () { return JobRecord_1.JobRecord; } });
// Define associations
UserEnhanced_1.User.hasMany(Project_1.Project, { foreignKey: 'userId', as: 'projects' });
Project_1.Project.belongsTo(UserEnhanced_1.User, { foreignKey: 'userId', as: 'user' });
// Sales rep assignment associations
UserEnhanced_1.User.hasMany(Project_1.Project, { foreignKey: 'assignedSalesRepId', as: 'assignedProjects' });
Project_1.Project.belongsTo(UserEnhanced_1.User, { foreignKey: 'assignedSalesRepId', as: 'assignedSalesRep' });
UserEnhanced_1.User.hasMany(Quote_1.Quote, { foreignKey: 'userId', as: 'quotes' });
Quote_1.Quote.belongsTo(UserEnhanced_1.User, { foreignKey: 'userId', as: 'user' });
Project_1.Project.hasMany(Quote_1.Quote, { foreignKey: 'projectId', as: 'quotes' });
Quote_1.Quote.belongsTo(Project_1.Project, { foreignKey: 'projectId', as: 'project' });
UserEnhanced_1.User.hasMany(Order_1.Order, { foreignKey: 'userId', as: 'orders' });
Order_1.Order.belongsTo(UserEnhanced_1.User, { foreignKey: 'userId', as: 'user' });
Project_1.Project.hasMany(Order_1.Order, { foreignKey: 'projectId', as: 'orders' });
Order_1.Order.belongsTo(Project_1.Project, { foreignKey: 'projectId', as: 'project' });
Quote_1.Quote.hasMany(Order_1.Order, { foreignKey: 'quoteId', as: 'orders' });
Order_1.Order.belongsTo(Quote_1.Quote, { foreignKey: 'quoteId', as: 'quote' });
// ProjectFile associations
Project_1.Project.hasMany(ProjectFile_1.ProjectFile, { foreignKey: 'projectId', as: 'files' });
(0, ProjectFile_1.defineProjectFileAssociations)();
exports.default = {
    User: UserEnhanced_1.User,
    Project: Project_1.Project,
    Quote: Quote_1.Quote,
    Order: Order_1.Order,
    Material: Material_1.Material,
    WorkOrder: WorkOrder_1.WorkOrder,
    EventLog: EventLog_1.EventLog,
    InventoryTransaction: InventoryTransaction_1.InventoryTransaction,
    KpiDailySnapshot: KpiDailySnapshot_1.KpiDailySnapshot,
    ExportJob: ExportJob_1.ExportJob,
    DownloadToken: DownloadToken_1.DownloadToken,
    WebhookSubscription: WebhookSubscription_1.WebhookSubscription,
    WebhookDelivery: WebhookDelivery_1.WebhookDelivery,
    JobRecord: JobRecord_1.JobRecord,
};
