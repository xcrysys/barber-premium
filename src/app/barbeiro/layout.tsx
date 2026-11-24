
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { Scissors, LayoutDashboard, CalendarDays, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BarberLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [barberName, setBarberName] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        checkBarber();
    }, []);

    const checkBarber = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.replace("/login?next=/barbeiro");
            return;
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", user.id)
            .single();

        if (profile?.role === "barber" || profile?.role === "admin") {
            setIsAuthorized(true);
            setBarberName(profile.full_name || "Barbeiro");
        } else {
            router.replace("/");
        }

        setLoading(false);
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    if (!isAuthorized) return null;

    const navItems = [
        { href: "/barbeiro", icon: LayoutDashboard, label: "Painel" },
        { href: "/barbeiro/agenda", icon: CalendarDays, label: "Minha Agenda" },
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Sidebar — desktop */}
            <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-60 bg-neutral-950 border-r border-white/5 z-40">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Scissors className="w-5 h-5 text-amber-500" />
                        <span className="text-white font-bold font-serif">Barber Premium</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">Área do Barbeiro</p>
                    <p className="text-amber-500 font-medium text-sm">{barberName}</p>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map(({ href, icon: Icon, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === href
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-neutral-500 hover:text-red-400 text-sm transition-colors px-3 py-2 rounded-lg hover:bg-red-500/5"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Mobile Topbar */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-amber-500" />
                    <span className="text-white font-bold font-serif text-sm">Área do Barbeiro</span>
                </div>
                <button onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
                </button>
            </header>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden fixed top-14 left-0 right-0 z-40 bg-black border-b border-white/5 px-4 py-4 space-y-2">
                    {navItems.map(({ href, icon: Icon, label }) => (
                        <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-white/5 text-sm">
                            <Icon className="w-4 h-4 text-amber-500" /> {label}
                        </Link>
                    ))}
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-neutral-500 hover:text-red-400 text-sm">
                        <LogOut className="w-4 h-4" /> Sair
                    </button>
                </div>
            )}

            <main className="md:ml-60 pt-14 md:pt-0 p-6 md:p-10">
                {children}
            </main>
        </div>
    );
}
