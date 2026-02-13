import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { batchAPI } from '../api/batch';
import LabAccessModal from '../components/LabAccessModal';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  useEffect(() => {
    fetchBatches();
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await batchAPI.getBatches();
      setBatches(response.batches || []);
    } catch (err) {
      if (err.response?.status === 401) return;

      setError('Failed to load schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getBatchStatus = (batch) => {
    if (batch.isCancelled) return 'Cancelled';
    const now = currentTime;
    const start = new Date(batch.startAt);
    const end = new Date(batch.endAt);
    
    if (now >= start && now <= end) return 'Live';
    if (now < start) return 'Upcoming';
    return 'Expired';
  };

  // Helper to format countdown
  const getCountdownParts = (targetDate) => {
    const diff = targetDate - currentTime;
    if (diff <= 0) return { hours: '00', minutes: '00', seconds: '00' };
    
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    
    return {
      hours: h.toString().padStart(2, '0'),
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0')
    };
  };

  const handleAccessLab = async (batchId) => {
    try {
      setLoadingCredentials(true);
      const response = await batchAPI.getLabCredentials(batchId);
      
      if (response.hasCredentials === false) {
        showToast(response.message || 'No lab credentials configured for this batch.', 'error');
        return;
      }

      setCredentials({
        batchName: response.batchName,
        endAt: response.endAt,
        credentials: response.credentials
      });
      setShowCredentialsModal(true);
    } catch (error) {
      if (error.response?.status === 401) return;
      const errorMessage = error.response?.data?.message || 'Failed to fetch lab credentials';
      showToast(errorMessage, 'error');
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleCloseModal = () => {
    setShowCredentialsModal(false);
    setCredentials(null);
  };

  // Filter batches into columns
  const upcomingBatches = batches.filter(b => getBatchStatus(b) === 'Upcoming').sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  const liveBatches = batches.filter(b => getBatchStatus(b) === 'Live').sort((a, b) => new Date(a.endAt) - new Date(b.endAt));
  const pastBatches = batches.filter(b => ['Expired', 'Cancelled'].includes(getBatchStatus(b))).sort((a, b) => new Date(b.endAt) - new Date(a.endAt));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation */}
      <Navbar />

      {/* Main Content - SaaS Dashboard Layout */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full items-start">
          
          {/* LEFT COLUMN: UPCOMING SESSIONS */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Upcoming Sessions</h2>
            </div>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1,2].map(i => <div key={i} className="h-40 bg-white rounded-xl shadow-sm"></div>)}
              </div>
            ) : upcomingBatches.length > 0 ? (
              upcomingBatches.map(batch => {
                const countdown = getCountdownParts(new Date(batch.startAt));
                return (
                  <div key={batch.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-amber-200 transition-all duration-300 relative overflow-hidden">
                    {/* Left Accent Bar */}
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-orange-500"></div>
                    
                    <div className="p-5 pl-7">
                      <div className="flex justify-between items-start mb-5">
                        <div className="space-y-2">
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md uppercase tracking-wider border border-amber-100/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Upcoming
                          </span>
                          <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-amber-600 transition-colors line-clamp-2">
                            {batch.batchName}
                          </h3>
                        </div>
                        
                        {/* Date Badge */}
                         <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-xl p-2.5 min-w-[70px] shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                              {new Date(batch.startAt).toLocaleDateString(undefined, { month: 'short' })}
                            </span>
                            <span className="text-2xl font-bold text-slate-800 leading-none">
                               {new Date(batch.startAt).getDate()}
                            </span>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 mb-6">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 transition-colors group/time">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-500 shadow-sm group-hover/time:border-blue-200 group-hover/time:text-blue-600 transition-colors">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Time</p>
                             <p className="text-sm font-semibold text-slate-700">
                               {new Date(batch.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(batch.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                          </div>
                        </div>
                      </div>

                      {/* Countdown Footer */}
                      <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between relative overflow-hidden group-hover:shadow-lg group-hover:shadow-amber-900/10 transition-shadow">
                         {/* Background Effects */}
                         <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/0 rounded-full blur-2xl"></div>
                         
                         <div className="relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                              <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Starting In
                            </p>
                            <div className="font-mono text-xl font-bold text-white tracking-widest">
                              {countdown.hours}<span className="text-slate-600 mx-0.5">:</span>{countdown.minutes}<span className="text-slate-600 mx-0.5">:</span>{countdown.seconds}
                            </div>
                         </div>
                         
                         <div className="relative z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-amber-500 group-hover:border-amber-400 group-hover:text-white transition-all duration-300">
                            <svg className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                         </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center h-40 flex flex-col items-center justify-center">
                <svg className="w-10 h-10 text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                <p className="text-slate-400 text-sm font-medium">No upcoming Sessions</p>
              </div>
            )}
          </div>

          {/* CENTER COLUMN: LIVE NOW (PRIMARY FOCUS) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Live Now</h2>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                 <div className="h-96 bg-white rounded-xl shadow-sm"></div>
              </div>
            ) : liveBatches.length > 0 ? (
              liveBatches.map(batch => {
                const countdown = getCountdownParts(new Date(batch.endAt));
                const expiring = (new Date(batch.endAt) - currentTime) <= 10 * 60 * 1000;
                
                return (
                  <div key={batch.id} className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-green-400 p-8 text-center relative overflow-hidden ring-4 ring-green-50/50">
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-6">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                       Active Session
                    </div>
                    
                    <h3 className="font-bold text-slate-800 text-2xl leading-tight mb-4">{batch.batchName}</h3>
                    
                    <div className="text-slate-500 text-sm mb-8">
                       <p className="mb-1">Date: {new Date(batch.startAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                       <p>Time: {new Date(batch.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(batch.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    <div className="mb-8">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">TIME REMAINING:</p>
                      <div className={`font-mono text-5xl font-bold tracking-tight ${expiring ? 'text-red-600' : 'text-slate-900'}`}>
                        {countdown.hours}:{countdown.minutes}:{countdown.seconds}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAccessLab(batch.id)}
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-75 disabled:cursor-wait flex items-center justify-center gap-2 mb-3"
                    >
                      {loadingCredentials ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Preparing Lab...</span>
                        </>
                      ) : (
                        <span>Access Lab Environment</span>
                      )}
                    </button>
                    
                    <p className="text-xs text-slate-400 font-medium">
                      Auto-closes at {new Date(batch.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                   <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">No Active Sessions</h3>
                <p className="text-slate-400 text-sm">Sessions will appear here when they start.</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: PAST SESSIONS */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Past Sessions</h2>
            </div>

            {loading ? (
               <div className="animate-pulse space-y-4">
                 {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-xl shadow-sm"></div>)}
               </div>
            ) : pastBatches.length > 0 ? (
              <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
                {pastBatches.map(batch => {
                   const isCancelled = batch.isCancelled;
                   const durationHours = (new Date(batch.endAt) - new Date(batch.startAt)) / (1000 * 60 * 60);
                   
                   return (
                    <div key={batch.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow relative">
                      <h3 className="font-bold text-slate-800 text-base mb-3 pr-20">{batch.batchName}</h3>
                      
                      <div className="text-xs text-slate-500 space-y-1.5">
                        <p>Date: {new Date(batch.startAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        <p>Duration: {durationHours} hours</p>
                      </div>

                      <div className="absolute top-5 right-5">
                        {isCancelled ? (
                          <span className="inline-block px-2 py-0.5 border border-red-200 text-red-500 text-[10px] font-bold rounded-md uppercase tracking-wide">
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-md uppercase tracking-wide">
                            Expired
                          </span>
                        )}
                      </div>
                    </div>
                   );
                })}
              </div>
            ) : (
               <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center h-40 flex flex-col items-center justify-center">
                <p className="text-slate-400 text-sm font-medium">No past sessions</p>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* Lab Access Modal */}
      {showCredentialsModal && credentials && (
        <LabAccessModal
          batch={credentials}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Dashboard;
