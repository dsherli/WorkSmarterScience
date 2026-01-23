import { Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import DashboardLayout from "./DashboardLayout";

export default function Dashboard() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <DashboardLayout>
            <Outlet />
        </DashboardLayout>
    );
}
