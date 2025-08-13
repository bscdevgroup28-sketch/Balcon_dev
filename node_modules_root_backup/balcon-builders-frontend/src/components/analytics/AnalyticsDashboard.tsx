import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from '../ui/icons';

interface AnalyticsData {
  revenue: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    change: number;
  };
  users: {
    total: number;
    active: number;
    change: number;
  };
  performance: {
    onTime: number;
    budget: number;
    satisfaction: number;
  };
}

interface ChartData {
  labels: string[];
  revenue: number[];
  projects: number[];
}

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
    
    if (isRealTimeEnabled) {
      const interval = setInterval(loadAnalyticsData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedTimeframe, isRealTimeEnabled]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // In Phase 5C, this would connect to the Phase 5B analytics API
      const mockData: AnalyticsData = {
        revenue: {
          total: 250000,
          change: 12.5,
          trend: 'up'
        },
        projects: {
          total: 45,
          active: 12,
          completed: 33,
          change: 8.3
        },
        users: {
          total: 28,
          active: 15,
          change: 5.2
        },
        performance: {
          onTime: 87,
          budget: 92,
          satisfaction: 94
        }
      };

      const mockChartData: ChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        revenue: [45000, 52000, 48000, 61000, 55000, 67000],
        projects: [5, 7, 6, 9, 8, 10]
      };

      setAnalyticsData(mockData);
      setChartData(mockChartData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      // This would connect to the Phase 5B analytics export API
      console.log(`Exporting analytics data as ${format}...`);
      
      // Mock export functionality
      const link = document.createElement('a');
      link.href = `data:text/plain;charset=utf-8,Mock ${format.toUpperCase()} export data`;
      link.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time business intelligence and insights</p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant={isRealTimeEnabled ? "default" : "outline"}
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            className="flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>{isRealTimeEnabled ? 'Live' : 'Static'}</span>
          </Button>
          
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" onClick={() => exportData('pdf')}>
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData('excel')}>
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Time Frame Selector */}
      <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="7d">7 Days</TabsTrigger>
          <TabsTrigger value="30d">30 Days</TabsTrigger>
          <TabsTrigger value="90d">90 Days</TabsTrigger>
          <TabsTrigger value="1y">1 Year</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTimeframe} className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Revenue Card */}
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${analyticsData.revenue.total.toLocaleString()}
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {analyticsData.revenue.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={analyticsData.revenue.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                    {analyticsData.revenue.change}%
                  </span>
                  <span>from last period</span>
                </div>
              </CardContent>
            </Card>

            {/* Projects Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projects</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.projects.total}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {analyticsData.projects.active} Active
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {analyticsData.projects.completed} Completed
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Users Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.users.total}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>{analyticsData.users.active} active now</span>
                </div>
              </CardContent>
            </Card>

            {/* Performance Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.performance.satisfaction}%</div>
                <div className="text-xs text-muted-foreground">Customer satisfaction</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Revenue Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Revenue chart visualization</p>
                    <p className="text-xs text-gray-400">Integration with Chart.js/D3.js in Phase 5C</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Project Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">On Time Delivery</span>
                    <span className="text-sm font-semibold">{analyticsData.performance.onTime}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${analyticsData.performance.onTime}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Budget Adherence</span>
                    <span className="text-sm font-semibold">{analyticsData.performance.budget}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${analyticsData.performance.budget}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Activity Feed */}
          {isRealTimeEnabled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Activity Feed</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Project "Downtown Renovation" status updated</span>
                    <span className="text-xs text-gray-400">2 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">New quote approved for $15,000</span>
                    <span className="text-xs text-gray-400">5 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">Team member logged in from mobile</span>
                    <span className="text-xs text-gray-400">8 min ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
