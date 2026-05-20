import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeProvider';
import { Moon, Sun, Bell, BellOff, Save } from 'lucide-react';

const STORAGE_KEY = 'student-settings';

const StudentSettingsPage = () => {
  const { isDark, theme, toggleTheme } = useTheme();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [attendanceReminders, setAttendanceReminders] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setEmailAlerts(parsed.emailAlerts ?? true);
      setAttendanceReminders(parsed.attendanceReminders ?? true);
    } catch {
      // Ignore invalid localStorage content.
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        emailAlerts,
        attendanceReminders,
      })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const cardClass = `rounded-3xl border p-6 ${
    isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
  }`;

  return (
    <div className="space-y-6">
      <div className={cardClass}>
        <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Student Settings
        </p>
        <h1 className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Preferences</h1>
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Theme</p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Current: {theme}</p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
              isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            Toggle Theme
          </button>
        </div>
      </div>

      <div className={cardClass}>
        <div className="space-y-4">
          <label className="flex items-center justify-between gap-4">
            <div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Email Alerts</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Get updates for attendance and new materials.</p>
            </div>
            <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="h-4 w-4" />
          </label>

          <label className="flex items-center justify-between gap-4">
            <div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Attendance Reminders</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Notify me before attendance window closes.</p>
            </div>
            <input type="checkbox" checked={attendanceReminders} onChange={(e) => setAttendanceReminders(e.target.checked)} className="h-4 w-4" />
          </label>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white"
          >
            <Save size={16} /> Save Settings
          </button>
          {saved && (
            <span className={`text-sm font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
              Saved locally
            </span>
          )}
        </div>

        <div className={`mt-6 flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {emailAlerts || attendanceReminders ? <Bell size={14} /> : <BellOff size={14} />}
          Notifications are {emailAlerts || attendanceReminders ? 'enabled' : 'disabled'}.
        </div>
      </div>
    </div>
  );
};

export default StudentSettingsPage;
