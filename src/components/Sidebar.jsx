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
import HamburgerIcon from "../images/hamburger.svg"; 

// Supabase client
import supabase from "../config/supabaseClient";

function Sidebar({ handleAlert, onCollapseChange }) {
  const [ngoLogo, setNgoLogo] = useState(localStorage.getItem("ngoLogo") || "");
  const [adminId, setAdminId] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true" || false
  );
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
              localStorage.setItem("ngoLogo", ngoData.ngo_logo);
            }
          } catch (error) {
            console.error("Error fetching logo:", error);
          }
        };

        fetchAdminLogo();
      }
    }
  }, [ngoLogo]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      localStorage.removeItem("admin");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("ngoLogo");
      navigate("/login");
    }
  };

  // Toggle collapse with localStorage persistence
  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem("sidebarCollapsed", newValue);
      if (onCollapseChange) {
        onCollapseChange(newValue);
      }
      return newValue;
    });
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
      <aside 
        className={`fixed top-0 left-0 h-screen shadow-xl border-r-2 border-emerald-300 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        }`}
        style={{ backgroundColor: "#d8eeeb" }}
      >
        <div className={`${collapsed ? "p-2" : "p-4"} relative`}>
          {/* Hamburger Menu Button - Centered when collapsed */}
          <button
            onClick={toggleCollapse}
            className={`text-gray-700 p-2 flex items-center justify-center transition-all duration-200 group rounded-lg bg-white hover:bg-emerald-100 hover:scale-110 z-50 cursor-e-resize ${
              collapsed ? "w-full mb-2" : "absolute"
            }`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <img 
              src={HamburgerIcon} 
              alt="Menu" 
              className="w-6 h-6 transition-all duration-200"
            />
          </button>

          {/* Logo Section */}
          <div className={`relative mb-4 ${collapsed ? "mt-0" : "mt-12"}`}>
            <div 
              className={`w-full bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${
                collapsed ? "h-14" : "h-40"
              }`}
            >
              {ngoLogo ? (
                <img
                  src={ngoLogo}
                  alt="Organization Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-400 font-montserrat font-semibold">
                  {collapsed ? "L" : "LOGO"}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="space-y-2 text-base font-montserrat text-gray-700" id="sidebarButtons">
            <Link to="/dashboard">
              <button
                className={`w-full text-left font-montserrat rounded-xl flex items-center transition-all duration-200 cursor-pointer ${
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-3"
                } ${
                  isActive("/dashboard")
                    ? "bg-emerald-600 text-white font-semibold shadow-lg scale-105"
                    : "hover:bg-emerald-100 hover:scale-105"
                }`}
                title={collapsed ? "Dashboard" : ""}
              >
                <img src={DashboardIcon} alt="Dashboard" className="w-6 h-6 flex-shrink-0" />
                {!collapsed && <span className="truncate">Dashboard</span>}
              </button>
            </Link>

            <Link to="/volunteer">
              <button
                className={`w-full text-left font-montserrat rounded-xl flex items-center transition-all duration-200 cursor-pointer ${
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-3"
                } ${
                  isActive("/volunteer")
                    ? "bg-emerald-600 text-white font-semibold shadow-lg scale-105"
                    : "hover:bg-emerald-100 hover:scale-105"
                }`}
                title={collapsed ? "Volunteers" : ""}
              >
                <img src={VolunteersIcon} alt="Volunteers" className="w-6 h-6 flex-shrink-0" />
                {!collapsed && <span className="truncate">Volunteers</span>}
              </button>
            </Link>

            <Link to="/manage-reports">
              <button
                className={`w-full text-left font-montserrat rounded-xl flex items-center transition-all duration-200 cursor-pointer ${
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-3"
                } ${
                  isActive("/manage-reports")
                    ? "bg-emerald-600 text-white font-semibold shadow-lg scale-105"
                    : "hover:bg-emerald-100 hover:scale-105"
                }`}
                title={collapsed ? "Manage Reports" : ""}
              >
                <img src={ManageReportsIcon} alt="Manage Reports" className="w-6 h-6 flex-shrink-0" />
                {!collapsed && <span className="truncate">Manage Reports</span>}
              </button>
            </Link>

            <Link to="/review-application">
              <button
                className={`w-full text-left font-montserrat rounded-xl flex items-center transition-all duration-200 cursor-pointer ${
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-3"
                } ${
                  isActive("/review-application")
                    ? "bg-emerald-600 text-white font-semibold shadow-lg scale-105"
                    : "hover:bg-emerald-100 hover:scale-105"
                }`}
                title={collapsed ? "Review Application" : ""}
              >
                <img src={ReviewAppIcon} alt="Review Application" className="w-6 h-6 flex-shrink-0" />
                {!collapsed && <span className="truncate">Review Application</span>}
              </button>
            </Link>

            <Link to="/calendar">
              <button
                className={`w-full text-left font-montserrat rounded-xl flex items-center transition-all duration-200 cursor-pointer ${
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-3"
                } ${
                  isActive("/calendar")
                    ? "bg-emerald-600 text-white font-semibold shadow-lg scale-105"
                    : "hover:bg-emerald-100 hover:scale-105"
                }`}
                title={collapsed ? "Calendar" : ""}
              >
                <img src={CalendarIcon} alt="Calendar" className="w-6 h-6 flex-shrink-0" />
                {!collapsed && <span className="truncate">Calendar</span>}
              </button>
            </Link>

            <Link to="/messages">
              <button
                className={`w-full text-left font-montserrat rounded-xl flex items-center transition-all duration-200 cursor-pointer ${
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-3"
                } ${
                  isActive("/messages")
                    ? "bg-emerald-600 text-white font-semibold shadow-lg scale-105"
                    : "hover:bg-emerald-100 hover:scale-105"
                }`}
                title={collapsed ? "Messages" : ""}
              >
                <img src={MessagesIcon} alt="Messages" className="w-6 h-6 flex-shrink-0" />
                {!collapsed && <span className="truncate">Messages</span>}
              </button>
            </Link>

            <Link to="/settings">
              <button
                className={`w-full text-left font-montserrat rounded-xl flex items-center transition-all duration-200 cursor-pointer ${
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-3"
                } ${
                  isActive("/settings")
                    ? "bg-emerald-600 text-white font-semibold shadow-lg scale-105"
                    : "hover:bg-emerald-100 hover:scale-105"
                }`}
                title={collapsed ? "Settings" : ""}
              >
                <img src={SettingsIcon} alt="Settings" className="w-6 h-6 flex-shrink-0" />
                {!collapsed && <span className="truncate">Settings</span>}
              </button>
            </Link>

            {adminId === "001_CHARITYPHILIPPINESORG" && (
              <Link to="/ngohub">
                <button
                  className={`w-full text-left font-montserrat rounded-xl flex items-center transition-all duration-200 cursor-pointer ${
                    collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-3"
                  } ${
                    isActive("/ngohub")
                      ? "bg-emerald-600 text-white font-semibold shadow-lg scale-105"
                      : "hover:bg-emerald-100 hover:scale-105"
                  }`}
                  title={collapsed ? "NGO Hub" : ""}
                >
                  <img src={NGOHubIcon} alt="NGO Hub" className="w-6 h-6 flex-shrink-0" />
                  {!collapsed && <span className="truncate">NGO Hub</span>}
                </button>
              </Link>
            )}
          </nav>
        </div>

        {/* Logout Button */}
        <div className={`${collapsed ? "p-2" : "p-4"}`}>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full flex items-center text-base font-montserrat text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200 hover:scale-105 cursor-pointer ${
              collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-3"
            }`}
            title={collapsed ? "Log Out" : ""}
          >
            <img src={LogoutIcon} alt="Logout" className="w-6 h-6 flex-shrink-0" />
            {!collapsed && <span className="truncate">Log Out</span>}
          </button>
        </div>
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
            className="relative bg-white rounded-2xl shadow-2xl p-8 w-96 max-w-md mx-4 transform animate-scaleIn border-2 border-red-700"
          >
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center bg-red-100 rounded-xl w-full max-w-md p-2">
                <h2 className="text-3xl font-bold text-red-600 mb-2 font-montserrat">
                   Logout
                </h2>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-8 text-lg mt-4 font-montserrat">
                Are you sure you want to log out? <br /> You will need to sign in again
                to access your account.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl text-lg font-montserrat font-semibold hover:bg-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                >
                  Log Out
                </button>
                <button
                  onClick={handleCloseModal}
                  className="bg-white text-gray-800 px-6 py-3 rounded-xl text-lg font-montserrat font-semibold border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
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