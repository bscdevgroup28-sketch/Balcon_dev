"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectFile = exports.Material = exports.Order = exports.Quote = exports.Project = exports.User = void 0;
const User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
const Project_1 = require("./Project");
Object.defineProperty(exports, "Project", { enumerable: true, get: function () { return Project_1.Project; } });
const Quote_1 = require("./Quote");
Object.defineProperty(exports, "Quote", { enumerable: true, get: function () { return Quote_1.Quote; } });
const Order_1 = require("./Order");
Object.defineProperty(exports, "Order", { enumerable: true, get: function () { return Order_1.Order; } });
const Material_1 = require("./Material");
Object.defineProperty(exports, "Material", { enumerable: true, get: function () { return Material_1.Material; } });
const ProjectFile_1 = require("./ProjectFile");
Object.defineProperty(exports, "ProjectFile", { enumerable: true, get: function () { return ProjectFile_1.ProjectFile; } });
// Define associations
User_1.User.hasMany(Project_1.Project, { foreignKey: 'userId', as: 'projects' });
Project_1.Project.belongsTo(User_1.User, { foreignKey: 'userId', as: 'user' });
// Sales rep assignment associations
User_1.User.hasMany(Project_1.Project, { foreignKey: 'assignedSalesRepId', as: 'assignedProjects' });
Project_1.Project.belongsTo(User_1.User, { foreignKey: 'assignedSalesRepId', as: 'assignedSalesRep' });
User_1.User.hasMany(Quote_1.Quote, { foreignKey: 'userId', as: 'quotes' });
Quote_1.Quote.belongsTo(User_1.User, { foreignKey: 'userId', as: 'user' });
Project_1.Project.hasMany(Quote_1.Quote, { foreignKey: 'projectId', as: 'quotes' });
Quote_1.Quote.belongsTo(Project_1.Project, { foreignKey: 'projectId', as: 'project' });
User_1.User.hasMany(Order_1.Order, { foreignKey: 'userId', as: 'orders' });
Order_1.Order.belongsTo(User_1.User, { foreignKey: 'userId', as: 'user' });
Project_1.Project.hasMany(Order_1.Order, { foreignKey: 'projectId', as: 'orders' });
Order_1.Order.belongsTo(Project_1.Project, { foreignKey: 'projectId', as: 'project' });
Quote_1.Quote.hasMany(Order_1.Order, { foreignKey: 'quoteId', as: 'orders' });
Order_1.Order.belongsTo(Quote_1.Quote, { foreignKey: 'quoteId', as: 'quote' });
// ProjectFile associations
Project_1.Project.hasMany(ProjectFile_1.ProjectFile, { foreignKey: 'projectId', as: 'files' });
(0, ProjectFile_1.defineProjectFileAssociations)();
exports.default = {
    User: User_1.User,
    Project: Project_1.Project,
    Quote: Quote_1.Quote,
    Order: Order_1.Order,
    Material: Material_1.Material,
};
