import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff, Shield, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistrationMode, setIsRegistrationMode] = useState(false);
  const [adminStatus, setAdminStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const navigate = useNavigate();

  // Check admin status on component mount
  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setStatusLoading(true);
      const status = await apiService.checkAdminStatus();
      setAdminStatus(status);
      setIsRegistrationMode(!status.adminExists);
    } catch (error) {
      console.error('Failed to check admin status:', error);
      // If API fails, assume no admin exists and show registration
      setAdminStatus({
        adminExists: false,
        message: 'Unable to check admin status. You can try to register as the first admin.'
      });
      setIsRegistrationMode(true);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await apiService.login({
        email,
        password
      });

      if (response.data.token) {
        console.log('Login successful, token received:', response.data.token);
        console.log('User data:', response.data.user);
        console.log('LocalStorage token:', localStorage.getItem('token'));
        console.log('LocalStorage admin_logged_in:', localStorage.getItem('admin_logged_in'));
        
        setSuccess("Login successful! Redirecting...");
        // Clear form
        setEmail("");
        setPassword("");
        // Redirect after a short delay
        setTimeout(() => {
          console.log('Redirecting to /admin');
          navigate("/admin");
        }, 1500);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!username.trim()) {
      setError("Username is required for registration");
      setLoading(false);
      return;
    }

    if (username.length < 3 || username.length > 30) {
      setError("Username must be 3-30 characters long");
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setError("Email is required for registration");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Password is required for registration");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await apiService.registerAdmin({
        username,
        email,
        password
      });

      if (response.data.token) {
        console.log('Registration successful, token received:', response.data.token);
        console.log('Admin data:', response.data.admin);
        console.log('LocalStorage token:', localStorage.getItem('token'));
        console.log('LocalStorage admin_logged_in:', localStorage.getItem('admin_logged_in'));
        
        setSuccess("Admin account created successfully! Redirecting...");
        // Clear form
        setUsername("");
        setEmail("");
        setPassword("");
        // Redirect after a short delay
        setTimeout(() => {
          console.log('Redirecting to /admin');
          navigate("/admin");
        }, 2000);
      } else {
        setError("Registration failed - No token received");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistrationMode(!isRegistrationMode);
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
    setUsername("");
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3">
      <div className="w-full max-w-sm">
        {/* Admin Status Alert */}
        {/* Admin Status Message - Hidden */}
        {/* {adminStatus && (
          <div className={`mb-4 p-4 rounded-xl border ${
            adminStatus.adminExists 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{adminStatus.message}</span>
            </div>
          </div>
        )} */}

        {/* Login/Registration Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-full mb-2.5">
              <img src="/logo.png" alt="Riko Admin Logo" className="w-9 h-9 rounded-full shadow" />
            </div>
            <h1 className="text-lg font-bold text-white mb-1.5">Riko Admin</h1>
            <p className="text-sm text-blue-100">
              {isRegistrationMode ? 'Create your admin account' : 'Sign in to manage your store'}
            </p>
          </div>

          {/* Form */}
          <div className="px-5 py-5">
            <form onSubmit={isRegistrationMode ? handleRegistration : handleLogin} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">{success}</span>
                </div>
              )}

              {/* Username Field - Only for registration */}
              {isRegistrationMode && (
                <div className="space-y-1.5">
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                    Username *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      minLength={3}
                      maxLength={30}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Username must be 3-30 characters long</p>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

             {/* Password Field */}
              <div className="space-y-1.5 relative">
  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
    Password *
  </label>
  <div className="relative">
    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
    <input
      id="password"
      type={showPassword ? "text" : "password"}
      placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      minLength={6}
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  </div>
  {/* Password requirements and Forgot Password link */}
  <div className="flex justify-between items-center">
    {isRegistrationMode ? (
      <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
    ) : (
      <div className="text-right">
        <Link
          to="/admin/forgot-password"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Forgot Password?
        </Link>
      </div>
    )}
  </div>
</div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isRegistrationMode ? 'Creating account...' : 'Signing in...'}</span>
                  </div>
                ) : (
                  isRegistrationMode ? 'Create Admin Account' : 'Sign In'
                )}
              </button>
            </form>

            {/* Toggle Mode Button */}
            {adminStatus && (
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center space-x-2 mx-auto"
                >
                  {isRegistrationMode ? (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>Already have an account? Sign in</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Need to create admin account? Register</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-3">
          {!isRegistrationMode && (
            <div>
              <Link 
                to="/admin/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                Forgot your password?
              </Link>
            </div>
          )}
          <p className="text-sm text-gray-500">
            {isRegistrationMode 
              ? 'Create your admin account to manage the store' 
              : 'Secure admin access for store management'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
