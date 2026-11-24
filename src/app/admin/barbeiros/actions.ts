
"use server";

import { createClient } from "@supabase/supabase-js";

export async function createBarberAction(formData: FormData) {
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { error: "Erro de Configuração: SERVICE_ROLE_KEY não encontrada no servidor." };
    }

    // Usamos o Service Role para ter poder total (bypassa RLS e Auth Restrictions)
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    // 1. Criar Usuário no Auth (Email Confirmado Automaticamente)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            role: 'barber' // Já nasce como barbeiro
        }
    });

    if (authError) {
        return { error: "Erro ao criar usuário: " + authError.message };
    }

    const userId = authData.user.id;

    // 2. Garantir Perfil (Caso o Trigger falhe ou demore, forçamos aqui)
    const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
            id: userId,
            full_name: fullName,
            role: 'barber'
        });

    if (profileError) {
        return { error: "Erro ao criar perfil: " + profileError.message };
    }

    // 3. Criar Ficha de Barbeiro
    const { error: barberError } = await supabaseAdmin
        .from("barbers")
        .insert([{
            id: userId,
            bio: "Novo Barbeiro da Equipe",
            specialties: ["Corte", "Barba"],
            is_active: true
        }]);

    if (barberError) {
        return { error: "Erro ao criar ficha de barbeiro: " + barberError.message };
    }

    // 4. Inserir Horários Padrão (Seg-Sáb, 09:00-18:00)
    const availabilityPayload = [];
    // 1=Segunda ... 6=Sábado
    for (let day = 1; day <= 6; day++) {
        availabilityPayload.push({
            barber_id: userId,
            day_of_week: day,
            start_time: "09:00",
            end_time: "18:00",
            break_start: "12:00",
            break_end: "13:00"
        });
    }

    const { error: availError } = await supabaseAdmin
        .from("availability")
        .insert(availabilityPayload);

    if (availError) {
        // Não falha o cadastro todo, mas avisa
        return { error: "Barbeiro criado, mas erro ao definir horários: " + availError.message };
    }

    return { success: true };
}
