import React from 'react';
import { useSelector } from 'react-redux';
import { User, Mail, Phone, Building2, BriefcaseBusiness, BadgeCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeProvider';

const Row = ({ icon, label, value, isDark }) => (
  <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
    <div className="flex items-center gap-3">
      <div className={`rounded-xl p-2 ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>{icon}</div>
      <div>
        <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value || 'Not set'}</p>
      </div>
    </div>
  </div>
);

const TeacherProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useTheme();

  return (
    <div className="space-y-6 p-6">
      <div className={`rounded-3xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
        <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Teacher Profile
        </p>
        <h1 className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {user?.firstName} {user?.lastName}
        </h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Personal and faculty details at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Row icon={<Mail size={16} />} label="Email" value={user?.email} isDark={isDark} />
        <Row icon={<Phone size={16} />} label="Mobile" value={user?.mobile} isDark={isDark} />
        <Row icon={<BriefcaseBusiness size={16} />} label="Employee ID" value={user?.employeeId} isDark={isDark} />
        <Row icon={<Building2 size={16} />} label="Department" value={user?.department?.name || user?.department} isDark={isDark} />
        <Row icon={<BadgeCheck size={16} />} label="Status" value={user?.status || 'active'} isDark={isDark} />
        <Row icon={<User size={16} />} label="Role" value={user?.role || 'teacher'} isDark={isDark} />
      </div>
    </div>
  );
};

export default TeacherProfilePage;
