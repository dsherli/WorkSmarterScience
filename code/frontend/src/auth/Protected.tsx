import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Protected() {
    const { user, loading } = useAuth();
    const loc = useLocation();

    if (loading) {
        return (
            <div className="min-h-[50vh] grid place-items-center text-gray-400 text-sm">
                Checking session…
            </div>
        );
    }

    if (!user && !loading) {
        return <Navigate to="/login" replace state={{ from: loc }} />;
    }

    return <Outlet />;
}
