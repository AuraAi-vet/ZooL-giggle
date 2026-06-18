import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider, setAccessToken } from '../lib/firebase';
import { ShieldCheck, Sparkles, Fingerprint } from 'lucide-react';
import AnimatedLogo from '../components/AnimatedLogo';

interface LoginViewProps {
  onBiometricSuccess?: (uid: string) => void;
}

export default function LoginView({ onBiometricSuccess }: LoginViewProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBiometric, setHasBiometric] = useState(false);

  useEffect(() => {
    // Check if the user has previously registered a biometric credential on this device
    const isRegistered = localStorage.getItem('zool_biometric_registered') === 'true';
    const uid = localStorage.getItem('zool_biometric_uid');
    if (isRegistered && uid) {
      setHasBiometric(true);
    }
  }, []);

  const handleBiometricLogin = async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      if (!window.PublicKeyCredential) {
         setError('Web Authentication is not supported in this browser.');
         setIsAuthenticating(false);
         return;
      }
      
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      const assertion = await navigator.credentials.get({
          publicKey: {
              challenge,
              rpId: window.location.hostname,
              userVerification: "required"
          }
      });
      
      if (assertion) {
          // Success!
          const uid = localStorage.getItem('zool_biometric_uid');
          if (uid && onBiometricSuccess) {
             onBiometricSuccess(uid);
          } else {
             setError('Biometric profile mapping not found. Please log in with Google.');
             setIsAuthenticating(false);
          }
      }
    } catch (err: any) {
        console.error(err);
        if (err.name === 'NotAllowedError') {
          setError('Biometric authentication was cancelled.');
        } else {
          setError('Biometric login failed: ' + err.message);
        }
        setIsAuthenticating(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setError(null);
    
    try {
      // Attempt the standard popup first
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
      }
      // App.tsx's onAuthStateChanged will automatically catch this and route the user
    } catch (err: any) {
      // If the browser blocks the popup (common on mobile), fallback to redirect message
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request' || err.code === 'auth/internal-error' || err.code === 'auth/network-request-failed') {
        setError("Please open the app in a new tab to authenticate (use the 'Open in new tab' icon at the top right of the preview).");
        setIsAuthenticating(false);
      } else {
        console.error("Popup authentication failed:", err);
        const errorMsg = err.message || err.code || "Unknown error";
        if (errorMsg.includes("api-key-not-valid")) {
          setError("API Key Invalid. Please check your .env file.");
        } else if (errorMsg.includes("unauthorized-domain")) {
          setError("Unauthorized Domain. Please add this URL to Firebase Auth setting.");
        } else {
          setError(`Sign-in failed: ${errorMsg}`);
        }
        setIsAuthenticating(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Dark Mode Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none mask-image-radial-gradient"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-slate-700/50 p-10 flex flex-col items-center text-center">
        <div className="flex flex-col items-center mb-10 text-center">
          <AnimatedLogo size="xl" className="mb-6 drop-shadow-2xl" />
          
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3 font-display">ZooL</h1>
          <p className="text-cyan-400 font-medium mb-2 flex items-center justify-center gap-2 text-sm tracking-wide uppercase">
            <Sparkles className="w-4 h-4" />
            AI-Powered Veterinary Care
          </p>
        </div>

          {error && (
            <div className="w-full p-4 mb-6 bg-rose-500/10 text-rose-400 rounded-2xl text-sm font-bold border border-rose-500/20 flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              {error}
            </div>
          )}
          
          <div className="w-full space-y-4">
            {hasBiometric && (
              <button 
                onClick={handleBiometricLogin}
                disabled={isAuthenticating}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-cyan-500 hover:bg-cyan-400 border border-cyan-400 rounded-2xl text-slate-900 font-bold active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                {isAuthenticating ? (
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    Sign in with Passkey
                  </>
                )}
              </button>
            )}

            <button 
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-800/80 border border-slate-700 rounded-2xl text-white font-bold hover:bg-slate-700 active:scale-[0.98] transition-all disabled:opacity-50 ${!hasBiometric ? 'shadow-lg' : ''}`}
            >
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            </button>
          </div>

          <p className="mt-8 text-xs text-slate-500 font-medium">
            Secure, HIPAA-equivalent clinical infrastructure.
          </p>
        </div>
      </div>
    </div>
  );
}
