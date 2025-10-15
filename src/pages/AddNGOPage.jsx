// src/pages/AddNGOPage.jsx
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import PasswordIcon from "../images/password.svg";
import ShowPasswordIcon from "../images/showpassword.svg";
import supabase from "../config/supabaseClient";

// Import additional icons
import AdminIcon from "../images/login.svg";
import FileIcon from "../images/file.svg";
import NGOLogoIcon from "../images/ngo-logo.svg";
import LocationIcon from "../images/location.svg";
import PhoneIcon from "../images/phone.svg";
import EmailIcon from "../images/email.svg";

// Reusable Modal Component
function ConfirmationModal({ title, message, onConfirm, onCancel, type = "confirm" }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-96 text-center z-50 border-4 border-emerald-800">
        <h2 className="text-xl font-bold text-emerald-800 mb-4">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          {type === "confirm" ? (
            <>
              <button
                onClick={onConfirm}
                className="bg-emerald-700 text-white px-5 py-2 rounded-lg hover:bg-emerald-900 cursor-pointer transition-all duration-300 transform hover:scale-105"
              >
                Yes
              </button>
              <button
                onClick={onCancel}
                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 cursor-pointer transition-all duration-300 transform hover:scale-105"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onCancel}
              className="bg-emerald-700 text-white px-6 py-2 rounded-lg hover:bg-emerald-900 cursor-pointer transition-all duration-300 transform hover:scale-105"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddNGOPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Changed to blank initial values
  const [formData, setFormData] = useState({
    loginId: "",
    password: "",
    adminId: "",
    adminType: "admin",
    ngoCode: "",
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    location: "",
    logo: null,
    preferredVolunteering: [],
  });

  // Supported image formats
  const supportedImageTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp'
  ];

  const supportedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];

  // Preferred volunteering options
  const volunteeringOptions = [
    "Education & Youth Development",
    "Healthcare & Medical Aid",
    "Environmental Conservation",
    "Disaster Relief & Emergency Response",
    "Community Development",
    "Administrative & Technical Support",
    "Human Rights & Advocacy",
    "Animal Welfare"
  ];

  // Handle close/back navigation with confirmation
  const handleClose = () => {
    // Check if form has any data
    const hasFormData = Object.entries(formData).some(([key, value]) => {
      if (key === 'adminType') return value !== 'admin'; // Default value
      if (key === 'logo') return value !== null;
      if (key === 'preferredVolunteering') return value.length > 0;
      return value.trim() !== '';
    });

    if (hasFormData) {
      setModalConfig({
        title: "Confirm Exit",
        message: "You have unsaved changes. Are you sure you want to leave? All data will be lost.",
        onConfirm: () => {
          setModalConfig(null);
          navigate("/ngohub");
        },
        onCancel: () => setModalConfig(null),
        type: "confirm",
      });
    } else {
      navigate("/ngohub");
    }
  };

  // Validate file type and size
  const validateFile = (file) => {
    // Check file type
    if (!supportedImageTypes.includes(file.type)) {
      const extension = file.name.split('.').pop().toLowerCase();
      if (!supportedExtensions.includes(extension)) {
        setModalConfig({
          title: "Invalid File Type",
          message: `Unsupported file type. Please upload one of the following formats: ${supportedExtensions.join(', ')}`,
          onCancel: () => setModalConfig(null),
          type: "alert",
        });
        return false;
      }
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setModalConfig({
        title: "File Too Large",
        message: "File size too large. Please upload an image smaller than 10MB.",
        onCancel: () => setModalConfig(null),
        type: "alert",
      });
      return false;
    }

    return true;
  };

  const handleChange = (e) => {
    if (e.target.type === "file") {
      const file = e.target.files[0];
      if (!file) {
        setFormData({ ...formData, logo: null });
        setLogoPreview(null);
        return;
      }

      if (!validateFile(file)) {
        e.target.value = ''; // Reset file input
        return;
      }

      setFormData({ ...formData, logo: file });

      // Create preview for non-SVG files
      if (file.type !== 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (event) => {
          setLogoPreview(event.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        // For SVG files, just show the file name
        setLogoPreview(null);
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // Handle preferred volunteering selection
  const handleVolunteeringChange = (option) => {
    setFormData(prev => {
      if (prev.preferredVolunteering.includes(option)) {
        return {
          ...prev,
          preferredVolunteering: prev.preferredVolunteering.filter(item => item !== option)
        };
      } else {
        return {
          ...prev,
          preferredVolunteering: [...prev.preferredVolunteering, option]
        };
      }
    });
  };

  // Upload logo to Supabase Storage
  const uploadNgoLogo = async (file) => {
    if (!file) return null;

    setLogoUploading(true);
    try {
      // Get file extension
      const fileExt = file.name.split('.').pop().toLowerCase();
      
      // Generate unique filename with NGO code for better organization
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const fileName = `${formData.ngoCode}_logo_${timestamp}_${randomStr}.${fileExt}`;
      const filePath = `ngo_logo/${fileName}`;

      console.log('Uploading NGO logo:', {
        name: file.name,
        size: file.size,
        type: file.type,
        filePath,
        ngoCode: formData.ngoCode
      });

      // Upload options
      const uploadOptions = {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      };

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("centro_bucket")
        .upload(filePath, file, uploadOptions);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // If RLS error, try with upsert = true
        if (uploadError.message.includes('row_level_security')) {
          console.log('Retrying with upsert=true...');
          const { data: retryData, error: retryError } = await supabase.storage
            .from("centro_bucket")
            .upload(filePath, file, {
              ...uploadOptions,
              upsert: true
            });
          
          if (retryError) {
            throw retryError;
          }
          console.log('Retry successful:', retryData);
        } else {
          throw uploadError;
        }
      } else {
        console.log('Upload successful:', uploadData);
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("centro_bucket")
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      console.log('Public URL:', urlData.publicUrl);
      return urlData.publicUrl;

    } catch (error) {
      console.error("Error uploading logo:", error);
      
      // More specific error messages
      if (error.message.includes('row_level_security')) {
        setModalConfig({
          title: "Storage Permission Error",
          message: "Storage permission error. Please make sure you're logged in as an admin. If the issue persists, contact the system administrator to configure storage policies.",
          onCancel: () => setModalConfig(null),
          type: "alert",
        });
      } else if (error.message.includes('413') || error.message.includes('size') || error.message.includes('too large')) {
        setModalConfig({
          title: "File Too Large",
          message: "File too large. Please upload an image smaller than 10MB.",
          onCancel: () => setModalConfig(null),
          type: "alert",
        });
      } else {
        setModalConfig({
          title: "Upload Error",
          message: `Error uploading logo: ${error.message}. Please try again or contact support.`,
          onCancel: () => setModalConfig(null),
          type: "alert",
        });
      }
      
      return null;
    } finally {
      setLogoUploading(false);
    }
  };

  // Get next admin ID
  const getNextAdminId = async () => {
    try {
      const { data, error } = await supabase
        .from("NGO_Admin")
        .select("admin_id")
        .order("admin_id", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastId = data[0].admin_id;
        const number = parseInt(lastId.split("_")[0]);
        return `${String(number + 1).padStart(3, "0")}_${formData.adminId.toUpperCase()}`;
      } else {
        return `001_${formData.adminId.toUpperCase()}`;
      }
    } catch (error) {
      console.error("Error getting next admin ID:", error);
      return `001_${formData.adminId.toUpperCase()}`;
    }
  };

  // Get next login ID
  const getNextLoginId = async () => {
    try {
      const { data, error } = await supabase
        .from("NGO_Admin")
        .select("login_id")
        .order("login_id", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastId = data[0].login_id;
        const number = parseInt(lastId.split("CENTRO_")[0]);
        return `${String(number + 1).padStart(3, "0")}CENTRO_${formData.loginId.toUpperCase()}`;
      } else {
        return `001CENTRO_${formData.loginId.toUpperCase()}`;
      }
    } catch (error) {
      console.error("Error getting next login ID:", error);
      return `001CENTRO_${formData.loginId.toUpperCase()}`;
    }
  };

  // Validate form
  const validateForm = () => {
    const missingFields = [];
    if (!formData.loginId.trim()) missingFields.push("Login ID");
    if (!formData.password.trim()) missingFields.push("Password");
    if (!formData.adminId.trim()) missingFields.push("Admin ID");
    if (!formData.ngoCode.trim()) missingFields.push("NGO Code");
    if (!formData.name.trim()) missingFields.push("NGO Name");
    if (!formData.address.trim()) missingFields.push("Address");
    if (!formData.phone.trim()) missingFields.push("Phone Number");
    if (!formData.email.trim()) missingFields.push("Official Email");
    if (!formData.location.trim()) missingFields.push("NGO Location");
    if (formData.preferredVolunteering.length === 0) missingFields.push("Preferred Volunteering Types");

    if (missingFields.length > 0) {
      setModalConfig({
        title: "Incomplete Form",
        message: `Please complete the following required fields: ${missingFields.join(", ")}`,
        onCancel: () => setModalConfig(null),
        type: "alert",
      });
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setModalConfig({
        title: "Invalid Email",
        message: "Please enter a valid email address.",
        onCancel: () => setModalConfig(null),
        type: "alert",
      });
      return false;
    }

    // Validate phone format (basic check)
    const phoneRegex = /^[0-9+\s()-]+$/;
    if (!phoneRegex.test(formData.phone)) {
      setModalConfig({
        title: "Invalid Phone",
        message: "Please enter a valid phone number.",
        onCancel: () => setModalConfig(null),
        type: "alert",
      });
      return false;
    }

    return true;
  };

  // Show confirmation before submitting
  const handleSubmitClick = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Show confirmation modal before proceeding
    setModalConfig({
      title: "Confirm Registration",
      message: "Are you sure you want to register this NGO? Please review all the information before proceeding.",
      onConfirm: () => {
        setModalConfig(null);
        handleSubmit();
      },
      onCancel: () => setModalConfig(null),
      type: "confirm",
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Check if NGO code already exists
      const { data: existingNgo, error: checkError } = await supabase
        .from("NGO_Information")
        .select("ngo_code")
        .eq("ngo_code", formData.ngoCode.toUpperCase())
        .single();

      if (existingNgo) {
        setModalConfig({
          title: "NGO Code Exists",
          message: "This NGO code already exists. Please choose a different code.",
          onCancel: () => setModalConfig(null),
          type: "alert",
        });
        setLoading(false);
        return;
      }

      // Upload logo if provided
      let logoUrl = null;
      if (formData.logo) {
        console.log('Starting logo upload...');
        logoUrl = await uploadNgoLogo(formData.logo);
        if (!logoUrl) {
          console.error('Logo upload failed, aborting NGO creation');
          setLoading(false);
          return;
        }
        console.log('Logo uploaded successfully:', logoUrl);
      }

      // Generate IDs
      const adminId = await getNextAdminId();
      const loginId = await getNextLoginId();

      // Insert into NGO_Information table FIRST
      const ngoData = {
        admin_id: adminId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        address: formData.address.trim(),
        phone_number: formData.phone.trim(),
        email: formData.email.trim(),
        ngo_location: formData.location.trim(),
        created_at: new Date().toISOString().split('T')[0],
        ngo_logo: logoUrl,
        ngo_code: formData.ngoCode.toUpperCase(),
        preferred_volunteering: formData.preferredVolunteering.join(",")
      };

      const { error: ngoError } = await supabase
        .from("NGO_Information")
        .insert([ngoData]);

      if (ngoError) throw ngoError;

      // Then insert into NGO_Admin table
      const adminData = {
        login_id: loginId,
        password: formData.password,
        admin_id: adminId,
        admin_type: formData.adminType
      };

      const { error: adminError } = await supabase
        .from("NGO_Admin")
        .insert([adminData]);

      if (adminError) {
        // If admin insertion fails, clean up NGO record
        await supabase.from("NGO_Information").delete().eq("admin_id", adminId);
        throw adminError;
      }

      console.log('NGO created successfully');
      
      setModalConfig({
        title: "Success",
        message: "NGO registered successfully!",
        onCancel: () => {
          setModalConfig(null);
          navigate("/ngohub");
        },
        type: "alert",
      });

    } catch (error) {
      console.error("Error creating NGO:", error);
      setModalConfig({
        title: "Error",
        message: `Error registering NGO: ${error.message}. Please try again.`,
        onCancel: () => setModalConfig(null),
        type: "alert",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50" style={{ backgroundImage: `url(${CentroAdminBg})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
      <Sidebar handleAlert={(msg) => alert(msg)} />
      <main className="ml-64 flex-1 p-8 flex items-start justify-center overflow-y-auto">
        <div className="bg-white shadow-2xl rounded-2xl w-full max-w-5xl my-8 overflow-hidden border border-emerald-200 relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 z-10 text-white bg-emerald-700 hover:bg-emerald-800 rounded-full w-10 h-10 flex items-center justify-center text-3xl font-bold transition-all duration-300 transform hover:scale-110 shadow-lg cursor-pointer"
            disabled={loading || logoUploading}
            title="Close and return to NGO Hub"
          >
            ×
          </button>

          {/* Header */}
          <div className="bg-emerald-700 py-8 px-10 text-white text-center">
            <h1 className="text-4xl font-extrabold">Register New NGO</h1>
            <p className="text-sm opacity-90 mt-2">Fill in the details below</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitClick} className="p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Login ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Login ID *</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400">
                  <input
                    type="text"
                    name="loginId"
                    value={formData.loginId}
                    onChange={handleChange}
                    placeholder="Enter login ID"
                    className="w-full outline-none text-sm"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img
                    src={AdminIcon}
                    alt="Login Icon"
                    className="w-5 h-5 ml-2 flex-shrink-0"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="w-full outline-none text-sm"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img
                    src={showPassword ? ShowPasswordIcon : PasswordIcon}
                    alt={showPassword ? "Hide password" : "Show password"}
                    className="w-5 h-5 ml-2 cursor-pointer hover:opacity-70 transition-opacity duration-200 flex-shrink-0"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide Password" : "Show Password"}
                  />
                </div>
              </div>

              {/* Admin ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Admin ID *</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400">
                  <input
                    type="text"
                    name="adminId"
                    value={formData.adminId}
                    onChange={handleChange}
                    placeholder="Enter admin ID"
                    className="w-full outline-none text-sm"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img
                    src={AdminIcon}
                    alt="Admin Icon"
                    className="w-5 h-5 ml-2 flex-shrink-0"
                  />
                </div>
              </div>

              {/* Admin Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Type</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400">
                  <select
                    name="adminType"
                    value={formData.adminType}
                    onChange={handleChange}
                    className="w-full outline-none bg-transparent text-sm cursor-pointer"
                    disabled={loading || logoUploading}
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>

              {/* NGO Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">NGO Code *</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400">
                  <input
                    type="text"
                    name="ngoCode"
                    value={formData.ngoCode}
                    onChange={handleChange}
                    placeholder="Enter unique NGO code"
                    className="w-full outline-none text-sm"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img
                    src={NGOLogoIcon}
                    alt="NGO Code Icon"
                    className="w-5 h-5 ml-2 flex-shrink-0"
                  />
                </div>
              </div>

              {/* NGO Logo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">NGO Logo</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400">
                  <input
                    type="file"
                    name="logo"
                    accept={supportedImageTypes.join(',')}
                    onChange={handleChange}
                    className="w-full outline-none cursor-pointer text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    disabled={loading || logoUploading}
                  />
                  <img
                    src={FileIcon}
                    alt="File Icon"
                    className="w-5 h-5 ml-2 flex-shrink-0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Supported: {supportedExtensions.join(', ')}. Max: 10MB
                </p>
                
                {logoPreview && (
                  <div className="mt-2">
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      className="max-w-full h-20 object-contain rounded border border-gray-200"
                    />
                  </div>
                )}
                
                {formData.logo && !logoPreview && (
                  <div className="mt-2 p-2 bg-emerald-50 rounded text-sm text-emerald-800">
                    File selected: {formData.logo.name}
                  </div>
                )}

                {logoUploading && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                    Uploading logo...
                  </div>
                )}
              </div>

              {/* NGO Name - Full Width */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">NGO Name *</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter NGO name"
                    className="w-full outline-none text-sm"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img src={NGOLogoIcon} alt="NGO Name Icon" className="w-5 h-5 ml-2 flex-shrink-0" />
                </div>
              </div>

              {/* Description - Full Width */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Short description"
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-400 focus:outline-none focus:border-emerald-400 text-sm"
                  disabled={loading || logoUploading}
                />
              </div>

              {/* Address - Full Width */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400">
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter NGO address"
                    className="w-full outline-none text-sm"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img
                    src={LocationIcon}
                    alt="Address Icon"
                    className="w-5 h-5 ml-2 flex-shrink-0"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400">
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full outline-none text-sm"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img
                    src={PhoneIcon}
                    alt="Phone Icon"
                    className="w-5 h-5 ml-2 flex-shrink-0"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Official Email *</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className="w-full outline-none text-sm"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img
                    src={EmailIcon}
                    alt="Email Icon"
                    className="w-5 h-5 ml-2 flex-shrink-0"
                  />
                </div>
              </div>

              {/* NGO Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">NGO Location *</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400">
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter NGO location"
                    className="w-full outline-none text-sm"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img
                    src={LocationIcon}
                    alt="Location Icon"
                    className="w-5 h-5 ml-2 flex-shrink-0"
                  />
                </div>
              </div>

              {/* Preferred Volunteering Types - Full Width */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Volunteering Types *
                </label>
                <div className="border border-gray-300 rounded-lg p-5 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {volunteeringOptions.map((option) => (
                      <label 
                        key={option} 
                        className="flex items-start p-3 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors border border-transparent hover:border-emerald-200"
                      >
                        <input
                          type="checkbox"
                          checked={formData.preferredVolunteering.includes(option)}
                          onChange={() => handleVolunteeringChange(option)}
                          disabled={loading || logoUploading}
                          className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                        />
                        <span className="ml-3 text-sm text-gray-700 leading-tight">{option}</span>
                      </label>
                    ))}
                  </div>
                  {formData.preferredVolunteering.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-emerald-200">
                      <p className="text-xs text-emerald-700 font-semibold">
                        Selected ({formData.preferredVolunteering.length}): {formData.preferredVolunteering.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={loading || logoUploading}
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-emerald-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base"
              >
                {loading ? "Registering..." : logoUploading ? "Uploading Logo..." : "Register NGO"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Modal */}
      {modalConfig && (
        <ConfirmationModal
          title={modalConfig.title}
          message={modalConfig.message}
          onConfirm={modalConfig.onConfirm}
          onCancel={modalConfig.onCancel}
          type={modalConfig.type || "confirm"}
        />
      )}
    </div>
  );
}

export default AddNGOPage;