import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../config/supabaseClient";

function ForgotPassword() {
  const navigate = useNavigate();

  // States
  const [step, setStep] = useState(1);
  const [loginId, setLoginId] = useState(""); // User enters this
  const [organizationName, setOrganizationName] = useState("");
  const [ngoCode, setNgoCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Store verified admin data from database (includes both admin_id and login_id)
  const [verifiedData, setVerifiedData] = useState({
    admin_id: null,
    login_id: "",
    org_name: "",
    ngo_code: ""
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

  // Step 1: Verify Login ID exists in database
  const handleFindAccount = async () => {
    setError("");
    
    if (!loginId.trim()) {
      setError("Admin ID is required.");
      return;
    }

    setLoading(true);

    try {
      console.log("=== STEP 1: Searching for Login ID ===");
      console.log("Login ID entered:", loginId);

      // Query database for this login_id and get admin_id too
      const { data, error: dbError } = await supabase
        .from("NGO_Admin")
        .select("admin_id, login_id, org_name, ngo_code")
        .eq("login_id", loginId.trim())
        .maybeSingle();

      console.log("Database response:", data);
      console.log("Database error:", dbError);

      if (dbError) {
        console.error("Supabase error:", dbError);
        setError("Database error. Please try again.");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("No account found with this Admin ID.");
        setLoading(false);
        return;
      }

      // Store ALL verified data from database
      setVerifiedData({
        admin_id: data.admin_id,
        login_id: data.login_id,
        org_name: data.org_name,
        ngo_code: data.ngo_code
      });

      console.log("✅ Login ID verified successfully");
      console.log("Admin ID (UUID):", data.admin_id);
      console.log("Login ID:", data.login_id);
      console.log("Moving to step 2...");
      
      setStep(2);
      setLoading(false);

    } catch (err) {
      console.error("Catch error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // Step 2: Verify Organization Details match exactly with database
  const handleVerifyDetails = async () => {
    setError("");

    if (!organizationName.trim() || !ngoCode.trim()) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);

    try {
      console.log("=== STEP 2: Verifying Organization Details ===");
      console.log("Admin ID (UUID):", verifiedData.admin_id);
      console.log("Login ID:", verifiedData.login_id);
      console.log("Input Org Name:", organizationName);
      console.log("Input NGO Code:", ngoCode);

      // Double-check with database using admin_id (primary key) for accuracy
      const { data, error: dbError } = await supabase
        .from("NGO_Admin")
        .select("admin_id, login_id, org_name, ngo_code")
        .eq("admin_id", verifiedData.admin_id)
        .maybeSingle();

      if (dbError) {
        console.error("Verification error:", dbError);
        setError("Database error. Please try again.");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Account not found.");
        setLoading(false);
        return;
      }

      console.log("Database Org Name:", data.org_name);
      console.log("Database NGO Code:", data.ngo_code);

      // Case-insensitive comparison for better UX
      const orgNameMatch = data.org_name.toLowerCase().trim() === organizationName.toLowerCase().trim();
      const ngoCodeMatch = data.ngo_code.toLowerCase().trim() === ngoCode.toLowerCase().trim();

      console.log("Org Name Match:", orgNameMatch);
      console.log("NGO Code Match:", ngoCodeMatch);

      if (!orgNameMatch || !ngoCodeMatch) {
        if (!orgNameMatch && !ngoCodeMatch) {
          setError("Organization Name and NGO Code do not match.");
        } else if (!orgNameMatch) {
          setError("Organization Name does not match.");
        } else {
          setError("NGO Code does not match.");
        }
        setLoading(false);
        return;
      }

      // Verification successful
      console.log("✅ Organization details verified successfully");
      console.log("Moving to step 3...");
      setStep(3);
      setLoading(false);

    } catch (err) {
      console.error("Verification error:", err);
      setError("Verification failed. Please try again.");
      setLoading(false);
    }
  };

  // Step 3: Reset Password in database using admin_id (most accurate)
  const handleResetPassword = async () => {
    setError("");

    // Validation
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
      console.log("Admin ID (UUID):", verifiedData.admin_id);
      console.log("Login ID:", verifiedData.login_id);

      // Update password using admin_id (primary key) for accuracy
      const { data, error: dbError } = await supabase
        .from("NGO_Admin")
        .update({ password: newPassword })
        .eq("admin_id", verifiedData.admin_id)
        .select();

      console.log("Update response:", data);
      console.log("Update error:", dbError);

      if (dbError) {
        console.error("Password update error:", dbError);
        setError("Failed to reset password. Please try again.");
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setError("Failed to update password. Account not found.");
        setLoading(false);
        return;
      }

      // Success!
      console.log("✅ Password reset successful!");
      console.log("Updated account:", {
        admin_id: data[0].admin_id,
        login_id: data[0].login_id
      });
      
      setLoading(false);
      setShowSuccessModal(true);

    } catch (err) {
      console.error("Reset password error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // Reset all form data
  const handleGoBack = () => {
    setStep(1);
    setLoginId("");
    setOrganizationName("");
    setNgoCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setVerifiedData({ 
      admin_id: null, 
      login_id: "", 
      org_name: "", 
      ngo_code: "" 
    });
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100 font-montserrat">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src={CentroLogo} alt="Centro Logo" className="w-40 mb-4" />
          
          <h2 className="text-2xl font-bold text-emerald-800 mb-1">
            {step === 1 && "Forgot Password"}
            {step === 2 && "Verify Your Identity"}
            {step === 3 && "Reset Password"}
          </h2>

          <p className="text-gray-600 text-center text-sm px-4">
            {step === 1 && "Enter your Admin ID to begin password reset."}
            {step === 2 && "Confirm your organization details to verify your identity."}
            {step === 3 && "Create a new password for your account."}
          </p>
        </div>

        {/* Step 1: Enter Login ID (Admin ID) */}
        {step === 1 && (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter your Admin ID"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-700 transition-all font-medium text-gray-700"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleFindAccount()}
                autoFocus
              />
            </div>

            <button
              onClick={handleFindAccount}
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition duration-300 disabled:bg-emerald-400 disabled:cursor-not-allowed"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </>
        )}

        {/* Step 2: Verify Organization Details */}
        {step === 2 && (
          <>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                placeholder="Enter your organization name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-700 transition-all font-medium text-gray-700"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                NGO Code
              </label>
              <input
                type="text"
                placeholder="Enter your NGO code"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-700 transition-all font-medium text-gray-700"
                value={ngoCode}
                onChange={(e) => setNgoCode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleVerifyDetails()}
              />
            </div>

            <button
              onClick={handleVerifyDetails}
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition duration-300 disabled:bg-emerald-400 disabled:cursor-not-allowed mb-3"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>

            {/* Back button */}
            <div className="text-center">
              <button
                onClick={() => {
                  setStep(1);
                  setOrganizationName("");
                  setNgoCode("");
                  setError("");
                }}
                className="text-emerald-700 hover:underline text-sm font-medium"
              >
                ← Change Admin ID
              </button>
            </div>
          </>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <>
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
              <div className="flex items-center bg-white rounded-xl border-2 border-gray-200 px-4 py-3 focus-within:border-emerald-700 transition-all">
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
            </div>

            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition duration-300 disabled:bg-emerald-400 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
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
              {/* Success Icon */}
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

              {/* Message */}
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Password Reset Successful!
              </h3>
              <p className="text-gray-600 text-center text-sm mb-6">
                Your password has been reset successfully. You can now login with your new password.
              </p>

              {/* Button */}
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