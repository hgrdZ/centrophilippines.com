// src/pages/FirstEventPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import supabase from "../config/supabaseClient";
import { X, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, File, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

// File Preview Modal Component
function FilePreviewModal({ isOpen, onClose, files, currentIndex, setCurrentIndex }) {
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (isOpen && files.length > 0 && currentIndex >= 0) {
      setLoading(true);
      setZoom(1); // Reset zoom when changing files
      setTimeout(() => setLoading(false), 300);
    }
  }, [isOpen, currentIndex, files]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const currentFile = files[currentIndex];
  const isImage = currentFile?.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = currentFile?.url?.match(/\.pdf$/i);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>

      <div 
        className="relative bg-white rounded-xl shadow-2xl w-[815px] h-[817px] mx-4 z-[10000] flex flex-col border-2 border-gray-300" 
        style={{ maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)' }}
      >
        <div className="flex items-start justify-between p-4 border-b bg-gray-50">
          <div className="flex-1 pr-4">
            {currentFile?.taskName && (
              <>
                {(() => {
                  const parts = currentFile.taskName.split(':');
                  const title = parts[0]?.trim() || 'Task Description';
                  const description = parts.slice(1).join(':').trim();
                  
                  return (
                    <>
                      <h4 className="text-sm font-montserrat font-semibold text-gray-700 mb-2">{title}:</h4>
                      <ul className="list-none space-y-1">
                        {description.split('-').map((item, idx) => (
                          item.trim() && (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="text-emerald-600 mr-2">•</span>
                              <span>{item.trim()}</span>
                            </li>
                          )
                        ))}
                      </ul>
                      <p className="text-center text-emerald-900 italic font-medium mt-3">
                        {currentFile?.fileName}
                      </p>
                    </>
                  );
                })()}
              </>
            )}
          </div>
          <a
            href={currentFile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-4 py-2 rounded-lg border-2 border-emerald-600 bg-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 text-white font-medium text-sm transition-all"
          >
            Open in New Tab
          </a>
        </div>

        <div className="flex-1 relative overflow-auto bg-gray-100">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              {isImage ? (
                <img
                  src={currentFile.url}
                  alt={currentFile.fileName}
                  className="object-contain transition-transform duration-200"
                  style={{ 
                    transform: `scale(${zoom})`,
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                />
              ) : isPDF ? (
                <div className="text-center">
                  <FileText className="w-20 h-20 text-red-600 mx-auto mb-4" />
                  <p className="text-gray-700 mb-2 text-lg font-semibold">{currentFile.fileName}</p>
                  <p className="text-gray-600 mb-6">PDF Document</p>
                  <a
                    href={currentFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Open in New Tab
                  </a>
                </div>
              ) : (
                <div className="text-center">
                  <File className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-700 mb-2 text-lg font-semibold">{currentFile.fileName}</p>
                  <p className="text-gray-600 mb-6">Document File</p>
                  <a
                    href={currentFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Open in New Tab
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                File {currentIndex + 1} of {files.length}
              </span>
              {isImage && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      zoom <= 0.5
                        ? "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700"
                    }`}
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="p-2 rounded-lg border-2 bg-white border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 transition-all"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      zoom >= 3
                        ? "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700"
                    }`}
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 ml-2">{Math.round(zoom * 100)}%</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {files.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                      currentIndex === 0
                        ? "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === files.length - 1}
                    className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                      currentIndex === files.length - 1
                        ? "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700"
                    }`}
                  >
                    Next
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:bg-red-50 hover:border-red-500 hover:text-red-700 font-medium text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

// Confirmation Modal
function ConfirmationModal({ isOpen, onClose, onConfirm, action, count }) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn"
        onClick={handleBackdropClick}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div className="relative bg-white rounded-xl shadow-2xl p-8 w-96 max-w-md mx-4 z-[10000] transform animate-scaleIn border-2 border-emerald-900">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Confirm {action === "APPROVE" ? "APPROVAL" : "REJECTION"}
            </h2>
            <p className="text-gray-600 mb-8 text-lg mt-4">
              Are you sure you want to {action} {count} volunteer
              {count > 1 ? "s" : ""}?
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={onConfirm}
                className={`${
                  action === "APPROVE"
                    ? "bg-emerald-600 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700"
                    : "bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700"
                } text-white px-6 py-3 rounded-lg text-lg font-medium border-2 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer`}
              >
                Yes, {action === "APPROVE" ? "APPROVE" : "REJECT"}
              </button>
              <button
                onClick={onClose}
                className="bg-white text-gray-800 px-6 py-3 rounded-lg text-lg font-medium border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

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

// Success Modal
function SuccessModal({ isOpen, onClose, action, count }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div className="relative bg-white rounded-xl shadow-2xl p-8 w-96 max-w-md mx-4 z-[10000] transform animate-scaleIn border-2 border-emerald-900">
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              action === "APPROVE" 
            }`}>
              <h2 className="text-3xl font-bold text-emerald-800 mb-2">
              Success!
            </h2>
            </div>
            <p className="text-gray-600 text-lg">
              Successfully {action === "APPROVE" ? "APPROVED" : "REJECTED"} {count} volunteer{count > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

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

function FirstEventPage() {
  const { eventId } = useParams();
  const [eventTitle, setEventTitle] = useState("");
  const [loadingTitle, setLoadingTitle] = useState(true);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successAction, setSuccessAction] = useState("");
  const [successCount, setSuccessCount] = useState(0);
  const [individualModalOpen, setIndividualModalOpen] = useState(false);
  const [individualAction, setIndividualAction] = useState("");
  const [individualVolunteerId, setIndividualVolunteerId] = useState(null);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("Event_Information")
        .select("event_title")
        .eq("event_id", eventId)
        .single();

      if (error) throw error;
      if (data) setEventTitle(data.event_title);
    } catch (err) {
      console.error("Error fetching event title:", err);
      setEventTitle("Untitled Event");
    } finally {
      setLoadingTitle(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const { data: eventUsers, error: eventError } = await supabase
        .from("Event_User")
        .select("user_id, userEvent_id")
        .eq("event_id", eventId);

      if (eventError) throw eventError;

      if (!eventUsers || eventUsers.length === 0) {
        setVolunteers([]);
        return;
      }

      const userIds = eventUsers.map(eu => eu.user_id);

      const { data: users, error: usersError } = await supabase
        .from("LoginInformation")
        .select("user_id, firstname, lastname")
        .in("user_id", userIds);

      if (usersError) throw usersError;

      // Fetch task descriptions from Task_Reports
      const { data: taskReport, error: taskError } = await supabase
        .from("Task_Reports")
        .select("task_id, description_one, description_two, description_three")
        .eq("event_id", eventId)
        .single();

      if (taskError && taskError.code !== 'PGRST116') {
        console.error("Error fetching task descriptions:", taskError);
      }

      // Fetch file URLs and status from Task_Submissions
      const { data: taskSubmissions, error: submissionsError } = await supabase
        .from("Task_Submissions")
        .select("user_id, task_one, task_two, task_three, status")
        .eq("event_id", eventId)
        .in("user_id", userIds);

      if (submissionsError) {
        console.error("Error fetching task submissions:", submissionsError);
      }

      // Fetch certificate statuses
      const { data: existingVolunteers, error: volError } = await supabase
        .from("volunteers")
        .select("volunteer_id, certificate_status")
        .eq("event_id", eventId);

      if (volError) console.error("Error fetching volunteer statuses:", volError);

      const statusMap = {};
      if (existingVolunteers) {
        existingVolunteers.forEach(v => {
          statusMap[v.volunteer_id] = v.certificate_status;
        });
      }

      const submissionMap = {};
      if (taskSubmissions) {
        taskSubmissions.forEach(sub => {
          submissionMap[sub.user_id] = sub;
        });
      }

      const volunteersData = eventUsers.map(eu => {
        const user = users?.find(u => u.user_id === eu.user_id);
        const submission = submissionMap[eu.user_id];

        let tasksCompleted = 0;
        if (submission) {
          if (submission.task_one && submission.task_one.trim()) tasksCompleted++;
          if (submission.task_two && submission.task_two.trim()) tasksCompleted++;
          if (submission.task_three && submission.task_three.trim()) tasksCompleted++;
        }

        return {
          id: eu.userEvent_id,
          volunteer_id: eu.user_id,
          name: user ? `${user.firstname} ${user.lastname}` : "Unknown",
          tasks_completed: tasksCompleted,
          total_tasks: 3,
          certificate_status: statusMap[eu.user_id] || null,
          submission: submission || null,
          taskReport: taskReport
        };
      });

      setVolunteers(volunteersData);
    } catch (err) {
      console.error("Error fetching volunteers:", err);
      setVolunteers([]);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchVolunteers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const toggleSelect = (id) => {
    setSelectedVolunteers((prev) =>
      prev.includes(id) ? prev.filter((vId) => vId !== id) : [...prev, id]
    );
  };

  const toggleExpand = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleApplyAction = (action) => {
    if (selectedVolunteers.length === 0) {
      alert("Please select at least one volunteer.");
      return;
    }
    setIndividualAction(action);
    setModalOpen(true);
  };

  const updateCertificateStatus = async (volunteerIds, status) => {
    try {
      setUpdating(true);

      // Get the selected volunteers' user_ids
      const selectedVols = volunteers.filter(v => volunteerIds.includes(v.id));
      const userIds = selectedVols.map(v => v.volunteer_id);

      console.log("Updating volunteers:", userIds);
      console.log("New status:", status);

      // Update Task_Submissions status directly
      const submissionStatus = status === "APPROVE" ? "APPROVED" : "REJECTED";
      
      const { error: taskUpdateError, data: updateData } = await supabase
        .from("Task_Submissions")
        .update({ status: submissionStatus })
        .eq("event_id", eventId)
        .in("user_id", userIds)
        .select();

      if (taskUpdateError) {
        console.error("Task update error:", taskUpdateError);
        throw taskUpdateError;
      }

      console.log("Successfully updated:", updateData);

      // Refresh volunteers data to get updated status
      await fetchVolunteers();

    } catch (err) {
      console.error("Full error:", err);
      alert(`Failed to update certificate status: ${err.message || 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirm = async () => {
    setModalOpen(false);
    const count = selectedVolunteers.length;
    await updateCertificateStatus(selectedVolunteers, individualAction);
    setSelectedVolunteers([]);
    setSuccessAction(individualAction);
    setSuccessCount(count);
    setSuccessModalOpen(true);
  };

  const handleIndividualAction = (volunteerId, action) => {
    setIndividualVolunteerId(volunteerId);
    setIndividualAction(action);
    setIndividualModalOpen(true);
  };

  const handleIndividualConfirm = async () => {
    setIndividualModalOpen(false);
    await updateCertificateStatus([individualVolunteerId], individualAction);
    setSuccessAction(individualAction);
    setSuccessCount(1);
    setSuccessModalOpen(true);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedVolunteers(
        volunteers.filter((v) => 
          !v.certificate_status && 
          v.submission?.status !== 'APPROVED' && 
          v.submission?.status !== 'REJECTED'
        ).map((v) => v.id)
      );
    } else {
      setSelectedVolunteers([]);
    }
  };

  const getFileNameFromUrl = (url) => {
    if (!url) return "";
    try {
      const parts = url.split('/');
      const fileWithTimestamp = parts[parts.length - 1];
      const decoded = decodeURIComponent(fileWithTimestamp);
      const match = decoded.match(/^\d+_(.+)$/);
      return match ? match[1] : decoded;
    } catch {
      return url;
    }
  };

  const getFileType = (url) => {
    if (!url) return "unknown";
    const extension = url.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return "image";
    } else if (extension === 'pdf') {
      return "pdf";
    } else if (['doc', 'docx'].includes(extension)) {
      return "document";
    } else if (['xls', 'xlsx'].includes(extension)) {
      return "spreadsheet";
    } else {
      return "file";
    }
  };

  const getFileIcon = (fileType) => {
    switch(fileType) {
      case "image":
        return <ImageIcon className="w-4 h-4 text-blue-600" />;
      case "pdf":
        return <FileText className="w-4 h-4 text-red-600" />;
      case "document":
        return <FileText className="w-4 h-4 text-blue-700" />;
      default:
        return <File className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleFileClick = (volunteer, taskNumber) => {
    const files = [];
    const submission = volunteer.submission;
    const taskReport = volunteer.taskReport;

    if (!submission || !taskReport) {
      console.log("No submission or task report found");
      return;
    }

    if (submission.task_one && submission.task_one.trim() && taskReport.description_one) {
      files.push({
        url: submission.task_one,
        fileName: getFileNameFromUrl(submission.task_one),
        taskName: taskReport.description_one,
        fileType: getFileType(submission.task_one)
      });
    }
    if (submission.task_two && submission.task_two.trim() && taskReport.description_two) {
      files.push({
        url: submission.task_two,
        fileName: getFileNameFromUrl(submission.task_two),
        taskName: taskReport.description_two,
        fileType: getFileType(submission.task_two)
      });
    }
    if (submission.task_three && submission.task_three.trim() && taskReport.description_three) {
      files.push({
        url: submission.task_three,
        fileName: getFileNameFromUrl(submission.task_three),
        taskName: taskReport.description_three,
        fileType: getFileType(submission.task_three)
      });
    }

    if (files.length === 0) {
      console.log("No files to preview");
      return;
    }

    let startIndex = taskNumber - 1;
    if (startIndex < 0 || startIndex >= files.length) startIndex = 0;

    setPreviewFiles(files);
    setCurrentFileIndex(startIndex);
    setFilePreviewOpen(true);
  };

  const availableVolunteers = volunteers.filter(v => !v.certificate_status || (v.submission && !v.submission.status) || v.submission?.status === 'PENDING');

  // Sort volunteers: Pending first (sorted by volunteer ID ascending), then Approved/Rejected at bottom
  const sortedVolunteers = [...volunteers].sort((a, b) => {
    const aStatus = a.submission?.status || a.certificate_status;
    const bStatus = b.submission?.status || b.certificate_status;
    
    const aIsProcessed = aStatus === 'APPROVED' || aStatus === 'REJECTED' || aStatus === 'APPROVE' || aStatus === 'REJECT';
    const bIsProcessed = bStatus === 'APPROVED' || bStatus === 'REJECTED' || bStatus === 'APPROVE' || bStatus === 'REJECT';
    
    // If one is processed and the other isn't, pending comes first
    if (aIsProcessed && !bIsProcessed) return 1;
    if (!aIsProcessed && bIsProcessed) return -1;
    
    // Within same category (both pending or both processed), sort by volunteer_id ascending
    return a.volunteer_id.localeCompare(b.volunteer_id, undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <div
      className="flex min-h-screen bg-no-repeat bg-center"
      style={{
        backgroundImage: `url(${CentroAdminBg})`,
        backgroundSize: "100% 100%",
      }}
    >
      <Sidebar />

      <main className="flex-1 ml-64 p-6">
        <div className="bg-white rounded-lg shadow-lg max-w-full">
          <div className="bg-emerald-900 text-center rounded-t-lg py-2 font-bold text-3xl text-white">
            {eventId}
          </div>
          {/* Floating Close Button */}
          <div className="absolute top-6 right-6 z-50">
            <Link
              to={`/event/${eventId}`}
              className="flex items-center justify-center bg-emerald-900 text-white rounded-full w-10 h-10 hover:bg-emerald-700 shadow-lg transition-all duration-300 transform hover:scale-105"
              title="Close and return to Event Page"
            >
              <X className="w-20 h-20" />
            </Link>
          </div>

          <div className="p-4">
            <h1 className="text-center text-3xl font-bold text-emerald-900 mb-4">
              {loadingTitle ? "Loading event title..." : eventTitle}
            </h1>

            <div className="mb-6 text-center text-sm text-gray-600">
              <div className="flex flex-wrap justify-center gap-6">
                <span className="inline-block">
                  Total Volunteers: <span className="font-semibold">{volunteers.length}</span>
                </span>
                <span className="inline-block">
                  Approved:{" "}
                  <span className="font-semibold text-emerald-800">
                    {volunteers.filter(v => v.certificate_status === "APPROVE" || v.submission?.status === 'APPROVED').length}
                  </span>
                </span>
                <span className="inline-block">
                  Rejected:{" "}
                  <span className="font-semibold text-red-600">
                    {volunteers.filter(v => v.certificate_status === "REJECT" || v.submission?.status === 'REJECTED').length}
                  </span>
                </span>
                <span className="inline-block">
                  Pending:{" "}
                  <span className="font-semibold text-orange-600">
                    {volunteers.filter(v => v.certificate_status === "PENDING" || v.submission?.status === 'PENDING').length}
                  </span>
                </span>
              </div>
            </div>

            {availableVolunteers.length > 0 && (
              <div className="flex justify-start gap-3 mb-4">
                <button
                  onClick={() => handleApplyAction("APPROVE")}
                  disabled={selectedVolunteers.length === 0 || updating}
                  className={`px-6 py-2 rounded-full font-bold text-white cursor-pointer ${
                    selectedVolunteers.length > 0 && !updating
                      ? "bg-emerald-700 hover:bg-emerald-800"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {updating ? "Processing..." : "Approve Selected"}
                </button>
                <button
                  onClick={() => handleApplyAction("REJECT")}
                  disabled={selectedVolunteers.length === 0 || updating}
                  className={`px-6 py-2 rounded-full font-bold text-white cursor-pointer ${
                    selectedVolunteers.length > 0 && !updating
                      ? "bg-red-500 hover:bg-red-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {updating ? "Processing..." : "Reject Selected"}
                </button>
              </div>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="w-full border border-gray-400">
                <thead>
                  <tr className="bg-emerald-900 text-white text-lg font-bold">
                    <th className="px-6 py-3 border border-gray-400 text-center w-16">
                      {availableVolunteers.length > 0 && (
                        <input
                          type="checkbox"
                          checked={
                            selectedVolunteers.length > 0 &&
                            selectedVolunteers.length === availableVolunteers.length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                          disabled={updating}
                        />
                      )}
                    </th>
                    <th className="px-6 py-3 border border-gray-400 text-center">
                      Volunteer ID
                    </th>
                    <th className="px-6 py-3 border border-gray-400 text-center">
                      Name
                    </th>
                    <th className="px-6 py-3 border border-gray-400 text-center">
                      Tasks Completed
                    </th>
                    <th className="px-6 py-3 border border-gray-400 text-center">
                      Certificate Status
                    </th>
                  </tr>
                </thead>
                <tbody className="text-center text-emerald-900 bg-white">
                  {sortedVolunteers.length > 0 ? (
                    sortedVolunteers.map((v) => (
                      <React.Fragment key={v.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-2 border border-gray-400 font-medium">
                            {(!v.certificate_status && v.submission?.status !== 'APPROVED' && v.submission?.status !== 'REJECTED') && (
                              <input
                                type="checkbox"
                                checked={selectedVolunteers.includes(v.id)}
                                onChange={() => toggleSelect(v.id)}
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                                disabled={updating}
                              />
                            )}
                          </td>
                          <td className="px-4 py-2 border border-gray-400 font-medium">
                            {v.volunteer_id}
                          </td>
                          <td className="px-4 py-2 border border-gray-400 font-medium">
                            <button
                              onClick={() => toggleExpand(v.id)}
                              className="text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
                            >
                              {v.name}
                            </button>
                          </td>
                          <td className="px-4 py-2 border border-gray-400 font-medium">
                            {v.tasks_completed}/{v.total_tasks}
                          </td>
                          <td className="px-4 py-4 border border-gray-400 font-medium">
                            {v.submission?.status === 'APPROVED' || v.certificate_status === "APPROVE" ? (
                              <span className="px-4 py-2 rounded-full font-bold text-white text-sm bg-emerald-600">
                                APPROVED
                              </span>
                            ) : v.submission?.status === 'REJECTED' || v.certificate_status === "REJECT" ? (
                              <span className="px-4 py-2 rounded-full font-bold text-white text-sm bg-red-500">
                                REJECTED
                              </span>
                            ) : (
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleIndividualAction(v.id, "APPROVE")}
                                  disabled={updating}
                                  className={`${
                                    updating
                                      ? "bg-gray-400 cursor-not-allowed"
                                      : "bg-emerald-600 hover:bg-emerald-700"
                                  } text-white px-4 py-1 rounded-full font-medium text-sm transition-colors cursor-pointer`}
                                >
                                  {updating ? "..." : "APPROVE"}
                                </button>
                                <button
                                  onClick={() => handleIndividualAction(v.id, "REJECT")}
                                  disabled={updating}
                                  className={`${
                                    updating
                                      ? "bg-gray-400 cursor-not-allowed"
                                      : "bg-red-500 hover:bg-red-600"
                                  } text-white px-4 py-1 rounded-full font-medium text-sm transition-colors cursor-pointer`}
                                >
                                  {updating ? "..." : "REJECT"}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>

                        {expandedRows.includes(v.id) && (
                          <tr>
                            <td colSpan="5" className="px-4 py-4 border border-gray-400 bg-gray-50">
                              <div className="text-left space-y-3">
                                <h4 className="font-bold text-lg text-emerald-800 mb-3">Task Submissions:</h4>

                                {v.submission ? (
                                  <div className="space-y-3">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-emerald-800">Task 1:</span>
                                        {v.submission.task_one && v.submission.task_one.trim() ? (
                                          <button
                                            onClick={() => handleFileClick(v, 1)}
                                            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded transition-colors cursor-pointer"
                                          >
                                            {getFileIcon(getFileType(v.submission.task_one))}
                                            <span className="underline text-sm">{getFileNameFromUrl(v.submission.task_one)}</span>
                                          </button>
                                        ) : (
                                          <span className="text-gray-400 italic text-sm">Not submitted</span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-emerald-800">Task 2:</span>
                                        {v.submission.task_two && v.submission.task_two.trim() ? (
                                          <button
                                            onClick={() => handleFileClick(v, 2)}
                                            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded transition-colors cursor-pointer"
                                          >
                                            {getFileIcon(getFileType(v.submission.task_two))}
                                            <span className="underline text-sm">{getFileNameFromUrl(v.submission.task_two)}</span>
                                          </button>
                                        ) : (
                                          <span className="text-gray-400 italic text-sm">Not submitted</span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-emerald-800">Task 3:</span>
                                        {v.submission.task_three && v.submission.task_three.trim() ? (
                                          <button
                                            onClick={() => handleFileClick(v, 3)}
                                            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded transition-colors cursor-pointer"
                                          >
                                            {getFileIcon(getFileType(v.submission.task_three))}
                                            <span className="underline text-sm">{getFileNameFromUrl(v.submission.task_three)}</span>
                                          </button>
                                        ) : (
                                          <span className="text-gray-400 italic text-sm">Not submitted</span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="pt-3 border-t border-gray-300">
                                      <span className="font-semibold">Status: </span>
                                      <span className={`${
                                        v.submission?.status === 'APPROVED'
                                          ? 'text-emerald-600'
                                          : v.submission?.status === 'REJECTED'
                                          ? 'text-red-600'
                                          : 'text-orange-600'
                                      } font-medium`}>
                                        {v.submission?.status || 'PENDING'}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-gray-500 italic">No submissions yet</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        No volunteers found for this event
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal for Bulk Actions */}
      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        action={individualAction}
        count={selectedVolunteers.length}
      />

      {/* Confirmation Modal for Individual Actions */}
      <ConfirmationModal
        isOpen={individualModalOpen}
        onClose={() => setIndividualModalOpen(false)}
        onConfirm={handleIndividualConfirm}
        action={individualAction}
        count={1}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        action={successAction}
        count={successCount}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={filePreviewOpen}
        onClose={() => setFilePreviewOpen(false)}
        files={previewFiles}
        currentIndex={currentFileIndex}
        setCurrentIndex={setCurrentFileIndex}
      />
    </div>
  );
}

export default FirstEventPage;