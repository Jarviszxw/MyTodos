import React, { useState } from 'react';
import api from '../services/api';

/**
 * Login Form Component
 * @param {Object} props - Component properties
 * @param {Function} props.onLogin - Login success callback
 * @param {Function} props.onSwitchToRegister - Switch to registration form callback
 */
const LoginForm = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await api.auth.login(username, password);
      onLogin(response.user, response.token);
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed, please check your username and password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        Login
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label 
            htmlFor="username" 
            className="block text-gray-700 dark:text-gray-300 mb-2"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your username"
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-6">
          <label 
            htmlFor="password" 
            className="block text-gray-700 dark:text-gray-300 mb-2"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex flex-col gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          
          <button
            type="button"
            onClick={onSwitchToRegister}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-800 text-sm text-center dark:text-blue-400 dark:hover:text-blue-300"
          >
            Don't have an account? Register here
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Registration Form Component
 * @param {Object} props - Component properties
 * @param {Function} props.onRegister - Registration success callback
 * @param {Function} props.onSwitchToLogin - Switch to login form callback
 */
const RegisterForm = ({ onRegister, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Input validation
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await api.auth.register(username, password);
      onRegister(response.user, response.token);
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error.message || 'Registration failed, please try another username');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        Create New Account
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label 
            htmlFor="register-username" 
            className="block text-gray-700 dark:text-gray-300 mb-2"
          >
            Username
          </label>
          <input
            type="text"
            id="register-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter username"
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-4">
          <label 
            htmlFor="register-password" 
            className="block text-gray-700 dark:text-gray-300 mb-2"
          >
            Password
          </label>
          <input
            type="password"
            id="register-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter password"
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-6">
          <label 
            htmlFor="confirm-password" 
            className="block text-gray-700 dark:text-gray-300 mb-2"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Re-enter password"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex flex-col gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
          
          <button
            type="button"
            onClick={onSwitchToLogin}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-800 text-sm text-center dark:text-blue-400 dark:hover:text-blue-300"
          >
            Already have an account? Log in
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Authentication Component
 * @param {Object} props - Component properties
 * @param {Function} props.onAuthSuccess - Authentication success callback
 */
const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  const handleLogin = (userData, token) => {
    onAuthSuccess(userData, token);
  };
  
  const handleRegister = (userData, token) => {
    onAuthSuccess(userData, token);
  };
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md mb-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">
          MyTodos
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Simple and efficient task management application
        </p>
      </div>
      
      {isLogin ? (
        <LoginForm 
          onLogin={handleLogin} 
          onSwitchToRegister={() => setIsLogin(false)} 
        />
      ) : (
        <RegisterForm 
          onRegister={handleRegister}
          onSwitchToLogin={() => setIsLogin(true)} 
        />
      )}
    </div>
  );
};

export default Auth; 