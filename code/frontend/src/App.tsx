import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppContent from "./pages/AppContent";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Protected from "./auth/Protected";
import Dashboard from "./pages/Dashboard";
import MyClassroomsPage from "./pages/MyClassroomsPage";
import ActivityLibrary from "./pages/ActivityLibrary";
import ClassroomPage from "./pages/ClassroomPage";
import ActivityDetailPage from "./pages/ActivityDetailPage";
import TeacherGroupPage from "./pages/TeacherGroupPage";
import Assessment1 from "./pages/Assessment1";
import { Toaster } from "./components/ui/sonner";

import StudentClassesPage from "./pages/StudentClassesPage";
import DashboardIndex from "./pages/DashboardIndex";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Landing + Role Select */}
                <Route path="/" element={<AppContent />} />

                {/* Register and Login */}
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />

                {/* Protected pages */}
                <Route element={<Protected />}>
                    <Route path="/dashboard" element={<Dashboard />}>
                        <Route index element={<DashboardIndex />} />
                        <Route path="classrooms" element={<MyClassroomsPage />} />
                        <Route path="classes" element={<StudentClassesPage />} />
                        <Route path="activity-library" element={<ActivityLibrary />} />
                        <Route path="classroom/:id" element={<ClassroomPage />} />
                        <Route path="activities" element={<ActivityDetailPage />} />
                        <Route path="groups" element={<TeacherGroupPage />} />
                        <Route path="ai-assistant" element={<div className="p-8">AI Assistant coming soon...</div>} />
                        <Route path="ai-insights" element={<div className="p-8">AI Insights coming soon...</div>} />
                        <Route path="students" element={<div className="p-8">Student Management coming soon...</div>} />
                    </Route>
                    <Route path="/assessment/:classroom_id/:activity_id" element={<Assessment1 />} />
                </Route>
            </Routes>

            <Toaster richColors position="bottom-right" />
        </BrowserRouter>
    );
}
