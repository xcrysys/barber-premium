"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Shield, Lock, Mail, ArrowRight, AlertCircle, LogIn, CheckCircle2 } from "lucide-react";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { claimFirstAdminAction } from "./actions";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [canClaimAdmin, setCanClaimAdmin] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);

    // Form de login embutido
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setUser(null);
                setIsAuthorized(false);
                setLoading(false);
                return;
            }

            setUser(user);

            // Verifica role na tabela profiles
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profile?.role === 'admin') {
                setIsAuthorized(true);
                setAuthError(null);
                setCanClaimAdmin(false);
            } else {
                setIsAuthorized(false);
                setCanClaimAdmin(true);
                setAuthError(`Usuário autenticado (${user.email}), porém o perfil está como '${profile?.role || 'customer'}'.`);
            }
        } catch (err: any) {
            console.error("Erro ao verificar autenticação de admin:", err);
            setAuthError(err.message || "Erro ao conectar com o banco de dados.");
        } finally {
            setLoading(false);
        }
    };

    const handleClaimAdmin = async () => {
        if (!user) return;
        setIsClaiming(true);
        try {
            const result = await claimFirstAdminAction(user.id);
            if (result.error) {
                setAuthError(result.error);
            } else {
                setIsAuthorized(true);
                setAuthError(null);
                setCanClaimAdmin(false);
            }
        } catch (err: any) {
            setAuthError("Erro ao ativar admin: " + err.message);
        } finally {
            setIsClaiming(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setAuthError(null);

        try {
            const supabase = createClient();
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                setAuthError("Email ou senha incorretos: " + error.message);
                setIsSubmitting(false);
                return;
            }

            if (data.user) {
                setUser(data.user);
                // Checa se o usuário é admin
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", data.user.id)
                    .single();

                if (profile?.role === 'admin') {
                    setIsAuthorized(true);
                    setAuthError(null);
                    setCanClaimAdmin(false);
                } else {
                    setCanClaimAdmin(true);
                    setAuthError(`Usuário autenticado (${data.user.email}), porém o perfil está como '${profile?.role || 'customer'}'.`);
                }
            }
        } catch (err: any) {
            setAuthError("Erro ao autenticar: " + (err.message || "Tente novamente"));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">
                    Carregando Painel Administrativo...
                </span>
            </div>
        );
    }

    // Se NÃO estiver autorizado, exibe a tela de login elegante direto no /admin
    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-black">
                <div className="w-full max-w-md space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(245,158,11,0.15)]">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
                            Painel Administrativo
                        </h1>
                        <p className="text-neutral-400 text-xs sm:text-sm">
                            Gestão de Serviços, Barbeiros, Agenda e Pagamentos PIX
                        </p>
                    </div>

                    {authError && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs space-y-3">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />
                                <div className="leading-relaxed">
                                    {authError}
                                </div>
                            </div>

                            {/* Botão de 1 clique para se tornar Admin */}
                            {canClaimAdmin && (
                                <button
                                    type="button"
                                    onClick={handleClaimAdmin}
                                    disabled={isClaiming}
                                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    {isClaiming ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Ativando Administrador...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-4 h-4" />
                                            Ativar {user?.email} como Dono / Admin Agora
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Formulário de Login */}
                    {!user && (
                        <form onSubmit={handleLogin} className="bg-neutral-900/80 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl backdrop-blur-md">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                                        Email do Administrador
                                    </label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@barbearia.com"
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-amber-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                                        Senha
                                    </label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-amber-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Autenticando...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-4 h-4" />
                                        Entrar no Painel
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="text-center pt-2">
                        <Link
                            href="/"
                            className="text-xs text-neutral-500 hover:text-amber-400 transition-colors inline-flex items-center gap-1"
                        >
                            ← Voltar para o Site Principal
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Se estiver autorizado, renderiza o layout administrativo com a Sidebar
    return (
        <div className="flex min-h-screen bg-neutral-950 text-white selection:bg-amber-500 selection:text-black">
            <AdminSidebar />
            <main className="flex-1 md:ml-64 p-4 sm:p-6 md:p-10 max-w-7xl">
                {children}
            </main>
        </div>
    );
}
