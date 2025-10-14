import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import { useNavigate } from "react-router-dom";
import supabase from "../config/supabaseClient";

// Icons
import DatesIcon from "../images/date.svg";
import FileIcon from "../images/file.svg";
import PriorityIcon from "../images/priority.svg";
import ExpiryIcon from "../images/expiry.svg";
import EventIcon from "../images/event.svg";

// 🔹 Reusable Modal Component
function ConfirmationModal({ title, message, onConfirm, onCancel, type = "confirm" }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn"
    >
      {/* Background Blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      {/* Modal Box */}
      <div
        className="relative bg-white rounded-lg shadow-lg p-6 w-96 text-center z-50 border-4 border-green-800 transform animate-scaleIn"
        style={{ backgroundColor: "#fff4d9" }}
      >
        <h2 className="text-xl font-bold text-green-900 mb-4">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>

        <div className="flex justify-center gap-4">
          {type === "confirm" ? (
            <>
              <button
                onClick={onConfirm}
                className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-900 cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={onCancel}
                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onCancel}
              className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-900 cursor-pointer"
            >
              OK
            </button>
          )}
        </div>
      </div>

      {/* 🔹 Animations (fadeIn + scaleIn) */}
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

function CreateAnnouncement() {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [ngoCode, setNgoCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [postDate, setPostDate] = useState("");
  const [priorityType, setPriorityType] = useState("");
  const [announcementType, setAnnouncementType] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [expiryDate, setExpiryDate] = useState("");

  // Event options
  const [events, setEvents] = useState([]);

  // Modal Config
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem("admin"));
    if (admin) {
      setAdminData(admin);
      setNgoCode(admin.NGO_Information?.ngo_code || "");
      fetchEvents(admin.NGO_Information?.ngo_code);
    }

    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16);
    setPostDate(formattedDate);
  }, []);

  const fetchEvents = async (ngoId) => {
    if (!ngoId) return;
    try {
      const { data, error } = await supabase
        .from("Event_Information")
        .select("event_id, event_title, date")
        .eq("ngo_id", ngoId)
        .order("date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const getNextAnnouncementId = async () => {
    try {
      const { data, error } = await supabase
        .from("Announcements")
        .select("announcement_id")
        .order("announcement_id", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastId = data[0].announcement_id;
        const number = parseInt(lastId.split("-")[2]);
        return `ANN-2025-${String(number + 1).padStart(4, "0")}`;
      } else {
        return "ANN-2025-0001";
      }
    } catch (error) {
      console.error("Error getting next announcement ID:", error);
      return "ANN-2025-0001";
    }
  };

  const uploadFile = async (file) => {
    if (!file) return null;
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `announcements/${fileName}`;
      const { error } = await supabase.storage
        .from("centro_bucket")
        .upload(filePath, file);

      if (error) throw error;
      const { data: publicData } = supabase.storage
        .from("centro_bucket")
        .getPublicUrl(filePath);

      return publicData.publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      setModalConfig({
        title: "Upload Error",
        message: "There was an error uploading the file. Please try again.",
        onCancel: () => setModalConfig(null),
        type: "alert",
      });
      return null;
    }
  };

  // Handle file selection and preview
  const handleFileSelection = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  // Get file icon based on file type
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    const iconStyle = "w-12 h-12 mx-auto mb-2";
    
    switch (extension) {
      case 'pdf':
        return (
          <div className={`${iconStyle} bg-red-100 rounded-lg flex items-center justify-center`}>
            <span className="text-red-600 font-bold text  -xs">PDF</span>
          </div>
        );
      case 'doc':
      case 'docx':
        return (
          <div className={`${iconStyle} bg-blue-100 rounded-lg flex items-center justify-center`}>
            <span className="text-blue-600 font-bold text-xs">DOC</span>
          </div>
        );
      case 'xls':
      case 'xlsx':
        return (
          <div className={`${iconStyle} bg-green-100 rounded-lg flex items-center justify-center`}>
            <span className="text-green-600 font-bold text-xs">XLS</span>
          </div>
        );
      case 'txt':
        return (
          <div className={`${iconStyle} bg-gray-100 rounded-lg flex items-center justify-center`}>
            <span className="text-gray-600 font-bold text-xs">TXT</span>
          </div>
        );
      default:
        return (
          <div className={`${iconStyle} bg-gray-100 rounded-lg flex items-center justify-center`}>
            <span className="text-gray-600 font-bold text-xs">FILE</span>
          </div>
        );
    }
  };

  // 🔹 Form Validation with Modal
  const validateForm = () => {
    const missingFields = [];
    if (!title.trim()) missingFields.push("Title");
    if (!postDate) missingFields.push("Post Date & Time");
    if (!priorityType) missingFields.push("Priority Type");
    if (!announcementType) missingFields.push("Announcement Type");
    if (announcementType === "Event" && !selectedEvent) missingFields.push("Event Selection");
    if (!message.trim()) missingFields.push("Message");

    if (missingFields.length > 0) {
      setModalConfig({
        title: "Incomplete Form",
        message: "Please complete all required fields first.",
        onCancel: () => setModalConfig(null),
        type: "alert",
      });
      return false;
    }
    return true;
  };

  const createAnnouncement = async (isDraft = false) => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const announcementId = await getNextAnnouncementId();
      let fileUrl = null;

      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        if (!fileUrl) {
          setLoading(false);
          return;
        }
      }

      const announcementData = {
        announcement_id: announcementId,
        ngo_id: ngoCode,
        event_id: announcementType === "Event" ? selectedEvent : null,
        title: title.trim(),
        message: message.trim(),
        post_date: postDate,
        priority_type: priorityType,
        attachment_file: fileUrl,
        expiry_date: expiryDate || null,
        status: isDraft ? "DRAFT" : "PUBLISHED",
        created_at: new Date().toISOString(),
        created_by: adminData?.admin_id,
        announcement_type: announcementType,
      };

      const { error } = await supabase
        .from("Announcements")
        .insert([announcementData]);

      if (error) throw error;

      setModalConfig({
        title: "Success",
        message: `Announcement ${isDraft ? "saved as draft" : "published"} successfully!`,
        onCancel: () => {
          setModalConfig(null);
          navigate("/dashboard");
        },
        type: "alert",
      });
    } catch (error) {
      console.error("Error creating announcement:", error);
      setModalConfig({
        title: "Error",
        message: "Error creating announcement. Please try again.",
        onCancel: () => setModalConfig(null),
        type: "alert",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatEventOption = (event) => {
    const eventDate = new Date(event.date).toLocaleDateString();
    return `${event.event_title} (${eventDate})`;
  };

  return (
    <div
      className="flex min-h-screen bg-no-repeat bg-center"
      style={{
        backgroundImage: `url(${CentroAdminBg})`,
        backgroundSize: "100% 100%",
      }}
    >
      <Sidebar />

      <main className="flex-1 ml-64 p-6 flex justify-center items-start">
  <div className="w-full mx-auto space-y-4">
    <div className="border-2 border-emerald-900 rounded-lg p-3 bg-emerald-900 text-white text-center text-2xl font-bold shadow-md">
      CREATE ANNOUNCEMENT
    </div>

    <div
      className="rounded-lg shadow-xl p-6 border-4 border-green-800"
      style={{ backgroundColor: "#fff4d9" }}
    >
      {/* Title */}
      <div className="mb-4">
        <label className="block mb-2 font-semibold text-lg text-green-900">Title</label>
        <input
          type="text"
          placeholder="Enter announcement title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 rounded border bg-white border-green-300 focus:outline-none focus:ring-2 focus:ring-green-700 cursor-pointer"
        />
      </div>
      {/* Post Date & Priority */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
  {/* Post Date */}
  <div className="flex flex-col w-full">
    <label className="block mb-2 font-semibold text-lg text-green-900">
      Post Date & Time
    </label>
    <div className="flex items-center border bg-white border-green-300 rounded px-2 w-full">
      <img src={DatesIcon} alt="Post Date" className="w-5 h-5 mr-2" />
      <input
        type="datetime-local"
        value={postDate}
        onChange={(e) => setPostDate(e.target.value)}
        className="flex-1 p-2 border-none focus:outline-none cursor-pointer text-gray-700 bg-transparent"
        style={{
          colorScheme: "light",
          WebkitAppearance: "none",
          MozAppearance: "textfield",
        }}
      />
    </div>
  </div>

  {/* Priority Type */}
  <div className="flex flex-col w-full">
    <label className="block mb-2 font-semibold text-lg text-green-900">
      Priority Type
    </label>
    <div className="flex items-center border bg-white border-green-300 rounded px-2 w-full">
      <img src={PriorityIcon} alt="Priority" className="w-5 h-5 mr-2" />
      <select
        value={priorityType}
        onChange={(e) => setPriorityType(e.target.value)}
        className="flex-1 p-2 border-none focus:outline-none cursor-pointer"
      >
        <option value="">Select priority type</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
    </div>
  </div>
</div>


      {/* Announcement Type */}
      <div className="mb-4">
        <label className="block mb-2 font-semibold text-lg text-green-900">Announcement Type</label>
        <div className="flex items-center border bg-white border-green-300 rounded px-3">
          <img src={EventIcon} alt="Announcement Type" className="w-5 h-5 mr-2" />
          <select
            value={announcementType}
            onChange={(e) => {
              setAnnouncementType(e.target.value);
              if (e.target.value !== "Event") {
                setSelectedEvent("");
              }
            }}
            className="w-full p-2 border-none focus:outline-none cursor-pointer"
          >
            <option value="">Select announcement type</option>
            <option value="All">All (Organization-wide)</option>
            <option value="Event">Event-specific</option>
          </select>
        </div>
      </div>

      {/* Event Selection - Only show when "Event" is selected */}
      {announcementType === "Event" && (
        <div className="mb-4">
          <label className="block mb-2 font-semibold text-lg text-green-900">Select Event</label>
          <div className="flex items-center border bg-white border-green-300 rounded px-3">
            <img src={EventIcon} alt="Event" className="w-5 h-5 mr-2" />
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full p-2 border-none focus:outline-none cursor-pointer"
            >
              <option value="">Select event</option>
              {events.map((event) => (
                <option key={event.event_id} value={event.event_id}>
                  {event.event_id} - {formatEventOption(event)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Message */}
      <div className="mb-4">
        <label className="block mb-2 font-semibold text-lg text-green-900">Message</label>
        <textarea
          placeholder="Enter your announcement message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-3 rounded bg-white border border-green-300 h-40 focus:outline-none focus:ring-2 focus:ring-green-700 cursor-pointer resize-none"
        />
      </div>

      {/* File & Expiry Date */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div  className="flex flex-col w-full">
              <label className="block mb-2 font-semibold text-lg text-green-900">Attach File (Optional)</label>
    <div className="flex items-center border bg-white border-green-300 rounded px-3 w-full">
            <img src={FileIcon} alt="File" className="w-5 h-5 mr-2" />
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
              onChange={handleFileSelection}
        className="flex-1 p-2 border-none bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
          
          {/* File Preview Section */}
          {selectedFile && (
            <div className="mt-4 p-4 bg-gray-50 w-full border border-gray-200 rounded-lg">
              <div className="text-center">
                {filePreview ? (
                  <div>
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="w-full max-h-32 object-contain mx-auto rounded border"
                    />
                    <p className="text-sm text-gray-600 mt-2 font-medium">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    {getFileIcon(selectedFile.name)}
                    <p className="text-sm text-gray-700 font-medium">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                    const fileInput = document.querySelector('input[type="file"]');
                    if (fileInput) fileInput.value = '';
                  }}
                  className="mt-2 text-red-600 hover:text-red-800 text-xs font-medium"
                >
                  Remove File
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col w-full">
          <label className="block mb-2 font-semibold text-lg text-green-900">Expiry Date (Optional)</label>
    <div className="flex items-center border bg-white border-green-300 rounded px-3 w-full">
            <img src={ExpiryIcon} alt="Expiry" className="w-5 h-5 mr-2" />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
        className="flex-1 p-2 border-none bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Buttons with Confirmation */}
      <div className="flex flex-wrap gap-6 justify-center text-lg pb-6">
        <button
          disabled={loading}
          onClick={() =>
            setModalConfig({
              title: "Publish Announcement",
              message: "Are you sure you want to publish this announcement?",
              onConfirm: () => {
                setModalConfig(null);
                createAnnouncement(false);
              },
              onCancel: () => setModalConfig(null),
            })
          }
          className="bg-green-700 text-white px-8 py-3 rounded-full border-green-800 border-2 hover:bg-green-900 disabled:opacity-50 cursor-pointer font-semibold"
        >
          {loading ? "Publishing..." : "Publish Announcement"}
        </button>

        <button
          onClick={() =>
            setModalConfig({
              title: "Discard Announcement",
              message: "Are you sure you want to discard this announcement?",
              onConfirm: () => {
                setModalConfig(null);
                navigate("/dashboard");
              },
              onCancel: () => setModalConfig(null),
            })
          }
          className="bg-red-600 text-white px-8 py-3 rounded-full border-red-700 border-2 hover:bg-red-700 cursor-pointer font-semibold"
        >
          Discard
        </button>
      </div>
    </div>
  </div>
</main>

      {/* 🔹 Show Modal */}
      {modalConfig && (
        <ConfirmationModal
          title={modalConfig.title}
          message={modalConfig.message}
          onConfirm={modalConfig.onConfirm}
          onCancel={modalConfig.onCancel}
          type={modalConfig.type || "confirm"}
        />
      )}
    </div>
  );
}

export default CreateAnnouncement;