import React from 'react';
import { useSelector } from 'react-redux';
import { User, Mail, Phone, Building2, Users, IdCard } from 'lucide-react';
import { useTheme } from '../../context/ThemeProvider';

const InfoRow = ({ icon, label, value, muted = false, isDark }) => (
  <div
    className={`rounded-2xl border p-4 ${
      isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`rounded-xl p-2 ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>{icon}</div>
      <div className="min-w-0">
        <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {label}
        </p>
        <p className={`text-sm font-semibold truncate ${muted ? 'text-slate-400' : isDark ? 'text-white' : 'text-slate-900'}`}>
          {value || 'Not set'}
        </p>
      </div>
    </div>
  </div>
);

const StudentProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useTheme();

  return (
    <div className="space-y-6">
      <div className={`rounded-3xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
        <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Student Profile
        </p>
        <h1 className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {user?.firstName} {user?.lastName}
        </h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Review your basic account and academic details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoRow icon={<Mail size={16} />} label="Email" value={user?.email} isDark={isDark} />
        <InfoRow icon={<Phone size={16} />} label="Mobile" value={user?.mobile} muted={!user?.mobile} isDark={isDark} />
        <InfoRow icon={<IdCard size={16} />} label="Roll Number" value={user?.rollNumber} muted={!user?.rollNumber} isDark={isDark} />
        <InfoRow icon={<Building2 size={16} />} label="Department" value={user?.department?.name || user?.department} muted={!user?.department} isDark={isDark} />
        <InfoRow icon={<Users size={16} />} label="Group" value={user?.group?.name || user?.group} muted={!user?.group} isDark={isDark} />
        <InfoRow icon={<User size={16} />} label="Account Status" value={user?.status || 'active'} isDark={isDark} />
      </div>
    </div>
  );
};

export default StudentProfilePage;
