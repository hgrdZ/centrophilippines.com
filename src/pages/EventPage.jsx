// src/pages/EventPage.jsx - Complete Dynamic Event Page with Report Generation
import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import supabase from "../config/supabaseClient";
import jsPDF from "jspdf";
import "jspdf-autotable";

// PDF Generation Loading Overlay
function PDFLoadingOverlay({ isVisible }) {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-9999 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-2xl flex flex-col items-center gap-5 relative overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-32 h-32 bg-emerald-600 rounded-full animate-ping"></div>
        </div>

        {/* Main spinner */}
        <div className="relative">
          <svg className="animate-spin h-16 w-16" viewBox="0 0 50 50">
            <circle
              className="opacity-25"
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              style={{ color: '#10b981' }}
            />
            <circle
              className="opacity-75"
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray="80"
              strokeDashoffset="60"
              strokeLinecap="round"
              style={{ color: '#059669' }}
            />
          </svg>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        <div className="text-center z-10">
          <p className="text-emerald-700 font-bold text-xl mb-2">Generating PDF Report</p>
          <p className="text-gray-600 text-sm">This may take a few moments...</p>
        </div>
      </div>
    </div>
  );
}

// Validation Error Popup
function ValidationErrorPopup({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-9999 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-[0_8px_25px_rgba(0,0,0,0.25)] w-full max-w-sm animate-fadeInScale border border-red-300 overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 px-6 py-3">
          <h3 className="text-lg font-semibold text-white tracking-wide">
            Error
          </h3>
        </div>

        {/* Message */}
        <div className="px-6 py-5 bg-white">
          <p className="text-gray-800 text-[15px] leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer with right-aligned OK */}
        <div className="px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-600 text-white rounded-md font-medium shadow hover:bg-red-700 transition-all active:scale-95 cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function EventPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [activeButton, setActiveButton] = useState("Event Details");
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState("");
  const [error, setError] = useState("");
  const [eventImage, setEventImage] = useState(null);
  const [volunteerStats, setVolunteerStats] = useState({
    totalJoined: 0,
    totalLimit: 0,
    submissions: 0,
    ongoingCount: 0,
    pendingCount: 0
  });
  const [ngoLogo, setNgoLogo] = useState("");
  const [ngoName, setNgoName] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true" || false
  );
  
  const eventColors = ["bg-emerald-800/90"];

  const handleButtonClick = (button) => setActiveButton(button);

  // Function to calculate real-time status based on date and time
  const calculateEventStatus = (eventDate, startTime, endTime) => {
    if (!eventDate || !startTime || !endTime) return "UPCOMING";

    const now = new Date();
    const eventDateObj = new Date(eventDate);
    
    // Create full datetime objects
    const [startHours, startMinutes] = startTime.split(':');
    const eventStart = new Date(eventDateObj);
    eventStart.setHours(parseInt(startHours), parseInt(startMinutes), 0);

    const [endHours, endMinutes] = endTime.split(':');
    const eventEnd = new Date(eventDateObj);
    eventEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0);

    // Check status based on current time
    if (now < eventStart) {
      return "UPCOMING";
    } else if (now >= eventStart && now <= eventEnd) {
      return "ONGOING";
    } else {
      return "COMPLETED";
    }
  };

  // Update status in real-time
  useEffect(() => {
    if (!eventData) return;

    const updateStatus = () => {
      const newStatus = calculateEventStatus(
        eventData.date,
        eventData.time_start,
        eventData.time_end
      );
      setCurrentStatus(newStatus);

      // Optionally update in database
      if (newStatus !== eventData.status) {
        updateEventStatusInDB(newStatus);
      }
    };

    // Initial status calculation
    updateStatus();

    // Update every minute
    const interval = setInterval(updateStatus, 60000);

    return () => clearInterval(interval);
  }, [eventData]);

  // Function to update status in Supabase
  const updateEventStatusInDB = async (newStatus) => {
    try {
      const { error } = await supabase
        .from("Event_Information")
        .update({ status: newStatus })
        .eq("event_id", eventId);

      if (error) throw error;

      // Update local state
      setEventData(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error("Error updating event status:", err);
    }
  };  

  useEffect(() => {
    if (eventId) {
      fetchEventData();
      fetchVolunteerStats();
      fetchNgoDetails();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);

      const adminData = JSON.parse(localStorage.getItem("admin"));
      if (!adminData || !adminData.NGO_Information) {
        setError("Admin session not found. Please log in again.");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      const adminNgoCode = adminData.NGO_Information.ngo_code;

      const { data, error } = await supabase
        .from("Event_Information")
        .select("*")
        .eq("event_id", eventId)
        .single();

      if (error) throw error;
      if (!data) {
        setError("Event not found");
        return;
      }

      if (data.ngo_id !== adminNgoCode) {
        setError("You don't have permission to view this event");
        return;
      }

      setEventData(data);

      // Set the event image directly from the event_image URL
      if (data.event_image) {
        setEventImage(data.event_image);
      }

      setError("");
    } catch (err) {
      console.error("Error fetching event:", err);
      setError("Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  const fetchNgoDetails = async () => {
    try {
      const adminData = JSON.parse(localStorage.getItem("admin"));
      const adminId = adminData?.admin_id;
      if (!adminId) return;
      const { data, error } = await supabase
        .from("NGO_Information")
        .select("ngo_logo, name")
        .eq("admin_id", adminId)
        .single();
      if (error) throw error;
      setNgoLogo(data?.ngo_logo || "");
      setNgoName(data?.name || "CENTRO Organization");
    } catch (err) {
      console.error("Error fetching NGO details:", err);
    }
  };

  const fetchVolunteerStats = async () => {
    try {
      // Get all volunteers who joined this event
      const { data: eventUsers, error: volError } = await supabase
        .from("Event_User")
        .select("user_id, status")
        .eq("event_id", eventId);

      if (volError) {
        console.error("Error fetching volunteers:", volError);
        return;
      }

      if (!eventUsers || eventUsers.length === 0) {
        setVolunteerStats({
          totalJoined: 0,
          submissions: 0,
          ongoingCount: 0,
          pendingCount: 0
        });
        return;
      }

      // Count ONGOING and PENDING volunteers
      const ongoingVolunteers = eventUsers.filter(v => v.status === "ONGOING");
      const pendingVolunteers = eventUsers.filter(v => v.status === "PENDING");
      const ongoingCount = ongoingVolunteers.length;
      const pendingCount = pendingVolunteers.length;
      const totalJoined = eventUsers.length;

      // Get task submissions to count complete submissions
      const userIds = eventUsers.map(v => v.user_id);
      const { data: taskSubmissions, error: submissionsError } = await supabase
        .from("Task_Submissions")
        .select("user_id, task_one, task_two, task_three, status")
        .eq("event_id", eventId)
        .in("user_id", userIds);

      if (submissionsError) {
        console.error("Error fetching task submissions:", submissionsError);
      }

      // Count complete submissions (status = APPROVED)
      let completeSubmissions = 0;
      if (taskSubmissions) {
        completeSubmissions = taskSubmissions.filter(sub => sub.status === "APPROVED").length;
      }

      setVolunteerStats({
        totalJoined,
        submissions: completeSubmissions,
        ongoingCount,
        pendingCount
      });

    } catch (err) {
      console.error("Error fetching volunteer stats:", err);
      setVolunteerStats({
        totalJoined: 0,
        submissions: 0,
        ongoingCount: 0,
        pendingCount: 0
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "TBA";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "TBA";
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "TBA";
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHours && diffMinutes) return `${diffHours} hours ${diffMinutes} minutes`;
    if (diffHours) return `${diffHours} hours`;
    return `${diffMinutes} minutes`;
  };

  const parseObjectives = (objectiveString) => {
    if (!objectiveString) return ["No objectives specified"];
    return objectiveString.split('-').filter(obj => obj.trim().length > 0);
  };

  // New function to parse bullet points for other fields
  const parseBulletPoints = (textString) => {
    if (!textString) return [];
    return textString.split('-').filter(item => item.trim().length > 0);
  };

  const getHeaderColor = (eventId) => {
    if (!eventId) return "bg-yellow-400";
    let hash = 0;
    for (let i = 0; i < eventId.length; i++) {
      hash = ((hash << 5) - hash) + eventId.charCodeAt(i);
      hash = hash & hash;
    }
    const index = Math.abs(hash) % eventColors.length;
    return eventColors[index];
  };

  // PDF Generation Functions
  const splitToBullets = (text) => {
    if (!text) return [];
    return String(text).replace(/\r\n/g, "\n").replace(/\n/g, " - ").split("-").map(s=>s.trim()).filter(Boolean);
  };

  const addLogo = async (doc, x, y, width, height, opacity = 1) => {
    if (!ngoLogo) return;
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = ngoLogo;
      await new Promise((resolve) => {
        img.onload = () => {
          try { if (doc.setGState) doc.setGState(new doc.GState({ opacity })); } catch {}
          const aspect = img.width / img.height;
          let finalW = width, finalH = height;
          if (aspect > 1) {
            finalH = width / aspect;
            if (finalH > height) { finalH = height; finalW = height * aspect; }
          } else {
            finalW = height * aspect;
            if (finalW > width) { finalW = width; finalH = width / aspect; }
          }
          const offsetX = (width - finalW)/2, offsetY = (height - finalH)/2;
          try { doc.addImage(img, "PNG", x + offsetX, y + offsetY, finalW, finalH); } catch (e) { console.warn(e); }
          try { if (doc.setGState) doc.setGState(new doc.GState({ opacity: 1 })); } catch {}
          resolve();
        };
        img.onerror = () => resolve();
      });
    } catch (err) { console.error("addLogo err", err); }
  };

  const addEventImageRight = async (doc, imageUrl, currentY, pageWidth, pageHeight) => {
    if (!imageUrl) return { imageHeight: 0, imageAdded: false };
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imageUrl;
      return await new Promise((resolve) => {
        img.onload = () => {
          const maxImgWidth = 60;
          const aspectRatio = img.width / img.height || 1;
          const imgWidth = maxImgWidth;
          const imgHeight = maxImgWidth / aspectRatio;
          if (currentY + imgHeight + 10 > pageHeight - 20) {
            resolve({ imageHeight: 0, imageAdded: false });
            return;
          }
          const imgX = pageWidth - imgWidth - 16;
          doc.setDrawColor(0); doc.setLineWidth(0.3);
          doc.rect(imgX - 1, currentY - 1, imgWidth + 2, imgHeight + 2);
          try { doc.addImage(img, "JPEG", imgX, currentY, imgWidth, imgHeight); } catch (e) { console.warn(e); }
          resolve({ imageHeight: imgHeight, imageAdded: true });
        };
        img.onerror = () => resolve({ imageHeight: 0, imageAdded: false });
      });
    } catch (err) { console.error("addEventImageRight err", err); return { imageHeight: 0, imageAdded: false }; }
  };

  const handleGenerateEventReport = async () => {
    if (!eventData) return;
    
    setIsGeneratingReport(true);
    
    try {
      // Fetch event-user data for this event
      const { data: eventUsers } = await supabase
        .from("Event_User")
        .select("user_id, status")
        .eq("event_id", eventId);

      const doc = new jsPDF("p", "mm", "a4");
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      let y = 25;

      // --- COVER PAGE ---
      if (ngoLogo) {
        try {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = ngoLogo;
          await new Promise((resolve) => {
            img.onload = () => {
              const w = 70, h = 70;
              const cx = pageW / 2 - w / 2;
              doc.addImage(img, "PNG", cx, 20, w, h);
              resolve();
            };
            img.onerror = () => resolve();
          });
        } catch {}
      }

      y = 100;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(0, 100, 0);
      doc.text(ngoName || "CENTRO Organization", pageW / 2, y, { align: "center" });
      y += 12;
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text("Event Report", pageW / 2, y, { align: "center" });
      y += 12;
      doc.setFontSize(14);
      doc.text(eventData.event_title, pageW / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(formatDate(eventData.date), pageW / 2, y, { align: "center" });
      y += 20;

      // --- SUMMARY BOX ---
      const eventVols = eventUsers || [];
      const approved = eventVols.filter((v) => v.status === "APPROVED").length;
      const pending = eventVols.filter((v) => v.status === "PENDING").length;
      const rejected = eventVols.filter((v) => v.status === "REJECTED").length;

      doc.setDrawColor(0, 100, 0);
      doc.setFillColor(245, 250, 245);
      doc.roundedRect(20, y, pageW - 40, 60, 3, 3, "FD");
      y += 10;
      doc.setFontSize(14);
      doc.setTextColor(0, 100, 0);
      doc.text("Event Summary", 25, y);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      y += 8;
      doc.text(`•  Event ID: ${eventData.event_id}`, 30, y); y+=6;
      doc.text(`•  Status: ${eventData.status || "TBA"}`, 30, y); y+=6;
      doc.text(`•  Total Volunteers: ${eventVols.length}`, 30, y); y+=6;
      doc.text(`•  Approved: ${approved}`, 30, y); y+=6;
      doc.text(`•  Pending: ${pending}`, 30, y); y+=6;
      doc.text(`•  Rejected: ${rejected}`, 30, y);

      // --- EVENT DETAILS PAGE ---
      doc.addPage();
      y = 25;

      if (ngoLogo) {
        try {
          await addLogo(doc, pageW - 35, pageH - 35, 25, 25, 0.06);
        } catch {}
      }

      // Event title header
      doc.setFillColor(235, 247, 235);
      doc.roundedRect(14, y - 5, pageW - 28, 10, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(eventData.event_title || "Untitled Event", 16, y);
      y += 10;

      // Try to add event image on right side
      const imageStartY = y;
      const { imageHeight, imageAdded } = await addEventImageRight(doc, eventData.event_image, imageStartY, pageW, pageH);

      // Calculate text width based on whether image was added
      const leftColWidth = imageAdded ? pageW - 90 : pageW - 32;

      // Helper to print key-value pairs
      const printKV = (label, value) => {
        if (y > pageH - 30) { doc.addPage(); y = 25; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, 16, y);
        doc.setFont("helvetica", "normal");
        const wrapped = doc.splitTextToSize(String(value || "-"), leftColWidth - 24);
        wrapped.forEach((line, i) => {
          if (y + i * 5 > pageH - 30) { doc.addPage(); y = 25; }
          doc.text(line, 40, y + i * 5);
        });
        y += Math.max(6, wrapped.length * 5);
      };

      printKV("Event ID:", eventData.event_id || "-");
      printKV("Status:", eventData.status || "TBA");
      printKV("Date:", formatDate(eventData.date));
      printKV("Time:", `${formatTime(eventData.time_start)} – ${formatTime(eventData.time_end)}${calculateDuration(eventData.time_start, eventData.time_end) ? ` (${calculateDuration(eventData.time_start, eventData.time_end)})` : ""}`);
      printKV("Call Time:", eventData.call_time ? formatTime(eventData.call_time) : "TBA");
      printKV("Location:", eventData.location || "TBA");

      // Ensure we're past the image before starting sections
      if (imageAdded && y < imageStartY + imageHeight + 5) {
        y = imageStartY + imageHeight + 5;
      }

      // Define sections
      const sections = [
        { label: "Event Objectives:", content: splitToBullets(eventData.event_objectives) },
        { label: "Event Description:", content: eventData.description ? [eventData.description] : [] },
        { label: "What to Expect:", content: splitToBullets(eventData.what_expect) },
        { label: "Volunteer Guidelines:", content: splitToBullets(eventData.volunteer_guidelines) },
        { label: "Volunteer Opportunities:", content: splitToBullets(eventData.volunteer_opportunities) }
      ];

      // Render sections with full width now (image is above)
      const fullWidth = pageW - 32;
      for (const sec of sections) {
        if (sec.content.length > 0) {
          if (y > pageH - 30) { doc.addPage(); y = 25; }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(sec.label, 16, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          sec.content.forEach((line) => {
            const wrapped = doc.splitTextToSize(line, fullWidth - 12);
            wrapped.forEach((ln) => {
              if (y > pageH - 30) { doc.addPage(); y = 25; }
              doc.text(`•  ${ln}`, 20, y);
              y += 5;
            });
          });
          y += 3;
        }
      }

      // Volunteer engagement stats
      if (eventVols.length > 0) {
        if (y > pageH - 30) { doc.addPage(); y = 25; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Volunteer Engagement:", 16, y); y += 6;
        doc.setFont("helvetica", "normal");
        doc.text(`•  Total Volunteers Joined: ${eventVols.length}`, 20, y); y+=5;
        doc.text(`•  Approved: ${approved}`, 20, y); y+=5;
        doc.text(`•  Pending: ${pending}`, 20, y); y+=5;
        doc.text(`•  Rejected: ${rejected}`, 20, y); y+=8;
      }

      // --- FOOTER ---
      const totalPages = doc.internal.getNumberOfPages();
      const generatedDate = new Date().toLocaleString("en-US", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${totalPages}`, pageW / 2, pageH - 10, { align: "center" });
        doc.text(`Generated: ${generatedDate}`, 14, pageH - 10);
      }

      const fileName = `${ngoName || "NGO"}_${eventData.event_id}_Report.pdf`;
      doc.save(fileName);
      
    } catch (err) {
  setValidationError("Failed to generate report. Please try again.");
} finally {
  setIsGeneratingReport(false);
}
  };

  if (loading) return (
  <div className="flex min-h-screen bg-no-repeat bg-center" style={{backgroundImage: `url(${CentroAdminBg})`, backgroundSize: "100% 100%"}}>
    <PDFLoadingOverlay isVisible={isGeneratingReport} />
    <ValidationErrorPopup 
      message={validationError} 
      onClose={() => setValidationError("")} 
    />
    <Sidebar onCollapseChange={setSidebarCollapsed} />
    
    <main 
      className="flex-1 p-4 overflow-y-auto transition-all duration-300"
      style={{
        filter: isGeneratingReport || validationError ? "blur(3px)" : "none",
        marginLeft: sidebarCollapsed ? "5rem" : "16rem"
      }}
    >
          <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-900 mx-auto"></div>
          <p className="mt-4 text-emerald-900 font-montserrat font-semibold text-lg">Loading event data...</p>
        </div>
      </main>
    </div>
  );

 if (error || !eventData) return (
  <div className="flex min-h-screen bg-no-repeat bg-center" style={{backgroundImage: `url(${CentroAdminBg})`, backgroundSize: "100% 100%"}}>
    <PDFLoadingOverlay isVisible={isGeneratingReport} />
    <ValidationErrorPopup 
      message={validationError} 
      onClose={() => setValidationError("")} 
    />
    <Sidebar onCollapseChange={setSidebarCollapsed} />
    
    <main 
      className="flex-1 p-4 overflow-y-auto transition-all duration-300"
      style={{
        filter: isGeneratingReport || validationError ? "blur(3px)" : "none",
        marginLeft: sidebarCollapsed ? "5rem" : "16rem"
      }}
    >
        <div className="bg-white rounded-lg shadow border-2 border-emerald-800 overflow-hidden p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-3xl font-bold font-montserrat  text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 font-montserrat  text-lg mb-6">{error || "Event not found"}</p>
          <Link to="/manage-reports" className="inline-block bg-emerald-900 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors">← Back to Events</Link>
        </div>
      </main>
    </div>
  );

  return (
  <div className="flex min-h-screen bg-no-repeat bg-center" style={{backgroundImage: `url(${CentroAdminBg})`, backgroundSize: "100% 100%"}}>
    <PDFLoadingOverlay isVisible={isGeneratingReport} />
    <ValidationErrorPopup 
      message={validationError} 
      onClose={() => setValidationError("")} 
    />
    <Sidebar onCollapseChange={setSidebarCollapsed} />
    
    <main 
      className="flex-1 p-4 overflow-y-auto transition-all duration-300"
      style={{
        filter: isGeneratingReport || validationError ? "blur(3px)" : "none",
        marginLeft: sidebarCollapsed ? "5rem" : "16rem"
      }}
    > 
        <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
          
          <div className={`${getHeaderColor(eventData.event_id)} rounded-t-full py-3 font-montserrat font-bold text-3xl shadow-md text-emerald-900 border-emerald-800 relative`}>
            <div className="text-center">
              <span className="text-white font-montserrat font-extrabold">{eventData.event_id}</span>
            </div>
          </div>

           <div className="p-6 flex gap-8 flex-1 overflow-auto">
            {/* LEFT COLUMN - Main Content */}
            <div className="flex-1 space-y-6 overflow-y-auto pr-4">
              {/* Event Title with Generate Report Button */}
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-bold font-montserrat text-emerald-800 leading-snug hover:text-emerald-700 transition-colors" title="Event Title">
                  {eventData.event_title}
                </h2>
                
                {/* Generate Report Button */}
                <button
                  onClick={handleGenerateEventReport}
                  disabled={isGeneratingReport}
                  className="bg-emerald-600 text-white font-montserrat font-semibold px-4 py-3 rounded-xl hover:bg-emerald-700 shadow-lg transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  {isGeneratingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Generate Report
                    </>
                  )}
                </button>
              </div>

    <div className="flex gap-6 min-h-[250px]">
                <div className="flex-1 rounded-lg overflow-hidden shadow-lg cursor-pointer hover:opacity-90 transition-all max-h-[250px]"
                  title="Click to edit Event Image">
                  {eventImage ?  (
                    <img src={eventImage} alt="Event" className="w-full h-[250px] object-cover rounded-lg" onError={() => setEventImage(null)} />
                  ) : (
                    <div className="text-center text-emerald-900 flex flex-col items-center justify-center h-[250px]">
                      <div className="text-4xl mb-2">📸</div>
                      <p className="font-semibold font-montserrat">Add Event Image</p>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 text-gray-700 font-montserrat text-lg">
                  <div className="flex items-center hover:text-emerald-800 transition-colors">
                    <strong>Date:</strong> <span className="ml-2">{formatDate(eventData.date)}</span>
                  </div>
                  <div className="flex items-center hover:text-emerald-800 transition-colors">
                    <strong>Time:</strong>
                    <span className="ml-2">
                      {formatTime(eventData.time_start)} – {formatTime(eventData.time_end)}
                      {eventData.time_start && eventData.time_end && (
                        <span className="text-gray-600 ml-2">
                          ({calculateDuration(eventData.time_start, eventData.time_end)})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center hover:text-emerald-800 transition-colors">
                    <strong>Location:</strong> <span className="ml-2">{eventData.location || "TBA"}</span>
                  </div>
                  {eventData.call_time && (
                    <div className="flex items-center">
                      <strong>Call Time:</strong> <span className="ml-2">{formatTime(eventData.call_time)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-xl text-emerald-900 hover:text-emerald-700 transition-colors">Event Objectives:</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-800 p-2 rounded-lg">
                  {parseObjectives(eventData.event_objectives).map((objective, index) => (
                    <li key={index} className="leading-relaxed">{objective.trim()}</li>
                  ))}
                </ul>
              </div>

              {eventData.description && (
                <div>
                  <h3 className="font-semibold font-montserrat text-xl text-emerald-900 hover:text-emerald-700 transition-colors">Event Description:</h3>
                  <div className="text-gray-800 bg-blue-50 p-2 rounded-lg leading-relaxed">{eventData.description}</div>
                </div>
              )}

              {eventData.what_expect && (
                <div>
                  <h3 className="font-semibold text-xl text-emerald-900 hover:text-emerald-700 transition-colors">What to Expect:</h3>
                  {parseBulletPoints(eventData.what_expect).length > 0 ? (
                    <ul className="list-disc pl-6 space-y-2 text-gray-800 bg-yellow-50 p-2 rounded-lg">
                      {parseBulletPoints(eventData.what_expect).map((item, index) => (
                        <li key={index} className="leading-relaxed">{item.trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-800 bg-yellow-50 p-2 rounded-lg leading-relaxed">{eventData.what_expect}</div>
                  )}
                </div>
              )}

              {eventData.volunteer_guidelines && (
                <div>
                  <h3 className="font-semibold text-xl text-emerald-900 hover:text-emerald-700 transition-colors">Volunteer Guidelines:</h3>
                  {parseBulletPoints(eventData.volunteer_guidelines).length > 0 ? (
                    <ul className="list-disc pl-6 space-y-2 text-gray-800 bg-purple-50 p-2 rounded-lg">
                      {parseBulletPoints(eventData.volunteer_guidelines).map((item, index) => (
                        <li key={index} className="leading-relaxed">{item.trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-800 bg-purple-50 p-2 rounded-lg leading-relaxed">{eventData.volunteer_guidelines}</div>
                  )}
                </div>
              )}

              {eventData.volunteer_opportunities && (
                <div>
                  <h3 className="font-semibold text-xl text-emerald-900 hover:text-emerald-700 transition-colors">Volunteer Opportunities:</h3>
                  {parseBulletPoints(eventData.volunteer_opportunities).length > 0 ? (
                    <ul className="list-disc pl-6 space-y-2 text-gray-800 bg-green-50 p-2 rounded-lg">
                      {parseBulletPoints(eventData.volunteer_opportunities).map((item, index) => (
                        <li key={index} className="leading-relaxed">{item.trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-800 bg-green-50 p-2 rounded-lg leading-relaxed">{eventData.volunteer_opportunities}</div>
                  )}
                </div>
              )}

              <div className="flex justify-center pt-1">
                <Link to={`/event/${eventData.event_id}/first`}>
                  <button className="bg-emerald-900 text-white font-montserrat font-semibold px-8 py-3 rounded-lg hover:bg-emerald-700 shadow-lg transition-colors cursor-pointer">
                    Verify 
                  </button>
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN - Fixed Width Sidebar */}
            <div className="w-80 space-y-4 flex-shrink-0 overflow-y-auto">
              {/* Status Badge - Real-time */}
              {/* Status Badge - Real-time */}
<div className="text-center space-y-3">
  <div className={`px-6 py-2 rounded-full text-center font-bold transition-all duration-500 ${
    currentStatus === 'ONGOING' ? 'bg-emerald-500 text-white animate-pulse' : 
    currentStatus === 'UPCOMING' ? 'bg-yellow-500 text-white' : 
    currentStatus === 'COMPLETED' ? 'bg-gray-500 text-white' :
    'bg-blue-500 text-white'
  }`}>
    {currentStatus || eventData.status}
  </div>
</div>
              {/* Complete Submissions Card */}
              <div className="bg-emerald-900 rounded-lg p-6 text-center shadow-lg transition-colors font-montserrat" title="Click to view submission details">
                <p className="text-xl font-semibold text-white mb-2">Complete Submissions</p>
                <p className="text-5xl font-bold text-yellow-400 mb-2">{volunteerStats.submissions}</p>
                <p className="text-l text-yellow-500 font-bold">out of {eventData.volunteers_limit || "unlimited"} volunteers</p>
                <Link to={`/folder/${eventId}`}>
                  <button className="bg-emerald-600 text-white font-semibold font-montserrat px-8 py-2 rounded-full mt-4 hover:bg-emerald-700 transition-colors cursor-pointer">
                  Files
                    </button>
                </Link>
              </div>

              {/* Total Volunteers Card */}
              <div className="bg-emerald-900 rounded-lg p-6 text-center shadow-lg transition-colors font-montserrat" title="Click to view volunteer details">
                <p className="text-lg font-semibold text-white mb-2">Total Volunteers Joined</p>
                <p className="text-6xl font-bold text-yellow-400 mb-2">{volunteerStats.totalJoined}</p>
                <div className="text-l text-white space-y-1 font-montserrat">
                  <p><span className="font-semibold text-yellow-500">{volunteerStats.ongoingCount}</span> Going</p>
                  <p><span className="font-semibold text-yellow-500">{volunteerStats.pendingCount}</span> Pending</p>
                  {eventData.volunteers_limit && <p className="mt-2 text-white font-semibold">Limit: {eventData.volunteers_limit}</p>}
                </div>
              </div>

              {/* Event Created Card */}
              {eventData.created_at && (
                <div className="bg-emerald-900 rounded-lg p-4 text-center font-montserrat">
                  <p className="text-l text-yellow-400 font-bold">Event Created</p>
                  <p className="font-semibold text-white">{formatDate(eventData.created_at)}</p>
                </div>
              )}

              {/* Back Button */}
              <div className="text-center pt-4">
                <Link to="/manage-reports">
                <button className="bg-emerald-900 text-white font-montserrat font-semibold px-8 py-3 rounded-lg hover:bg-emerald-700  shadow-lg transition-colors cursor-pointer">Back</button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EventPage;