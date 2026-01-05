import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../config/supabaseClient";

function ForgotPassword() {
  const navigate = useNavigate();

  // States
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState(""); // Admin ID OR Email
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // OTP states
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [resendTime, setResendTime] = useState(60);
  const [invalidOtp, setInvalidOtp] = useState(false);
  
  // NEW: UI feedback states
  const [showResendSuccess, setShowResendSuccess] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // Store verified admin data
  const [verifiedData, setVerifiedData] = useState({
    admin_id: null,
    email: ""
  });

  // Images
  const CentroLogo = "/images/CENTRO_Logo.png";
  const PasswordIcon = "/images/password.svg";
  const ShowPasswordIcon = "/images/showpassword.svg";

  // Auto-hide error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-hide resend success message
  useEffect(() => {
    if (showResendSuccess) {
      const timer = setTimeout(() => setShowResendSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showResendSuccess]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval;
    if (step === 2 && resendTime > 0) {
      interval = setInterval(() => {
        setResendTime((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTime]);

  // Generate random 6-digit OTP
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP email using backend API
  const sendOtpEmail = async (email, otpCode) => {
    try {
      // Call your backend endpoint instead of Resend directly
      const response = await fetch("http://localhost:5000/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otpCode: otpCode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Email send failed:", errorData);
        throw new Error("Failed to send email");
      }

      console.log("✅ OTP sent successfully to", email);
      return true;
    } catch (error) {
      console.error("❌ Error sending OTP:", error);
      return false;
    }
  };


  // Step 1: Verify Admin ID OR Email
  const handleVerifyAccount = async () => {
    setError("");
    
    if (!identifier.trim()) {
      setError("Please enter your Admin ID or Email.");
      return;
    }

    setLoading(true);

    try {
      console.log("=== STEP 1: Verifying identifier ===");
      console.log("Identifier:", identifier.trim());

      // Check if input is email or admin ID
      const isEmail = identifier.includes("@");

      let query = supabase
        .from("NGO_Information")
        .select("admin_id, email");

      if (isEmail) {
        console.log("Searching by email...");
        query = query.eq("email", identifier.trim().toLowerCase());
      } else {
        console.log("Searching by admin_id...");
        query = query.eq("admin_id", identifier.trim());
      }

      const { data, error: dbError } = await query.maybeSingle();

      if (dbError) {
        console.error("❌ Supabase error:", dbError);
        setError("Database error. Please try again.");
        setLoading(false);
        return;
      }

      console.log("Query result:", data);

      if (!data) {
        setError("Account not found. Please check your Admin ID or Email.");
        setLoading(false);
        return;
      }

      // Check if email exists
      if (!data.email) {
        setError("No email associated with this account. Please contact support.");
        setLoading(false);
        return;
      }

      console.log("✅ Account found - Admin ID:", data.admin_id, "Email:", data.email);

      // Store verified data
      setVerifiedData({
        admin_id: data.admin_id,
        email: data.email
      });

      // Generate and send OTP
      const otpCode = generateOtp();
      setGeneratedOtp(otpCode);
      
      console.log("📧 Sending OTP to:", data.email);
      const emailSent = await sendOtpEmail(data.email, otpCode);
      
      if (!emailSent) {
        setError("Failed to send OTP. Please try again.");
        setLoading(false);
        return;
      }

      console.log("✅ Account verified, OTP sent successfully");
      setStep(2);
      setResendTime(60);
      setLoading(false);

    } catch (err) {
      console.error("❌ Verification error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 6) {
      setError("Please enter complete OTP.");
      return;
    }

    setIsVerifyingOtp(true);
    setError("");
    setInvalidOtp(false);

    // Simulate verification delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log("Verifying OTP - Entered:", enteredOtp, "Generated:", generatedOtp);

    if (enteredOtp === generatedOtp) {
      console.log("✅ OTP verified successfully");
      setInvalidOtp(false);
      setError("");
      setIsVerifyingOtp(false);
      setStep(3);
    } else {
      setInvalidOtp(true);
      setError("Invalid OTP! Please try again.");
      setIsVerifyingOtp(false);
      
      // Shake animation for invalid OTP
      const otpInputs = document.querySelectorAll('[id^="otp-"]');
      otpInputs.forEach(input => {
        input.classList.add('animate-shake');
        setTimeout(() => input.classList.remove('animate-shake'), 500);
      });
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError("");
    setInvalidOtp(false);
    setOtp(["", "", "", "", "", ""]);
    setIsResending(true);
    
    const otpCode = generateOtp();
    setGeneratedOtp(otpCode);
    
    console.log("📧 Resending OTP to:", verifiedData.email);
    const emailSent = await sendOtpEmail(verifiedData.email, otpCode);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (emailSent) {
      setResendTime(60);
      setShowResendSuccess(true);
      console.log("✅ OTP resent successfully");
    } else {
      setError("Failed to resend OTP. Please try again.");
    }
    
    setIsResending(false);
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      console.log("=== STEP 3: Resetting Password ===");
      console.log("Updating password for admin_id:", verifiedData.admin_id);

      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update password in NGO_Information table
      const { data, error: dbError } = await supabase
        .from("NGO_Information")
        .update({ password: newPassword })
        .eq("admin_id", verifiedData.admin_id)
        .select();

      if (dbError) {
        console.error("❌ Password update error:", dbError);
        setError("Failed to reset password. Please try again.");
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        console.error("❌ No data returned after update");
        setError("Failed to update password. Account not found.");
        setLoading(false);
        return;
      }

      console.log("✅ Password reset successful!", data);
      setLoading(false);
      setShowSuccessModal(true);

    } catch (err) {
      console.error("❌ Reset password error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setInvalidOtp(false);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100 font-montserrat">
      {/* Add shake animation styles */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src={CentroLogo} alt="Centro Logo" className="w-40 mb-4" />
          
          <h2 className="text-2xl font-bold text-emerald-800 mb-1">
            {step === 1 && "Forgot Password"}
            {step === 2 && "Verify OTP"}
            {step === 3 && "Reset Password"}
          </h2>

          <p className="text-gray-600 text-center text-sm px-4">
            {step === 1 && "Enter your Admin ID or Email Address."}
            {step === 2 && "Please check your email for the OTP code."}
            {step === 3 && "Create a new password for your account."}
          </p>
        </div>

        {/* Step 1: Enter Admin ID OR Email */}
        {step === 1 && (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter your Admin ID or Email"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-700 transition-all font-medium text-gray-700"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleVerifyAccount()}
                autoFocus
              />
            </div>

            <button
              onClick={handleVerifyAccount}
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition duration-300 disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verifying...</span>
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-600 text-center mb-4">
                Enter the 6-digit code sent to:<br />
                <span className="font-semibold text-emerald-700">{verifiedData.email}</span>
              </p>

              {/* OTP Input Boxes */}
              <div className="flex justify-center gap-2 mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg outline-none transition-all ${
                      invalidOtp 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-yellow-400 focus:border-emerald-700'
                    }`}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  />
                ))}
              </div>

              {/* Invalid OTP message */}
              {invalidOtp && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm font-medium">
                    Invalid OTP! Please check and try again.
                  </p>
                </div>
              )}

              {/* Resend success message */}
              {showResendSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3 flex items-center gap-2 animate-pulse">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-emerald-700 text-sm font-medium">
                    New OTP sent successfully!
                  </p>
                </div>
              )}

              {/* Resend section */}
              <div className="text-center text-sm mb-4">
                {resendTime > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Resend OTP in <span className="font-bold text-emerald-700">{resendTime}s</span></span>
                  </div>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={isResending}
                    className="text-emerald-700 hover:underline font-semibold flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                  >
                    {isResending ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Resend OTP</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={isVerifyingOtp}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition duration-300 mb-3 flex items-center justify-center gap-2 disabled:bg-emerald-400 disabled:cursor-not-allowed"
            >
              {isVerifyingOtp ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verifying...</span>
                </>
              ) : (
                "Verify OTP"
              )}
            </button>

            <div className="text-center">
              <button
                onClick={() => {
                  setStep(1);
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                  setInvalidOtp(false);
                  setShowResendSuccess(false);
                }}
                className="text-emerald-700 hover:underline text-sm font-medium"
              >
                ← Change Account
              </button>
            </div>
          </>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <>
            {/* Password strength indicator */}
            {newPassword && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        newPassword.length < 6 ? 'bg-red-500 w-1/3' :
                        newPassword.length < 10 ? 'bg-yellow-500 w-2/3' :
                        'bg-emerald-500 w-full'
                      }`}
                    ></div>
                  </div>
                  <span className={`text-xs font-semibold ${
                    newPassword.length < 6 ? 'text-red-600' :
                    newPassword.length < 10 ? 'text-yellow-600' :
                    'text-emerald-600'
                  }`}>
                    {newPassword.length < 6 ? 'Weak' :
                     newPassword.length < 10 ? 'Good' :
                     'Strong'}
                  </span>
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="flex items-center bg-white rounded-xl border-2 border-gray-200 px-4 py-3 focus-within:border-emerald-700 transition-all">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="w-full bg-transparent outline-none font-medium text-gray-700 text-sm"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="ml-2 focus:outline-none"
                >
                  <img
                    src={showNewPassword ? ShowPasswordIcon : PasswordIcon}
                    alt="Toggle password"
                    className="w-4 h-4"
                  />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className={`flex items-center bg-white rounded-xl border-2 px-4 py-3 transition-all ${
                confirmPassword && newPassword !== confirmPassword 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 focus-within:border-emerald-700'
              }`}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  className="w-full bg-transparent outline-none font-medium text-gray-700 text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleResetPassword()}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ml-2 focus:outline-none"
                >
                  <img
                    src={showConfirmPassword ? ShowPasswordIcon : PasswordIcon}
                    alt="Toggle password"
                    className="w-4 h-4"
                  />
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Passwords do not match
                </p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Passwords match
                </p>
              )}
            </div>

            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition duration-300 disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Resetting Password...</span>
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 text-center bg-red-500 text-white text-sm font-semibold py-2 px-3 rounded-xl animate-pulse">
            {error}
          </div>
        )}

        {/* Back to Login */}
        <div className="text-center mt-6 mb-4">
          <Link
            to="/"
            className="text-emerald-700 hover:underline font-semibold text-sm"
          >
            ← Back to Login
          </Link>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Password Reset Successful!
              </h3>
              <p className="text-gray-600 text-center text-sm mb-6">
                Your password has been reset successfully. You can now login with your new password.
              </p>

              <button
                onClick={() => navigate("/")}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition duration-300"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForgotPassword;