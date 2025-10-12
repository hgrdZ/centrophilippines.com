import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import supabase from "../config/supabaseClient";

function EventPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [activeButton, setActiveButton] = useState("Event Details");
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventImage, setEventImage] = useState(null);
  const [volunteerStats, setVolunteerStats] = useState({
    totalJoined: 0,
    totalLimit: 0,
    submissions: 0,
    ongoingCount: 0,
    pendingCount: 0
  });

  const eventColors = ["bg-emerald-800/90"];

  const handleButtonClick = (button) => setActiveButton(button);  

  useEffect(() => {
    if (eventId) {
      fetchEventData();
      fetchVolunteerStats();
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

  const fetchVolunteerStats = async () => {
    try {
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

      const ongoingVolunteers = eventUsers.filter(v => v.status === "ONGOING");
      const pendingVolunteers = eventUsers.filter(v => v.status === "PENDING");
      const ongoingCount = ongoingVolunteers.length;
      const pendingCount = pendingVolunteers.length;
      const totalJoined = eventUsers.length;

      const userIds = eventUsers.map(v => v.user_id);
      const { data: taskSubmissions, error: submissionsError } = await supabase
        .from("Task_Submissions")
        .select("user_id, task_one, task_two, task_three, status")
        .eq("event_id", eventId)
        .in("user_id", userIds);

      if (submissionsError) {
        console.error("Error fetching task submissions:", submissionsError);
      }

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

  if (loading) return (
    <div className="flex min-h-screen bg-no-repeat bg-center bg-cover" style={{backgroundImage: `url(${CentroAdminBg})`, backgroundSize: "100% 100%"}}>
      <Sidebar handleButtonClick={handleButtonClick} activeButton={activeButton} />
      <main className="flex-1 ml-64 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-900 mx-auto"></div>
          <p className="mt-4 text-emerald-900 font-semibold text-lg">Loading event data...</p>
        </div>
      </main>
    </div>
  );

  if (error || !eventData) return (
    <div className="flex min-h-screen bg-no-repeat bg-center bg-cover" style={{backgroundImage: `url(${CentroAdminBg})`, backgroundSize: "100% 100%"}}>
      <Sidebar handleButtonClick={handleButtonClick} activeButton={activeButton} />
      <main className="flex-1 ml-64 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow border-2 border-emerald-800 overflow-hidden p-8 text-center max-w-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-3xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 text-lg mb-6">{error || "Event not found"}</p>
          <Link to="/manage-reports" className="inline-block bg-emerald-900 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors">← Back to Events</Link>
        </div>
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-no-repeat bg-center bg-cover" style={{backgroundImage: `url(${CentroAdminBg})`, backgroundSize: "100% 100%"}}>
      <Sidebar handleButtonClick={handleButtonClick} activeButton={activeButton} />
      <main className="flex-1 ml-64 p-6 overflow-y-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          
          <div className={`${getHeaderColor(eventData.event_id)} text-center rounded-t-full py-3 font-bold text-3xl shadow-md text-emerald-900 border-emerald-800 cursor-pointer hover:opacity-90 transition-opacity`} title="Click to edit Event Title">
            <span className="text-white font-extrabold">{eventData.event_id}</span>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Event Details (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-4xl font-bold text-emerald-800 leading-snug hover:text-emerald-700 transition-colors" title="Click to edit Event Name">
                {eventData.event_title}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg overflow-hidden shadow-lg cursor-pointer hover:opacity-90 transition-all" title="Click to edit Event Image">
                  {eventImage ? (
                    <img src={eventImage} alt="Event" className="w-full h-64 object-cover rounded-lg" onError={() => setEventImage(null)} />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 flex flex-col items-center justify-center text-emerald-900 rounded-lg">
                      <div className="text-4xl mb-2">📸</div>
                      <p className="font-semibold">Add Event Image</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-gray-700 text-base">
                  <div className="flex items-start hover:text-emerald-800 transition-colors">
                    <strong className="min-w-fit">Date:</strong> 
                    <span className="ml-2">{formatDate(eventData.date)}</span>
                  </div>
                  <div className="flex items-start hover:text-emerald-800 transition-colors">
                    <strong className="min-w-fit">Time:</strong>
                    <span className="ml-2">
                      {formatTime(eventData.time_start)} – {formatTime(eventData.time_end)}
                      {eventData.time_start && eventData.time_end && (
                        <span className="text-gray-600 block mt-1">
                          ({calculateDuration(eventData.time_start, eventData.time_end)})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-start hover:text-emerald-800 transition-colors">
                    <strong className="min-w-fit">Location:</strong> 
                    <span className="ml-2">{eventData.location || "TBA"}</span>
                  </div>
                  {eventData.call_time && (
                    <div className="flex items-start">
                      <strong className="min-w-fit">Call Time:</strong> 
                      <span className="ml-2">{formatTime(eventData.call_time)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-xl text-emerald-900 hover:text-emerald-700 transition-colors mb-2">Event Objectives:</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-800 bg-emerald-50 p-4 rounded-lg">
                  {parseObjectives(eventData.event_objectives).map((objective, index) => (
                    <li key={index} className="leading-relaxed">{objective.trim()}</li>
                  ))}
                </ul>
              </div>

              {eventData.description && (
                <div>
                  <h3 className="font-semibold text-xl text-emerald-900 hover:text-emerald-700 transition-colors mb-2">Event Description:</h3>
                  <div className="text-gray-800 bg-blue-50 p-4 rounded-lg leading-relaxed">{eventData.description}</div>
                </div>
              )}

              {eventData.what_expect && (
                <div>
                  <h3 className="font-semibold text-xl text-emerald-900 hover:text-emerald-700 transition-colors mb-2">What to Expect:</h3>
                  {parseBulletPoints(eventData.what_expect).length > 0 ? (
                    <ul className="list-disc pl-6 space-y-2 text-gray-800 bg-yellow-50 p-4 rounded-lg">
                      {parseBulletPoints(eventData.what_expect).map((item, index) => (
                        <li key={index} className="leading-relaxed">{item.trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-800 bg-yellow-50 p-4 rounded-lg leading-relaxed">{eventData.what_expect}</div>
                  )}
                </div>
              )}

              {eventData.volunteer_guidelines && (
                <div>
                  <h3 className="font-semibold text-xl text-emerald-900 hover:text-emerald-700 transition-colors mb-2">Volunteer Guidelines:</h3>
                  {parseBulletPoints(eventData.volunteer_guidelines).length > 0 ? (
                    <ul className="list-disc pl-6 space-y-2 text-gray-800 bg-purple-50 p-4 rounded-lg">
                      {parseBulletPoints(eventData.volunteer_guidelines).map((item, index) => (
                        <li key={index} className="leading-relaxed">{item.trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-800 bg-purple-50 p-4 rounded-lg leading-relaxed">{eventData.volunteer_guidelines}</div>
                  )}
                </div>
              )}

              {eventData.volunteer_opportunities && (
                <div>
                  <h3 className="font-semibold text-xl text-emerald-900 hover:text-emerald-700 transition-colors mb-2">Volunteer Opportunities:</h3>
                  {parseBulletPoints(eventData.volunteer_opportunities).length > 0 ? (
                    <ul className="list-disc pl-6 space-y-2 text-gray-800 bg-green-50 p-4 rounded-lg">
                      {parseBulletPoints(eventData.volunteer_opportunities).map((item, index) => (
                        <li key={index} className="leading-relaxed">{item.trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-800 bg-green-50 p-4 rounded-lg leading-relaxed">{eventData.volunteer_opportunities}</div>
                  )}
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Link to={`/event/${eventData.event_id}/first`}>
                  <button className="bg-emerald-900 text-white font-semibold px-8 py-3 rounded-lg hover:bg-emerald-700 shadow-lg transition-colors cursor-pointer">Review Certifications</button>
                </Link>
              </div>
            </div>

            {/* Right Column - Stats & Actions (1/3 width) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="text-center">
                <div className={`px-6 py-2 rounded-full text-center font-bold ${
                  eventData.status === 'ONGOING' ? 'bg-emerald-500 text-white' : 
                  eventData.status === 'UPCOMING' ? 'bg-yellow-500 text-white' : 
                  'bg-gray-500 text-white'
                }`}>{eventData.status}</div>
              </div>

              <div className="bg-emerald-900 rounded-lg p-6 text-center shadow-lg transition-colors" title="Click to view submission details">
                <p className="text-xl font-semibold text-white mb-2">Complete Submissions</p>
                <p className="text-5xl font-bold text-yellow-400 mb-2">{volunteerStats.submissions}</p>
                <p className="text-base text-yellow-500 font-bold">out of {eventData.volunteers_limit || "unlimited"} volunteers</p>
                <Link to={`/folder/${eventId}`}>
                  <button className="bg-emerald-600 text-white font-semibold px-8 py-2 rounded-full mt-4 hover:bg-emerald-700 transition-colors cursor-pointer">Open Folder</button>
                </Link>
              </div>

              <div className="bg-emerald-900 rounded-lg p-6 text-center shadow-lg transition-colors" title="Click to view volunteer details">
                <p className="text-lg font-semibold text-white mb-2">Total Volunteers Joined</p>
                <p className="text-6xl font-bold text-yellow-400 mb-2">{volunteerStats.totalJoined}</p>
                <div className="text-base text-white space-y-1">
                  <p><span className="font-semibold text-yellow-500">{volunteerStats.ongoingCount}</span> Going</p>
                  <p><span className="font-semibold text-yellow-500">{volunteerStats.pendingCount}</span> Pending</p>
                  {eventData.volunteers_limit && <p className="mt-2 text-white font-semibold">Limit: {eventData.volunteers_limit}</p>}
                </div>
              </div>

              {eventData.created_at && (
                <div className="bg-emerald-900 rounded-lg p-4 text-center">
                  <p className="text-base text-yellow-400 font-bold">Event Created</p>
                  <p className="font-semibold text-white">{formatDate(eventData.created_at)}</p>
                </div>
              )}

              <div className="text-center pt-4">
                <Link to="/manage-reports">
                  <button className="bg-orange-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-yellow-500 shadow-lg transition-colors cursor-pointer w-full">Back to Events</button>
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