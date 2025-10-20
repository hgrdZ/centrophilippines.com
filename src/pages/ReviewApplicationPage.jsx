import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import supabase from "../config/supabaseClient";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import Sidebar from "../components/Sidebar";

export default function ReviewApplicationPage() {
  const [pendingApplications, setPendingApplications] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [ngoCode, setNgoCode] = useState("");
  const [ngoName, setNgoName] = useState(""); // Added for email
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showRejectSuccessPopup, setShowRejectSuccessPopup] = useState(false);
  const [acceptedVolunteerName, setAcceptedVolunteerName] = useState("");
  const [rejectedVolunteerName, setRejectedVolunteerName] = useState("");
  const [rejectReason, setRejectReason] = useState(""); // Added for rejection reason
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);


  const location = useLocation();

  // Fetch volunteer applications from the database
  useEffect(() => {
    const fetchPendingApplications = async () => {
      const adminData = JSON.parse(localStorage.getItem("admin"));
      if (adminData) {
        const ngoCode = adminData.NGO_Information.ngo_code;
        const ngoName = adminData.NGO_Information.name;
        setNgoCode(ngoCode);
        setNgoName(ngoName); // Store NGO name for email

        const { data, error } = await supabase
          .from("Volunteer_Application")
          .select("application_id, user_id, ngo_id, date_application")
          .eq("ngo_id", ngoCode);

        if (error) {
          console.error("Error fetching pending applications:", error);
        } else {
          const volunteerApplications = await Promise.all(
            data.map(async (application) => {
              const { data: volunteerData, error: userError } = await supabase
                .from("LoginInformation")
                .select("user_id, firstname, lastname, email, profile_picture, preferred_volunteering")
                .eq("user_id", application.user_id)
                .single();

              if (userError) {
                console.error("Error fetching volunteer details:", userError);
                return null;
              }

              return {
                ...volunteerData,
                application_id: application.application_id,
                date_application: application.date_application,
                ngo_id: application.ngo_id,
              };
            })
          );

          const filteredApplications = volunteerApplications.filter(app => app !== null);
          setPendingApplications(filteredApplications);
        }
      }
    };

    fetchPendingApplications();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showAcceptModal || showRejectModal || showSuccessPopup || showRejectSuccessPopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAcceptModal, showRejectModal, showSuccessPopup, showRejectSuccessPopup]);

  // Show accept modal
  const handleAcceptClick = () => {
    if (selectedVolunteer) {
      setShowAcceptModal(true);
    }
  };

  // Show reject modal
  const handleRejectClick = () => {
    if (selectedVolunteer) {
      setRejectReason(""); // Reset reason
      setShowRejectModal(true);
    }
  };

  // Accept a volunteer application
  const handleConfirmAccept = async () => {
    if (!selectedVolunteer) return;

    const dataToInsert = {
      application_id: selectedVolunteer.application_id,
      user_id: selectedVolunteer.user_id,
      ngo_id: selectedVolunteer.ngo_id,
      date_application: selectedVolunteer.date_application,
      result: true,
    };

    console.log("=== DEBUG: Accept Application ===");
    console.log("Selected Volunteer:", selectedVolunteer);
    console.log("Data to insert into Application_Status:", dataToInsert);

    try {
      const { data: insertedData, error: statusError } = await supabase
        .from("Application_Status")
        .insert([dataToInsert])
        .select();

      console.log("Inserted data result:", insertedData);
      console.log("Insert error:", statusError);

      if (statusError) {
        console.error("Error accepting volunteer:", statusError);
        alert("Failed to accept application. Please try again.");
        setShowAcceptModal(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("Volunteer_Application")
        .delete()
        .eq("application_id", selectedVolunteer.application_id);

      if (deleteError) {
        console.error("Error deleting volunteer application:", deleteError);
        alert("Failed to remove application from pending list.");
        setShowAcceptModal(false);
        return;
      }

      const { data: existingUser, error: checkError } = await supabase
        .from("Registered_Volunteers")
        .select("user_id, joined_ngo")
        .eq("user_id", selectedVolunteer.user_id)
        .maybeSingle();

      let updatedJoinedNgo = selectedVolunteer.ngo_id;

      if (!checkError && existingUser) {
        updatedJoinedNgo = existingUser.joined_ngo
          ? `${existingUser.joined_ngo}-${selectedVolunteer.ngo_id}`
          : selectedVolunteer.ngo_id;

        const { error: updateError } = await supabase
          .from("Registered_Volunteers")
          .update({
            joined_ngo: updatedJoinedNgo,
          })
          .eq("user_id", selectedVolunteer.user_id);

        if (updateError) {
          console.error("Error updating Registered_Volunteers:", updateError);
          alert("Failed to update volunteer registration.");
          setShowAcceptModal(false);
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from("Registered_Volunteers")
          .insert({
            user_id: selectedVolunteer.user_id,
            joined_ngo: updatedJoinedNgo,
          });

        if (insertError) {
          console.error("Error inserting into Registered_Volunteers:", insertError);
          alert("Failed to register volunteer.");
          setShowAcceptModal(false);
          return;
        }
      }

      // Store volunteer name before removing from state
      setAcceptedVolunteerName(`${selectedVolunteer.firstname} ${selectedVolunteer.lastname}`);
      
      setPendingApplications(pendingApplications.filter((vol) => vol.application_id !== selectedVolunteer.application_id));
      setShowAcceptModal(false);
      setSelectedVolunteer(null);
      
      // Show success popup
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Unexpected error during accept process:", error);
      alert("An unexpected error occurred. Please try again.");
      setShowAcceptModal(false);
    }
  };

  // Reject a volunteer application
  const handleConfirmReject = async () => {
    if (!selectedVolunteer) return;

    // Validate rejection reason
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    const dataToInsert = {
      application_id: selectedVolunteer.application_id,
      user_id: selectedVolunteer.user_id,
      ngo_id: selectedVolunteer.ngo_id,
      date_application: selectedVolunteer.date_application,
      result: false,
    };

    console.log("=== DEBUG: Reject Application ===");
    console.log("Selected Volunteer:", selectedVolunteer);
    console.log("Data to insert into Application_Status:", dataToInsert);

    try {
      const { data: insertedData, error: statusError } = await supabase
        .from("Application_Status")
        .insert([dataToInsert])
        .select();

      console.log("Inserted data result:", insertedData);
      console.log("Insert error:", statusError);

      if (statusError) {
        console.error("Error rejecting volunteer:", statusError);
        alert("Failed to reject application. Please try again.");
        setShowRejectModal(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("Volunteer_Application")
        .delete()
        .eq("application_id", selectedVolunteer.application_id);

      if (deleteError) {
        console.error("Error deleting volunteer application:", deleteError);
        alert("Failed to remove application from pending list.");
        setShowRejectModal(false);
        return;
      }

      // Send rejection email
      try {
        console.log("🔵 Attempting to send rejection email...");
        console.log("📧 Recipient:", selectedVolunteer.email);
        console.log("🏢 NGO Name:", ngoName);
        console.log("📝 Reason:", rejectReason);

        const response = await fetch('http://localhost:5000/api/send-reject-org', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientEmail: selectedVolunteer.email,
            ngoName: ngoName,
            reason: rejectReason,
          })
        });

        console.log("📊 Response status:", response.status);
        console.log("📊 Response ok:", response.ok);

        if (!response.ok) {
          console.error('❌ Server responded with error:', response.status);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        console.log('📬 Email result:', result);

        if (!result.success) {
          console.error("❌ Email sending failed:", result.error);
          alert(`Warning: Email not sent. Reason: ${result.error}`);
        } else {
          console.log("✅ Rejection email sent successfully to:", selectedVolunteer.email);
        }
      } catch (emailError) {
        console.error("🔴 Error sending rejection email:", emailError);
        console.error("🔴 Full error:", emailError.message);
        alert(`Warning: Failed to send rejection email. The application was still rejected in the database.\n\nError: ${emailError.message}`);
      }

      // Store volunteer name before removing from state
      setRejectedVolunteerName(`${selectedVolunteer.firstname} ${selectedVolunteer.lastname}`);

      setPendingApplications(pendingApplications.filter((vol) => vol.application_id !== selectedVolunteer.application_id));
      setShowRejectModal(false);
      setSelectedVolunteer(null);
      
      // Show reject success popup
      setShowRejectSuccessPopup(true);
    } catch (error) {
      console.error("Unexpected error during reject process:", error);
      alert("An unexpected error occurred. Please try again.");
      setShowRejectModal(false);
    }
  };

  // Cancel accept
  const handleCancelAccept = () => {
    setShowAcceptModal(false);
  };

  // Cancel reject
  const handleCancelReject = () => {
    setShowRejectModal(false);
    setRejectReason(""); // Clear reason on cancel
  };

  // Close success popup
  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
    setAcceptedVolunteerName("");
  };

  // Close reject success popup
  const handleCloseRejectSuccessPopup = () => {
    setShowRejectSuccessPopup(false);
    setRejectedVolunteerName("");
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (showAcceptModal) handleCancelAccept();
      if (showRejectModal) handleCancelReject();
      if (showSuccessPopup) handleCloseSuccessPopup();
      if (showRejectSuccessPopup) handleCloseRejectSuccessPopup();
    }
  };

  // Check if current path matches the button
  const isActive = (path) => location.pathname === path;

  return (
    <div
      className="flex min-h-screen bg-no-repeat bg-center"
      style={{
        backgroundImage: `url(${CentroAdminBg})`,
        backgroundSize: "100% 100%",
      }}
    >
      <Sidebar onCollapseChange={setSidebarCollapsed} />

      <main 
        className="flex-1 p-4 overflow-y-auto transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}
      >        <div id="review_application" className="relative z-10 space-y-4">
          {/* Header with Navigation Buttons */}
          <div className="flex gap-4">
            <Link to="/review-application" className="flex-1">
              <button
                className={`w-full text-xl text-center py-3 rounded-lg font-bold border-2 transition-colors cursor-pointer ${
                  isActive('/review-application') 
                    ? 'bg-emerald-900 text-white border-emerald-500' 
                    : 'bg-gray-200 hover:bg-gray-300 border-gray-900 text-gray-900'
                }`}
              >
                Organization Applications
              </button>
            </Link>
            <Link to="/review-application-event" className="flex-1">
              <button
                className={`w-full text-xl text-center py-3 rounded-lg font-bold border-2 transition-colors cursor-pointer ${
                  isActive('/review-application-event') 
                    ? 'bg-emerald-900 text-white border-emerald-500' 
                    : 'bg-gray-200 hover:bg-gray-300 border-gray-900 text-gray-900'
                }`}
              >
                Event Applications
              </button>
            </Link>
          </div>

          {/* Pending Applications Counter */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg">
              <span className="text-emerald-900 text-lg font-medium">Pending Applications:</span>
              <span className="bg-emerald-600 text-white font-bold text-lg px-3 py-1 rounded-full shadow-sm">
                {pendingApplications.length}
              </span>
            </div>
          </div>

          {/* Volunteers List */}
          {pendingApplications.length > 0 ? (
<div className="w-full flex flex-wrap gap-6 mb-6">
  {/* Table */}
  <div className="flex-1 min-w-full bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-emerald-700 text-lg text-white">
                      <th className="py-3 px-4">Application ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Date Applied</th>
                    </tr>
                  </thead>
                  <tbody className="text-emerald-900">
                    {pendingApplications.map((application) => (
                      <tr
                        key={application.application_id}
                        className={`cursor-pointer hover:bg-emerald-50 transition ${
                          selectedVolunteer && selectedVolunteer.application_id === application.application_id 
                            ? "bg-emerald-100 font-semibold" 
                            : ""
                        }`}
                        onClick={() => setSelectedVolunteer(application)}
                      >
                        <td className="py-2 px-4">{application.application_id}</td>
                        <td className="py-2 px-4">{application.firstname} {application.lastname}</td>
                        <td className="py-2 px-4">{application.email}</td>
                        <td className="py-2 px-4">{new Date(application.date_application).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Profile Card */}
  <div className="flex-1 min-w-[300px] max-w-[400px] bg-white rounded-lg shadow p-6 flex flex-col" style={{ minWidth: "300px", maxWidth: "400px" }}>
                {selectedVolunteer ? (
                  <>
                    <div>
                      <img
                        src={selectedVolunteer.profile_picture || "https://via.placeholder.com/150"}
                        alt={selectedVolunteer.firstname}
                        className="w-28 h-28 mx-auto mb-4 object-cover border-4 border-white shadow rounded-full"
                      />
                      <h3 className="text-2xl text-emerald-900 font-bold text-center mb-6">
                        {selectedVolunteer.firstname} {selectedVolunteer.lastname}
                      </h3>
                      <p className="text-m text-emerald-900 mb-4">
                        <span className="font-bold text-xl">Email Address</span>
                        <br />
                        {selectedVolunteer.email}
                      </p>
                      <p className="text-m text-emerald-900 mb-4">
                        <span className="font-bold text-xl">Application ID</span>
                        <br />
                        {selectedVolunteer.application_id}
                      </p>
                      <p className="text-m text-emerald-900 mb-4">
                        <span className="font-bold text-xl">Date Applied</span>
                        <br />
                        {new Date(selectedVolunteer.date_application).toLocaleDateString()}
                      </p>
                      {selectedVolunteer.preferred_volunteering && (
                        <>
                          <p className="mt-3 font-bold text-xl mb-2 text-emerald-900">Preferred Type of Volunteering</p>
                          <ul className="list-disc pl-5 text-m text-emerald-900">
                            {selectedVolunteer.preferred_volunteering.split(",").map((type, idx) => (
                              <li key={idx} className="mb-1">{type.trim()}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                    <div className="mt-6 flex gap-4">
                      <button 
                        onClick={handleAcceptClick} 
                        className="flex-1 bg-emerald-500 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition cursor-pointer"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={handleRejectClick} 
                        className="flex-1 bg-red-500 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center mt-10">Select a volunteer to review</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8">
              <p className="text-gray-500 text-center text-xl">No pending applications for your organization</p>
            </div>
          )}
        </div>
      </main>

      {/* Accept Confirmation Modal */}
      {showAcceptModal && selectedVolunteer && (
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
            className="relative bg-white rounded-lg shadow-2xl border-2 border-emerald-900 p-8 max-w-md w-full mx-4 transform animate-scaleIn"
            style={{ 
              zIndex: 100000000,
              position: 'relative'
            }}
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <h3 className="text-2xl font-bold text-emerald-900 mb-2">Accept Application</h3>
              </div>
              <p className="text-lg text-gray-700">
                Are you sure you want to accept <br /><span className="font-bold text-emerald-900">{selectedVolunteer.firstname} {selectedVolunteer.lastname}</span>'s application?
              </p>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 mb-6 border border-emerald-200">
              <div className="flex items-center gap-3">
                <img
                  src={selectedVolunteer.profile_picture || "https://via.placeholder.com/150"}
                  alt={selectedVolunteer.firstname}
                  className="w-12 h-12 object-cover rounded-full border-2 border-emerald-900"
                />
                <div>
                  <p className="font-bold text-emerald-900 text-lg">
                    {selectedVolunteer.firstname} {selectedVolunteer.lastname}
                  </p>
                  <p className="text-emerald-700 text-sm">{selectedVolunteer.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">
                <span className="font-bold">Note:</span> This volunteer will be added to your organization and will have access to your events and tasks.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCancelAccept}
                className="flex-1 bg-gray-200 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg border-2 border-gray-400 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAccept}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg border-2 border-green-800 transition-colors cursor-pointer"
              >
                Yes, Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && selectedVolunteer && (
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
            className="relative bg-white rounded-lg shadow-2xl border-2 border-red-700 p-8 max-w-md w-full mx-4 transform animate-scaleIn"
            style={{ 
              zIndex: 100000000,
              position: 'relative'
            }}
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <h3 className="text-2xl font-bold text-red-700">Reject Application</h3>
              </div>
              <p className="text-lg text-gray-700">
                Are you sure you want to reject <br /> <span className="font-bold text-emerald-700">{selectedVolunteer.firstname} {selectedVolunteer.lastname}</span>'s application?
              </p>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 mb-6 border border-emerald-200">
              <div className="flex items-center gap-3">
                <img
                  src={selectedVolunteer.profile_picture || "https://via.placeholder.com/150"}
                  alt={selectedVolunteer.firstname}
                  className="w-12 h-12 object-cover rounded-full border-2 border-emerald-900"
                />
                <div>
                  <p className="font-bold text-emerald-900 text-lg">
                    {selectedVolunteer.firstname} {selectedVolunteer.lastname}
                  </p>
                  <p className="text-emerald-700 text-sm">{selectedVolunteer.email}</p>
                </div>
              </div>
            </div>

            {/* Rejection Reason Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Please provide a detailed reason for rejection..."
              />
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">
                <span className="font-bold">Warning:</span> This action cannot be undone. The volunteer will be notified via email with the reason you provided.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCancelReject}
                className="flex-1 bg-gray-200 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg border-2 border-gray-400 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg border-2 border-red-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Yes, Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Success Popup Modal */}
      {showSuccessPopup && (
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
            className="relative bg-white rounded-lg shadow-2xl border-2 border-green-500 p-8 max-w-md w-full mx-4 transform animate-scaleIn"
            style={{ 
              zIndex: 100000000,
              position: 'relative'
            }}
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-30 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <h3 className="text-3xl font-bold text-emerald-900 mb-2">Application Accepted!</h3>
              </div>
              <p className="text-lg text-gray-700">
                <span className="font-bold text-emerald-900">{acceptedVolunteerName}</span> has been successfully added to your organization.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm text-center">
                The volunteer has been notified and can now access your organization's events and tasks.
              </p>
            </div>

            <button
              onClick={handleCloseSuccessPopup}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg border-2 border-green-800 transition-colors cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Reject Success Popup Modal */}
      {showRejectSuccessPopup && (
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
            className="relative bg-white rounded-lg shadow-2xl border-2 border-red-700 p-8 max-w-md w-full mx-4 transform animate-scaleIn"
            style={{ 
              zIndex: 100000000,
              position: 'relative'
            }}
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-32 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <h3 className="text-3xl font-bold text-red-700 mb-2">Application Rejected</h3>
              </div>
              <p className="text-lg text-gray-700">
                <span className="font-bold text-red-700">{rejectedVolunteerName}</span>'s application has been rejected.
              </p>
            </div>

            <div className="bg-red-50 border border-red-700 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm text-center">
                A rejection email has been sent to the volunteer. The application has been removed from your pending list.
              </p>
            </div>

            <button
              onClick={handleCloseRejectSuccessPopup}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg border-2 border-red-800 transition-colors cursor-pointer"
            >
              Understood
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