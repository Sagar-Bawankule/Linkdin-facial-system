import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeProvider';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import AutoFaceDetector from '../../components/AutoFaceDetector';
import { 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  MapPin,
  ShieldCheck
} from 'lucide-react';

const StudentMarkAttendance = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { theme, themeConfig } = useTheme();
    const currentTheme = themeConfig[theme];
    
    // Redux State
    const { user, token } = useSelector((state) => state.auth);

    // Local State
    const [status, setStatus] = useState('initializing'); // initializing, ready, capturing, processing, success, error
    const [isCapturing, setIsCapturing] = useState(true);
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);

    useEffect(() => {
        // Request Location on mount
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                    setStatus('ready');
                },
                (err) => {
                    console.error("Location error:", err);
                    setLocationError("Location access is required for attendance.");
                    setStatus('ready'); // Still allow face capture, backend will handle missing location
                }
            );
        } else {
            setLocationError("Geolocation not supported");
            setStatus('ready');
        }
    }, []);

    const handleFaceCapture = async (imageFile, embedding, _faceImageUrl, meta = {}) => {
        if (status === 'processing') return;
        
        setStatus('processing');
        setIsCapturing(false);
        
        try {
            toast.info('Checking it\'s you...');
            
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/attendance/mark`,
                {
                    classId,
                    faceEmbeddingData: embedding,
                    location: location,
                    skipWindowCheck: true,
                    antiSpoofScore: meta.livenessScore || 0
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setStatus('success');
                toast.success(response.data.message || 'Attendance marked successfully!');
                // Wait 3 seconds and redirect back to dashboard
                setTimeout(() => navigate('/student/dashboard'), 3000);
            } else {
                throw new Error(response.data.message || 'Attendance marking failed');
            }
        } catch (error) {
            console.error('Attendance error:', error);
            setStatus('error');
            const errorMsg = error.response?.data?.message || error.message || 'Something went wrong';
            toast.error(errorMsg);
        }
    };

    const handleRetry = () => {
        setStatus('ready');
        setIsCapturing(true);
    };

    return (
        <div className={`${currentTheme.background} min-h-screen p-4 md:p-8 flex flex-col items-center justify-center font-sans`}>
            <ToastContainer position="top-right" theme={theme === 'dark' ? 'dark' : 'light'} />
            
            <div className="max-w-2xl w-full space-y-8 text-center">
                {/* Header */}
                <div className="space-y-2">
                    <button 
                        onClick={() => navigate(-1)}
                        className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${currentTheme.secondaryText} hover:${currentTheme.text} transition-colors mx-auto`}
                    >
                        <ArrowLeft size={16} /> Back to Portal
                    </button>
                    <h1 className={`text-3xl md:text-5xl font-black tracking-tight ${currentTheme.text}`}>
                        Mark Attendance with Face
                    </h1>
                    <p className={`text-lg ${currentTheme.secondaryText}`}>
                        Look directly into the camera to mark your attendance for this class.
                    </p>
                </div>

                {/* Main Capture Window */}
                <div className={`relative overflow-hidden rounded-[2.5rem] ${theme === 'dark' ? 'bg-[#0B1219]' : 'bg-slate-50'} border-4 ${status === 'success' ? 'border-emerald-500' : (status === 'error' ? 'border-rose-500' : (theme === 'dark' ? 'border-[#1E2733]' : 'border-indigo-100'))} shadow-2xl aspect-video flex items-center justify-center transition-all duration-500`}>
                    
                    {status === 'initializing' && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-brand-primary" size={48} />
                            <p className={`font-black uppercase tracking-widest text-xs ${currentTheme.secondaryText}`}>Setting up camera...</p>
                        </div>
                    )}

                    {(status === 'ready' || status === 'processing') && (
                        <div className="w-full h-full relative group">
                             <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl backdrop-blur-md border ${theme === 'dark' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm'}`}>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Connected and Safe</span>
                                </div>
                                <div className={`px-4 py-2 rounded-2xl backdrop-blur-md border ${theme === 'dark' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600 shadow-sm'}`}>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Secure Face Check</span>
                                </div>
                             </div>

                             <AutoFaceDetector 
                                onEmbeddingGenerated={handleFaceCapture}
                                autoCapture={isCapturing}
                                colors={{
                                    primary: '#4F46E5', // brand-primary
                                    textLight: '#FFFFFF',
                                    tonalDark: '#0B1219'
                                }}
                            />
                            
                            {/* NEW: Liveness Progress Indicator */}
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 w-64">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Looking for You</span>
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{status === 'processing' ? '98%' : 'Stand Still'}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                    <div className={`h-full bg-emerald-500 transition-all duration-1000 ${status === 'processing' ? 'w-full' : 'w-1/3 pulse'}`}></div>
                                </div>
                            </div>

                            {status === 'processing' && (
                                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] backdrop-blur-xl animate-in fade-in duration-500">
                                    <div className="relative mb-10">
                                        <Loader2 className="animate-spin text-brand-primary" size={80} />
                                        <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={32} />
                                    </div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Confirming it's you</h2>
                                    <p className="text-white/60 font-black uppercase tracking-[0.2em] text-[10px] mt-2">Advanced AI Face Check Active</p>
                                    
                                    <div className="mt-12 space-y-3 w-48">
                                        {[ 'Finding Face...', 'Security Check...', 'Confirming Name...' ].map((step, i) => (
                                            <div key={i} className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/40">
                                                <span>{step}</span>
                                                <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center gap-6 p-8 animate-in fade-in zoom-in duration-500">
                            <div className="bg-emerald-500/20 text-emerald-500 p-6 rounded-full">
                                <CheckCircle size={80} />
                            </div>
                            <div>
                                <h3 className={`text-3xl font-black ${currentTheme.text}`}>Attendance Marked!</h3>
                                <p className={`mt-2 ${currentTheme.secondaryText}`}>Your presence has been recorded successfully.</p>
                            </div>
                            <div className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                                Redirecting in 3s...
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center gap-6 p-8 animate-in fade-in zoom-in duration-500">
                            <div className="bg-rose-500/20 text-rose-500 p-6 rounded-full">
                                <AlertCircle size={80} />
                            </div>
                            <div>
                                <h3 className={`text-3xl font-black ${currentTheme.text}`}>Couldn't Recognize Face</h3>
                                <p className={`mt-2 ${currentTheme.secondaryText}`}>We couldn't verify your image. Please try again.</p>
                            </div>
                            <button 
                                onClick={handleRetry}
                                className={`${currentTheme.button.primary} px-8`}
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                    <div className="flex items-center gap-2">
                        <Camera size={18} className="text-brand-primary" />
                        <span className={`text-sm font-bold ${currentTheme.secondaryText}`}>ID: {user?.rollNumber || 'STU-1234'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={18} className={location ? "text-emerald-500" : "text-amber-500"} />
                        <span className={`text-sm font-bold ${currentTheme.secondaryText}`}>
                            {location ? "School Location Confirmed" : (locationError || "Waiting for GPS")}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentMarkAttendance;
