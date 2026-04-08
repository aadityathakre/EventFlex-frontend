import React, { useState, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaTimes } from "react-icons/fa";
import { redirect, useNavigate } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../App.jsx";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {auth} from "../../firebase.js"
import { useAuth } from "../context/AuthContext.jsx";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  
  // Safely get auth context
  let login;
  try {
    const auth = useAuth();
    login = auth.login;
  } catch (error) {
    // Auth context not available, create a fallback
    login = (userData) => {
      console.log("Login:", userData);
    };
  }

  // Clear form when component mounts
  useEffect(() => {
    setEmail("");
    setPassword("");
    setErr("");
    setShowPassword(false);
  }, []);


  const handleGoogleAuth = async (e) => {
    try {
      const provider = new GoogleAuthProvider();
      const data = await signInWithPopup(auth, provider);
      
      const result = await axios.post(
        `${serverURL}/auth/users/google-auth`,
        { email: data.user.email },
        { withCredentials: true }
      );

      const { user, accessToken, refreshToken } = result.data.data;
      
      // Update auth context
      login(user, accessToken, refreshToken);
      
      setEmail("");
      setPassword("");

      // Redirect based on user role
      const roleRoutes = {
        host: "/host/dashboard",
        organizer: "/organizer/dashboard",
        gig: "/gig/dashboard",
      };

      const redirectTo = roleRoutes[user.role] || "/";
      navigate(redirectTo);
    } catch (error) {
      console.log("Google Auth error:", error.message);
      setErr(error.response?.data?.message || "Google authentication failed");
    }
  };

  // Test function to check if backend can set cookies
  const testCookie = async () => {
    try {
     
      const result = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}:${import.meta.env.VITE_PORT}/api/v1/test-cookie`,
        { withCredentials: true }
      );
    } catch (error) {
      console.error("🧪 Test cookie failed:", error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr("");
    
    try {
      
      const result = await axios.post(
        `${serverURL}/auth/users/login`,
        { email, password },
        { withCredentials: true }
      );
      const { user, accessToken, refreshToken } = result.data.data;
      
      // Update auth context
      login(user, accessToken, refreshToken);
      
      setEmail("");
      setPassword("");

      // Redirect based on user role
      const roleRoutes = {
        host: "/host/dashboard",
        organizer: "/organizer/dashboard",
        gig: "/gig/dashboard",
      };

      const redirectTo = roleRoutes[user.role] || "/";
      navigate(redirectTo);
    } catch (error) {
      console.log("❌ Login error:", error.response?.data || error.message);
      console.error("Full error:", error);
      setErr(error.response?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 relative border border-purple-100 animate-fade-in">
        {/* Close Button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 right-4 text-gray-400 hover:text-purple-600 transition-colors"
        >
          <FaTimes className="text-2xl" />
        </button>
        
        {/* Title */}
        <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 mb-2">
          EventFlex
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Login to your account and explore events!
        </p>

        {/* Google OAuth */}
        <button
          type="button"
          className="w-full flex cursor-pointer items-center justify-center gap-3 border-2 border-purple-200 rounded-lg shadow-md py-2 px-4 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 mb-6" onClick={handleGoogleAuth}
        >
          <FcGoogle className="text-2xl" />
          <span className="text-gray-700 font-medium">Login with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center mb-6">
          <hr className="flex-grow border-gray-300" />
          <span className="px-2 text-gray-400 text-sm">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
          />

          {/* Password with toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              required
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              placeholder="Password"
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-gray-300 focus:outline-none pr-10"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-600"
            >
              {showPassword ? (
                <AiOutlineEyeInvisible className="text-xl" />
              ) : (
                <AiOutlineEye className="text-xl" />
              )}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Login
          </button>
          {err && <p className="text-red-600 text-sm mt-2 font-medium bg-red-50 p-3 rounded-lg">{err}</p>}
        </form>
        
        <div className="flex justify-end">
  <span
    className="cursor-pointer text-sm text-purple-600 hover:text-indigo-600 hover:underline font-medium"
    onClick={() => navigate("/forgot-password")}
  >
    Forget Password
  </span>
</div>


        {/* Footer */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          Don’t have an account?{" "} <br />
          <span onClick={() => navigate("/register")} className="cursor-pointer text-purple-600 hover:text-indigo-600 hover:underline font-semibold">
            Register here 
          </span>
        </p>
    </div>
  );
}

export default Login;