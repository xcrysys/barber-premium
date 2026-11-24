
"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const supabase = createClient();
        const nextUrl = searchParams.get("next");

        supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // Check role for smart redirect
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", session.user.id)
                    .single();

                const destination = nextUrl || (
                    profile?.role === "admin" ? "/admin" :
                        profile?.role === "barber" ? "/barbeiro" :
                            "/minha-conta"
                );
                router.push(destination);
            }
        });
    }, [router, searchParams]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-neutral-400 text-sm">Autenticando...</p>
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-black">
                <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
