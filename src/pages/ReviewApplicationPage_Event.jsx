import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import supabase from "../config/supabaseClient";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import Sidebar from "../components/Sidebar";

export default function ReviewApplicationEventPage() {
  const [pendingApplications, setPendingApplications] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showCentroConfirm, setShowCentroConfirm] = useState(false);
  
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      const adminData = JSON.parse(localStorage.getItem("admin"));
      if (adminData) {
        const ngoCode = adminData.NGO_Information.ngo_code;

        const { data, error } = await supabase
          .from("Event_Information")
          .select("event_id, event_title")
          .eq("ngo_id", ngoCode)
          .neq("status", "COMPLETED");

        if (error) {
          console.error("Error fetching events:", error);
        } else {
          setEvents(data);
          if (data.length > 0) {
            setSelectedEvent(data[0].event_id);
            fetchEventDetails(data[0].event_id);
            fetchEventApplications(data[0].event_id);
          }
        }
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    if (showCentroConfirm) {
      document.body.style.overflow = "hidden";

      const handleEscKey = (event) => {
        if (event.key === "Escape") {
          handleCloseModal();
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
  }, [showCentroConfirm]);

  const fetchEventApplications = async (eventId) => {
    const { data, error } = await supabase
      .from("Event_User")
      .select(
        "user_id, event_id, status, days_available, time_availability, busy_hours"
      )
      .eq("event_id", eventId)
      .eq("status", "PENDING");

    if (error) {
      console.error("Error fetching applications:", error);
      return;
    }

    const volunteerApplications = await Promise.all(
      data.map(async (app) => {
        const { data: volunteerData, error: userError } = await supabase
          .from("LoginInformation")
          .select(
            "user_id, firstname, lastname, email, contact_number, profile_picture, preferred_volunteering"
          )
          .eq("user_id", app.user_id)
          .single();

        if (userError) {
          console.error("Error fetching volunteer info:", userError);
          return null;
        }

        return {
          ...volunteerData,
          application_id: app.user_id,
          event_id: app.event_id,
          days_available: app.days_available,
          time_availability: app.time_availability,
          busy_hours: app.busy_hours,
        };
      })
    );

    const filteredApplications = volunteerApplications.filter(
      (app) => app !== null
    );
    setPendingApplications(filteredApplications);
  };

  const fetchEventDetails = async (eventId) => {
    const { data, error } = await supabase
      .from("Event_Information")
      .select(
        "event_id, event_title, date, time_start, time_end, event_objectives, volunteer_joined, created_at, event_image, status, location, description, volunteers_limit"
      )
      .eq("event_id", eventId)
      .single();

    if (error) {
      console.error("Error fetching event details:", error);
      return;
    }

    setSelectedEventDetails(data);
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date(0, 0, 0, hours, minutes);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatObjectives = (objectivesString) => {
    if (!objectivesString) return null;
    const objectives = objectivesString.split("-");
    return objectives.map((objective, index) => (
      <li key={index} className="text-emerald-900">
        {objective.trim()}
      </li>
    ));
  };

  const handleSelectEvent = (eventId) => {
    setSelectedEvent(eventId);
    fetchEventApplications(eventId);
    fetchEventDetails(eventId);
    setSelectedVolunteer(null);
  };

  const handleReviewAiScheduling = async () => {
    if (!selectedVolunteer || !selectedEventDetails) return;

    setIsNavigating(true);

    try {
      navigate("/review-ai-scheduling", {
        state: {
          volunteer: selectedVolunteer,
          eventDetails: selectedEventDetails,
        },
      });
    } catch (error) {
      console.error("Error navigating to AI scheduling:", error);
      setIsNavigating(false);
    }
  };

  const handleCloseModal = () => {
    setShowCentroConfirm(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const isActive = (path) => location.pathname === path;

  const getSortedApplications = (applications) => {
    const sorted = [...applications].sort((a, b) => {
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

  const sortedApplications = getSortedApplications(pendingApplications);

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
    setShowSortDropdown(false);
  };

  return (
    <>
      <div
        className="flex min-h-screen bg-no-repeat bg-center bg-cover"
        style={{
          backgroundImage: `url(${CentroAdminBg})`,
          backgroundSize: "100% 100%",
        }}
      >
        <Sidebar />

        <main className="flex-1 ml-64 p-4 overflow-y-auto">
          <div id="review_application" className="relative z-10 space-y-4">
            <div className="flex gap-4">
              <Link to="/review-application" className="flex-1">
                <button
                  className={`w-full text-xl text-center py-3 rounded-lg font-bold border-2 transition-colors cursor-pointer ${
                    isActive("/review-application")
                      ? "bg-emerald-900 text-white border-emerald-500"
                      : "bg-gray-200 hover:bg-gray-300 border-gray-900 text-gray-900"
                  }`}
                >
                  Organization Applications
                </button>
              </Link>
              <Link to="/review-application-event" className="flex-1">
                <button
                  className={`w-full text-xl text-center py-3 rounded-lg font-bold border-2 transition-colors cursor-pointer ${
                    isActive("/review-application-event")
                      ? "bg-emerald-900 text-white border-emerald-500"
                      : "bg-gray-200 hover:bg-gray-300 border-gray-900 text-gray-900"
                  }`}
                >
                  Event Applications
                </button>
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <label className="text-emerald-900 font-semibold text-lg">
                  Select Event:
                </label>
                <select
                  onChange={(e) => handleSelectEvent(e.target.value)}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-900 font-medium cursor-pointer border-2 border-emerald-600 hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md min-w-[300px]"
                  value={selectedEvent || ""}
                >
                  <option value="" disabled className="text-gray-500">
                    -- Choose an Event --
                  </option>
                  {events.map((event) => (
                    <option
                      key={event.event_id}
                      value={event.event_id}
                      className="py-2 bg-white hover:bg-emerald-50"
                    >
                      {event.event_title} (ID: {event.event_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg">
                <span className="text-emerald-900 text-lg font-medium">
                  Pending Applications:
                </span>
                <span className="bg-emerald-600 text-white font-bold text-lg px-3 py-1 rounded-full shadow-sm">
                  {pendingApplications.length}
                </span>
              </div>
            </div>

            {selectedEventDetails && (
              <div className="mt-6 bg-white rounded-lg shadow p-6">
                <h3 className="text-2xl text-emerald-900 font-semibold mb-4">
                  Event Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-lg text-emerald-900 mb-2">
                      <strong>Event Title: </strong>
                      {selectedEventDetails.event_title}
                    </p>
                    <p className="text-lg text-emerald-900 mb-2">
                      <strong>Date: </strong>
                      {new Date(selectedEventDetails.date).toLocaleDateString()}
                    </p>
                    <p className="text-lg text-emerald-900 mb-2">
                      <strong>Time: </strong>
                      {formatTime(selectedEventDetails.time_start)} -{" "}
                      {formatTime(selectedEventDetails.time_end)}
                    </p>
                    <p className="text-lg text-emerald-900 mb-2">
                      <strong>Location: </strong>
                      {selectedEventDetails.location}
                    </p>
                    <p className="text-lg text-emerald-900 mb-2">
                      <strong>Volunteer Limit: </strong>
                      {selectedEventDetails.volunteers_limit}
                    </p>
                  </div>
                  <div>
                    <p className="text-lg text-emerald-900 mb-2">
                      <strong>Objectives: </strong>
                    </p>
                    <ul className="list-disc pl-5 mb-4">
                      {formatObjectives(selectedEventDetails.event_objectives)}
                    </ul>
                    <p className="text-lg text-emerald-900">
                      <strong>Description: </strong>
                      {selectedEventDetails.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {pendingApplications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {/* Applicant List - 2 columns out of 3 */}
                <div className="md:col-span-2 bg-white rounded-lg shadow overflow-hidden w-full">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 w-full">
                    <h3 className="text-lg font-semibold text-emerald-900">
                      Applicant List
                    </h3>
                    <div className="relative">
                      <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className="flex items-center gap-2 bg-emerald-900 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-800 transition text-sm"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                          />
                        </svg>
                        Sort
                      </button>

                      {showSortDropdown && (
                        <div className="absolute top-full mt-2 right-0 bg-white border-2 border-emerald-900 rounded-lg shadow-lg z-50 min-w-[180px]">
                          <div className="py-2">
                            <button
                              onClick={() => handleSortChange("id")}
                              className={`w-full text-left px-4 py-2 hover:bg-emerald-50 flex items-center justify-between text-sm ${
                                sortBy === "id" ? "bg-emerald-100 font-bold text-emerald-900" : "text-gray-700"
                              }`}
                            >
                              <span>User ID</span>
                              {sortBy === "id" && (
                                <span className="text-emerald-900">
                                  {sortOrder === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => handleSortChange("name")}
                              className={`w-full text-left px-4 py-2 hover:bg-emerald-50 flex items-center justify-between text-sm ${
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

                  <div className="bg-emerald-700 text-white font-semibold text-base grid grid-cols-3 px-4 py-3">
                    <div>User ID</div>
                    <div>Name</div>
                    <div>Email Address</div>
                  </div>

                  <div className="overflow-y-auto" style={{ maxHeight: "800px" }}>
                    <div className="text-emerald-900">
                      {sortedApplications.map((volunteer) => (
                        <div
                          key={volunteer.user_id}
                          className={`grid grid-cols-3 py-3 px-4 border-b cursor-pointer transition hover:bg-emerald-50 ${
                            selectedVolunteer && selectedVolunteer.user_id === volunteer.user_id
                              ? "bg-emerald-100 font-semibold"
                              : ""
                          }`}
                          onClick={() => setSelectedVolunteer(volunteer)}
                        >
                          <div className="text-sm">{volunteer.user_id}</div>
                          <div className="text-sm">{volunteer.firstname} {volunteer.lastname}</div>
                          <div className="text-sm truncate" title={volunteer.email}>{volunteer.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Profile Card - 1 column out of 3 */}
                <div className="col-span-1 bg-white rounded-lg shadow p-4 flex flex-col w-full" style={{ height: "900px" }}>
                  {selectedVolunteer ? (
                    <>
                      <div className="overflow-y-auto flex-1 pr-2">
                        <img
                          src={
                            selectedVolunteer.profile_picture ||
                            "https://via.placeholder.com/150"
                          }
                          alt={selectedVolunteer.firstname}
                          className="w-28 h-28 mx-auto mb-4 object-cover border-4 border-white shadow rounded-full"
                        />
                        <h3 className="text-xl text-emerald-900 font-bold text-center mb-6">
                          {selectedVolunteer.firstname} {selectedVolunteer.lastname}
                        </h3>

                        <p className="text-sm text-emerald-900 mb-4">
                          <span className="font-bold text-base">Email Address</span>
                          <br />
                          <span className="break-all">{selectedVolunteer.email}</span>
                        </p>

                        <p className="text-sm text-emerald-900 mb-4">
                          <span className="font-bold text-base">Contact Number</span>
                          <br />
                          {selectedVolunteer.contact_number}
                        </p>

                        <p className="text-sm text-emerald-900 mb-4">
                          <span className="font-bold text-base">User ID</span>
                          <br />
                          {selectedVolunteer.user_id}
                        </p>

                        {selectedVolunteer.days_available && (
                          <p className="text-sm text-emerald-900 mb-4">
                            <span className="font-bold text-base">Days Available</span>
                            <br />
                            {selectedVolunteer.days_available}
                          </p>
                        )}

                        {selectedVolunteer.time_availability && (
                          <p className="text-sm text-emerald-900 mb-4">
                            <span className="font-bold text-base">Time of Availability</span>
                            <br />
                            {selectedVolunteer.time_availability}
                          </p>
                        )}

                        {selectedVolunteer.busy_hours && (
                          <p className="text-sm text-emerald-900 mb-4">
                            <span className="font-bold text-base text-red-600">Busy Hours</span>
                            <br />
                            <span className="font-light text-sm text-red-600">
                              {selectedVolunteer.busy_hours}
                            </span>
                          </p>
                        )}

                        {selectedVolunteer.preferred_volunteering && (
                          <>
                            <p className="mt-3 font-bold text-base mb-2 text-emerald-900">
                              Preferred Type of Volunteering
                            </p>
                            <ul className="list-disc pl-5 text-sm text-emerald-900">
                              {selectedVolunteer.preferred_volunteering
                                .split(",")
                                .map((type, idx) => (
                                  <li key={idx} className="mb-1">
                                    {type.trim()}
                                  </li>
                                ))}
                            </ul>
                          </>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 flex-shrink-0">
                        <button
                          onClick={() => setShowCentroConfirm(true)}
                          disabled={isNavigating}
                          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 cursor-pointer disabled:cursor-not-allowed transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center text-sm"
                        >
                          Review CENTROsuggests Deployment
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 text-center mt-10">
                      Select a volunteer to review
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8">
                <p className="text-gray-500 text-center text-xl">
                  {events.length === 0
                    ? "No events found for your organization"
                    : "No pending applications for the selected event"}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {showCentroConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={handleBackdropClick}
        >
          <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"></div>

          <div className="relative bg-white rounded-xl shadow-2xl p-8 w-96 max-w-md mx-4 transform transition-all scale-100 border-2 border-orange-400 z-50">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  ></path>
                </svg>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Review AI Deployment
              </h2>
              <p className="text-gray-600 mb-8 text-lg mt-4">
                Proceed to review CENTROsuggests AI deployment recommendations
                for <br />{" "}
                <strong>
                  {selectedVolunteer?.firstname} {selectedVolunteer?.lastname}
                </strong>
                ?
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={handleReviewAiScheduling}
                  disabled={isNavigating}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg text-lg font-medium border-2 border-orange-500 hover:bg-orange-600 hover:border-orange-600 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isNavigating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    "Yes, Proceed"
                  )}
                </button>
                <button
                  onClick={handleCloseModal}
                  disabled={isNavigating}
                  className="bg-white text-gray-800 px-6 py-3 rounded-lg text-lg font-medium border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}