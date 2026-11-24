
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { AdminSidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.replace("/login?next=/admin");
            return;
        }

        // Check Role in Metadata (Faster) OR Profile (More Secure/Reliable)
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role === 'admin') {
            setIsAuthorized(true);
        } else {
            router.replace("/"); // Not admin -> Home
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="flex min-h-screen bg-black text-white">
            <AdminSidebar />
            <main className="flex-1 ml-64 p-6 md:p-10">
                {children}
            </main>
        </div>
    );
}
