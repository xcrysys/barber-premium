"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
    Scissors,
    Menu,
    X,
    User,
    Calendar,
    LogOut,
    Settings,
    Clock,
    Phone,
    Sparkles,
    ChevronRight,
    LayoutDashboard
} from "lucide-react";

export function Navbar() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                setRole(profile?.role ?? null);
            }
        };
        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => fetchUser());

        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Prevent body scrolling when mobile drawer is open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [menuOpen]);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        setRole(null);
        setMenuOpen(false);
        window.location.href = '/';
    };

    const isBookingPage = pathname === "/agendar";

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? 'bg-neutral-950/90 backdrop-blur-xl border-b border-amber-500/15 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.8)]'
                        : 'bg-gradient-to-b from-neutral-950/80 to-transparent backdrop-blur-sm py-4'
                }`}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="group flex items-center gap-2.5 transition-transform duration-200 active:scale-95"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-md shadow-amber-500/20 group-hover:rotate-6 transition-transform">
                            <Scissors className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-lg tracking-tight font-serif flex items-center gap-1.5">
                                Barber Premium
                                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                            </span>
                            <span className="text-[10px] text-amber-500/80 uppercase tracking-widest font-mono">
                                Exclusive Club
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            href="/agendar"
                            className={`text-sm font-medium transition-colors ${
                                pathname === "/agendar"
                                    ? "text-amber-400 font-semibold"
                                    : "text-neutral-300 hover:text-white"
                            }`}
                        >
                            Agendar
                        </Link>
                        <Link
                            href="/#servicos"
                            className="text-neutral-300 hover:text-white text-sm font-medium transition-colors"
                        >
                            Serviços
                        </Link>
                        <Link
                            href="/#sobre"
                            className="text-neutral-300 hover:text-white text-sm font-medium transition-colors"
                        >
                            Sobre
                        </Link>
                    </nav>

                    {/* Desktop Auth & CTAs */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <>
                                {role === 'admin' && (
                                    <Link
                                        href="/admin"
                                        className="text-amber-400 hover:text-amber-300 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5 transition-colors"
                                    >
                                        <Settings className="w-3.5 h-3.5" /> Admin
                                    </Link>
                                )}
                                {role === 'barber' && (
                                    <Link
                                        href="/barbeiro"
                                        className="text-amber-400 hover:text-amber-300 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5 transition-colors"
                                    >
                                        <LayoutDashboard className="w-3.5 h-3.5" /> Agenda
                                    </Link>
                                )}
                                <Link
                                    href="/minha-conta"
                                    className="flex items-center gap-2 bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 text-white text-sm px-4 py-2 rounded-xl transition-all"
                                >
                                    <User className="w-4 h-4 text-amber-500" />
                                    <span>Minha Conta</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    title="Sair da Conta"
                                    className="text-neutral-400 hover:text-rose-400 text-sm transition-colors p-2 rounded-lg hover:bg-white/5"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-neutral-300 hover:text-white text-sm font-medium transition-colors px-3 py-2"
                                >
                                    Entrar
                                </Link>
                                {!isBookingPage && (
                                    <Link
                                        href="/agendar"
                                        className="relative group overflow-hidden bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center gap-1.5"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>Agendar Horário</span>
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    {/* Mobile Hamburger & Quick Action */}
                    <div className="flex md:hidden items-center gap-2">
                        {!isBookingPage && (
                            <Link
                                href="/agendar"
                                className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                            >
                                <Calendar className="w-3.5 h-3.5" /> Agendar
                            </Link>
                        )}

                        <button
                            type="button"
                            className="text-neutral-200 hover:text-white p-2 rounded-lg bg-neutral-900/80 border border-white/5 focus:outline-none"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Abrir Menu"
                        >
                            {menuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Drawer Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <div className="fixed inset-0 z-40 md:hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMenuOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md"
                        />

                        {/* Slide-Down Mobile Drawer */}
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed top-16 left-0 right-0 bg-neutral-950 border-b border-amber-500/20 px-6 py-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
                        >
                            {/* Fast Booking CTA */}
                            <Link
                                href="/agendar"
                                onClick={() => setMenuOpen(false)}
                                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                            >
                                <Calendar className="w-5 h-5" />
                                <span>Agendar Corte ou Barba</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>

                            {/* Nav Links */}
                            <div className="flex flex-col space-y-1 divide-y divide-white/5 text-base font-medium">
                                <Link
                                    href="/#servicos"
                                    className="py-3 text-neutral-300 hover:text-amber-400 flex items-center justify-between"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <span>Serviços & Preços</span>
                                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                                </Link>
                                <Link
                                    href="/#sobre"
                                    className="py-3 text-neutral-300 hover:text-amber-400 flex items-center justify-between"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <span>Nossa Barbearia</span>
                                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                                </Link>

                                {user ? (
                                    <>
                                        <Link
                                            href="/minha-conta"
                                            className="py-3 text-amber-400 flex items-center justify-between"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <span className="flex items-center gap-2">
                                                <User className="w-4 h-4" /> Minha Conta
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-neutral-600" />
                                        </Link>
                                        {role === 'admin' && (
                                            <Link
                                                href="/admin"
                                                className="py-3 text-amber-300 flex items-center justify-between"
                                                onClick={() => setMenuOpen(false)}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Settings className="w-4 h-4" /> Painel Administrativo
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-neutral-600" />
                                            </Link>
                                        )}
                                        {role === 'barber' && (
                                            <Link
                                                href="/barbeiro"
                                                className="py-3 text-amber-300 flex items-center justify-between"
                                                onClick={() => setMenuOpen(false)}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <LayoutDashboard className="w-4 h-4" /> Painel do Barbeiro
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-neutral-600" />
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="py-3 text-left text-neutral-400 hover:text-rose-400 flex items-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Sair da Conta</span>
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="py-3 text-neutral-200 hover:text-white flex items-center justify-between"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <span>Entrar ou Cadastrar</span>
                                        <ChevronRight className="w-4 h-4 text-neutral-600" />
                                    </Link>
                                )}
                            </div>

                            {/* Working Hours & Contact Info */}
                            <div className="pt-3 border-t border-white/5 text-xs text-neutral-400 space-y-1.5">
                                <div className="flex items-center gap-2 text-neutral-300">
                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Segunda a Sábado: 09:00 às 20:00</span>
                                </div>
                                <div className="flex items-center gap-2 text-neutral-300">
                                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Atendimento WhatsApp: (11) 99999-8888</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

export default Navbar;
