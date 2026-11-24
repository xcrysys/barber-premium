
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminSetupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        const supabase = createClient();

        try {
            // 1. Sign Up
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: "Admin User",
                    }
                }
            });

            if (signUpError) throw signUpError;

            const user = signUpData.user;

            if (user) {
                // 2. Promote to Admin immediately
                // Note: This relies on "Users can update own profile" policy being open for 'role' column.
                // In production, you'd secure this column and use a trigger or admin function.
                // But for setup, this is perfect.
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ role: 'admin' })
                    .eq('id', user.id);

                if (updateError) {
                    console.error("Erro ao promover usuário:", updateError);
                    setError("Usuário criado, mas falha ao promover para Admin. Use o SQL manual.");
                } else {
                    setMessage("Sucesso! Usuário Admin criado e promovido.");
                    // Check if session exists (email confirmed or auto-confirm off)
                    if (signUpData.session) {
                        setTimeout(() => router.push('/admin/agendamentos'), 2000);
                    } else {
                        setMessage("Sucesso! Verifique seu email para confirmar, depois faça login.");
                    }
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

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-fade-in text-center">

                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mb-4">
                        <Shield className="w-8 h-8 text-black" />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-white tracking-wide">
                        Configurar Admin
                    </h2>
                    <p className="mt-2 text-neutral-400 max-w-xs mx-auto">
                        Crie um novo usuário com privilégios administrativos totais.
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
                                placeholder="admin@barber.com"
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
                        className={`w-full flex justify-center py-3 px-4 rounded-lg font-medium text-black transition-all
                            ${loading ? 'bg-amber-500/50 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/20'}
                        `}
                    >
                        {loading ? "Criando..." : (
                            <span className="flex items-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Criar Admin
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
                    Nota: Use esta página apenas para configuração inicial.
                </p>
            </div>
        </div>
    );
}
