import React from "react";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div className="flex">
      {/* MAIN CONTENT */}
      <main className="flex-1 ml-20 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
