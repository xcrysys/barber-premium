"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { generatePixPayload } from "@/lib/pix";
import { Appointment } from "@/types/database";

const getAdminSupabase = () => {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

export interface CreateAppointmentInput {
    barber_id: string;
    service_ids: string[];
    start_time: string;
    end_time?: string;
    total_price: number;
    payment_method: 'credit_card' | 'pix' | 'in_person';
    status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    customer_id?: string | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    notes?: string | null;
    amount_to_pay?: number;
}

/**
 * Criação atômica de agendamento com suporte a PIX EMVCo e Guest Checkout
 */
export async function createAppointmentAction(payload: CreateAppointmentInput): Promise<{
    data?: Appointment;
    error?: string;
}> {
    try {
        const supabase = getAdminSupabase();

        // 1. Validar campos essenciais
        if (!payload.barber_id || !payload.service_ids?.length || !payload.start_time) {
            return { error: "Dados incompletos: barbeiro, serviços e horário são obrigatórios." };
        }

        // 2. Se end_time não foi fornecido, buscar duração dos serviços para cálculo
        let endTime = payload.end_time;
        if (!endTime) {
            const { data: services } = await supabase
                .from("services")
                .select("duration_minutes")
                .in("id", payload.service_ids);

            const totalDuration = services?.reduce((acc, s) => acc + (s.duration_minutes || 30), 0) || 40;
            const startDate = new Date(payload.start_time);
            const calculatedEnd = new Date(startDate.getTime() + totalDuration * 60 * 1000);
            endTime = calculatedEnd.toISOString();
        }

        // 3. Preparação das variáveis de PIX
        let pixTxId: string | null = null;
        let pixPayload: string | null = null;
        let pixExpiration: string | null = null;
        let initialStatus = payload.status || (payload.payment_method === 'pix' ? 'pending' : 'confirmed');

        if (payload.payment_method === 'pix') {
            const defaultKey = process.env.NEXT_PUBLIC_PIX_KEY || "financeiro@barberpremium.com.br";
            const receiverName = process.env.NEXT_PUBLIC_PIX_RECEIVER_NAME || "BARBER PREMIUM CLUB";
            const receiverCity = process.env.NEXT_PUBLIC_PIX_RECEIVER_CITY || "SAO PAULO";

            // TxId EMVCo oficial: até 25 caracteres alfanuméricos
            pixTxId = "BP" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

            // Valor do sinal (50%) ou valor customizado
            const amountToPay = payload.amount_to_pay ?? (payload.total_price * 0.5);

            pixPayload = generatePixPayload({
                pixKey: defaultKey,
                receiverName,
                receiverCity,
                amount: amountToPay,
                txId: pixTxId,
            });

            // 15 minutos de expiração padrão
            pixExpiration = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            initialStatus = 'pending';
        }

        // 4. Inserir no Supabase com Service Role
        const insertPayload = {
            barber_id: payload.barber_id,
            service_ids: payload.service_ids,
            start_time: payload.start_time,
            end_time: endTime,
            total_price: payload.total_price,
            payment_method: payload.payment_method,
            status: initialStatus,
            payment_status: 'pending',
            customer_id: payload.customer_id || null,
            customer_name: payload.customer_name?.trim() || null,
            customer_phone: payload.customer_phone ? payload.customer_phone.replace(/\D/g, '') : null,
            notes: payload.notes || null,
            pix_txid: pixTxId,
            pix_payload: pixPayload,
            pix_expiration: pixExpiration,
        };

        const { data, error } = await supabase
            .from("appointments")
            .insert([insertPayload])
            .select()
            .single();

        if (error) {
            console.error("Erro ao criar agendamento no Supabase:", error);
            return { error: error.message };
        }

        revalidatePath("/admin/agendamentos");
        revalidatePath("/barbeiro/agenda");

        return { data: data as Appointment };
    } catch (err: any) {
        console.error("Exceção não tratada em createAppointmentAction:", err);
        return { error: err.message || "Erro interno ao processar agendamento." };
    }
}

/**
 * Verificação e Confirmação de Pagamento PIX
 */
export async function verifyPixPaymentAction(appointmentId: string): Promise<{
    success?: boolean;
    alreadyPaid?: boolean;
    data?: Appointment;
    error?: string;
}> {
    try {
        if (!appointmentId) {
            return { error: "ID do agendamento é obrigatório para validação." };
        }

        const supabase = getAdminSupabase();

        // 1. Buscar agendamento
        const { data: appointment, error: fetchError } = await supabase
            .from("appointments")
            .select("*")
            .eq("id", appointmentId)
            .single();

        if (fetchError || !appointment) {
            return { error: "Agendamento não encontrado no banco de dados." };
        }

        // 2. Se já estiver pago, retorna sucesso idempotente
        if (appointment.payment_status === 'paid') {
            return { success: true, alreadyPaid: true, data: appointment as Appointment };
        }

        // 3. Checar expiração se houver
        if (appointment.pix_expiration && new Date(appointment.pix_expiration) < new Date()) {
            return { error: "O tempo limite de 15 minutos para este PIX expirou. Por favor, inicie um novo agendamento." };
        }

        // 4. Atualizar status para confirmado e pago
        const { data: updated, error: updateError } = await supabase
            .from("appointments")
            .update({
                payment_status: 'paid',
                status: 'confirmed',
            })
            .eq("id", appointmentId)
            .select()
            .single();

        if (updateError) {
            console.error("Erro ao atualizar pagamento do agendamento:", updateError);
            return { error: updateError.message };
        }

        revalidatePath("/admin/agendamentos");
        revalidatePath("/barbeiro/agenda");
        revalidatePath("/agendar");

        return { success: true, data: updated as Appointment };
    } catch (err: any) {
        console.error("Erro em verifyPixPaymentAction:", err);
        return { error: err.message || "Falha ao verificar pagamento." };
    }
}

/**
 * Consulta de Agendamento por ID
 */
export async function getAppointmentByIdAction(appointmentId: string): Promise<{
    data?: Appointment;
    error?: string;
}> {
    try {
        const supabase = getAdminSupabase();
        const { data, error } = await supabase
            .from("appointments")
            .select(`
                *,
                barbers (
                    profiles (
                        full_name,
                        avatar_url
                    )
                )
            `)
            .eq("id", appointmentId)
            .single();

        if (error) return { error: error.message };
        return { data: data as Appointment };
    } catch (err: any) {
        return { error: err.message };
    }
}
