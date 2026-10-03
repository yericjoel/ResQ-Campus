import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldAlert, Siren, BellRing, PackageSearch } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';

export function AuthSide() {
  return (
    <div className="auth-side">
      <div className="row" style={{ gap: 12 }}>
        <div className="brand-logo"><ShieldAlert size={22} /></div>
        <strong style={{ fontSize: 20 }}>ResQ Campus</strong>
      </div>
      <div>
        <h1>Campus Safety. Faster Response. Safer Community.</h1>
        <p>One place for students, staff and campus security to raise alerts, report incidents and stay informed in real time.</p>
        <div className="auth-points">
          <div><Siren size={20} /> One-tap emergency SOS sent straight to security</div>
          <div><BellRing size={20} /> Live notifications as soon as status changes</div>
          <div><PackageSearch size={20} /> Lost &amp; Found with smart matching</div>
        </div>
      </div>
      <span className="small" style={{ color: '#8fa6bd' }}>© ResQ Campus</span>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(email.trim(), password);
      navigate(user.role === 'ADMIN' || user.role === 'SECURITY' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <AuthSide />
      <div className="auth-form-wrap">
        <form className="auth-form stack" onSubmit={submit}>
          <div>
            <h2>Welcome back</h2>
            <p className="muted">Sign in with your campus email.</p>
          </div>
          {params.get('expired') && <div className="alert info">Your session expired. Please sign in again.</div>}
          <ErrorAlert message={error} />
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" required autoComplete="username" value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" className="input" type="password" required autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
          <p className="small center muted">New here? <Link to="/register" className="strong" style={{ color: 'var(--red)' }}>Create an account</Link></p>
          <div className="demo-box">
            <strong>Demo accounts</strong><br />
            Student: aarav.sharma@resq.edu / Student@123<br />
            Admin: admin@resq.edu / Admin@123
          </div>
        </form>
      </div>
    </div>
  );
}
