import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// Sidebar Icons
import DashboardIcon from "../images/dashboard.png";
import VolunteersIcon from "../images/volunteers.png";
import ManageReportsIcon from "../images/manage report.png";
import ReviewAppIcon from "../images/review-application.png";
import CalendarIcon from "../images/calendar.png";
import MessagesIcon from "../images/messages.png";
import SettingsIcon from "../images/settings.png";
import NGOHubIcon from "../images/ngohub.png";
import LogoutIcon from "../images/logout.png";

// Supabase client
import supabase from "../config/supabaseClient";

function Sidebar({ handleAlert }) {
  const [ngoLogo, setNgoLogo] = useState(localStorage.getItem("ngoLogo") || "");
  const [adminId, setAdminId] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const loggedInAdmin = JSON.parse(localStorage.getItem("admin"));
    if (loggedInAdmin) {
      setAdminId(loggedInAdmin.admin_id);

      if (!ngoLogo) {
        const fetchAdminLogo = async () => {
          try {
            const { data: ngoData, error: ngoError } = await supabase
              .from("NGO_Information")
              .select("ngo_logo")
              .eq("admin_id", loggedInAdmin.admin_id)
              .single();

            if (ngoError) throw ngoError;
            if (ngoData?.ngo_logo) {
              setNgoLogo(ngoData.ngo_logo);
              localStorage.setItem("ngoLogo", ngoData.ngo_logo); // ✅ Cache it
            }
          } catch (error) {
            console.error("Error fetching logo:", error);
          }
        };

        fetchAdminLogo();
      }
    }
  }, [ngoLogo]);

  // ✅ Clear logo cache on logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      localStorage.removeItem("admin");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("ngoLogo"); // ✅ clear cached logo
      navigate("/login");
    }
  };

  // Prevent body scroll when modal is open and handle ESC key
  useEffect(() => {
    if (showLogoutConfirm) {
      document.body.style.overflow = "hidden";

      const handleEscKey = (event) => {
        if (event.key === "Escape") {
          setShowLogoutConfirm(false);
        }
      };

      document.addEventListener("keydown", handleEscKey);

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscKey);
      };
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showLogoutConfirm]);

  const handleCloseModal = () => setShowLogoutConfirm(false);
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleCloseModal();
  };

  return (
    <>
      <aside className="fixed top-0 left-0 h-screen w-64 shadow-lg border-r border-gray-200 flex flex-col justify-between p-4 z-30" style={{ backgroundColor: "#d8eeeb" }}>
  <div>
    {/* ✅ Logo Section - Full Cover */}
    <div className="w-full h-50 bg-gray-100 rounded-lg shadow-sm overflow-hidden mb-8">
      {ngoLogo ? (
        <img
          src={ngoLogo}
          alt="Organization Logo"
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="flex items-center justify-center w-full h-full text-gray-400">
          Logo
        </span>
      )}
    </div>

    {/* ✅ Sidebar Navigation */}
    <nav className="space-y-3 text-base font-montserrat text-gray-700" id="sidebarButtons">
      <Link to="/dashboard">
        <button
          className={`w-full text-left font-montserrat px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 cursor-pointer ${
            isActive("/dashboard")
              ? "bg-emerald-600 text-white font-montserrat font-semibold shadow-md border-emerald-600"
              : "border-gray-200 hover:border-emerald-400 hover:bg-emerald-100"
          }`}
        >
          <img src={DashboardIcon} alt="Dashboard" className="w-5 h-5" />
          <span>Dashboard</span>
        </button>
      </Link>

      <Link to="/volunteer">
        <button
          className={`w-full text-left px-4 py-3 font-montserrat  rounded-lg flex items-center gap-3 transition-all cursor-pointer ${
            isActive("/volunteer")
              ? "bg-emerald-600 text-white font-montserrat font-semibold shadow-md border-emerald-600"
              : "border-gray-200 hover:border-emerald-400 hover:bg-emerald-100"
          }`}
        >
          <img src={VolunteersIcon} alt="Volunteers" className="w-5 h-5" />
          <span>Volunteers</span>
        </button>
      </Link>

      <Link to="/manage-reports">
        <button
          className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${
            isActive("/manage-reports")
              ? "bg-emerald-600 text-white font-semibold shadow-md border-emerald-600"
              : "border-gray-200 hover:border-emerald-400 hover:bg-emerald-100"
          }`}
        >
          <img src={ManageReportsIcon} alt="Manage Reports" className="w-5 h-5" />
          <span>Manage Reports</span>
        </button>
      </Link>

      <Link to="/review-application">
        <button
          className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${
            isActive("/review-application")
              ? "bg-emerald-600 text-white font-semibold shadow-md border-emerald-600"
              : "border-gray-200 hover:border-emerald-400 hover:bg-emerald-100"
          }`}
        >
          <img src={ReviewAppIcon} alt="Review Application" className="w-5 h-5" />
          <span>Review Application</span>
        </button>
      </Link>

      <Link to="/calendar">
        <button
          className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3  transition-all cursor-pointer ${
            isActive("/calendar")
              ? "bg-emerald-600 text-white font-semibold shadow-md border-emerald-600"
              : "border-gray-200 hover:border-emerald-400 hover:bg-emerald-100"
          }`}
        >
          <img src={CalendarIcon} alt="Calendar" className="w-5 h-5" />
          <span>Calendar</span>
        </button>
      </Link>

      <Link to="/messages">
        <button
          className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${
            isActive("/messages")
              ? "bg-emerald-600 text-white font-semibold shadow-md border-emerald-600"
              : "border-gray-200 hover:border-emerald-400 hover:bg-emerald-100"
          }`}
        >
          <img src={MessagesIcon} alt="Messages" className="w-5 h-5" />
          <span>Messages</span>
        </button>
      </Link>

      <Link to="/settings">
        <button
          className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${
            isActive("/settings")
              ? "bg-emerald-600 text-white font-semibold shadow-md border-emerald-600"
              : "border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          <img src={SettingsIcon} alt="Settings" className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </Link>

      {adminId === "001_CHARITYPHILIPPINESORG" && (
        <Link to="/ngohub">
          <button
            className={`w-full text-left font-montserrat px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 cursor-pointer ${
              isActive("/ngohub")
                ? "bg-emerald-600 text-white font-semibold shadow-md border-emerald-600"
                : "border-gray-200 hover:border-emerald-500 hover:bg-emerald-100"
            }`}
          >
            <img src={NGOHubIcon} alt="NGO Hub" className="w-5 h-5" />
            <span>NGO Hub</span>
          </button>
        </Link>
      )}
    </nav>
  </div>

  {/* ✅ Logout */}
  <button
    onClick={() => setShowLogoutConfirm(true)}
    className="flex items-center gap-2 px-4 py-3 text-base font-montserrat text-red-600 rounded hover:bg-red-100 cursor-pointer transition-colors duration-200"
  >
    <img src={LogoutIcon} alt="Logout" className="w-5 h-5" />
    <span>Log Out</span>
  </button>
</aside>

      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center animate-fadeIn"
          onClick={handleBackdropClick}
          style={{
            zIndex: 99999999,
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div
            className="relative bg-white rounded-xl shadow-2xl p-8 w-96 max-w-md mx-4 transform animate-scaleIn border-2 border-red-700"
          >
            <div className="flex justify-center mb-4">
              <div className=" flex items-center justify-center">
                <h2 className="text-3xl font-bold text-red-700 mb-2 font-montserrat">
                Confirm Logout
              </h2>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-8 text-lg mt-4 font-montserrat">
                Are you sure you want to log out? You will need to sign in again
                to access your account.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-montserrat border-2 border-red-600 hover:bg-red-700 hover:border-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                >
                  Yes, Log Out
                </button>
                <button
                  onClick={handleCloseModal}
                  className="bg-white text-gray-800 px-6 py-3 rounded-lg text-lg font-montserrat border-2 border-gray-300 hover:bg-emerald-100 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

export default Sidebar;
