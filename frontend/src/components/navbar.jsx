import React, { useState } from "react";
import { User, Bell, LogOut, Settings, Moon, Sun, Search, Activity } from "lucide-react";
import { useTheme } from "../context/ThemeProvider";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../app/features/auth/authThunks";
import { Link } from "react-router-dom";

const Navbar = ({
  title = "SmartAttend Secure",
  userName = "User",
  showThemeToggle = true,
  showNotifications = true,
  showProfile = true
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();
  
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);

  const role = user?.role;
  const profileRoute = role === 'admin'
    ? '/admin/dashboard'
    : role === 'teacher'
      ? '/teacher/profile'
      : role === 'student'
        ? '/student/profile'
        : role === 'parent'
          ? '/parent/dashboard'
          : '/';

  const settingsRoute = role === 'admin'
    ? '/admin/adminSettings'
    : role === 'teacher'
      ? '/teacher/settings'
      : role === 'student'
        ? '/student/settings'
        : role === 'parent'
          ? '/parent/dashboard'
          : '/';

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (showNotificationsPanel) setShowNotificationsPanel(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    setShowDropdown(false);
  };

  const displayName = user?.firstName || userName;

  return (
    <nav
      className={`
        sticky top-0 w-full z-40 px-8 py-4 flex justify-between items-center 
        transition-all duration-300 border-b
        ${isDark ? 'bg-[#020617]/80 backdrop-blur-xl border-white/5' : 'bg-white/80 backdrop-blur-xl border-slate-200/60'}
      `}
    >
      {/* Title / Search */}
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-2 md:hidden">
           <Activity className="text-brand-primary" size={20} />
           <span className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>SmartAttend</span>
        </div>
        
        <div className="hidden md:flex items-center relative group">
          <Search className={`absolute left-4 w-4 h-4 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-brand-primary' : 'text-slate-400 group-focus-within:text-brand-primary'}`} />
          <input 
            type="text" 
            placeholder="Search dashboard..." 
            className={`
              pl-11 pr-4 py-2.5 text-sm rounded-2xl w-72 transition-all duration-300 font-bold border-none
              ${isDark ? 'bg-white/5 text-white focus:bg-white/10' : 'bg-slate-50 text-slate-800 focus:bg-white focus:shadow-sm'}
              focus:outline-none focus:ring-4 focus:ring-brand-primary/10
            `}
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Notifications */}
        {showNotifications && (
          <button 
            onClick={() => setShowNotificationsPanel(!showNotificationsPanel)} 
            className={`
              p-2.5 rounded-xl transition-all duration-300 relative
              ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}
            `}
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2.5 h-2 w-2 bg-brand-primary rounded-full border-2 border-white dark:border-[#020617]"></span>
          </button>
        )}

        {/* Theme Toggle */}
        {showThemeToggle && (
          <button 
            onClick={toggleTheme} 
            className={`
              p-2.5 rounded-xl transition-all duration-300
              ${isDark ? 'bg-white/5 hover:bg-white/10 text-amber-300' : 'bg-slate-50 hover:bg-slate-100 text-brand-primary'}
            `}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}

        <div className={`h-8 w-px mx-1 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>

        {/* Profile */}
        {showProfile && isAuthenticated && (
          <div className="relative">
            <button 
              onClick={toggleDropdown} 
              className={`
                flex items-center gap-3 p-1.5 rounded-2xl transition-all duration-300 group
                ${isDark ? 'bg-white/5 hover:bg-white/10 border border-white/5' : 'bg-slate-50 hover:bg-slate-100 border border-slate-100'}
              `}
            >
              <div className="h-9 w-9 rounded-xl bg-brand-primary/10 flex items-center justify-center overflow-hidden border border-brand-primary/20">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="text-brand-primary" size={20} />
                )}
              </div>
              <span className={`text-sm font-black uppercase tracking-widest hidden md:block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {displayName}
              </span>
            </button>

            {showDropdown && (
              <div className={`
                absolute right-0 mt-3 w-64 p-3 z-50 rounded-[32px]
                ${isDark ? 'bg-[#020617] border border-white/10 shadow-2xl text-white' : 'bg-white border border-slate-200 shadow-xl text-slate-800'}
                animate-in fade-in slide-in-from-top-2 duration-300
              `}>
                <div className="p-4 mb-2 border-b border-slate-100 dark:border-white/5">
                   <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Signed in as</p>
                   <p className="font-black text-sm">{user?.email}</p>
                </div>
                <Link
                  to={profileRoute}
                  className={`flex items-center gap-3 p-3.5 text-sm rounded-2xl transition-all duration-300 font-black uppercase tracking-widest ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  <User size={18} className="text-brand-primary" /> Profile
                </Link>
                <Link
                  to={settingsRoute}
                  className={`flex items-center gap-3 p-3.5 text-sm rounded-2xl transition-all duration-300 font-black uppercase tracking-widest ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  <Settings size={18} className="text-slate-400" /> Settings
                </Link>
                <div className={`h-px my-2 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 p-3.5 text-sm rounded-2xl transition-all duration-300 text-brand-primary font-black uppercase tracking-widest ${isDark ? 'hover:bg-brand-primary/5' : 'hover:bg-indigo-50'}`}
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;