import { useState, useEffect } from 'react';
import { User, Bell, Shield, Save, CheckCircle, Globe, Fingerprint } from 'lucide-react';
import { auth } from '../lib/firebase';
import { getUserProfile, updateUserProfileData } from '../services/dbService';
import { updateProfile } from 'firebase/auth';

import ActivityLogsComponent from '../components/ActivityLogsComponent';
import { logActivity } from '../services/dbService';

export default function SettingsView() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const loadProfile = async () => {
      if (auth.currentUser) {
        const userProfile = await getUserProfile(auth.currentUser.uid);
        if (userProfile) {
          setProfile(userProfile);
          setDisplayName(userProfile.displayName || '');
          setLanguage(userProfile.language || 'en');
          if (userProfile.preferences) {
            setEmailNotifications(userProfile.preferences.emailNotifications ?? true);
            setSmsNotifications(userProfile.preferences.smsNotifications ?? false);
          }
        }
      }
      setIsLoading(false);
    };
    loadProfile();
  }, []);

  const handleSaveSettings = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      // 1. Update Firebase Auth Object (for the sidebar)
      await updateProfile(auth.currentUser, { displayName });
      
      // 2. Update Firestore Database Object
      await updateUserProfileData(auth.currentUser.uid, {
        displayName,
        language,
        preferences: { emailNotifications, smsNotifications }
      });

      // 3. Log the activity
      await logActivity(auth.currentUser.uid, 'Updated Profile Settings', `Changed profile settings for ${displayName}`);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterBiometrics = async () => {
    try {
      if (!window.PublicKeyCredential) {
        alert('Web Authentication API is not supported in this environment.');
        return;
      }
      
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);

      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "ZooL Platform" },
          user: {
            id: userId,
            name: profile?.email || auth.currentUser?.email || "user@zool.com",
            displayName: displayName || "ZooL User",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // FaceID/TouchID
            userVerification: "required"
          },
          timeout: 60000
        }
      });

      if (cred) {
        // Save mapping to local storage for demo
        localStorage.setItem('zool_biometric_registered', 'true');
        localStorage.setItem('zool_biometric_uid', auth.currentUser?.uid || '');
        alert('Biometric authentication registered successfully!');
        
        if (auth.currentUser) {
           await logActivity(auth.currentUser.uid, 'Security Update', `Registered WebAuthn Biometric Credential`);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.name === 'NotAllowedError') {
         alert('Biometric registration was cancelled.');
      } else {
         alert('Biometric registration failed: ' + err.message);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC] animate-pulse">
        <div className="h-12 bg-slate-200 rounded-xl mb-8 w-48"></div>
        <div className="max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          <div className="md:col-span-8 h-[400px] bg-slate-200 rounded-3xl"></div>
          <div className="md:col-span-4 h-[400px] bg-slate-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC]">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Account Settings</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your profile and preferences.</p>
        </div>
      </header>

      <div className="max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        
        {/* Profile Management */}
        <div className="md:col-span-8 bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6 md:p-8 flex flex-col relative overflow-hidden">
          
          {saveSuccess && (
            <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center text-emerald-600 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <CheckCircle className="w-8 h-8" />
              </div>
              <p className="font-extrabold text-xl">Settings Saved!</p>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-xl text-slate-800">Personal Details</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Display Name</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200/60 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none font-medium transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input 
                type="text" 
                value={profile?.email || auth.currentUser?.email || ''}
                disabled
                className="w-full p-4 bg-slate-100 border border-slate-200/60 rounded-2xl text-slate-500 font-medium cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-2 font-medium">Email is managed via your Google Account.</p>
            </div>
          </div>
        </div>

        {/* Preferences & Security */}
        <div className="md:col-span-4 flex flex-col gap-6">
          
          <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-slate-800">Language</h2>
            </div>
            
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200/60 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none font-medium transition-all text-slate-700"
            >
              <option value="en">English (US)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
              <option value="zh">中文 (Chinese)</option>
              <option value="ja">日本語 (Japanese)</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-slate-800">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-bold text-slate-700">Email Updates</span>
                <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-bold text-slate-700">SMS Alerts</span>
                <input type="checkbox" checked={smsNotifications} onChange={(e) => setSmsNotifications(e.target.checked)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Fingerprint className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-slate-800">Biometric Login</h2>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-5 leading-relaxed">
              Enable passwordless login via Face ID or Touch ID using secure Web Authentication.
            </p>
            <button
               onClick={handleRegisterBiometrics}
               className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold transition-all"
            >
              <Fingerprint className="w-4 h-4 text-slate-600" />
              Set up Passkey
            </button>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] border border-slate-700 p-6 text-white mt-auto">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-lg">Secure Account</h2>
            </div>
            <p className="text-sm text-slate-300 font-medium leading-relaxed mb-5">
              Your account is protected by enterprise-grade Google authentication.
            </p>
            <button 
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-4xl mt-8">
        <ActivityLogsComponent />
      </div>
    </div>
  );
}
