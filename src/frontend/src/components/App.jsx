import React, { useState, useEffect } from 'react';
import Auth from './Auth';
import TodoList from './TodoList';

/**
 * Application Root Component
 */
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Check local storage for authentication info when component mounts
  useEffect(() => {
    checkAuth();
  }, []);
  
  // Check authentication info in local storage
  const checkAuth = () => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        // Clear invalid storage data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setIsInitialized(true);
  };
  
  // Authentication success handler
  const handleAuthSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setIsLoggedIn(true);
  };
  
  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setToken('');
  };
  
  // Show loading state during app initialization
  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading-spinner mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Initializing application...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-6">
      {isLoggedIn && user ? (
        <TodoList
          user={user} 
          onLogout={handleLogout} 
        />
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
};

export default App; 