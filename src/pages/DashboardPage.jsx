import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import supabase from "../config/supabaseClient";
import CreateAnnouncementIcon from "../images/create-announcement.svg";
import CreateEventIcon from "../images/create-event.svg";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const COLORS = {
  completion: ["#27ae60", "#bdc3c7"],
  participation: ["#2980b9", "#e74c3c"],
  growth: "#8e44ad",
  applications: "#f39c12",
  events: ["#27ae60", "#2980b9", "#f39c12", "#e74c3c"],
};

// Three Dots Menu Component
function ThreeDotsMenu({ onDownloadPDF, onDownloadWord }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg
          className="w-5 h-5 text-gray-600 cursor-pointer"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownloadPDF();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download as PDF
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownloadWord();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-t"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download as Word
          </button>
        </div>
      )}
    </div>
  );
}

// Enhanced Filter Modal Component
function FilterModal({ isOpen, onClose, onApplyFilters, events }) {
  const [dateRange, setDateRange] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [gender, setGender] = useState("all");
  const [status, setStatus] = useState("all");
  const [volunteerRange, setVolunteerRange] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");

  const handleApply = () => {
    onApplyFilters({ 
      dateRange, 
      selectedEvent, 
      gender, 
      status, 
      volunteerRange,
      customDateFrom,
      customDateTo 
    });
    onClose();
  };

  const handleReset = () => {
    setDateRange("all");
    setSelectedEvent("all");
    setGender("all");
    setStatus("all");
    setVolunteerRange("all");
    setCustomDateFrom("");
    setCustomDateTo("");
    onApplyFilters({ 
      dateRange: "all", 
      selectedEvent: "all", 
      gender: "all", 
      status: "all",
      volunteerRange: "all",
      customDateFrom: "",
      customDateTo: ""
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ backdropFilter: "blur(4px)" }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border-2 border-emerald-500 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-xl font-bold font-montserrat flex items-center gap-2">
            Filters
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-emerald-700 text-3xl font-bold w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Date Range Filter */}
          <div className="border-b pb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Time
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Time</option>
              <option value="1week">Last Week</option>
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateRange === "custom" && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">From</label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">To</label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Event Filter */}
          <div className="border-b pb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Events</option>
              {events.map((event) => (
                <option key={event.event_id} value={event.event_id}>
                  {event.event_title}
                </option>
              ))}
            </select>
          </div>

          {/* Event Status Filter */}
          <div className="border-b pb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="border-b pb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setGender("all")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  gender === "all"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setGender("Male")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  gender === "Male"
                    ? "bg-emerald-700 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Male
              </button>
              <button
                onClick={() => setGender("Female")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  gender === "Female"
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Female
              </button>
            </div>
          </div>

          {/* Volunteer Count Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
            Volunteers
            </label>
            <select
              value={volunteerRange}
              onChange={(e) => setVolunteerRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Ranges</option>
              <option value="1-50">1 - 50 volunteers</option>
              <option value="51-100">51 - 100 volunteers</option>
              <option value="101-200">101 - 200 volunteers</option>
              <option value="201+">201+ volunteers</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors cursor-pointer"
            >
              Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ backdropFilter: "blur(4px)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b-2 border-emerald-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h3 className="text-2xl font-bold font-montserrat text-emerald-800">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { ngoCode } = useParams();
  const [dashboardData, setDashboardData] = useState({
    ngoName: "",
    ngoCode: "",
    totalVolunteers: 0,
    pendingApplications: 0,
    completionRate: 0,
    participationRate: 0,
    activeEvents: 0,
    beneficiaryReach: 0,
    feedbackScore: 5,
    events: [],
  });

  const [chartData, setChartData] = useState({
    growth: [],
    applications: { data: [], forecast: 0 },
    eventsPerformance: [],
  });

  const [loading, setLoading] = useState(true);
  const [viewingContext, setViewingContext] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, type: null });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true" || false
  );
  
  // Enhanced Draggable state with visual feedback
  const [draggableItems, setDraggableItems] = useState(() => {
    const saved = localStorage.getItem("dashboardLayout");
    return saved ? JSON.parse(saved) : [
      { id: "completion", order: 0 },
      { id: "volunteers", order: 1 },
      { id: "participation", order: 2 },
      { id: "applications", order: 3 },
      { id: "growth", order: 4 },
      { id: "feedback", order: 5 },
      { id: "beneficiary", order: 6 },
      { id: "activeEvents", order: 7 },
    ];
  });
  
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    dateRange: "all",
    selectedEvent: "all",
    gender: "all",
    status: "all",
    volunteerRange: "all",
    customDateFrom: "",
    customDateTo: ""
  });

  useEffect(() => {
    initializeDashboard();
  }, [ngoCode]);

  useEffect(() => {
    localStorage.setItem("dashboardLayout", JSON.stringify(draggableItems));
  }, [draggableItems]);

  const initializeDashboard = async () => {
    try {
      const admin = JSON.parse(localStorage.getItem("admin"));
      const viewingNGO = JSON.parse(localStorage.getItem("viewingNGO"));

      let contextToUse;

      if (ngoCode && admin.admin_type === "super_admin") {
        contextToUse = {
          ngo_code: ngoCode,
          ngo_name: null,
          is_super_admin_view: true,
        };
      } else if (admin.admin_type === "super_admin" && viewingNGO) {
        contextToUse = {
          ngo_code: viewingNGO.ngo_code,
          ngo_name: viewingNGO.ngo_name,
          is_super_admin_view: true,
        };
      } else {
        contextToUse = {
          ngo_code: admin.NGO_Information?.ngo_code,
          ngo_name: admin.NGO_Information?.name,
          is_super_admin_view: false,
        };
      }

      setViewingContext(contextToUse);
      await fetchDashboardData(contextToUse.ngo_code);
    } catch (error) {
      console.error("Error initializing dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (ngoCode) => {
    try {
      const { data: ngoInfo } = await supabase
        .from("NGO_Information")
        .select("*")
        .eq("ngo_code", ngoCode)
        .single();

      const { data: registeredVols } = await supabase
        .from("Registered_Volunteers")
        .select("user_id, joined_ngo")
        .like("joined_ngo", `%${ngoCode}%`);

      const totalVolunteers =
        registeredVols?.filter((vol) => {
          if (!vol.joined_ngo) return false;
          const ngoCodes = vol.joined_ngo.split("-");
          return ngoCodes.includes(ngoCode);
        }).length || 0;

      const { data: allApplications } = await supabase
        .from("Volunteer_Application")
        .select("application_id, user_id")
        .eq("ngo_id", ngoCode);

      let pendingApplications = 0;
      if (allApplications && allApplications.length > 0) {
        const { data: approvedApps } = await supabase
          .from("Application_Status")
          .select("application_id, result")
          .in(
            "application_id",
            allApplications.map((a) => a.application_id)
          )
          .not("result", "is", null);

        const approvedAppIds = new Set(
          approvedApps?.map((a) => a.application_id) || []
        );
        pendingApplications = allApplications.filter(
          (app) => !approvedAppIds.has(app.application_id)
        ).length;
      }

      const { data: events } = await supabase
        .from("Event_Information")
        .select("*")
        .eq("ngo_id", ngoCode)
        .order("date", { ascending: false });

      const completedEvents =
        events?.filter((e) => e.status === "COMPLETED").length || 0;
      const totalEvents = events?.length || 0;
      const completionRate =
        totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

      const volunteerIds =
        registeredVols
          ?.filter((vol) => {
            if (!vol.joined_ngo) return false;
            const ngoCodes = vol.joined_ngo.split("-");
            return ngoCodes.includes(ngoCode);
          })
          .map((v) => v.user_id) || [];

      let participationRate = 0;
      if (volunteerIds.length > 0) {
        const { data: eventUsers } = await supabase
          .from("Event_User")
          .select("user_id")
          .eq("ngo_id", ngoCode)
          .in("user_id", volunteerIds);

        const uniqueParticipants = new Set(
          eventUsers?.map((eu) => eu.user_id) || []
        ).size;
        participationRate = Math.round(
          (uniqueParticipants / volunteerIds.length) * 100
        );
      }

      const currentMonth = new Date().toISOString().slice(0, 7);
      const activeEvents =
        events?.filter(
          (e) =>
            e.date &&
            e.date.startsWith(currentMonth) &&
            (e.status === "ONGOING" || e.status === "UPCOMING")
        ).length || 0;

      const beneficiaryReach =
        events?.reduce((sum, event) => {
          return sum + (parseInt(event.volunteer_joined) || 0);
        }, 0) || 0;

      setDashboardData({
        ngoName: ngoInfo?.name || "Organization",
        ngoCode: ngoCode,
        totalVolunteers,
        pendingApplications,
        completionRate,
        participationRate,
        activeEvents,
        beneficiaryReach,
        feedbackScore: 5,
        events: events || [],
      });

      await generateGrowthData(ngoCode);
      await generateApplicationsData(ngoCode);
      generateEventsPerformanceData(events || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const generateGrowthData = async (ngoCode) => {
    try {
      const { data: eventUsers } = await supabase
        .from("Event_User")
        .select("user_id, date_joined")
        .eq("ngo_id", ngoCode)
        .order("date_joined", { ascending: true });

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const currentDate = new Date();

      const growthData = [];
      for (let i = 4; i >= 0; i--) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const monthName = months[date.getMonth()];
        const yearMonth = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        const volunteersUpToMonth =
          eventUsers?.filter((eu) => {
            if (!eu.date_joined) return false;
            return eu.date_joined <= `${yearMonth}-31`;
          }).length || 0;

        growthData.push({
          month: monthName,
          volunteers: volunteersUpToMonth,
        });
      }

      setChartData((prev) => ({ ...prev, growth: growthData }));
    } catch (error) {
      console.error("Error generating growth data:", error);
      const months = ["Jan", "Feb", "Mar", "Apr", "May"];
      const mockData = months.map((month, index) => ({
        month,
        volunteers: Math.round(78 + index * 50),
      }));
      setChartData((prev) => ({ ...prev, growth: mockData }));
    }
  };

  const generateApplicationsData = async (ngoCode) => {
    try {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

      const { data: applications } = await supabase
        .from("Application_Status")
        .select("application_id, date_application, result")
        .eq("ngo_id", ngoCode)
        .gte("date_application", sevenDaysAgoStr)
        .eq("result", true);

      const applicationsByDay = {};
      days.forEach((day) => (applicationsByDay[day] = 0));

      applications?.forEach((app) => {
        const date = new Date(app.date_application);
        const dayName = days[date.getDay()];
        applicationsByDay[dayName]++;
      });

      const applicationsData = days.map((day) => ({
        day,
        applications: applicationsByDay[day],
      }));

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const todayCount =
        applications?.filter((app) => app.date_application === todayStr)
          .length || 0;

      const avgApplications =
        applications?.length > 0 ? Math.round(applications.length / 7) : 0;

      const forecast = todayCount + Math.round(avgApplications * 0.3);

      setChartData((prev) => ({
        ...prev,
        applications: { data: applicationsData, forecast },
      }));
    } catch (error) {
      console.error("Error generating applications data:", error);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const mockData = days.map((day) => ({
        day,
        applications: Math.floor(Math.random() * 15) + 5,
      }));
      setChartData((prev) => ({
        ...prev,
        applications: { data: mockData, forecast: 25 },
      }));
    }
  };

  const generateEventsPerformanceData = (events) => {
    const recentEvents = events
      .filter((e) => e.volunteer_joined && parseInt(e.volunteer_joined) > 0)
      .slice(0, 4)
      .map((event) => {
        const volunteerJoined = parseInt(event.volunteer_joined) || 0;
        const volunteerLimit = parseInt(event.volunteers_limit) || 100;

        const performance =
          volunteerLimit > 0
            ? Math.round((volunteerJoined / volunteerLimit) * 100)
            : volunteerJoined;

        return {
          event:
            event.event_title.length > 15
              ? event.event_title.substring(0, 15) + "..."
              : event.event_title,
          value: Math.min(performance, 100),
        };
      });

    setChartData((prev) => ({
      ...prev,
      eventsPerformance: recentEvents,
    }));
  };

  // Enhanced Drag and Drop Functions
  const handleDragStart = (e, itemId) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e, targetId) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== targetId) {
      setDragOverItem(targetId);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverItem(null);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    setDragOverItem(null);
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = draggableItems.findIndex(item => item.id === draggedItem);
    const targetIndex = draggableItems.findIndex(item => item.id === targetId);

    const newItems = [...draggableItems];
    const [draggedElement] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedElement);

    // Update order values
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order: index
    }));

    setDraggableItems(reorderedItems);
    setDraggedItem(null);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Download Functions
  const downloadAsPDF = (cardType) => {
    alert(`Downloading ${cardType} report as PDF... (Feature to be implemented)`);
    // TODO: Implement PDF generation using libraries like jsPDF
  };

  const downloadAsWord = (cardType) => {
    alert(`Downloading ${cardType} report as Word document... (Feature to be implemented)`);
    // TODO: Implement Word document generation
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    // TODO: Apply filters to dashboard data
    console.log("Filters applied:", filters);
  };

  // Generate Report Function
  const handleGenerateReport = () => {
    const reportData = {
      ngo: dashboardData.ngoName,
      generatedDate: new Date().toLocaleString(),
      summary: {
        totalVolunteers: dashboardData.totalVolunteers,
        pendingApplications: dashboardData.pendingApplications,
        completionRate: dashboardData.completionRate,
        participationRate: dashboardData.participationRate,
        activeEvents: dashboardData.activeEvents,
        beneficiaryReach: dashboardData.beneficiaryReach,
        feedbackScore: dashboardData.feedbackScore
      },
      filters: activeFilters,
      events: dashboardData.events.length
    };

    console.log("Generating Report:", reportData);
    alert("Report generation initiated! This will export your dashboard data.\n\nReport includes:\n- All metrics and statistics\n- Chart data\n- Applied filters\n- Event performance data");
    // TODO: Implement actual report generation with PDF/Excel export
  };

  const openModal = (type) => setModalState({ isOpen: true, type });
  const closeModal = () => setModalState({ isOpen: false, type: null });

  const getSortedItems = () => {
    return [...draggableItems].sort((a, b) => a.order - b.order);
  };

  const renderDraggableCard = (itemId, content) => {
    const isDragOver = dragOverItem === itemId;
    
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, itemId)}
        onDragOver={handleDragOver}
        onDragEnter={(e) => handleDragEnter(e, itemId)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, itemId)}
        onDragEnd={handleDragEnd}
        className={`transition-all duration-200 h-full ${
          isDragOver ? 'ring-4 ring-emerald-400 scale-105' : ''
        }`}
        style={{ cursor: 'grab' }}
      >
        <div className="relative h-full">
          <div className="absolute top-2 left-2 text-gray-400 z-10 cursor-move">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 5h2v14H9V5zm4 0h2v14h-2V5z"/>
            </svg>
          </div>
          {content}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const cardComponents = {
    completion: (
      <div
        onClick={() => openModal("completion")}
        className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full min-h-[280px] flex flex-col justify-center"
      >
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Completion Rate")}
            onDownloadWord={() => downloadAsWord("Completion Rate")}
          />
        </div>
        <h4 className="font-bold font-montserrat text-base mb-2 mt-6">
          Project & Event Completion Rate
        </h4>
        <ResponsiveContainer width="100%" height={100}>
          <PieChart>
            <Pie
              data={[
                { name: "Completed", value: dashboardData.completionRate },
                { name: "Remaining", value: 100 - dashboardData.completionRate },
              ]}
              dataKey="value"
              innerRadius={30}
              outerRadius={45}
              startAngle={90}
              endAngle={-270}
            >
              {[0, 1].map((index) => (
                <Cell key={`cell-${index}`} fill={COLORS.completion[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <p className="text-2xl font-extrabold font-montserrat text-emerald-600">
          {dashboardData.completionRate}%
        </p>
        <p className="text-xs text-gray-500 font-montserrat mt-1">Success Rate</p>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
    volunteers: (
      <div
        onClick={() => openModal("volunteers")}
        className="bg-white p-4 text-center flex flex-col justify-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full min-h-[280px]"
      >
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Total Volunteers")}
            onDownloadWord={() => downloadAsWord("Total Volunteers")}
          />
        </div>
        <h4 className="font-bold font-montserrat text-base mb-2 mt-6">
          Total Registered Volunteers
        </h4>
        <p className="text-4xl font-extrabold font-montserrat text-emerald-700">
          {dashboardData.totalVolunteers}
        </p>
        <p className="text-xs mt-2 font-montserrat">
          As of {new Date().toLocaleDateString()}
        </p>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
    participation: (
      <div
        onClick={() => openModal("participation")}
        className="bg-white p-4 text-center font-montserrat rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full min-h-[280px] flex flex-col justify-center"
      >
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Participation Rate")}
            onDownloadWord={() => downloadAsWord("Participation Rate")}
          />
        </div>
        <h4 className="font-bold mb-2 font-montserrat text-base mt-6">
          Volunteer Participation Rate
        </h4>
        <ResponsiveContainer width="100%" height={100}>
          <PieChart>
            <Pie
              data={[
                { name: "Active", value: dashboardData.participationRate },
                { name: "Inactive", value: 100 - dashboardData.participationRate },
              ]}
              dataKey="value"
              innerRadius={30}
              outerRadius={45}
              startAngle={90}
              endAngle={-270}
            >
              {[0, 1].map((index) => (
                <Cell key={`cell-${index}`} fill={COLORS.participation[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <p className="text-2xl font-extrabold font-montserrat mt-2 text-emerald-600">
          {dashboardData.participationRate}%
        </p>
        <p className="text-xs text-gray-500 font-montserrat mt-2">Active Volunteers</p>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
    applications: (
      <div
        onClick={() => openModal("applications")}
        className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full"
      >
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Applications")}
            onDownloadWord={() => downloadAsWord("Applications")}
          />
        </div>
        <h4 className="font-bold mb-4 mt-8 font-montserrat text-sm">
          Expected Volunteer Applications - Current Week
        </h4>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData.applications?.data || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="applications"
              stroke={COLORS.applications}
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <p className="text-lg mb-2 font-montserrat">
            Projected Today:{" "}
            <span className="font-bold text-emerald-700 text-xl">
              {chartData.applications?.forecast || 0}
            </span>
          </p>
        </div>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
    growth: (
      <div
        onClick={() => openModal("growth")}
        className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full"
      >
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Growth Rate")}
            onDownloadWord={() => downloadAsWord("Growth Rate")}
          />
        </div>
        <h4 className="font-bold font-montserrat text-base mb-6 mt-8">
          Volunteer Growth Rate
        </h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData.growth}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Bar dataKey="volunteers" fill={COLORS.growth} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
    feedback: (
      <div
        onClick={() => openModal("feedback")}
        className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full min-h-[140px] flex flex-col justify-center"
      >
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Feedback Score")}
            onDownloadWord={() => downloadAsWord("Feedback Score")}
          />
        </div>
        <h4 className="font-bold font-montserrat text-base mt-6">
          Volunteer Feedback Score
        </h4>
        <p className="text-yellow-500 text-2xl mt-2">
          {"⭐".repeat(dashboardData.feedbackScore)}
        </p>
        <p className="text-xs font-montserrat mt-2">High satisfaction</p>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
    beneficiary: (
      <div
        onClick={() => openModal("beneficiary")}
        className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full min-h-[140px] flex flex-col justify-center"
      >
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Beneficiary Reach")}
            onDownloadWord={() => downloadAsWord("Beneficiary Reach")}
          />
        </div>
        <h4 className="font-bold font-montserrat text-base mt-6">
          Beneficiary Reach
        </h4>
        <p className="text-3xl font-extrabold text-emerald-700 mt-2">
          {dashboardData.beneficiaryReach.toLocaleString()}
        </p>
        <p className="text-xs font-montserrat mt-1">Total served</p>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
    activeEvents: (
      <div
        onClick={() => openModal("activeEvents")}
        className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full min-h-[140px] flex flex-col justify-center"
      >
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <ThreeDotsMenu
            onDownloadPDF={() => downloadAsPDF("Active Events")}
            onDownloadWord={() => downloadAsWord("Active Events")}
          />
        </div>
        <h4 className="font-bold font-montserrat text-base mt-6">
          Active Events This Month
        </h4>
        <p className="text-3xl font-extrabold text-emerald-700 mt-2">
          {dashboardData.activeEvents}
        </p>
        <p className="text-xs font-montserrat mt-1">
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
      </div>
    ),
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

      <main
        className="flex-1 p-6 overflow-y-auto transition-all duration-300"
        style={{ 
          filter: modalState.isOpen || filterModalOpen ? "blur(3px)" : "none",
          marginLeft: sidebarCollapsed ? "5rem" : "16rem"
        }}
      >
        <div className="relative z-10 space-y-6 w-full mx-auto" style={{ maxWidth: "1400px" }}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="flex-1 text-3xl font-bold font-montserrat text-white text-center border border-emerald-500 bg-emerald-800/90 py-3 rounded-xl shadow">
              {viewingContext?.is_super_admin_view
                ? `${dashboardData.ngoName.toUpperCase()} DASHBOARD (SAV)`
                : "ORGANIZATION DASHBOARD"}
            </h2>
            <button
              onClick={() => setFilterModalOpen(true)}
              className="px-4 py-3 bg-white text-emerald-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 hover:bg-emerald-50 cursor-pointer"
            >
              Filter
            </button>
            <button
              onClick={handleGenerateReport}
              className="px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 hover:bg-emerald-700 cursor-pointer"
            >
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
            </button>
          </div>

          {viewingContext?.is_super_admin_view && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              <p className="font-semibold">
                You are viewing {dashboardData.ngoName}'s dashboard.
                <Link
                  to="/ngohub"
                  onClick={() => localStorage.removeItem("viewingNGO")}
                  className="ml-4 underline hover:no-underline"
                >
                  Return to NGO Hub
                </Link>
              </p>
            </div>
          )}

          {/* Active Filters Display */}
          {(activeFilters.dateRange !== "all" || activeFilters.selectedEvent !== "all" || activeFilters.gender !== "all" || activeFilters.status !== "all" || activeFilters.volunteerRange !== "all") && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-emerald-800">Filters:</span>
                  {activeFilters.dateRange !== "all" && (
                    <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                      {activeFilters.dateRange === "custom" ? `${activeFilters.customDateFrom} to ${activeFilters.customDateTo}` : activeFilters.dateRange}
                    </span>
                  )}
                  {activeFilters.selectedEvent !== "all" && (
                    <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                      {dashboardData.events.find(e => e.event_id === activeFilters.selectedEvent)?.event_title || activeFilters.selectedEvent}
                    </span>
                  )}
                  {activeFilters.status !== "all" && (
                    <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                      {activeFilters.status}
                    </span>
                  )}
                  {activeFilters.gender !== "all" && (
                    <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                      {activeFilters.gender}
                    </span>
                  )}
                  {activeFilters.volunteerRange !== "all" && (
                    <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                      {activeFilters.volunteerRange}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleApplyFilters({ 
                    dateRange: "all", 
                    selectedEvent: "all", 
                    gender: "all", 
                    status: "all",
                    volunteerRange: "all",
                    customDateFrom: "",
                    customDateTo: ""
                  })}
                  className="text-emerald-700 hover:text-emerald-900 font-semibold text-sm cursor-pointer"
                >
                  Clear 
                </button>
              </div>
            </div>
          )}

          {/* ROW 1: Fixed - Greetings, Create Announcement, Create Event */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            <div
              className="p-5 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#d8eeeb" }}
            >
              <h3 className="text-emerald-900 font-extrabold text-xl font-montserrat mt-2 mb-1">
                Hi, {dashboardData.ngoName}!
              </h3>
              <p className="text-sm">
                You have{" "}
                <span className="underline decoration-double font-bold text-lg">
                  {dashboardData.pendingApplications}
                </span>{" "}
                pending applicants waiting for review.
              </p>
            </div>

            <Link
              to="/create-announcement"
              className="inline-flex items-center justify-center text-2xl font-montserrat text-emerald-900 font-bold p-5 gap-3 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#fff4d9" }}
            >
              <img src={CreateAnnouncementIcon} alt="Create Announcement" className="w-16 h-16" />
              <span>CREATE ANNOUNCEMENT</span>
            </Link>

            <Link
              to="/create-event"
              className="inline-flex items-center justify-center text-2xl text-emerald-900 font-bold font-montserrat p-5 gap-3 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#fbdb90" }}
            >
              <span>CREATE EVENT</span>
              <img src={CreateEventIcon} alt="Create Event" className="w-16 h-16" />
            </Link>
          </div>

          {/* ROW 2: Draggable Cards - 3 columns with equal height */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {getSortedItems().slice(0, 3).map(item => (
              <div key={item.id} className="h-full">
                {renderDraggableCard(item.id, cardComponents[item.id])}
              </div>
            ))}
          </div>

          {/* ROW 3: Draggable Cards - Mixed layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
            {/* First two large cards */}
            <div className="h-full">
              {getSortedItems()[3] && renderDraggableCard(getSortedItems()[3].id, cardComponents[getSortedItems()[3].id])}
            </div>
            <div className="h-full">
              {getSortedItems()[4] && renderDraggableCard(getSortedItems()[4].id, cardComponents[getSortedItems()[4].id])}
            </div>

            {/* Three stacked small cards with equal heights */}
            <div className="flex flex-col gap-4 h-full">
              {getSortedItems().slice(5, 8).map(item => (
                <div key={item.id} className="flex-1">
                  {renderDraggableCard(item.id, cardComponents[item.id])}
                </div>
              ))}
            </div>
          </div>

          {/* ROW 4: Events Performance - Full Width */}
          {chartData.eventsPerformance.length > 0 && (
            <div
              onClick={() => openModal("eventsPerformance")}
              className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative"
            >
              <div className="absolute top-2 right-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <ThreeDotsMenu
                  onDownloadPDF={() => downloadAsPDF("Events Performance")}
                  onDownloadWord={() => downloadAsWord("Events Performance")}
                />
              </div>
              <h4 className="font-bold mt-2 mb-4 font-montserrat text-base">
                Events Performance Comparison
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.eventsPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="event" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value">
                    {chartData.eventsPerformance.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS.events[index % COLORS.events.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
            </div>
          )}
        </div>
      </main>

      {/* Filter Modal */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        events={dashboardData.events}
      />

      {/* ALL MODALS */}
      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "completion"}
        onClose={closeModal}
        title="Project & Event Completion Rate"
      >
        <div className="text-center">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={[
                  { name: "Completed", value: dashboardData.completionRate },
                  { name: "Remaining", value: 100 - dashboardData.completionRate },
                ]}
                dataKey="value"
                innerRadius={100}
                outerRadius={150}
                startAngle={90}
                endAngle={-270}
                label
              >
                {[0, 1].map((index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.completion[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-6">
            <p className="text-5xl font-extrabold text-emerald-600 mb-4">
              {dashboardData.completionRate}%
            </p>
            <p className="text-xl text-gray-600">Success Rate</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Completed Events</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {dashboardData.events.filter((e) => e.status === "COMPLETED").length}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-700">
                  {dashboardData.events.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "volunteers"}
        onClose={closeModal}
        title="Total Registered Volunteers"
      >
        <div className="text-center">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-12 rounded-xl mb-6">
            <p className="text-5xl font-extrabold text-emerald-700 mb-4">
              {dashboardData.totalVolunteers}
            </p>
            <p className="text-2xl text-gray-700 font-montserrat">
              Registered Volunteers
            </p>
            <p className="text-lg text-gray-600 mt-2">
              As of{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Pending Applications</p>
              <p className="text-3xl font-bold text-blue-700">
                {dashboardData.pendingApplications}
              </p>
            </div>
            <div className="bg-emerald-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Active Volunteers</p>
              <p className="text-3xl font-bold text-emerald-700">
                {Math.round(
                  dashboardData.totalVolunteers *
                    (dashboardData.participationRate / 100)
                )}
              </p>
            </div>
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "participation"}
        onClose={closeModal}
        title="Volunteer Participation Rate"
      >
        <div className="text-center">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={[
                  { name: "Active", value: dashboardData.participationRate },
                  { name: "Inactive", value: 100 - dashboardData.participationRate },
                ]}
                dataKey="value"
                innerRadius={100}
                outerRadius={150}
                startAngle={90}
                endAngle={-270}
                label
              >
                {[0, 1].map((index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.participation[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-6">
            <p className="text-5xl font-extrabold text-emerald-600 mb-4">
              {dashboardData.participationRate}%
            </p>
            <p className="text-xl text-gray-600">Active Volunteers</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Active Volunteers</p>
                <p className="text-2xl font-bold text-blue-700">
                  {Math.round(
                    dashboardData.totalVolunteers *
                      (dashboardData.participationRate / 100)
                  )}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Inactive Volunteers</p>
                <p className="text-2xl font-bold text-red-700">
                  {dashboardData.totalVolunteers -
                    Math.round(
                      dashboardData.totalVolunteers *
                        (dashboardData.participationRate / 100)
                    )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "growth"}
        onClose={closeModal}
        title="Volunteer Growth Rate"
      >
        <div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.growth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="volunteers" fill={COLORS.growth} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-8 flex gap-4 overflow-x-auto">
            {chartData.growth.map((data, index) => (
              <div
                key={index}
                className="bg-purple-50 p-4 rounded-lg text-center min-w-[150px] flex-shrink-0"
              >
                <p className="text-sm text-gray-600 font-semibold">{data.month}</p>
                <p className="text-2xl font-bold text-purple-700">{data.volunteers}</p>
                <p className="text-xs text-gray-500">volunteers</p>
              </div>
            ))}
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "applications"}
        onClose={closeModal}
        title="Expected Volunteer Applications - Current Week"
      >
        <div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData.applications?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="applications"
                stroke={COLORS.applications}
                strokeWidth={4}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-8">
            <div className="bg-orange-50 p-6 rounded-lg text-center mb-4">
              <p className="text-lg text-gray-600">Projected Today</p>
              <p className="text-4xl font-bold text-orange-600">
                {chartData.applications?.forecast || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">applications expected</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {chartData.applications?.data?.slice(0, 4).map((data, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">{data.day}</p>
                  <p className="text-xl font-bold text-gray-700">
                    {data.applications}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "feedback"}
        onClose={closeModal}
        title="Volunteer Feedback Score"
      >
        <div className="text-center">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-12 rounded-xl mb-6">
            <p className="text-6xl mb-4">
              {"⭐".repeat(dashboardData.feedbackScore)}
            </p>
            <p className="text-3xl font-bold text-yellow-600">
              {dashboardData.feedbackScore}.0 / 5.0
            </p>
            <p className="text-xl text-gray-700 mt-2">Excellent Rating</p>
          </div>
          <div className="bg-emerald-50 p-6 rounded-lg">
            <h5 className="font-bold text-lg mb-4 text-emerald-800">
              Satisfaction Breakdown
            </h5>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Organization Support</span>
                <span className="font-bold text-emerald-600">98%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Event Management</span>
                <span className="font-bold text-emerald-600">95%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Communication</span>
                <span className="font-bold text-emerald-600">97%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Overall Experience</span>
                <span className="font-bold text-emerald-600">96%</span>
              </div>
            </div>
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "beneficiary"}
        onClose={closeModal}
        title="Beneficiary Reach"
      >
        <div className="text-center">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-12 rounded-xl mb-6">
            <p className="text-5xl font-extrabold text-emerald-700 mb-4">
              {dashboardData.beneficiaryReach.toLocaleString()}
            </p>
            <p className="text-2xl text-gray-700 font-montserrat">
              Total Individuals Served
            </p>
            <p className="text-lg text-gray-600 mt-2">
              Through all events and programs
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-3xl font-bold text-blue-700">
                {dashboardData.events.length}
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Avg. per Event</p>
              <p className="text-3xl font-bold text-purple-700">
                {dashboardData.events.length > 0
                  ? Math.round(
                      dashboardData.beneficiaryReach /
                        dashboardData.events.length
                    )
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "activeEvents"}
        onClose={closeModal}
        title="Active Events This Month"
      >
        <div className="text-center">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-12 rounded-xl mb-6">
            <p className="text-5xl font-extrabold text-emerald-700 mb-4">
              {dashboardData.activeEvents}
            </p>
            <p className="text-2xl text-gray-700 font-montserrat">
              Active Events
            </p>
            <p className="text-lg text-gray-600 mt-2">
              For{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Ongoing</p>
              <p className="text-3xl font-bold text-green-700">
                {dashboardData.events.filter((e) => e.status === "ONGOING")
                  .length}
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-3xl font-bold text-blue-700">
                {dashboardData.events.filter((e) => e.status === "UPCOMING")
                  .length}
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-gray-700">
                {dashboardData.events.filter((e) => e.status === "COMPLETED")
                  .length}
              </p>
            </div>
          </div>
        </div>
      </ChartModal>

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "eventsPerformance"}
        onClose={closeModal}
        title="Events Performance Comparison"
      >
        <div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.eventsPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="event" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {chartData.eventsPerformance.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS.events[index % COLORS.events.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-8 space-y-3">
            {chartData.eventsPerformance.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor:
                        COLORS.events[index % COLORS.events.length],
                    }}
                  ></div>
                  <span className="font-semibold text-gray-700">
                    {event.event}
                  </span>
                </div>
                <div className="text-right">
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: COLORS.events[index % COLORS.events.length],
                    }}
                  >
                    {event.value}%
                  </p>
                  <p className="text-xs text-gray-500">participation rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ChartModal>
    </div>
  );
}

export default DashboardPage;