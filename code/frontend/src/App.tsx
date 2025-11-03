import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppContent from "./pages/AppContent";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Protected from "./auth/Protected";
import Dashboard from "./pages/Dashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ActivityLibrary from "./pages/ActivityLibrary";
import { Toaster } from "./components/ui/sonner";
import Assessment1 from "./pages/Assessment1";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Landing + Role Select */}
                <Route path="/" element={<AppContent />} />

                {/* Register and Login */}
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Dashboard */}
                <Route element={<Protected />}>
                    <Route path="/dashboard" element={<Dashboard />}>
                        <Route index element={<TeacherDashboard />} />
                        <Route path="activity-library" element={<ActivityLibrary />} />
                        {/* later */}
                        {/* <Route path="classrooms" element={<ClassroomsPage />} /> */}
                        {/* <Route path="students" element={<StudentsPage />} /> */}
                        {/* <Route path="ai-insights" element={<AIInsightsPage />} /> */}
                    </Route>
                    <Route path="/assessment/:activity_id" element={<Assessment1 />} />
                </Route>
            </Routes>

            <Toaster richColors position="bottom-right" />
        </BrowserRouter>
    );
}
