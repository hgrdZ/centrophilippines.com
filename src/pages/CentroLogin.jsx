import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../config/supabaseClient";

function CentroLogin({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Images from public folder
  const images = [
    "/images/volunteer1.png",
    "/images/volunteer2.png",
    "/images/volunteer3.png",
    "/images/volunteer4.png",
    "/images/volunteer5.png",
    "/images/volunteer6.png",
    "/images/volunteer7.png",
  ];

  const CentroLogo = "/images/CENTRO_Logo.png";
  const LoginIcon = "/images/login.svg";
  const PasswordIcon = "/images/password.svg";
  const ShowPasswordIcon = "/images/showpassword.svg";

  // Animated image slideshow states
  const [currentImage, setCurrentImage] = useState(images[0]);
  const [nextImage, setNextImage] = useState(images[1]);
  const [fadeIn, setFadeIn] = useState(true);

  // Smooth image transition every 10 seconds
  useEffect(() => {
    const changeImage = () => {
      setFadeIn(false);
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * images.length);
        setCurrentImage(nextImage);
        setNextImage(images[randomIndex]);
        setFadeIn(true);
      }, 500);
    };

    const interval = setInterval(changeImage, 10000);
    return () => clearInterval(interval);
  }, [nextImage, images]);

  // Load saved credentials on mount
  useEffect(() => {
    const savedLoginId = localStorage.getItem("rememberedLoginId");
    const savedPassword = localStorage.getItem("rememberedPassword");
    const wasRemembered = localStorage.getItem("rememberMe") === "true";

    if (wasRemembered && savedLoginId && savedPassword) {
      setLoginId(savedLoginId);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async () => {
    setError("");

    if (!loginId || !password) {
      setError("Both Admin ID and Password are required.");
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const { data, error } = await supabase
        .from("NGO_Admin")
        .select(`
          *,
          NGO_Information (
            ngo_code, name, description, address, phone_number, email
          )
        `)
        .eq("login_id", loginId)
        .eq("password", password)
        .single();

      if (error || !data) {
        setError("Invalid Admin ID or Password.");
        setLoading(false);
      } else {
        if (rememberMe) {
          localStorage.setItem("rememberedLoginId", loginId);
          localStorage.setItem("rememberedPassword", password);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberedLoginId");
          localStorage.removeItem("rememberedPassword");
          localStorage.removeItem("rememberMe");
        }

        let i = 0;
        const interval = setInterval(() => {
          i += 10;
          setProgress(i);
          if (i >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsAuthenticated(true);
              localStorage.setItem("isAuthenticated", "true");
              localStorage.setItem("admin", JSON.stringify(data));
              navigate("/dashboard");
            }, 300);
          }
        }, 150);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden font-montserrat bg-white flex">
      {/* LEFT SIDE - Animated Auto-Slideshow */}
      <div className="hidden md:flex md:w-1/2 relative items-center justify-center overflow-hidden">
        <img
          src={currentImage}
          alt="Volunteer"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            fadeIn ? "opacity-100" : "opacity-0"
          }`}
        />
        <img
          src={nextImage}
          alt="Volunteer next"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            fadeIn ? "opacity-0" : "opacity-100"
          }`}
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* RIGHT SIDE - Fixed Container with Perfect Centering */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 min-h-screen">
        <div className="w-full max-w-[500px] px-8 py-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={CentroLogo} className="w-40 h-auto" alt="Centro Logo" />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold font-montserrat text-emerald-800 mb-3">
              Hello, Admin!
            </h2>
            <p className="text-emerald-800 text-base font-medium">Welcome to CENTRO!</p>
          </div>

          {/* Login Form */}
          <div className="space-y-5">
            {/* Username Input */}
            <div className="w-full">
              <div className="flex items-center bg-white rounded-xl border-2 border-gray-200 px-5 py-4 focus-within:border-emerald-700 transition-all shadow-sm">
                <input
                  type="text"
                  placeholder="Enter your Admin ID"
                  className="w-full bg-transparent outline-none font-semibold text-gray-700 text-base placeholder-gray-400"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                />
                <img src={LoginIcon} alt="User Icon" className="w-5 h-5 ml-3 flex-shrink-0" />
              </div>
            </div>

            {/* Password Input */}
            <div className="w-full">
              <div className="flex items-center bg-white rounded-xl border-2 border-gray-200 px-5 py-4 focus-within:border-emerald-700 transition-all shadow-sm">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full bg-transparent outline-none font-semibold text-gray-700 text-base placeholder-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-3 focus:outline-none flex-shrink-0"
                >
                  <img
                    src={showPassword ? ShowPasswordIcon : PasswordIcon}
                    alt="Toggle password visibility"
                    className="w-5 h-5"
                  />
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center py-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-emerald-700 bg-white border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700 font-medium">
                  Remember Me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-gray-700 hover:underline font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Error Message - Fixed Height Space */}
            <div className="h-14 flex items-center justify-center">
              {error && (
                <div className="w-full text-center bg-red-500 text-white text-sm font-semibold py-2.5 rounded-xl shadow-md">
                  {error}
                </div>
              )}
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleLogin}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-4 rounded-xl transition duration-300 shadow-md text-base"
            >
              LOG IN
            </button>
          </div>
        </div>
      </div>

      {/* LOADING SCREEN */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <img src={CentroLogo} alt="Centro Logo" className="w-32 mb-4 animate-pulse" />
          <div className="w-60 h-3 bg-white/20 rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400 rounded-full animate-progress"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-white font-semibold text-sm">{progress}% Loading...</p>
          <style>{`
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            .animate-progress {
              background-size: 200% 100%;
              animation: shimmer 1.5s linear infinite;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default CentroLogin;