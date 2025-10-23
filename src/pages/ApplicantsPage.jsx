// src/pages/ApplicantsPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar"; 
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import supabase from "../config/supabaseClient";

function ApplicantsPage() {
  const { eventId } = useParams(); // <-- Get event ID from URL

  const [eventTitle, setEventTitle] = useState(""); // event title state
  const [applicants, setApplicants] = useState([]); // fetched applicants
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true" || false
  );

  // Fetch event title
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
    }
  };

  // Fetch applicants
  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("volunteers")
        .select("*")
        .eq("event_id", eventId);

      if (error) throw error;
      setApplicants(data || []);
    } catch (err) {
      console.error("Error fetching applicants:", err);
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchApplicants();
    }
  }, [eventId]);

  const renderBlankRow = () => (
    <tr>
      <td className="px-6 py-6 border border-gray-400 h-12">&nbsp;</td>
      <td className="px-6 py-6 border border-gray-400 h-12">&nbsp;</td>
      <td className="px-6 py-6 border border-gray-400 h-12">&nbsp;</td>
      <td className="px-6 py-6 border border-gray-400 h-12">&nbsp;</td>
      <td className="px-6 py-6 border border-gray-400 h-12">&nbsp;</td>
    </tr>
  );

  return (
    <div
      className="flex min-h-screen bg-no-repeat bg-center"
      style={{
        backgroundImage: `url(${CentroAdminBg})`,
        backgroundSize: "100% 100%",
      }}
    >
      {/* SIDEBAR */}
      <Sidebar onCollapseChange={setSidebarCollapsed} />
             
                   <main 
                     className="flex-1 p-4 overflow-y-auto transition-all duration-300"
                     style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}
                   >   
        <div className="bg-white rounded-lg shadow-lg max-w-full border">
          {/* Header (Event ID) */}
          <div
            className="bg-emerald-200 text-center rounded-t-lg py-2 font-bold text-2xl text-emerald-900 cursor-pointer"
            title="Click to edit event header"
          >
            {eventId}
          </div>

          {/* Body */}
          <div className="p-4">
            <h1
              className="text-center text-3xl font-bold text-emerald-900 mb-6 cursor-pointer"
              title="Click to edit event title"
            >
              {eventTitle}
            </h1>

            {/* Applicants Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border border-gray-400">
                <thead>
                  <tr className="bg-emerald-900 text-white text-lg font-bold">
                    <th className="px-6 py-3 border border-gray-400 text-center">Volunteer ID</th>
                    <th className="px-6 py-3 border border-gray-400 text-center">Name</th>
                    <th className="px-6 py-3 border border-gray-400 text-center">File Uploaded</th>
                    <th className="px-6 py-3 border border-gray-400 text-center">Status</th>
                    <th className="px-6 py-3 border border-gray-400 text-center">Date Modified</th>
                  </tr>
                </thead>
                <tbody className="text-center text-emerald-900 bg-white">
                  {loading
                    ? renderBlankRow()
                    : applicants.length === 0
                    ? renderBlankRow()
                    : applicants.map((applicant, index) => (
                        <tr
                          key={applicant.id || index}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 border border-gray-400 font-medium">
                            {applicant.volunteer_id || index + 1}
                          </td>
                          <td className="px-4 py-2 border border-gray-400 font-medium">
                            {applicant.name || applicant.full_name}
                          </td>
                          <td className="px-4 py-4 border border-gray-400 font-medium">
                            {applicant.file_uploaded ? (
                              <span
                                className="text-blue-600 hover:underline cursor-pointer"
                                onClick={async () => {
                                  try {
                                    const { data, error } = await supabase.storage
                                      .from("uploads") // your storage bucket name
                                      .getPublicUrl(applicant.file_uploaded);
                                    if (error) throw error;
                                    window.open(data.publicUrl, "_blank");
                                  } catch (err) {
                                    console.error("Error opening file:", err);
                                    alert("Could not open file.");
                                  }
                                }}
                              >
                                {applicant.file_uploaded.split("/").pop()} {/* show only filename */}
                              </span>
                            ) : (
                              "No File"
                            )}
                          </td>
                          <td className="px-4 py-2 border border-gray-400 font-medium">
                            {applicant.status || "N/A"}
                          </td>
                          <td className="px-4 py-2 border border-gray-400 font-medium">
                            {applicant.updated_at
                              ? new Date(applicant.updated_at).toLocaleDateString()
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Back Button */}
            <div className="flex justify-center space-x-24 mt-4">
              <Link to={`/event/${eventId}`}>
                <button className="bg-emerald-900 hover:bg-emerald-700 text-white font-bold px-8 py-2 rounded-full shadow-md cursor-pointer">
                  Back to Event
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ApplicantsPage;
