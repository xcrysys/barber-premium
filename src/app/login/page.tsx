"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MoveRight, Lock, Mail, Chrome, AlertCircle, Scissors } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Inner component uses useSearchParams (needs Suspense wrapper)
function LoginContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login/Register
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextUrl = searchParams.get("next");

    const supabase = createClient();

    const handleGoogleLogin = async () => {
        setLoading(true);
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${nextUrl || '/minha-conta'}`,
            },
        });
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (isSignUp) {
            // Sign Up via Server Action (Auto-confirmed)
            const { registerCustomerAction } = await import("./actions");
            const result = await registerCustomerAction(email, password, email.split("@")[0]);

            if (result.error) {
                setMessage("Erro ao cadastrar: " + result.error);
                setLoading(false);
                return;
            }

            // Auto-Login after creation
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                setMessage("Cadastro realizado, mas erro ao logar automaticamente. Tente entrar.");
                setIsSignUp(false); // Switch to login mode
                setLoading(false);
            } else {
                // Success! Redirect
                router.push(nextUrl || '/minha-conta');
                router.refresh();
            }

        } else {
            // Sign In
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                setMessage("Erro ao entrar: Credenciais inválidas.");
                setLoading(false);
            } else {
                // Check Role for Redirection
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", data.user.id)
                    .single();

                if (profile?.role === 'admin') {
                    router.push(nextUrl || '/admin');
                } else if (profile?.role === 'barber') {
                    router.push(nextUrl || '/barbeiro');
                } else {
                    router.push(nextUrl || '/minha-conta');
                }
                router.refresh();
            }
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6 animate-fade-in text-center">

                {/* Logo/Brand */}
                <div>
                    <Link href="/">
                        <h2 className="text-4xl font-serif font-bold text-white tracking-wide cursor-pointer hover:opacity-80 transition-opacity">
                            BARBER<span className="text-amber-500">PREMIUM</span>
                        </h2>
                    </Link>
                    <p className="mt-2 text-neutral-400">
                        {isSignUp ? "Crie sua conta" : "Bem-vindo de volta"}
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-neutral-900/50 p-8 rounded-2xl border border-white/5 shadow-xl backdrop-blur-sm space-y-6">

                    {/* Google Button */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
                    >
                        <Chrome className="w-5 h-5" />
                        Entrar com Google
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutral-800"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-neutral-900 text-neutral-500">Ou continue com e-mail</span>
                        </div>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-neutral-500" />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 px-3 py-3 border border-neutral-700 bg-neutral-950 text-white rounded-lg focus:ring-amber-500 focus:border-amber-500 outline-none placeholder-neutral-600 transition-all"
                                    placeholder="seu@email.com"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-neutral-500" />
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 px-3 py-3 border border-neutral-700 bg-neutral-950 text-white rounded-lg focus:ring-amber-500 focus:border-amber-500 outline-none placeholder-neutral-600 transition-all"
                                    placeholder={isSignUp ? "Crie uma senha (min 6 chars)" : "Sua senha"}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-black ${loading ? 'bg-amber-500/50' : 'bg-amber-500 hover:bg-amber-400'} transition-all`}
                        >
                            {loading ? "Processando..." : (
                                <span className="flex items-center gap-2">
                                    {isSignUp ? "Criar Conta" : "Entrar"}
                                    <MoveRight className="w-4 h-4" />
                                </span>
                            )}
                        </button>

                        {message && (
                            <div className={`text-sm rounded-lg p-3 flex items-start gap-2 text-left ${message.includes("Erro") ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                {message}
                            </div>
                        )}
                    </form>

                    {/* Toggle Login/Signup */}
                    <div className="text-sm text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setMessage(null);
                            }}
                            className="text-neutral-400 hover:text-white underline transition-colors"
                        >
                            {isSignUp ? "Já tem uma conta? Faça login" : "Não tem conta? Cadastre-se"}
                        </button>
                    </div>

                </div>

                <p className="text-xs text-neutral-600">
                    &copy; 2026 Barber Premium.
                </p>
            </div>
        </div>
    );
}

// Export with Suspense to fix useSearchParams() in Next.js 14+
export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
