import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const LabAccessModal = ({ batch, onClose }) => {
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    // Function to calculate time remaining
    const calculateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(batch.endAt);
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        // Auto-close modal when batch expires
        setTimeout(() => {
          showToast('Lab access has expired', 'warning');
          onClose();
        }, 1000);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeRemaining(`${minutes}m ${seconds}s`);
        }
      }
    };

    // Calculate immediately on mount
    calculateTimeRemaining();

    // Then update every second
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [batch.endAt, onClose, showToast]);

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied!`, 'success');
    } catch (error) {
      showToast('Failed to copy', 'error');
    }
  };

  const copyAll = async () => {
    const allText = `Login URL: ${batch.credentials.loginUrl}\nUsername: ${batch.credentials.username}\nPassword: ${batch.credentials.password}`;
    try {
      await navigator.clipboard.writeText(allText);
      showToast('All credentials copied!', 'success');
    } catch (error) {
      showToast('Failed to copy', 'error');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden animate-fadeIn scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 p-6 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500 rounded-full opacity-20 blur-xl"></div>
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">{batch.batchName}</h2>
              </div>
              
              <div className="inline-flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5 border border-slate-700/50 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-mono text-slate-300">
                  Time Remaining: <span className="text-white font-bold">{timeRemaining}</span>
                </span>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            This Lab Environment is temporary. Access will be automatically revoked when the session timer expires.
          </p>
        </div>

        {/* Credentials Section */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Access Credentials
            </h3>
            <button
               onClick={copyAll}
               className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy All
            </button>
          </div>

          {/* Login URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Login URL</label>
            <div className="flex gap-2">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={batch.credentials.loginUrl}
                  readOnly
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-mono text-sm focus:border-blue-400 focus:bg-white transition-all outline-none"
                />
              </div>
              <button
                onClick={() => copyToClipboard(batch.credentials.loginUrl, 'Login URL')}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all font-medium shadow-sm flex items-center justify-center"
                title="Copy URL"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
            <a 
              href={batch.credentials.loginUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-700 hover:underline ml-1 inline-flex items-center gap-1"
            >
              Open in new tab
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Username */}
             <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Username</label>
               <div className="relative flex items-center">
                 <input
                   type="text"
                   value={batch.credentials.username}
                   readOnly
                   className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-mono text-sm focus:border-blue-400 focus:bg-white transition-all outline-none"
                 />
                 <button
                   onClick={() => copyToClipboard(batch.credentials.username, 'Username')}
                   className="absolute right-2 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-all"
                   title="Copy Username"
                 >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                   </svg>
                 </button>
               </div>
             </div>

             {/* Password */}
             <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Password</label>
               <div className="relative flex items-center">
                 <input
                   type={showPassword ? 'text' : 'password'}
                   value={batch.credentials.password}
                   readOnly
                   className="w-full pl-4 pr-20 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-mono text-sm focus:border-blue-400 focus:bg-white transition-all outline-none"
                 />
                 <div className="absolute right-2 flex items-center gap-1">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all"
                      title={showPassword ? "Hide" : "Show"}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(batch.credentials.password, 'Password')}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-all"
                      title="Copy Password"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabAccessModal;
