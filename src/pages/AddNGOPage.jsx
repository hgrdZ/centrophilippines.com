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

  const handleClose = () => {
    const hasFormData = Object.entries(formData).some(([key, value]) => {
      if (key === 'adminType') return value !== 'admin';
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

  const validateFile = (file) => {
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

    const maxSize = 10 * 1024 * 1024;
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
        e.target.value = '';
        return;
      }

      setFormData({ ...formData, logo: file });

      if (file.type !== 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (event) => {
          setLogoPreview(event.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setLogoPreview(null);
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

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

  const uploadNgoLogo = async (file) => {
    if (!file) return null;

    setLogoUploading(true);
    try {
      const fileExt = file.name.split('.').pop().toLowerCase();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const fileName = `${formData.ngoCode}_logo_${timestamp}_${randomStr}.${fileExt}`;
      const filePath = `ngo_logo/${fileName}`;

      const uploadOptions = {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      };

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("centro_bucket")
        .upload(filePath, file, uploadOptions);

      if (uploadError) {
        if (uploadError.message.includes('row_level_security')) {
          const { data: retryData, error: retryError } = await supabase.storage
            .from("centro_bucket")
            .upload(filePath, file, {
              ...uploadOptions,
              upsert: true
            });
          
          if (retryError) throw retryError;
        } else {
          throw uploadError;
        }
      }

      const { data: urlData } = supabase.storage
        .from("centro_bucket")
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      return urlData.publicUrl;

    } catch (error) {
      console.error("Error uploading logo:", error);
      
      if (error.message.includes('row_level_security')) {
        setModalConfig({
          title: "Storage Permission Error",
          message: "Storage permission error. Please make sure you're logged in as an admin.",
          onCancel: () => setModalConfig(null),
          type: "alert",
        });
      } else {
        setModalConfig({
          title: "Upload Error",
          message: `Error uploading logo: ${error.message}. Please try again.`,
          onCancel: () => setModalConfig(null),
          type: "alert",
        });
      }
      
      return null;
    } finally {
      setLogoUploading(false);
    }
  };

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

  const handleSubmitClick = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

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

      let logoUrl = null;
      if (formData.logo) {
        logoUrl = await uploadNgoLogo(formData.logo);
        if (!logoUrl) {
          setLoading(false);
          return;
        }
      }

      const adminId = await getNextAdminId();
      const loginId = await getNextLoginId();

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
        preferred_volunteering: formData.preferredVolunteering.join("-")
      };

      const { error: ngoError } = await supabase
        .from("NGO_Information")
        .insert([ngoData]);

      if (ngoError) throw ngoError;

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
        await supabase.from("NGO_Information").delete().eq("admin_id", adminId);
        throw adminError;
      }
      
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
    <div className="flex min-h-screen bg-no-repeat bg-center" style={{ backgroundImage: `url(${CentroAdminBg})`, backgroundSize: "100% 100%" }}>
      <Sidebar handleAlert={(msg) => alert(msg)} />
      <main className="ml-64 flex-1 p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white shadow-2xl rounded-2xl w-full max-w-3xl overflow-hidden border border-emerald-200 text-center relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 z-10 text-white text-4xl font-bold leading-none transition-all duration-300 hover:scale-110 hover:rotate-90 cursor-pointer bg-emerald-700 rounded-full w-10 h-10 flex items-center justify-center focus:outline-none"
            disabled={loading || logoUploading}
            title="Close and return to NGO Hub"
          >
            ✕
          </button>

          {/* Header */}
          <div className="bg-emerald-700 py-6 px-8 text-white">
            <h1 className="text-3xl font-extrabold">Register New NGO</h1>
            <p className="text-sm opacity-80">Fill in the details below</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitClick} className="p-8 space-y-5 text-left">
            {/* Row 1: Login ID + Password */}
            <div className="w-full flex flex-wrap gap-6">
              <div className="flex-1 min-w-[250px]">
                <label className="block mb-2 font-semibold text-base text-emerald-900">Login ID</label>
                <div className="flex items-center border border-emerald-300 bg-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                  <input
                    type="text"
                    name="loginId"
                    value={formData.loginId}
                    onChange={handleChange}
                    placeholder="Enter login ID"
                    className="w-full border-none focus:outline-none cursor-pointer text-gray-700 bg-transparent"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img src={AdminIcon} alt="Login Icon" className="w-5 h-5 ml-2 opacity-70 flex-shrink-0" />
                </div>
              </div>

              <div className="flex-1 min-w-[250px]">
                <label className="block mb-2 font-semibold text-base text-emerald-900">Password</label>
                <div className="flex items-center border border-emerald-300 bg-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="w-full border-none focus:outline-none cursor-pointer text-gray-700 bg-transparent"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img
                    src={showPassword ? ShowPasswordIcon : PasswordIcon}
                    alt={showPassword ? "Hide password" : "Password icon"}
                    className="w-5 h-5 ml-2 opacity-70 cursor-pointer hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide Password" : "Show Password"}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Admin ID + Admin Type */}
            <div className="w-full flex flex-wrap gap-6">
              <div className="flex-1 min-w-[250px]">
                <label className="block mb-2 mt-2 font-semibold text-base text-emerald-900">Admin ID *</label>
                <div className="flex items-center border border-emerald-300 bg-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                  <input
                    type="text"
                    name="adminId"
                    value={formData.adminId}
                    onChange={handleChange}
                    placeholder="Enter admin ID"
                    className="w-full border-none focus:outline-none cursor-pointer text-gray-700 bg-transparent"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img src={AdminIcon} alt="Admin Icon" className="w-5 h-5 ml-2 opacity-70 flex-shrink-0" />
                </div>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block mb-2 mt-2 font-semibold text-base text-emerald-900">Admin Type</label>
                <div className="flex items-center border border-emerald-300 bg-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                  <select
                    name="adminType"
                    value={formData.adminType}
                    onChange={handleChange}
                    className="w-full border-none focus:outline-none cursor-pointer bg-transparent text-gray-700"
                    disabled={loading || logoUploading}
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 3: NGO Code + NGO Logo */}
            <div className="w-full flex flex-wrap gap-6">
              <div className="flex-1 min-w-[250px]">
                <label className="block mb-2 mt-2 font-semibold text-base text-emerald-900">NGO Code *</label>
                <div className="flex items-center border border-emerald-300 bg-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                  <input
                    type="text"
                    name="ngoCode"
                    value={formData.ngoCode}
                    onChange={handleChange}
                    placeholder="Enter unique NGO code"
                    className="w-full border-none focus:outline-none cursor-pointer text-gray-700 bg-transparent"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img src={NGOLogoIcon} alt="NGO Code Icon" className="w-5 h-5 ml-2 opacity-70 flex-shrink-0" />
                </div>
              </div>

              <div className="flex-1 min-w-[280px]">
                <label className="block mb-2 mt-2 font-semibold text-base text-emerald-900">NGO Logo</label>
                <div className="flex items-center border border-emerald-300 bg-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                  <input
                    type="file"
                    name="logo"
                    accept={supportedImageTypes.join(',')}
                    onChange={handleChange}
                    className="w-full border-none focus:outline-none cursor-pointer text-gray-700 bg-transparent text-sm"
                    disabled={loading || logoUploading}
                  />
                  <img src={FileIcon} alt="NGO Logo Icon" className="w-5 h-5 ml-2 opacity-70 flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Supported: jpg, jpeg, png, gif, webp, svg, bmp. Max: 10MB
                </p>
                
                {logoPreview && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <img src={logoPreview} alt="Logo Preview" className="max-w-full h-20 object-contain mx-auto rounded border" />
                    <p className="text-sm text-gray-600 mt-2 font-medium">{formData.logo.name}</p>
                  </div>
                )}
                
                {formData.logo && !logoPreview && (
                  <div className="mt-2 p-2 bg-emerald-100 rounded text-sm text-emerald-800">
                    File selected: {formData.logo.name}
                  </div>
                )}

                {logoUploading && (
                  <div className="mt-2 p-2 bg-blue-100 rounded text-sm text-blue-800">
                    Uploading logo...
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: NGO Name (full width) */}
            <div>
              <label className="block mb-2 font-semibold text-base text-emerald-900">NGO Name *</label>
              <div className="flex items-center border border-emerald-300 bg-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter NGO name"
                  className="w-full border-none focus:outline-none cursor-pointer text-gray-700 bg-transparent"
                  required
                  disabled={loading || logoUploading}
                />
                <img src={NGOLogoIcon} alt="NGO Name Icon" className="w-5 h-5 ml-2 opacity-70 flex-shrink-0" />
              </div>
            </div>

            {/* Row 5: Description (full width) */}
            <div>
              <label className="block mb-2 mt-2 font-semibold text-base text-emerald-900">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Short description"
                rows="4"
                className="w-full border border-emerald-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer"
                disabled={loading || logoUploading}
              />
            </div>

            {/* Row 6: Address (full width) */}
            <div>
              <label className="block mb-2 mt-2 font-semibold text-base text-emerald-900">Address *</label>
              <div className="flex items-center border border-emerald-300 bg-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter NGO address"
                  className="w-full border-none focus:outline-none cursor-pointer text-gray-700 bg-transparent"
                  required
                  disabled={loading || logoUploading}
                />
                <img src={LocationIcon} alt="Address Icon" className="w-5 h-5 ml-2 opacity-70 flex-shrink-0" />
              </div>
            </div>

            {/* Row 7: Phone + Email */}
            <div className="w-full flex flex-wrap gap-6">
              <div className="flex-1 min-w-[250px]">
                <label className="block mb-2 mt-2 font-semibold text-base text-emerald-900">Phone Number *</label>
                <div className="flex items-center border border-emerald-300 bg-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full border-none focus:outline-none cursor-pointer text-gray-700 bg-transparent"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img src={PhoneIcon} alt="Phone Icon" className="w-5 h-5 ml-2 opacity-70 flex-shrink-0" />
                </div>
              </div>

              <div className="flex-1 min-w-[250px]">
                <label className="block mb-2 mt-2 font-semibold text-base text-emerald-900">Official Email *</label>
                <div className="flex items-center border border-emerald-300 bg-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className="w-full border-none focus:outline-none cursor-pointer text-gray-700 bg-transparent"
                    required
                    disabled={loading || logoUploading}
                  />
                  <img src={EmailIcon} alt="Email Icon" className="w-5 h-5 ml-2 opacity-70 flex-shrink-0" />
                </div>
              </div>
            </div>

            {/* Row 8: NGO Location (full width) */}
            <div>
              <label className="block mb-2 mt-2 font-semibold text-base text-emerald-900">NGO Location *</label>
              <div className="flex items-center border border-emerald-300 bg-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter NGO location"
                  className="w-full border-none focus:outline-none cursor-pointer text-gray-700 bg-transparent"
                  required
                  disabled={loading || logoUploading}
                />
                <img src={LocationIcon} alt="Location Icon" className="w-5 h-5 ml-2 opacity-70 flex-shrink-0" />
              </div>
            </div>

            {/* Row 9: Preferred Volunteering Types - Fixed 2 Rows x 4 Columns */}
<div>
  <label className="block mb-2 mt-2 font-semibold text-base text-emerald-900">
    Preferred Volunteering Types *
  </label>
  <div className="border border-emerald-300 rounded-lg p-4 bg-white focus-within:ring-2 focus-within:ring-emerald-400">
    {/* First Row - 4 items */}
    <div className="flex flex-wrap gap-4 mb-3">
      {volunteeringOptions.slice(0, 4).map((option) => (
        <label
          key={option}
          className="flex items-start p-2 rounded hover:bg-emerald-50 cursor-pointer transition-colors"
          style={{ width: 'calc(25% - 12px)' }}
        >
          <input
            type="checkbox"
            checked={formData.preferredVolunteering.includes(option)}
            onChange={() => handleVolunteeringChange(option)}
            disabled={loading || logoUploading}
            className="w-4 h-4 mt-0.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer flex-shrink-0"
          />
          <span className="ml-3 text-sm text-gray-700 leading-tight">{option}</span>
        </label>
      ))}
    </div>

    {/* Second Row - 4 items */}
    <div className="flex flex-wrap gap-4">
      {volunteeringOptions.slice(4, 8).map((option) => (
        <label
          key={option}
          className="flex items-start p-2 rounded hover:bg-emerald-50 cursor-pointer transition-colors"
          style={{ width: 'calc(25% - 12px)' }}
        >
          <input
            type="checkbox"
            checked={formData.preferredVolunteering.includes(option)}
            onChange={() => handleVolunteeringChange(option)}
            disabled={loading || logoUploading}
            className="w-4 h-4 mt-0.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer flex-shrink-0"
          />
          <span className="ml-3 text-sm text-gray-700 leading-tight">{option}</span>
        </label>
      ))}
    </div>

    {/* Selected Count */}
    {formData.preferredVolunteering.length > 0 && (
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-sm text-teal-700">
          <span className="font-medium">Selected ({formData.preferredVolunteering.length}):</span>{" "}
          {formData.preferredVolunteering.join(", ")}
        </p>
      </div>
    )}
  </div>
</div>

            {/* Submit Button */}
            <div className="pt-2 mt-4">
              <button
                type="submit"
                disabled={loading || logoUploading}
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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