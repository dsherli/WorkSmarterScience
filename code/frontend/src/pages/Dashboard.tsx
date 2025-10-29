import { useAuth } from "../auth/AuthContext";
import DashboardLayout from "./DashboardLayout";
import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";

export default function Dashboard() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <DashboardLayout userRole={user.role} onLogout={logout}>
            {user.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
        </DashboardLayout>
    );
}
