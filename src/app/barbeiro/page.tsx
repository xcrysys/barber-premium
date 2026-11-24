"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Calendar, Clock, DollarSign, CheckCircle, Banknote,
    QrCode, MessageSquare, RefreshCw, Scissors, ChevronRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { updateAppointmentStatus, updatePaymentStatus } from "@/app/admin/actions";
import Link from "next/link";

export default function BarberDashboard() {
    const [stats, setStats] = useState({ todayCount: 0, todayRevenue: 0, completedToday: 0, paidToday: 0 });
    const [todayApts, setTodayApts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // Check if user is in barbers table or is admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        const todayStr = new Date().toISOString().split("T")[0];

        let query = supabase
            .from("appointments")
            .select(`*, barbers(profiles(full_name))`)
            .gte("start_time", `${todayStr}T00:00:00`)
            .lte("start_time", `${todayStr}T23:59:59`)
            .order("start_time", { ascending: true });

        // If not admin, filter by barber's own ID
        if (profile?.role !== "admin") {
            query = query.eq("barber_id", user.id);
        }

        const { data, error } = await query;
        if (error) console.error("Erro ao carregar fila do barbeiro:", error);

        const apts = data || [];

        // Get services names
        if (apts.length > 0) {
            const { data: allServices } = await supabase.from("services").select("id, name");
            const serviceMap = new Map(allServices?.map(s => [s.id, s.name]) ?? []);
            const mapped = apts.map(apt => ({
                ...apt,
                serviceNames: (apt.service_ids as string[])?.map(sid => serviceMap.get(sid) || "Serviço").join(", ") ?? "—"
            }));
            setTodayApts(mapped);

            setStats({
                todayCount: apts.length,
                todayRevenue: apts.reduce((acc, a) => acc + (a.total_price || 0), 0),
                completedToday: apts.filter(a => a.status === 'completed').length,
                paidToday: apts.filter(a => a.payment_status === 'paid').length,
            });
        } else {
            setTodayApts([]);
            setStats({ todayCount: 0, todayRevenue: 0, completedToday: 0, paidToday: 0 });
        }

        setLoading(false);
    };

    const handleCompleteCut = async (aptId: string) => {
        setUpdatingId(aptId + "-complete");
        const res = await updateAppointmentStatus(aptId, "completed");
        if (res.error) {
            alert("Erro ao concluir: " + res.error);
        } else {
            setTodayApts(prev => prev.map(a => a.id === aptId ? { ...a, status: "completed" } : a));
            setStats(prev => ({ ...prev, completedToday: prev.completedToday + 1 }));
        }
        setUpdatingId(null);
    };

    const handleTogglePayment = async (aptId: string, currentStatus: string) => {
        const nextStatus = currentStatus === "paid" ? "pending" : "paid";
        setUpdatingId(aptId + "-pay");
        const res = await updatePaymentStatus(aptId, nextStatus);
        if (res.error) {
            alert("Erro ao atualizar pagamento: " + res.error);
        } else {
            setTodayApts(prev => prev.map(a => a.id === aptId ? { ...a, payment_status: nextStatus } : a));
            setStats(prev => ({
                ...prev,
                paidToday: nextStatus === "paid" ? prev.paidToday + 1 : Math.max(0, prev.paidToday - 1)
            }));
        }
        setUpdatingId(null);
    };

    return (
        <div className="space-y-8 pb-12">
            <header className="border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white">Painel do Barbeiro</h1>
                    <p className="text-neutral-500 mt-1 capitalize">
                        {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors bg-neutral-900 border border-white/10 px-3 py-2 rounded-lg cursor-pointer"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Atualizar Fila
                    </button>
                    <Link
                        href="/barbeiro/agenda"
                        className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg transition-colors"
                    >
                        Ver Agenda Completa <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { icon: Calendar, label: "Agendamentos Hoje", value: stats.todayCount.toString(), color: "text-blue-400" },
                    { icon: CheckCircle, label: "Cortes Concluídos", value: stats.completedToday.toString(), color: "text-green-400" },
                    { icon: Banknote, label: "Pagamentos Confirmados", value: stats.paidToday.toString(), color: "text-emerald-400" },
                    { icon: DollarSign, label: "Faturamento Estimado", value: formatCurrency(stats.todayRevenue), color: "text-amber-500" },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="bg-neutral-900 border border-white/5 rounded-xl p-5">
                        <Icon className={`w-5 h-5 ${color} mb-3`} />
                        <p className="text-neutral-500 text-xs uppercase tracking-wide">{label}</p>
                        <p className={`text-2xl font-bold font-serif mt-1 ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Fila do Dia com Ações Rápidas em Tempo Real */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-medium text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" />
                        Fila de Atendimento de Hoje
                    </h2>
                    <span className="text-xs text-neutral-500">
                        {todayApts.length} cliente{todayApts.length !== 1 ? 's' : ''} na fila
                    </span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : todayApts.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl text-neutral-500 space-y-2">
                        <Scissors className="w-8 h-8 text-neutral-600 mx-auto" />
                        <p>Nenhum corte agendado para o seu turno de hoje.</p>
                        <p className="text-xs text-neutral-600">Novos agendamentos via PIX ou recepção aparecerão aqui em tempo real.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todayApts.map(apt => {
                            const isCompleted = apt.status === 'completed';
                            const isPaid = apt.payment_status === 'paid';
                            const isPix = apt.payment_method === 'pix';
                            const cleanPhone = apt.customer_phone ? apt.customer_phone.replace(/\D/g, '') : '';
                            const isBusy = updatingId?.startsWith(apt.id);

                            return (
                                <div
                                    key={apt.id}
                                    className={`bg-neutral-900 border rounded-2xl p-4 sm:p-5 transition-all ${
                                        isCompleted ? 'border-green-500/20 bg-neutral-900/50 opacity-75' : 'border-white/5 hover:border-white/10'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        {/* Left: Time and client info */}
                                        <div className="flex items-start gap-4">
                                            <div className="text-center w-14 shrink-0 pt-0.5">
                                                <p className="text-amber-500 font-mono font-bold text-xl leading-none">
                                                    {format(new Date(apt.start_time), "HH:mm")}
                                                </p>
                                                <span className="text-[11px] text-neutral-500 mt-1 block">Início</span>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-white font-semibold text-base">{apt.customer_name || "Cliente Convidado"}</h3>
                                                    {cleanPhone && (
                                                        <a
                                                            href={`https://wa.me/55${cleanPhone}?text=Ol%C3%A1%20${encodeURIComponent(apt.customer_name || '')},%20sou%20seu%20barbeiro%20na%20Barber%20Premium!`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-emerald-400 hover:text-emerald-300 p-1 hover:bg-emerald-500/10 rounded transition-colors"
                                                            title="Chamar no WhatsApp"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>

                                                <p className="text-neutral-400 text-sm mt-0.5">{apt.serviceNames}</p>

                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    {/* Badge de pagamento */}
                                                    {isPix ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                            <QrCode className="w-3 h-3" /> PIX
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                            <Banknote className="w-3 h-3" /> No Local
                                                        </span>
                                                    )}

                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                                                        isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                    }`}>
                                                        {isPaid ? "Pago ✓" : "Pagamento Pendente"}
                                                    </span>

                                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                                                        isCompleted ? 'text-green-400 bg-green-500/10' : 'text-blue-400 bg-blue-500/10'
                                                    }`}>
                                                        {isCompleted ? "✓ Concluído" : "Aguardando Cadeira"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Price & Quick Action Buttons */}
                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                                            <div className="sm:text-right">
                                                <p className="text-amber-500 font-bold font-serif text-lg leading-none">
                                                    {formatCurrency(apt.total_price)}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Marcar Pago Button */}
                                                <button
                                                    onClick={() => handleTogglePayment(apt.id, apt.payment_status)}
                                                    disabled={!!isBusy}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                                        isPaid
                                                            ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border border-white/10"
                                                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25"
                                                    }`}
                                                >
                                                    <Banknote className="w-3.5 h-3.5" />
                                                    {isPaid ? "Desfazer Pago" : "Marcar Pago"}
                                                </button>

                                                {/* Concluir Corte Button */}
                                                {!isCompleted && (
                                                    <button
                                                        onClick={() => handleCompleteCut(apt.id)}
                                                        disabled={!!isBusy}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Concluir Corte
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
