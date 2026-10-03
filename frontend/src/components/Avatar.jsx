import AuthImage from './AuthImage';
import { initials } from '../utils/format';

export default function Avatar({ user, large = false }) {
  return (
    <div className={`avatar ${large ? 'lg' : ''}`}>
      <AuthImage src={user?.profileImage} alt="" fallback={<span>{initials(user?.name)}</span>} />
    </div>
  );
}
