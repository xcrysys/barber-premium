
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

export function AdminAuthCheck() {
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUser(user);
                // Check role in profiles
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setRole(profile.role);
                } else {
                    setRole('unknown (perfil não encontrado)');
                }
            } else {
                setRole(null);
                // Redirect immediately if not logged in
                router.replace('/login');
            }
            setLoading(false);
        };

        checkUser();
    }, [router]);

    if (loading) return (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
        </div>
    );

    if (!user) {
        // Redirection handled in useEffect, simple fallback UI
        return null;
    }

    if (role !== 'admin') {
        return (
            <div className="absolute inset-x-0 top-0 z-50 p-4">
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg animate-fade-in backdrop-blur-md">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-red-500 mt-1 flex-shrink-0" />
                        <div className="flex-1 w-full overflow-hidden">
                            <h3 className="text-red-500 font-bold">Acesso Negado</h3>
                            <p className="text-red-400 text-sm mt-1">
                                Seu usuário não tem permissão de administrador. Por favor, faça login com uma conta autorizada.
                            </p>
                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={async () => {
                                        const supabase = createClient();
                                        await supabase.auth.signOut();
                                        router.push('/login');
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Sair e Tentar Outra Conta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // If admin, show tiny indicator
    return (
        <div className="absolute top-4 right-8 flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full z-50">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-500 text-xs font-mono">Admin: {user.email?.split('@')[0]}</span>
        </div>
    );
}
