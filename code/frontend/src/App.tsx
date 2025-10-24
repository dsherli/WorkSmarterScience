import { useState } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    useNavigate,
} from "react-router-dom";
import { MainPage } from "./pages/MainPage";
import { DashboardLayout } from "./pages/DashboardLayout";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { StudentDashboard } from "./pages/StudentDashboard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { User, GraduationCap } from "lucide-react";

type View = "main" | "role-select" | "dashboard";
type UserRole = "teacher" | "student" | null;

function AppContent() {
    const [currentView, setCurrentView] = useState<View>("main");
    const [userRole, setUserRole] = useState<UserRole>(null);
    const navigate = useNavigate();

    const handleSignUp = () => {
        setCurrentView("role-select");
    };

    const handleSignIn = () => {
        navigate("/login");
    };

    const handleRoleSelect = (role: "teacher" | "student") => {
        setUserRole(role);
        console.log("Selected role:", role);
        // ----------------------------------------------------------- console; delete later
        console.log("Selected role:", role);
        navigate("/register", { state: { role } });
    };

    const handleLogout = () => {
        setUserRole(null);
        setCurrentView("main");
    };

    if (currentView === "main") {
        return <MainPage onSignUp={handleSignUp} onSignIn={handleSignIn} />;
    }

    if (currentView === "role-select") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl mb-3">Welcome to WorkSmartScience</h1>
                        <p className="text-xl text-gray-600">Choose your role to continue</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Teacher Card */}
                        <Card
                            className="p-8 hover:shadow-2xl transition-all cursor-pointer group border-2 hover:border-teal-500 flex flex-col justify-between"
                            onClick={() => handleRoleSelect("teacher")}
                        >
                            <div className="flex flex-col flex-grow text-center">
                                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    <GraduationCap className="w-12 h-12" />
                                </div>
                                <h2 className="text-2xl mb-3">I'm a Teacher</h2>
                                <p className="text-gray-600 mb-6">
                                    Manage classrooms, assign activities, and leverage AI to provide better feedback to students
                                </p>
                            </div>
                            <Button size="lg" className="w-full bg-teal-600 hover:bg-teal-700 mt-auto">
                                Continue as Teacher
                            </Button>
                        </Card>

                        {/* Student Card */}
                        <Card
                            className="p-8 hover:shadow-2xl transition-all cursor-pointer group border-2 hover:border-cyan-500 flex flex-col justify-between"
                            onClick={() => handleRoleSelect("student")}
                        >
                            <div className="flex flex-col flex-grow text-center">
                                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    <User className="w-12 h-12" />
                                </div>
                                <h2 className="text-2xl mb-3">I'm a Student</h2>
                                <p className="text-gray-600 mb-6">
                                    Access your classes, complete assignments, and get help from AI when you need it
                                </p>
                            </div>
                            <Button size="lg" className="w-full bg-cyan-600 hover:bg-cyan-700 mt-auto">
                                Continue as Student
                            </Button>
                        </Card>
                    </div>


                    <div className="text-center mt-6">
                        <Button variant="ghost" onClick={() => setCurrentView("main")}>
                            Back to Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout userRole={userRole!} onLogout={handleLogout}>
            {userRole === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
        </DashboardLayout>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Main app with role selection */}
                <Route path="/" element={<AppContent />} />

                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </BrowserRouter>
    );
}
