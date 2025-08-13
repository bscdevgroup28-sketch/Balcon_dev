import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { demoAPI } from '../../services/api';

const DemoAPITest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('owner');

  const testGetUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await demoAPI.getDemoUsers();
      setResults({
        type: 'getDemoUsers',
        data: response.data,
        status: response.status,
      });
    } catch (error: any) {
      setError(`Failed to get demo users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await demoAPI.loginAsRole(selectedRole);
      setResults({
        type: 'loginAsRole',
        data: response.data,
        status: response.status,
        role: selectedRole,
      });
    } catch (error: any) {
      setError(`Failed to login as ${selectedRole}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await demoAPI.getMetrics(selectedRole);
      setResults({
        type: 'getMetrics',
        data: response.data,
        status: response.status,
        role: selectedRole,
      });
    } catch (error: any) {
      setError(`Failed to get metrics for ${selectedRole}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await demoAPI.getProjects();
      setResults({
        type: 'getProjects',
        data: response.data,
        status: response.status,
      });
    } catch (error: any) {
      setError(`Failed to get projects: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Demo API Test Suite
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }}>
          Test the backend demo API endpoints to verify integration.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Role Selection
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Select Role</InputLabel>
                  <Select
                    value={selectedRole}
                    label="Select Role"
                    onChange={(e) => setSelectedRole(e.target.value as string)}
                  >
                    <MenuItem value="owner">Owner</MenuItem>
                    <MenuItem value="office_manager">Office Manager</MenuItem>
                    <MenuItem value="shop_manager">Shop Manager</MenuItem>
                    <MenuItem value="project_manager">Project Manager</MenuItem>
                    <MenuItem value="team_leader">Team Leader</MenuItem>
                    <MenuItem value="technician">Technician</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  API Tests
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                  <Button variant="contained" onClick={testGetUsers} disabled={loading}>
                    Test Get Users
                  </Button>
                  <Button variant="contained" onClick={testLogin} disabled={loading}>
                    Test Login ({selectedRole})
                  </Button>
                  <Button variant="contained" onClick={testMetrics} disabled={loading}>
                    Test Metrics ({selectedRole})
                  </Button>
                  <Button variant="contained" onClick={testProjects} disabled={loading}>
                    Test Projects
                  </Button>
                </Box>

                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress />
                  </Box>
                )}

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {results && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Results: {results.type}
                        {results.role && ` (${results.role})`}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Status: {results.status}
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          backgroundColor: 'grey.100',
                          p: 2,
                          borderRadius: 1,
                          overflow: 'auto',
                          fontSize: '0.875rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        {JSON.stringify(results.data, null, 2)}
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default DemoAPITest;
