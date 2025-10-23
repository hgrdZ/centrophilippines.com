import React, { useState, useEffect } from "react";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    initializeDashboard();
  }, [ngoCode]);

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

  const openModal = (type) => setModalState({ isOpen: true, type });
  const closeModal = () => setModalState({ isOpen: false, type: null });

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
          filter: modalState.isOpen ? "blur(3px)" : "none",
          marginLeft: sidebarCollapsed ? "5rem" : "16rem"
        }}
      >

        <div className="relative z-10 space-y-6 w-full mx-auto" style={{ maxWidth: "1400px" }}>
          <h2 className="text-3xl font-bold font-montserrat text-white text-center border border-emerald-500 bg-emerald-800/90 py-3 rounded-xl shadow">
            {viewingContext?.is_super_admin_view
              ? `${dashboardData.ngoName.toUpperCase()} DASHBOARD (SAV)`
              : "ORGANIZATION DASHBOARD"}
          </h2>

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

          {/* ROW 1: Greetings, Create Announcement, Create Event (3 columns) */}
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

          {/* ROW 2: Completion Rate, Total Volunteers, Participation Rate (3 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {/* Completion Rate */}
            <div
              onClick={() => openModal("completion")}
              className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105"
            >
              <h4 className="font-bold font-montserrat text-sm mb-2">
                Project & Event Completion Rate
              </h4>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Completed", value: dashboardData.completionRate },
                      {
                        name: "Remaining",
                        value: 100 - dashboardData.completionRate,
                      },
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
              <p className="text-xs text-gray-500 font-montserrat mt-1">
                Success Rate
              </p>
              <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
            </div>

            {/* Total Volunteers */}
            <div
              onClick={() => openModal("volunteers")}
              className="bg-white p-4 text-center flex flex-col justify-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105"
            >
              <h4 className="font-bold font-montserrat text-sm mb-2">
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

            {/* Participation Rate */}
            <div
              onClick={() => openModal("participation")}
              className="bg-white p-4 text-center font-montserrat rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105"
            >
              <h4 className="font-bold mb-2 font-montserrat text-sm">
                Volunteer Participation Rate
              </h4>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Active", value: dashboardData.participationRate },
                      {
                        name: "Inactive",
                        value: 100 - dashboardData.participationRate,
                      },
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
              <p className="text-xs text-gray-500 font-montserrat mt-2">
                Active Volunteers
              </p>
              <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
            </div>
          </div>

{/* ROW 3: Expected Applications | Growth Rate | 3 Stacked Cards */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
  {/* COLUMN 1 - Expected Volunteer Applications */}
  <div
    onClick={() => openModal("applications")}
    className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105"
  >
    <h4 className="font-bold mb-4 mt-2 font-montserrat text-sm">
      Expected Volunteer Applications - Current Week
    </h4>
    <ResponsiveContainer width="100%" height={320}>
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
      <p className="text-lg font-montserrat">
        Projected Today:{" "}
        <span className="font-bold text-emerald-700 text-xl">
          {chartData.applications?.forecast || 0}
        </span>
      </p>
    </div>
    <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
  </div>

  {/* COLUMN 2 - Volunteer Growth Rate */}
  <div
    onClick={() => openModal("growth")}
    className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105"
  >
    <h4 className="font-bold font-montserrat text-sm mb-3">
      Volunteer Growth Rate
    </h4>
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData.growth}>
        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Bar dataKey="volunteers" fill={COLORS.growth} />
      </BarChart>
    </ResponsiveContainer>
    <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
  </div>

  {/* COLUMN 3 - 3 Stacked Cards */}
  <div className="flex flex-col gap-4">
    {/* Feedback */}
    <div
      onClick={() => openModal("feedback")}
      className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105"
    >
      <h4 className="font-bold font-montserrat text-sm">
        Volunteer Feedback Score
      </h4>
      <p className="text-yellow-500 text-2xl mt-2">
        {"⭐".repeat(dashboardData.feedbackScore)}
      </p>
      <p className="text-xs font-montserrat mt-2">High satisfaction</p>
      <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
    </div>

    {/* Beneficiary Reach */}
    <div
      onClick={() => openModal("beneficiary")}
      className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105"
    >
      <h4 className="font-bold font-montserrat text-sm">
        Beneficiary Reach
      </h4>
      <p className="text-3xl font-extrabold text-emerald-700 mt-2">
        {dashboardData.beneficiaryReach.toLocaleString()}
      </p>
      <p className="text-xs font-montserrat mt-1">Total served</p>
      <p className="text-xs text-emerald-600 mt-2">Click to expand</p>
    </div>

    {/* Active Events */}
    <div
      onClick={() => openModal("activeEvents")}
      className="bg-white p-4 text-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105"
    >
      <h4 className="font-bold font-montserrat text-sm">
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
  </div>
</div>


          {/* ROW 4: Events Performance - Full Width */}
          {chartData.eventsPerformance.length > 0 && (
            <div
              onClick={() => openModal("eventsPerformance")}
              className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105"
            >
              <h4 className="font-bold mt-2 mb-4 font-montserrat text-sm">
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

      {/* MODALS */}
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
                  {
                    name: "Remaining",
                    value: 100 - dashboardData.completionRate,
                  },
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
                  {
                    name: "Inactive",
                    value: 100 - dashboardData.participationRate,
                  },
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