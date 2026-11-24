
"use server";

import { createClient } from "@supabase/supabase-js";
import { Service } from "@/types/database";

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

export async function saveServiceAction(service: Partial<Service>) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { error: "Erro de Configuração: SERVICE_ROLE_KEY ausente." };
    }

    const payload = {
        name: service.name,
        description: service.description,
        price: service.price,
        duration_minutes: service.duration_minutes,
        category: service.category,
        is_active: service.is_active ?? true
    };

    if (service.id) {
        // Update
        const { error } = await supabaseAdmin
            .from("services")
            .update(payload)
            .eq("id", service.id);

        if (error) return { error: error.message };
    } else {
        // Create
        const { error } = await supabaseAdmin
            .from("services")
            .insert([payload]);

        if (error) return { error: error.message };
    }

    return { success: true };
}

export async function deleteServiceAction(id: string) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { error: "Config Error" };

    const { error } = await supabaseAdmin.from("services").delete().eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
}
