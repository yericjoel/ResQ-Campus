import { useCallback, useState } from 'react';
import useAsync from './useAsync';
import { sosService } from '../services/sosService';
import { getErrorMessage } from '../services/api';
import { useRealtime, useNotifications } from '../context/NotificationContext';

/** Admin SOS list that updates from WebSocket events and offers status actions. */
export default function useLiveSos(activeOnly) {
  const { pushToast } = useNotifications();
  const list = useAsync(() => sosService.all(activeOnly), [activeOnly]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const { setData, reload } = list;

  const upsert = useCallback((sos) => {
    setData((current) => {
      const rest = (current || []).filter((s) => s.id !== sos.id);
      const keep = !activeOnly || ['TRIGGERED', 'ACKNOWLEDGED', 'DISPATCHED'].includes(sos.status);
      return keep ? [sos, ...rest].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : rest;
    });
  }, [setData, activeOnly]);

  useRealtime('adminSos', (p) => p?.sos && upsert(p.sos));
  useRealtime('resync', () => reload());

  const act = async (sos, status) => {
    setBusyId(sos.id);
    setError('');
    try {
      upsert(await sosService.updateStatus(sos.id, status));
      pushToast({ title: `SOS ${sos.sosId}`, message: `Status set to ${status.toLowerCase()}`, tone: 'success' });
    } catch (e) {
      setError(getErrorMessage(e, 'Could not update the status.'));
    } finally {
      setBusyId(null);
    }
  };

  return { ...list, act, busyId, actionError: error };
}
