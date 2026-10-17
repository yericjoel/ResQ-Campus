import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  Siren,
  BellRing,
  PackageSearch,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Mail,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
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
          <div><ShieldCheck size={20} /> Two-step email verification for secure access</div>
        </div>
      </div>
      <span className="small" style={{ color: '#8fa6bd' }}>© ResQ Campus</span>
    </div>
  );
}

export default function Login() {
  const { initiateLogin, verifyLogin, resendCode } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStep] = useState('credentials'); // 'credentials' | 'verify'
  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const codeInputRef = useRef(null);

  // Timer countdown for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Focus code input when entering verification step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 50);
    }
  }, [step]);

  // Step 1: Submit Credentials
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfoMessage('');
    try {
      const resp = await initiateLogin(email.trim(), password);
      if (resp.requiresVerification) {
        setDevCode(resp.devCode || '');
        setStep('verify');
        setCooldown(30);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setBusy(false);
    }
  };

  // Step 2: Submit Verification Code
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const user = await verifyLogin(email.trim(), code.trim());
      navigate(user.role === 'ADMIN' || user.role === 'SECURITY' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Verification failed. Please check your code.'));
    } finally {
      setBusy(false);
    }
  };

  // Resend code handler
  const handleResend = async () => {
    if (cooldown > 0 || busy) return;
    setBusy(true);
    setError('');
    setInfoMessage('');
    try {
      const resp = await resendCode(email.trim());
      setInfoMessage('A new verification code has been sent!');
      if (resp.devCode) {
        setDevCode(resp.devCode);
      }
      setCooldown(30);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not resend code. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  // Quick fill helper for demo accounts
  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="auth-wrap">
      <AuthSide />
      <div className="auth-form-wrap">
        {step === 'credentials' ? (
          <form className="auth-form stack" onSubmit={handleCredentialsSubmit}>
            <div>
              <h2>Welcome back</h2>
              <p className="muted">Sign in with your campus email.</p>
            </div>

            {params.get('registered') && (
              <div className="alert success row" style={{ gap: 8, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 10, padding: 12 }}>
                <CheckCircle2 size={18} />
                <span>Account created! Please sign in with email verification.</span>
              </div>
            )}
            {params.get('expired') && <div className="alert info">Your session expired. Please sign in again.</div>}
            
            <ErrorAlert message={error} />

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="input"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="btn btn-primary btn-block" disabled={busy} type="submit">
              {busy ? 'Verifying credentials...' : 'Continue to Verification'}
            </button>

            <p className="small center muted">
              New here?{' '}
              <Link to="/register" className="strong" style={{ color: 'var(--red)' }}>
                Create an account
              </Link>
            </p>

            <div className="demo-box">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Pre-Configured Demo Accounts:</div>
              <div style={{ marginBottom: 4 }}>
                <strong>Student:</strong> aarav.sharma@resq.edu
                <button
                  type="button"
                  className="demo-account-btn"
                  onClick={() => fillDemo('aarav.sharma@resq.edu', 'Student@123')}
                >
                  Fill
                </button>
              </div>
              <div>
                <strong>Admin:</strong> admin@resq.edu
                <button
                  type="button"
                  className="demo-account-btn"
                  onClick={() => fillDemo('admin@resq.edu', 'Admin@123')}
                >
                  Fill
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form className="auth-form stack" onSubmit={handleVerifySubmit}>
            <div>
              <div className="row" style={{ gap: 10, alignItems: 'center', marginBottom: 6 }}>
                <div style={{ background: '#e0edfb', padding: 8, borderRadius: 10, color: 'var(--navy-blue)' }}>
                  <KeyRound size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0 }}>Two-Step Verification</h2>
                  <span className="small muted">Email Security Check</span>
                </div>
              </div>
              <p className="muted" style={{ marginTop: 8 }}>
                We've sent a 6-digit verification code to <strong>{email}</strong>.
              </p>
            </div>

            {infoMessage && (
              <div className="alert success row" style={{ gap: 8, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 10, padding: 12 }}>
                <CheckCircle2 size={18} />
                <span>{infoMessage}</span>
              </div>
            )}

            {devCode && (
              <div className="otp-demo-badge">
                <div>
                  <span>Demo Code: </span>
                  <code>{devCode}</code>
                </div>
                <button
                  type="button"
                  className="otp-fill-btn"
                  onClick={() => {
                    setCode(devCode);
                    setError('');
                  }}
                >
                  Auto-fill
                </button>
              </div>
            )}

            <ErrorAlert message={error} />

            <div className="field">
              <label htmlFor="code" style={{ textAlign: 'center', display: 'block', fontWeight: 600 }}>
                Enter 6-Digit Code
              </label>
              <input
                ref={codeInputRef}
                id="code"
                className="input verification-code-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="••••••"
                required
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(val);
                }}
              />
            </div>

            <button
              className="btn btn-primary btn-block"
              disabled={busy || code.length !== 6}
              type="submit"
            >
              {busy ? 'Verifying code...' : 'Verify & Sign In'}
            </button>

            <div className="otp-actions">
              <button
                type="button"
                className="btn-link-action"
                disabled={cooldown > 0 || busy}
                onClick={handleResend}
              >
                <RefreshCw size={14} className={busy ? 'spin' : ''} />
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>

              <button
                type="button"
                className="btn-link-action"
                onClick={() => {
                  setStep('credentials');
                  setCode('');
                  setError('');
                  setInfoMessage('');
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
