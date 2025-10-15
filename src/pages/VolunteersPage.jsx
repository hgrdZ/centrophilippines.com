import React, { useState, useEffect } from "react";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import Sidebar from "../components/Sidebar"; 
import supabase from "../config/supabaseClient";

// Badge Icons
import GoldMedalIcon from "../images/gold-badge.png";
import SilverMedalIcon from "../images/silver-badge.png";
import BronzeMedalIcon from "../images/bronze-badge.png";
import TrophyIcon from "../images/trophy.png";
import HeartIcon from "../images/heart.png";

const VolunteersPage = () => {
  const badgeIcons = {
    gold: GoldMedalIcon,
    silver: SilverMedalIcon,
    bronze: BronzeMedalIcon,
    trophy: TrophyIcon,
    heart: HeartIcon,
  };

  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [removalReason, setRemovalReason] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Result modal states
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState("success"); // "success", "warning", or "error"
  
  // Sort states
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    const adminData = JSON.parse(localStorage.getItem("admin"));
    if (adminData) {
      const ngoCode = adminData.NGO_Information.ngo_code;
      const adminId = adminData.NGO_Information.admin_id;

      const fetchVolunteers = async () => {
        const { data: registeredVolunteers, error } = await supabase
          .from("Registered_Volunteers")
          .select("user_id")
          .like("joined_ngo", `%${ngoCode}%`);

        if (error) {
          console.error("Error fetching registered volunteers:", error);
          return;
        }

        if (registeredVolunteers && registeredVolunteers.length > 0) {
          const userIds = registeredVolunteers.map((vol) => vol.user_id);
          const { data: volunteerDetails, error: detailsError } = await supabase
            .from("LoginInformation")
            .select("*")
            .in("user_id", userIds);

          if (detailsError) {
            console.error("Error fetching volunteer details:", detailsError);
          } else {
            const volunteersWithTasks = await Promise.all(
              volunteerDetails.map(async (vol) => {
                const { count, error: countError } = await supabase
                  .from("Task_Submissions")
                  .select("*", { count: "exact", head: true })
                  .eq("user_id", vol.user_id)
                  .eq("status", "APPROVED");

                if (countError) {
                  console.error(`Error counting tasks for ${vol.user_id}:`, countError);
                  return { ...vol, completed_tasks: 0 };
                }

                return { ...vol, completed_tasks: count || 0 };
              })
            );

            setVolunteers(volunteersWithTasks);
            setSelectedVolunteer(volunteersWithTasks[0]);
          }
        }
      };

      fetchVolunteers();
    }
  }, []);

  useEffect(() => {
    if (showConfirmModal || showResultModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => (document.body.style.overflow = "unset");
  }, [showConfirmModal, showResultModal]);

  const handleRemoveClick = () => {
    if (selectedVolunteer) {
      setRemovalReason("");
      setShowConfirmModal(true);
    }
  };

  const sendRemovalEmail = async (volunteerEmail, volunteerName, reason, ngoName) => {
    try {
      console.log('Sending email to:', volunteerEmail);
      const response = await fetch('/api/send-removal-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: volunteerEmail,
          volunteerName: volunteerName,
          reason: reason,
          ngoName: ngoName
        })
      });

      if (!response.ok) {
        console.error('Server responded with error:', response.status);
        return false;
      }

      const result = await response.json();
      console.log('Email result:', result);
      return result.success;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

  const handleConfirmRemove = async () => {
    if (!selectedVolunteer) return;

    if (!removalReason.trim()) {
      alert("Please provide a reason for removal.");
      return;
    }

    setIsSendingEmail(true);

    try {
      const adminData = JSON.parse(localStorage.getItem("admin"));
      if (!adminData) {
        setResultMessage("Admin data not found. Please log in again.");
        setResultType("error");
        setShowResultModal(true);
        setIsSendingEmail(false);
        return;
      }

      const currentNgoCode = adminData.NGO_Information.ngo_code;
      const adminId = adminData.NGO_Information.admin_id;
      const volunteerId = selectedVolunteer.user_id;

      console.log("Admin ID:", adminId);
      console.log("NGO Code:", currentNgoCode);

      const { data: ngoData, error: ngoError } = await supabase
        .from("NGO_Information")
        .select("name")
        .eq("admin_id", adminId)
        .single();

      console.log("NGO Data:", ngoData);
      console.log("NGO Error:", ngoError);

      if (ngoError) {
        console.error("Error fetching NGO information:", ngoError);
        console.error("Attempted admin_id:", adminId);
        const ngoName = adminData.NGO_Information.name || "Centro Organization";
        console.log("Using fallback NGO name:", ngoName);
      }

      const ngoName = ngoData?.name || adminData.NGO_Information.name || "Centro Organization";

      const { data: volunteerData, error: fetchError } = await supabase
        .from("Registered_Volunteers")
        .select("joined_ngo")
        .eq("user_id", volunteerId)
        .single();

      if (fetchError) {
        console.error("Error fetching volunteer data:", fetchError);
        setResultMessage("Error removing volunteer. Please try again.");
        setResultType("error");
        setShowResultModal(true);
        setShowConfirmModal(false);
        setIsSendingEmail(false);
        return;
      }

      if (!volunteerData || !volunteerData.joined_ngo) {
        setResultMessage("Volunteer not found in registered volunteers.");
        setResultType("error");
        setShowResultModal(true);
        setShowConfirmModal(false);
        setIsSendingEmail(false);
        return;
      }

      const ngoCodesList = volunteerData.joined_ngo.split("-");
      const updatedNgoCodes = ngoCodesList.filter((code) => code !== currentNgoCode);
      const updatedJoinedNgo = updatedNgoCodes.length > 0 ? updatedNgoCodes.join("-") : "";

      if (updatedJoinedNgo === "") {
        const { error: deleteError } = await supabase
          .from("Registered_Volunteers")
          .delete()
          .eq("user_id", volunteerId);
        if (deleteError) throw deleteError;
      } else {
        const { error: updateError } = await supabase
          .from("Registered_Volunteers")
          .update({ joined_ngo: updatedJoinedNgo })
          .eq("user_id", volunteerId);
        if (updateError) throw updateError;
      }

      const volunteerFullName = `${selectedVolunteer.firstname} ${selectedVolunteer.lastname}`;
      const emailSent = await sendRemovalEmail(
        selectedVolunteer.email,
        volunteerFullName,
        removalReason,
        ngoName
      );

      const updatedVolunteers = volunteers.filter((vol) => vol.user_id !== volunteerId);
      setVolunteers(updatedVolunteers);
      setSelectedVolunteer(updatedVolunteers.length > 0 ? updatedVolunteers[0] : null);

      setShowConfirmModal(false);
      setIsSendingEmail(false);
      
      if (emailSent) {
        setResultMessage(`${volunteerFullName} has been removed and notified via email.`);
        setResultType("success");
      } else {
        setResultMessage(`${volunteerFullName} has been removed, but email notification failed.`);
        setResultType("warning");
      }
      setShowResultModal(true);
    } catch (error) {
      console.error("Unexpected error:", error);
      setResultMessage("An unexpected error occurred. Please try again.");
      setResultType("error");
      setShowResultModal(true);
      setShowConfirmModal(false);
      setIsSendingEmail(false);
    }
  };

  const handleCancelRemove = () => {
    setShowConfirmModal(false);
    setRemovalReason("");
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleCancelRemove();
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
  };

  const getSortedVolunteers = (volunteers) => {
    const sorted = [...volunteers].sort((a, b) => {
      if (sortBy === "id") {
        const idA = parseInt(a.user_id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.user_id.replace(/\D/g, '')) || 0;
        return sortOrder === "asc" ? idA - idB : idB - idA;
      } else if (sortBy === "name") {
        const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
        const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();
        if (sortOrder === "asc") {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      }
      return 0;
    });
    return sorted;
  };

  const filteredVolunteers = getSortedVolunteers(
    volunteers.filter((volunteer) =>
      `${volunteer.firstname} ${volunteer.lastname}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
  );

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
    setShowSortDropdown(false);
  };

  const getResultIcon = () => {
    if (resultType === "success") {
      return (
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (resultType === "warning") {
      return (
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
  };

  const getResultTitleAndColor = () => {
    if (resultType === "success") {
      return { title: "Success", color: "text-green-700", border: "border-green-700" };
    } else if (resultType === "warning") {
      return { title: "Warning", color: "text-yellow-700", border: "border-yellow-700" };
    } else {
      return { title: "Error", color: "text-red-700", border: "border-red-700" };
    }
  };

  return (
    <div
      className="flex min-h-screen bg-no-repeat bg-center"
      style={{
        backgroundImage: `url(${CentroAdminBg})`,
        backgroundSize: "100% 100%",
      }}
    >
      <Sidebar activeButton="Volunteers" />

      <main className="flex-1 ml-64 p-6 overflow-y-auto">
        <div className="relative bg-white/95 shadow-xl rounded-[28px] ring-1 ring-gray-200/60 w-full max-w-7xl mx-auto p-8">
          <div className="grid grid-cols-12 gap-8 items-start">
            <div className="col-span-12">
              <h2 className="text-3xl font-bold font-montserrat text-emerald-900">
                Registered Volunteers
              </h2>
              <p className="text-lg text-gray-700 font-montserrat">List of Volunteers</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-300 mb-4 mt-2 px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-emerald-900 bg-emerald-100 rounded-full px-4 py-2 w-full max-w-md">
                <input
                  type="text"
                  placeholder="Search by Name"
                  className="bg-transparent outline-none flex-1 font-montserrat text-emerald-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 bg-emerald-900 text-white font-semibold font-montserrat px-4 py-2 rounded-lg hover:bg-emerald-800 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  Sort
                </button>

                {showSortDropdown && (
                  <div className="absolute top-full mt-2 left-0 bg-white border-2 border-emerald-900 rounded-lg shadow-lg z-50 min-w-[200px]">
                    <div className="py-2">
                      <button
                        onClick={() => handleSortChange("id")}
                        className={`w-full text-left px-4 py-2 font-montserrat hover:bg-emerald-50 flex items-center justify-between ${
                          sortBy === "id" ? "bg-emerald-100 font-bold text-emerald-900" : "text-gray-700"
                        }`}
                      >
                        <span>Volunteer ID</span>
                        {sortBy === "id" && (
                          <span className="text-emerald-900">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => handleSortChange("name")}
                        className={`w-full text-left px-4 py-2 font-montserrat hover:bg-emerald-50 flex items-center justify-between ${
                          sortBy === "name" ? "bg-emerald-100 font-bold text-emerald-900" : "text-gray-700"
                        }`}
                      >
                        <span>Name</span>
                        {sortBy === "name" && (
                          <span className="text-emerald-900">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-emerald-900 text-lg font-semibold font-montserrat">
              Total Volunteers: <span className="font-bold">{filteredVolunteers.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-y-auto max-h-[500px]">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-emerald-700 z-10">
                    <tr className="text-white font-montserrat">
                      <th className="py-3 px-4 text-lg text-left">Volunteer ID</th>
                      <th className="py-3 px-4 text-lg text-left">Name</th>
                      <th className="py-3 px-4 text-lg text-left">Email Address</th>
                    </tr>
                  </thead>
                  <tbody className="text-emerald-900">
                    {filteredVolunteers.map((volunteer) => (
                      <tr
                        key={volunteer.user_id}
                        className={`cursor-pointer hover:bg-emerald-50 ${
                          selectedVolunteer?.user_id === volunteer.user_id
                            ? "bg-emerald-100 font-semibold"
                            : ""
                        }`}
                        onClick={() => setSelectedVolunteer(volunteer)}
                      >
                        <td className="py-2 px-4">{volunteer.user_id}</td>
                        <td className="py-2 px-4">{`${volunteer.firstname} ${volunteer.lastname}`}</td>
                        <td className="py-2 px-4">{volunteer.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedVolunteer && (
              <div className="relative bg-white rounded-lg shadow p-4 flex flex-col border-2 border-gray-100">
                <button
                  onClick={handleRemoveClick}
                  className="absolute top-2.5 right-1 bg-red-500 border-red-700 border-2 
                   text-white font-bold mb-2 font-montserrat px-2 py-0.5 rounded-full shadow-sm hover:bg-red-700 hover:scale-105 transform transition-all duration-200"
                >
                  Remove
                </button>

                <div className="flex items-center gap-2 mb-4 pr-20">
                  <img
                    src={selectedVolunteer.profile_picture || "images/placeholder.jpg"}
                    alt={selectedVolunteer.name}
                    className="w-28 h-28 object-cover border-4 border-white shadow"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl text-emerald-900 font-montserrat mt-6 font-bold leading-tight">
                      {selectedVolunteer.firstname} <br /> {selectedVolunteer.lastname}
                    </h3>
                    <p className="text-sm text-gray-600 font-montserrat font-semibold bg-emerald-100 mt-1 px-3 py-1 rounded-full inline-block">
                      {selectedVolunteer.user_id}
                    </p>
                  </div>
                </div>

                <p className="text-m text-emerald-900 font-montserrat mb-3">
                  <span className="font-bold text-lg">Email Address</span>
                  <br /> {selectedVolunteer.email}
                </p>

                <p className="text-m text-emerald-900 font-montserrat mb-3">
                  <span className="font-bold text-lg">Contact Number</span>
                  <br /> {selectedVolunteer.contact_number}
                </p>

                <p className="text-m text-emerald-900 font-montserrat mb-3">
                  <span className="font-bold text-lg">Days Available</span>
                  <br /> {selectedVolunteer.days_available}
                </p>

                <p className="text-m text-emerald-900 font-montserrat mb-3">
                  <span className="font-bold text-lg">Time Availability</span>
                  <br /> {selectedVolunteer.time_availability}
                </p>

                <p className="text-m text-red-600 font-montserrat mb-3">
                  <span className="font-bold text-red-700 text-lg">Busy Hours</span>
                  <br /> {selectedVolunteer.busy_hours}
                </p>

                <p className="text-m text-emerald-900 font-montserrat mb-3">
                  <span className="font-bold text-lg">Preferred Type of Volunteering</span>
                  <ul className="list-disc list-inside mt-1">
                    {selectedVolunteer.preferred_volunteering
                      ?.split(",")
                      .map((type, index) => (
                        <li key={index}>{type.trim()}</li>
                      ))}
                  </ul>
                </p>

                <div className="mt-4 flex justify-evenly text-center text-emerald-900">
                  <div>
                    <p className="text-2xl font-bold font-montserrat">Completed Tasks</p>
                    <p className="font-medium text-lg">
                      {selectedVolunteer.completed_tasks ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-montserrat">Joined Events</p>
                    <p className="font-medium text-lg ">
                      {selectedVolunteer.joined_events ?? 0}
                    </p>
                  </div>
                </div>

                <p className="mt-3 mb-2 text-emerald-900 font-bold font-montserrat text-xl">
                  Badges
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {selectedVolunteer.badges?.map((badge, idx) => (
                    <img key={idx} src={badgeIcons[badge]} alt={badge} className="w-10 h-10" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showConfirmModal && selectedVolunteer && (
        <div
          className="fixed inset-0 flex items-center justify-center animate-fadeIn"
          onClick={handleBackdropClick}
          style={{ zIndex: 99999999 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div
            className="relative bg-white rounded-lg shadow-2xl border-2 border-red-700 p-8 max-w-md w-full mx-4 transform animate-scaleIn"
            style={{ zIndex: 100000000 }}
          >
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-red-700 font-montserrat mb-2">
                Remove Volunteer
              </h3>
              <p className="text-lg text-gray-700 font-montserrat">
                Are you sure you want to remove <br />
                <span className="font-bold text-emerald-900">
                  {selectedVolunteer.firstname} {selectedVolunteer.lastname}
                </span>{" "}
                from your organization?
              </p>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 mb-4 border border-red-700">
              <div className="flex items-center gap-3">
                <img
                  src={selectedVolunteer.profile_picture || "images/placeholder.jpg"}
                  alt={selectedVolunteer.firstname}
                  className="w-12 h-12 object-cover rounded-full border-2 border-emerald-900"
                />
                <div>
                  <p className="font-bold text-emerald-900 font-montserrat text-lg">
                    {selectedVolunteer.firstname} {selectedVolunteer.lastname}
                  </p>
                  <p className="text-emerald-700 font-montserrat text-sm">
                    {selectedVolunteer.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-emerald-900 font-bold font-montserrat mb-2 text-lg">
                Reason for Removal: <span className="text-red-700">*</span>
              </label>
              <textarea
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                placeholder="Please provide a reason for removing this volunteer..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-montserrat text-gray-700 focus:outline-none focus:border-emerald-700 resize-none"
                rows="4"
                disabled={isSendingEmail}
              />
            </div>

            <div className="bg-red-50 border border-red-700 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-montserrat text-sm">
                <span className="font-bold">Warning:</span> The volunteer will receive an email notification with your reason.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCancelRemove}
                disabled={isSendingEmail}
                className="flex-1 bg-gray-200 hover:bg-gray-400 text-gray-800 font-montserrat font-bold py-3 px-6 rounded-lg border-2 border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={isSendingEmail}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 font-montserrat rounded-lg border-2 border-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingEmail ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResultModal && (
        <div
          className="fixed inset-0 flex items-center justify-center animate-fadeIn"
          onClick={(e) => e.target === e.currentTarget && handleCloseResultModal()}
          style={{ zIndex: 99999999 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div
            className={`relative bg-white rounded-lg shadow-2xl border-2 p-8 max-w-md w-full mx-4 transform animate-scaleIn ${getResultTitleAndColor().border}`}
            style={{ zIndex: 100000000 }}
          >
            {getResultIcon()}
            
            <div className="text-center mb-6">
              <h3 className={`text-3xl font-bold font-montserrat mb-2 ${getResultTitleAndColor().color}`}>
                {getResultTitleAndColor().title}
              </h3>
              <p className="text-lg text-gray-700 font-montserrat">
                {resultMessage}
              </p>
            </div>

            <button
              onClick={handleCloseResultModal}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 font-montserrat rounded-lg border-2 border-emerald-800 transition-colors"
            >
              Close
            </button>
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
    </div>
  );
};

export default VolunteersPage;