import { User } from './User';
import { Project } from './Project';
import { Quote } from './Quote';
import { Order } from './Order';
import { Material } from './Material';
import { ProjectFile, defineProjectFileAssociations } from './ProjectFile';

// Define associations
User.hasMany(Project, { foreignKey: 'userId', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Sales rep assignment associations
User.hasMany(Project, { foreignKey: 'assignedSalesRepId', as: 'assignedProjects' });
Project.belongsTo(User, { foreignKey: 'assignedSalesRepId', as: 'assignedSalesRep' });

User.hasMany(Quote, { foreignKey: 'userId', as: 'quotes' });
Quote.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Project.hasMany(Quote, { foreignKey: 'projectId', as: 'quotes' });
Quote.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Project.hasMany(Order, { foreignKey: 'projectId', as: 'orders' });
Order.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Quote.hasMany(Order, { foreignKey: 'quoteId', as: 'orders' });
Order.belongsTo(Quote, { foreignKey: 'quoteId', as: 'quote' });

// ProjectFile associations
Project.hasMany(ProjectFile, { foreignKey: 'projectId', as: 'files' });
defineProjectFileAssociations();

export {
  User,
  Project,
  Quote,
  Order,
  Material,
  ProjectFile,
};

export default {
  User,
  Project,
  Quote,
  Order,
  Material,
};
