import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Container,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setDensity, setTheme } from '../../store/slices/uiSlice';
import { SystemHealthWidget } from '../../components/widgets/SystemHealthWidget';
import { RootState } from '../../store/store';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const dispatch = useDispatch();
  const { density, theme } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleThemeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setTheme(event.target.checked ? 'dark' : 'light'));
  };

  const handleDensityToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setDensity(event.target.checked ? 'compact' : 'comfortable'));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Manage your application preferences and view system information
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="settings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Appearance" id="settings-tab-0" />
          <Tab label="System Health" id="settings-tab-1" />
          <Tab label="Account" id="settings-tab-2" />
        </Tabs>

        {/* Appearance Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Display Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Customize how the application looks and feels
          </Typography>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Theme
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={theme === 'dark'}
                    onChange={handleThemeToggle}
                    color="primary"
                  />
                }
                label={theme === 'dark' ? 'Dark Mode (Active)' : 'Light Mode (Active)'}
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Toggle between light and dark color schemes
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Layout Density
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={density === 'compact'}
                    onChange={handleDensityToggle}
                    color="primary"
                  />
                }
                label={density === 'compact' ? 'Compact Mode (Active)' : 'Comfortable Mode (Active)'}
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Compact mode shows more information in less space
              </Typography>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ mt: 3 }}>
            Theme and density preferences are saved to your browser and will persist across sessions
          </Alert>
        </TabPanel>

        {/* System Health Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Monitor the health and status of backend services
          </Typography>
          
          <SystemHealthWidget />
        </TabPanel>

        {/* Account Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Account Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Manage your account information and security
          </Typography>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Profile Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Name:</Typography>
                  <Typography variant="body2">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : 'Not set'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Email:</Typography>
                  <Typography variant="body2">{user?.email || 'Not set'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Role:</Typography>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {user?.role?.replace('_', ' ') || 'Not set'}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Button variant="outlined" color="primary" disabled>
                Edit Profile (Coming Soon)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Security
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage your password and security settings
              </Typography>
              <Button variant="contained" color="primary" disabled>
                Change Password (Coming Soon)
              </Button>
            </CardContent>
          </Card>

          <Alert severity="warning" sx={{ mt: 3 }}>
            Account management features are currently under development
          </Alert>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default SettingsPage;
