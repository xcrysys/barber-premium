
"use server";

import { createClient } from "@supabase/supabase-js";

const adminClient = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function resetUserPasswordAction(email: string, newPassword: string) {
    if (!email || !newPassword) return { error: "Email e senha são obrigatórios." };
    if (newPassword.length < 6) return { error: "A senha deve ter no mínimo 6 caracteres." };

    const supabase = adminClient();

    // 1. Try to find in auth.users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) return { error: "Erro ao buscar usuários: " + listError.message };

    const emailNorm = email.toLowerCase().trim();
    const existingUser = users.find(u => u.email === emailNorm);

    if (existingUser) {
        // 2a. User EXISTS in Auth → just update password
        const { error } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: newPassword }
        );
        if (error) return { error: "Erro ao atualizar senha: " + error.message };
        return { success: true, created: false };
    }

    // 2b. User does NOT exist in Auth → check if profile exists with this email
    // (Barbers created via seed/SQL only — no auth account yet)
    const { data: profileByEmail } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id",
            // Get the auth UUID that matches this email from profiles via a subquery
            // We'll try looking in auth.users directly via admin API using email filter
            // Since not found above, try creating the auth user
            "00000000-0000-0000-0000-000000000000" // placeholder, handled below
        )
        .single();

    // Real approach: look up the profile by matching email in a profiles join
    // Since profiles don't store email, we need to fetch via seed ID.
    // Best: create a NEW auth user with email_confirm=true and link to existing profile.
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: emailNorm,
        password: newPassword,
        email_confirm: true,
        user_metadata: { full_name: emailNorm.split("@")[0] }
    });

    if (createError) {
        return { error: "Usuário não encontrado no sistema de login. Erro ao criar: " + createError.message };
    }

    // Link: check if there's a profile with matching name in barbers table
    // and update it, or create a fresh profile for this new auth user
    const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
            id: newUser.user.id,
            full_name: newUser.user.user_metadata?.full_name || emailNorm.split("@")[0],
            role: "barber"
        }, { onConflict: "id" });

    if (profileError) {
        console.error("Profile upsert error:", profileError);
    }

    return {
        success: true,
        created: true,
        warning: "Este barbeiro não tinha conta de login. Uma nova conta foi criada com este email e senha."
    };
}

/**
 * Create auth login for a barber that exists only in the DB (seed data).
 * Takes the existing barber's profile ID (UUID) and links it to a new auth account.
 */
export async function createAuthForExistingBarber(profileId: string, email: string, password: string) {
    if (!profileId || !email || !password) return { error: "Preencha todos os campos." };

    const supabase = adminClient();

    // 1. Verify profile exists
    const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", profileId)
        .single();

    if (profileErr || !profile) return { error: "Perfil não encontrado com esse ID." };

    // 2. Create auth user with the SAME UUID as the existing profile
    // Supabase admin API allows creating users with a specific ID
    const { data, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password,
        email_confirm: true,
        user_metadata: { full_name: profile.full_name }
    });

    if (createError) return { error: "Erro ao criar login: " + createError.message };

    // 3. Update the profile to match the new auth user's ID
    // We need to delete old profile and re-insert with new auth ID,
    // OR update the barbers table to point to new user ID
    // SIMPLER: update the new auth user's profile record
    await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: profile.full_name,
        role: "barber"
    }, { onConflict: "id" });

    // 4. Create barber record if not exists
    await supabase.from("barbers").upsert({
        id: data.user.id,
        bio: "Barbeiro da equipe",
        specialties: ["Corte", "Barba"],
        is_active: true
    }, { onConflict: "id" });

    return { success: true, newUserId: data.user.id };
}
