import { useNavigate } from 'react-router-dom';
import { Siren, FileWarning, PackageSearch, PhoneCall } from 'lucide-react';
import { useSos } from '../context/SosContext';

export default function QuickActions() {
  const navigate = useNavigate();
  const { openSos } = useSos();

  return (
    <div className="quick-grid">
      <button type="button" className="quick sos" onClick={openSos}>
        <Siren size={22} /> Raise SOS
      </button>
      <button type="button" className="quick" onClick={() => navigate('/report')}>
        <FileWarning size={22} color="var(--red)" /> Report Incident
      </button>
      <button type="button" className="quick" onClick={() => navigate('/lost-found')}>
        <PackageSearch size={22} color="var(--info)" /> Lost &amp; Found
      </button>
      <button type="button" className="quick" onClick={() => navigate('/contacts')} style={{ gridColumn: '1 / -1' }}>
        <PhoneCall size={22} color="var(--success)" /> Emergency Contacts
      </button>
    </div>
  );
}
