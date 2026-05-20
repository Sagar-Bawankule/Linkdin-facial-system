import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { Users, GraduationCap } from 'lucide-react';

import { register, getDepartments } from '../../app/features/auth/authThunks';
import { reset } from '../../app/features/auth/authSlice';
import { useTheme } from './../../context/ThemeProvider';

import AuthLayout from '../../components/auth/AuthLayout';
import UnifiedSignupForm from '../../components/auth/UnifiedSignupForm';

const Signup = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isDark, theme } = useTheme();
    
    const { isLoading: isSubmitting, isSuccess, isError, isAuthenticated, message, departments } = useSelector(
      (state) => state.auth
    );
    const safeDepartments = Array.isArray(departments) ? departments : [];

    const [profileImage, setProfileImage] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);
    const [faceEmbedding, setFaceEmbedding] = useState(null);
    const [faceEmbeddingSamples, setFaceEmbeddingSamples] = useState([]);
    const [faceLivenessScore, setFaceLivenessScore] = useState(0);
    
    const [formData, setFormData] = useState({
      firstName: '', lastName: '', email: '', password: '', 
      mobile: '', dateOfBirth: '', gender: '', role: '',
      permanentAddress: { street: '', city: '', state: '', pincode: '', country: '' },
      currentAddress: { street: '', city: '', state: '', pincode: '', country: '' },
      rollNumber: '', admissionYear: '', group: '', 
      employeeId: '', department: '', studentEmail: ''
    });
    
    const [errors, setErrors] = useState({});

    useEffect(() => {
      dispatch(getDepartments());
    }, [dispatch]);

    useEffect(() => {
      if (isSuccess) {
        if (isAuthenticated) {
          // User got a token (students, admins) — navigate to their dashboard
          toast.success('Registration Successful!');
          setTimeout(() => {
            const dashPaths = { admin: '/admin/dashboard', student: '/student/dashboard', teacher: '/teacher/dashboard', parent: '/parent/dashboard' };
            navigate(dashPaths[formData.role] || '/');
            dispatch(reset());
          }, 2000);

        } else {
          // No token was returned (pending teacher) — redirect to login
          toast.success('Signup successful! An admin will check your account soon. Please wait for a few days.', { duration: 6000 });
          setTimeout(() => {
            navigate('/login');
            dispatch(reset());
          }, 4000);
        }
      }
      if (isError) {
        console.error('SIGNUP ERROR RESPONSE:', message);
        toast.error(typeof message === 'object' ? (message.message || 'Registration Failed') : (message || 'Registration Failed'));
        dispatch(reset());
      }
    }, [isSuccess, isError, isAuthenticated, message, dispatch, navigate, formData.role]);


    const handleChange = (e) => {
      const { name, value } = e.target;
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormData({ ...formData, [parent]: { ...formData[parent], [child]: value } });
      } else {
        setFormData({ ...formData, [name]: value });
      }
      
      // Clear specific error on change
      if (errors[name]) {
        setErrors({ ...errors, [name]: null });
      }
    };

    const validateForm = () => {
      const newErrors = {};
      const isParent = formData.role === 'parent';
      if (!formData.role) newErrors.role = "Required";
      if (!formData.firstName) newErrors.firstName = "Required";
      if (!formData.lastName) newErrors.lastName = "Required";
      if (!formData.email) newErrors.email = "Required";
      if (!formData.password) newErrors.password = "Required";
      if (formData.password.length < 8) newErrors.password = "Minimum 8 characters";
      if (!isParent && !formData.department) newErrors.department = "Required";
      if (isParent && !formData.studentEmail) newErrors.studentEmail = "Child's email is required";

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      const registrationData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !(value instanceof File)) {
          registrationData.append(key, JSON.stringify(value));
        } else {
          registrationData.append(key, value);
        }
      });
      
      if (profileImage) registrationData.append('profileImage', profileImage);
      if (faceEmbedding) registrationData.append('faceEmbedding', JSON.stringify(faceEmbedding));
      if (faceEmbeddingSamples.length > 0) registrationData.append('faceEmbeddingSamples', JSON.stringify(faceEmbeddingSamples));
      if (faceLivenessScore) registrationData.append('faceLivenessScore', String(faceLivenessScore));
      
      dispatch(register(registrationData));
    };

    const isStudent = formData.role === 'student';

    return (
      <AuthLayout 
        title={isStudent ? "Student Join Form" : (formData.role === 'teacher' ? "Teacher Join Form" : "Create Account")} 
        subtitle={isStudent ? "Join to track your attendance and grades." : "Join the campus portal."}
        icon={isStudent ? GraduationCap : Users}
      >
        <UnifiedSignupForm 
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          theme={theme}
          departments={safeDepartments}
          setProfileImage={setProfileImage}
          setProfileImagePreview={setProfileImagePreview}
          setFaceEmbedding={setFaceEmbedding}
          setFaceEmbeddingSamples={setFaceEmbeddingSamples}
          setFaceLivenessScore={setFaceLivenessScore}
          profileImagePreview={profileImagePreview}
          errors={errors}
        />

        <div className="mt-8 text-center pt-8 border-t border-slate-200 dark:border-white/5">
          <p className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Already have an account?
          </p>
          <button 
            type="button"
            onClick={() => navigate('/login')}
            className="mt-2 text-brand-primary font-black uppercase tracking-widest hover:underline text-xs"
          >
            Login Here
          </button>
        </div>
      </AuthLayout>
    );
};

export default Signup;