import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Lock, MapPin, Building, ShieldCheck, 
  GraduationCap, Users, Calendar, Hash, Camera, 
  Eye, EyeOff, Loader, Check, ChevronDown 
} from 'lucide-react';
import ProfileCameraCapture from '../ProfileCameraCapture';

const UnifiedSignupForm = ({ 
  formData, 
  handleChange, 
  handleSubmit, 
  isSubmitting, 
  theme, 
  departments,
  setProfileImage,
  setProfileImagePreview,
  setFaceEmbedding,
  setFaceEmbeddingSamples,
  setFaceLivenessScore,
  profileImagePreview,
  errors 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isDark = theme === 'dark';
  const safeDepartments = Array.isArray(departments) ? departments : [];

  const passwordRequirements = [
    { label: '8+ Characters', met: formData.password.length >= 8 },
    { label: 'Uppercase', met: /[A-Z]/.test(formData.password) },
    { label: 'Number', met: /\d/.test(formData.password) },
    { label: 'Special Symbol', met: /[^A-Za-z0-9]/.test(formData.password) },
  ];

  const isTeacher = formData.role === 'teacher';
  const isStudent = formData.role === 'student';
  const isParent = formData.role === 'parent';

  const inputClass = `w-full pl-12 pr-4 py-4 rounded-2xl border transition-all duration-500 outline-none font-bold text-sm ${
    isDark 
      ? 'bg-white/5 border-white/10 text-white focus:border-brand-primary/50 focus:bg-white/10 shadow-[inner_0_0_10px_rgba(255,255,255,0.02)]' 
      : 'bg-white border-slate-200 text-slate-900 focus:border-brand-primary/40 focus:bg-slate-50 shadow-sm'
  }`;

  const labelClass = `block text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 ${
    isDark ? 'text-slate-500' : 'text-slate-400'
  }`;

  return (
    <div className="space-y-8 pb-12">
      {/* Role Selection Dropdown */}
      <div className="relative group">
        <label className={labelClass}>Select your role</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-primary">
            {isTeacher ? <Users size={18} /> : isStudent ? <GraduationCap size={18} /> : <User size={18} />}
          </div>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={`${inputClass} appearance-none cursor-pointer pr-12`}
          >
            <option value="" disabled>I am a...</option>
            <option value="student">Student Account</option>
            <option value="teacher">Teacher Account</option>
            <option value="parent">Parent Account</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {formData.role && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Identity Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className={labelClass}>First Name</label>
                <div className="absolute top-[38px] left-0 pl-4 flex items-center pointer-events-none text-brand-primary">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className={`${inputClass} ${errors?.firstName ? 'border-red-500/50' : ''}`}
                />
              </div>
              <div className="relative">
                <label className={labelClass}>Last Name</label>
                <div className="absolute top-[38px] left-0 pl-4 flex items-center pointer-events-none text-brand-primary">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className={`${inputClass} ${errors?.lastName ? 'border-red-500/50' : ''}`}
                />
              </div>
            </div>

            {/* Communication Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className={labelClass}>Email Address</label>
                <div className="absolute top-[38px] left-0 pl-4 flex items-center pointer-events-none text-brand-primary">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@university.edu"
                  className={`${inputClass} ${errors?.email ? 'border-red-500/50' : ''}`}
                />
              </div>
              <div className="relative">
                <label className={labelClass}>Password</label>
                <div className="absolute top-[38px] left-0 pl-4 flex items-center pointer-events-none text-brand-primary">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`${inputClass} pr-12 ${errors?.password ? 'border-red-500/50' : ''}`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-[38px] right-4 text-slate-400 hover:text-brand-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Validation Checklist */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 p-4 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
              {passwordRequirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full transition-colors ${req.met ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${req.met ? (isDark ? 'text-green-400' : 'text-green-600') : 'text-slate-400'}`}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Campus Info Group — hide for parents */}
            {!isParent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className={labelClass}>Department</label>
                <div className="absolute top-[38px] left-0 pl-4 flex items-center pointer-events-none text-brand-primary">
                  <Building size={18} />
                </div>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`${inputClass} appearance-none pr-10`}
                >
                  <option value="">Select Department</option>
                  {safeDepartments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
                <div className="absolute top-[38px] right-4 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>
              <div className="relative">
                <label className={labelClass}>Campus / Office Location</label>
                <div className="absolute top-[38px] left-0 pl-4 flex items-center pointer-events-none text-brand-primary">
                  <MapPin size={18} />
                </div>
                <input
                  type="text"
                  name="permanentAddress.street"
                  value={formData.permanentAddress.street}
                  onChange={handleChange}
                  placeholder="e.g. Block A, Room 302"
                  className={`${inputClass}`}
                />
              </div>
            </div>
            )}

            {/* Parent-specific: Child's College Email */}
            {isParent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`p-6 rounded-2xl border-2 border-dashed space-y-4 ${isDark ? 'border-purple-800 bg-purple-900/10' : 'border-purple-200 bg-purple-50'}`}
              >
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest mb-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>🎓 Connect with your child</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Enter your child's email address used in college to sync their attendance and marks.</p>
                </div>
                <div className="relative">
                  <label className={labelClass}>Child's Email *</label>
                  <div className="absolute top-[38px] left-0 pl-4 flex items-center pointer-events-none text-purple-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    name="studentEmail"
                    value={formData.studentEmail || ''}
                    onChange={handleChange}
                    placeholder="student@college.edu"
                    className={`${inputClass} focus:border-purple-500`}
                  />
                </div>
              </motion.div>
            )}

            {/* Conditional Student Fields */}
            {isStudent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-6 pt-4 border-t border-slate-200 dark:border-white/5"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <label className={labelClass}>Admission Year</label>
                    <div className="absolute top-[38px] left-0 pl-4 flex items-center pointer-events-none text-brand-primary">
                      <Calendar size={18} />
                    </div>
                    <input
                      type="number"
                      name="admissionYear"
                      value={formData.admissionYear}
                      onChange={handleChange}
                      placeholder="2024"
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <label className={labelClass}>Roll Number</label>
                    <div className="absolute top-[38px] left-0 pl-4 flex items-center pointer-events-none text-brand-primary">
                      <Hash size={18} />
                    </div>
                    <input
                      type="text"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleChange}
                      placeholder="CS24001"
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <label className={labelClass}>Mobile Number</label>
                    <div className="absolute top-[38px] left-0 pl-4 flex items-center pointer-events-none text-brand-primary">
                      <Hash size={18} />
                    </div>
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="10 Digits"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Face Capture Section for Student */}
                <div className="space-y-4">
                  <label className={labelClass}>Register your face</label>
                  <div className={`p-6 rounded-3xl border-2 border-dashed transition-all duration-300 ${
                    profileImagePreview 
                      ? 'border-brand-primary/50 bg-brand-primary/5' 
                      : (isDark ? 'border-white/10' : 'border-slate-200')
                  }`}>
                    <ProfileCameraCapture 
                      onImageCapture={(file, embedding, meta = {}) => {
                        setProfileImage(file);
                        setFaceEmbedding(embedding);
                        setFaceEmbeddingSamples(meta.samples || []);
                        setFaceLivenessScore(meta.livenessScore || 0);
                        setProfileImagePreview(URL.createObjectURL(file));
                      }} 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Submission Area */}
            <div className="pt-6">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-premium w-full flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                {isSubmitting ? (
                  <Loader className="animate-spin" size={20} />
                ) : (
                  <>
                    <ShieldCheck size={20} className="group-hover:scale-125 transition-transform duration-500" />
                    Create My Account
                  </>
                )}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnifiedSignupForm;
