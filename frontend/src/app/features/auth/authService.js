// authService.js
import axiosInstance from '../../../utils/axiosInstance';
const API_URL = ''; // base is handled by axiosInstance

// Register user
const register = async (userData) => {
  // Prepare FormData
  let dataToSend;
  if (userData instanceof FormData) {
    dataToSend = userData;
  } else {
    dataToSend = new FormData();
    Object.keys(userData).forEach(key => {
      if (typeof userData[key] === 'object' && userData[key] !== null && !(userData[key] instanceof File)) {
        dataToSend.append(key, JSON.stringify(userData[key]));
      } else {
        dataToSend.append(key, userData[key]);
      }
    });
  }

  const response = await axiosInstance.post('/auth/signup', dataToSend);

  if (response.data) {
    const { token, user } = response.data;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user }; // ✅ return consistent object
  }

  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await axiosInstance.post('/auth/login', userData);

  if (response.data) {
    const { token, user } = response.data;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    console.log(user);
    
    return { token, user }; 
  }

  return response.data;
};

// Logout user
const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

// Get current user
const getCurrentUser = async () => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!token) return null;

  try {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  } catch (error) {
    logout();
    return null;
  }
};
const getDepartments = async() => {
    try {
      const response = await axiosInstance.get('/auth/departments');
      const payload = response?.data;

      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.departments)) return payload.departments;
      if (Array.isArray(payload?.data)) return payload.data;

      return [];
    } catch (error) {
      console.log('error occured in fetching departments', error?.message || error);
      // Return empty array on network/error so callers can continue gracefully
      return [];
    }
}

// Update user profile
const updateProfile = async (userData) => {
  const token = localStorage.getItem('authToken');
  
  let dataToSend;
  if (userData instanceof FormData) {
    dataToSend = userData;
  } else {
    dataToSend = new FormData();
    Object.keys(userData).forEach(key => {
      if (typeof userData[key] === 'object' && userData[key] !== null && !(userData[key] instanceof File)) {
        dataToSend.append(key, JSON.stringify(userData[key]));
      } else {
        dataToSend.append(key, userData[key]);
      }
    });
  }

  const response = await axiosInstance.put('/users/profile', dataToSend, {
    headers: { 
      'Content-Type': 'multipart/form-data'
    },
  });
  
  if (response.data && response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response.data;
};

// Validate field (util function for form validation)
const validateField = (field, value, formData = {}) => {
  switch (field) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    
    case 'password':
      return value.length >= 6;
      
    case 'confirmPassword':
      return value === formData.password;
      
    default:
      return true;
  }
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  validateField,
  getDepartments
};

export default authService;