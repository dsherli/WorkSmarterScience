// App.tsx
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Protected from "./auth/Protected";
import "./App.css";
import { useAuth } from "./auth/AuthContext";

function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const showNav = !["/login", "/register"].includes(pathname);
  const showLogout = showNav && !!user;

  async function onLogout() {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-[#0b0f12]/80 backdrop-blur">
      <div className="mx-auto max-w-5xl container-px h-14 flex items-center justify-between">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-amber-400 font-semibold">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-900 text-amber-300">V</span>
          <span>Student App</span>
        </Link>
        {showNav && (
          <nav className="text-sm text-gray-300 flex items-center gap-4">
            <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
            {showLogout && (
              <button
                onClick={onLogout}
                className="rounded-md border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-800 hover:text-white"
                aria-label="Log out"
              >
                Log out
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="mx-auto max-w-5xl container-px py-10">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Protected />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          <Route path="*" element={<Login />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
