import React, { useEffect, useState } from 'react';
import { Box, Chip, List, ListItem, ListItemText, Typography, Skeleton, Stack } from '@mui/material';
import api from '../../services/api';

export interface AttentionItem {
  id: string;
  type: string;
  title: string;
  priority: 'low'|'medium'|'high'|'urgent';
  context?: any;
}

interface AttentionListProps {
  role?: string;
  limit?: number;
}

const PriorityChip: React.FC<{ p: AttentionItem['priority'] }> = ({ p }) => {
  const color = p === 'urgent' ? 'error' : p === 'high' ? 'warning' : p === 'medium' ? 'info' : 'default';
  return <Chip size="small" color={color as any} label={p.toUpperCase()} sx={{ mr: 1 }} />;
};

const AttentionList: React.FC<AttentionListProps> = ({ role, limit = 10 }) => {
  const [items, setItems] = useState<AttentionItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/attention');
        if (!mounted) return;
        const data = (res.data?.items || []) as AttentionItem[];
        setItems(data.slice(0, limit));
      } catch (e: any) {
        setError(e?.message || 'Failed to load attention items');
      }
    })();
    return () => { mounted = false; };
  }, [role, limit]);

  if (error) return <Typography color="error" role="alert">{error}</Typography>;
  if (!items) {
    return (
      <Stack spacing={1}>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={24} />)}
      </Stack>
    );
  }
  if (items.length === 0) {
    return <Typography color="text.secondary">No items need your attention right now.</Typography>;
  }

  return (
    <Box component="section" aria-label="attention items">
      <List dense>
        {items.map(it => (
          <ListItem key={it.id} divider>
            <ListItemText
              primary={<Box sx={{ display:'flex', alignItems:'center' }}><PriorityChip p={it.priority} /> {it.title}</Box>}
              secondary={it.type}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default AttentionList;
