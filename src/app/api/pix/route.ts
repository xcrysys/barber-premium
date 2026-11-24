import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { verifyPixPaymentAction } from "@/app/agendar/actions";

const getAdminSupabase = () => {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

/**
 * GET /api/pix?appointmentId=uuid
 * Permite que o frontend faça polling de status ou que o modal verifique em tempo real.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const appointmentId = searchParams.get("appointmentId");

        if (!appointmentId) {
            return NextResponse.json(
                { success: false, error: "Parâmetro appointmentId é obrigatório." },
                { status: 400 }
            );
        }

        const supabase = getAdminSupabase();
        const { data: appointment, error } = await supabase
            .from("appointments")
            .select("id, status, payment_status, payment_method, pix_expiration, total_price")
            .eq("id", appointmentId)
            .single();

        if (error || !appointment) {
            return NextResponse.json(
                { success: false, error: "Agendamento não encontrado." },
                { status: 404 }
            );
        }

        const now = new Date();
        const isExpired = appointment.pix_expiration
            ? new Date(appointment.pix_expiration) < now
            : false;

        return NextResponse.json({
            success: true,
            appointmentId: appointment.id,
            status: appointment.status,
            paymentStatus: appointment.payment_status,
            paymentMethod: appointment.payment_method,
            isPaid: appointment.payment_status === "paid",
            isExpired,
            expiration: appointment.pix_expiration,
        });
    } catch (err: any) {
        console.error("Erro em GET /api/pix:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Erro interno do servidor." },
            { status: 500 }
        );
    }
}

/**
 * POST /api/pix
 * Endpoint para confirmação manual ou recebimento de webhooks de gateways de pagamento.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { appointmentId, action = "verify" } = body;

        if (!appointmentId) {
            return NextResponse.json(
                { success: false, error: "Campo appointmentId é obrigatório no corpo da requisição." },
                { status: 400 }
            );
        }

        if (action === "verify" || action === "confirm") {
            const result = await verifyPixPaymentAction(appointmentId);

            if (result.error) {
                return NextResponse.json(
                    { success: false, error: result.error },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                message: "Pagamento verificado e confirmado com sucesso.",
                data: result.data,
            });
        }

        return NextResponse.json(
            { success: false, error: `Ação desconhecida: ${action}` },
            { status: 400 }
        );
    } catch (err: any) {
        console.error("Erro em POST /api/pix:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Erro ao processar requisição." },
            { status: 500 }
        );
    }
}
