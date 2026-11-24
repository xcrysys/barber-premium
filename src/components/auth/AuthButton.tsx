
"use client";

import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";

export function AuthButton() {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSignIn = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <UserIcon className="w-4 h-4" />
                    <span className="truncate max-w-[150px]">{user.user_metadata.full_name || user.email}</span>
                </div>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sair
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleSignIn}
            className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-6 py-2 rounded-full font-medium transition-all shadow-lg hover:shadow-xl"
        >
            <LogIn className="w-4 h-4" />
            Entrar com Google
        </button>
    );
}
