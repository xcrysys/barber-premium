
"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function registerCustomerAction(email: string, password: string, fullName: string = "") {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { error: "Erro de Configuração: SERVICE_ROLE_KEY ausente." };
    }

    // 1. Create User (Auto-confirmed)
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Pula confirmação de email
        user_metadata: { full_name: fullName }
    });

    if (createError) {
        return { error: createError.message };
    }

    // 2. Ensure Profile Exists & Update Role to 'customer' if needed
    if (user && user.user) {
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id: user.user.id,
                full_name: fullName,
                role: 'customer'
            }, { onConflict: 'id' });

        if (profileError) {
            console.error("Profile creation error:", profileError);
            // We don't block registration on profile error, but log it.
            // Login usually works via Auth, profile is secondary but important.
        }

        return { success: true };
    }

    return { error: "Erro desconhecido ao criar usuário." };
}
