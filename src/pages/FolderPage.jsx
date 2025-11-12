// src/pages/FolderPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import Sidebar from "../components/Sidebar";
import supabase from "../config/supabaseClient";
import { FileText, Image as ImageIcon, File } from "lucide-react";


function FolderPage() {
  const { eventId } = useParams();
  const [activeButton, setActiveButton] = useState("Manage Reports");
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState("");
  const [activeTask, setActiveTask] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true" || false
  );
  
  const handleButtonClick = (button) => {
    setActiveButton(button);
  };

  useEffect(() => {
    if (eventId) {
      fetchEventData();
      fetchVolunteersData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const { data, error } = await supabase
        .from("Event_Information")
        .select("event_title")
        .eq("event_id", eventId)
        .single();

      if (error) throw error;
      if (data) setEventTitle(data.event_title);
    } catch (err) {
      console.error("Error fetching event data:", err);
    }
  };

  const fetchVolunteersData = async () => {
    try {
      setLoading(true);

      const { data: eventUsers, error: eventError } = await supabase
        .from("Event_User")
        .select("user_id, userEvent_id")
        .eq("event_id", eventId);

      if (eventError) throw eventError;
      if (!eventUsers || eventUsers.length === 0) {
        setVolunteers([]);
        setLoading(false);
        return;
      }

      const userIds = eventUsers.map((eu) => eu.user_id);

      const { data: users, error: usersError } = await supabase
        .from("LoginInformation")
        .select("user_id, firstname, lastname")
        .in("user_id", userIds);

      if (usersError) throw usersError;

      const { data: taskSubmissions, error: submissionsError } = await supabase
        .from("Task_Submissions")
        .select("user_id, task_one, task_two, task_three, status")
        .eq("event_id", eventId)
        .in("user_id", userIds);

      if (submissionsError) console.error("Error fetching task submissions:", submissionsError);

      const volunteersData = eventUsers.map((eu) => {
        const user = users?.find((u) => u.user_id === eu.user_id);
        const submission = taskSubmissions?.find((sub) => sub.user_id === eu.user_id);

        let filesUploaded = 0;
        if (submission) {
          if (submission.task_one?.trim()) filesUploaded++;
          if (submission.task_two?.trim()) filesUploaded++;
          if (submission.task_three?.trim()) filesUploaded++;
        }

        return {
          volunteer_id: eu.user_id,
          name: user ? `${user.firstname} ${user.lastname}` : "Unknown",
          files_uploaded: filesUploaded,
          status: submission?.status || "Pending",
          submission: submission || null,
          date_modified: new Date().toISOString().split("T")[0],
        };
      });

      const volunteersWithFiles = volunteersData.filter((v) => v.files_uploaded > 0);
      setVolunteers(volunteersWithFiles);
    } catch (err) {
      console.error("Error fetching volunteers data:", err);
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Different background colors per status
  const getStatusColor = (status) => {
    const normalized = status?.toLowerCase();
    if (normalized === "approved") return "bg-emerald-800 text-white";
    if (normalized === "rejected") return "bg-red-700 text-white";
    return "bg-orange-600 text-white"; // default = pending
  };

  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return <File className="w-4 h-4 text-gray-600" />;
    const extension = fileUrl.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension))
      return <ImageIcon className="w-4 h-4 text-blue-600" />;
    else if (extension === "pdf") return <FileText className="w-4 h-4 text-red-600" />;
    else if (["doc", "docx"].includes(extension))
      return <FileText className="w-4 h-4 text-blue-700" />;
    else return <File className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div
      className="flex min-h-screen bg-no-repeat bg-center"
      style={{
        backgroundImage: `url(${CentroAdminBg})`,
        backgroundSize: "100% 100%",
      }}
    >
      <Sidebar onCollapseChange={setSidebarCollapsed} />

<main className="flex-1 p-6 overflow-y-auto transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}
      >         <div className="bg-white rounded-lg shadow-lg flex-1 overflow-auto">
          <div className="bg-emerald-800 text-center rounded-t-lg py-3 font-bold text-3xl text-white">
            {eventId}
          </div>

          <div className="p-6">
            <h1 className="text-center text-3xl font-bold text-emerald-900 mb-6">
              {eventTitle || "Event Files"}
            </h1>

            {loading ? (
              <div className="flex items-center justify-center h-64 text-gray-500 text-lg">
                Loading files...
              </div>
            ) : volunteers.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500 text-lg">
                No uploaded files found for this event
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  Total Volunteers with Files:{" "}
                  <span className="font-semibold">{volunteers.length}</span>
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead>
                      <tr className="bg-emerald-900 text-white text-lg font-bold">
                        <th className="px-6 py-3 border border-gray-300 text-center">
                          Volunteer ID
                        </th>
                        <th className="px-6 py-3 border border-gray-300 text-center">Name</th>
                        <th className="px-6 py-3 border border-gray-300 text-center">
                          File Uploaded
                        </th>
                        <th className="px-6 py-3 border border-gray-300 text-center">
                          Status
                        </th>
                        <th className="px-6 py-3 border border-gray-300 text-center">
                          Date Modified
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-center text-emerald-900 bg-white">
                      {volunteers.map((volunteer) => (
                        <tr key={volunteer.volunteer_id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 border border-gray-300 font-medium">
                            {volunteer.volunteer_id}
                          </td>
                          <td className="px-4 py-3 border border-gray-300 font-medium">
                            {volunteer.name}
                          </td>
                          <td className="px-4 py-3 border border-gray-300">
                            <div className="flex justify-center gap-2">
                              {["task_one", "task_two", "task_three"].map((taskKey, idx) => {
                                const file = volunteer.submission?.[taskKey];
                                if (!file) return null;
                                return (
                                  <a
                                    key={idx}
                                    href={file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() =>
                                      setActiveTask(`${volunteer.volunteer_id}-${taskKey}`)
                                    }
                                    className={`flex items-center gap-1 px-3 py-1 border rounded-full text-sm transition-all duration-200 ${
                                      activeTask ===
                                      `${volunteer.volunteer_id}-${taskKey}`
                                        ? "bg-emerald-200 border-emerald-600 text-emerald-800 shadow-sm"
                                        : "text-emerald-700 border-gray-400 hover:bg-emerald-50 hover:border-emerald-400"
                                    }`}
                                  >
                                    {getFileIcon(file)}
                                    <span>Task {idx + 1}</span>
                                  </a>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 border border-gray-300">
                            <span
                              className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                                volunteer.status
                              )}`}
                            >
                              {volunteer.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 border border-gray-300 text-sm text-gray-600">
                            {volunteer.date_modified}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="mt-6 flex justify-center">
              <Link
                to={`/event/${eventId}`}
                className="bg-emerald-900 text-white px-6 py-2 rounded hover:bg-emerald-700 shadow transition-colors"
              >
                Back
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default FolderPage;
