
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Scissors, Users, CalendarDays, LogOut, ExternalLink, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Agendamentos", href: "/admin/agendamentos", icon: CalendarDays },
    { name: "Serviços", href: "/admin/servicos", icon: Scissors },
    { name: "Barbeiros", href: "/admin/barbeiros", icon: Users },
    { name: "Redefinir Senha", href: "/admin/reset-senha", icon: KeyRound },
];

const EXTERNAL_ITEMS = [
    { name: "Área do Barbeiro", href: "/barbeiro", icon: ExternalLink },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-neutral-950 border-r border-white/5 flex flex-col z-50">
            <div className="p-6 border-b border-white/5">
                <Link href="/admin">
                    <h1 className="text-xl font-serif font-bold text-amber-500 tracking-wider cursor-pointer hover:text-amber-400 transition-colors">
                        PREMIUM BARBER
                    </h1>
                </Link>
                <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wide">Painel Administrativo</p>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* External links */}
            <div className="px-4 pb-2 pt-2 border-t border-white/5">
                <p className="text-xs text-neutral-600 uppercase tracking-wider px-4 mb-2">Acesso Direto</p>
                {EXTERNAL_ITEMS.map(({ href, icon: Icon, name }) => (
                    <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-neutral-500 hover:text-amber-400 hover:bg-amber-500/5 transition-all"
                    >
                        <Icon className="w-4 h-4" />
                        {name}
                    </Link>
                ))}
            </div>

            <div className="p-4 border-t border-white/5">
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <LogOut className="w-5 h-5" />
                    {isLoggingOut ? "Saindo..." : "Sair"}
                </button>
            </div>
        </aside>
    );
}
