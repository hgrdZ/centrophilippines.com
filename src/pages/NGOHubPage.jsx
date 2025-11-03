import React, { useState, useEffect } from "react";
import {useNavigate } from "react-router-dom";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import Sidebar from "../components/Sidebar";
import supabase from "../config/supabaseClient";

function NGOHubPage() {
  const [ngoList, setNgoList] = useState([]);
  const [filteredNGOs, setFilteredNGOs] = useState([]);
  const [selectedNGOs, setSelectedNGOs] = useState([]);
  const [removeMode, setRemoveMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAddNGOModal, setShowAddNGOModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [step, setStep] = useState(1);
  const [removedCount, setRemovedCount] = useState(0);
const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true" || false
  );
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is super admin
    const admin = JSON.parse(localStorage.getItem("admin"));
    if (!admin || admin.admin_type !== 'super_admin') {
      alert("Access denied. Super admin privileges required.");
      navigate("/dashboard");
      return;
    }
    
    setAdminData(admin);
    fetchNGOsWithStats();
  }, [navigate]);

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (showConfirmModal || showSuccessModal || showAddNGOModal || showWarningModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConfirmModal, showSuccessModal, showAddNGOModal, showWarningModal]);

  // Fetch NGOs with calculated statistics
  const fetchNGOsWithStats = async () => {
    setLoading(true);
    try {
      // Get all NGOs
      const { data: ngos, error: ngoError } = await supabase
        .from("NGO_Information")
        .select("*")
        .order("name", { ascending: true });

      if (ngoError) throw ngoError;

      // Calculate stats for each NGO
      const ngosWithStats = await Promise.all(
        ngos.map(async (ngo) => {
          const stats = await calculateNGOStats(ngo.ngo_code);
          return {
            id: ngo.admin_id,
            ngo_code: ngo.ngo_code,
            name: ngo.name,
            address: ngo.address,
            logo: ngo.ngo_logo,
            volunteers: stats.totalVolunteers,
            events: stats.upcomingEvents,
            rate: stats.participationRate,
            email: ngo.email,
            phone: ngo.phone_number
          };
        })
      );

      setNgoList(ngosWithStats);
      setFilteredNGOs(ngosWithStats);
    } catch (error) {
      console.error("Error fetching NGO data:", error);
      alert("Error loading NGO data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate NGO statistics
const calculateNGOStats = async (ngoCode) => {
  try {
    // 1. Count total volunteers registered to this NGO
    // Based on Registered_Volunteers table where joined_ngo contains the NGO code
    const { data: registeredVols, error: regError } = await supabase
      .from("Registered_Volunteers")
      .select("user_id, joined_ngo")
      .not("joined_ngo", "is", null);

    if (regError) throw regError;

    // Filter volunteers who have this NGO in their joined_ngo string
    const totalVolunteers = registeredVols?.filter(vol => 
      vol.joined_ngo && vol.joined_ngo.includes(ngoCode)
    ).length || 0;

    // 2. Count upcoming events for this NGO
    const today = new Date().toISOString().split('T')[0];
    const { data: upcomingEvents, error: eventError } = await supabase
      .from("Event_Information")
      .select("event_id, status")
      .eq("ngo_id", ngoCode)
      .in("status", ["UPCOMING", "ONGOING"]);

    if (eventError) throw eventError;

    const upcomingEventsCount = upcomingEvents?.length || 0;

    // 3. Calculate participation rate
    // Get all volunteers who joined this NGO
    const volunteersInNGO = registeredVols?.filter(vol => 
      vol.joined_ngo && vol.joined_ngo.includes(ngoCode)
    ).map(v => v.user_id) || [];

    if (volunteersInNGO.length === 0) {
      return {
        totalVolunteers: 0,
        upcomingEvents: upcomingEventsCount,
        participationRate: "0%"
      };
    }

    // Get unique volunteers who have participated in ANY event for this NGO
    const { data: eventUsers, error: euError } = await supabase
      .from("Event_User")
      .select("user_id, event_id")
      .eq("ngo_id", ngoCode)
      .in("user_id", volunteersInNGO);

    if (euError) throw euError;

    // Count unique participants
    const uniqueParticipants = new Set(eventUsers?.map(eu => eu.user_id) || []).size;
    
    // Calculate participation rate
    const participationRate = totalVolunteers > 0 
      ? Math.round((uniqueParticipants / totalVolunteers) * 100) 
      : 0;

    return {
      totalVolunteers,
      upcomingEvents: upcomingEventsCount,
      participationRate: `${participationRate}%`
    };
  } catch (error) {
    console.error(`Error calculating stats for ${ngoCode}:`, error);
    return {
      totalVolunteers: 0,
      upcomingEvents: 0,
      participationRate: "0%"
    };
  }
};

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredNGOs(ngoList);
    } else {
      const filtered = ngoList.filter(ngo =>
        ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ngo.ngo_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredNGOs(filtered);
    }
  }, [searchTerm, ngoList]);

  // Toggle NGO Selection
  const toggleSelect = (id) => {
    setSelectedNGOs((prev) =>
      prev.includes(id) ? prev.filter((ngoId) => ngoId !== id) : [...prev, id]
    );
  };

  // Open confirmation modal
  const handleRemoveNGOs = () => {
    if (selectedNGOs.length === 0) {
      setShowWarningModal(true);
      return;
    }
    setShowConfirmModal(true);
    setStep(1);
  };

  // Confirm remove action
  const confirmRemove = async () => {
    if (step === 1) {
      setStep(2);
    } else {
      try {
        // Get NGO codes for selected NGOs
        const selectedNGOCodes = filteredNGOs
          .filter(ngo => selectedNGOs.includes(ngo.id))
          .map(ngo => ngo.ngo_code);

        const selectedCount = selectedNGOs.length;

        // Note: In a real system, you'd want to handle cascading deletes
        // and data integrity. For now, we'll just remove from NGO_Information
        const { error } = await supabase
          .from("NGO_Information")
          .delete()
          .in("ngo_code", selectedNGOCodes);

        if (error) throw error;

        // Also remove from NGO_Admin table
        const { error: adminError } = await supabase
          .from("NGO_Admin")
          .delete()
          .in("admin_id", selectedNGOs);

        if (adminError) throw adminError;

        // Update local state
        setNgoList((prev) =>
          prev.filter((ngo) => !selectedNGOs.includes(ngo.id))
        );
        
        // Set removal count for success modal
        setRemovedCount(selectedCount);
        
        // Reset states
        setSelectedNGOs([]);
        setRemoveMode(false);
        setShowConfirmModal(false);
        setStep(1);
        
        // Show success modal
        setShowSuccessModal(true);
        
      } catch (error) {
        console.error("Error removing NGOs:", error);
        alert("Error removing NGOs. Please try again.");
      }
    }
  };

  // Cancel removal
  const cancelRemove = () => {
    setShowConfirmModal(false);
    setStep(1);
  };

  // Close success modal
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setRemovedCount(0);
  };

  // Handle Add NGO confirmation
  const handleAddNGO = () => {
    setShowAddNGOModal(true);
  };

  const confirmAddNGO = () => {
    setShowAddNGOModal(false);
    navigate("/add-ngo");
  };

  const cancelAddNGO = () => {
    setShowAddNGOModal(false);
  };

  // Handle backdrop click for modals
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (showConfirmModal) {
        cancelRemove();
      } else if (showSuccessModal) {
        closeSuccessModal();
      } else if (showAddNGOModal) {
        cancelAddNGO();
      } else if (showWarningModal) {
        setShowWarningModal(false);
      }
    }
  };

  // View NGO Dashboard
  const viewNGODashboard = (ngo) => {
    // Store context for viewing this NGO's dashboard
    localStorage.setItem("viewingNGO", JSON.stringify({
      ngo_code: ngo.ngo_code,
      ngo_name: ngo.name,
      viewing_as_super_admin: true,
      original_admin: adminData
    }));
    
    navigate(`/ngo-dashboard/${ngo.ngo_code}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600 font-semibold">Loading NGO data...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen bg-no-repeat bg-center"
      style={{
        backgroundImage: `url(${CentroAdminBg})`,
        backgroundSize: "100% 100%",
      }}
    >
      <Sidebar onCollapseChange={setSidebarCollapsed} />

      <main className="flex-1 p-4 overflow-y-auto transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}
      >             
      {/* TOP HEADER */}
        <div className="mb-6">
          <div className="bg-emerald-900 text-white rounded-full p-2 text-center mb-2 shadow">
            <h1 className="text-3xl font-extrabold">NGO Hub</h1>
            <p className="text-sm opacity-90">Manage {ngoList.length} NGOs</p>
          </div>

          {/* Search + Action Buttons */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <div className="flex w-full md:w-3/4 items-center border-2 border-emerald-300 bg-white rounded-lg shadow-lg px-4 py-2">
              <input
                type="text"
                placeholder="Search NGO by Name or Code"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none flex-1 text-emerald-900 text-lg placeholder:text-emerald-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {removeMode ? (
                <>
                  <button
                    onClick={handleRemoveNGOs}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow text-sm border-2 border-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      setRemoveMode(false);
                      setSelectedNGOs([]);
                    }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow text-sm border-2 border-gray-700 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setRemoveMode(true)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-700 border-2 border-red-700 text-white font-semibold rounded-lg shadow text-sm cursor-pointer transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  Remove 
                </button>
              )}
              <button
                onClick={handleAddNGO}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow text-sm cursor-pointer border-2 border-emerald-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                Register 
              </button>
            </div>
          </div>

          {/* Search Results Info */}
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-600">
              Found {filteredNGOs.length} NGO{filteredNGOs.length !== 1 ? 's' : ''} 
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          )}
        </div>

        {/* NGO Cards */}
        <div className="space-y-4">
          {filteredNGOs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm ? "No NGOs found matching your search." : "No NGOs found."}
              </p>
            </div>
          ) : (
            filteredNGOs.map((ngo) => (
              <div
                key={ngo.id}
                className="bg-white border-2 border-emerald-200 rounded-xl shadow-lg p-6 hover:shadow-xl hover:border-emerald-300 transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-6">
                  {/* Checkbox (only in remove mode) */}
                  {removeMode && (
                    <div className="flex items-center justify-center flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedNGOs.includes(ngo.id)}
                        onChange={() => toggleSelect(ngo.id)}
                        className="w-6 h-6 text-emerald-600 accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  )}

                {/* Logo + Info */}
                <div className="flex items-center gap-4 w-full md:w-1/3">
                  <img
                    src={ngo.logo}
                    alt={ngo.name}
                    className="w-28 h-28 object-contain rounded-lg border-2 border-emerald-200"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/112x112?text=NGO";
                    }}
                  />
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">
                      {ngo.name}
                    </h2>
                    <p className="text-sm text-emerald-600 font-medium mb-1">Code: {ngo.ngo_code}</p>
                    <p className="text-base text-gray-700">{ngo.address}</p>
                    {ngo.email && (
                      <p className="text-sm text-gray-600 underline">{ngo.email}</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-center w-full md:w-1/2 justify-center">
                  <div>
                    <p className="text-base text-gray-600">
                      Total Registered Volunteers
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">{ngo.volunteers}</p>
                  </div>
                  <div>
                    <p className="text-base text-gray-600">Upcoming Events</p>
                    <p className="text-2xl font-bold text-blue-600">{ngo.events}</p>
                  </div>
                  <div>
                    <p className="text-base text-gray-600">
                      Participation Rate
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">{ngo.rate}</p>
                  </div>
                </div>

                {/* Action Button */}
                {removeMode ? (
                  <button
                    onClick={() => toggleSelect(ngo.id)}
                    className={`self-start px-6 py-3 border-2 rounded-lg shadow-lg text-lg font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer ${
                      selectedNGOs.includes(ngo.id)
                        ? "bg-red-600 text-white border-red-700 hover:bg-red-700"
                        : "bg-gray-200 hover:bg-gray-300 border-gray-400 text-gray-800"
                    }`}
                  >
                    {selectedNGOs.includes(ngo.id) ? "Selected" : "Select"}
                  </button>
                ) : (
                  <button
                    onClick={() => viewNGODashboard(ngo)}
                    className="self-start px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-800 rounded-lg shadow-lg text-base font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Overview
                  </button>
                )}
              </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Warning Modal */}
      {showWarningModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center animate-fadeIn"
          onClick={handleBackdropClick}
          style={{ 
            zIndex: 99999999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
        >
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 99999998 }}
          ></div>

          <div 
            className="relative bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 border-2 border-yellow-500 transform animate-scaleIn"
            style={{ 
              zIndex: 100000000,
              position: 'relative'
            }}
          >
            <div className="text-yellow-500 text-6xl mb-4"></div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-4">
              Unselected!
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Please select at least one NGO to remove.
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="px-8 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold shadow-lg text-lg border-2 border-yellow-600 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Confirmation Modal for Remove */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center animate-fadeIn"
          onClick={handleBackdropClick}
          style={{ 
            zIndex: 99999999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
        >
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 99999998 }}
          ></div>

          <div 
            className="relative bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 border-2 border-red-500 transform animate-scaleIn"
            style={{ 
              zIndex: 100000000,
              position: 'relative'
            }}
          >
            <div className="flex justify-center mb-4">
              <div className="rounded-full flex items-center justify-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              {step === 1
                ? "Are you sure you want to remove?"
                : "This action is irreversible!"}
            </h2>
              </div>
            </div>
            <p className="text-lg text-gray-700 mb-6">
              {step === 1
                ? `You have selected ${selectedNGOs.length} NGO(s) to remove.`
                : "Once removed, all data associated with these NGOs will be permanently deleted."}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmRemove}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg border-2 border-red-500 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                {step === 1 ? "Continue" : "Remove"}
              </button>
              <button
                onClick={cancelRemove}
                className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold shadow-lg border-2 border-gray-700 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add NGO Confirmation Modal */}
      {showAddNGOModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center animate-fadeIn"
          onClick={handleBackdropClick}
          style={{ 
            zIndex: 99999999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
        >
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 99999998 }}
          ></div>

          <div 
            className="relative bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 border-2 border-emerald-500 transform animate-scaleIn"
            style={{ 
              zIndex: 100000000,
              position: 'relative'
            }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center">
                <h2 className="text-2xl font-bold text-emerald-600 mb-4">
              Register
            </h2>
              </div>
            </div>
            <p className="text-lg text-gray-700 mb-6">
              Are you sure you want to proceed to add a new NGO to the system?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You will be redirected to the NGO registration form.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmAddNGO}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg border-2 border-emerald-800 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                Proceed
              </button>
              <button
                onClick={cancelAddNGO}
                className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold shadow-lg border-2 border-gray-700 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Success Modal */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center animate-fadeIn"
          onClick={handleBackdropClick}
          style={{ 
            zIndex: 99999999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
        >
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 99999998 }}
          ></div>

          <div 
            className="relative bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 border-4 border-emerald-400 transform animate-scaleIn"
            style={{ 
              zIndex: 100000000,
              position: 'relative'
            }}
          >
            <div className="text-emerald-600 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-emerald-600 mb-4">
              Removed
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              {removedCount === 1 
                ? "1 NGO has been successfully removed from the system."
                : `${removedCount} NGOs have been successfully removed from the system.`}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              All associated data has been permanently deleted.
            </p>
            <button
              onClick={closeSuccessModal}
              className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg text-lg border-2 border-emerald-800 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Ok
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}

export default NGOHubPage;