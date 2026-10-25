import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { WholesaleUser } from '../types.ts';
import { registerNewUser, loginUser } from '../services/dataService.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: WholesaleUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (isSignUp) {
        // Create account: Name, number, email, pass
        // Strictly & hiddenly saves role as 'user'
        if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
          setErrorMessage('Please fill in Name, Phone, Email and Password.');
          setLoading(false);
          return;
        }

        const newUser = await registerNewUser({
          name,
          phone,
          email,
          password,
          companyName: companyName.trim() || 'Verified Retailer'
        });

        onLoginSuccess(newUser);
        onClose();
      } else {
        // Sign In
        const result = await loginUser(email, password);
        if (result.user) {
          onLoginSuccess(result.user);
          onClose();
        } else {
          setErrorMessage(result.error || 'Invalid credentials. Please verify your email/number and password.');
        }
      }
    } catch (err: any) {
      console.error('Auth error', err);
      setErrorMessage(err.message || 'Authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-300 relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-red-50 hover:text-red-600 text-neutral-600 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <span className="text-[11px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
            India Wholesale Trader Hub
          </span>
          <h3 className="text-2xl font-black font-heading text-neutral-900 mt-2">
            {isSignUp ? 'Create Wholesale Account' : 'Trader Sign In'}
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            {isSignUp 
              ? 'Register with your name, mobile and email to unlock bulk slab rates and GST invoicing.' 
              : 'Sign in to access your wholesale orders, bulk biltis, and saved styles.'}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isSignUp ? (
            <>
              {/* Name */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    type="text"
                    placeholder="e.g. Rajesh Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Number / Phone */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Mobile Number (+91) *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    type="email"
                    placeholder="rajesh@fashionboutique.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Shop / Company (Optional) */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Shop / Firm Name (Optional)</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Sharma Garments"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Login fields */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Email or Mobile Number</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    type="text"
                    placeholder="Email or Mobile (+91)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit button with bold color */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-full font-black text-sm transition-all flex items-center justify-center gap-2 mt-4 shadow-md disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : isSignUp ? 'Create Wholesale Account' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-neutral-600">
          {isSignUp ? (
            <p>
              Already registered?{' '}
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMessage('');
                }}
                className="font-bold text-red-600 hover:underline"
              >
                Sign In here
              </button>
            </p>
          ) : (
            <p>
              New apparel retailer or wholesaler?{' '}
              <button
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMessage('');
                }}
                className="font-bold text-red-600 hover:underline"
              >
                Create Account
              </button>
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-100 text-center">
          <span className="text-[11px] text-neutral-400">
            Guest browsing & trial orders are always supported without mandatory login.
          </span>
        </div>
      </div>
    </div>
  );
};
