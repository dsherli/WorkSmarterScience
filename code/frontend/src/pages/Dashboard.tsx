import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import DashboardLayout from "./DashboardLayout";
import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";

export default function Dashboard() {
    const { user, logout } = useAuth();

    const location = useLocation();

    if (!user) return null;

    const isRootDashboard = location.pathname === "/dashboard";

    return (
        <DashboardLayout>
            {/* teacher or student */}
            {isRootDashboard ? (
                user.role === "teacher" ? (
                    <TeacherDashboard />
                ) : (
                    <StudentDashboard />
                )
            ) : (
                <Outlet />
            )}
        </DashboardLayout>
    );
}
