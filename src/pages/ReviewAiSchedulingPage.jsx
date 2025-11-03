import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import Sidebar from "../components/Sidebar";
import supabase from "../config/supabaseClient";

function ReviewAiScheduling() {
  const [volunteer, setVolunteer] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVolunteerIndex, setCurrentVolunteerIndex] = useState(0);
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [acceptedVolunteersCount, setAcceptedVolunteersCount] = useState(0);
  const [showAdjustConfirmModal, setShowAdjustConfirmModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustedTimeSlot, setAdjustedTimeSlot] = useState("");
  const [adjustedDuration, setAdjustedDuration] = useState("");
  const [adjustedVolunteerType, setAdjustedVolunteerType] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuccessApprove, setShowSuccessApprove] = useState(false);
  const [showSuccessReject, setShowSuccessReject] = useState(false);
  const [showSuccessAdjust, setShowSuccessAdjust] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [processedVolunteer, setProcessedVolunteer] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

const isLocal = window.location.hostname === "localhost";
const BACKEND_API_URL = isLocal ? "http://localhost:5000" : "";

useEffect(() => {
const initializePage = async () => {
  if (location.state?.volunteer && location.state?.eventDetails) {
    const { volunteer: selectedVolunteer, eventDetails: selectedEvent } = location.state;

    if (!selectedEvent?.event_id) {
      console.warn("⚠️ Missing event_id in selectedEvent:", selectedEvent);
      navigate("/review-application-event");
      return;
    }

    setVolunteer(selectedVolunteer);
    setEventDetails(selectedEvent);
    fetchEventVolunteers(selectedEvent.event_id, selectedVolunteer);
    fetchAcceptedVolunteersCount(selectedEvent.event_id);

    const { data: fullEventData, error: eventError } = await supabase
      .from("Event_Information")
      .select("*")
      .eq("event_id", selectedEvent.event_id)
      .maybeSingle();

    if (eventError) {
      console.error("Error fetching full event data:", eventError);
      generateAiSuggestions(selectedVolunteer, selectedEvent);
    } else if (fullEventData) {
      setEventDetails(fullEventData);
      generateAiSuggestions(selectedVolunteer, fullEventData);
    } else {
      console.warn("⚠️ Event not found in Event_Information:", selectedEvent.event_id);
    }
  } else {
    navigate("/review-application-event");
  }
};

  initializePage();
}, [location.state, navigate]);

  useEffect(() => {
    if (showSuccessApprove || showSuccessReject || showSuccessAdjust) {
      const timer = setTimeout(() => {
        setShowSuccessApprove(false);
        setShowSuccessReject(false);
        setShowSuccessAdjust(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessApprove, showSuccessReject, showSuccessAdjust]);

  const fetchAcceptedVolunteersCount = async (eventId) => {
    try {
      const { data, error } = await supabase
        .from("Event_User")
        .select("user_id", { count: "exact" })
        .eq("event_id", eventId)
        .eq("status", "ONGOING");

      if (error) {
        console.error("Error fetching accepted volunteers count:", error);
        setAcceptedVolunteersCount(0);
        return;
      }
      setAcceptedVolunteersCount(data.length);
    } catch (error) {
      console.error("Error in fetchAcceptedVolunteersCount:", error);
      setAcceptedVolunteersCount(0);
    }
  };

const fetchEventVolunteers = async (eventId, selectedVolunteer) => {
  try {
    const { data: eventUsers, error } = await supabase
      .from("Event_User")
      .select(
        "user_id, event_id, status, days_available, time_availability, busy_hours"
      )
      .eq("event_id", eventId)
      .eq("status", "PENDING");

    if (error) {
      console.error("Error fetching event volunteers:", error);
      return;
    }

    const volunteersWithDetails = await Promise.all(
      eventUsers.map(async (eventUser) => {
        const { data: volunteerData, error: userError } = await supabase
          .from("LoginInformation")
          .select(
            "user_id, firstname, lastname, email, profile_picture, preferred_volunteering, contact_number, location"
          )
          .eq("user_id", eventUser.user_id)
          .maybeSingle();

        if (userError) {
          console.error("Error fetching volunteer details:", userError);
          return null;
        }

        return {
          ...volunteerData,
          days_available: eventUser.days_available,
          time_availability: eventUser.time_availability,
          busy_hours: eventUser.busy_hours,
          event_id: eventUser.event_id,
        };
      })
    );

    const filteredVolunteers = volunteersWithDetails.filter((v) => v !== null);
    setAllVolunteers(filteredVolunteers);

    // CHANGED: Use parameter instead of state
    const currentIndex = filteredVolunteers.findIndex(
      (v) => v.user_id === selectedVolunteer?.user_id
    );
    setCurrentVolunteerIndex(currentIndex >= 0 ? currentIndex : 0);
  } catch (error) {
    console.error("Error in fetchEventVolunteers:", error);
  }
};

  const calculateEventDuration = (timeStart, timeEnd, callTime) => {
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(/\s+/);
      let [hours, minutes] = time.split(":").map(Number);
      if (period?.toUpperCase() === "PM" && hours !== 12) hours += 12;
      if (period?.toUpperCase() === "AM" && hours === 12) hours = 0;
      return new Date(1970, 0, 1, hours, minutes || 0);
    };

    const start = parseTime(timeStart);
    const end = parseTime(timeEnd);
    let duration = (end - start) / (1000 * 60 * 60);

    // Add call time if provided
    if (callTime) {
      const callTimeMatch = callTime.match(/(\d+)/);
      if (callTimeMatch) {
        duration += parseInt(callTimeMatch[1]);
      }
    }

    return `${Math.round(duration)} hours`;
  };

  const generateAiSuggestions = async (volunteerData, eventData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/generate-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          volunteerData: {
            firstname: volunteerData.firstname,
            lastname: volunteerData.lastname,
            days_available: volunteerData.days_available,
            time_availability: volunteerData.time_availability,
            busy_hours: volunteerData.busy_hours,
            preferred_volunteering: volunteerData.preferred_volunteering,
            location: volunteerData.location
          },
          eventData: {
            event_id: eventData.event_id,
            event_title: eventData.event_title,
            date: eventData.date,
            time_start: formatTime(eventData.time_start),
            time_end: formatTime(eventData.time_end),
            call_time: eventData.call_time,
            volunteers_limit: eventData.volunteers_limit,
            event_objectives: eventData.event_objectives,
            description: eventData.description,
            location: eventData.location,
            volunteer_opportunities: eventData.volunteer_opportunities
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI suggestions');
      }

      const data = await response.json();

      try {
        const cleanedText = data.suggestions.replace(/```json|```/g, "").trim();
        const suggestions = JSON.parse(cleanedText);
        setAiSuggestions(suggestions);
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        const fallbackSuggestions = createStrictFallbackSuggestions(
          volunteerData,
          eventData
        );
        setAiSuggestions(fallbackSuggestions);
      }
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      const fallbackSuggestions = createStrictFallbackSuggestions(
        volunteerData,
        eventData
      );
      setAiSuggestions(fallbackSuggestions);
    } finally {
      setIsLoading(false);
    }
  };

  const parseTime = (timeString) => {
    if (!timeString) return new Date(1970, 0, 1, 0, 0);
    const [time, period] = timeString.split(/\s+/);
    let [hours, minutes] = time.split(":").map(Number);

    if (period && period.toUpperCase() === "PM" && hours !== 12) {
      hours += 12;
    } else if (period && period.toUpperCase() === "AM" && hours === 12) {
      hours = 0;
    }

    return new Date(1970, 0, 1, hours, minutes || 0);
  };

  const formatTimeFromDate = (dateObj) => {
    return dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const createStrictFallbackSuggestions = (volunteerData, eventData) => {
    const eventStart = parseTime(eventData.time_start);
    const eventEnd = parseTime(eventData.time_end);

    if (!volunteerData.time_availability) {
      return {
        recommendedTimeSlot: "No time availability specified",
        duration: "0 hours",
        matchingVolunteerTypes: ["General Volunteering"],
        compatibilityScore: "0",
        proximityScore: "0",
        timeOverlapScore: "0",
        skillMatchScore: "0",
        reasoning: "Volunteer has not specified their time availability.",
      };
    }

    const availabilityMatch = volunteerData.time_availability.match(
      /(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i
    );
    if (!availabilityMatch) {
      return {
        recommendedTimeSlot: "Invalid time format",
        duration: "0 hours",
        matchingVolunteerTypes: ["General Volunteering"],
        compatibilityScore: "0",
        proximityScore: "0",
        timeOverlapScore: "0",
        skillMatchScore: "0",
        reasoning: "Could not parse volunteer's time availability format.",
      };
    }

    const volStart = parseTime(availabilityMatch[1]);
    const volEnd = parseTime(availabilityMatch[2]);

    const overlapStart = new Date(
      Math.max(eventStart.getTime(), volStart.getTime())
    );
    const overlapEnd = new Date(Math.min(eventEnd.getTime(), volEnd.getTime()));

    if (overlapStart.getTime() >= overlapEnd.getTime()) {
      return {
        recommendedTimeSlot: "No suitable time overlap",
        duration: "0 hours",
        matchingVolunteerTypes: getMatchingTypes(
          volunteerData.preferred_volunteering,
          eventData.volunteer_opportunities
        ),
        compatibilityScore: "0",
        proximityScore: "0",
        timeOverlapScore: "0",
        skillMatchScore: "0",
        reasoning:
          "Volunteer's availability does not overlap with event time.",
      };
    }

    const overlapDuration =
      (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
    const totalEventDuration =
      (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60);

    const timeCompatibility = (overlapDuration / totalEventDuration) * 50;
    const proximityScore = 20; // Default proximity score
    const skillMatch =
      getMatchingTypes(
        volunteerData.preferred_volunteering,
        eventData.volunteer_opportunities
      ).length > 1
        ? 20
        : 10;
    const finalScore = Math.round(timeCompatibility + proximityScore + skillMatch);

    return {
      recommendedTimeSlot: `${formatTimeFromDate(
        overlapStart
      )} - ${formatTimeFromDate(overlapEnd)}`,
      duration: `${Math.round(overlapDuration)} hours`,
      matchingVolunteerTypes: getMatchingTypes(
        volunteerData.preferred_volunteering,
        eventData.volunteer_opportunities
      ),
      compatibilityScore: finalScore.toString(),
      timeOverlapScore: Math.round(timeCompatibility).toString(),
      proximityScore: proximityScore.toString(),
      skillMatchScore: skillMatch.toString(),
      reasoning: `Time overlap: ${Math.round(timeCompatibility)}%, Proximity: ${proximityScore}%, Skills: ${skillMatch}%`,
    };
  };

  const getMatchingTypes = (preferences, objectives) => {
    if (!preferences || !objectives) return ["General Volunteering"];

    const prefArray = preferences
      .toLowerCase()
      .split(",")
      .map((p) => p.trim());

    const commonTypes = [];

    prefArray.forEach((pref) => {
      if (
        pref.includes("education") &&
        objectives.toLowerCase().includes("education")
      ) {
        commonTypes.push("Education & Youth Development");
      }
      if (
        pref.includes("healthcare") &&
        (objectives.toLowerCase().includes("health") ||
          objectives.toLowerCase().includes("medical"))
      ) {
        commonTypes.push("Healthcare & Medical Aid");
      }
      if (
        pref.includes("environmental") &&
        objectives.toLowerCase().includes("environment")
      ) {
        commonTypes.push("Environmental Conservation");
      }
      if (
        pref.includes("community") &&
        objectives.toLowerCase().includes("community")
      ) {
        commonTypes.push("Community Development");
      }
      if (
        pref.includes("disaster") &&
        objectives.toLowerCase().includes("disaster")
      ) {
        commonTypes.push("Disaster Relief & Emergency Response");
      }
      if (
        pref.includes("administrative") &&
        objectives.toLowerCase().includes("administrative")
      ) {
        commonTypes.push("Administrative & Technical Support");
      }
      if (
        pref.includes("advocacy") &&
        objectives.toLowerCase().includes("advocacy")
      ) {
        commonTypes.push("Human Rights & Advocacy");
      }
      if (
        pref.includes("animal") &&
        objectives.toLowerCase().includes("animal")
      ) {
        commonTypes.push("Animal Welfare");
      }
    });

    return commonTypes.length > 0 ? commonTypes : ["Community Development"];
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const date = new Date(0, 0, 0, hours, minutes);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const sendRejectionEmail = async (volunteerEmail, volunteerName, eventTitle, ngoName, reason) => {
    try {
      console.log('📧 Sending rejection email to:', volunteerEmail);
      const response = await fetch(`/api/send-reject-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: volunteerEmail,
          volunteerName: volunteerName,
          eventTitle: eventTitle,
          ngoName: ngoName,
          reason: reason
        })
      });

      if (!response.ok) {
        console.error('Server responded with error:', response.status);
        return false;
      }

      const result = await response.json();
      console.log('✓ Email sent successfully:', result);
      return result.success;
    } catch (error) {
      console.error('✗ Error sending email:', error);
      return false;
    }
  };

const handlePreviousApplicant = () => {
  console.log('Current Index:', currentVolunteerIndex);
  console.log('All Volunteers:', allVolunteers);
  console.log('Can go previous?', currentVolunteerIndex > 0);

  if (currentVolunteerIndex > 0 && allVolunteers.length > 0) {
    const prevVolunteer = allVolunteers[currentVolunteerIndex - 1];
    console.log('Previous volunteer:', prevVolunteer);
    setVolunteer(prevVolunteer);
    setCurrentVolunteerIndex(currentVolunteerIndex - 1);
    generateAiSuggestions(prevVolunteer, eventDetails);
  }
};

const handleNextApplicant = () => {
  console.log('Current Index:', currentVolunteerIndex);
  console.log('All Volunteers Length:', allVolunteers.length);
  console.log('Can go next?', currentVolunteerIndex < allVolunteers.length - 1);

  if (
    currentVolunteerIndex < allVolunteers.length - 1 &&
    allVolunteers.length > 0
  ) {
    const nextVolunteer = allVolunteers[currentVolunteerIndex + 1];
    console.log('Next volunteer:', nextVolunteer);
    setVolunteer(nextVolunteer);
    setCurrentVolunteerIndex(currentVolunteerIndex + 1);
    generateAiSuggestions(nextVolunteer, eventDetails);
  }
};

  const handleShowApproveModal = () => {
    setShowApproveModal(true);
  };

  const handleShowRejectModal = () => {
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleCloseApproveModal = () => {
    setShowApproveModal(false);
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason("");
  };

  const handleConfirmApprove = async () => {
    try {
      const { error: updateError } = await supabase
        .from("Event_User")
        .update({ status: "ONGOING" })
        .eq("user_id", volunteer.user_id)
        .eq("event_id", eventDetails.event_id)
        .eq("status", "PENDING");

      if (updateError) {
        console.error("Error updating volunteer status:", updateError);
        alert("Failed to update status. Please try again.");
        return;
      }

      setShowApproveModal(false);
      setShowSuccessApprove(true);
      setAcceptedVolunteersCount((prev) => prev + 1);
      setProcessedVolunteer(volunteer);

      const updatedVolunteers = allVolunteers.filter(
        (v) => v.user_id !== volunteer.user_id
      );
      setAllVolunteers(updatedVolunteers);

      if (updatedVolunteers.length > 0) {
        const nextIndex =
          currentVolunteerIndex >= updatedVolunteers.length
            ? 0
            : currentVolunteerIndex;
        const nextVolunteer = updatedVolunteers[nextIndex];
        setVolunteer(nextVolunteer);
        setCurrentVolunteerIndex(nextIndex);
        generateAiSuggestions(nextVolunteer, eventDetails);
      }
    } catch (error) {
      console.error("Unexpected error during approval:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    setIsSendingEmail(true);

    try {
      const adminData = JSON.parse(localStorage.getItem("admin"));
      if (!adminData) {
        alert("Admin data not found. Please log in again.");
        setIsSendingEmail(false);
        return;
      }

      const { data: ngoData, error: ngoError } = await supabase
        .from("NGO_Information")
        .select("name")
        .eq("admin_id", adminData.NGO_Information.admin_id)
        .maybeSingle();

      const ngoName = ngoData?.name || adminData.NGO_Information.name || "Centro Organization";

      const { error: updateError } = await supabase
        .from("Event_User")
        .update({ status: "REJECTED" })
        .eq("user_id", volunteer.user_id)
        .eq("event_id", eventDetails.event_id)
        .eq("status", "PENDING");

      if (updateError) {
        console.error("Error updating volunteer status:", updateError);
        alert("Failed to update status. Please try again.");
        setIsSendingEmail(false);
        return;
      }

      const volunteerFullName = `${volunteer.firstname} ${volunteer.lastname}`;
      await sendRejectionEmail(
        volunteer.email,
        volunteerFullName,
        eventDetails.event_title,
        ngoName,
        rejectionReason
      );

      setShowRejectModal(false);
      setIsSendingEmail(false);
      setShowSuccessReject(true);
      setProcessedVolunteer(volunteer);

      const updatedVolunteers = allVolunteers.filter(
        (v) => v.user_id !== volunteer.user_id
      );
      setAllVolunteers(updatedVolunteers);

      if (updatedVolunteers.length > 0) {
        const nextIndex =
          currentVolunteerIndex >= updatedVolunteers.length
            ? 0
            : currentVolunteerIndex;
        const nextVolunteer = updatedVolunteers[nextIndex];
        setVolunteer(nextVolunteer);
        setCurrentVolunteerIndex(nextIndex);
        generateAiSuggestions(nextVolunteer, eventDetails);
      }
    } catch (error) {
      console.error("Unexpected error during rejection:", error);
      alert("An unexpected error occurred. Please try again.");
      setIsSendingEmail(false);
    }
  };

  const handleAdjustSchedule = () => {
    setShowAdjustConfirmModal(true);
  };

  const handleConfirmAdjustSchedule = () => {
    if (aiSuggestions) {
      setAdjustedTimeSlot(aiSuggestions.recommendedTimeSlot || "");
      setAdjustedDuration(aiSuggestions.duration || "");
      setAdjustedVolunteerType(aiSuggestions.matchingVolunteerTypes?.[0] || "");
    }
    setShowAdjustConfirmModal(false);
    setShowAdjustModal(true);
  };

  const handleCloseAdjustConfirmModal = () => {
    setShowAdjustConfirmModal(false);
  };

  const handleCloseAdjustModal = () => {
    setShowAdjustModal(false);
    setAdjustedTimeSlot("");
    setAdjustedDuration("");
    setAdjustedVolunteerType("");
  };

  const handleApproveAdjusted = async () => {
    try {
      const { error: updateError } = await supabase
        .from("Event_User")
        .update({
          status: "ONGOING",
          adjusted_time_slot: adjustedTimeSlot,
          adjusted_duration: adjustedDuration,
          adjusted_volunteer_type: adjustedVolunteerType,
          adjustment_notes: `Schedule adjusted: ${adjustedTimeSlot} for ${adjustedDuration} as ${adjustedVolunteerType}`,
        })
        .eq("user_id", volunteer.user_id)
        .eq("event_id", eventDetails.event_id)
        .eq("status", "PENDING");

      if (updateError) {
        console.error("Error updating volunteer status:", updateError);
        alert("Failed to update status. Please try again.");
        return;
      }

      handleCloseAdjustModal();
      setShowSuccessAdjust(true);
      setAcceptedVolunteersCount((prev) => prev + 1);

      const updatedVolunteers = allVolunteers.filter(
        (v) => v.user_id !== volunteer.user_id
      );
      setAllVolunteers(updatedVolunteers);

      if (updatedVolunteers.length > 0) {
        const nextIndex =
          currentVolunteerIndex >= updatedVolunteers.length
            ? 0
            : currentVolunteerIndex;
        const nextVolunteer = updatedVolunteers[nextIndex];
        setVolunteer(nextVolunteer);
        setCurrentVolunteerIndex(nextIndex);
        generateAiSuggestions(nextVolunteer, eventDetails);
      }
    } catch (error) {
      console.error("Unexpected error during approval:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const handleRejectAdjusted = async () => {
    setRejectionReason("");
    handleCloseAdjustModal();
    setShowRejectModal(true);
  };

  if (!volunteer || !eventDetails) {
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
      >                   <div className="bg-white rounded-lg shadow p-8">
            <p className="text-gray-500 text-center text-xl">
              Loading volunteer and event data...
            </p>
          </div>
        </main>
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
      <Sidebar activeButton="Review Ai Scheduling" />

      <main className="flex-1 ml-64 p-4 overflow-hidden">
        <div className="bg-white rounded-lg shadow border-2 border-emerald-800 overflow-hidden h-full flex flex-col">
          <div className="bg-orange-400 h-14 flex items-center justify-between px-4">
            <span />
            <h2 className="font-extrabold text-white font-montserrat text-3xl tracking-wide uppercase">
              {eventDetails.event_title}
            </h2>
            <Link to="/review-application-event">
              <button className="text-white text-2xl font-bold hover:text-gray-200 cursor-pointer">
                ×
              </button>
            </Link>
          </div>

          <div className="bg-white px-6 py-2 border-gray-300">
            <span className="invisible"></span>
            <span className="invisible"></span>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-2/5 px-6 py-6 overflow-y-auto flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={
                    volunteer.profile_picture ||
                    "https://via.placeholder.com/150"
                  }
                  alt={volunteer.firstname}
                  className="w-20 h-20 rounded-full object-cover border"
                />
                <div>
                  <p className="font-semibold text-xl text-emerald-800">
                    {volunteer.firstname} {volunteer.lastname}
                  </p>
                  <p className="text-md text-gray-600">{volunteer.email}</p>
                  {volunteer.contact_number && (
                    <p className="text-md text-gray-600">
                      {volunteer.contact_number}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="font-semibold text-lg text-emerald-900">
                  Days Available
                </p>
                <p className="text-gray-800 text-md">
                  {volunteer.days_available || "Not specified"}
                </p>
              </div>

              <div className="mb-4">
                <p className="font-semibold text-lg text-emerald-900">
                  Time of Availability
                </p>
                <p className="text-gray-800 text-md">
                  {volunteer.time_availability || "Not specified"}
                </p>
              </div>

              <div className="mb-4">
                <p className="font-semibold text-lg text-red-600">Busy Hours</p>
                <p className="text-gray-800 text-md">
                  {volunteer.busy_hours || "Not specified"}
                </p>
              </div>

              <div className="mb-4">
                <p className="font-semibold text-lg text-emerald-900">
                  Location
                </p>
                <p className="text-gray-800 text-md">
                  {volunteer.location || "Not specified"}
                </p>
              </div>

              <div>
                <p className="font-semibold text-lg text-emerald-900">
                  Preferred Type of Volunteering
                </p>
                <ul className="list-disc list-inside text-gray-800 text-md space-y-1">
                  {volunteer.preferred_volunteering ? (
                    volunteer.preferred_volunteering
                      .split(",")
                      .map((type, idx) => <li key={idx}>{type.trim()}</li>)
                  ) : (
                    <li>Not specified</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="w-2/5 flex justify-center items-center px-4 py-4 overflow-y-auto">
              <div
                className="rounded-xl p-6 w-full flex flex-col"
                style={{ backgroundColor: "#b8d9c8" }}
              >
                <h3 className="text-4xl font-bold text-emerald-900 mb-1 text-center font-serif">
                  CENTRO<span className="text-yellow-500">suggests</span>
                </h3>
                <p className="text-center text-emerald-800 font-semibold mb-4 text-base">
                  Event ID: {eventDetails.event_id}
                </p>

                {/* Event Details Section */}
                <div className="bg-white rounded-lg p-4 mb-4 border border-emerald-300">
                  <h4 className="font-bold text-emerald-900 text-lg mb-3 border-b border-emerald-300 pb-2">
                    Event Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-emerald-800">Description:</p>
                      <p className="text-gray-700">{eventDetails.description || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-800">Date:</p>
                      <p className="text-gray-700">{formatDate(eventDetails.date)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-800">Time:</p>
                      <p className="text-gray-700">
                        {formatTime(eventDetails.time_start)} - {formatTime(eventDetails.time_end)}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-800">Call Time:</p>
                      <p className="text-gray-700">{eventDetails.call_time}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-800">Duration:</p>
                      <p className="text-gray-700">
                        {calculateEventDuration(
                          formatTime(eventDetails.time_start),
                          formatTime(eventDetails.time_end),
                          eventDetails.call_time
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-800">Location:</p>
                      <p className="text-gray-700">{eventDetails.location || "N/A"}</p>
                    </div>
<div className="col-span-2">
  <p className="font-semibold text-emerald-800">Volunteering Opportunities:</p>

  {eventDetails.volunteer_opportunities ? (
    <ul className="list-disc list-inside text-gray-700">
      {eventDetails.volunteer_opportunities
        .split("-")
        .map((item, index) => (
          <li key={index}>{item.trim()}</li>
        ))}
    </ul>
  ) : (
    <p className="text-gray-700">N/A</p>
  )}
</div>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-900"></div>
                    <p className="ml-4 text-emerald-900 font-semibold">
                      Generating AI suggestions...
                    </p>
                  </div>
                ) : aiSuggestions ? (
                  <>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1 pr-4">
                        <div className="mb-4">
                          <p className="font-bold text-1xl text-emerald-900">
                            Recommended Time &amp; Duration
                          </p>
                          <p className="text-gray-800 text-l">
                            {aiSuggestions.recommendedTimeSlot}{" "}
                            <span className="text-xs font-bold text-emerald-800">
                              [{aiSuggestions.duration}]
                            </span>
                          </p>
                        </div>

                        <div className="mb-4">
                          <p className="font-bold text-1xl text-emerald-900">
                            Matching Volunteer Types
                          </p>
                          <ul className="list-disc list-inside text-gray-800 text-l space-y-1 mt-1">
                            {aiSuggestions.matchingVolunteerTypes?.map(
                              (type, idx) => (
                                <li key={idx}>{type}</li>
                              )
                            )}
                          </ul>
                        </div>

{aiSuggestions.reasoning && (
  <div className="mb-4">
    <p className="font-bold text-xl text-emerald-900">
      AI Analysis
    </p>
    <ul className="list-disc list-inside text-gray-800 mt-2 space-y-1">
      {aiSuggestions.reasoning
        .split(",")
        .map((item, idx) => {
          // i-highlight ang numbers at percentages
          const formatted = item.replace(
            /(\d+\.?\d*\s*%?)/g,
            '<span class="font-bold text-emerald-800">$1</span>'
          );

          return (
            <li
              key={idx}
              className="italic"
              dangerouslySetInnerHTML={{ __html: formatted.trim() }}
            />
          );
        })}
    </ul>
  </div>
)}
                      </div>

                      <div className="flex flex-col gap-4 flex-shrink-0">
                        <div className="border-yellow-400 border-2 bg-white rounded-2xl shadow-lg w-80 h-30 flex flex-col items-center justify-center text-center p-4">
                          <p className="text-base font-semibold text-emerald-800 mb-2">
                            Compatibility<br/>Score
                          </p>
                          <p className="text-5xl font-extrabold text-yellow-500">
                            {aiSuggestions.compatibilityScore}%
                          </p>
                        </div>

                        <div className="border-blue-400 border-2 bg-white rounded-2xl shadow-lg w-80 h-30 flex flex-col items-center justify-center text-center p-4">
                          <p className="text-base font-semibold text-emerald-800 mb-2">
                            Accepted<br/>Volunteers
                          </p>
                          <p className="text-5xl font-extrabold text-blue-500">
                            {acceptedVolunteersCount}/{eventDetails.volunteers_limit}
                          </p>
                        </div>
                      </div>
                    </div>

<div className="mt-auto flex gap-4 justify-evenly">
  <button
    onClick={handleShowApproveModal}
    className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 text-md font-semibold cursor-pointer"
  >
    Approve Deployment
  </button>
  <button
    onClick={handleAdjustSchedule}
    className="bg-orange-400 text-white px-6 py-3 rounded-lg hover:bg-orange-500 text-md font-semibold cursor-pointer"
  >
    Adjust Schedule
  </button>
  <button
    onClick={handleShowRejectModal}
    className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-700 text-md font-semibold cursor-pointer"
  >
    Reject
  </button>
</div>
                  </>
                ) : (
                  <div className="flex justify-center items-center h-48">
                    <p className="text-emerald-900 font-semibold">
                      Failed to generate suggestions. Please try again.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

<div className="flex justify-evenly px-4 py-3 border-gray-300">
  <button
    onClick={handlePreviousApplicant}
    disabled={currentVolunteerIndex <= 0}
    className={`border font-semibold px-4 py-2 rounded-lg text-md ${
      currentVolunteerIndex <= 0
        ? "border-gray-500 text-gray-300 cursor-not-allowed"
        : "border-emerald-600 text-emerald-600 hover:bg-emerald-100"
    }`}
  >
    Previous Applicant ({currentVolunteerIndex + 1} of{" "}
    {allVolunteers.length})
  </button>
  <button
    onClick={handleNextApplicant}
    disabled={currentVolunteerIndex >= allVolunteers.length - 1}
    className={`font-semibold px-4 py-2 rounded-lg text-md ${
      currentVolunteerIndex >= allVolunteers.length - 1
        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
        : "bg-emerald-600 text-white hover:bg-emerald-700"
    }`}
  >
    Next Applicant
  </button>
</div>
        </div>
      </main>

      {/* All modals remain the same */}
      {showAdjustConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-500 p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-3 rounded-lg px-4 py-2 mb-3">
                <h3 className="text-xl font-bold text-orange-900">
                  Adjust
                </h3>
              </div>
              <p className="text-base text-gray-700 leading-relaxed">
                Do you want to customize the deployment schedule for <br />
                <span className="font-bold text-orange-900">
                  {volunteer?.firstname} {volunteer?.lastname}
                </span>
                ?
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 mb-4 border border-orange-500">
              <div className="flex items-center gap-3">
                <img
                  src={
                    volunteer?.profile_picture ||
                    "https://via.placeholder.com/150"
                  }
                  alt={volunteer?.firstname}
                  className="w-12 h-12 object-cover rounded-full border-2 border-white"
                />
                <div className="flex-1">
                  <p className="font-bold text-orange-900 text-base mb-1">
                    {volunteer?.firstname} {volunteer?.lastname}
                  </p>
                  <p className="text-orange-700 text-sm">{volunteer?.email}</p>
                </div>
              </div>
            </div>

            {aiSuggestions && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-500 rounded-lg p-3 mb-4">
                <p className="text-orange-900 text-sm font-semibold mb-2">
                  Current AI Suggestion:
                </p>
                <p className="text-orange-800 text-xs leading-relaxed">
                  <strong>Time:</strong> {aiSuggestions.recommendedTimeSlot}<br/>
                  <strong>Duration:</strong> {aiSuggestions.duration}<br/>
                  <strong>Compatibility:</strong> {aiSuggestions.compatibilityScore}%
                </p>
              </div>
            )}

            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-600 rounded-lg p-3 mb-4">
              <p className="text-orange-600 text-sm font-semibold leading-relaxed">
                <span className="font-bold">Note:</span> You'll be able to customize the time slot, duration, and volunteer type in the next step.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseAdjustConfirmModal}
                className="flex-1 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 font-bold py-2 px-3 rounded-lg border-2 border-gray-500 transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdjustSchedule}
                className="flex-1 bg-orange-500 text-white font-bold py-2 px-3 rounded-lg border-2 border-orange-600 transition-all duration-200 hover:bg-orange-600 cursor-pointer"
              >
                Adjust 
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-orange-500 p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-3 bg-orange-100 rounded-lg px-4 py-2 mb-3">
                <h3 className="text-2xl font-bold text-orange-900">
                  Adjust Schedule
                </h3>
              </div>
              <p className="text-base text-gray-700 leading-relaxed">
                Customize the deployment schedule for
                <br />
                <span className="font-bold text-orange-900">
                  {volunteer?.firstname} {volunteer?.lastname}
                </span>
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 mb-4 border-2 border-orange-600 shadow-md">
              <div className="flex items-center gap-3">
                <img
                  src={
                    volunteer?.profile_picture ||
                    "https://via.placeholder.com/150"
                  }
                  alt={volunteer?.firstname}
                  className="w-12 h-12 object-cover rounded-full border-2 border-white shadow-lg"
                />
                <div className="flex-1">
                  <p className="font-bold text-orange-900 text-base mb-1">
                    {volunteer?.firstname} {volunteer?.lastname}
                  </p>
                  <p className="text-orange-600 text-sm">{volunteer?.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-orange-900 font-semibold mb-1 text-sm">
                  Time & Duration
                </label>
                <input
                  type="text"
                  value={adjustedTimeSlot}
                  onChange={(e) => setAdjustedTimeSlot(e.target.value)}
                  placeholder="e.g., 9:00 AM - 12:00 PM"
                  className="w-full px-3 py-2 text-sm border-2 border-orange-600 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-orange-900 font-semibold mb-1 text-sm">
                  Duration
                </label>
                <input
                  type="text"
                  value={adjustedDuration}
                  onChange={(e) => setAdjustedDuration(e.target.value)}
                  placeholder="e.g., 3 hours"
                  className="w-full px-3 py-2 text-sm border-2 border-orange-600 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-orange-900 font-semibold mb-1 text-sm">
                  Volunteer Type
                </label>
                <select
                  value={adjustedVolunteerType}
                  onChange={(e) => setAdjustedVolunteerType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-orange-600 rounded-lg focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Select Volunteer Type</option>
                  <option value="Education & Youth Development">
                    Education & Youth Development
                  </option>
                  <option value="Healthcare & Medical Aid">
                    Healthcare & Medical Aid
                  </option>
                  <option value="Environmental Conservation">
                    Environmental Conservation
                  </option>
                  <option value="Community Development">
                    Community Development
                  </option>
                  <option value="Disaster Relief & Emergency Response">
                    Disaster Relief & Emergency Response
                  </option>
                  <option value="Social Services & Welfare">
                    Social Services & Welfare
                  </option>
                  <option value="Elderly Care">Elderly Care</option>
                  <option value="General Volunteering">
                    General Volunteering
                  </option>
                </select>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-600 rounded-lg p-3 mb-4">
              <p className="text-orange-600 text-sm font-semibold leading-relaxed">
                <span className="font-bold">Note:</span> Review the adjusted
                schedule carefully. The volunteer will be notified of
                changes.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseAdjustModal}
                className="flex-1 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 font-bold py-2 px-3 rounded-lg border-2 border-gray-500 transition-all duration-200 text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectAdjusted}
                className="flex-1 bg-red-600 text-white font-bold py-2 px-3 text-sm rounded-lg border-2 border-red-700 transition-all duration-200 hover:bg-red-700 cursor-pointer"
              >
                Reject
              </button>
              <button
                onClick={handleApproveAdjusted}
                className="flex-1 bg-orange-500 text-white font-bold py-2 px-3 text-sm rounded-lg border-2 border-orange-600 transition-all duration-200 hover:bg-orange-600 cursor-pointer"
              >
                Approve
              </button>
            </div>

            <div className="text-center mt-3">
              <p className="text-gray-500 text-xs">
                Adjusted schedules will be communicated to the volunteer
              </p>
            </div>
          </div>
        </div>
      )}

      {showSuccessApprove && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 p-6 max-w-md w-full mx-4 animate-slideIn">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <h3 className="text-3xl font-bold text-emerald-900 mb-2">
                 Approved
              </h3>
              </div>
              <p className="text-gray-700 mb-4">
                <span className="font-bold">
                  {processedVolunteer?.firstname} {processedVolunteer?.lastname}
                </span>{" "}
                has been approved for the event.
              </p>
              <div className="text-sm text-gray-500">
                Auto-closing in 3 seconds...
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessReject && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-500 p-6 max-w-md w-full mx-4 animate-slideIn">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-red-900 mb-2">
                Application Rejected
              </h3>
              <p className="text-gray-700 mb-4">
                <span className="font-bold">
                  {processedVolunteer?.firstname} {processedVolunteer?.lastname}
                </span>{" "}
                has been notified about the rejection via email.
              </p>
              <div className="text-sm text-gray-500">
                Auto-closing in 3 seconds...
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessAdjust && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-orange-500 p-6 max-w-md w-full mx-4 animate-slideIn">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-orange-900 mb-2">
                Schedule Adjusted!
              </h3>
              <p className="text-gray-700 mb-4">
                The schedule for{" "}
                <span className="font-bold">
                  {processedVolunteer?.firstname} {processedVolunteer?.lastname}
                </span>{" "}
                has been successfully adjusted and approved.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-orange-800">
                  <strong>Adjusted Details:</strong><br/>
                  Time: {adjustedTimeSlot}<br/>
                  Duration: {adjustedDuration}<br/>
                  Type: {adjustedVolunteerType}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Auto-closing in 3 seconds...
              </div>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-900 p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-3 rounded-lg px-4 py-2 mb-3">
                <h3 className="text-xl font-bold text-emerald-900">
                  Approve 
                </h3>
              </div>
              <p className="text-base text-gray-700 leading-relaxed">
                Are you sure you want to approve <br />
                <span className="font-bold text-emerald-900">
                  {volunteer?.firstname} {volunteer?.lastname}
                </span>{" "}
                for the{" "}
                <span className="font-bold text-emerald-900">
                  {eventDetails.event_title}
                </span>
                ?
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 mb-4 border border-emerald-500">
              <div className="flex items-center gap-3">
                <img
                  src={
                    volunteer?.profile_picture ||
                    "https://via.placeholder.com/150"
                  }
                  alt={volunteer?.firstname}
                  className="w-12 h-12 object-cover rounded-full border-2 border-white"
                />
                <div className="flex-1">
                  <p className="font-bold text-emerald-900 text-base mb-1">
                    {volunteer?.firstname} {volunteer?.lastname}
                  </p>
                  <p className="text-emerald-700 text-sm">{volunteer?.email}</p>
                </div>
              </div>
            </div>

            <div className="border border-emerald-500 rounded-lg p-3 mb-4">
              <p className="text-emerald-800 text-sm font-semibold leading-relaxed">
                <span className="font-bold">Note:</span> The volunteer will
                be notified and can participate in this event.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseApproveModal}
                className="flex-1 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 font-bold py-2 px-3 rounded-lg border-2 border-gray-500 transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                className="flex-1 bg-emerald-600 text-white font-bold py-2 px-3 text-sm rounded-lg border-2 border-emerald-700 transition-all duration-200 hover:bg-emerald-700 cursor-pointer"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && handleCloseRejectModal()}
        >
          <div className="bg-white rounded-2xl shadow-xl border-2 border-red-700 p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-3 rounded-lg px-4 py-2 mb-3">
                <h3 className="text-xl font-bold text-red-600">
                  Reject 
                </h3>
              </div>
              <p className="text-base text-gray-700 leading-relaxed">
                Are you sure you want to reject <br />
                <span className="font-bold text-emerald-900">
                  {volunteer?.firstname} {volunteer?.lastname}
                </span>{" "}
                for the{" "}
                <span className="font-bold text-emerald-900">
                  {eventDetails.event_title}
                </span>
                ?
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 mb-4 border border-red-700">
              <div className="flex items-center gap-3">
                <img
                  src={
                    volunteer?.profile_picture ||
                    "https://via.placeholder.com/150"
                  }
                  alt={volunteer?.firstname}
                  className="w-12 h-12 object-cover rounded-full border-2 border-emerald-700"
                />
                <div className="flex-1">
                  <p className="font-bold text-emerald-900 text-base mb-1">
                    {volunteer?.firstname} {volunteer?.lastname}
                  </p>
                  <p className="text-emerald-700 text-sm">{volunteer?.email}</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-emerald-900 font-bold mb-2 text-lg">
                Reason for Rejection: <span className="text-red-700">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this application..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-emerald-700 resize-none"
                rows="4"
                disabled={isSendingEmail}
              />
            </div>

            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-700 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm font-semibold leading-relaxed">
                <span className="font-bold">Warning:</span> The volunteer will receive an email notification with your reason.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseRejectModal}
                disabled={isSendingEmail}
                className="flex-1 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 font-bold py-2 px-3 rounded-lg border-2 border-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isSendingEmail}
                className="flex-1 bg-red-600 text-white font-bold py-2 px-3 text-sm rounded-lg border-2 border-red-700 transition-all duration-200 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSendingEmail ? "Rejecting..." : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default ReviewAiScheduling;