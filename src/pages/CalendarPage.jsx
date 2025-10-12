import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import supabase from "../config/supabaseClient";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [highlightedDate, setHighlightedDate] = useState(null); // New state for highlighting
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [multipleEvents, setMultipleEvents] = useState([]);
  const [todayDate, setTodayDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
    "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER",
  ];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDay; i++) daysArray.push(null);
  for (let i = 1; i <= daysInMonth; i++) daysArray.push(i);

  // Get Philippine time
  const getPhilippineDate = () => {
    const now = new Date();
    const philippineTime = new Date(now.toLocaleString("en-US", {
      timeZone: "Asia/Manila"
    }));
    return philippineTime;
  };

  // Initialize today's date in Philippine time
  useEffect(() => {
    const phDate = getPhilippineDate();
    setTodayDate({
      year: phDate.getFullYear(),
      month: phDate.getMonth(),
      day: phDate.getDate()
    });
  }, []);

  // Auto-select today's date when page loads or when switching to current month
  useEffect(() => {
    if (todayDate && year === todayDate.year && month === todayDate.month) {
      // Only auto-select if no date is currently selected
      if (!selectedDate && !highlightedDate) {
        handleDateClick(todayDate.day);
      }
    }
  }, [todayDate, year, month, events, selectedDate, highlightedDate]);

  // Fetch events from Event_Information table
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const adminData = JSON.parse(localStorage.getItem("admin"));
        if (!adminData) {
          console.error("Admin data not found");
          return;
        }

        const ngoCode = adminData.NGO_Information?.ngo_code;
        if (!ngoCode) {
          console.error("NGO code not found");
          return;
        }

        const { data, error } = await supabase
          .from("Event_Information")
          .select(`
            event_id, 
            event_title, 
            date, 
            time_start, 
            time_end, 
            event_objectives, 
            volunteer_joined, 
            location, 
            description, 
            volunteers_limit, 
            status,
            call_time,
            what_expect,
            volunteer_guidelines,
            volunteer_opportunities,
            event_image
          `)
          .eq("ngo_id", ngoCode);

        if (error) {
          console.error("Error fetching events:", error);
          return;
        }

        // Group events by date key
        const eventsGrouped = {};
        data.forEach(event => {
          const eventDate = new Date(event.date);
          const eventYear = eventDate.getFullYear();
          const eventMonth = eventDate.getMonth();
          const eventDay = eventDate.getDate();

          const key = `${eventYear}-${eventMonth}-${eventDay}`;
          
          if (!eventsGrouped[key]) {
            eventsGrouped[key] = [];
          }

          eventsGrouped[key].push({
            id: event.event_id,
            name: event.event_title,
            description: event.description || event.event_title,
            time: `${formatTime(event.time_start)} - ${formatTime(event.time_end)}`,
            duration: calculateDuration(event.time_start, event.time_end),
            location: event.location,
            objectives: event.event_objectives ? event.event_objectives.split("-").filter(obj => obj.trim()) : [],
            volunteers: event.volunteer_joined || 0,
            volunteersLimit: event.volunteers_limit || 0,
            status: event.status,
            callTime: event.call_time ? formatTime(event.call_time) : null,
            whatExpected: event.what_expect || '',
            whatExpectedItems: event.what_expect ? event.what_expect.split("-").filter(item => item.trim()) : [],
            guidelines: event.volunteer_guidelines || '',
            guidelinesItems: event.volunteer_guidelines ? event.volunteer_guidelines.split("-").filter(item => item.trim()) : [],
            opportunities: event.volunteer_opportunities ? event.volunteer_opportunities.split("-").filter(opp => opp.trim()) : [],
            date: event.date,
            image: event.event_image
          });
        });

        setEvents(eventsGrouped);
      } catch (error) {
        console.error("Error in fetchEvents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Reset highlighted date when month changes, but keep today selected if it's in the current month
  useEffect(() => {
    if (todayDate && year === todayDate.year && month === todayDate.month) {
      // Keep today highlighted when navigating to current month
      setHighlightedDate(todayDate.day);
      setSelectedDate(todayDate.day);
      // Auto-select today's events
      const dayEvents = getEventsForDay(todayDate.day);
      if (dayEvents.length === 1) {
        setSelectedEvent({ day: todayDate.day, ...dayEvents[0] });
      } else if (dayEvents.length > 1) {
        setSelectedEvent({ day: todayDate.day, ...dayEvents[0] });
      } else {
        setSelectedEvent({
          day: todayDate.day,
          name: "No Events Scheduled",
          description: "There are no events scheduled for this date.",
          time: "",
          duration: "",
          location: "",
          objectives: [],
          volunteers: 0,
          volunteersLimit: 0,
          callTime: null,
          whatExpected: "",
          whatExpectedItems: [],
          guidelines: "",
          guidelinesItems: [],
          opportunities: [],
          image: null
        });
      }
    } else {
      // Reset when not in current month
      setHighlightedDate(null);
      setSelectedDate(null);
      setSelectedEvent(null);
    }
  }, [currentDate, todayDate]);

  // Helper functions
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const date = new Date(0, 0, 0, hours, minutes);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "";
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} hours`;
    return `${hours} hours ${minutes} minutes`;
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleAlert = (msg) => alert(`Placeholder: ${msg}`);

  // Get events for a specific day
  const getEventsForDay = (day) => {
    const key = `${year}-${month}-${day}`;
    return events[key] || [];
  };

  // Enhanced click handler for date highlighting
  const handleDateClick = (day) => {
    if (!day) return;
    
    setHighlightedDate(day);
    setSelectedDate(day);
    
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length === 1) {
      setSelectedEvent({ day, ...dayEvents[0] });
    } else if (dayEvents.length > 1) {
      // If multiple events, show the first one by default
      setSelectedEvent({ day, ...dayEvents[0] });
    } else {
      // No events for this day, but still show the date selection
      setSelectedEvent({
        day,
        name: "No Events Scheduled",
        description: "There are no events scheduled for this date.",
        time: "",
        duration: "",
        location: "",
        objectives: [],
        volunteers: 0,
        volunteersLimit: 0,
        callTime: null,
        whatExpected: "",
        whatExpectedItems: [],
        guidelines: "",
        guidelinesItems: [],
        opportunities: [],
        image: null
      });
    }
  };

  const handleEventClick = (day, event) => {
    setSelectedDate(day);
    setHighlightedDate(day); // Also highlight when clicking on events
    setSelectedEvent({ day, ...event });
    setShowEventSelector(false);
  };

  const handleEventSelect = (event) => {
    setSelectedEvent({ day: selectedDate, ...event });
    setShowEventSelector(false);
  };

  // Check if a day has events matching the search query
  const getMatchingEvents = (day) => {
    const dayEvents = getEventsForDay(day);
    if (!searchQuery) return dayEvents;
    
    const query = searchQuery.toLowerCase();
    return dayEvents.filter(event =>
      event.name.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query)
    );
  };

  // Check if a day is today
  const isToday = (day) => {
    return todayDate && 
           year === todayDate.year && 
           month === todayDate.month && 
           day === todayDate.day;
  };

  // Function to determine cell styling based on highlight, today, and event status
  const getDayCellClasses = (day) => {
    if (!day) return "bg-white rounded-md border-[6px] border-emerald-800 p-2 h-24";
    
    const isHighlighted = highlightedDate === day;
    const isTodayCell = isToday(day);
    
    let baseClasses = "rounded-md border-[6px] p-2 h-24 cursor-pointer transition-all duration-200";
    
    if (isHighlighted && isTodayCell) {
      // Today and highlighted - special styling
      baseClasses += " bg-emerald-200 border-emerald-600 shadow-lg transform scale-105 ring-2 ring-emerald-400";
    } else if (isHighlighted) {
      // Highlighted but not today
      baseClasses += " bg-white border-emerald-600 shadow-lg transform scale-105";
    } else if (isTodayCell) {
      // Today but not highlighted - light emerald background
      baseClasses += " bg-emerald-100 border-emerald-500 shadow-md";
    } else {
      // Regular day
      baseClasses += " bg-white border-emerald-800 hover:bg-gray-50";
    }
    
    return baseClasses;
  };

  if (loading) {
    return (
      <div
        className="flex min-h-screen bg-no-repeat bg-center"
        style={{
          backgroundImage: `url(${CentroAdminBg})`,
          backgroundSize: "100% 100%",
        }}
      >
        <Sidebar handleAlert={handleAlert} />
        <main className="flex-1 ml-64 p-6 flex items-center justify-center">
          <div className="text-2xl text-emerald-900 font-semibold">Loading calendar...</div>
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
      <Sidebar handleAlert={handleAlert} />

      <main className="flex-1 ml-64 p-6 overflow-auto space-y-4">
        {/* Header */}
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-5xl font-serif font-bold text-gray-800">Calendar</h1>
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="Search Event"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-emerald-900 bg-emerald-100 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 absolute right-3 top-2.5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <section>
          <div className="bg-emerald-900 rounded-lg p-4">
            <div className="flex items-center justify-between text-white mb-4">
              <button onClick={prevMonth} className="sidebar-btn p-2 hover:bg-gray-500 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-4xl font-extrabold tracking-wide text-yellow-400">{monthNames[month]} {year}</h2>
              <button onClick={nextMonth} className="sidebar-btn p-2 hover:bg-gray-500 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-3 text-center text-xl text-white font-semibold mb-3">
              <div>Sunday</div>
              <div>Monday</div>
              <div>Tuesday</div>
              <div>Wednesday</div>
              <div>Thursday</div>
              <div>Friday</div>
              <div>Saturday</div>
            </div>

            <div className="grid grid-cols-7 gap-3 text-gray-800">
              {daysArray.map((day, idx) => {
                const matchingEvents = day ? getMatchingEvents(day) : []
                const isTodayCell = isToday(day);

                return (
                  <div
                    key={idx}
                    className={getDayCellClasses(day)}
                    onClick={() => handleDateClick(day)}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-bold ${
                          highlightedDate === day 
                            ? 'text-emerald-800' 
                            : isTodayCell 
                              ? 'text-emerald-700 font-extrabold' 
                              : ''
                        }`}>
                          {day}
                          {isTodayCell && (
                            <span className="ml-2 text-sm bg-emerald-600 text-white px-1 rounded">
                              Today
                            </span>
                          )}
                        </div>
                        {matchingEvents.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {matchingEvents.slice(0, 2).map((event, eventIdx) => (
                              <span
                                key={eventIdx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(day, event);
                                }}
                                className={`block text-xs px-2 py-0.5 rounded cursor-pointer transition-colors w-full truncate  ${
                                  highlightedDate === day 
                                    ? 'bg-emerald-700 text-white font-bold hover:bg-emerald-800' 
                                    : isTodayCell
                                      ? 'bg-emerald-600 text-white font-semibold hover:bg-emerald-700'
                                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                                title={event.name}
                              >
                                {event.name}
                              </span>
                            ))}
                            {matchingEvents.length > 2 && (
                              <div className={`text-xs text-center font-semibold ${
                                highlightedDate === day 
                                  ? 'text-emerald-800' 
                                  : isTodayCell
                                    ? 'text-emerald-700'
                                    : 'text-gray-600'
                              }`}>
                                +{matchingEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Event Details */}
        <section className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          {selectedEvent ? (
            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                {/* Date and Event Title - Now at the top */}
                <div className="mb-6">
                  <h3 className="text-3xl font-extrabold text-emerald-800 mb-2 text-center">
                    {monthNames[month]} {selectedEvent.day}, {year} (
                    {new Date(year, month, selectedEvent.day).toLocaleDateString('en-US', { weekday: 'long' })}
                    {isToday(selectedEvent.day) && (
                      <span className="ml-2 text-lg bg-emerald-600 text-white px-2 py-1 rounded">
                        Today
                      </span>
                    )}
                    )
                  </h3>
                  <h4 className="text-3xl font-bold text-emerald-700 mb-2">{selectedEvent.name}</h4>
                  <p className="text-gray-800 text-lg mb-4">{selectedEvent.description}</p>

                </div>
                
                {selectedEvent.name !== "No Events Scheduled" && (
                  <div className="text-left">
                    <div className="flex gap-6">
                      {/* Event Image - Now larger and positioned below title */}
                      {selectedEvent.image && (
                        <div className="w-50 h-70 object-cover rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <img 
                            src={selectedEvent.image} 
                            alt={selectedEvent.name}
                            className="w-full h-full object-cover rounded-lg shadow-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center shadow-lg" style={{display: 'none'}}>
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Event Content */}
                      {(selectedEvent.time || selectedEvent.location) && (
                        <div className="flex-1">
                          <div className="space-y-2 text-md text-gray-700">
                            {selectedEvent.time && <p><span className="font-medium text-lg">Time:</span> {selectedEvent.time}</p>}
                            {selectedEvent.duration && <p><span className="font-medium text-lg">Duration:</span> {selectedEvent.duration}</p>}
                            {selectedEvent.location && <p><span className="font-medium text-lg">Location:</span> {selectedEvent.location}</p>}
                            {selectedEvent.callTime && (
                              <p><span className="font-medium text-lg">Call Time:</span> {selectedEvent.callTime}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedEvent.objectives.length > 0 && (
                      <div className="mt-6">
                        <p className="font-semibold text-xl text-gray-800 mb-2">Objectives:</p>
                        <ul className="list-disc pl-6 text-gray-700 leading-relaxed">
                          {selectedEvent.objectives.map((obj, idx) => (
                            <li key={idx}>{obj.trim()}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedEvent.opportunities.length > 0 && (
                      <div className="mt-6">
                        <p className="font-semibold text-xl text-gray-800 mb-2">Volunteer Opportunities:</p>
                        <ul className="list-disc pl-6 text-gray-700 leading-relaxed">
                          {selectedEvent.opportunities.map((opp, idx) => (
                            <li key={idx}>{opp.trim()}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(selectedEvent.whatExpected || selectedEvent.whatExpectedItems?.length > 0) && (
                      <div className="mt-6">
                        <p className="font-semibold text-xl text-gray-800 mb-2">What to Expect:</p>
                        {selectedEvent.whatExpectedItems?.length > 0 ? (
                          <ul className="list-disc pl-6 text-gray-700 leading-relaxed">
                            {selectedEvent.whatExpectedItems.map((item, idx) => (
                              <li key={idx}>{item.trim()}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-700 leading-relaxed">{selectedEvent.whatExpected}</p>
                        )}
                      </div>
                    )}

                    {(selectedEvent.guidelines || selectedEvent.guidelinesItems?.length > 0) && (
                      <div className="mt-6">
                        <p className="font-semibold text-xl text-gray-800 mb-2">Volunteer Guidelines:</p>
                        {selectedEvent.guidelinesItems?.length > 0 ? (
                          <ul className="list-disc pl-6 text-gray-700 leading-relaxed">
                            {selectedEvent.guidelinesItems.map((item, idx) => (
                              <li key={idx}>{item.trim()}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-700 leading-relaxed">{selectedEvent.guidelines}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedEvent.name !== "No Events Scheduled" && (
                <div className="w-64 bg-emerald-700 text-white rounded-xl p-14 text-center">
                  <p className="text-xl font-semibold">Interested Volunteers</p>
                  <p className="mt-2 text-6xl font-extrabold text-emerald-200">{selectedEvent.volunteers}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-xl">
              Click on a date to view details
            </div>
          )}
        </section>
      </main>
    </div>
  );
}