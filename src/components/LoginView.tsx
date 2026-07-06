import React from 'react';

interface LoginViewProps {
  onLogin: () => void;
  onLoginDemo: () => void;
  isLoggingIn: boolean;
  error: string | null;
}

export default function LoginView({ onLogin, onLoginDemo, isLoggingIn, error }: LoginViewProps) {
  const isUnauthorizedDomain = error && error.includes('unauthorized-domain');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4">
      <div className="max-w-md w-full bg-white border border-[#E9ECEF] rounded-3xl p-10 shadow-sm transition-all duration-300">
        
        {/* Brand Icon & Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#6C5CE7] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <svg className="w-7 h-7 text-white" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1.5"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-display text-[#2D3436] mb-1">InventoryOS</h1>
          <p className="text-sm text-[#636E72] font-medium">Spreadsheet ERP & Asset Tracking</p>
        </div>

        {/* Informative Body */}
        <div className="text-center text-[#2D3436] mb-8 space-y-3">
          <p className="text-sm leading-relaxed text-[#636E72]">
            Recreate your asset management experience directly integrated with Google Sheets and Google Drive.
          </p>
          <div className="bg-[#F1F3F5] rounded-xl p-4 border border-[#E9ECEF] text-left text-[12px] text-[#636E72] space-y-1.5 font-sans">
            <div className="flex items-center gap-2 font-medium text-[#2D3436]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7]"></span>
              Real-time Google Sheet synchronization
            </div>
            <div className="flex items-center gap-2 font-medium text-[#2D3436]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7]"></span>
              Asset tracking with complete audit trails
            </div>
            <div className="flex items-center gap-2 font-medium text-[#2D3436]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7]"></span>
              Printable Gate Passes in PDF layout
            </div>
          </div>
        </div>

        {/* Error messaging & Troubleshooting instructions */}
        {error && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-950 text-left space-y-3 text-xs">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              ⚠️ {isUnauthorizedDomain ? 'Firebase Domain Unauthorized' : 'Sign-In Notice'}
            </p>
            <p className="leading-relaxed text-amber-900">
              {isUnauthorizedDomain ? (
                <>
                  This domain (<strong className="font-mono bg-white/50 px-1 py-0.5 rounded border border-amber-200">{window.location.hostname}</strong>) is not authorized in your Firebase console under Authentication Settings.
                </>
              ) : error}
            </p>
            {isUnauthorizedDomain && (
              <div className="text-[11px] bg-white border border-amber-250 rounded-xl p-3 text-amber-900 leading-relaxed space-y-1.5">
                <span className="font-bold block text-amber-950">How to authorize:</span>
                <ol className="list-decimal list-inside space-y-1 text-amber-800">
                  <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline font-bold text-[#6C5CE7] hover:text-[#5A4ED1]">Firebase Console</a></li>
                  <li>Go to <strong>Authentication &gt; Settings &gt; Authorized domains</strong></li>
                  <li>Click <strong>Add domain</strong> and enter: <span className="font-mono bg-amber-50 border border-amber-200 px-1 py-0.5 rounded select-all">{window.location.hostname}</span></li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Sign In Buttons */}
        <div className="flex flex-col items-center">
          <button 
            onClick={onLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-[#DEE2E6] rounded-xl bg-white hover:bg-gray-50 text-[#2D3436] font-medium text-sm transition-all shadow-sm active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block flex-shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            <span className="font-sans font-medium text-[#2D3436]">
              {isLoggingIn ? 'Connecting Securely...' : 'Sign in with Google'}
            </span>
          </button>
          
          {/* Demo Mode Separator and Button */}
          <div className="w-full mt-6">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-medium uppercase tracking-wider font-mono">OR</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            
            <button
              type="button"
              onClick={onLoginDemo}
              disabled={isLoggingIn}
              className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-2.5 border border-transparent rounded-xl bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/15 text-[#6C5CE7] font-semibold text-xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              🔑 Access in Guest Admin Mode (Offline/Demo)
            </button>
            <p className="text-[10px] text-center text-[#636E72] mt-2 italic leading-normal">
              Proceed immediately using client-side secure local storage to manage and log assets.
            </p>
          </div>

          <div className="mt-8 text-center">
            <span className="text-[10px] text-[#ADB5BD] font-mono">
              SECURE OAUTH2 · GEN CLIENT 1.0
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
