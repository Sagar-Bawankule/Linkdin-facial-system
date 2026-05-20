import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, Clock, FileText, BookOpen, CheckCircle, AlertCircle, CheckCheck, MapPin, Award, TrendingUp, Trophy } from 'lucide-react';
import { useTheme } from '../../context/ThemeProvider';
import ClassesSection from './ClassesSection';
import { getClassesByClassroom } from '../../app/features/class/classThunks';
import { reset } from '../../app/features/classroom/classroomSlice';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  verifyFaceEmbedding,
  checkLocationValidityAndMarkPresent,
} from '../../app/features/attendance/attendanceThunks';
import { fetchMyResults } from '../../app/features/results/resultsThunks';
import { useSocket } from '../../context/SocketContext';
import { LoaderCircle } from 'lucide-react';

// Main ClassroomView Component
const ClassroomView = ({ 
  selectedClassroom, 
  onBack, 
  attendanceWindow, 
  currentAttendanceStatus, 
  studentAttendance, 
  onMarkAttendance 
}) => {
  const { isDark, theme, themeConfig } = useTheme(); 
  const currentTheme = themeConfig[theme];
  const [activeTab, setActiveTab] = useState('schedule');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const classroomId = selectedClassroom?._id;

  // Redux state
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { classes, isLoading, isError, message } = useSelector((state) => state.classes);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { sharedMaterials, currentClassroom } = useSelector((state) => state.classrooms);
  const { studentResults = [], isLoading: isResultsLoading } = useSelector((state) => state.results);
  const socket = useSocket();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Local state for live window updates (overrides initial props/Redux)
  const [liveWindow, setLiveWindow] = useState(attendanceWindow);

  useEffect(() => {
    setLiveWindow(attendanceWindow);
  }, [attendanceWindow]);

  // Keep a local clock ticking to update 'Ongoing' statuses live
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  // Fetch classes when component mounts or classroomId changes.
  // NOTE: getClassroomById is already dispatched by StudentClassroomPortal,
  // so we only fetch classes here to avoid causing a re-render cycle.
  useEffect(() => {
    if (classroomId) {
      dispatch(getClassesByClassroom(classroomId));
      dispatch(fetchMyResults());

      // Socket Room Joining
      if (socket) {
        socket.emit('join-classroom', classroomId);

        socket.on('window-status', (data) => {
          if (data.classroomId === classroomId || data.classId) {
             setLiveWindow(prev => ({
               ...prev,
               isOpen: data.isOpen,
               closesAt: data.closesAt
             }));
             // Optionally refetch classes to update the list
             dispatch(getClassesByClassroom(classroomId));
          }
        });

        socket.on('attendance-update', (data) => {
           // If it's about this classroom, refetch to show 'Checked In' or updated stats
           dispatch(getClassesByClassroom(classroomId));
        });

        socket.on('new-result', (data) => {
           if (data.classroomId === classroomId) {
             dispatch(fetchMyResults());
             toast.info(`New result out: ${data.assessmentName}`);
           }
        });
      }
    }

    return () => {
      dispatch(reset());
      if (socket) {
        socket.off('window-status');
        socket.off('attendance-update');
        socket.off('new-result');
      }
    };
  }, [dispatch, classroomId, socket]);

  // Helper function to format time string from HH:MM format
  const formatTimeString = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${hour12}:${minutes} ${period}`;
  };

  // Transform Cloudinary URL to force file download with correct headers
  const getDownloadUrl = (url) => {
    if (!url) return '#';
    
    // Handle Cloudinary
    if (url.includes('cloudinary.com')) {
      return url.replace('/upload/', '/upload/fl_attachment/');
    }
    
    // Handle absolute URLs
    if (url.startsWith('http')) {
      return url;
    }
    
    let relativePath = url;
    // Handle physical paths from legacy data (e.g., C:\...\uploads\file.pdf)
    if (url.includes('uploads\\')) {
      relativePath = '/uploads/' + url.split('uploads\\').pop().replace(/\\/g, '/');
    } else if (url.includes('uploads/')) {
      relativePath = '/uploads/' + url.split('uploads/').pop();
    }
    
    // Handle local paths by prepending backend URL
    const baseUrl = import.meta.env.VITE_SOCKET_URL || '';
    const finalPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${baseUrl}${finalPath}`;
  };

  // Helper function to check if a specific day of week is included in daysOfWeek array
  const isDayInSchedule = (daysOfWeek, dayToCheck) => {
    return daysOfWeek && daysOfWeek.includes(dayToCheck);
  };

  // Update the isScheduledForToday function to handle extra classes
  const isScheduledForToday = (classItem) => {
    const today = new Date();
    
    // First check if it's an extra class with a specific date
    if (classItem.isExtraClass && classItem.extraClassDate) {
      const extraDate = new Date(classItem.extraClassDate);
      return today.toDateString() === extraDate.toDateString();
    }
    
    // Regular class with schedule
    const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
    return isDayInSchedule(classItem.schedule?.daysOfWeek, dayOfWeek);
  };

  // Helper function to determine if a class is scheduled for tomorrow
  const isScheduledForTomorrow = (classItem) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayOfWeek = tomorrow.getDay();
    
    return isDayInSchedule(classItem.schedule?.daysOfWeek, tomorrowDayOfWeek);
  };

  // Helper function to check if a date falls within a date range
  const isDateInRange = (date, startDate, endDate) => {
    const checkDate = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return checkDate >= start && checkDate <= end;
  };

  // Helper function to determine class status based on current date and time
  const getClassStatus = (classItem) => {
    if (!classItem.schedule && !classItem.extraClassDate) return 'unknown';
    
    const now = new Date();
    const today = new Date();
    
    // Handle extra class with specific date
    if (classItem.isExtraClass && classItem.extraClassDate) {
      const extraDate = new Date(classItem.extraClassDate);
      
      // If dates don't match, it's either upcoming or past
      if (today.toDateString() !== extraDate.toDateString()) {
        return today < extraDate ? 'upcoming' : 'past';
      }
      
      // Extra class is today, compare with time
      const startTimeStr = classItem.schedule?.startTime || "00:00";
      const endTimeStr = classItem.schedule?.endTime || "00:00";
      
      const [startHour, startMinute] = startTimeStr.split(':').map(Number);
      const [endHour, endMinute] = endTimeStr.split(':').map(Number);
      
      const todayWithStartTime = new Date(today);
      todayWithStartTime.setHours(startHour, startMinute, 0);
      
      const todayWithEndTime = new Date(today);
      todayWithEndTime.setHours(endHour, endMinute, 0);
      
      // Determine status based on current time
      if (currentTime >= todayWithStartTime && currentTime <= todayWithEndTime) {
        return 'ongoing';
      } else if (currentTime < todayWithStartTime) {
        return 'upcoming-today';
      } else {
        return 'past';
      }
    }
    
    // Regular class handling (existing code)
    const startDate = new Date(classItem.schedule?.startDate);
    const endDate = new Date(classItem.schedule?.endDate);
    
    // Check if today is within the overall date range of the class
    if (!isDateInRange(today, startDate, endDate)) {
      // If today is before start date, class is upcoming
      if (today < startDate) return 'upcoming';
      // If today is after end date, class is past
      if (today > endDate) return 'past';
    }
    
    // Check if class is scheduled for today based on daysOfWeek
    if (!isScheduledForToday(classItem)) {
      // If not scheduled for today, it's either upcoming or we'll handle it separately
      return 'not-today';
    }
    
    // Parse start and end times for today
    const startTimeStr = classItem.schedule?.startTime || "00:00";
    const endTimeStr = classItem.schedule?.endTime || "00:00";
    
    const [startHour, startMinute] = startTimeStr.split(':').map(Number);
    const [endHour, endMinute] = endTimeStr.split(':').map(Number);
    
    const todayWithStartTime = new Date(today);
    todayWithStartTime.setHours(startHour, startMinute, 0);
    
    const todayWithEndTime = new Date(today);
    todayWithEndTime.setHours(endHour, endMinute, 0);
    
    // Determine the status based on current time
    if (currentTime >= todayWithStartTime && currentTime <= todayWithEndTime) {
      return 'ongoing';
    } else if (currentTime < todayWithStartTime) {
      return 'upcoming-today';
    } else {
      return 'past';
    }
  };
  
  // Update the processClasses function to handle extra classes
  const processClasses = (classItems) => {
    if (!classItems || !Array.isArray(classItems) || classItems.length === 0) {
      return [];
    }
    
    return classItems.flatMap(classItem => {
      const results = [];
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Handle extra classes specially
      if (classItem.isExtraClass && classItem.extraClassDate) {
        const extraDate = new Date(classItem.extraClassDate);
        
        // Get the status based on date and time
        let status;
        if (today.toDateString() === extraDate.toDateString()) {
          // Extra class is today, determine status by time
          const startTimeStr = classItem.schedule?.startTime || "00:00";
          const endTimeStr = classItem.schedule?.endTime || "00:00";
          const [startHour, startMinute] = startTimeStr.split(':').map(Number);
          const [endHour, endMinute] = endTimeStr.split(':').map(Number);
          
          const todayWithStartTime = new Date(today);
          todayWithStartTime.setHours(startHour, startMinute, 0);
          
          const todayWithEndTime = new Date(today);
          todayWithEndTime.setHours(endHour, endMinute, 0);
          
          const now = new Date();
          
          if (now >= todayWithStartTime && now <= todayWithEndTime) {
            status = 'ongoing';
          } else if (now < todayWithStartTime) {
            status = 'upcoming';
          } else {
            status = 'past';
          }
        } else {
          // Extra class is on a different date
          status = today < extraDate ? 'upcoming' : 'past';
        }
        
        results.push(createClassObject(classItem, extraDate, status));
        return results;
      }
      
      // Original logic for regular classes
      const startDate = new Date(classItem.schedule?.startDate);
      const endDate = new Date(classItem.schedule?.endDate);
      
      // Basic class status
      const basicStatus = getClassStatus(classItem);
      
      // If class is scheduled for today
      if (isScheduledForToday(classItem) && isDateInRange(today, startDate, endDate)) {
        const startTimeStr = classItem.schedule?.startTime || "00:00";
        const endTimeStr = classItem.schedule?.endTime || "00:00";
        const [startHour, startMinute] = startTimeStr.split(':').map(Number);
        const [endHour, endMinute] = endTimeStr.split(':').map(Number);
        
        const todayWithStartTime = new Date(today);
        todayWithStartTime.setHours(startHour, startMinute, 0);
        
        const todayWithEndTime = new Date(today);
        todayWithEndTime.setHours(endHour, endMinute, 0);
        
        const now = new Date();
        let status;
        
        if (now >= todayWithStartTime && now <= todayWithEndTime) {
          status = 'ongoing';
        } else if (now < todayWithStartTime) {
          status = 'upcoming';
        } else {
          status = 'past';
        }
        
        results.push(createClassObject(classItem, today, status));
      }
  
      
      // If class is scheduled for tomorrow
      if (isScheduledForTomorrow(classItem) && isDateInRange(tomorrow, startDate, endDate)) {
        results.push(createClassObject(classItem, tomorrow, 'upcoming'));
      }
      
      // For other future days
      const daysToCheck = 7; // Check up to a week ahead
      for (let i = 2; i < daysToCheck; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + i);
        
        if (isDateInRange(futureDate, startDate, endDate) && 
            isDayInSchedule(classItem.schedule?.daysOfWeek, futureDate.getDay())) {
          results.push(createClassObject(classItem, futureDate, 'upcoming'));
          break; // Just include the next occurrence after tomorrow
        }
      }
      
      // If no results were added (no upcoming occurrences), add a placeholder entry with basic status
      if (results.length === 0) {
        let defaultDate;
        if (basicStatus === 'past') {
          defaultDate = endDate;
        } else {
          defaultDate = startDate;
        }
        results.push(createClassObject(classItem, defaultDate, basicStatus));
      }
      
      return results;
    });
  };

  // Helper function to create a class object
  const createClassObject = (classItem, date, status) => {
    const startTimeStr = classItem.schedule?.startTime || "00:00";
    const endTimeStr = classItem.schedule?.endTime || "00:00";
    const timeStr = `${formatTimeString(startTimeStr)} - ${formatTimeString(endTimeStr)}`;
    
    // Format date string
    const today = new Date();
    let dateStr;
    
    if (date.toDateString() === today.toDateString()) {
      dateStr = 'Today';
    } else if (new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString() === date.toDateString()) {
      dateStr = 'Tomorrow';
    } else if (new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString()) {
      dateStr = 'Yesterday';
    } else {
      dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    // Get location details - handle both nested and flat structure
    const room = classItem.location?.room || 
                (classItem.originalData && classItem.originalData.location?.room) || 
                "Room not specified";
    
    // Check if user has attended
    const hasAttended = classItem.attendanceRecords?.some(record => 
      record.studentId === currentUserId
    ) || false;
    
    // Create a consistent ID
    const itemId = classItem._id || 
                  (classItem.originalData && classItem.originalData._id) || 
                  classItem.id ||
                  `generated-${Date.now()}`;
    
    return {
      _id: itemId,
      id: `${itemId}-${date.toISOString()}`,
      title: classItem.title || 
            (classItem.course?.courseName) || 
            (classItem.originalData && classItem.originalData.title) ||
            selectedClassroom?.course?.name || 
            "Untitled Class",
      date: dateStr,
      time: timeStr,
      room: room,
      status: status,
      attended: hasAttended,
      originalData: classItem,
      isExtraClass: classItem.isExtraClass || 
                    (classItem.originalData && classItem.originalData.isExtraClass) || 
                    false,
      daysOfWeek: classItem.schedule?.daysOfWeek || [],
      extraClassDate: classItem.extraClassDate || 
                      (classItem.originalData && classItem.originalData.extraClassDate) || 
                      null
    };
  };
  
  // Mock current user ID (replace with actual user ID from auth context)
  const currentUserId = user._id;

  // Handle face verification with toast notifications
  const handleVerifyFace = async (embeddingData) => {
    try {
      // Show toast for face verification process
      const verifyingToastId = toast.info(
        <div className="flex flex-col items-center">
          <div className="mb-2 animate-pulse">
            <CheckCircle className="text-blue-500" size={28} />
          </div>
          <div className="font-medium">Checking Face...</div>
        </div>,
        {
          position: "top-right",
          autoClose: false,
          closeOnClick: false,
          closeButton: false,
          draggable: false,
          className: "attendance-verification-toast"
        }
      );

      // Call the actual verification
      const result = await dispatch(verifyFaceEmbedding(embeddingData)).unwrap();
      
      // Dismiss the verifying toast
      toast.dismiss(verifyingToastId);
      
      // Show success or error toast based on result
      if (result.success) {
        toast.success(
          <div className="flex flex-col items-center">
            <CheckCheck className="mb-2" size={28} />
            <div className="font-medium">Face Confirmed!</div>
            <div className="text-sm">Checking your location...</div>
          </div>,
          {
            position: "top-right",
            autoClose: 3000,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            className: "attendance-success-toast"
          }
        );
      } else {
        toast.error(
          <div className="flex flex-col items-center">
            <AlertCircle className="mb-2" size={28} />
            <div className="font-medium">Couldn't confirm face</div>
            <div className="text-sm">Please try again</div>
          </div>,
          {
            position: "top-right",
            autoClose: 5000,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            className: "attendance-error-toast"
          }
        );
      }
      
      return { success: result.success };
    } catch (error) {
      console.error("Face verification failed:", error);
      
      // Show error toast

      toast.error(
        <div className="flex flex-col items-center">
          <AlertCircle className="mb-2" size={28} />
          <div className="font-medium">Couldn't confirm face</div>
          <div className="text-sm">{error  || error?.message || "An unexpected error occurred"}</div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          className: "attendance-error-toast"
        }
      );
      
      return { success: false };
    }
  };
  
  // Function to check location and mark attendance with toast notifications
  const handleLocationAndAttendance = async ({ classId, location, antiSpoofScore }) => {
    try {
      // Show toast for location verification process
      const locationToastId = toast.info(
        <div className="flex flex-col items-center">
          <div className="mb-2 animate-pulse">
            <MapPin className="text-green-500" size={28} />
          </div>
          <div className="font-medium">Checking your location...</div>
        </div>,
        {
          position: "top-right",
          autoClose: false,
          closeOnClick: false,
          closeButton: false,
          draggable: false,
          className: "location-verification-toast"
        }
      );

      // Call the actual location verification & attendance marking
      const result = await dispatch(
        checkLocationValidityAndMarkPresent({ classId, location, antiSpoofScore, skipWindowCheck: true })
      ).unwrap();
      
      // Dismiss the location checking toast
      toast.dismiss(locationToastId);
      
      // Show success or error toast based on result
      if (result.success){
        handleAttendanceSuccess(selectedClass?.title || "Class");
      } else {
        toast.error(
          <div className="flex flex-col items-center">
            <AlertCircle className="mb-2" size={28} />
            <div className="font-medium">Location check failed</div>
            <div className="text-sm">You must be in the classroom to mark attendance</div>
          </div>,
          {
            position: "top-right",
            autoClose: 5000,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            className: "attendance-error-toast"
          }
        );
      }
      
      return { isValid: result.isValid };
    } catch (error) {
      console.error("Location verification failed:", error);
      
      // Show error toast
      toast.error(
        <div className="flex flex-col items-center">
          <AlertCircle className="mb-2" size={28} />
          <div className="font-medium">Location check failed</div>
          <div className="text-sm">{error || error?.message || "An unexpected error occurred"}</div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          className: "attendance-error-toast"
        }
      );
      
      return { isValid: false };
    }
  };
  

  // Handler for successful attendance marking
  const handleAttendanceSuccess = (classTitle) => {
    // Show toast notification to confirm attendance was marked
    toast.success(
      <div className="flex flex-col items-center">
        <CheckCircle className="mb-2" size={28} />
        <div className="font-medium">Attendance Success!</div>
        <div className="text-sm">{classTitle || 'Class'}</div>
      </div>,
      {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: "attendance-success-toast"
      }
    );
    
    // Close the attendance modal
    setShowAttendanceModal(false);
    
    // Refresh class data if needed
    if (classroomId) {
      dispatch(getClassesByClassroom(classroomId));
    }
  };

  // Open attendance page
  const openAttendanceModal = (classItem) => {
    const targetClassId = classItem._id || (classItem.originalData && classItem.originalData._id) || classItem.id;
    console.log("Navigating to attendance page for class:", targetClassId);
    navigate(`/student/attendance/mark/${targetClassId}`);
  };
  
  // Mock class data for demonstration - using your provided schedule format
  const mockClasses = [
    {
      _id: 'class1',
      title: 'Introduction to Programming',
      schedule: {
        startDate: '2025-05-07T00:00:00.000+00:00',
        endDate: '2025-05-30T00:00:00.000+00:00',
        daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
        startTime: '10:00',
        endTime: '11:30',
        isExtraClass: false
      },
      location: { room: 'Room 101' },
      attendanceRecords: []
    },
    {
      _id: 'class2',
      title: 'Web Development',
      schedule: {
        startDate: '2025-05-16T00:00:00.000+00:00',
        endDate: '2025-05-18T00:00:00.000+00:00',
        daysOfWeek: [6], // Saturday only
        startTime: '09:00',
        endTime: '10:30',
        isExtraClass: false
      },
      location: { room: 'Room 202' },
      attendanceRecords: []
    },
    {
      _id: 'class3',
      title: 'Database Systems',
      schedule: {
        startDate: '2025-05-16T00:00:00.000+00:00',
        endDate: '2025-05-30T00:00:00.000+00:00',
        daysOfWeek: [2, 4], // Tuesday, Thursday
        startTime: '14:00',
        endTime: '15:30',
        isExtraClass: false
      },
      location: { room: 'Room 303' },
      attendanceRecords: []
    },
    {
      _id: 'class4',
      title: 'Machine Learning',
      schedule: {
        startDate: '2025-05-17T00:00:00.000+00:00',
        endDate: '2025-05-17T00:00:00.000+00:00',
        daysOfWeek: [6], // Saturday
        startTime: '10:00',
        endTime: '12:00',
        isExtraClass: true
      },
      location: { room: 'Lab 404' },
      attendanceRecords: []
    }
  ];

  // Use real classes or mock classes with error handling
  const processedClasses = React.useMemo(() => {
    try {
      if (isLoading || isError) return [];
      if (classes.length > 0) {
        return processClasses(classes);
      } else {
        return processClasses(mockClasses);
      }
    } catch (error) {
      console.error('Error processing classes:', error);
      return []; // Return empty array on error to prevent crash
    }
  }, [classes, isLoading, isError]);

  // Debug log to help troubleshoot (removed processedClasses from deps to prevent infinite loop)
  React.useEffect(() => {
    console.log('ClassroomView Debug:', {
      selectedClassroomName: selectedClassroom?.name,
      classroomId,
      classesLength: classes?.length || 0,
      currentClassroomName: currentClassroom?.name,
      isLoading,
      isError,
      message
    });
  }, [selectedClassroom?.name, classroomId, classes?.length, currentClassroom?.name, isLoading, isError, message]);

  // Early return for critical errors
  if (!selectedClassroom) {
    return (
      <div className={`min-h-[60vh] ${currentTheme.card} flex items-center justify-center rounded-2xl border ${isDark ? 'border-[#1E2733]/50' : 'border-gray-100'} shadow-sm`}>
        <div className={`p-10 text-center ${currentTheme.card} rounded-xl`}>
          <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-full inline-flex mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className={`text-lg font-medium ${currentTheme.text}`}>No classroom selected</p>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Please go back and select a valid classroom.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full font-sans animate-in fade-in duration-500`}>
      {/* Toast Container - added with higher z-index */}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName={`${isDark ? 'bg-[#121A22] text-white border border-[#1E2733]' : 'bg-white text-gray-900 border border-gray-100'}`}
        style={{ zIndex: 9999 }} // High z-index to ensure visibility
      />

      {/* Header */}
      <div className={`relative overflow-hidden mb-8 rounded-2xl ${isDark ? 'bg-gradient-to-r from-[#121A22] to-[#0A0E13] border border-[#1E2733]' : 'bg-gradient-to-r from-indigo-50 to-white border border-indigo-100'} shadow-sm p-6 md:p-8`}>
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${isDark ? 'from-brand-primary/20 to-purple-500/10' : 'from-indigo-400/20 to-purple-400/10'} rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none`}></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-2xl md:text-3xl font-extrabold mb-1 ${currentTheme.text}`}>
              {selectedClassroom?.course?.name || "Programming Course"}
            </h1>
            <p className={`text-sm md:text-base font-medium ${isDark ? 'text-brand-light' : 'text-indigo-600'}`}>
              {selectedClassroom?.department?.name || "Computer Science"} <span className="text-gray-400 mx-2">•</span> Instructor: {selectedClassroom?.assignedTeacher?.firstName || "John"} {selectedClassroom?.assignedTeacher?.lastName || "Doe"}
            </p>
          </div>
        </div>

        {/* Floating Pill Tabs */}
        <div className={`flex mt-8 p-1.5 inline-flex rounded-xl ${isDark ? 'bg-[#0A0E13]/80 border border-[#1E2733]' : 'bg-gray-100/80 border border-gray-200/50'} backdrop-blur-md`}>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${activeTab === 'schedule' 
              ? (isDark ? 'bg-[#1E2733] text-white shadow-sm' : 'bg-white text-indigo-700 shadow-sm') 
              : (isDark ? 'text-gray-400 hover:text-white hover:bg-[#121A22]' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50')}`}
          >
            <Calendar className="w-4 h-4" />
            <span>Class timing</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${activeTab === 'notes' 
              ? (isDark ? 'bg-[#1E2733] text-white shadow-sm' : 'bg-white text-indigo-700 shadow-sm') 
              : (isDark ? 'text-gray-400 hover:text-white hover:bg-[#121A22]' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50')}`}
          >
            <FileText className="w-4 h-4" />
            <span>Materials</span>
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${activeTab === 'assignments' 
              ? (isDark ? 'bg-[#1E2733] text-white shadow-sm' : 'bg-white text-indigo-700 shadow-sm') 
              : (isDark ? 'text-gray-400 hover:text-white hover:bg-[#121A22]' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50')}`}
          >
            <BookOpen className="w-4 h-4" />
            <span>My Results</span>
            <span>Assignments</span>
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${activeTab === 'results' 
              ? (isDark ? 'bg-[#1E2733] text-white shadow-sm' : 'bg-white text-indigo-700 shadow-sm') 
              : (isDark ? 'text-gray-400 hover:text-white hover:bg-[#121A22]' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50')}`}
          >
            <Trophy className="w-4 h-4" />
            <span>Results</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="py-2">
        {isLoading ? (
          <div className={`${currentTheme.card} p-12 text-center rounded-2xl border ${isDark ? 'border-[#1E2733]/50' : 'border-gray-100'}`}>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading class schedule...</p>
          </div>
        ) : isError ? (
          <div className={`${currentTheme.card} p-12 text-center rounded-2xl border border-red-200 dark:border-red-900/30`}>
            <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-full inline-flex mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className={`font-semibold text-lg ${currentTheme.text}`}>Error loading classes</p>
            <p className={`text-sm mt-1 text-red-500`}>{message || "Something went wrong."}</p>
          </div>
        ) : activeTab === 'schedule' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Next 24 Hours Classes */}
            <div className={`p-6 md:p-8 rounded-2xl relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#121A22] to-[#0A0E13] border border-blue-900/40' : 'bg-gradient-to-br from-blue-50 to-indigo-50/30 border border-blue-100'} shadow-sm`}>
              <div className={`absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none`}></div>
              
              <h2 className={`text-lg font-bold tracking-tight mb-6 flex items-center ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                Classes in the Next 24 Hours
              </h2>
              
              <div className="space-y-4 relative z-10">
                {processedClasses.filter(c => 
                  (c.status === 'ongoing' || c.status === 'upcoming') && 
                  (c.date === 'Today' || c.date === 'Tomorrow')
                ).length > 0 ? (
                  processedClasses.filter(c => 
                    (c.status === 'ongoing' || c.status === 'upcoming') && 
                    (c.date === 'Today' || c.date === 'Tomorrow')
                  ).map(classItem => (
                    <div key={classItem.id} className={`p-5 rounded-xl transition-all hover:-translate-y-1 ${isDark ? 'bg-[#1A2520]/40 border border-[#2F955A]/30 shadow-lg shadow-black/20' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className={`font-bold text-lg mb-2 ${currentTheme.text}`}>{classItem.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className={`flex items-center px-2.5 py-1 rounded-md ${isDark ? 'bg-[#121A22] text-brand-light' : 'bg-indigo-50 text-indigo-700'}`}>
                              <Clock className="w-3.5 h-3.5 mr-1.5" />
                              <span className="font-medium">{classItem.time}</span>
                            </div>
                            <div className={`flex items-center px-2.5 py-1 rounded-md ${isDark ? 'bg-[#121A22] text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                              <Calendar className="w-3.5 h-3.5 mr-1.5" />
                              <span className="font-medium">{classItem.date}</span>
                            </div>
                            {classItem.originalData.schedule?.isExtraClass && (
                              <div className={`flex items-center px-2.5 py-1 rounded-md ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse"></span>
                                <span className="font-semibold text-xs uppercase tracking-wider">Extra Class</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          classItem.status === 'ongoing' 
                            ? (liveWindow?.isOpen 
                                ? (isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse' : 'bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm')
                                : (isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-700 border border-amber-200'))
                            : (isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200')
                        }`}>
                          {classItem.status === 'ongoing' ? (
                            liveWindow?.isOpen ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                Attendance Open
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[10px]">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                Ongoing
                              </span>
                            )
                          ) : 'Upcoming'}
                        </div>
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-[#1E2733]/50 flex justify-between items-center">
                        <div className={`flex items-center text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        </div>
                        {classItem.status === 'ongoing' && (
                          <button 
                            onClick={() => openAttendanceModal(classItem)}
                            disabled={currentAttendanceStatus?.status}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                              currentAttendanceStatus?.status 
                                ? 'bg-emerald-500/20 text-emerald-500 cursor-default border border-emerald-500/30'
                                : isDark 
                                  ? 'bg-brand-primary text-white hover:bg-brand-light hover:shadow-[0_0_15px_rgba(80,110,229,0.4)]' 
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
                            }`}
                          >
                            {currentAttendanceStatus?.status ? 'Attendance Marked' : 'Mark Attendance'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`p-10 text-center ${isDark ? 'bg-[#0A0E13]/50 border border-[#1E2733]/50' : 'bg-white/50 border border-white'} rounded-xl backdrop-blur-sm`}>
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-[#121A22]' : 'bg-blue-100/50'}`}>
                      <Clock className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-blue-400'}`} />
                    </div>
                    <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No imminent classes</p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>You have a clear schedule for the next 24 hours.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ongoing Classes */}
            <ClassesSection 
              title="Ongoing Classes"
              classes={processedClasses.filter(c => c.status === 'ongoing')}
              emptyMessage="No ongoing classes at the moment."
              icon={<Clock className="w-6 h-6" />}
              type="ongoing"
              openAttendanceModal={openAttendanceModal}
              isDark={isDark}
            />
            
            {/* Past Classes */}
            <ClassesSection 
              title="Past Classes"
              classes={processedClasses.filter(c => c.status === 'past')}
              emptyMessage="No past classes."
              icon={<CheckCircle className="w-6 h-6" />}
              type="past"
              isDark={isDark}
            />
          </div>
        ) : activeTab === 'notes' ? (
          <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <h2 className="text-lg font-semibold mb-4">Course Notes & Materials</h2>

            {/* Get materials from current classroom */}
            {currentClassroom?.sharedResources && currentClassroom.sharedResources.length > 0 ? (
              <div className="space-y-4">
                {currentClassroom.sharedResources.map((material) => (
                    <div key={material._id} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {material.title || material.files?.[0]?.filename || 'Class Material'}
                          </h3>
                          {material.description && (
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {material.description}
                            </p>
                          )}
                          <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Added {material.createdAt ? new Date(material.createdAt).toLocaleDateString() : 'recently'}
                          </p>
                        </div>
                        <div className="ml-4">
                          {material.files && material.files.length > 0 ? (
                            <div className="space-y-2">
                              {material.files.map((file, idx) => (
                                <a
                                  key={idx}
                                  href={getDownloadUrl(file.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-block px-3 py-1 rounded text-sm ${
                                    isDark
                                      ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }`}
                                >
                                  Download
                                </a>
                              ))}
                            </div>
                          ) : material.link ? (
                            <a
                              href={material.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-block px-3 py-1 rounded text-sm ${
                                isDark
                                  ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              Open Link
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className={`p-8 text-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
                <FileText className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <p className="font-medium">No notes or materials available yet</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Teacher will share materials here when available
                </p>
              </div>
            )}
          </div>
        ) : activeTab === 'assignments' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <h2 className="text-lg font-semibold mb-4">Assignments</h2>
              <div className={`p-8 text-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
                <BookOpen className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <p className="font-medium">No assignments available for this course yet</p>
              </div>
            </div>
          </div>
        ) : activeTab === 'results' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Results Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#121A22] border-[#1E2733]' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <Trophy size={20} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Overall Performance</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {studentResults.filter(r => r.classroom?._id === classroomId || r.classroom === classroomId).length > 0
                      ? (studentResults.filter(r => r.classroom?._id === classroomId || r.classroom === classroomId).reduce((acc, curr) => acc + (curr.obtainedMarks / curr.totalMarks), 0) / studentResults.filter(r => r.classroom?._id === classroomId || r.classroom === classroomId).length * 100).toFixed(1)
                      : '0.0'}%
                  </h3>
                  <span className="text-xs font-bold text-gray-500">Subject GPA</span>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#121A22] border-[#1E2733]' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                    <CheckCheck size={20} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Assessments Passed</span>
                </div>
                <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {studentResults.filter(r => (r.classroom?._id === classroomId || r.classroom === classroomId) && (r.obtainedMarks/r.totalMarks >= 0.4)).length}
                </h3>
              </div>

              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#121A22] border-[#1E2733]' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                    <TrendingUp size={20} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total Evaluations</span>
                </div>
                <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {studentResults.filter(r => r.classroom?._id === classroomId || r.classroom === classroomId).length}
                </h3>
              </div>
            </div>

            {/* Results List */}
            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#121A22] border-[#1E2733]' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="px-6 py-4 border-b border-inherit">
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Detailed Scores</h3>
              </div>
              <div className="divide-y divide-inherit">
                {studentResults.filter(r => r.classroom?._id === classroomId || r.classroom === classroomId).length > 0 ? (
                  studentResults.filter(r => r.classroom?._id === classroomId || r.classroom === classroomId).map((result) => {
                    const isPending = result.remarks === 'Awaiting Grading - Student Work Submitted' || (result.obtainedMarks === 0 && result.remarks?.includes('Awaiting'));
                    return (
                      <div key={result._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className={`font-black text-sm uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{result.assessmentName}</p>
                          <div className="flex items-center gap-3 mt-1">
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                               {result.examType}
                             </span>
                             <span className="text-[10px] text-gray-500">{new Date(result.publishedAt || result.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                              {isPending ? (
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                                   Awaiting Grading
                                </span>
                              ) : (
                                <>
                                  <div className="flex items-baseline gap-1 justify-end">
                                    <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{result.obtainedMarks}</span>
                                    <span className="text-xs font-bold text-gray-500">/ {result.totalMarks}</span>
                                  </div>
                                  <p className={`text-[10px] font-black uppercase tracking-widest ${result.obtainedMarks/result.totalMarks >= 0.4 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {((result.obtainedMarks / result.totalMarks) * 100).toFixed(1)}% — {result.obtainedMarks/result.totalMarks >= 0.4 ? 'PASSED' : 'FAILED'}
                                  </p>
                                </>
                              )}
                           </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center">
                    <Trophy size={48} className="mx-auto mb-4 text-gray-300 opacity-20" />
                    <p className={`text-sm font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No evaluation records found yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <h2 className="text-lg font-semibold mb-4">Assignments</h2>
            <div className={`p-8 text-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <BookOpen className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className="font-medium">No assignments available for this course yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomView;
