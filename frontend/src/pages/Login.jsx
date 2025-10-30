import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, FileText } from 'lucide-react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import authContext from '../context/AuthProvider';
import themeContext from '../context/ThemeProvider';
import OAuthButtons from '../components/OAuthButtons';
import Input from '../components/ui/Input';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setuser } = useContext(authContext);
  const { theme, settheme } = useContext(themeContext);

  // Handle OAuth errors from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get('error');
    const errorMessage = params.get('message');

    if (oauthError === 'oauth_failed') {
      toast.error(errorMessage || 'OAuth authentication failed. Please try again.');
      // Clean URL
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Frontend validation
    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    if (!password) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    const formdata = { email: email.trim(), password };

    try {
      const res = await authAPI.login(formdata);
      setuser(res.data.user);
      localStorage.setItem('zetta_user', JSON.stringify(res.data.user));

      navigate('/');
      toast.success('Login successful!');
    } catch (err) {
      console.error('Login error:', err);

      if (err.response) {
        const errorMessage =
          err.response.data?.message || err.response.data?.Error || 'Login failed';
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (err.request) {
        setError('Network error. Please check if the server is running and try again.');
        toast.error('Network error. Please check if the server is running and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 bg-primary rounded-full"></div>
          <div className="absolute bottom-32 right-16 w-24 h-24 bg-secondary rounded-full"></div>
          <div className="absolute top-1/2 right-32 w-16 h-16 bg-accent rounded-full"></div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center items-center w-full px-12 relative z-10">
          <div className="text-center max-w-md">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-content" />
              </div>
              <h1 className="text-3xl font-bold text-base-content">ZettaNote</h1>
            </div>

            {/* Heading Lines */}
            <div className="space-y-4 text-base-content/80">
              <h2 className="text-2xl font-semibold text-base-content">
                Welcome back to ZettaNote
              </h2>
              <p className="text-lg">
                Continue where you left off. Your notes are waiting for you.
              </p>
              <p className="text-base">
                Access all your organized thoughts, ideas, and projects in one secure place.
              </p>
              <p className="text-sm opacity-75">Trusted by writers and developers worldwide</p>
            </div>

            {/* Decorative Avatars */}
            <div className="mt-12 flex items-center justify-center gap-4">
              <div className="flex -space-x-3">
                <img
                  src="https://api.dicebear.com/9.x/adventurer/svg?seed=LoginUser1"
                  alt="User"
                  className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                />
                <img
                  src="https://api.dicebear.com/9.x/adventurer/svg?seed=LoginUser2"
                  alt="User"
                  className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                />
                <img
                  src="https://api.dicebear.com/9.x/adventurer/svg?seed=LoginUser3"
                  alt="User"
                  className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                />
              </div>
              <span className="text-sm text-base-content/60">Active community</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-5">
        {/* Back Link */}
        <div className="absolute top-6 left-6 z-[60]">
          <Link
            to="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(-1);
            }}
            className="flex items-center gap-2 text-base-content/70 hover:text-base-content transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </Link>
        </div>

        {/* Theme Toggle */}
        <div className="absolute top-6 right-6 z-[60]">
          <label className="swap swap-rotate btn btn-ghost btn-circle">
            <input
              onChange={(e) => settheme(e.target.checked ? 'dark' : 'light')}
              type="checkbox"
              className="theme-controller"
              checked={theme === 'dark'}
            />
            {/* Sun icon */}
            <svg
              className="swap-off h-6 w-6 fill-current text-black"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Z" />
            </svg>
            {/* Moon icon */}
            <svg
              className="swap-on h-6 w-6 fill-current text-gray-300"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13ZM12.14,19.73A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
            </svg>
          </label>
        </div>

        {/* Mobile Logo (visible on small screens) */}
        <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-content" />
          </div>
          <h1 className="text-2xl font-bold text-base-content">ZettaNote</h1>
        </div>

        <div className="max-w-md mx-auto w-full">
          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-base-content mb-2">Welcome Back</h2>
            <p className="text-base-content/70">
              Sign in to access your notes and continue your journey.
            </p>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-base-content mb-2">
                Email Address
              </label>
              <Input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-base-content mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link will add when api is ready */}
            {/* <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Forgot your password?
              </Link>
            </div> */}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-content py-3 px-4 rounded-lg font-medium hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-content/20 border-t-primary-content rounded-full animate-spin"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* OAuth Buttons */}
          <OAuthButtons />

          {/* Signup Link */}
          <div className="text-center mt-8">
            <p className="text-base-content/70">
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>

          {/* Terms */}
          <div className="text-center mt-6">
            <p className="text-xs text-base-content/50">
              By signing in, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
