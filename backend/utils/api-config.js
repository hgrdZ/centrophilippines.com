const getApiUrl = () => {
  // If in browser
  if (typeof window !== 'undefined') {
    // Check if we're on Vercel production
    if (window.location.hostname.includes('vercel.app') || 
        window.location.hostname === 'your-custom-domain.com') {
      return ''; // Same domain, use relative paths
    }
    // Otherwise use localhost
    return 'http://localhost:3000';
  }
  
  // If in Node.js
  return process.env.API_URL || 'http://localhost:3000';
};

module.exports = { getApiUrl };