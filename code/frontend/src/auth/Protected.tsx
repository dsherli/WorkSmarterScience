// src/auth/Protected.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Protected() {
    const { user } = useAuth();
    const loc = useLocation();
    if (user === null) return <Navigate to="/login" replace state={{ from: loc }} />;
    return <Outlet />;
}
