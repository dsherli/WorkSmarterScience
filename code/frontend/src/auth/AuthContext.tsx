// src/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";

type User = { id: number; username: string } | null;
type Ctx = { user: User; refresh: () => Promise<void>; logout: () => Promise<void> };

const AuthContext = createContext<Ctx>({ user: null, refresh: async () => { }, logout: async () => { } });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);

    const refresh = async () => {
        try {
            const res = await fetch("/api/auth/user/", { credentials: "include" });
            setUser(res.ok ? await res.json() : null);
        } catch { setUser(null); }
    };

    useEffect(() => { refresh(); }, []);

    const logout = async () => {
        await fetch("/api/auth/logout/", { method: "POST", credentials: "include" });
        setUser(null);
    };

    return <AuthContext.Provider value={{ user, refresh, logout }}>{children}</AuthContext.Provider>;
}
