export const getUserRole = () => {
  const adminData = localStorage.getItem("admin");
  if (!adminData) return null;
  try {
    const admin = JSON.parse(adminData);
    return admin.role; // Make sure your Supabase table has 'role' column
  } catch {
    return null;
  }
};
