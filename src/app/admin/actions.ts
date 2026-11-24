"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const adminClient = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

export async function updateAppointmentStatus(id: string, status: string) {
    const { error } = await adminClient()
        .from("appointments")
        .update({ status })
        .eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/admin/agendamentos");
    revalidatePath("/barbeiro");
    revalidatePath("/barbeiro/agenda");
    return { success: true };
}

export async function updatePaymentStatus(id: string, payment_status: string) {
    const { error } = await adminClient()
        .from("appointments")
        .update({ payment_status })
        .eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/admin/agendamentos");
    revalidatePath("/barbeiro");
    revalidatePath("/barbeiro/agenda");
    return { success: true };
}

export async function deleteAppointmentAdmin(id: string) {
    const { error } = await adminClient()
        .from("appointments")
        .delete()
        .eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/admin/agendamentos");
    revalidatePath("/barbeiro");
    revalidatePath("/barbeiro/agenda");
    return { success: true };
}

/**
 * Permite ao dono do sistema ativar seu perfil como Administrador
 * com 1 clique caso ainda não exista outro admin ativo no banco.
 */
export async function claimFirstAdminAction(userId: string) {
    const supabase = adminClient();

    // Checa se já existe algum admin
    const { data: existingAdmins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .limit(1);

    if (existingAdmins && existingAdmins.length > 0) {
        return { error: "Já existe um administrador registrado no sistema." };
    }

    const { error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId);

    if (error) return { error: error.message };

    revalidatePath("/admin");
    return { success: true };
}
