"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Shield, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminSetupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingLock, setCheckingLock] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Trava de segurança: se já existir qualquer admin no banco, a página se auto-bloqueia
    useEffect(() => {
        const checkExistingAdmin = async () => {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("role", "admin")
                    .limit(1);

                if (data && data.length > 0) {
                    setIsLocked(true);
                }
            } catch (err) {
                console.error("Erro ao verificar admin existente:", err);
            } finally {
                setCheckingLock(false);
            }
        };

        checkExistingAdmin();
    }, []);

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked) return;

        setLoading(true);
        setMessage(null);
        setError(null);

        const supabase = createClient();

        try {
            // 1. Cadastra no Supabase Auth
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: "Admin Principal",
                    }
                }
            });

            if (signUpError) throw signUpError;

            const user = signUpData.user;

            if (user) {
                // 2. Promove imediatamente para Admin
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ role: 'admin' })
                    .eq('id', user.id);

                if (updateError) {
                    console.error("Erro ao promover usuário:", updateError);
                    setError("Usuário criado, mas use o SQL do Supabase para colocar role = 'admin'.");
                } else {
                    setMessage("Sucesso! Administrador criado e promovido. Esta tela será bloqueada.");
                    setIsLocked(true);
                    setTimeout(() => router.push('/login'), 2000);
                }
            } else {
                setError("Erro inesperado: Usuário não retornado após cadastro.");
            }

        } catch (err: any) {
            setError(err.message || "Ocorreu um erro desconhecido.");
        } finally {
            setLoading(false);
        }
    };

    if (checkingLock) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 text-neutral-500">
                Verificando segurança do sistema...
            </div>
        );
    }

    // Se já tiver admin, bloqueia totalmente o acesso!
    if (isLocked) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
                <div className="w-full max-w-md bg-neutral-900/60 p-8 rounded-2xl border border-white/10 space-y-4 shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center mx-auto">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-white">
                        Acesso Bloqueado por Segurança
                    </h2>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                        O Administrador deste sistema já foi configurado. Esta página de setup foi desativada permanentemente para impedir que qualquer outra pessoa crie acessos.
                    </p>
                    <div className="pt-4">
                        <Link
                            href="/login"
                            className="inline-block w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-black text-sm transition-all"
                        >
                            Ir para Tela de Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-fade-in text-center">

                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        <Shield className="w-8 h-8 text-black" />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-white tracking-wide">
                        Configurar Primeiro Admin
                    </h2>
                    <p className="mt-2 text-neutral-400 max-w-xs mx-auto text-sm">
                        Esta tela só pode ser usada uma única vez para registrar o dono do sistema.
                    </p>
                </div>

                <form onSubmit={handleSetup} className="mt-8 space-y-6 bg-neutral-900/50 p-8 rounded-2xl border border-white/5 shadow-xl backdrop-blur-sm text-left">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
                                placeholder="seu-email@exemplo.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1">Senha</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-3.5 px-4 rounded-xl font-bold text-black transition-all cursor-pointer
                            ${loading ? 'bg-amber-500/50 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/20'}
                        `}
                    >
                        {loading ? "Criando..." : (
                            <span className="flex items-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Criar Admin & Bloquear Tela
                            </span>
                        )}
                    </button>

                    {message && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-green-400">{message}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}
                </form>

                <p className="text-xs text-neutral-600">
                    Segurança ativa: Após cadastrar o primeiro admin, este formulário trava automaticamente para sempre.
                </p>
            </div>
        </div>
    );
}
