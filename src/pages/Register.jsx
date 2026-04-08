import React, { useState, useEffect } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../App";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("gig");
  const [first_name, setFirst_name] = useState("");
  const [last_name, setLast_name] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  // Clear form when component mounts
  useEffect(() => {
    setEmail("");
    setFirst_name("");
    setLast_name("");
    setPassword("");
    setPhone("");
    setRole("gig");
    setErr("");
    setShowPassword(false);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const result = await axios.post(
        `${serverURL}/auth/users/register`,
        { first_name, last_name, email, password, phone, role },
        { withCredentials: true }
      );

      setEmail("");
      setFirst_name("");
      setLast_name("");
      setPassword("");
      setPhone("");
     

      console.log("Registration successful:", result.data);
      navigate(`/login`);
    } catch (error) {
      setErr(error.response?.data?.message || "Registration failed");
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );
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
          Create your account and join us today!
        </p>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleRegister}>
          {/* Role Selection */}
          <div className="flex justify-between mb-4 ">
            {["organizer", "gig", "host"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 mx-1 cursor-pointer rounded-lg font-semibold border transition-all duration-300 ${
                  role === r 
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600 shadow-lg" 
                    : "bg-white text-gray-600 border-gray-300 hover:border-purple-300 hover:bg-purple-50"
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {/* Name Fields */}
          <div className="flex gap-4">
            <input
              type="text"
              name="first_name"
              autoComplete="given-name"
              required
              onChange={(e) => setFirst_name(e.target.value)}
              value={first_name}
              placeholder="First Name"
              className="w-1/2 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
            />
            <input
              type="text"
              name="last_name"
              autoComplete="family-name"
              required
              onChange={(e) => setLast_name(e.target.value)}
              value={last_name}
              placeholder="Last Name"
              className="w-1/2 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
            />
          </div>

          {/* Email */}
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            placeholder="Your email"
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
          />

          {/* Phone */}
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            required
            onChange={(e) => setPhone(e.target.value)}
            value={phone}
            placeholder="Your phone"
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              required
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              placeholder="Password"
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-gray-300 focus:outline-none pr-10"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-black hover:text-gray-600"
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
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white cursor-pointer font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Signup
          </button>

          {/* Error Message */}
          {err && <p className="text-red-600 text-center font-medium bg-red-50 p-3 rounded-lg">{err}</p>}
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-purple-600 hover:text-indigo-600 hover:underline cursor-pointer font-semibold"
          >
            Login
          </span>
        </p>
    </div>
  );
}

export default Register;
