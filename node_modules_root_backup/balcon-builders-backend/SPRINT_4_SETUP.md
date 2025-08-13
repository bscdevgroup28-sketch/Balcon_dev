# Sprint 4 Setup & Validation Guide

## 🚀 Quick Start

### 1. Environment Setup
Copy the environment example and configure:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
# Required
DATABASE_URL=postgresql://balcon_user:balcon_pass@localhost:5432/balcon_dev
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration (Optional - will fallback to console logging)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@balconbuilders.com
ADMIN_EMAIL=admin@balconbuilders.com

# File Upload Configuration
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=10485760
MAX_FILES=10
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Run migrations (if using sequelize-cli)
npm run migrate:up

# Or manually sync models (development)
# The app will auto-sync models on startup in development mode
```

### 4. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm run build && npm start
```

## 🧪 Sprint 4 Validation

### Automatic Validation
Once the server is running, validate all Sprint 4 features:
```bash
# Validate Sprint 4 implementation
curl http://localhost:8080/api/test/sprint4

# Or use npm script
npm run validate:sprint4
```

### Manual Testing Steps

#### 1. Create Test Data
```bash
curl -X POST http://localhost:8080/api/test/sprint4/setup
```

#### 2. Test Project Creation with Auto-Assignment
```bash
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Project",
    "description": "Testing Sprint 4 features",
    "projectType": "commercial",
    "priority": "medium",
    "estimatedBudget": 100000
  }'
```

#### 3. Test File Upload
```bash
curl -X POST http://localhost:8080/api/uploads/project/1 \
  -F "files=@test-file.pdf"
```

#### 4. Test Project Listing (with assigned sales rep)
```bash
curl http://localhost:8080/api/projects
```

#### 5. Test Upload Configuration
```bash
curl http://localhost:8080/api/uploads/config
```

## 📋 Sprint 4 Features Checklist

### ✅ Core Features Implemented

- **✅ Inquiry Number Generation**
  - Format: `INQ-YYYY-NNNNNN`
  - Sequential numbering
  - Year-based reset

- **✅ Sales Representative Assignment**
  - Automatic workload balancing
  - Manual assignment capability
  - Capacity management

- **✅ Email Notification System**
  - New inquiry notifications
  - Assignment notifications
  - Status change notifications
  - HTML/text email templates

- **✅ File Upload System**
  - Multi-file upload support
  - File type validation
  - Size limits and security
  - Project file associations

- **✅ Enhanced Database Models**
  - ProjectFile model
  - Enhanced User model (sales rep fields)
  - Enhanced Project model (inquiry tracking)

### 🔧 API Endpoints

#### Project Management
- `GET /api/projects` - List projects with assigned sales reps
- `GET /api/projects/:id` - Get single project details
- `POST /api/projects` - Create project with auto-assignment

#### File Upload
- `POST /api/uploads/project/:projectId` - Upload files
- `GET /api/uploads/project/:projectId` - List project files
- `DELETE /api/uploads/:fileId` - Delete file
- `GET /api/uploads/config` - Get upload configuration

#### Validation & Testing
- `GET /api/test/sprint4` - Feature validation
- `POST /api/test/sprint4/setup` - Create test data

## 🛠️ Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_ctl status

# Check connection string in .env
DATABASE_URL=postgresql://username:password@host:port/database
```

#### 2. File Upload Permission Issues
```bash
# Ensure uploads directory exists and has proper permissions
mkdir -p uploads/projects
chmod 755 uploads
```

#### 3. Email Service Not Working
- Check if `SENDGRID_API_KEY` is set in `.env`
- If not set, emails will be logged to console (development mode)
- Verify email configuration in validation endpoint

#### 4. Sales Rep Assignment Not Working
- Ensure you have created users with `isSalesRep: true`
- Use test data setup: `POST /api/test/sprint4/setup`
- Check database for sales rep users

### Validation Failures

If validation fails, check:
1. **Database Models**: Ensure all models are synced
2. **Environment Variables**: Verify all required vars are set
3. **Sales Rep Data**: Create at least one sales rep user
4. **File Permissions**: Check upload directory permissions

## 📊 Expected Validation Results

A successful Sprint 4 validation should show:
```json
{
  "message": "Sprint 4 Feature Validation Results",
  "data": {
    "summary": {
      "passed": 6,
      "failed": 0,
      "total": 6,
      "successRate": "100%",
      "status": "ALL_PASSED"
    },
    "tests": {
      "inquiryNumberGeneration": { "status": "PASSED" },
      "salesRepWorkloads": { "status": "PASSED" },
      "projectCreationAndAssignment": { "status": "PASSED" },
      "emailServiceConfiguration": { "status": "PASSED" },
      "databaseIntegrity": { "status": "PASSED" },
      "fileUploadConfiguration": { "status": "PASSED" }
    }
  }
}
```

## 🚀 Next Steps

After Sprint 4 validation passes:
1. **Sprint 5**: Frontend implementation for inquiry submission
2. **Sprint 6**: Material catalog system
3. **Sprint 7**: Quote generation system

## 📞 Support

If you encounter issues:
1. Check this README for troubleshooting steps
2. Run the validation endpoint for detailed error information
3. Check server logs for detailed error messages
4. Ensure all environment variables are properly set
