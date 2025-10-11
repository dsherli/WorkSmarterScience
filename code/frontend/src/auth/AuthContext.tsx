// src/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";

type User = { id: number; username: string } | null;
type Ctx = {
    user: User;
    loading: boolean;
    refresh: () => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({ user: null, loading: true, refresh: async () => { }, logout: async () => { } });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const refresh = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/user/", { credentials: "include" });
            setUser(res.ok ? await res.json() : null);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refresh(); }, []);

    const logout = async () => {
        await fetch("/api/auth/logout/", { method: "POST", credentials: "include" });
        setUser(null);
    };

    return <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>;
}
