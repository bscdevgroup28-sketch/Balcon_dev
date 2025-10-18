import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, LockReset as LockResetIcon } from '@mui/icons-material';
import { authAPI } from '../../services/api';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const ResetPassword: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const token = query.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [message, setMessage] = useState('');

  const minLen = 8;
  const valid = password.length >= minLen && confirm === password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus('error');
      setMessage('Missing or invalid reset token. Please use the link from your email.');
      return;
    }
    if (!valid) return;
    try {
      setStatus('loading');
      setMessage('');
      await authAPI.confirmPasswordReset(token, password);
      setStatus('success');
      setMessage('Your password has been reset successfully. You can now sign in.');
    } catch (e: any) {
      setStatus('error');
      setMessage(e?.response?.data?.message || 'Unable to reset password. The link may have expired.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <LockResetIcon color="primary" />
            <Typography variant="h5">Reset Password</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose a new password for your account.
          </Typography>

          {status === 'success' && (
            <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>
          )}
          {status === 'error' && (
            <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type={showPw ? 'text' : 'password'}
              label="New password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
              helperText={`At least ${minLen} characters`}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw(!showPw)} aria-label="toggle password visibility">
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              fullWidth
              type={showPw ? 'text' : 'password'}
              label="Confirm password"
              value={confirm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
              sx={{ mb: 3 }}
              error={confirm.length > 0 && confirm !== password}
              helperText={confirm.length > 0 && confirm !== password ? 'Passwords do not match' : ' '}
            />
            <Box display="flex" gap={1}>
              <Button
                type="submit"
                variant="contained"
                disabled={!valid || status === 'loading'}
              >
                {status === 'loading' ? <CircularProgress size={20} /> : 'Update password'}
              </Button>
              <Button variant="text" onClick={() => navigate('/login')}>
                Back to login
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPassword;
