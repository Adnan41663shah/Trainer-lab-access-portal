import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validate, loginSchema } from '../utils/validation';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    
    // Client-side validation
    const validation = validate(loginSchema, formData);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await login(validation.data);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        }
        if (result.message) {
          setGeneralError(result.message);
        }
      }
    } catch (err) {
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Visuals (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 flex-col justify-between p-12 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" 
            alt="Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-slate-900/90 mix-blend-multiply"></div>
        </div>

        {/* Content over image */}
        <div className="relative z-10">
          <img src="/logo.webp" alt="CloudBlitz Logo" className="h-10 w-auto mb-2" />
          <p className="text-blue-200 font-medium tracking-wide">Trainer Portal</p>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Manage your lab sessions with strict chaos engineering.
          </h1>
          <p className="text-lg text-blue-100 leading-relaxed">
            Secure, reliable, and real-time access control for your training environments. 
            Streamlining the workflow for trainers and administrators.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-blue-300/60">© 2026 CloudBlitz Systems.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          
          {/* Mobile Logo (only visible on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/logo.webp" 
              alt="CloudBlitz Logo" 
              className="h-12 w-auto mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="hidden lg:block text-3xl font-bold text-slate-900 tracking-tight mb-2">Welcome Back</h2>
            <p className="text-slate-500">Please sign in to your account</p>
          </div>

          {/* General Error Alert */}
          {generalError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-fadeIn">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-600 font-medium">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all outline-none bg-slate-50/50 ${
                      errors.email 
                        ? 'border-red-200 bg-red-50 text-red-900 placeholder-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white'
                    }`}
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1 mt-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-bold hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all outline-none bg-slate-50/50 ${
                      errors.password 
                        ? 'border-red-200 bg-red-50 text-red-900 placeholder-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white'
                    }`}
                    placeholder="••••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1 mt-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Register Link */}
            <div className="pt-2 text-center">
              <p className="text-slate-600 font-medium">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-colors ml-1">
                  Create Account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
