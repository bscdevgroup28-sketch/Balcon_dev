"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoDataService = void 0;
const User_1 = require("../models/User");
const Project_1 = require("../models/Project");
const Quote_1 = require("../models/Quote");
const sequelize_1 = require("sequelize");
class DemoDataService {
    /**
     * Create demo projects with realistic data for all role types
     */
    static async createDemoProjects() {
        const demoProjects = [
            {
                title: 'Heritage Mall Renovation',
                description: 'Complete structural renovation of heritage shopping mall including new steel framework, modern HVAC integration, and seismic upgrades.',
                clientName: 'Johnson Construction',
                clientEmail: 'project.manager@johnsonconstruction.com',
                clientPhone: '+1-555-2001',
                status: 'in_progress',
                budget: 850000,
                startDate: new Date('2025-06-15'),
                endDate: new Date('2025-09-15'),
                address: '1247 Heritage Ave, Downtown Metro City',
                projectType: 'Commercial Renovation'
            },
            {
                title: 'Downtown Office Complex',
                description: 'New 12-story office building with advanced steel and glass curtain wall system, underground parking structure, and rooftop amenities.',
                clientName: 'Metro Development Group',
                clientEmail: 'development@metrogroup.com',
                clientPhone: '+1-555-2002',
                status: 'in_progress',
                budget: 1200000,
                startDate: new Date('2025-07-01'),
                endDate: new Date('2025-11-30'),
                address: '789 Business District Blvd, Metro City',
                projectType: 'New Construction'
            },
            {
                title: 'Industrial Warehouse Expansion',
                description: 'Large-scale warehouse expansion including automated storage systems, loading dock improvements, and office space integration.',
                clientName: 'Storage Solutions Inc',
                clientEmail: 'operations@storagesolutions.com',
                clientPhone: '+1-555-2003',
                status: 'in_progress',
                budget: 650000,
                startDate: new Date('2025-05-20'),
                endDate: new Date('2025-08-30'),
                address: '3456 Industrial Park Way, Metro City',
                projectType: 'Industrial Expansion'
            },
            {
                title: 'Luxury Residential High-Rise',
                description: 'Premium 24-story residential tower with luxury amenities, underground parking, and sustainable building features.',
                clientName: 'Prestige Properties',
                clientEmail: 'projects@prestigeproperties.com',
                clientPhone: '+1-555-2004',
                status: 'approved',
                budget: 2100000,
                startDate: new Date('2025-09-01'),
                endDate: new Date('2026-02-28'),
                address: '567 Luxury Lane, Uptown Metro City',
                projectType: 'Residential Construction'
            },
            {
                title: 'Municipal Bridge Repair',
                description: 'Critical structural repairs and reinforcement of main city bridge including deck replacement and expansion joint renewal.',
                clientName: 'Metro City Public Works',
                clientEmail: 'engineering@metrocity.gov',
                clientPhone: '+1-555-2005',
                status: 'quote_sent',
                budget: 950000,
                address: 'Main Street Bridge, Metro City',
                projectType: 'Infrastructure Repair'
            },
            {
                title: 'University Science Building',
                description: 'New 6-story science and research facility with specialized laboratory spaces, clean rooms, and advanced ventilation systems.',
                clientName: 'Metro University',
                clientEmail: 'facilities@metrouniversity.edu',
                clientPhone: '+1-555-2006',
                status: 'inquiry',
                budget: 1750000,
                address: '123 University Campus Dr, Metro City',
                projectType: 'Educational Facility'
            },
            {
                title: 'Retail Shopping Center',
                description: 'Modern open-air shopping center with anchor stores, restaurant spaces, and covered pedestrian walkways.',
                clientName: 'Retail Ventures LLC',
                clientEmail: 'development@retailventures.com',
                clientPhone: '+1-555-2007',
                status: 'completed',
                budget: 780000,
                startDate: new Date('2025-02-01'),
                endDate: new Date('2025-06-30'),
                address: '890 Shopping Plaza Dr, Suburb Metro City',
                projectType: 'Retail Construction'
            },
            {
                title: 'Hospital Emergency Wing',
                description: 'Critical care facility expansion including emergency departments, surgical suites, and patient recovery areas.',
                clientName: 'Metro General Hospital',
                clientEmail: 'construction@metrohospital.org',
                clientPhone: '+1-555-2008',
                status: 'approved',
                budget: 1450000,
                startDate: new Date('2025-08-15'),
                endDate: new Date('2025-12-15'),
                address: '456 Medical Center Dr, Metro City',
                projectType: 'Healthcare Facility'
            }
        ];
        // Create projects in database
        for (const projectData of demoProjects) {
            await Project_1.Project.create(projectData);
        }
        console.log(`Created ${demoProjects.length} demo projects`);
    }
    /**
     * Create demo quotes for existing projects
     */
    static async createDemoQuotes() {
        const projects = await Project_1.Project.findAll();
        const demoQuotes = [
            {
                totalAmount: 850000,
                laborCost: 425000,
                materialCost: 425000,
                status: 'approved',
                validUntil: new Date('2025-09-01'),
                notes: 'Includes all materials, labor, and project management. Payment terms: 30% upfront, 40% at 50% completion, 30% upon completion.'
            },
            {
                totalAmount: 1200000,
                laborCost: 600000,
                materialCost: 600000,
                status: 'approved',
                validUntil: new Date('2025-09-15'),
                notes: 'Premium steel and glass systems. Includes 2-year warranty on all structural components.'
            },
            {
                totalAmount: 650000,
                laborCost: 300000,
                materialCost: 350000,
                status: 'approved',
                validUntil: new Date('2025-08-15'),
                notes: 'Industrial-grade materials and specialized equipment installation included.'
            },
            {
                totalAmount: 2100000,
                laborCost: 1050000,
                materialCost: 1050000,
                status: 'sent',
                validUntil: new Date('2025-09-30'),
                notes: 'Luxury finishes and premium materials. Expedited timeline available for additional 10%.'
            },
            {
                totalAmount: 950000,
                laborCost: 475000,
                materialCost: 475000,
                status: 'sent',
                validUntil: new Date('2025-08-25'),
                notes: 'Municipal project with prevailing wage requirements. Timeline subject to weather conditions.'
            },
            {
                totalAmount: 1750000,
                laborCost: 875000,
                materialCost: 875000,
                status: 'draft',
                validUntil: new Date('2025-10-01'),
                notes: 'Educational facility with specialized laboratory infrastructure requirements.'
            },
            {
                totalAmount: 780000,
                laborCost: 390000,
                materialCost: 390000,
                status: 'approved',
                validUntil: new Date('2025-07-01'),
                notes: 'Project completed successfully with client satisfaction. Available as reference.'
            },
            {
                totalAmount: 1450000,
                laborCost: 725000,
                materialCost: 725000,
                status: 'approved',
                validUntil: new Date('2025-10-15'),
                notes: 'Healthcare facility with strict regulatory compliance requirements and sterile construction protocols.'
            }
        ];
        // Create quotes for each project
        for (let i = 0; i < Math.min(projects.length, demoQuotes.length); i++) {
            const quoteData = {
                projectId: projects[i].id,
                ...demoQuotes[i]
            };
            await Quote_1.Quote.create(quoteData);
        }
        console.log(`Created ${Math.min(projects.length, demoQuotes.length)} demo quotes`);
    }
    /**
     * Get role-specific demo data for dashboards
     */
    static getDemoMetrics(role) {
        const baseDate = new Date();
        switch (role) {
            case 'owner':
                return {
                    totalRevenue: 8750000,
                    monthlyRevenue: 1250000,
                    activeProjects: 8,
                    completedProjects: 24,
                    profitMargin: 18.5,
                    clientSatisfaction: 96.2,
                    employeeCount: 42,
                    equipmentUtilization: 87.3
                };
            case 'office_manager':
                return {
                    pendingQuotes: 12,
                    activeProjects: 8,
                    overdueInvoices: 3,
                    newLeads: 15,
                    staffSchedule: 95,
                    documentsPending: 7,
                    clientMeetings: 6,
                    contractsToReview: 4
                };
            case 'shop_manager':
                return {
                    activeJobs: 6,
                    equipmentUtilization: 87,
                    safetyScore: 94,
                    qualityScore: 96,
                    productionEfficiency: 89,
                    pendingMaintenance: 3,
                    workstationsActive: 5,
                    dailyOutput: 12
                };
            case 'project_manager':
                return {
                    activeProjects: 5,
                    onTimeProjects: 4,
                    totalBudget: 2450000,
                    budgetUtilization: 73,
                    teamMembers: 18,
                    upcomingMilestones: 7,
                    riskAlerts: 3,
                    clientApprovals: 2
                };
            case 'team_leader':
                return {
                    teamSize: 8,
                    activeAssignments: 12,
                    completedToday: 6,
                    teamEfficiency: 94,
                    upcomingDeadlines: 4,
                    teamMorale: 88,
                    safetyIncidents: 0,
                    trainingHours: 24
                };
            case 'technician':
                return {
                    assignedTasks: 5,
                    completedToday: 3,
                    hoursWorked: 6.5,
                    efficiency: 92,
                    currentProject: 'BC-2025-023',
                    nextDeadline: '2:30 PM',
                    toolsAssigned: 15,
                    certificationsActive: 6
                };
            default:
                return {};
        }
    }
    /**
     * Initialize all demo data
     */
    static async initializeDemoData() {
        try {
            console.log('Starting demo data initialization...');
            await this.createDemoProjects();
            await this.createDemoQuotes();
            console.log('Demo data initialization completed successfully!');
        }
        catch (error) {
            console.error('Error initializing demo data:', error);
            throw error;
        }
    }
    /**
     * Clear all demo data (for testing/reset purposes)
     */
    static async clearDemoData() {
        try {
            await Quote_1.Quote.destroy({ where: {} });
            await Project_1.Project.destroy({ where: {} });
            // Remove demo users
            await User_1.User.destroy({
                where: {
                    email: {
                        [sequelize_1.Op.in]: [
                            'owner@balconbuilders.com',
                            'office@balconbuilders.com',
                            'shop@balconbuilders.com',
                            'project@balconbuilders.com',
                            'team@balconbuilders.com',
                            'tech@balconbuilders.com'
                        ]
                    }
                }
            });
            console.log('Demo data cleared successfully!');
        }
        catch (error) {
            console.error('Error clearing demo data:', error);
            throw error;
        }
    }
}
exports.DemoDataService = DemoDataService;
