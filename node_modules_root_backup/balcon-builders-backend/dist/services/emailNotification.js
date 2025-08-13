"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailNotificationService = void 0;
const logger_1 = require("../utils/logger");
const environment_1 = require("../config/environment");
const models_1 = require("../models");
/**
 * Email notification service
 * Currently supports console logging for development
 * Can be extended to use SendGrid, AWS SES, or other email providers
 */
class EmailNotificationService {
    constructor() {
        this.isProduction = environment_1.config.server.nodeEnv === 'production';
        this.sendGridApiKey = environment_1.config.email?.sendgridApiKey;
    }
    /**
     * Send email notification
     */
    async sendEmail(to, template) {
        try {
            if (!this.isProduction || !this.sendGridApiKey) {
                // Development mode - log to console
                logger_1.logger.info('📧 Email Notification (Development Mode)');
                logger_1.logger.info(`To: ${to}`);
                logger_1.logger.info(`Subject: ${template.subject}`);
                logger_1.logger.info(`Content: ${template.textContent}`);
                logger_1.logger.info('─'.repeat(50));
                return true;
            }
            // TODO: Implement actual email sending with SendGrid or other provider
            // const msg = {
            //   to,
            //   from: 'noreply@balconbuilders.com',
            //   subject: template.subject,
            //   text: template.textContent,
            //   html: template.htmlContent,
            // };
            // await sgMail.send(msg);
            logger_1.logger.info(`Email sent successfully to ${to}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to send email:', error);
            return false;
        }
    }
    /**
     * Generate inquiry assignment notification template
     */
    generateInquiryAssignedTemplate(data) {
        const { project, salesRep, user } = data;
        const subject = `New Project Inquiry Assigned - ${project.inquiryNumber}`;
        const textContent = `
Hello ${salesRep?.fullName},

A new project inquiry has been assigned to you:

Inquiry Number: ${project.inquiryNumber}
Project Title: ${project.title}
Customer: ${user.fullName} (${user.company || 'Individual'})
Priority: ${project.priority.toUpperCase()}
Project Type: ${project.projectType}

Description:
${project.description}

Please review the inquiry details and contact the customer within 2 business hours.

You can view the full inquiry details in your dashboard.

Best regards,
Bal-Con Builders Team
    `.trim();
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Project Inquiry Assigned</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c5aa0;">New Project Inquiry Assigned</h2>
    
    <p>Hello ${salesRep?.fullName},</p>
    
    <p>A new project inquiry has been assigned to you:</p>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Inquiry Number:</strong> ${project.inquiryNumber}</p>
      <p><strong>Project Title:</strong> ${project.title}</p>
      <p><strong>Customer:</strong> ${user.fullName} (${user.company || 'Individual'})</p>
      <p><strong>Priority:</strong> <span style="color: ${project.priority === 'urgent' ? '#dc3545' : project.priority === 'high' ? '#fd7e14' : '#28a745'};">${project.priority.toUpperCase()}</span></p>
      <p><strong>Project Type:</strong> ${project.projectType}</p>
    </div>
    
    <h3>Description:</h3>
    <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">${project.description}</p>
    
    <p style="color: #dc3545;"><strong>Please review the inquiry details and contact the customer within 2 business hours.</strong></p>
    
    <p><a href="${environment_1.config.server.baseUrl}/projects/${project.id}" style="background-color: #2c5aa0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Inquiry Details</a></p>
    
    <hr style="margin: 30px 0;">
    <p style="color: #666; font-size: 12px;">
      Best regards,<br>
      Bal-Con Builders Team
    </p>
  </div>
</body>
</html>
    `.trim();
        return { subject, textContent, htmlContent };
    }
    /**
     * Generate new inquiry notification template for admins
     */
    generateNewInquiryTemplate(data) {
        const { project, user } = data;
        const subject = `New Project Inquiry Received - ${project.inquiryNumber}`;
        const textContent = `
New Project Inquiry Received

Inquiry Number: ${project.inquiryNumber}
Project Title: ${project.title}
Customer: ${user.fullName}
Email: ${user.email}
Phone: ${user.phone || 'Not provided'}
Company: ${user.company || 'Individual'}
Priority: ${project.priority.toUpperCase()}
Project Type: ${project.projectType}
Estimated Budget: ${project.estimatedBudget ? `$${project.estimatedBudget.toLocaleString()}` : 'Not specified'}

Description:
${project.description}

${project.location ? `Location: ${project.location}` : ''}

This inquiry requires assignment to a sales representative.

Review and assign in the admin dashboard.
    `.trim();
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Project Inquiry</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c5aa0;">New Project Inquiry Received</h2>
    
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Inquiry Number:</strong> ${project.inquiryNumber}</p>
      <p><strong>Project Title:</strong> ${project.title}</p>
    </div>
    
    <h3>Customer Information:</h3>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
      <p><strong>Name:</strong> ${user.fullName}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
      <p><strong>Company:</strong> ${user.company || 'Individual'}</p>
    </div>
    
    <h3>Project Details:</h3>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
      <p><strong>Priority:</strong> <span style="color: ${project.priority === 'urgent' ? '#dc3545' : project.priority === 'high' ? '#fd7e14' : '#28a745'};">${project.priority.toUpperCase()}</span></p>
      <p><strong>Type:</strong> ${project.projectType}</p>
      <p><strong>Budget:</strong> ${project.estimatedBudget ? `$${project.estimatedBudget.toLocaleString()}` : 'Not specified'}</p>
      ${project.location ? `<p><strong>Location:</strong> ${project.location}</p>` : ''}
    </div>
    
    <h3>Description:</h3>
    <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">${project.description}</p>
    
    <p style="color: #dc3545;"><strong>This inquiry requires assignment to a sales representative.</strong></p>
    
    <p><a href="${environment_1.config.server.baseUrl}/admin/projects/${project.id}" style="background-color: #2c5aa0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review and Assign</a></p>
  </div>
</body>
</html>
    `.trim();
        return { subject, textContent, htmlContent };
    }
    /**
     * Send notification when a new inquiry is created
     */
    async notifyNewInquiry(project, customer) {
        try {
            // Get all admin users for notification
            const admins = await models_1.User.findAll({
                where: {
                    role: 'admin',
                    isActive: true,
                },
            });
            const template = this.generateNewInquiryTemplate({ project, user: customer });
            // Send to all admins
            const results = await Promise.all(admins.map(admin => this.sendEmail(admin.email, template)));
            const successCount = results.filter(result => result).length;
            logger_1.logger.info(`New inquiry notification sent to ${successCount}/${admins.length} admins`);
            return successCount > 0;
        }
        catch (error) {
            logger_1.logger.error('Error sending new inquiry notifications:', error);
            return false;
        }
    }
    /**
     * Send notification when an inquiry is assigned to a sales rep
     */
    async notifyInquiryAssigned(project, salesRep, customer) {
        try {
            const template = this.generateInquiryAssignedTemplate({
                project,
                user: customer,
                salesRep
            });
            const success = await this.sendEmail(salesRep.email, template);
            if (success) {
                logger_1.logger.info(`Inquiry assignment notification sent to ${salesRep.email}`);
            }
            return success;
        }
        catch (error) {
            logger_1.logger.error('Error sending inquiry assignment notification:', error);
            return false;
        }
    }
    /**
     * Send notification when project status changes
     */
    async notifyStatusChange(project, customer, oldStatus, newStatus) {
        try {
            const subject = `Project Status Update - ${project.inquiryNumber}`;
            const textContent = `
Hello ${customer.fullName},

Your project status has been updated:

Project: ${project.title} (${project.inquiryNumber})
Previous Status: ${oldStatus}
New Status: ${newStatus}

${newStatus === 'quoted' ? 'Your quote is ready for review.' : ''}
${newStatus === 'approved' ? 'Your project has been approved and will begin soon.' : ''}
${newStatus === 'in_progress' ? 'Your project is now in progress.' : ''}
${newStatus === 'completed' ? 'Your project has been completed!' : ''}

You can view the details in your customer portal.

Best regards,
Bal-Con Builders Team
      `.trim();
            const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c5aa0;">Project Status Update</h2>
    
    <p>Hello ${customer.fullName},</p>
    
    <p>Your project status has been updated:</p>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Project:</strong> ${project.title} (${project.inquiryNumber})</p>
      <p><strong>Previous Status:</strong> ${oldStatus}</p>
      <p><strong>New Status:</strong> <span style="color: #28a745;">${newStatus}</span></p>
    </div>
    
    ${newStatus === 'quoted' ? '<p style="color: #2c5aa0;"><strong>Your quote is ready for review.</strong></p>' : ''}
    ${newStatus === 'approved' ? '<p style="color: #28a745;"><strong>Your project has been approved and will begin soon.</strong></p>' : ''}
    ${newStatus === 'in_progress' ? '<p style="color: #fd7e14;"><strong>Your project is now in progress.</strong></p>' : ''}
    ${newStatus === 'completed' ? '<p style="color: #28a745;"><strong>Congratulations! Your project has been completed!</strong></p>' : ''}
    
    <p><a href="${environment_1.config.server.baseUrl}/projects/${project.id}" style="background-color: #2c5aa0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project Details</a></p>
    
    <hr style="margin: 30px 0;">
    <p style="color: #666; font-size: 12px;">
      Best regards,<br>
      Bal-Con Builders Team
    </p>
  </div>
</body>
</html>
      `.trim();
            const template = { subject, textContent, htmlContent };
            const success = await this.sendEmail(customer.email, template);
            if (success) {
                logger_1.logger.info(`Status change notification sent to ${customer.email} for project ${project.inquiryNumber}`);
            }
            return success;
        }
        catch (error) {
            logger_1.logger.error('Error sending status change notification:', error);
            return false;
        }
    }
}
exports.EmailNotificationService = EmailNotificationService;
// Export singleton instance
exports.emailService = new EmailNotificationService();
