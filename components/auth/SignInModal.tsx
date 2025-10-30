'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Sparkles, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');
  const { signInWithPassword, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let result;

      if (mode === 'reset') {
        // Password reset
        result = await resetPassword(email);
        if (!result.error) {
          setIsSent(true);
        }
      } else if (mode === 'signup') {
        // Sign up with password
        result = await signUp(email, password);
        if (!result.error) {
          setIsSent(true);
        }
      } else {
        // Sign in with password
        result = await signInWithPassword(email, password);
        if (!result.error) {
          // Password sign in is immediate, close modal
          handleClose();
          return;
        }
      }

      if (result?.error) {
        setError(result.error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
    setIsSent(false);
    setMode('signin');
    onClose();
  };

  const getTitle = () => {
    if (isSent) return 'Check Your Email';
    if (mode === 'reset') return 'Reset Password';
    if (mode === 'signup') return 'Create Account';
    return 'Welcome Back';
  };

  const getSubtitle = () => {
    if (isSent) return null;
    if (mode === 'reset') return 'We\'ll send you a reset link';
    if (mode === 'signup') return 'Sign up to get started';
    return 'Sign in to continue';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{getTitle()}</h2>
                  {getSubtitle() && (
                    <p className="text-white/60 text-sm">{getSubtitle()}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white/60 hover:text-white transition p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isSent ? (
              <>
                {/* Tabs for Sign In / Sign Up (only when not in reset mode) */}
                {mode !== 'reset' && (
                  <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
                    <button
                      onClick={() => setMode('signin')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition ${
                        mode === 'signin'
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setMode('signup')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition ${
                        mode === 'signup'
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-11 pr-4 py-3 bg-white/10 text-white placeholder-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        autoFocus
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password Field (not for reset mode) */}
                  {mode !== 'reset' && (
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={mode === 'signup' ? 'Choose a password' : 'Enter your password'}
                          className="w-full pl-11 pr-11 py-3 bg-white/10 text-white placeholder-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          minLength={6}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {mode === 'signup' && (
                        <p className="text-white/40 text-xs mt-1">At least 6 characters</p>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !email || (mode !== 'reset' && !password)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {mode === 'reset' ? 'Sending...' : mode === 'signup' ? 'Creating Account...' : 'Signing In...'}
                      </>
                    ) : (
                      <>
                        {mode === 'reset' ? (
                          <>
                            <Mail className="w-5 h-5" />
                            Send Reset Link
                          </>
                        ) : mode === 'signup' ? (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Create Account
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5" />
                            Sign In
                          </>
                        )}
                      </>
                    )}
                  </button>

                  {/* Helper Text */}
                  {mode === 'signin' && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setMode('reset')}
                        className="text-blue-400 hover:text-blue-300 transition text-sm"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Back to Sign In (from reset) */}
                  {mode === 'reset' && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setMode('signin')}
                        className="text-blue-400 hover:text-blue-300 transition text-sm"
                      >
                        ← Back to sign in
                      </button>
                    </div>
                  )}
                </form>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-green-400" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {mode === 'reset' ? 'Reset Link Sent!' : 'Check Your Email!'}
                  </h3>
                  <p className="text-white/60 text-sm">
                    We sent {mode === 'reset' ? 'a password reset link' : 'a confirmation link'} to{' '}
                    <strong className="text-white">{email}</strong>
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-white/80 text-sm">
                    {mode === 'reset'
                      ? 'Click the link in your email to reset your password.'
                      : 'Click the link in your email to confirm your account and sign in.'}
                  </p>
                </div>

                <button
                  onClick={handleClose}
                  className="text-blue-400 hover:text-blue-300 transition text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
