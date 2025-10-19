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

      console.log('Uploading NGO logo:', {
        name: file.name,
        size: file.size,
        type: file.type,
        filePath,
        ngoCode: formData.ngoCode
      });

      const uploadOptions = {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      };

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("centro_bucket")
        .upload(filePath, file, uploadOptions);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
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
        console.log('Starting logo upload...');
        logoUrl = await uploadNgoLogo(formData.logo);
        if (!logoUrl) {
          console.error('Logo upload failed, aborting NGO creation');
          setLoading(false);
          return;
        }
        console.log('Logo uploaded successfully:', logoUrl);
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
    <div className="flex min-h-screen bg-no-repeat bg-center" style={{ backgroundImage: `url(${CentroAdminBg})`, backgroundSize: "100% 100%" }}>
      <Sidebar handleAlert={(msg) => alert(msg)} />
      <main className="ml-64 flex-1 p-4 bg-gray-50 min-h-screen overflow-y-auto">
        <div className="flex items-center justify-center min-h-full py-4">
          <div className="bg-white shadow-2xl rounded-2xl w-full max-w-5xl border border-emerald-200 relative">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 text-white text-2xl font-bold leading-none transition-all duration-300 hover:scale-110 hover:rotate-90 cursor-pointer bg-emerald-700 rounded-full w-8 h-8 flex items-center justify-center focus:outline-none shadow-lg"
              disabled={loading || logoUploading}
              title="Close and return to NGO Hub"
            >
              ✕
            </button>

            <div className="bg-emerald-700 py-3 px-6 text-white text-center rounded-t-2xl">
              <h1 className="text-2xl font-extrabold">Register New NGO</h1>
              <p className="text-xs opacity-90">Fill in the details below</p>
            </div>

            <form onSubmit={handleSubmitClick} className="p-6">
              <div className="grid grid-cols-1 gap-3">
                
                {/* Row 1: Login ID + Password */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Login ID *</label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-emerald-500">
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
                      <img src={AdminIcon} alt="Login" className="w-4 h-4 ml-2 flex-shrink-0" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Password *</label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-emerald-500">
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
                        alt="Toggle"
                        className="w-4 h-4 ml-2 cursor-pointer flex-shrink-0"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Admin ID + Admin Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Admin ID *</label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-emerald-500">
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
                      <img src={AdminIcon} alt="Admin" className="w-4 h-4 ml-2 flex-shrink-0" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Admin Type</label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-emerald-500">
                      <select
                        name="adminType"
                        value={formData.adminType}
                        onChange={handleChange}
                        className="w-full outline-none bg-transparent text-sm"
                        disabled={loading || logoUploading}
                      >
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Row 3: NGO Code + NGO Logo */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">NGO Code *</label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-emerald-500">
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
                      <img src={NGOLogoIcon} alt="Code" className="w-4 h-4 ml-2 flex-shrink-0" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">NGO Logo</label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-emerald-500">
                      <input
                        type="file"
                        name="logo"
                        accept={supportedImageTypes.join(',')}
                        onChange={handleChange}
                        className="w-full outline-none text-xs cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-emerald-50 file:text-emerald-700"
                        disabled={loading || logoUploading}
                      />
                      <img src={FileIcon} alt="File" className="w-4 h-4 ml-1 flex-shrink-0" />
                    </div>
                    {logoPreview && (
                      <img src={logoPreview} alt="Preview" className="mt-1 h-10 w-auto object-contain rounded border" />
                    )}
                  </div>
                </div>

                {/* Row 4: NGO Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">NGO Name *</label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-emerald-500">
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
                    <img src={NGOLogoIcon} alt="Name" className="w-4 h-4 ml-2 flex-shrink-0" />
                  </div>
                </div>

                {/* Row 5: Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Short description"
                    rows="2"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                    disabled={loading || logoUploading}
                  />
                </div>

                {/* Row 6: Address */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Address *</label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-emerald-500">
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
                    <img src={LocationIcon} alt="Address" className="w-4 h-4 ml-2 flex-shrink-0" />
                  </div>
                </div>

                {/* Row 7: Phone + Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-emerald-500">
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
                      <img src={PhoneIcon} alt="Phone" className="w-4 h-4 ml-2 flex-shrink-0" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Official Email *</label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-emerald-500">
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
                      <img src={EmailIcon} alt="Email" className="w-4 h-4 ml-2 flex-shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Row 8: NGO Location */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">NGO Location *</label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-emerald-500">
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
                    <img src={LocationIcon} alt="Location" className="w-4 h-4 ml-2 flex-shrink-0" />
                  </div>
                </div>

                {/* Row 9: Preferred Volunteering Types - 4 columns x 2 rows */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Preferred Volunteering Types *
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                      {volunteeringOptions.map((option) => (
                        <label 
                          key={option} 
                          className="flex items-start p-2 rounded-md hover:bg-emerald-50 cursor-pointer transition-colors border border-transparent hover:border-emerald-200"
                        >
                          <input
                            type="checkbox"
                            checked={formData.preferredVolunteering.includes(option)}
                            onChange={() => handleVolunteeringChange(option)}
                            disabled={loading || logoUploading}
                            className="w-4 h-4 mt-0.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                          />
                          <span className="ml-2 text-xs text-gray-700 leading-snug">{option}</span>
                        </label>
                      ))}
                    </div>
                    {formData.preferredVolunteering.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-emerald-200 bg-white rounded px-3 py-2">
                        <p className="text-xs text-emerald-700 font-semibold">
                          Selected ({formData.preferredVolunteering.length}): {formData.preferredVolunteering.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading || logoUploading}
                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-emerald-700 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  >
                    {loading ? "Registering..." : logoUploading ? "Uploading Logo..." : "Register NGO"}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>
      </main>

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