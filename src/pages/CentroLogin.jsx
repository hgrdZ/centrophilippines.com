import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../config/supabaseClient";

function CentroLogin({ setIsAuthenticated }) {
  const navigate = useNavigate();

  // ===================== STATES =====================
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // ===================== IMAGES =====================
  // Use process.env.PUBLIC_URL for deployment-safe paths (works on Vercel, GitHub, etc.)
  const images = useMemo(
    () => [
      process.env.PUBLIC_URL + "/images/volunteer1.png",
      process.env.PUBLIC_URL + "/images/volunteer2.png",
      process.env.PUBLIC_URL + "/images/volunteer3.png",
      process.env.PUBLIC_URL + "/images/volunteer4.png",
      process.env.PUBLIC_URL + "/images/volunteer5.png",
      process.env.PUBLIC_URL + "/images/volunteer6.png",
      process.env.PUBLIC_URL + "/images/volunteer7.png",
    ],
    []
  );

  const CentroLogo = process.env.PUBLIC_URL + "/images/CENTRO_Logo.png";
  const LoginIcon = process.env.PUBLIC_URL + "/images/login.svg";
  const PasswordIcon = process.env.PUBLIC_URL + "/images/password.svg";
  const ShowPasswordIcon = process.env.PUBLIC_URL + "/images/showpassword.svg";

  // ===================== SLIDESHOW STATES =====================
  const [currentImage, setCurrentImage] = useState(images[0]);
  const [nextImage, setNextImage] = useState(images[1]);
  const [fadeIn, setFadeIn] = useState(true);

  // ===================== IMAGE SLIDESHOW EFFECT =====================
  useEffect(() => {
    const changeImage = () => {
      setFadeIn(false); // start fade-out animation
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * images.length);
        setCurrentImage(nextImage);
        setNextImage(images[randomIndex]);
        setFadeIn(true); // fade-in next image
      }, 500);
    };

    const interval = setInterval(changeImage, 10000);
    return () => clearInterval(interval);
  }, [nextImage, images]);

  // ===================== LOAD SAVED CREDENTIALS =====================
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

  // ===================== HANDLE LOGIN =====================
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
        // Save credentials if "Remember Me" is checked
        if (rememberMe) {
          localStorage.setItem("rememberedLoginId", loginId);
          localStorage.setItem("rememberedPassword", password);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberedLoginId");
          localStorage.removeItem("rememberedPassword");
          localStorage.removeItem("rememberMe");
        }

        // Simulated loading animation
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

  // ===================== RETURN JSX =====================
  return (
    <div className="h-screen w-screen overflow-hidden relative font-montserrat bg-white opacity-100">
      <div className="flex h-full w-full">
        {/* LEFT SIDE - Auto Slideshow */}
<div className="w-1/2 relative sm:flex hidden items-center justify-center overflow-hidden">
          {/* Current Image */}
          <img
            src={currentImage}
            alt="Volunteer"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              fadeIn ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Next Image */}
          <img
            src={nextImage}
            alt="Volunteer next"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              fadeIn ? "opacity-0" : "opacity-100"
            }`}
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="w-full md:w-1/2 flex flex-col items-center bg-gray-100 opacity-90 relative">
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full flex flex-col items-center mt-12 px-2">
            <img src={CentroLogo} className="mt-28 w-64 md:w-1/2" alt="Centro Logo" />

            <h2 className="text-4xl font-extrabold text-emerald-800 mb-3">Hello, Admin!</h2>
            <p className="text-emerald-800 mb-6 text-base">Welcome to CENTRO!</p>

            {/* Admin ID Input */}
            <div className="w-3/4 mb-4">
              <div className="flex items-center bg-white rounded-xl border-2 border-gray-200 px-5 py-3 focus-within:border-emerald-700 transition-all shadow-sm">
                <input
                  type="text"
                  placeholder="Enter your Admin ID"
                  className="w-full bg-transparent outline-none font-semibold text-gray-700 text-base"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                />
                <img src={LoginIcon} alt="User Icon" className="w-5 h-5 ml-2" />
              </div>
            </div>

            {/* Password Input */}
            <div className="w-3/4 mb-3">
              <div className="flex items-center bg-white rounded-xl border-2 border-gray-200 px-5 py-3 focus-within:border-emerald-700 transition-all shadow-sm">
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
                  className="ml-2 focus:outline-none cursor-pointer"
                >
                  <img
                    src={showPassword ? ShowPasswordIcon : PasswordIcon}
                    alt="Toggle password visibility"
                    className="w-5 h-5 cursor-pointer"
                  />
                </button>
              </div>
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="w-3/4 flex justify-between items-center mt-1 mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-emerald-700 bg-white border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700 font-medium">Remember Me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-gray-700 hover:underline font-medium">
                Forgot Password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="w-3/4 mb-4 text-center bg-red-500 text-white text-sm font-semibold py-2 rounded-xl">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className="w-3/4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-md cursor-pointer"
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
