import { Siren } from 'lucide-react';
import { useSos } from '../context/SosContext';

/** variant: 'hero' (large), 'compact' (top bar) or 'fab' (floating, mobile). Opens the shared SOS dialog. */
export default function SOSButton({ variant = 'hero', label = 'Emergency SOS' }) {
  const { openSos } = useSos();

  if (variant === 'fab') {
    return (
      <button type="button" className="btn-sos fab" onClick={openSos} aria-label="Emergency SOS">
        <Siren size={22} />
        <span>SOS</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`btn-sos ${variant === 'hero' ? 'hero-size' : 'compact'}`}
      onClick={openSos}
    >
      <Siren size={variant === 'hero' ? 26 : 17} />
      {variant === 'compact' ? 'SOS' : label}
    </button>
  );
}
