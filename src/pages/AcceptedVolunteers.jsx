// src/pages/AcceptedVolunteers.jsx
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";  // Import Sidebar
import CentroAdminBg from "../images/CENTRO_ADMIN.png";

export default function AcceptedVolunteers() {
  // Volunteers data (8 total)
  const volunteers = [
    { id: 1, name: "Olivia Ramirez", phone: "0917 2345 678", email: "oliram24@gmail.com", schedule: "8:00 AM – 12:00 PM", assigned: ["Environmental Awareness"], photo: "images/olivia.jpg" },
    { id: 2, name: "Ethan Crawford", phone: "0941 2456 234", email: "ethaw89@gmail.com", schedule: "9:00 AM – 1:00 PM", assigned: ["Community Development", "Human Rights & Advocacy"], photo: "images/ethan.jpg" },
    // other volunteers...
  ];

  // Default selected volunteer
  const [selectedVolunteer, setSelectedVolunteer] = useState(volunteers[0]);

  // Unified alert handler
  const handleAlert = (message, volunteer = null) => {
    alert(message);
    if (volunteer) setSelectedVolunteer(volunteer);
  };

  return (
    <div className="flex min-h-screen bg-no-repeat bg-center" style={{ backgroundImage: `url(${CentroAdminBg})`, backgroundSize: "100% 100%" }}>
      <Sidebar handleAlert={handleAlert} />  {/* Include Sidebar */}
      <main className="flex-1 ml-64 p-4 overflow-y-auto">
        <div id="accepted_volunteers" className="relative z-10 space-y-4">
          {/* Event Header */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-6 cursor-pointer" onClick={() => handleAlert("Event Header")}>
            <h2 className="text-emerald-900 text-3xl md:text-4xl font-extrabold mb-2">
              Lakad Para sa Kalikasan: A Charity Walk for Forest Preservation
            </h2>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="text-red-600 space-y-1">
                <p className="text-base md:text-lg">
                  <span className="text-red-500 font-semibold">Date: June 30, 2025</span>
                </p>
                <p className="text-base md:text-lg">
                  <span className="text-red-500 font-semibold">Duration: 10:00 AM – 2:00 PM</span>
                </p>
                <p className="text-base md:text-lg">
                  <span className="text-red-500 font-semibold">Location: In front of Quiapo Church, Manila</span>
                </p>
              </div>
              <div className="mt-6 md:mt-0 text-right">
                <p className="text-2xl text-emerald-900 font-semibold">
                  Accepted Volunteers: <span className="text-emerald-700">{volunteers.length}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Layout: Table + Profile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Table */}
            <div className="md:col-span-2 bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-emerald-700 text-lg text-white">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Email Address</th>
                  </tr>
                </thead>
                <tbody className="text-emerald-900">
                  {volunteers.map((vol) => (
                    <tr
                      key={vol.id}
                      className={`cursor-pointer hover:bg-emerald-50 ${selectedVolunteer.id === vol.id ? "bg-emerald-100 font-semibold" : ""}`}
                      onClick={() => handleAlert(`You selected: ${vol.name}`, vol)}
                    >
                      <td className="py-2 px-4">{vol.id}</td>
                      <td className="py-2 px-4">{vol.name}</td>
                      <td className="py-2 px-4">{vol.phone}</td>
                      <td className="py-2 px-4">{vol.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-col cursor-pointer">
              <img src={selectedVolunteer.photo} alt={selectedVolunteer.name} className="w-28 h-28 mx-auto mb-4 object-cover border-4 border-white shadow rounded-full" />
              <h3 className="text-2xl text-emerald-900 font-bold text-center mb-4">{selectedVolunteer.name}</h3>
              <p className="text-m text-emerald-900 mb-2"><span className="font-bold text-xl">Email Address</span><br /> {selectedVolunteer.email}</p>
              <p className="text-m text-emerald-900 mb-2"><span className="font-bold text-xl">Contact Number</span><br /> {selectedVolunteer.phone}</p>
              <p className="text-m text-emerald-900 mb-2"><span className="font-bold text-xl">Schedule</span><br /> {selectedVolunteer.schedule}</p>
              <p className="font-bold text-xl mb-2 text-emerald-900">Assigned Type of Volunteering</p>
              <ul className="list-disc pl-5 text-m text-emerald-900">
                {selectedVolunteer.assigned.map((task, idx) => (
                  <li key={idx}>{task}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
