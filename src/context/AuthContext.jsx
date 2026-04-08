import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { serverURL } from "../App";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Set up axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            const response = await axios.post(
              `${serverURL}/auth/users/refresh-token`,
              {},
              { withCredentials: true }
            );

            const { accessToken } = response.data.data;
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if we have tokens in cookies
      const hasAccessToken = document.cookie.includes("accessToken=");
      const hasRefreshToken = document.cookie.includes("refreshToken=");

      if (hasAccessToken || hasRefreshToken) {
        // Verify token with backend (server-side validation)
        try {
    
          const response = await axios.get(
            `${serverURL}/auth/users/verify-token`,
            { withCredentials: true }
          );

          if (response.data?.data?.user) {
            setUser(response.data.data.user);
            setIsAuthenticated(true);
          } else {
            console.log("❌ No user in response");
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          // Token verification failed, clear auth state
          console.error("❌ Token verification failed:", error.message);
          console.error("Response status:", error.response?.status);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log("❌ No tokens found in cookies");
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, accessToken, refreshToken) => {
    setUser(userData);
    setIsAuthenticated(true);
    
    // Tokens are stored in httpOnly cookies by backend
    // We just store user data in state
  };

  const logout = async () => {
    try {
      await axios.post(
        `${serverURL}/auth/users/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      navigate("/");
    }
  };

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
