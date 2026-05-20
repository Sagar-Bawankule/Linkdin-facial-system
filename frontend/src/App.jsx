import { Routes, Route, Navigate } from "react-router-dom";
import './App.css';

// Auth Components
import Signup from './pages/auth/Signup';
import Login from './pages/auth/Login';
import ProtectedRoute from './ProtectedRoute';
import Sidebar from "./components/sidebar";

// Student Components
import StudentDashboard from './pages/student/StudentDashboard';
import StudentDashboardOverview from './pages/student/StudentDashboardOverview';
import StudentMaterialsPage from './pages/student/StudentMaterialsPage';
import StudentAssessmentsPage from './pages/student/StudentAssessmentsPage';
import StudentGroupPage from './pages/student/StudentGroupPage';
import StudentQuizAttemptPage from './pages/student/StudentQuizAttemptPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentSettingsPage from './pages/student/StudentSettingsPage';

import ClassMaterials from "./pages/student/ClassMaterials";
import StudentClassroomPortal from "./pages/student/StudentClassroomPortal";
import StudentMarkAttendance from "./pages/student/StudentMarkAttendance";

// Teacher Components
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherAttendanceDashboard from "./pages/teacher/TeacherAttendanceDashboard";
import TeacherResultsPage from './pages/teacher/TeacherResultsPage';
import TeacherMaterialsPage from './pages/teacher/TeacherMaterialsPage';
import TeacherQuizzesPage from './pages/teacher/TeacherQuizzesPage';
import TeacherProfilePage from './pages/teacher/TeacherProfilePage';
import TeacherSettingsPage from './pages/teacher/TeacherSettingsPage';

// Admin Components
import DashboardOverview from './components/admin/DashboardOverview';
import EnrolledUsersPage from './pages/admin/EnrolledUsersPage';
import CourseManagement from "./pages/admin/CourseManagement";
import AdminLayout from "./pages/admin/AdminLayout";
import AttendanceDashboard from "./pages/admin/AttendanceDashboard";
import AdminSettings from "./pages/admin/AdminSettings";
import GroupsManagementPage from "./pages/admin/GroupsManagementPage";
import ApprovalsPage from "./pages/admin/ApprovalsPage";

// Other Components
import CaptureImage from './pages/CaptureImage';
import DepartmentManagementPage from "./pages/admin/DepartmentManagementPage";
import AdminLogsPage from "./pages/admin/AdminLogsPage";
import AdminResultsPage from "./pages/admin/AdminResultsPage";

import TeacherLayout from './pages/teacher/TeacherLayout'
import ClassroomsPage from "./pages/teacher/ClassroomsPage";
import StudentCoursesPage from "./pages/student/StudentCourses";
import StudentResultsPage from './pages/student/StudentResultsPage';
import SmartAttendLanding from "./pages/SmartAttendLanding";
import ParentLayout from "./pages/parent/ParentLayout";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentResults from "./pages/parent/ParentResults";
import ParentCourses from "./pages/parent/ParentCourses";
// import ClassroomSystem from "./pages/student/StudentClassroomPortal";



function App() {
  return (
    <Routes>
      {/* Public routes */}
      {/* <Route path="/" element={<Navigate to="/" replace />} /> */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/capture-image" element={
        <ProtectedRoute>
          <CaptureImage />
        </ProtectedRoute>
      } />
      
      <Route path="/student/" element={
        <ProtectedRoute allowedRoles={['student', 'admin']}>
          <StudentDashboard />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboardOverview />} />
        <Route path="classrooms" element={<StudentClassroomPortal />} />
        <Route path="materials" element={<StudentMaterialsPage />} />
        <Route path="assessments" element={<StudentAssessmentsPage />} />
        <Route path="attendance" element={<StudentCoursesPage />} />
        <Route path="results" element={<StudentResultsPage />} />
        <Route path="group" element={<StudentGroupPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="settings" element={<StudentSettingsPage />} />
        <Route path="attendance/mark/:classId" element={<StudentMarkAttendance />} />
        <Route path="quiz/:classroomId/:assessmentId" element={<StudentQuizAttemptPage />} />
        
        {/* Class-specific routes for student */}
        <Route path="courses/:courseId/classes/:classId/materials" element={<ClassMaterials />} />
      </Route>
      
      {/* Teacher routes - SIMPLIFIED */}
      <Route path="/teacher" element={
        
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
          <TeacherLayout/>
        </ProtectedRoute>
      }>
        
        <Route index element={<TeacherDashboard />} />
        <Route path="dashboard" element={<TeacherDashboard />} />

        {/* <Route path="courses" element={<CourseComponents />} /> */}
        <Route path="groups" element={<TeacherAttendanceDashboard />} />
        <Route path="manageGroups" element={<GroupsManagementPage />} />
        <Route path="classroom" element={<ClassroomsPage/>} />
        <Route path="courses" element={<CourseManagement/>} />
        <Route path="materials" element={<TeacherMaterialsPage />} />
        <Route path="quizzes" element={<TeacherQuizzesPage />} />
        <Route path="results" element={<TeacherResultsPage />} />
        <Route path="profile" element={<TeacherProfilePage />} />
        <Route path="settings" element={<TeacherSettingsPage />} />
        <Route path="students" element={<EnrolledUsersPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
      </Route>
        {/* <Route path="attendance" element={<AttendanceManagement />} />
        <Route path="classroom" element={<VirtualClassroomDashboard/>}></Route>  */}
        {/* <Route path="classes/:classId/control" element={<AttendanceControl />} />
        <Route path="classes/:classId/materials" element={<MaterialsSharing />} />
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardOverview />} />
        <Route path="dashboard" element={<DashboardOverview />} />
        <Route path="enrolledUsers" element={<EnrolledUsersPage />} />
        <Route path="manageCourses" element={<CourseManagement />} />
        <Route path="manageGroups" element={<GroupsManagementPage/>} />
        <Route path="manageAttendance" element={<AttendanceDashboard/>}></Route>

        <Route path="logs" element={<AdminLogsPage />}></Route>
        <Route path="results" element={<AdminResultsPage />}></Route>
        <Route path="adminSettings" element={<AdminSettings/>}></Route>
        <Route  path="manageDepartments" element={<DepartmentManagementPage/>}></Route>
        <Route path="approvals" element={<ApprovalsPage />} />
      </Route>
      <Route path="/" element={<SmartAttendLanding/>}></Route>

      {/* Parent routes */}
      <Route path="/parent" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <ParentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/parent/dashboard" replace />} />
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="attendance" element={<ParentAttendance />} />
        <Route path="results" element={<ParentResults />} />
        <Route path="courses" element={<ParentCourses />} />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
