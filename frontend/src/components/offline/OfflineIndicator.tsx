import React, { useEffect, useState } from 'react';
import { Chip } from '@mui/material';
import { onStatusChange } from '../../services/offlineQueue';

export const OfflineIndicator: React.FC = () => {
  const [status, setStatus] = useState<{ online: boolean; pending: number; flushing: boolean }>({ online: navigator.onLine, pending: 0, flushing: false });

  useEffect(() => {
    return onStatusChange(s => setStatus(s));
  }, []);

  if (status.online && status.pending === 0) return null;

  const label = status.online
    ? (status.pending > 0 ? `Queued: ${status.pending}${status.flushing ? ' (syncing...)' : ''}` : '')
    : 'Offline';

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 3000 }}>
      <Chip color={status.online ? 'warning' : 'error'} label={label} variant="filled" />
    </div>
  );
};

export default OfflineIndicator;
