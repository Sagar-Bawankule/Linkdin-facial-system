import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeProvider';
import { Moon, Sun, Save } from 'lucide-react';

const STORAGE_KEY = 'teacher-settings';

const TeacherSettingsPage = () => {
  const { isDark, theme, toggleTheme } = useTheme();
  const [classAlerts, setClassAlerts] = useState(true);
  const [resultAlerts, setResultAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setClassAlerts(parsed.classAlerts ?? true);
      setResultAlerts(parsed.resultAlerts ?? true);
    } catch {
      // Ignore invalid localStorage content.
    }
  }, []);

  const onSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ classAlerts, resultAlerts }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const card = `rounded-3xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`;

  return (
    <div className="space-y-6 p-6">
      <div className={card}>
        <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Teacher Settings
        </p>
        <h1 className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Workspace Preferences</h1>
      </div>

      <div className={card}>
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

      <div className={card}>
        <div className="space-y-4">
          <label className="flex items-center justify-between gap-4">
            <div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Class Alerts</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Notify me when attendance windows are opened or closed.</p>
            </div>
            <input type="checkbox" checked={classAlerts} onChange={(e) => setClassAlerts(e.target.checked)} className="h-4 w-4" />
          </label>

          <label className="flex items-center justify-between gap-4">
            <div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Result Workflow Alerts</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Notify me when results submissions need action.</p>
            </div>
            <input type="checkbox" checked={resultAlerts} onChange={(e) => setResultAlerts(e.target.checked)} className="h-4 w-4" />
          </label>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="button" onClick={onSave} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white">
            <Save size={16} /> Save Settings
          </button>
          {saved && (
            <span className={`text-sm font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
              Saved locally
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherSettingsPage;
