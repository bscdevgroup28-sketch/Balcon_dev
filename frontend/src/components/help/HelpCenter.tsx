import React, { useState, useEffect } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Divider,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Help,
  ExpandMore,
  Search,
  QuestionAnswer,
  VideoLibrary,
  Assignment,
  Phone,
  Email,
  Chat,
  PlayCircle,
  Description,
  Lightbulb,
  BugReport,
} from '@mui/icons-material';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

interface VideoGuide {
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  url: string;
}

const HelpCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedFAQ, setExpandedFAQ] = useState<string | false>(false);

  const faqs: FAQItem[] = [
    {
      question: "How do I create a new project?",
      answer: "Click the 'New Project' button on your dashboard or projects page. Our step-by-step wizard will guide you through providing project details, specifications, timeline, and requirements.",
      category: "Projects",
      tags: ["create", "project", "new", "wizard"]
    },
    {
      question: "How long does it take to get a quote?",
      answer: "Most quotes are prepared within 24-48 hours after project submission. Complex projects may take 3-5 business days. You'll receive email notifications when your quote is ready.",
      category: "Quotes",
      tags: ["quote", "timeline", "response", "notification"]
    },
    {
      question: "Can I modify my project after submission?",
      answer: "Yes! You can edit project details until a quote has been generated. After that, any changes will require a new quote. Use the 'Edit Project' option in your project details.",
      category: "Projects",
      tags: ["edit", "modify", "change", "project"]
    },
    {
      question: "What file types can I upload?",
      answer: "We accept most common file types including PDF, JPG, PNG, DWG, DXF, and DOC files. Maximum file size is 10MB per file. You can upload multiple files per project.",
      category: "Files",
      tags: ["upload", "files", "types", "size", "limit"]
    },
    {
      question: "How do I track my project progress?",
      answer: "Visit your Projects page to see real-time status updates. Each project shows current stage, progress percentage, and timeline. You'll also receive email notifications for major milestones.",
      category: "Projects",
      tags: ["track", "progress", "status", "timeline"]
    },
    {
      question: "How can I contact my project manager?",
      answer: "Use the Comments section in your project details to communicate directly with your project team. For urgent matters, use the phone number provided in your project details.",
      category: "Communication",
      tags: ["contact", "communication", "project manager", "comments"]
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept major credit cards, bank transfers, and checks. Payment terms are typically 50% down with the remainder due upon completion. Specific terms will be outlined in your quote.",
      category: "Payment",
      tags: ["payment", "methods", "terms", "credit card", "bank transfer"]
    },
    {
      question: "Can I see 3D renderings of my building?",
      answer: "Yes! 3D renderings are included with most quotes at no additional charge. These help you visualize your building before construction begins.",
      category: "Design",
      tags: ["3d", "rendering", "visualization", "design"]
    }
  ];

  const videoGuides: VideoGuide[] = [
    {
      title: "Creating Your First Project",
      description: "Step-by-step guide through the project creation wizard",
      duration: "3:45",
      thumbnail: "/api/placeholder/320/180",
      url: "#"
    },
    {
      title: "Understanding Your Quote",
      description: "Learn how to review and respond to project quotes",
      duration: "2:30",
      thumbnail: "/api/placeholder/320/180",
      url: "#"
    },
    {
      title: "Tracking Project Progress",
      description: "Monitor your project from start to completion",
      duration: "4:15",
      thumbnail: "/api/placeholder/320/180",
      url: "#"
    },
    {
      title: "Uploading Files and Documents",
      description: "Best practices for sharing project documents",
      duration: "2:00",
      thumbnail: "/api/placeholder/320/180",
      url: "#"
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categories = Array.from(new Set(faqs.map(faq => faq.category)));

  const handleFAQToggle = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedFAQ(isExpanded ? panel : false);
  };

  return (
    <>
      {/* Help Button */}
      <Fab
        color="primary"
        aria-label="help"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 1000,
        }}
        onClick={() => setOpen(true)}
      >
        <Help />
      </Fab>

      {/* Help Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Help sx={{ mr: 1 }} />
            Help Center
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
          >
            <Tab icon={<QuestionAnswer />} label="FAQ" />
            <Tab icon={<VideoLibrary />} label="Video Guides" />
            <Tab icon={<Phone />} label="Contact Support" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* FAQ Tab */}
            {selectedTab === 0 && (
              <Box>
                <TextField
                  fullWidth
                  placeholder="Search frequently asked questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Categories:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {categories.map((category) => (
                      <Chip
                        key={category}
                        label={category}
                        variant="outlined"
                        size="small"
                        onClick={() => setSearchTerm(category)}
                      />
                    ))}
                  </Box>
                </Box>

                <Box>
                  {filteredFAQs.map((faq, index) => (
                    <Accordion
                      key={index}
                      expanded={expandedFAQ === `panel${index}`}
                      onChange={handleFAQToggle(`panel${index}`)}
                    >
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1">
                          {faq.question}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" paragraph>
                          {faq.answer}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Chip
                            label={faq.category}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {faq.tags.slice(0, 3).map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>

                {filteredFAQs.length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No FAQs found matching your search. Try different keywords or contact support.
                  </Alert>
                )}
              </Box>
            )}

            {/* Video Guides Tab */}
            {selectedTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Video Tutorials
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Watch these helpful tutorials to get the most out of our platform.
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
                  {videoGuides.map((video, index) => (
                    <Box
                      key={index}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Box
                        sx={{
                          height: 180,
                          bgcolor: 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                      >
                        <PlayCircle sx={{ fontSize: 60, color: 'primary.main' }} />
                        <Typography
                          variant="caption"
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            bgcolor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            px: 1,
                            borderRadius: 0.5
                          }}
                        >
                          {video.duration}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {video.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {video.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Contact Support Tab */}
            {selectedTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Contact Support
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Need additional help? Our support team is here for you.
                </Typography>

                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Chat color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Live Chat"
                      secondary="Available Monday-Friday, 8 AM - 6 PM CST"
                    />
                    <Button variant="outlined" size="small">
                      Start Chat
                    </Button>
                  </ListItem>
                  <Divider />
                  
                  <ListItem>
                    <ListItemIcon>
                      <Phone color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Phone Support"
                      secondary="(555) 123-4567"
                    />
                    <Button variant="outlined" size="small">
                      Call Now
                    </Button>
                  </ListItem>
                  <Divider />
                  
                  <ListItem>
                    <ListItemIcon>
                      <Email color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email Support"
                      secondary="support@balconbuilders.com"
                    />
                    <Button variant="outlined" size="small">
                      Send Email
                    </Button>
                  </ListItem>
                  <Divider />
                  
                  <ListItem>
                    <ListItemIcon>
                      <BugReport color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Report Issue"
                      secondary="Found a bug? Let us know!"
                    />
                    <Button variant="outlined" size="small">
                      Report Bug
                    </Button>
                  </ListItem>
                </List>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Emergency Support:</strong> For urgent issues outside business hours, 
                    call our emergency line at (555) 999-9999.
                  </Typography>
                </Alert>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HelpCenter;
