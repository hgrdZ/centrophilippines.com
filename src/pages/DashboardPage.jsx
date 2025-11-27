import { Link, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import supabase from "../config/supabaseClient";
import CreateAnnouncementIcon from "../images/create-announcement.svg";
import CreateEventIcon from "../images/create-event.svg";
import MaleIcon from "../images/male.png";
import FemaleIcon from "../images/female.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import React, { useState, useEffect, useRef } from "react";
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
  gender: {
    male: "#3498db",
    female: "#e91e63",
  },
};

// Helper function for real-time gender counting
const fetchGenderDataRealtime = async (userIds, setValidationError) => {
  if (!userIds || userIds.length === 0) {
    return { male: 0, female: 0, malePercentage: 0, femalePercentage: 0 };
  }

  try {
    const { data: usersData, error } = await supabase
      .from("LoginInformation")
      .select("user_id, gender")
      .in("user_id", userIds);

    if (error) {
      setValidationError("Error fetching gender data. Please try again.");
      return { male: 0, female: 0, malePercentage: 0, femalePercentage: 0 };
    }

    let maleCount = 0;
    let femaleCount = 0;

    usersData?.forEach((user) => {
      if (user.gender?.toLowerCase() === "male") maleCount++;
      else if (user.gender?.toLowerCase() === "female") femaleCount++;
    });

    const total = maleCount + femaleCount;
    const malePercentage = total > 0 ? Math.round((maleCount / total) * 100) : 0;
    const femalePercentage = total > 0 ? Math.round((femaleCount / total) * 100) : 0;

    return {
      male: maleCount,
      female: femaleCount,
      malePercentage,
      femalePercentage,
    };
  } catch (error) {
    if (setValidationError) {
      setValidationError("An unexpected error occurred while fetching gender data.");
    }
    return { male: 0, female: 0, malePercentage: 0, femalePercentage: 0 };
  }
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

    function handleEscKey(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
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
        <svg className="w-5 h-5 text-gray-600 cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
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

// Custom Calendar Component
function CustomCalendar({ onClose, onApply, startDate, endDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStart, setSelectedStart] = useState(startDate ? new Date(startDate) : null);
  const [selectedEnd, setSelectedEnd] = useState(endDate ? new Date(endDate) : null);
  const [isSelectingStart, setIsSelectingStart] = useState(true);
  

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);


  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (isSelectingStart) {
      setSelectedStart(clickedDate);
      setSelectedEnd(null);
      setIsSelectingStart(false);
    } else {
      if (clickedDate < selectedStart) {
        setSelectedEnd(selectedStart);
        setSelectedStart(clickedDate);
      } else {
        setSelectedEnd(clickedDate);
      }
    }
  };

  const isDateInRange = (day) => {
    if (!selectedStart || !selectedEnd) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date >= selectedStart && date <= selectedEnd;
  };

  const isDateSelected = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (
      (selectedStart && date.toDateString() === selectedStart.toDateString()) ||
      (selectedEnd && date.toDateString() === selectedEnd.toDateString())
    );
  };

  const handleApply = () => {
    if (selectedStart && selectedEnd) {
      const startStr = selectedStart.toISOString().split('T')[0];
      const endStr = selectedEnd.toISOString().split('T')[0];
      onApply(startStr, endStr);
      onClose();
    }
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header with emerald gradient */}
        <div className="bg-emerald-900 text-white px-6 py-4 relative">
          <h3 className="text-xl font-bold">Date Range</h3>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-emerald-800 w-9 h-9 rounded-full flex items-center justify-center text-2xl transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Date inputs */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
              <input
                type="text"
                value={formatDateForInput(selectedStart)}
                placeholder="MM/DD/YYYY"
                readOnly
                className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg text-sm focus:border-emerald-500 focus:outline-none bg-emerald-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
              <input
                type="text"
                value={formatDateForInput(selectedEnd)}
                placeholder="MM/DD/YYYY"
                readOnly
                className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg text-sm focus:border-emerald-500 focus:outline-none bg-emerald-50"
              />
            </div>
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-lg">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-base font-bold text-gray-800">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day, i) => (
              <div key={i} className="text-center text-xs font-bold text-emerald-700 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) return <div key={index} className="p-2"></div>;

              const isSelected = isDateSelected(day);
              const isInRange = isDateInRange(day);

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`p-2 text-sm rounded-lg font-medium transition-all ${isSelected
                      ? "bg-emerald-600 text-white font-bold shadow-lg scale-110"
                      : isInRange
                        ? "bg-emerald-100 text-emerald-900"
                        : "hover:bg-emerald-50 text-gray-700"
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedStart || !selectedEnd}
              className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-300 cursor-pointer transition-colors shadow-md"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Month Calendar Component
function MonthCalendar({ onClose, onApply, selectedMonths = [] }) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [localSelectedMonths, setLocalSelectedMonths] = useState(selectedMonths);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleMonthClick = (monthIndex) => {
    const monthKey = `${currentYear}-${String(monthIndex + 1).padStart(2, "0")}`;
    if (localSelectedMonths.includes(monthKey)) {
      setLocalSelectedMonths(localSelectedMonths.filter((m) => m !== monthKey));
    } else {
      setLocalSelectedMonths([...localSelectedMonths, monthKey]);
    }
  };
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const handleApply = () => {
    onApply(localSelectedMonths);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header with emerald gradient */}
        <div className="bg-emerald-900 text-white px-6 py-4 relative">
          <h3 className="text-xl text-center font-bold">Months</h3>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-emerald-800 w-9 h-9 rounded-full flex items-center justify-center text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Year selector */}
          <div className="flex justify-between items-center mb-6 bg-gray-50 p-3 rounded-lg">
            <button
              onClick={() => setCurrentYear(currentYear - 1)}
              className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-2xl font-bold text-gray-800">{currentYear}</span>
            <button
              onClick={() => setCurrentYear(currentYear + 1)}
              className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Months grid */}
          <div className="grid grid-cols-3 gap-3">
            {months.map((month, index) => {
              const monthKey = `${currentYear}-${String(index + 1).padStart(2, "0")}`;
              const isSelected = localSelectedMonths.includes(monthKey);
              return (
                <button
                  key={index}
                  onClick={() => handleMonthClick(index)}
                  className={`p-4 rounded-xl text-sm font-bold transition-all shadow-sm ${isSelected
                      ? "bg-emerald-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
                    }`}
                >
                  {month.substring(0, 3)}
                </button>
              );
            })}
          </div>

          {/* Footer buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setLocalSelectedMonths([])}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors shadow-md"
            >
              Apply ({localSelectedMonths.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Filter Modal Component with Report Options
function FilterModal({ isOpen, onClose, onApplyFilters, events }) {
  const [selectedCategory, setSelectedCategory] = useState("timePeriod");
  const [dateRange, setDateRange] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [gender, setGender] = useState("all");
  const [status, setStatus] = useState("all");
  const [volunteerRange, setVolunteerRange] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);

  const categories = [
    { id: "timePeriod", label: "Time Period" },
    { id: "event", label: "Event" },
    { id: "eventStatus", label: "Event Status" },
    { id: "gender", label: "Gender" },
    { id: "volunteers", label: "Volunteers" },
    { id: "reportOptions", label: "Report Options" } // NEW
  ];

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleApply = () => {
    onApplyFilters({
      dateRange,
      selectedEvent,
      gender,
      status,
      volunteerRange,
      customDateFrom,
      customDateTo,
      selectedMonths,
      selectedMetrics,
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
    setSelectedMonths([]);
    setSelectedMetrics([]);
  };


  const handleMetricToggle = (metricValue) => {
    if (selectedMetrics.includes(metricValue)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metricValue));
    } else {
      setSelectedMetrics([...selectedMetrics, metricValue]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full flex overflow-hidden" style={{ height: "650px" }} onClick={(e) => e.stopPropagation()}>

          {/* Left Sidebar */}
          <div className="w-1/3 border-r bg-white overflow-y-auto">
            <div className="p-4 bg-emerald-900 text-white">
              <h3 className="text-lg font-bold">Filter & Report Settings</h3>
            </div>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full px-6 py-4 text-left hover:bg-emerald-50 transition-all cursor-pointer ${selectedCategory === category.id
                    ? "bg-emerald-100 border-l-4 border-emerald-600 font-bold text-emerald-900 shadow-sm"
                    : "border-l-4 border-transparent text-gray-700"
                  }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white relative">
              <h3 className="text-xl font-bold">{categories.find(c => c.id === selectedCategory)?.label}</h3>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:bg-emerald-800 w-9 h-9 rounded-full flex items-center justify-center text-2xl transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {/* Existing categories remain the same... */}
              {selectedCategory === "timePeriod" && (
                <div className="space-y-2">
                  {[
                    { value: "all", label: "All Time", desc: "No date restrictions" },
                    { value: "today", label: "Today so far", desc: "Current day only" },
                    { value: "yesterday", label: "Yesterday", desc: "Previous day" },
                    { value: "1week", label: "Last 7 days", desc: "Past week" },
                    { value: "1month", label: "Last 30 days", desc: "Past month" },
                    { value: "thisMonth", label: "This month so far", desc: "Current month" },
                    { value: "lastMonth", label: "Last month", desc: "Previous month" },
                    { value: "specific-months", label: "Select Specific Months", desc: "Choose multiple months" },
                    { value: "custom", label: "Custom Range", desc: "Pick start and end dates" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start p-4 rounded-xl cursor-pointer transition-all border-2 ${dateRange === option.value
                          ? "bg-emerald-50 border-emerald-500 shadow-md"
                          : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="dateRange"
                        value={option.value}
                        checked={dateRange === option.value}
                        onChange={(e) => {
                          setDateRange(e.target.value);
                          if (e.target.value === "custom") {
                            setShowCustomCalendar(true);
                          } else if (e.target.value === "specific-months") {
                            setShowMonthCalendar(true);
                          }
                        }}
                        className="mt-1 w-4 h-4 text-emerald-600"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-semibold text-gray-800">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{option.desc}</div>
                      </div>
                    </label>
                  ))}

                  {dateRange === "custom" && customDateFrom && customDateTo && (
                    <div className="mt-4 p-4 bg-emerald-100 border-2 border-emerald-500 rounded-xl">
                      <p className="text-sm font-bold text-emerald-900 mb-1">Selected Range:</p>
                      <p className="text-sm text-emerald-700 font-medium">{customDateFrom} → {customDateTo}</p>
                      <button
                        onClick={() => setShowCustomCalendar(true)}
                        className="mt-2 text-xs text-emerald-600 hover:text-emerald-800 underline"
                      >
                        Change
                      </button>
                    </div>
                  )}

                  {dateRange === "specific-months" && selectedMonths.length > 0 && (
                    <div className="mt-4 p-4 bg-emerald-100 border-2 border-emerald-500 rounded-xl">
                      <p className="text-sm font-bold text-emerald-900 mb-2">Selected Months:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMonths.map((month) => (
                          <span
                            key={month}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm flex items-center gap-2 font-medium shadow-sm"
                          >
                            {new Date(month + "-01").toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                            <button
                              onClick={() => setSelectedMonths(selectedMonths.filter((m) => m !== month))}
                              className="hover:bg-emerald-700 rounded-full w-5 h-5 flex items-center justify-center font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowMonthCalendar(true)}
                        className="mt-2 text-xs text-emerald-600 hover:text-emerald-800 underline"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedCategory === "event" && (
                <div className="space-y-2">
                  <label className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedEvent === "all" ? "bg-emerald-50 border-emerald-500 shadow-md" : "bg-white border-gray-200 hover:border-emerald-300"
                    }`}>
                    <input
                      type="radio"
                      name="event"
                      value="all"
                      checked={selectedEvent === "all"}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="ml-3 font-semibold text-gray-800">All Events</span>
                  </label>
                  {events.map((event) => (
                    <label
                      key={event.event_id}
                      className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedEvent === event.event_id ? "bg-emerald-50 border-emerald-500 shadow-md" : "bg-white border-gray-200 hover:border-emerald-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name="event"
                        value={event.event_id}
                        checked={selectedEvent === event.event_id}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span className="ml-3 font-medium text-gray-800 truncate">{event.event_title}</span>
                    </label>
                  ))}
                </div>
              )}

              {selectedCategory === "eventStatus" && (
                <div className="space-y-2">
                  {[
                    { value: "All", label: "All Statuses" },
                    { value: "UPCOMING", label: "Upcoming" },
                    { value: "ONGOING", label: "Ongoing" },
                    { value: "COMPLETED", label: "Completed" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${status === option.value ? "bg-emerald-50 border-emerald-500 shadow-md" : "bg-white border-gray-200 hover:border-emerald-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={status === option.value}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span className="ml-2 font-semibold text-gray-800">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {selectedCategory === "gender" && (
                <div className="space-y-2">
                  {[
                    { value: "All", label: "All Genders" },
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${gender === option.value ? "bg-emerald-50 border-emerald-500 shadow-md" : "bg-white border-gray-200 hover:border-emerald-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={gender === option.value}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span className="ml-2 font-semibold text-gray-800">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {selectedCategory === "volunteers" && (
                <div className="space-y-2">
                  {[
                    { value: "All", label: "All Ranges" },
                    { value: "1-50", label: "1 - 50 volunteers" },
                    { value: "51-100", label: "51 - 100 volunteers" },
                    { value: "101-200", label: "101 - 200 volunteers" },
                    { value: "201+", label: "201+ volunteers" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${volunteerRange === option.value ? "bg-emerald-50 border-emerald-500 shadow-md" : "bg-white border-gray-200 hover:border-emerald-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name="volunteerRange"
                        value={option.value}
                        checked={volunteerRange === option.value}
                        onChange={(e) => setVolunteerRange(e.target.value)}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span className="ml-2 font-semibold text-gray-800">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* NEW: Report Options Category */}
              {selectedCategory === "reportOptions" && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3 font-medium">Select metrics to include in reports and downloads:</p>
                  {[
                    { value: "Completion", label: "Project Completion", fullLabel: "Project & Event Completion Rate" },
                    { value: "Volunteers", label: "Total Volunteers", fullLabel: "Total Registered Volunteers" },
                    { value: "Participation", label: "Participation Rate", fullLabel: "Volunteer Participation Rate" },
                    { value: "Feedback", label: "Feedback Score", fullLabel: "Volunteer Feedback Score" },
                    { value: "Growth", label: "Growth Rate", fullLabel: "Volunteer Growth Rate" },
                    { value: "Beneficiaries", label: "Beneficiaries", fullLabel: "Beneficiary Reach" },
                    { value: "Active Events", label: "Active Events", fullLabel: "Active Events This Month" },
                    { value: "Non-Participants", label: "Non-Participants", fullLabel: "Volunteers Who Did Not Participate" },
                    { value: "Attendance", label: "Attendance", fullLabel: "Attendance of Volunteers" },
                    { value: "Certifications", label: "Certifications", fullLabel: "Certifications Given" }
                  ].map((metric) => (
                    <label
                      key={metric.value}
                      className={`flex items-start p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedMetrics.includes(metric.value)
                          ? "bg-emerald-50 border-emerald-500 shadow-md"
                          : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric.value)}
                        onChange={() => handleMetricToggle(metric.value)}
                        className="mt-1 w-4 h-4 text-emerald-600 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{metric.label}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{metric.fullLabel}</div>
                      </div>
                    </label>
                  ))}

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setSelectedMetrics([
                        "Completion", "Volunteers", "Participation", "Feedback",
                        "Growth", "Beneficiaries", "Active Events", "Non-Participants",
                        "Attendance", "Certifications"
                      ])}
                      className="flex-1 px-3 py-2 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-semibold transition-colors cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedMetrics([])}
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  {selectedMetrics.length > 0 && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-sm font-semibold text-emerald-800">
                        {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? 's' : ''} selected for reports
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t-2 border-gray-200 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-bold transition-all cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold transition-all shadow-lg cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCustomCalendar && (
        <CustomCalendar
          onClose={() => setShowCustomCalendar(false)}
          onApply={(start, end) => {
            setCustomDateFrom(start);
            setCustomDateTo(end);
            setShowCustomCalendar(false);
          }}
          startDate={customDateFrom}
          endDate={customDateTo}
        />
      )}

      {showMonthCalendar && (
        <MonthCalendar
          onClose={() => setShowMonthCalendar(false)}
          onApply={(months) => {
            setSelectedMonths(months);
            setShowMonthCalendar(false);
          }}
          selectedMonths={selectedMonths}
        />
      )}
    </>
  );
}

function ReportModal({ isOpen, onClose, onGenerate, setValidationError  }) {
  const [reportType, setReportType] = useState("single");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [reportSection, setReportSection] = useState("reportType");

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (reportSection !== "reportType") return;

    if (reportType === "single" && (!selectedMonth || !selectedYear)) {
    setValidationError("Please select a month and year first.");
      return;
    }
    if (reportType === "multiple" && selectedMonths.length === 0) {
    setValidationError("Please select at least one month.");
      return;
    }
    if (reportType === "annual" && !selectedYear) {
    setValidationError("Please select a year first.");
      return;
    }

    onGenerate(
      reportType === "single" ? selectedMonth : selectedMonths,
      selectedYear,
      reportType
    );
  };

  const handleReset = () => {
    setReportType("single");
    setSelectedMonth("");
    setSelectedYear("");
    setSelectedMonths([]);
    setSelectedMetrics([]);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full flex overflow-hidden"
          style={{ height: "650px" }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* LEFT SIDEBAR */}
          <div className="w-1/3 border-r bg-white overflow-y-auto">
            <div className="p-4 bg-emerald-900 text-white">
              <h3 className="text-lg font-bold">Report Generator</h3>
            </div>

            {/* Report Type Button */}
            <button
              onClick={() => setReportSection("reportType")}
              className={`w-full px-6 py-4 text-left transition-all cursor-pointer ${reportSection === "reportType"
                  ? "bg-emerald-50 border-l-4 border-emerald-600 font-bold text-emerald-700 shadow-sm"
                  : "border-l-4 border-transparent text-gray-700 hover:bg-emerald-50"
                }`}
            >
              Report Type
            </button>

            {/* Report Options Button */}
            <button
              onClick={() => setReportSection("reportOptions")}
              className={`w-full px-6 py-4 text-left transition-all cursor-pointer ${reportSection === "reportOptions"
                  ? "bg-emerald-50 border-l-4 border-emerald-600 font-bold text-emerald-700 shadow-sm"
                  : "border-l-4 border-transparent text-gray-700 hover:bg-emerald-50"
                }`}
            >
              Report Options
            </button>
          </div>

          {/* RIGHT CONTENT AREA */}
          <div className="flex-1 flex flex-col">

            {/* HEADER */}
            <div className="px-6 py-4 bg-emerald-900 text-white relative">
              <h3 className="text-xl font-bold">
                {reportSection === "reportType" ? "Report Type" : "Report Options"}
              </h3>

              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:bg-emerald-800 w-9 h-9 rounded-full flex items-center justify-center text-2xl transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* RIGHT CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {reportSection === "reportType" && (
                <div className="space-y-3">

                  {/* SINGLE MONTH */}
                  <label
                    className={`flex items-start p-5 rounded-xl cursor-pointer border-2 transition-all ${reportType === "single"
                        ? "bg-emerald-50 border-emerald-500 shadow-lg"
                        : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      value="single"
                      checked={reportType === "single"}
                      onChange={(e) => setReportType(e.target.value)}
                      className="mt-1 w-4 h-4 text-emerald-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-bold text-gray-800">Single Month</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Generate report for a specific month
                      </div>

                      {reportType === "single" && (
                        <div className="mt-4 space-y-3">


                          {/* MONTH SELECT */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Select Month
                            </label>
                            <div className="flex items-center border-2 border-gray-300 bg-white rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                              <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full border-none focus:outline-none cursor-pointer text-emerald-900 bg-transparent"
                              >
                                <option value="">-- Select Month --</option>
                                {Array.from({ length: 12 }, (_, i) => (
                                  <option key={i + 1} value={i + 1}>
                                    {new Date(0, i).toLocaleString("default", {
                                      month: "long",
                                    })}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* YEAR SELECT */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Select Year
                            </label>
                            <div className="flex items-center border-2 border-gray-300 bg-white rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                              <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full border-none focus:outline-none cursor-pointer text-emerald-900 bg-transparent"
                              >
                                <option value="">-- Select Year --</option>
                                {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                                  <option key={year} value={year}>
                                    {year}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>

                  {/* MULTIPLE MONTHS */}
                  <label
                    className={`flex items-start p-5 rounded-xl cursor-pointer border-2 transition-all ${reportType === "multiple"
                        ? "bg-emerald-50 border-emerald-500 shadow-lg"
                        : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      value="multiple"
                      checked={reportType === "multiple"}
                      onChange={(e) => setReportType(e.target.value)}
                      className="mt-1 w-4 h-4 text-emerald-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-bold text-gray-800">Multiple Months</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Generate report for selected months
                      </div>

                      {reportType === "multiple" && (
                        <div className="mt-4">

                          <button
                            onClick={() => setShowMonthCalendar(true)}
                            className="w-full px-5 py-4 border-2 border-emerald-600 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 font-bold"
                          >
                            Choose Months ({selectedMonths.length} selected)
                          </button>

                          {selectedMonths.length > 0 && (
                            <div className="mt-4 p-4 bg-emerald-100 border-2 border-emerald-500 rounded-xl">
                              <p className="text-sm font-bold text-emerald-900 mb-2">
                                Selected Months:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {selectedMonths.map((month) => (
                                  <span
                                    key={month}
                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm flex items-center gap-2"
                                  >
                                    {new Date(month + "-01").toLocaleDateString("en-US", {
                                      month: "short",
                                      year: "numeric",
                                    })}
                                    <button
                                      onClick={() =>
                                        setSelectedMonths(
                                          selectedMonths.filter((m) => m !== month)
                                        )
                                      }
                                      className="hover:bg-emerald-700 rounded-full w-5 h-5 flex items-center justify-center font-bold"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </label>

                  {/* ANNUAL */}
                  <label
                    className={`flex items-start p-5 rounded-xl cursor-pointer border-2 transition-all ${reportType === "annual"
                        ? "bg-emerald-50 border-emerald-500 shadow-lg"
                        : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      value="annual"
                      checked={reportType === "annual"}
                      onChange={(e) => setReportType(e.target.value)}
                      className="mt-1 w-4 h-4 text-emerald-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-bold text-gray-800">Annual Report</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Generate yearly report
                      </div>

                      {reportType === "annual" && (
                        <div className="mt-4">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Year
                          </label>
                            <div className="flex items-center border-2 border-gray-300 bg-white rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow">

                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full border-none focus:outline-none cursor-pointer text-emerald-900 bg-transparent"
                          >
                            <option value="">-- Select Year --</option>
                            {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              )}

              {reportSection === "reportOptions" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-3 font-medium">Select metrics to include in reports and downloads:</p>
                  {[
                    { value: "Completion", label: "Project Completion", fullLabel: "Project & Event Completion Rate" },
                    { value: "Volunteers", label: "Total Volunteers", fullLabel: "Total Registered Volunteers" },
                    { value: "Participation", label: "Participation Rate", fullLabel: "Volunteer Participation Rate" },
                    { value: "Feedback", label: "Feedback Score", fullLabel: "Volunteer Feedback Score" },
                    { value: "Growth", label: "Growth Rate", fullLabel: "Volunteer Growth Rate" },
                    { value: "Beneficiaries", label: "Beneficiaries", fullLabel: "Beneficiary Reach" },
                    { value: "ActiveEvents", label: "Active Events", fullLabel: "Active Events This Month" },
                    { value: "Non-Participants", label: "Non-Participants", fullLabel: "Volunteers Who Did Not Participate" },
                    { value: "Attendance", label: "Attendance", fullLabel: "Attendance of Volunteers" },
                    { value: "Certifications", label: "Certifications", fullLabel: "Certifications Given" }
                  ].map((metric) => (
                    <label
                      key={metric.value}
                      className={`flex items-start p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedMetrics.includes(metric.value)
                          ? "bg-emerald-50 border-emerald-500 shadow-md"
                          : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric.value)}
                        onChange={() => {
                          if (selectedMetrics.includes(metric.value)) {
                            setSelectedMetrics(
                              selectedMetrics.filter((m) => m !== metric.value)
                            );
                          } else {
                            setSelectedMetrics([...selectedMetrics, metric.value]);
                          }
                        }}
                        className="mt-1 w-4 h-4 text-emerald-600"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{metric.label}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{metric.fullLabel}</div>
                      </div>
                    </label>

                  ))}

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() =>
                        setSelectedMetrics([
                          "Completion",
                          "Volunteers",
                          "Participation",
                          "Feedback",
                          "Growth",
                          "Beneficiaries",
                          "ActiveEvents",
                          "Non-Participants",
                          "Attendance",
                          "Certifications",
                        ])
                      }
                      className="flex-1 px-3 py-2 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-semibold cursor-pointer"
                    >
                      Select All
                    </button>

                    <button
                      onClick={() => setSelectedMetrics([])}
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm font-semibold text-emerald-800">
                      {selectedMetrics.length > 0
                        ? ` ${selectedMetrics.length} metric${selectedMetrics.length > 1 ? "s" : ""} selected for reports`
                        : "No metric selected"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 bg-white border-t-2 border-gray-200 flex gap-3">
              <button
                onClick={handleReset}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold cursor-pointer"
              >
                Reset
              </button>

              <button
                onClick={handleGenerate}
                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${reportSection === "reportType"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  }`}
                disabled={reportSection !== "reportType"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMonthCalendar && (
        <MonthCalendar
          onClose={() => setShowMonthCalendar(false)}
          onApply={(months) => {
            setSelectedMonths(months);
            setShowMonthCalendar(false);
          }}
          selectedMonths={selectedMonths}
        />
      )}
    </>
  );
}




// Chart Modal with Real-time Gender Breakdown - RESPONSIVE HEIGHT VERSION
function ChartModal({ isOpen, onClose, title, children, showGenderBreakdown, genderData }) {
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{
        backdropFilter: "blur(4px)",
        backgroundColor: "rgba(0, 0, 0, 0.6)"
      }}
    >
      <div
        className="bg-white rounded-2xl border-2 border-emerald-200 w-1/2 flex flex-col"
        style={{
          maxWidth: "95vw",
          maxHeight: "95vh", // Changed from fixed height
          width: "auto",
          minWidth: "800px",
          boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-white border-b-2 border-emerald-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h3 className="text-lg font-bold text-emerald-800 truncate pr-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-all"
            style={{ fontSize: '1.875rem', lineHeight: '1' }}
          >
            ×
          </button>
        </div>

        {/* Scrollable Content - Auto height based on content */}
        <div className="overflow-y-auto p-6">
          {children}

          {showGenderBreakdown && genderData && (
            <div className="mt-6 pt-4 border-t-2 border-gray-200">
              <h4 className="text-lg font-bold text-gray-800 mb-3">
                Real-time Gender Breakdown
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="p-4 rounded-xl transition-all hover:scale-105"
                  style={{
                    backgroundColor: "#eff6ff",
                    border: "2px solid #bfdbfe"
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-base font-semibold flex items-center gap-2"
                      style={{ color: "#1e40af" }}
                    >
                      <img src={MaleIcon} alt="Male Icon" className="w-4 h-4" /> Male
                    </span>
                  </div>
                  <p
                    className="text-3xl font-extrabold"
                    style={{ color: "#2563eb" }}
                  >
                    {genderData.male}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "#2563eb" }}
                  >
                    {genderData.malePercentage}% of total
                  </p>
                </div>
                <div
                  className="p-4 rounded-xl transition-all hover:scale-105"
                  style={{
                    backgroundColor: "#fdf2f8",
                    border: "2px solid #fbcfe8"
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-base font-semibold flex items-center gap-2"
                      style={{ color: "#9d174d" }}
                    >
                      <img src={FemaleIcon} alt="Female Icon" className="w-4 h-4" /> Female
                    </span>
                  </div>
                  <p
                    className="text-3xl font-extrabold"
                    style={{ color: "#db2777" }}
                  >
                    {genderData.female}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "#db2777" }}
                  >
                    {genderData.femalePercentage}% of total
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Male", value: genderData.male },
                        { name: "Female", value: genderData.female },
                      ]}
                      dataKey="value"
                      innerRadius={35}
                      outerRadius={50}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      <Cell fill={COLORS.gender.male} />
                      <Cell fill={COLORS.gender.female} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// PDF Generation Loading Overlay
function PDFLoadingOverlay({ isVisible }) {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-9999 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-2xl flex flex-col items-center gap-5 relative overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-32 h-32 bg-emerald-600 rounded-full animate-ping"></div>
        </div>

        {/* Main spinner */}
        <div className="relative">
          <svg className="animate-spin h-16 w-16" viewBox="0 0 50 50">
            <circle
              className="opacity-25"
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              style={{ color: '#10b981' }}
            />
            <circle
              className="opacity-75"
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray="80"
              strokeDashoffset="60"
              strokeLinecap="round"
              style={{ color: '#059669' }}
            />
          </svg>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        <div className="text-center z-10">
          <p className="text-emerald-700 font-bold text-xl mb-2">Generating PDF Report</p>
          <p className="text-gray-600 text-sm">This may take a few moments...</p>
        </div>
      </div>
    </div>
  );
}

// Validation Error Popup
function ValidationErrorPopup({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-9999 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-[0_8px_25px_rgba(0,0,0,0.25)] w-full max-w-sm animate-fadeInScale border border-red-300 overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 px-6 py-3">
          <h3 className="text-lg font-semibold text-white tracking-wide">
            Error
          </h3>
        </div>

        {/* Message */}
        <div className="px-6 py-5 bg-white">
          <p className="text-gray-800 text-[15px] leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer with right-aligned OK */}
        <div className="px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-600 text-white rounded-md font-medium shadow hover:bg-red-700 transition-all active:scale-95 cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Functions for drawing charts in PDF
const drawPieChart = (doc, data, startX, startY, radius) => {
  let total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return;

  let startAngle = 0;
  const colors = [
    [52, 152, 219],   // Blue
    [233, 30, 99],    // Pink
    [39, 174, 96],    // Green
    [241, 196, 15],   // Yellow
    [142, 68, 173]    // Purple
  ];

  let i = 0;
  for (const [key, value] of Object.entries(data)) {
    if (value === 0) continue;

    const sliceAngle = (value / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    // Colors
    doc.setFillColor(...colors[i % colors.length]);
    doc.setDrawColor(255, 255, 255); // white borders

    // Wedge endpoints
    const x1 = startX + radius * Math.cos(startAngle);
    const y1 = startY + radius * Math.sin(startAngle);
    const x2 = startX + radius * Math.cos(endAngle);
    const y2 = startY + radius * Math.sin(endAngle);

    // Draw slice (triangle approximation)
    doc.lines(
      [
        [x1 - startX, y1 - startY],
        [x2 - x1, y2 - y1],
        [startX - x2, startY - y2],
      ],
      startX,
      startY,
      [1, 1],
      "F"
    );

    // Draw arc outline
    doc.circle(startX, startY, radius);

    // Draw legend
    const legendY = startY - radius + (i * 10);
    doc.setFillColor(...colors[i % colors.length]);
    doc.rect(startX + radius + 10, legendY, 5, 5, "F");

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.text(
      `${key} (${Math.round((value / total) * 100)}%)`,
      startX + radius + 20,
      legendY + 4
    );

    startAngle = endAngle;
    i++;
  }
};

const drawBarChart = (doc, data, startX, startY, width, height) => {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5); // Top 5
  if (entries.length === 0) return;

  const maxValue = Math.max(...entries.map(e => e[1]));
  const barWidth = (width / entries.length) - 5;

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  entries.forEach((entry, index) => {
    const barHeight = (entry[1] / maxValue) * height;
    const x = startX + (index * (barWidth + 5));
    const y = startY + height - barHeight;

    doc.setFillColor(39, 174, 96); // Emerald Green
    doc.rect(x, y, barWidth, barHeight, 'F');

    // Label
    doc.text(entry[0].substring(0, 8), x + (barWidth / 2), startY + height + 5, { align: 'center' });
    // Value
    doc.text(String(entry[1]), x + (barWidth / 2), y - 2, { align: 'center' });
  });
};

// MAIN DASHBOARD COMPONENT
export default function DashboardPage() {
  const { ngoCode } = useParams();
  const [dashboardData, setDashboardData] = useState({
    ngoName: "",
    ngoCode: "",
    ngoLogo: "",
    totalVolunteers: 0,
    pendingApplications: 0,
    completionRate: 0,
    participationRate: 0,
    activeEvents: 0,
    beneficiaryReach: 0,
    feedbackScore: 5,
    events: [],
    volunteerGenderData: {
      male: 0,
      female: 0,
      malePercentage: 0,
      femalePercentage: 0,
    },
  });

  const [chartData, setChartData] = useState({
    growth: [],
    applications: { data: [], forecast: 0 },
    eventsPerformance: [],
    monthlyVolunteerData: [],
  });

  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [viewingContext, setViewingContext] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, type: null });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true" || false
  );

  const [draggableItems, setDraggableItems] = useState(() => {
    const saved = localStorage.getItem("dashboardLayout");
    return saved
      ? JSON.parse(saved)
      : [
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
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    dateRange: "all",
    selectedEvent: "all",
    gender: "all",
    status: "all",
    volunteerRange: "all",
    customDateFrom: "",
    customDateTo: "",
    selectedMonths: [],
    selectedMetrics: [],
  });

  useEffect(() => {
    initializeDashboard();
  }, [ngoCode]);

  useEffect(() => {
    localStorage.setItem("dashboardLayout", JSON.stringify(draggableItems));
  }, [draggableItems]);

  useEffect(() => {
    if (viewingContext?.ngo_code) {
      applyFiltersToData();
    }
  }, [activeFilters]);

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
      setValidationError("Error fetching dashboard data. Please try again.");
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

      // Ensure registeredVols is always an array
      const volunteerIds = (registeredVols || [])
        .filter((vol) => {
          if (!vol.joined_ngo) return false;
          const ngoCodes = vol.joined_ngo.split("-");
          return ngoCodes.includes(ngoCode);
        })
        .map((v) => v.user_id);

      const totalVolunteers = volunteerIds.length;
      const genderData = await fetchGenderDataRealtime(volunteerIds, setValidationError);

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
        ngoLogo: ngoInfo?.ngo_logo || "",
        totalVolunteers,
        pendingApplications,
        completionRate,
        participationRate,
        activeEvents,
        beneficiaryReach,
        feedbackScore: 5,
        events: events || [],
        volunteerGenderData: genderData,
      });

      await generateGrowthData(ngoCode);
      await generateApplicationsData(ngoCode);
      await generateMonthlyVolunteerData(ngoCode);
      generateEventsPerformanceData(events || []);
    } catch (error) {
      setValidationError("Error fetching dashboard data. Please try again.");
    }
  };

  const applyFiltersToData = async () => {
    if (!viewingContext?.ngo_code) return;

    try {
      let query = supabase
        .from("Event_Information")
        .select("*")
        .eq("ngo_id", viewingContext.ngo_code);

      if (activeFilters.dateRange !== "all") {
        const now = new Date();
        let startDate;

        switch (activeFilters.dateRange) {
          case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case "yesterday":
            startDate = new Date(now.setDate(now.getDate() - 1));
            break;
          case "1week":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "1month":
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case "thisMonth":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "lastMonth":
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            break;
          case "custom":
            if (activeFilters.customDateFrom) {
              query = query.gte("date", activeFilters.customDateFrom);
            }
            if (activeFilters.customDateTo) {
              query = query.lte("date", activeFilters.customDateTo);
            }
            break;
        }

        if (
          startDate &&
          activeFilters.dateRange !== "custom" &&
          activeFilters.dateRange !== "specific-months"
        ) {
          query = query.gte("date", startDate.toISOString().split("T")[0]);
        }
      }

      if (activeFilters.selectedEvent !== "all") {
        query = query.eq("event_id", activeFilters.selectedEvent);
      }

      if (activeFilters.status !== "all") {
        query = query.eq("status", activeFilters.status);
      }

      const { data: filteredEvents } = await query.order("date", {
        ascending: false,
      });

      let finalEvents = filteredEvents || [];
      if (activeFilters.volunteerRange !== "all") {
        finalEvents = finalEvents.filter((event) => {
          const volCount = parseInt(event.volunteer_joined) || 0;
          switch (activeFilters.volunteerRange) {
            case "1-50":
              return volCount >= 1 && volCount <= 50;
            case "51-100":
              return volCount >= 51 && volCount <= 100;
            case "101-200":
              return volCount >= 101 && volCount <= 200;
            case "201+":
              return volCount >= 201;
            default:
              return true;
          }
        });
      }

      if (
        activeFilters.dateRange === "specific-months" &&
        activeFilters.selectedMonths.length > 0
      ) {
        finalEvents = finalEvents.filter((event) => {
          if (!event.date) return false;
          const eventMonth = event.date.substring(0, 7);
          return activeFilters.selectedMonths.includes(eventMonth);
        });
      }

      let filteredVolunteerIds = [];

      if (finalEvents.length > 0) {
        const eventIds = finalEvents.map((e) => e.event_id);

        const { data: eventUsers } = await supabase
          .from("Event_User")
          .select("user_id, event_id")
          .eq("ngo_id", viewingContext.ngo_code)
          .in("event_id", eventIds);

        if (eventUsers && eventUsers.length > 0) {
          filteredVolunteerIds = [
            ...new Set(eventUsers.map((eu) => eu.user_id)),
          ];
        }
      } else {
        const { data: registeredVols } = await supabase
          .from("Registered_Volunteers")
          .select("user_id, joined_ngo")
          .like("joined_ngo", `%${viewingContext.ngo_code}%`);

        filteredVolunteerIds =
          registeredVols
            ?.filter((vol) => {
              if (!vol.joined_ngo) return false;
              const ngoCodes = vol.joined_ngo.split("-");
              return ngoCodes.includes(viewingContext.ngo_code);
            })
            .map((v) => v.user_id) || [];
      }

      if (activeFilters.gender !== "all") {
        const { data: usersData } = await supabase
          .from("LoginInformation") // FIX: Changed from User_Information
          .select("user_id, gender")
          .in("user_id", filteredVolunteerIds)
          .eq("gender", activeFilters.gender);

        filteredVolunteerIds = usersData?.map((u) => u.user_id) || [];
      }

      const genderData = await fetchGenderDataRealtime(filteredVolunteerIds, setValidationError);
      const totalFiltered = filteredVolunteerIds.length;

      const completedEvents = finalEvents.filter(
        (e) => e.status === "COMPLETED"
      ).length;
      const totalEvents = finalEvents.length;
      const completionRate =
        totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

      let participationRate = 0;
      if (filteredVolunteerIds.length > 0 && finalEvents.length > 0) {
        const eventIds = finalEvents.map((e) => e.event_id);
        const { data: eventUsers } = await supabase
          .from("Event_User")
          .select("user_id")
          .eq("ngo_id", viewingContext.ngo_code)
          .in("event_id", eventIds)
          .in("user_id", filteredVolunteerIds);

        const uniqueParticipants = new Set(
          eventUsers?.map((eu) => eu.user_id) || []
        ).size;
        participationRate = Math.round(
          (uniqueParticipants / filteredVolunteerIds.length) * 100
        );
      }

      setDashboardData((prev) => ({
        ...prev,
        events: finalEvents,
        completionRate,
        totalVolunteers: totalFiltered,
        participationRate,
        volunteerGenderData: genderData,
      }));

      generateEventsPerformanceData(finalEvents);
      await generateMonthlyVolunteerDataFiltered(
        viewingContext.ngo_code,
        finalEvents,
        filteredVolunteerIds
      );
    } catch (error) {
  setValidationError("Error applying filters. Please try again.");
    }
  };

  const generateMonthlyVolunteerDataFiltered = async (
    ngoCode,
    events,
    filteredVolunteerIds
  ) => {
    try {
      if (events.length === 0) return;

      const eventIds = events.map((e) => e.event_id);

      const { data: eventUsers } = await supabase
        .from("Event_User")
        .select("user_id, date_joined, event_id")
        .eq("ngo_id", ngoCode)
        .in("event_id", eventIds);

      if (!eventUsers || eventUsers.length === 0) return;

      let filteredEventUsers = eventUsers;
      if (filteredVolunteerIds && filteredVolunteerIds.length > 0) {
        filteredEventUsers = eventUsers.filter((eu) =>
          filteredVolunteerIds.includes(eu.user_id)
        );
      }

      const userIds = [...new Set(filteredEventUsers.map((eu) => eu.user_id))];
      const { data: usersData } = await supabase
        .from("LoginInformation") // FIX: Changed from User_Information
        .select("user_id, gender")
        .in("user_id", userIds);

      const userGenderMap = {};
      usersData?.forEach((user) => {
        userGenderMap[user.user_id] = user.gender;
      });

      const monthlyData = {};
      filteredEventUsers.forEach((eu) => {
        if (!eu.date_joined) return;
        const month = eu.date_joined.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { male: 0, female: 0, total: 0 };
        }
        monthlyData[month].total++;
        const gender = userGenderMap[eu.user_id];
        if (gender === "Male") monthlyData[month].male++;
        else if (gender === "Female") monthlyData[month].female++;
      });

      const sortedMonths = Object.keys(monthlyData).sort();
      const monthlyVolunteerData = sortedMonths.map((month) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        male: monthlyData[month].male,
        female: monthlyData[month].female,
        total: monthlyData[month].total,
      }));

      setChartData((prev) => ({ ...prev, monthlyVolunteerData }));
    } catch (error) {
  setValidationError("Error generating volunteer data. Please try again.");
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
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
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
  setValidationError("Error generating growth data. Please try again.");
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
  setValidationError("Error generating applications data. Please try again.");
    }
  };

  const generateMonthlyVolunteerData = async (ngoCode) => {
    try {
      const { data: eventUsers } = await supabase
        .from("Event_User")
        .select("user_id, date_joined, event_id")
        .eq("ngo_id", ngoCode);

      if (!eventUsers || eventUsers.length === 0) return;

      const userIds = [...new Set(eventUsers.map((eu) => eu.user_id))];
      const { data: usersData } = await supabase
        .from("LoginInformation") // FIX: Changed from User_Information
        .select("user_id, gender")
        .in("user_id", userIds);

      const userGenderMap = {};
      usersData?.forEach((user) => {
        userGenderMap[user.user_id] = user.gender;
      });

      const monthlyData = {};
      eventUsers.forEach((eu) => {
        if (!eu.date_joined) return;
        const month = eu.date_joined.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { male: 0, female: 0, total: 0 };
        }
        monthlyData[month].total++;
        const gender = userGenderMap[eu.user_id];
        if (gender === "Male") monthlyData[month].male++;
        else if (gender === "Female") monthlyData[month].female++;
      });

      const sortedMonths = Object.keys(monthlyData).sort();
      const monthlyVolunteerData = sortedMonths.map((month) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        male: monthlyData[month].male,
        female: monthlyData[month].female,
        total: monthlyData[month].total,
      }));

      setChartData((prev) => ({ ...prev, monthlyVolunteerData }));
    } catch (error) {
  setValidationError("Error generating monthly volunteer data. Please try again.");
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

  // Helper function to add logo to PDF
  const addLogo = async (doc, x, y, width, height, opacity = 1) => {
    if (!dashboardData.ngoLogo) return;

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = dashboardData.ngoLogo;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      if (opacity < 1) {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity }));
      }

      doc.addImage(img, "PNG", x, y, width, height);

      if (opacity < 1) {
        doc.restoreGraphicsState();
      }
    } catch (error) {
    }
  };

  // Helper function to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper function to format time
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to calculate duration
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "N/A";
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diff = Math.abs(end - start) / 36e5; // hours
    return `${diff.toFixed(1)} hours`;
  };

  // Calculate non-participants
  const calculateNonParticipants = async (ngoCode, filteredEvents, allVolunteerIds) => {
    try {
      const eventIds = filteredEvents.map(e => e.event_id);
      const { data: eventUsers } = await supabase.from("Event_User").select("user_id").eq("ngo_id", ngoCode).in("event_id", eventIds).eq("status", "ONGOING"); // Changed to ONGOING per DB
      const participatedUserIds = new Set(eventUsers?.map(eu => eu.user_id) || []);
      const nonParticipants = allVolunteerIds.filter(id => !participatedUserIds.has(id));
      return nonParticipants.length;
} catch (error) { 
  setValidationError("Error calculating non-participants.");
  return 0; 
}
  };

  // Calculate attendance
  const calculateAttendance = async (ngoCode, filteredEvents) => {
    try {
      const eventIds = filteredEvents.map(e => e.event_id);
      // Attendance based on Task_Submissions existence for the event
      const { data: taskSubmissions } = await supabase.from("Task_Submissions").select("user_id, event_id").in("event_id", eventIds);
      const uniqueAttendees = new Set(taskSubmissions?.map(ts => ts.user_id) || []);
      return {
        total: uniqueAttendees.size,
        byEvent: filteredEvents.map(event => ({
          event_id: event.event_id,
          event_title: event.event_title,
          attended: new Set(taskSubmissions?.filter(ts => ts.event_id === event.event_id).map(ts => ts.user_id)).size
        }))
      };
} catch (error) { 
  setValidationError("Error calculating attendance.");
  return { total: 0, byEvent: [] }; 
}
  };

  // Calculate certifications  
  const calculateCertifications = async (ngoCode, filteredEvents, startDate, endDate) => {
    try {
      const eventIds = filteredEvents.map(e => e.event_id);
      let query = supabase.from("Certificate").select("certificate_id, user_id, event_id, date_created").in("event_id", eventIds);
      if (startDate) query = query.gte("date_created", startDate);
      if (endDate) query = query.lte("date_created", endDate);
      const { data: certificates } = await query;
      return {
        total: certificates?.length || 0,
        byEvent: filteredEvents.map(event => ({ event_id: event.event_id, event_title: event.event_title, certificates: certificates?.filter(cert => cert.event_id === event.event_id).length || 0 }))
      };
} catch (error) { 
  setValidationError("Error calculating certifications.");
  return { total: 0, byEvent: [] }; 
}
  };

  const handleGenerateReport = async (selectedData, selectedYear, reportType) => {
    try {
      setReportModalOpen(false);
      setPdfLoading(true);
      const ngoCode = viewingContext?.ngo_code;
if (!ngoCode) { 
  setPdfLoading(false); 
  setValidationError("NGO code not found. Please try again.");
  return; 
}
      let selectedMonth, selectedMonths;
      let isAnnualReport = false;
      let reportTitle;

      if (reportType === "single") {
        selectedMonth = selectedData;
        const monthName = new Date(selectedYear, selectedData - 1).toLocaleString("default", { month: "long" });
        reportTitle = `Monthly Report: ${monthName} ${selectedYear}`;
      } else if (reportType === "multiple") {
        selectedMonths = selectedData;
        reportTitle = `Multi-Month Report (${selectedMonths.length} months) - ${selectedYear}`;
      } else if (reportType === "annual") {
        isAnnualReport = true;
        reportTitle = `Annual Report ${selectedYear}`;
      }

      const [eventsResult, eventUsersResult, applicationsResult, taskSubmissionsResult, registeredVolunteersResult] = await Promise.all([
        supabase.from("Event_Information").select("*").eq("ngo_id", ngoCode),
        supabase.from("Event_User").select("user_id, event_id, status, date_joined").eq("ngo_id", ngoCode),
        supabase.from("Application_Status").select("application_id, date_application, result").eq("ngo_id", ngoCode),
        supabase.from("Task_Submissions").select("user_id, event_id, status"),
        supabase.from("Registered_Volunteers").select("user_id, joined_ngo").like("joined_ngo", `%${ngoCode}%`)
      ]);

      const events = eventsResult.data || [];
      const eventUsers = eventUsersResult.data || [];
      const applications = applicationsResult.data || [];
      const taskSubmissions = taskSubmissionsResult.data || [];
      const registeredVolunteers = registeredVolunteersResult.data || [];

if (events.length === 0) { 
  setPdfLoading(false); 
  setValidationError("No events found for the selected period.");
  return; 
}
      const allUserIds = [...new Set(eventUsers.map(u => u.user_id))];
      let userProfiles = [];
      if (allUserIds.length > 0) {
        const [loginResult, profileResult] = await Promise.all([
          supabase.from("LoginInformation").select("user_id, gender").in("user_id", allUserIds),
          supabase.from("LoginInformation").select("user_id, birthdate, city").in("user_id", allUserIds)
        ]);
        const loginData = loginResult.data || [];
        const profileData = profileResult.data || [];
        userProfiles = allUserIds.map(userId => {
          const login = loginData.find(l => l.user_id === userId);
          const profile = profileData.find(p => p.user_id === userId);
          return { user_id: userId, sex: login?.gender, birthdate: profile?.birthdate, city: profile?.city };
        });
      }

      let filteredEvents;
      if (isAnnualReport) {
        filteredEvents = events.filter((ev) => ev.date && new Date(ev.date).getFullYear() === parseInt(selectedYear));
      } else if (reportType === "multiple") {
        filteredEvents = events.filter((ev) => { if (!ev.date) return false; const eventMonth = ev.date.substring(0, 7); return selectedMonths.includes(eventMonth); });
      } else {
        filteredEvents = events.filter((ev) => { if (!ev.date) return false; const d = new Date(ev.date); return (d.getMonth() + 1 === parseInt(selectedMonth) && d.getFullYear() === parseInt(selectedYear)); });
      }

if (!filteredEvents || filteredEvents.length === 0) { 
  setPdfLoading(false); 
  setValidationError("No events found for the selected period.");
  return; 
}
      const sortedEvents = filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
      const eventIdsInReport = sortedEvents.map(e => e.event_id);
      const reportEventUsers = eventUsers.filter(eu => eventIdsInReport.includes(eu.event_id));
      const reportTaskSubmissions = taskSubmissions.filter(ts => eventIdsInReport.includes(ts.event_id));
      const totalNgoVolunteers = registeredVolunteers.filter(vol => vol.joined_ngo?.split('-').includes(ngoCode)).length;

      const getEventMetrics = (event, allEventUsers, allTaskSubmissions) => {
        const eventUsers = allEventUsers.filter(eu => eu.event_id === event.event_id);
        // FIX: Check for ONGOING status based on your DB data for active volunteers
        const approvedUsers = eventUsers.filter(eu => eu.status === "ONGOING" || eu.status === "APPROVED");
        const rejectedUsers = eventUsers.filter(eu => eu.status === "REJECT" || eu.status === "REJECTED");
        const approvedUserIds = approvedUsers.map(eu => eu.user_id);

        // FIX: Attendance based on having ANY submission for the event
        const attendedUserIds = allTaskSubmissions.filter(ts => ts.event_id === event.event_id).map(ts => ts.user_id);
        const uniqueAttendedUserIds = [...new Set(attendedUserIds)];

        const metrics = {
          totalSignups: eventUsers.length,
          approvedCount: approvedUsers.length,
          pendingCount: eventUsers.filter(eu => eu.status === "PENDING").length,
          rejectedCount: rejectedUsers.length, // Added Rejected Count
          attendanceCount: uniqueAttendedUserIds.length,
        };

        metrics.attendanceRate = metrics.approvedCount > 0
          ? ((metrics.attendanceCount / metrics.approvedCount) * 100).toFixed(0) + "%"
          : "0%";

        metrics.participationRate = totalNgoVolunteers > 0
          ? ((metrics.approvedCount / totalNgoVolunteers) * 100).toFixed(1) + "%"
          : "N/A";

        return metrics;
      };

      const getDemographics = (userIds, allUserProfiles) => {
        const profiles = allUserProfiles.filter(p => userIds.includes(p.user_id));
        const demographics = { gender: {}, ageGroups: { 'Under 18': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0, 'Unknown': 0 }, locations: {} };
        profiles.forEach(p => {
          const sex = p.sex || 'Unknown';
          demographics.gender[sex] = (demographics.gender[sex] || 0) + 1;
          if (p.birthdate) {
            try {
              const age = new Date().getFullYear() - new Date(p.birthdate).getFullYear();
              if (age < 18) demographics.ageGroups['Under 18']++;
              else if (age <= 24) demographics.ageGroups['18-24']++;
              else if (age <= 34) demographics.ageGroups['25-34']++;
              else if (age <= 44) demographics.ageGroups['35-44']++;
              else if (age <= 54) demographics.ageGroups['45-54']++;
              else demographics.ageGroups['55+']++;
            } catch { demographics.ageGroups['Unknown']++; }
          } else { demographics.ageGroups['Unknown']++; }
          const city = p.city || 'Unknown';
          demographics.locations[city] = (demographics.locations[city] || 0) + 1;
        });
        return demographics;
      };

      const processedEvents = sortedEvents.map(event => {
        const metrics = getEventMetrics(event, reportEventUsers, reportTaskSubmissions);
        const approvedUserIds = reportEventUsers.filter(eu => eu.event_id === event.event_id && (eu.status === "ONGOING" || eu.status === "APPROVED")).map(eu => eu.user_id);
        const demographics = getDemographics(approvedUserIds, userProfiles);
        return { ...event, metrics, demographics };
      });

      const doc = new jsPDF("l", "mm", "a4");
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      let y = 25;

      // PAGE 1: COVER PAGE
      if (dashboardData.ngoLogo) { await addLogo(doc, pageW / 2 - 35, 20, 70, 70); }
      y = 100;
      doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(0, 100, 0);
      doc.text(dashboardData.ngoName || "CENTRO Organization", pageW / 2, y, { align: "center" });
      y += 12; doc.setFontSize(18); doc.setTextColor(0, 0, 0);
      doc.text("Organization Accomplishment Report", pageW / 2, y, { align: "center" });
      y += 12; doc.setFontSize(14);
      doc.text(reportTitle, pageW / 2, y, { align: "center" });

      // PAGE 2: OVERALL REPORT SUMMARY
      doc.addPage();
      y = 25;
      if (dashboardData.ngoLogo) { await addLogo(doc, pageW - 35, pageH - 35, 25, 25, 0.06); }
      doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(0, 100, 0);
      doc.text("Overall Report Summary", 14, y);
      y += 10;

      const totalSignups = processedEvents.reduce((sum, e) => sum + e.metrics.totalSignups, 0);
      const totalApproved = processedEvents.reduce((sum, e) => sum + e.metrics.approvedCount, 0);
      const totalAttended = processedEvents.reduce((sum, e) => sum + e.metrics.attendanceCount, 0);

      let filteredApplications = applications || [];
      if (isAnnualReport) {
        filteredApplications = filteredApplications.filter(app => { if (!app.date_application) return false; const appDate = new Date(app.date_application); return appDate.getFullYear() === parseInt(selectedYear); });
      } else {
        // Simplified for brevity in multiple/single logic
        filteredApplications = filteredApplications.filter(app => { if (!app.date_application) return false; const appDate = new Date(app.date_application); return appDate.getFullYear() === parseInt(selectedYear) && (reportType === 'single' ? appDate.getMonth() + 1 === parseInt(selectedMonth) : selectedMonths.includes(app.date_application.substring(0, 7))); });
      }
      const totalApplications = filteredApplications.length;

      doc.setFontSize(11); doc.setTextColor(0, 0, 0);
      doc.text(`•  Total Events in Period: ${processedEvents.length}`, 16, y); y += 6;
      doc.text(`•  Total Event Signups: ${totalSignups}`, 16, y); y += 6;
      // Count unique approved across all selected events
      const uniqueApprovedAll = [...new Set(reportEventUsers.filter(eu => eu.status === 'ONGOING' || eu.status === 'APPROVED').map(eu => eu.user_id))].length;
      doc.text(`•  Total Approved Volunteers (Unique): ${uniqueApprovedAll}`, 16, y); y += 6;
      // Count unique attended across all selected events
      const uniqueAttendedAll = [...new Set(reportTaskSubmissions.map(ts => ts.user_id))].length;
      doc.text(`•  Total Attended Volunteers (Unique): ${uniqueAttendedAll}`, 16, y); y += 6;
      doc.text(`•  Total New Applications in Period: ${totalApplications}`, 16, y); y += 6;
      doc.text(`•  Total Registered Volunteers (NGO-wide): ${totalNgoVolunteers}`, 16, y); y += 10;

      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(0, 100, 0);
      doc.text("Event Summary Table", 14, y);
      y += 6;

      const summaryTableHeaders = ["Event ID", "Title", "Date", "Status", "Signups", "Approved", "Rejected", "Attendance", "Attendance Rate", "Participation Rate"];
      const summaryTableBody = processedEvents.map(e => [
        e.event_id, e.event_title, formatDate(e.date), e.status || "N/A",
        e.metrics.totalSignups, e.metrics.approvedCount, e.metrics.rejectedCount, e.metrics.attendanceCount,
        e.metrics.attendanceRate, e.metrics.participationRate
      ]);

      autoTable(doc, { startY: y, head: [summaryTableHeaders], body: summaryTableBody, theme: 'grid', headStyles: { fillColor: [0, 100, 0] }, styles: { fontSize: 8 } });
      y = doc.lastAutoTable.finalY + 10;

      // PAGE 3: OVERALL DEMOGRAPHICS SUMMARY
      doc.addPage();
      y = 25;
      if (dashboardData.ngoLogo) { await addLogo(doc, pageW - 35, pageH - 35, 25, 25, 0.06); }
      doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(0, 100, 0);
      doc.text("Overall Volunteer Demographics", 14, y);
      y += 10;
      doc.setFontSize(10); doc.setTextColor(0, 0, 0);
      doc.text("(Based on all unique approved volunteers for events in this period)", 14, y);
      y += 10;

      const allApprovedUserIds = [...new Set(reportEventUsers.filter(eu => eu.status === "ONGOING" || eu.status === "APPROVED").map(eu => eu.user_id))];
      const overallDemographics = getDemographics(allApprovedUserIds, userProfiles);

      const col1X = 14; const col2X = pageW / 3 + 10; const col3X = (pageW / 3) * 2 + 10;
      const tableWidth = pageW / 3 - 20;
      let y_col1 = y, y_col2 = y, y_col3 = y;

      // Gender
      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("Gender Distribution", col1X, y_col1); y_col1 += 6;
      autoTable(doc, { startY: y_col1, head: [['Gender', 'Count']], body: Object.entries(overallDemographics.gender).map(([key, value]) => [key, value]), theme: 'grid', headStyles: { fillColor: [0, 100, 0] }, margin: { right: pageW - (col1X + tableWidth) } });
      y_col1 = doc.lastAutoTable.finalY + 10;
      // Pie Chart for Gender
      drawPieChart(doc, overallDemographics.gender, col1X + 25, y_col1 + 20, 20);

      // Age
      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("Age Distribution", col2X, y_col2); y_col2 += 6;
      autoTable(doc, { startY: y_col2, head: [['Age Group', 'Count']], body: Object.entries(overallDemographics.ageGroups).map(([key, value]) => [key, value]), theme: 'grid', headStyles: { fillColor: [0, 100, 0] }, margin: { left: col2X, right: pageW - (col2X + tableWidth) } });
      y_col2 = doc.lastAutoTable.finalY;

      // Location
      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("Location Distribution (Top 5)", col3X, y_col3); y_col3 += 6;
      const topLocations = Object.entries(overallDemographics.locations).sort((a, b) => b[1] - a[1]).slice(0, 10);
      autoTable(doc, { startY: y_col3, head: [['City', 'Count']], body: topLocations, theme: 'grid', headStyles: { fillColor: [0, 100, 0] }, margin: { left: col3X } });
      y_col3 = doc.lastAutoTable.finalY + 10;
      // Bar Chart for Location
      drawBarChart(doc, overallDemographics.locations, col3X, y_col3, tableWidth, 40);

      // PAGE 4+: INDIVIDUAL EVENT REPORTS
      for (const event of processedEvents) {
        doc.addPage();
        y = 25;
        if (dashboardData.ngoLogo) { await addLogo(doc, pageW - 35, pageH - 35, 25, 25, 0.06); }
        doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(0, 100, 0);
        const eventTitle = event.event_title || "Untitled Event";
        doc.text(`Detailed Report for: ${eventTitle}`, 14, y);
        y += 10;

        const detailsTableWidth = pageW / 2 - 20;
        const metricsTableX = pageW / 2 + 5;

        const detailsBody = [
          ["Event ID", event.event_id],
          ["Date", formatDate(event.date)],
          ["Time", `${formatTime(event.time_start)} – ${formatTime(event.time_end)}`],
          ["Duration", calculateDuration(event.time_start, event.time_end)],
          ["Location", event.location || "TBA"],
          ["Status", event.status || "N/A"]
        ];
        autoTable(doc, { startY: y, head: [['Field', 'Value']], body: detailsBody, theme: 'grid', headStyles: { fillColor: [0, 100, 0] }, margin: { right: pageW - (14 + detailsTableWidth) } });
        let y_left = doc.lastAutoTable.finalY;

        const metricsBody = [
          ["Total Signups", event.metrics.totalSignups],
          ["Approved", event.metrics.approvedCount],
          ["Pending", event.metrics.pendingCount],
          ["Rejected", event.metrics.rejectedCount],
          ["Attended", event.metrics.attendanceCount],
          ["Attendance Rate", event.metrics.attendanceRate + " (Attended / Approved)"],
          ["Participation Rate", event.metrics.participationRate + " (Approved / Total NGO Vols)"]
        ];
        autoTable(doc, { startY: y, head: [['Metric', 'Value']], body: metricsBody, theme: 'grid', headStyles: { fillColor: [0, 100, 0] }, margin: { left: metricsTableX } });
        let y_right = doc.lastAutoTable.finalY;

        y = Math.max(y_left, y_right) + 10;

        doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(0, 100, 0);
        doc.text("Event-Specific Volunteer Demographics", 14, y);
        y += 8;

        let y_col1_event = y, y_col2_event = y, y_col3_event = y;

        // Event Gender
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("Gender", col1X, y_col1_event); y_col1_event += 5;
        autoTable(doc, { startY: y_col1_event, head: [['Gender', 'Count']], body: Object.entries(event.demographics.gender).map(([key, value]) => [key, value]), theme: 'grid', headStyles: { fillColor: [0, 100, 0] }, styles: { fontSize: 8 }, margin: { right: pageW - (col1X + tableWidth) } });
        y_col1_event = doc.lastAutoTable.finalY + 10;
        drawPieChart(doc, event.demographics.gender, col1X + 25, y_col1_event + 20, 15);

        // Event Age
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("Age", col2X, y_col2_event); y_col2_event += 5;
        autoTable(doc, { startY: y_col2_event, head: [['Age Group', 'Count']], body: Object.entries(event.demographics.ageGroups).map(([key, value]) => [key, value]), theme: 'grid', headStyles: { fillColor: [0, 100, 0] }, styles: { fontSize: 8 }, margin: { left: col2X, right: pageW - (col2X + tableWidth) } });

        // Event Location
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("Location (Top 10)", col3X, y_col3_event); y_col3_event += 5;
        const eventTopLocations = Object.entries(event.demographics.locations).sort((a, b) => b[1] - a[1]).slice(0, 10);
        autoTable(doc, { startY: y_col3_event, head: [['City', 'Count']], body: eventTopLocations, theme: 'grid', headStyles: { fillColor: [0, 100, 0] }, styles: { fontSize: 8 }, margin: { left: col3X } });
        y_col3_event = doc.lastAutoTable.finalY + 10;
        drawBarChart(doc, event.demographics.locations, col3X, y_col3_event, tableWidth, 30);
      }

      // FINAL PAGE & FOOTER
      const totalPages = doc.internal.getNumberOfPages();
      const generatedDate = new Date().toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", });
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${totalPages}`, pageW / 2, pageH - 10, { align: "center" });
        doc.text(`Generated: ${generatedDate}`, 14, pageH - 10);
      }

      let fileName;
      if (isAnnualReport) { fileName = `${dashboardData.ngoName || "NGO"}_Annual_Report_${selectedYear}.pdf`; }
      else if (reportType === "multiple") { fileName = `${dashboardData.ngoName || "NGO"}_Multi_Month_Report_${selectedYear}.pdf`; }
      else { const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' }); fileName = `${dashboardData.ngoName || "NGO"}_${monthName}_${selectedYear}_Report.pdf`; }

      doc.save(fileName);
      setPdfLoading(false);
} catch (error) { 
  setValidationError("Error generating report. Please try again.");
  setPdfLoading(false); 
}
    };


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

    const draggedIndex = draggableItems.findIndex(
      (item) => item.id === draggedItem
    );
    const targetIndex = draggableItems.findIndex(
      (item) => item.id === targetId
    );

    const newItems = [...draggableItems];
    const [draggedElement] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedElement);

    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order: index,
    }));

    setDraggableItems(reorderedItems);
    setDraggedItem(null);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const downloadAsPDF = (cardType) => {
    alert(`Downloading ${cardType} report as PDF...`);
  };

  const downloadAsWord = (cardType) => {
    alert(`Downloading ${cardType} report as Word document...`);
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
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
        className={`transition-all duration-200 h-full ${isDragOver ? "ring-4 ring-emerald-400 scale-105" : ""
          }`}
        style={{ cursor: "grab" }}
      >

        <div className="relative h-full">
          <div className="absolute top-2 left-2 text-gray-400 z-10 cursor-move">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 5h2v14H9V5zm4 0h2v14h-2V5z" />
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
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
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
    ),
    volunteers: (
      <div
        onClick={() => openModal("volunteers")}
        className="bg-white p-4 text-center flex flex-col justify-center rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full min-h-[280px]"
      >
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
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
        <div className="mt-3 flex justify-center gap-4">
          <div className="text-center transform transition-all hover:scale-110">
            <p className="text-sm text-blue-600 font-semibold flex items-center justify-center gap-1">
              <img src={MaleIcon} alt="Male Icon" className="w-4 h-4" />{" "}
              {dashboardData.volunteerGenderData.male}
            </p>
            <p className="text-xs text-gray-500">
              Male ({dashboardData.volunteerGenderData.malePercentage}%)
            </p>
          </div>
          <div className="text-center transform transition-all hover:scale-110">
            <p className="text-sm text-pink-600 font-semibold flex items-center justify-center gap-1">
              <img src={FemaleIcon} alt="Female Icon" className="w-4 h-4" />{" "}
              {dashboardData.volunteerGenderData.female}
            </p>
            <p className="text-xs text-gray-500">
              Female ({dashboardData.volunteerGenderData.femalePercentage}%)
            </p>
          </div>
        </div>
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
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
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
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS.participation[index]}
                />
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
    ),
    applications: (
      <div
        onClick={() => openModal("applications")}
        className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative h-full"
      >
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
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
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
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
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
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
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
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
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
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

      <PDFLoadingOverlay isVisible={pdfLoading} />
      <ValidationErrorPopup 
  message={validationError} 
  onClose={() => setValidationError("")} 
/>


      <main
        className="flex-1 p-6 overflow-y-auto transition-all duration-300"
        style={{
          filter:
            modalState.isOpen || filterModalOpen || reportModalOpen  || pdfLoading || validationError
              ? "blur(3px)"
              : "none",
          marginLeft: sidebarCollapsed ? "5rem" : "16rem",
        }}
      >
        <div
          className="relative z-10 space-y-6 w-full mx-auto"
          style={{ maxWidth: "2000px" }}
        >
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
              onClick={() => setReportModalOpen(true)}
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

          {(activeFilters.dateRange !== "all" ||
            activeFilters.selectedEvent !== "all" ||
            activeFilters.gender !== "all" ||
            activeFilters.status !== "all" ||
            activeFilters.volunteerRange !== "all" ||
            activeFilters.selectedMetrics.length > 0) && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-emerald-800">
                      Filters:
                    </span>

                    {/* For date ranges OTHER than specific-months */}
                    {activeFilters.dateRange !== "all" && activeFilters.dateRange !== "specific-months" && (
                      <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                        {activeFilters.dateRange === "custom"
                          ? `${activeFilters.customDateFrom} to ${activeFilters.customDateTo}`
                          : activeFilters.dateRange}
                      </span>
                    )}

                    {/* Display individual selected months with comma separation */}
                    {activeFilters.dateRange === "specific-months" && activeFilters.selectedMonths.length > 0 && (
                      <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                        {activeFilters.selectedMonths
                          .map((month) =>
                            new Date(month + "-01").toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })
                          )
                          .join(", ")}
                      </span>
                    )}

                    {activeFilters.selectedEvent !== "all" && (
                      <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                        {dashboardData.events.find(
                          (e) => e.event_id === activeFilters.selectedEvent
                        )?.event_title || activeFilters.selectedEvent}
                      </span>
                    )}
                    {activeFilters.status !== "all" && (
                      <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                        {activeFilters.status}
                      </span>
                    )}
                    {activeFilters.gender !== "all" && (
                      <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm flex items-center gap-2">
                        {activeFilters.gender === "Male" ? (
                          <>
                            <img
                              src={MaleIcon}
                              alt="Male Icon"
                              className="w-4 h-4"
                            />
                            Male
                          </>
                        ) : (
                          <>
                            <img
                              src={FemaleIcon}
                              alt="Female Icon"
                              className="w-4 h-4"
                            />
                            Female
                          </>
                        )}
                      </span>
                    )}
                    {activeFilters.volunteerRange !== "all" && (
                      <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                        {activeFilters.volunteerRange}
                      </span>
                    )}
                    {activeFilters.selectedMetrics.length > 0 && (
                      <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                        {activeFilters.selectedMetrics
                          .map((metricValue) => {
                            const metricLabels = {
                              "Completion": "Project Completion",
                              "Volunteers": "Total Volunteers",
                              "Participation": "Participation Rate",
                              "Feedback": "Feedback Score",
                              "Growth": "Growth Rate",
                              "Beneficiaries": "Beneficiaries",
                              "Active Events": "Active Events",
                              "Non-Participants": "Non-Participants",
                              "Attendance": "Attendance",
                              "Certifications": "Certifications"
                            };
                            return metricLabels[metricValue] || metricValue;
                          })
                          .join(", ")}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      handleApplyFilters({
                        dateRange: "all",
                        selectedEvent: "all",
                        gender: "all",
                        status: "all",
                        volunteerRange: "all",
                        customDateFrom: "",
                        customDateTo: "",
                        selectedMonths: [],
                        selectedMetrics: []
                      })
                    }
                    className="text-emerald-700 hover:text-emerald-900 font-semibold text-sm cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

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
              <img
                src={CreateAnnouncementIcon}
                alt="Create Announcement"
                className="w-16 h-16"
              />
              <span>CREATE ANNOUNCEMENT</span>
            </Link>

            <Link
              to="/create-event"
              className="inline-flex items-center justify-center text-2xl text-emerald-900 font-bold font-montserrat p-5 gap-3 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#fbdb90" }}
            >
              <span>CREATE EVENT</span>
              <img
                src={CreateEventIcon}
                alt="Create Event"
                className="w-16 h-16"
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {getSortedItems()
              .slice(0, 3)
              .map((item) => (
                <div key={item.id} className="h-full">
                  {renderDraggableCard(item.id, cardComponents[item.id])}
                </div>
              ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
            <div className="h-full">
              {getSortedItems()[3] &&
                renderDraggableCard(
                  getSortedItems()[3].id,
                  cardComponents[getSortedItems()[3].id]
                )}
            </div>
            <div className="h-full">
              {getSortedItems()[4] &&
                renderDraggableCard(
                  getSortedItems()[4].id,
                  cardComponents[getSortedItems()[4].id]
                )}
            </div>

            <div className="flex flex-col gap-4 h-full">
              {getSortedItems()
                .slice(5, 8)
                .map((item) => (
                  <div key={item.id} className="flex-1">
                    {renderDraggableCard(item.id, cardComponents[item.id])}
                  </div>
                ))}
            </div>
          </div>

          {chartData.eventsPerformance.length > 0 && (
            <div
              onClick={() => openModal("eventsPerformance")}
              className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105 relative"
            >
              <div
                className="absolute top-2 right-2 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
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

      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        events={dashboardData.events}
      />

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onGenerate={handleGenerateReport}
        setValidationError={setValidationError}
      />

      <ChartModal
        isOpen={modalState.isOpen && modalState.type === "volunteers"}
        onClose={closeModal}
        title="Total Registered Volunteers"
        showGenderBreakdown={true}
        genderData={dashboardData.volunteerGenderData}
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
                  {
                    dashboardData.events.filter((e) => e.status === "COMPLETED")
                      .length
                  }
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
        isOpen={modalState.isOpen && modalState.type === "participation"}
        onClose={closeModal}
        title="Volunteer Participation Rate"
        showGenderBreakdown={true}
        genderData={dashboardData.volunteerGenderData}
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
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS.participation[index]}
                  />
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
        showGenderBreakdown={true}
        genderData={dashboardData.volunteerGenderData}
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
                <p className="text-sm text-gray-600 font-semibold">
                  {data.month}
                </p>
                <p className="text-2xl font-bold text-purple-700">
                  {data.volunteers}
                </p>
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
              <p className="text-sm text-gray-500 mt-2">
                applications expected
              </p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {chartData.applications?.data?.slice(0, 4).map((data, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-3 rounded-lg text-center"
                >
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
                {
                  dashboardData.events.filter((e) => e.status === "ONGOING")
                    .length
                }
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-3xl font-bold text-blue-700">
                {
                  dashboardData.events.filter((e) => e.status === "UPCOMING")
                    .length
                }
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-gray-700">
                {
                  dashboardData.events.filter((e) => e.status === "COMPLETED")
                    .length
                }
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
                  <p className="text-xs text-gray-500">participation</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ChartModal>
    </div>
  );
}