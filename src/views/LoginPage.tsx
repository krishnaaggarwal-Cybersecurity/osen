import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, signUp } = useApp();
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    document.title = `${authMode === 'sign-in' ? 'Sign in' : 'Sign up'} | NetraGridAI`;
  }, [authMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      if (authMode === 'sign-up') {
        const result = await signUp(displayName, email, password);
        if (result.success) {
          setSuccess(result.message || 'Account created. Check your email for next steps.');
          setAuthMode('sign-in');
          setPassword('');
        } else {
          setError(result.error || 'Could not create your account.');
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          navigate('/dashboard');
        } else {
          setError(result.error || 'Sign-in failed. Check your email and password.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Requirement A.17: Full screen login page layout without outer black margins/padding
    <div className="w-screen h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans select-none">
      
      {/* Left Panel: Full screen height digital grid hero with logo + Title + Subtitle (Requirement A.13 & A.5) */}
      <div className="digital-grid-hero w-full md:w-1/2 p-8 lg:p-16 flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
        {/* Glowing node decorative SVG background lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
          <line x1="10%" y1="90%" x2="42%" y2="28%" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
          <line x1="60%" y1="80%" x2="84%" y2="25%" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
          <circle cx="42%" cy="28%" r="6" fill="#FFFFFF" />
          <circle cx="84%" cy="25%" r="6" fill="#FFFFFF" />
          <circle cx="76%" cy="80%" r="16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        </svg>

        <div className="relative z-10 flex flex-col items-center space-y-6 max-w-lg mx-auto">
          {/* Logo image (Requirement A.13) */}
          <div className="w-28 h-28 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/30 flex items-center justify-center shadow-2xl">
            <img src="/logo.png" alt="NetraGridAI Logo" className="w-full h-full object-contain" />
          </div>

          {/* Title text NetraGridAI with pixelated font (Item 9) */}
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white font-sans drop-shadow-md uppercase">
            NetraGridAI
          </h1>

          <div className="w-16 h-1 bg-white/60 rounded-full" />

          {/* Subtitle text AI-Powered Smart City Emergency Dispatcher (Requirement A.13) */}
          <p className="text-base lg:text-lg font-medium text-white/90 leading-relaxed">
            AI-Powered Smart City Emergency Dispatcher
          </p>
        </div>
      </div>

      {/* Right Panel: Clean white form panel (Requirements A.14, A.15, A.16) */}
      <div className="w-full md:w-1/2 p-8 lg:p-16 flex flex-col justify-between bg-white text-slate-900">
        <div className="max-w-md w-full mx-auto my-auto space-y-8">
          
          {/* Authentication header */}
          <div className="space-y-2">
            <h2 className="font-sans text-4xl lg:text-5xl font-bold tracking-tight text-[#0B7FF5] uppercase">
              {authMode === 'sign-in' ? 'SIGN IN' : 'SIGN UP'}
            </h2>
            <p className="text-sm text-slate-500">
              {authMode === 'sign-in' ? 'Sign in to your operator account.' : 'Create an account to request operator access.'}
            </p>
          </div>

          {success && (
            <div role="status" className="p-3.5 bg-emerald-50 border-l-4 border-emerald-500 text-xs text-emerald-800 font-mono rounded-r-md">
              {success}
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-50 border-l-4 border-red-500 text-xs text-red-700 font-mono rounded-r-md">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {authMode === 'sign-up' && (
              <div className="space-y-1.5">
                <label htmlFor="display-name" className="text-xs font-semibold text-slate-700 font-mono uppercase">
                  Full Name
                </label>
                <div className="relative flex items-center bg-slate-50 rounded-lg overflow-hidden border border-slate-200 focus-within:border-[#0B7FF5] focus-within:ring-2 focus-within:ring-blue-100 transition-calm">
                  <div className="w-1.5 h-11 bg-[#0B7FF5] shrink-0" />
                  <input
                    id="display-name"
                    type="text"
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    minLength={2}
                    maxLength={80}
                    required
                    className="w-full bg-transparent px-4 py-3 text-sm text-slate-900 focus:outline-none font-mono placeholder-slate-400 font-medium"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="operator-email" className="text-xs font-semibold text-slate-700 font-mono uppercase">
                Operator Email
              </label>
              <div className="relative flex items-center bg-slate-50 rounded-lg overflow-hidden border border-slate-200 focus-within:border-[#0B7FF5] focus-within:ring-2 focus-within:ring-blue-100 transition-calm">
                <div className="w-1.5 h-11 bg-[#0B7FF5] shrink-0" />
                <input
                  id="operator-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@example.com"
                  required
                  className="w-full bg-transparent px-4 py-3 text-sm text-slate-900 focus:outline-none font-mono placeholder-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Field 2: Password (Functional 2) */}
            <div className="space-y-1.5">
              <label htmlFor="operator-password" className="text-xs font-semibold text-slate-700 font-mono uppercase">
                Password
              </label>
              <div className="relative flex items-center bg-slate-50 rounded-lg overflow-hidden border border-slate-200 focus-within:border-[#0B7FF5] focus-within:ring-2 focus-within:ring-blue-100 transition-calm">
                <div className="w-1.5 h-11 bg-[#0B7FF5] shrink-0" />
                <input
                  id="operator-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={authMode === 'sign-in' ? 'current-password' : 'new-password'}
                  placeholder="Enter your password"
                  minLength={authMode === 'sign-up' ? 8 : undefined}
                  required
                  className="w-full bg-transparent px-4 py-3 text-sm text-slate-900 focus:outline-none font-mono placeholder-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-full bg-[#0B7FF5] text-white font-bold text-xs tracking-wider uppercase hover:bg-blue-600 active:scale-[0.99] transition-calm shadow-lg shadow-blue-500/25 disabled:opacity-60"
            >
              {isSubmitting ? (authMode === 'sign-in' ? 'SIGNING IN...' : 'CREATING ACCOUNT...') : (authMode === 'sign-in' ? 'SIGN IN' : 'CREATE ACCOUNT')}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600">
            {authMode === 'sign-in' ? "Don't have an account?" : 'Already registered?'}{' '}
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'sign-in' ? 'sign-up' : 'sign-in');
                setError('');
                setSuccess('');
              }}
              className="font-semibold text-[#0B7FF5] hover:underline"
            >
              {authMode === 'sign-in' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono text-xs text-slate-600">
            New accounts require email confirmation and administrator approval before operator access is granted.
          </div>

        </div>

        <div className="text-center text-xs font-mono text-slate-400 pt-4">
          NetraGridAI &bull; Smart City Emergency Command Console
        </div>
      </div>

    </div>
  );
};
