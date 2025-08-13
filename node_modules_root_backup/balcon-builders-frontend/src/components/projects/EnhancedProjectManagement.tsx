import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface Project {
  id: number;
  projectNumber: string;
  title: string;
  description: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  budget: number;
  spent: number;
  progress: number;
  startDate: Date;
  endDate?: Date;
  assignedTo: string[];
  lastActivity: Date;
  client: string;
  location: string;
  phase: string;
}

interface Activity {
  id: string;
  projectId: number;
  user: string;
  action: string;
  description: string;
  timestamp: Date;
  type: 'update' | 'comment' | 'file' | 'status' | 'assignment';
}

const EnhancedProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadProjects();
    loadActivities();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      
      // Mock project data for Phase 5C demo
      const mockProjects: Project[] = [
        {
          id: 1,
          projectNumber: 'PROJ-2025-001',
          title: 'Downtown Office Building Renovation',
          description: 'Complete renovation of 50-story office building including balcony installation and safety upgrades',
          status: 'in_progress',
          priority: 'high',
          budget: 500000,
          spent: 350000,
          progress: 75,
          startDate: new Date('2025-01-15'),
          assignedTo: ['John Smith', 'Sarah Wilson', 'Mike Chen'],
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
          client: 'MetroTech Solutions',
          location: 'Downtown Vancouver',
          phase: 'Construction'
        },
        {
          id: 2,
          projectNumber: 'PROJ-2025-002',
          title: 'Residential Balcony Installation',
          description: 'Installation of 24 balconies in luxury residential complex',
          status: 'in_progress',
          priority: 'medium',
          budget: 180000,
          spent: 120000,
          progress: 60,
          startDate: new Date('2025-02-01'),
          assignedTo: ['Emily Davis', 'Tom Rodriguez'],
          lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000),
          client: 'Sunset Residences',
          location: 'West Vancouver',
          phase: 'Installation'
        },
        {
          id: 3,
          projectNumber: 'PROJ-2025-003',
          title: 'Emergency Balcony Repair',
          description: 'Critical safety repairs on heritage building balconies',
          status: 'planning',
          priority: 'urgent',
          budget: 75000,
          spent: 5000,
          progress: 10,
          startDate: new Date('2025-03-01'),
          assignedTo: ['David Park'],
          lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000),
          client: 'Heritage Properties Ltd',
          location: 'Gastown',
          phase: 'Assessment'
        }
      ];

      setProjects(mockProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const mockActivities: Activity[] = [
        {
          id: '1',
          projectId: 1,
          user: 'John Smith',
          action: 'Status Update',
          description: 'Updated project progress to 75%',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'update'
        },
        {
          id: '2',
          projectId: 2,
          user: 'Emily Davis',
          action: 'File Upload',
          description: 'Uploaded safety inspection report',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          type: 'file'
        },
        {
          id: '3',
          projectId: 3,
          user: 'David Park',
          action: 'Comment',
          description: 'Added assessment notes for heritage compliance',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          type: 'comment'
        }
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'planning':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: Project['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
      default:
        return 'bg-green-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const filteredProjects = filterStatus === 'all' 
    ? projects 
    : projects.filter(project => project.status === filterStatus);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-lg">Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600 mt-1">Real-time project tracking and collaboration</p>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline">
            📊 Reports
          </Button>
          <Button>
            ➕ New Project
          </Button>
        </div>
      </div>

      {/* Filters and View Options */}
      <div className="flex justify-between items-center">
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            🔲 Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            📋 List
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            📊 Kanban
          </Button>
        </div>
      </div>

      {/* Projects Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{project.projectNumber}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${getPriorityColor(project.priority)}`}></div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-4">{project.description}</p>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Budget Information */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Budget:</span>
                    <span>{formatCurrency(project.budget)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Spent:</span>
                    <span className={project.spent > project.budget * 0.9 ? 'text-red-600' : 'text-gray-600'}>
                      {formatCurrency(project.spent)}
                    </span>
                  </div>
                </div>

                {/* Project Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client:</span>
                    <span>{project.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span>{project.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phase:</span>
                    <span>{project.phase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span>{formatDate(project.startDate)}</span>
                  </div>
                </div>

                {/* Team Members */}
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Assigned Team:</p>
                  <div className="flex flex-wrap gap-1">
                    {project.assignedTo.map((member, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {member}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="mt-1">
                  {activity.type === 'update' && '📈'}
                  {activity.type === 'comment' && '💬'}
                  {activity.type === 'file' && '📄'}
                  {activity.type === 'status' && '🔄'}
                  {activity.type === 'assignment' && '👤'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.user}</p>
                    <span className="text-xs text-gray-500">
                      {new Intl.DateTimeFormat('en-CA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedProjectManagement;
