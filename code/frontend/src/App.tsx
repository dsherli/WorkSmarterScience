// App.tsx
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Protected from "./auth/Protected";
import "./App.css";

function Header() {
  const { pathname } = useLocation();
  const showNav = !["/login", "/register"].includes(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-[#0b0f12]/80 backdrop-blur">
      <div className="mx-auto max-w-5xl container-px h-14 flex items-center justify-between">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-amber-400 font-semibold">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-900 text-amber-300">V</span>
          <span>Student App</span>
        </Link>
        {showNav && (
          <nav className="text-sm text-gray-300">
            <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
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
