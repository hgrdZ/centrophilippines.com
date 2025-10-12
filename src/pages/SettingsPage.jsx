import React, { useState, useEffect } from "react";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import Sidebar from "../components/Sidebar";
import supabase from "../config/supabaseClient";

const SettingsPage = () => {
  // State for admin data
  const [adminData, setAdminData] = useState(null);
  
  // State for NGO Information (editable fields)
  const [ngoInfo, setNgoInfo] = useState({
    name: "",
    description: "",
    address: "",
    phone_number: "",
    email: "",
    ngo_location: "",
    ngo_logo: "",
    ngo_code: ""
  });

  // State for edit mode and loading
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  
  // State for confirmation modals
  const [showEditProfileConfirm, setShowEditProfileConfirm] = useState(false);
  const [showUpdateLogoConfirm, setShowUpdateLogoConfirm] = useState(false);
  const [showSaveChangesConfirm, setShowSaveChangesConfirm] = useState(false);
  const [showCancelEditConfirm, setShowCancelEditConfirm] = useState(false);
  
  // State for notifications and alerts
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  
  // State for file upload
  const [selectedFile, setSelectedFile] = useState(null);
  
  // State for notification settings
  const [notifications, setNotifications] = useState({
    applicationAlerts: false,
    weeklySummary: false,
    eventReminders: false
  });
  
  // State for management options
  const [management, setManagement] = useState({
    autoApproval: false,
    adminNotification: false,
    autoBackUp: false
  });
  
  // State for security
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Fetch NGO information on component mount
  useEffect(() => {
    const fetchNGOInfo = async () => {
      const admin = JSON.parse(localStorage.getItem("admin"));
      if (admin) {
        setAdminData(admin);
        
        try {
          const { data, error } = await supabase
            .from("NGO_Information")
            .select("*")
            .eq("admin_id", admin.admin_id)
            .single();

          if (error) {
            console.error("Error fetching NGO info:", error);
            setAlertMessage("Error loading organization information");
            setShowErrorAlert(true);
          } else if (data) {
            setNgoInfo({
              name: data.name || "",
              description: data.description || "",
              address: data.address || "",
              phone_number: data.phone_number || "",
              email: data.email || "",
              ngo_location: data.ngo_location || "",
              ngo_logo: data.ngo_logo || "",
              ngo_code: data.ngo_code || ""
            });
          }
        } catch (err) {
          console.error("Unexpected error:", err);
          setAlertMessage("Unexpected error occurred");
          setShowErrorAlert(true);
        }
      }
    };

    fetchNGOInfo();
  }, []);

  // Prevent body scroll when modal is open and handle ESC key
  useEffect(() => {
    const isAnyModalOpen = showEditProfileConfirm || showUpdateLogoConfirm || 
                          showSaveChangesConfirm || showCancelEditConfirm;
    
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      
      const handleEscKey = (event) => {
        if (event.key === 'Escape') {
          setShowEditProfileConfirm(false);
          setShowUpdateLogoConfirm(false);
          setShowSaveChangesConfirm(false);
          setShowCancelEditConfirm(false);
        }
      };
      
      document.addEventListener('keydown', handleEscKey);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscKey);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showEditProfileConfirm, showUpdateLogoConfirm, showSaveChangesConfirm, showCancelEditConfirm]);

  // Handle backdrop click for modals
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowEditProfileConfirm(false);
      setShowUpdateLogoConfirm(false);
      setShowSaveChangesConfirm(false);
      setShowCancelEditConfirm(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setNgoInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle file selection for logo update
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setAlertMessage("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
        setShowErrorAlert(true);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setAlertMessage("File size must be less than 5MB");
        setShowErrorAlert(true);
        return;
      }

      setSelectedFile(file);
    }
  };

  // Upload logo to Supabase Storage
  const uploadLogo = async (file) => {
    if (!file) return null;

    setLogoUploading(true);
    try {
      const fileExt = file.name.split('.').pop().toLowerCase();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const fileName = `ngo_logo_${ngoInfo.ngo_code}_${timestamp}_${randomStr}.${fileExt}`;
      const filePath = `ngo_logo/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("centro_bucket")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("centro_bucket")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      setAlertMessage(`Error uploading logo: ${error.message}`);
      setShowErrorAlert(true);
      return null;
    } finally {
      setLogoUploading(false);
    }
  };

  // Save changes to database
  const saveChanges = async () => {
    setLoading(true);
    try {
      let logoUrl = ngoInfo.ngo_logo;

      if (selectedFile) {
        const newLogoUrl = await uploadLogo(selectedFile);
        if (newLogoUrl) {
          logoUrl = newLogoUrl;
        } else {
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from("NGO_Information")
        .update({
          name: ngoInfo.name.trim(),
          description: ngoInfo.description.trim(),
          address: ngoInfo.address.trim(),
          phone_number: ngoInfo.phone_number.trim(),
          email: ngoInfo.email.trim(),
          ngo_location: ngoInfo.ngo_location.trim(),
          ngo_logo: logoUrl
        })
        .eq("admin_id", adminData.admin_id);

      if (error) throw error;

      setNgoInfo(prev => ({ ...prev, ngo_logo: logoUrl }));
      setSelectedFile(null);
      setEditMode(false);
      
      setAlertMessage("Organization information updated successfully!");
      setShowSuccessAlert(true);
      
    } catch (error) {
      console.error("Error saving changes:", error);
      setAlertMessage(`Error saving changes: ${error.message}`);
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Profile action
  const handleEditProfile = () => {
    setEditMode(true);
    setShowEditProfileConfirm(false);
  };

  // Handle Update Logo action
  const handleUpdateLogo = () => {
    setShowUpdateLogoConfirm(false);
    document.getElementById('logo-upload').click();
  };

  // Handle Save Changes
  const handleSaveChanges = () => {
    setShowSaveChangesConfirm(false);
    saveChanges();
  };

  // Handle Cancel Edit
  const handleCancelEdit = async () => {
    setShowCancelEditConfirm(false);
    
    try {
      const { data, error } = await supabase
        .from("NGO_Information")
        .select("*")
        .eq("admin_id", adminData.admin_id)
        .single();

      if (!error && data) {
        setNgoInfo({
          name: data.name || "",
          description: data.description || "",
          address: data.address || "",
          phone_number: data.phone_number || "",
          email: data.email || "",
          ngo_location: data.ngo_location || "",
          ngo_logo: data.ngo_logo || "",
          ngo_code: data.ngo_code || ""
        });
      }
    } catch (err) {
      console.error("Error restoring data:", err);
    }
    
    setSelectedFile(null);
    setEditMode(false);
  };

  // Handle notification toggle changes
  const handleNotificationChange = (setting) => {
    setNotifications(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Handle management option changes
  const handleManagementChange = (setting) => {
    setManagement(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Handle two-factor auth toggle
  const handleTwoFactorToggle = () => {
    setTwoFactorAuth(!twoFactorAuth);
  };

  // Auto-hide alerts after 5 seconds
  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => setShowSuccessAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessAlert]);

  useEffect(() => {
    if (showErrorAlert) {
      const timer = setTimeout(() => setShowErrorAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showErrorAlert]);

  // Alert component
  const Alert = ({ isOpen, type, message, onClose }) => {
    if (!isOpen) return null;

    const alertColors = {
      success: "bg-green-100 border-green-500 text-green-700",
      error: "bg-red-100 border-red-500 text-red-700"
    };

    return (
      <div className={`fixed top-4 right-4 z-50 p-4 border-l-4 rounded-lg shadow-lg max-w-md ${alertColors[type]}`}>
        <div className="flex items-center justify-between">
          <p className="font-medium">{message}</p>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className="flex min-h-screen bg-no-repeat bg-center"
        style={{
          backgroundImage: `url(${CentroAdminBg})`,
          backgroundSize: "100% 100%",
        }}
      >
        <Sidebar activeButton="Settings" />

        <main className="flex-1 ml-64 p-10 overflow-y-auto">
          <div className="relative bg-white/95 shadow-xl rounded-[28px] ring-1 ring-gray-200/60 w-full max-w-5xl mx-auto p-8">
            
            {/* Action Buttons */}
            <div className="absolute top-6 right-6 flex gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={() => setShowSaveChangesConfirm(true)}
                    disabled={loading || logoUploading}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-full transition-colors cursor-pointer"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => setShowCancelEditConfirm(true)}
                    disabled={loading || logoUploading}
                    className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-full transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowEditProfileConfirm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 rounded-full transition-colors cursor-pointer"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* Header row */}
            <div className="grid grid-cols-12 gap-8 items-start">
              {/* Logo */}
              <div className="col-span-12 md:col-span-4">
                <div className="rounded-xl border-4 border-emerald-700/70 px-4 py-3 w-full flex items-center justify-center bg-white min-h-[200px]">
                  {ngoInfo.ngo_logo ? (
                    <img
                      src={ngoInfo.ngo_logo}
                      alt="Organization Logo"
                      className="w-full h-auto object-contain max-h-48"
                    />
                  ) : (
                    <span className="text-gray-500">No Logo</span>
                  )}
                </div>
                
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={() => setShowUpdateLogoConfirm(true)}
                    disabled={logoUploading || loading}
                    className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
                  >
                    {logoUploading ? "Uploading..." : "Update Logo"}
                  </button>
                </div>
                
                {selectedFile && (
                  <div className="mt-2 text-center text-sm text-gray-600">
                    Selected: {selectedFile.name}
                  </div>
                )}
              </div>

              {/* Organization Info */}
              <div className="col-span-12 md:col-span-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={ngoInfo.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  ) : (
                    <p className="text-xl font-semibold text-emerald-900">
                      {ngoInfo.name || "Not specified"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Code
                  </label>
                  <p className="text-lg text-gray-700 font-mono bg-gray-100 px-3 py-2 rounded-lg">
                    {ngoInfo.ngo_code || "Not specified"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  {editMode ? (
                    <input
                      type="email"
                      value={ngoInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {ngoInfo.email || "Not specified"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={ngoInfo.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {ngoInfo.phone_number || "Not specified"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-8 space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  Organization Description
                </label>
                {editMode ? (
                  <textarea
                    value={ngoInfo.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter organization description..."
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {ngoInfo.description || "No description provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  Office Address
                </label>
                {editMode ? (
                  <textarea
                    value={ngoInfo.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter complete address..."
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {ngoInfo.address || "No address provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  City/Location
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={ngoInfo.ngo_location}
                    onChange={(e) => handleInputChange('ngo_location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter city or location..."
                  />
                ) : (
                  <p className="text-gray-700">
                    {ngoInfo.ngo_location || "Not specified"}
                  </p>
                )}
              </div>
            </div>

            {/* Notification + Management */}
            <div className="grid grid-cols-12 gap-12 mt-8">
              <div className="col-span-12 md:col-span-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Notification Settings
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'applicationAlerts', label: 'Application Alerts' },
                    { key: 'weeklySummary', label: 'Weekly Summary' },
                    { key: 'eventReminders', label: 'Event Reminders' }
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-gray-700">{item.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifications[item.key]}
                          onChange={() => handleNotificationChange(item.key)}
                        />
                        <div className="w-11 h-6 bg-gray-300 rounded-full transition peer-checked:bg-emerald-600 relative
                           after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all
                           peer-checked:after:translate-x-5">
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-12 md:col-span-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Management Options
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'autoApproval', label: 'Auto Approval of Applications' },
                    { key: 'adminNotification', label: 'Admin Notification' },
                    { key: 'autoBackUp', label: 'Auto Back Up' }
                  ].map((item) => (
                    <div 
                      key={item.key} 
                      className="flex items-center justify-between"
                    >
                      <span className="text-gray-700">{item.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={management[item.key]}
                          onChange={() => handleManagementChange(item.key)}
                        />
                        <div className="w-11 h-6 bg-gray-300 rounded-full transition peer-checked:bg-emerald-600 relative
                           after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all
                           peer-checked:after:translate-x-5">
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Data & Security */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Data &amp; Security
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Two-factor Authentication</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={twoFactorAuth}
                    onChange={handleTwoFactorToggle}
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full transition peer-checked:bg-emerald-600 relative
                     after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all
                     peer-checked:after:translate-x-5">
                  </div>
                </label>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Profile Confirmation Modal */}
      {showEditProfileConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center animate-fadeIn"
          onClick={handleBackdropClick}
          style={{ zIndex: 99999999 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="relative bg-white rounded-xl shadow-2xl p-8 w-96 max-w-md mx-4 transform animate-scaleIn border-2 border-emerald-700">
            <div className="flex justify-center mb-4">
              <div className="rounded-full flex items-center justify-center">
                <h2 className="text-3xl font-bold text-emerald-700 mb-2 font-montserrat">
                  Edit Profile
                </h2>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-8 text-lg mt-4 font-montserrat">
                Are you sure you want to edit your organization information? You'll be able to modify all organization details.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={handleEditProfile}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-lg text-lg font-montserrat border-2 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                >
                  Start Editing
                </button>
                <button
                  onClick={() => setShowEditProfileConfirm(false)}
                  className="bg-white text-gray-800 px-6 py-3 rounded-lg text-lg font-montserrat border-2 border-gray-300 hover:bg-emerald-100 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Logo Confirmation Modal */}
      {showUpdateLogoConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center animate-fadeIn"
          onClick={handleBackdropClick}
          style={{ zIndex: 99999999 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="relative bg-white rounded-xl shadow-2xl p-8 w-96 max-w-md mx-4 transform animate-scaleIn border-2 border-emerald-700">
            <div className="flex justify-center mb-4">
              <div className=" flex items-center justify-center">
                <h2 className="text-3xl font-bold text-emerald-700 mb-2 font-montserrat">
                  Update Logo
                </h2>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-8 text-lg mt-4 font-montserrat">
                Please select a new logo file. Supported formats: JPEG, PNG, GIF, WebP. Maximum file size: 5MB.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={handleUpdateLogo}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-lg text-lg font-montserrat border-2 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                >
                  Select Logo
                </button>
                <button
                  onClick={() => setShowUpdateLogoConfirm(false)}
                  className="bg-white text-gray-800 px-6 py-3 rounded-lg text-lg font-montserrat border-2 border-gray-300 hover:bg-emerald-100 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Changes Confirmation Modal */}
      {showSaveChangesConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center animate-fadeIn"
          onClick={handleBackdropClick}
          style={{ zIndex: 99999999 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="relative bg-white rounded-xl shadow-2xl p-8 w-96 max-w-md mx-4 transform animate-scaleIn border-2 border-green-700">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <h2 className="text-3xl font-bold text-green-700 mb-2 font-montserrat">
                  Save Changes
                </h2>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-8 text-lg mt-4 font-montserrat">
                Are you sure you want to save all changes to your organization information? This will update your profile in the database.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={handleSaveChanges}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-montserrat border-2 border-green-600 hover:bg-green-700 hover:border-green-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                >
                  Yes, Save
                </button>
                <button
                  onClick={() => setShowSaveChangesConfirm(false)}
                  className="bg-white text-gray-800 px-6 py-3 rounded-lg text-lg font-montserrat border-2 border-gray-300 hover:bg-green-100 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Edit Confirmation Modal */}
      {showCancelEditConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center animate-fadeIn"
          onClick={handleBackdropClick}
          style={{ zIndex: 99999999 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="relative bg-white rounded-xl shadow-2xl p-8 w-96 max-w-md mx-4 transform animate-scaleIn border-2 border-red-700">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <h2 className="text-3xl font-bold text-red-700 mb-2 font-montserrat">
                  Cancel Editing
                </h2>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-8 text-lg mt-4 font-montserrat">
                Are you sure you want to cancel editing? All unsaved changes will be lost.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-montserrat border-2 border-red-600 hover:bg-red-700 hover:border-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                >
                  Yes, Cancel
                </button>
                <button
                  onClick={() => setShowCancelEditConfirm(false)}
                  className="bg-white text-gray-800 px-6 py-3 rounded-lg text-lg font-montserrat border-2 border-gray-300 hover:bg-red-100 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                >
                  Keep Editing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Messages */}
      <Alert
        isOpen={showSuccessAlert}
        type="success"
        message={alertMessage}
        onClose={() => setShowSuccessAlert(false)}
      />

      <Alert
        isOpen={showErrorAlert}
        type="error"
        message={alertMessage}
        onClose={() => setShowErrorAlert(false)}
      />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default SettingsPage;