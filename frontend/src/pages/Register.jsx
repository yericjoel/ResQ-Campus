import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';
import { AuthSide } from './Login';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', studentId: '', department: '', year: '', phone: '', role: 'STUDENT' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await authService.register({ ...f, year: f.year ? Number(f.year) : null });
      navigate('/login?registered=1&email=' + encodeURIComponent(f.email.trim()), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed.'));
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
            <h2>Create your account</h2>
            <p className="muted">Students and staff only. Administrators are created by the campus office.</p>
          </div>
          <ErrorAlert message={error} />
          <div className="form-grid">
            <div className="field full"><label>Full name</label><input className="input" required value={f.name} onChange={set('name')} /></div>
            <div className="field full"><label>Email</label><input className="input" type="email" required value={f.email} onChange={set('email')} /></div>
            <div className="field full">
              <label>Password</label>
              <input className="input" type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={set('password')} />
              <span className="hint">At least 8 characters, with a letter and a number.</span>
            </div>
            <div className="field"><label>I am a</label>
              <select className="input" value={f.role} onChange={set('role')}><option value="STUDENT">Student</option><option value="STAFF">Staff</option></select>
            </div>
            <div className="field"><label>Student / Staff ID</label><input className="input" value={f.studentId} onChange={set('studentId')} /></div>
            <div className="field"><label>Department</label><input className="input" value={f.department} onChange={set('department')} /></div>
            <div className="field"><label>Year</label><input className="input" type="number" min="1" max="8" value={f.year} onChange={set('year')} /></div>
            <div className="field full"><label>Phone</label><input className="input" value={f.phone} onChange={set('phone')} /></div>
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
          <p className="small center muted">Already registered? <Link to="/login" className="strong" style={{ color: 'var(--red)' }}>Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
