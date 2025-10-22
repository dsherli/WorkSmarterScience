import { createContext, useContext, useEffect, useState } from "react";

type User = {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
} | null;

type Ctx = {
    user: User;
    loading: boolean;
    refresh: () => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({
    user: null,
    loading: true,
    refresh: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const refresh = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("access");

            if (!token) {
                setUser(null);
                return;
            }

            const res = await fetch("/api/auth/user/", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Cache-Control": "no-store",
                },
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data ?? null);
            } else if (res.status === 401) {
                // access > refresh
                const newToken = await refreshAccessToken();
                if (newToken) {
                    const retry = await fetch("/api/auth/user/", {
                        headers: { Authorization: `Bearer ${newToken}` },
                    });
                    if (retry.ok) {
                        const data = await retry.json();
                        setUser(data ?? null);
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // refresh token > access
    async function refreshAccessToken(): Promise<string | null> {
        const refresh = localStorage.getItem("refresh");
        if (!refresh) return null;

        try {
            const res = await fetch("/api/token/refresh/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh }),
            });

            const data = await res.json();
            if (res.ok && data.access) {
                localStorage.setItem("access", data.access);
                return data.access;
            }
            return null;
        } catch {
            return null;
        }
    }

    useEffect(() => {
        refresh();
    }, []);

    // logout
    const logout = async () => {
        try {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            sessionStorage.clear();
            setUser(null);

            if ("caches" in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map((k) => caches.delete(k)));
            }
        } catch (err) {
            console.warn("Logout cleanup failed:", err);
        } finally {
            window.location.href = "/login";
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, refresh, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
