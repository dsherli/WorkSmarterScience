import { useAuth } from "../auth/AuthContext";
import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";

export default function DashboardIndex() {
    const { user } = useAuth();

    if (!user) return null;

    if (user.role === "teacher") {
        return <TeacherDashboard />;
    }

    return <StudentDashboard />;
}
