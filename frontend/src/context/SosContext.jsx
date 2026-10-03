import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import SosDialog from '../components/SosDialog';

const SosContext = createContext(null);

/** Lets any button open the one shared SOS confirmation / status dialog. */
export function SosProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openSos = useCallback(() => setOpen(true), []);
  const closeSos = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ openSos, closeSos }), [openSos, closeSos]);

  return (
    <SosContext.Provider value={value}>
      {children}
      {open && <SosDialog onClose={closeSos} />}
    </SosContext.Provider>
  );
}

export function useSos() {
  const ctx = useContext(SosContext);
  if (!ctx) throw new Error('useSos must be used inside SosProvider');
  return ctx;
}
