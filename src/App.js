import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./layout/DashboardLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import VolunteersPage from "./pages/VolunteersPage.jsx";
import ReviewApplicationPage from "./pages/ReviewApplicationPage.jsx";
import ReviewApplicationEventPage from "./pages/ReviewApplicationPage_Event.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import MessagesPage from "./pages/MessagesPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ManageReportsPage from "./pages/ManageReportsPage.jsx";
import CreateAnnouncement from "./pages/CreateAnnouncement.jsx";
import CreateEvent from "./pages/CreateEvent.jsx";
import EventPage from "./pages/EventPage.jsx";
import FirstEventPage from "./pages/FirstEventPage.jsx";
import FolderPage from "./pages/FolderPage.jsx";
import ApplicantsPage from "./pages/ApplicantsPage.jsx";
import ReviewAiSchedulingPage from "./pages/ReviewAiSchedulingPage.jsx";
import AcceptedVolunteers from "./pages/AcceptedVolunteers.jsx";
import CentroLogin from "./pages/CentroLogin.jsx"; 
import ForgotPassword from "./pages/ForgotPassword";
import NGOHubPage from "./pages/NGOHubPage.jsx";
import AddNGOPage from "./pages/AddNGOPage.jsx";

import "./App.css";

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false); // <-- new state

  // Restore login state from localStorage on app load
  useEffect(() => {
    const savedAuth = localStorage.getItem("isAuthenticated");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
    setAuthChecked(true); // <-- mark that we already checked
  }, []);

  // Sync login state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("isAuthenticated", isAuthenticated);
  }, [isAuthenticated]);

  // Change the title
  useEffect(() => {
    document.title = "Centro Admin";
  }, []);

  // ⏳ While checking localStorage, don't render routes yet
  if (!authChecked) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Redirect root to /login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Login Page */}
        <Route
          path="/login"
          element={<CentroLogin setIsAuthenticated={setIsAuthenticated} />}
        />
        
        <Route path="/forgot-password" element={<ForgotPassword />} />


        {/* Protected Routes */}
        {isAuthenticated ? (
          <Route element={<DashboardLayout setIsAuthenticated={setIsAuthenticated} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ngo-dashboard/:ngoCode" element={<DashboardPage />} />
            <Route path="/volunteer" element={<VolunteersPage />} />
            <Route path="/review-application" element={<ReviewApplicationPage />} />
            <Route path="/review-application-event" element={<ReviewApplicationEventPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/ngohub" element={<NGOHubPage />} />
            <Route path="/add-ngo" element={<AddNGOPage />} />
            <Route path="/manage-reports" element={<ManageReportsPage />} />
            <Route path="/create-announcement" element={<CreateAnnouncement />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/event/:eventId" element={<EventPage />} />
            <Route path="/event/:eventId/first" element={<FirstEventPage />} />
            <Route path="/folder/:eventId" element={<FolderPage />} />
            <Route path="/applicants/:eventId" element={<ApplicantsPage />} />
            <Route path="/accepted-volunteers" element={<AcceptedVolunteers />} />
            <Route path="/review-ai-scheduling" element={<ReviewAiSchedulingPage />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}
export default App;
