import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';

type Step = 'password' | 'mfa-enroll' | 'mfa-verify';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<Step>('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // MFA enrollment
  const [qrCode, setQrCode] = useState('');
  const [enrollFactorId, setEnrollFactorId] = useState('');
  const [secret, setSecret] = useState('');

  // MFA challenge
  const [challengeFactorId, setChallengeFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  const fromState = (location.state as { from?: Location } | null)?.from;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  // If already at AAL2, redirect to admin
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData && aalData.currentLevel === 'aal2') {
          navigate(fromState ? fromState.pathname : '/admin', { replace: true });
        }
      }
    };
    checkSession();
  }, [navigate, fromState]);

  const handlePasswordSubmit = async (values: LoginValues) => {
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (signInError) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    const { data: factorsData, error: factorsError } =
      await supabase.auth.mfa.listFactors();

    if (factorsError) {
      setError('Unable to check MFA status.');
      setLoading(false);
      return;
    }

    const verifiedFactors = factorsData.totp.filter((f) => f.friendly_name);

    if (verifiedFactors.length === 0) {
      await startEnrollment();
    } else {
      const factorId = verifiedFactors[0].id;
      setChallengeFactorId(factorId);
      setStep('mfa-verify');
      setLoading(false);
    }
  };

  const startEnrollment = async () => {
    const { data: enrollData, error: enrollError } =
      await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Admin TOTP',
      });

    if (enrollError) {
      setError('Could not start MFA enrollment.');
      setLoading(false);
      return;
    }

    setEnrollFactorId(enrollData.id);
    setSecret(enrollData.totp.secret);
    setQrCode(enrollData.totp.qr_code);
    setStep('mfa-enroll');
    setLoading(false);
  };

  const handleEnrollVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const code = verifyCode.replace(/\s/g, '');
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your authenticator app.');
      setLoading(false);
      return;
    }

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: enrollFactorId });

    if (challengeError) {
      setError('Could not create MFA challenge.');
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: enrollFactorId,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      setError('Invalid code. Please try again.');
      setLoading(false);
      return;
    }

    navigate(fromState ? fromState.pathname : '/admin', { replace: true });
  };

  const handleChallengeVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const code = verifyCode.replace(/\s/g, '');
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your authenticator app.');
      setLoading(false);
      return;
    }

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: challengeFactorId });

    if (challengeError) {
      setError('Could not create MFA challenge.');
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: challengeFactorId,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      setError('Invalid code. Please try again.');
      setLoading(false);
      return;
    }

    navigate(fromState ? fromState.pathname : '/admin', { replace: true });
  };

  const resetToPassword = () => {
    setStep('password');
    setError('');
    setVerifyCode('');
    setQrCode('');
    setSecret('');
    setEnrollFactorId('');
    setChallengeFactorId('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-sky-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-7 w-7 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Homitra Admin</h1>
          <p className="text-slate-400 text-sm">Secure operator access</span></p>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
          {step === 'password' && (
            <form onSubmit={handleSubmit(handlePasswordSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="admin@homitra.co.in"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="w-full pl-11 pr-11 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
            </form>
          )}

          {step === 'mfa-enroll' && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={resetToPassword}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Set up two-factor authentication
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  Scan this QR code with an authenticator app (Google
                  Authenticator, Authy, 1Password), then enter the 6-digit code.
                </p>
              </div>

              {qrCode && (
                <div className="flex justify-center bg-white p-4 rounded-xl">
                  <img src={qrCode} alt="MFA QR code" className="w-48 h-48" />
                </div>
              )}

              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Or enter this code manually:</p>
                <p className="text-sky-300 font-mono text-sm break-all">{secret}</p>
              </div>

              <form onSubmit={handleEnrollVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Verification code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="text"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent tracking-widest text-center"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Authorized personnel only. All actions are audited.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
