  // authSlice.js
  import { createSlice } from '@reduxjs/toolkit';
  import { register, login, logout, getCurrentUser, updateProfile, getDepartments } from './authThunks';

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('authToken');

  const initialState = {
    user: user || null,
    token: token || null,
    isAuthenticated: !!token,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
    departments: [],
  };

  const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
      reset: (state) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.isError = false;
        state.message = '';
      }
    },
    extraReducers: (builder) => {
      builder
        // Register cases
        .addCase(register.pending, (state) => {
          state.isLoading = true;
        })
        .addCase(register.fulfilled, (state, action) => {
          state.isLoading = false;
          state.isSuccess = true;
          // Only authenticate if a token was returned (Active users, not Pending ones)
          if (action.payload?.token) {
            state.isAuthenticated = true;
            state.user = action.payload.user;      
            state.token = action.payload.token;
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            localStorage.setItem('authToken', action.payload.token);
          } else {
            // Clear any local state if no token was provided (Pending Teacher)
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
          }
        })
        .addCase(register.rejected, (state, action) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload;
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        })
        
        // Login cases
        .addCase(login.pending, (state) => {
          state.isLoading = true;
        })
        .addCase(login.fulfilled, (state, action) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
        })
        .addCase(login.rejected, (state, action) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload;
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        })
        
        // Logout case
        .addCase(logout.fulfilled, (state) => {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        })
        
        // Get current user cases
        .addCase(getCurrentUser.pending, (state) => {
          state.isLoading = true;
        })
        .addCase(getCurrentUser.fulfilled, (state, action) => {
          state.isLoading = false;
          
          if (action.payload) {
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
          } else {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
          }
        })
        .addCase(getDepartments.fulfilled, (state, action) => {
          // Ensure departments is always an array (empty when none or on errors)
          state.departments = Array.isArray(action.payload) ? action.payload : [];
        })
        .addCase(getCurrentUser.rejected, (state) => {
          state.isLoading = false;
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        })
        
        // Update profile cases
        .addCase(updateProfile.pending, (state) => {
          state.isLoading = true;
        })
        .addCase(updateProfile.fulfilled, (state, action) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.user = action.payload.user;
        })
        .addCase(updateProfile.rejected, (state, action) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload;
        });
    }
  });

  export const { reset } = authSlice.actions;
  export default authSlice.reducer;