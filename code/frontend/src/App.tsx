import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppContent from "./pages/AppContent";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Protected from "./auth/Protected";
import Dashboard from "./pages/Dashboard";

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
                    <Route path="/dashboard" element={<Dashboard />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
