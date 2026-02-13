import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-100 py-3 sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex justify-between items-center h-14">
          
          {/* Logo Section */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => navigate('/dashboard')}
          >
            {/* Desktop Logo */}
            <img 
              src="/logo.webp" 
              alt="CloudBlitz Logo" 
              className="hidden md:block w-36 h-36 object-contain group-hover:scale-105 transition-transform"
            />
            {/* Mobile Logo */}
             <img 
              src="/logo.png" 
              alt="CloudBlitz Logo" 
              className="block md:hidden w-12 h-12 object-contain group-hover:scale-105 transition-transform"
            />
          </div>
          {/* Right Section */}
          <div className="flex items-center gap-6">
            
            {/* Admin Actions */}
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/batches')}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-bold rounded-lg hover:from-orange-600 hover:to-purple-700 shadow-lg shadow-purple-500/20 active:scale-95 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Sessions
              </button>
            )}

            {/* Profile Section */}
            <div className="relative ml-4 pl-4 border-l border-gray-200" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 focus:outline-none group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm border-2 border-transparent group-hover:border-blue-100 transition-all">
                  {user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-blue-600 transition-colors">{user?.fullName}</p>
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-1">{user?.role}</p>
                </div>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 p-2 z-50 animate-fadeIn origin-top-right">
                  <div className="p-4 border-b border-slate-50 mb-2">
                    <p className="text-base font-bold text-slate-900">{user?.fullName}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{user?.email}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase tracking-wider border border-blue-100">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors items-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
