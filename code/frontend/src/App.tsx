import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppContent from "./pages/AppContent";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Protected from "./auth/Protected";
import Dashboard from "./pages/Dashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import MyClassroomsPage from "./pages/MyClassroomsPage";
import ActivityLibrary from "./pages/ActivityLibrary";
import ClassroomPage from "./pages/ClassroomPage";
import ActivityDetailPage from "./pages/ActivityDetailPage";
import TeacherGroupPage from "./pages/TeacherGroupPage";
import { Toaster } from "./components/ui/sonner";

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
                        <Route path="classrooms" element={<MyClassroomsPage />} />
                        <Route path="activity-library" element={<ActivityLibrary />} />
                        <Route path="classroom/:id" element={<ClassroomPage />} />
                        <Route path="activities" element={<ActivityDetailPage />} />
                        <Route path="groups" element={<TeacherGroupPage />} />
                        {/* edit later
                            <Route path="activities/:id" element={<ActivityDetailPage />} />
                        */}

                    </Route>
                </Route>
            </Routes>

            <Toaster richColors position="bottom-right" />
        </BrowserRouter>
    );
}
