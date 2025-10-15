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

// read cookie
function getCookie(name: string) {
    const m = document.cookie.match(new RegExp("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)"));
    return m ? m.pop() : undefined;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const refresh = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/auth/user/", {
                credentials: "include",
                cache: "no-store",
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate",
                    Pragma: "no-cache",
                },
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data ?? null);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    // server logout + local cleanup
    const logout = async () => {
        try {
            const csrftoken = getCookie("csrftoken");
            await fetch("/api/auth/logout/", {
                method: "POST",
                credentials: "include",
                cache: "no-store",
                headers: {
                    ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
                    "Cache-Control": "no-store",
                },
            });
        } catch (err) {
            console.warn("Logout failed:", err);
        } finally {
            setUser(null);
            setLoading(false);

            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch { }

            try {
                document.cookie.split(";").forEach((c) => {
                    document.cookie = c
                        .replace(/^ +/, "")
                        .replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
                });
            } catch { }

            if ("caches" in window) {
                try {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                } catch { }
            }

            window.location.href = "/login";
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, refresh, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
