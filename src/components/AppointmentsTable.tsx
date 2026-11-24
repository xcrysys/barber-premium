"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    CheckCircle, XCircle, Banknote, Calendar,
    Search, Trash2, RefreshCw, Filter, QrCode, MessageSquare, Clock
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
    updateAppointmentStatus,
    updatePaymentStatus,
    deleteAppointmentAdmin
} from "@/app/admin/actions";

// ── Types ──────────────────────────────────────────────────────────
type Apt = {
    id: string;
    start_time: string;
    customer_name: string | null;
    customer_phone: string | null;
    total_price: number;
    status: string;
    payment_status: string;
    payment_method: string;
    service_ids: string[];
    barbers?: { profiles?: { full_name?: string } } | null;
    serviceNames?: string;
    pix_txid?: string | null;
};

// ── Status Configs ─────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; classes: string }> = {
    pending: { label: "Pendente", classes: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    confirmed: { label: "Confirmado", classes: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    completed: { label: "Concluído", classes: "bg-green-500/10 text-green-400 border-green-500/20" },
    cancelled: { label: "Cancelado", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
    no_show: { label: "No-Show", classes: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20" },
};

const PAY_MAP: Record<string, { label: string; classes: string }> = {
    pending: { label: "Aguardando", classes: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    paid: { label: "Pago ✓", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    refunded: { label: "Reembolsado", classes: "bg-neutral-500/10 text-neutral-400" },
};

// ── Props ──────────────────────────────────────────────────────────
interface AppointmentsTableProps {
    appointments: Apt[];
    loading: boolean;
    onRefresh: () => void;
    showBarberColumn?: boolean;      // Show barber name column (admin) or hide (barber view)
    canDelete?: boolean;             // Only admin can delete
    filterDate: string;
    setFilterDate: (v: string) => void;
    filterName: string;
    setFilterName: (v: string) => void;
    filterStatus: string;
    setFilterStatus: (v: string) => void;
}

export function AppointmentsTable({
    appointments, loading, onRefresh,
    showBarberColumn = true, canDelete = false,
    filterDate, setFilterDate, filterName, setFilterName,
    filterStatus, setFilterStatus,
}: AppointmentsTableProps) {
    const [updating, setUpdating] = useState<string | null>(null);

    // Optimistically update local state
    const [localApts, setLocalApts] = useState<Apt[]>(appointments);

    // Keep synced with parent
    useEffect(() => {
        setLocalApts(appointments);
    }, [appointments]);

    const patch = (id: string, fields: Partial<Apt>) =>
        setLocalApts(prev => prev.map(a => a.id === id ? { ...a, ...fields } : a));

    const handleStatus = async (id: string, status: string) => {
        setUpdating(id + status);
        const result = await updateAppointmentStatus(id, status);
        if (result.error) alert("Erro: " + result.error);
        else patch(id, { status });
        setUpdating(null);
    };

    const handlePayment = async (id: string, payment_status: string) => {
        setUpdating(id + payment_status);
        const result = await updatePaymentStatus(id, payment_status);
        if (result.error) alert("Erro: " + result.error);
        else patch(id, { payment_status });
        setUpdating(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Excluir este agendamento permanentemente?")) return;
        setUpdating(id + "delete");
        const result = await deleteAppointmentAdmin(id);
        if (result.error) alert("Erro: " + result.error);
        else setLocalApts(prev => prev.filter(a => a.id !== id));
        setUpdating(null);
    };

    // Filter locally
    const filtered = localApts.filter(apt => {
        const nameMatch = (apt.customer_name || "").toLowerCase().includes(filterName.toLowerCase()) ||
            (apt.barbers?.profiles?.full_name || "").toLowerCase().includes(filterName.toLowerCase());
        const statusMatch = !filterStatus || apt.status === filterStatus;
        return nameMatch && statusMatch;
    });

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 bg-neutral-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente ou barbeiro..."
                        value={filterName}
                        onChange={e => setFilterName(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2.5 text-white focus:border-amber-500 outline-none text-sm"
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <input
                        type="date"
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2.5 text-white focus:border-amber-500 outline-none text-sm w-full sm:w-auto"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2.5 text-white focus:border-amber-500 outline-none text-sm appearance-none w-full sm:w-auto cursor-pointer"
                    >
                        <option value="">Todos os Status</option>
                        {Object.entries(STATUS_MAP).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onRefresh}
                        className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors bg-neutral-900 border border-white/10 px-3 py-2.5 rounded-lg cursor-pointer"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Atualizar
                    </button>
                    <button
                        onClick={() => { setFilterDate(""); setFilterName(""); setFilterStatus(""); }}
                        className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors px-2 py-2.5 cursor-pointer"
                    >
                        Limpar
                    </button>
                </div>
            </div>

            {/* Count */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">{filtered.length} agendamento{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-neutral-500 gap-3">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    Carregando agendamentos...
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                    <Calendar className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                    <p className="text-neutral-500">Nenhum agendamento encontrado.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(apt => {
                        const statusInfo = STATUS_MAP[apt.status] ?? STATUS_MAP.pending;
                        const payInfo = PAY_MAP[apt.payment_status] ?? PAY_MAP.pending;
                        const isBusy = updating?.startsWith(apt.id);

                        const cleanPhone = apt.customer_phone ? apt.customer_phone.replace(/\D/g, '') : '';
                        const isPix = apt.payment_method === 'pix';
                        const isInPerson = apt.payment_method === 'in_person';

                        return (
                            <div
                                key={apt.id}
                                className={`bg-neutral-900 border border-white/5 rounded-2xl p-5 transition-all ${apt.status === 'completed' ? 'opacity-70' : 'hover:border-white/10'}`}
                            >
                                {/* Row 1 — time + badges */}
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className="font-mono text-amber-500 font-bold text-lg">
                                        {format(new Date(apt.start_time), "HH:mm")}
                                    </span>
                                    <span className="text-neutral-500 text-sm">
                                        {format(new Date(apt.start_time), "dd/MM/yyyy", { locale: ptBR })}
                                    </span>

                                    {/* Método de Pagamento Indicador Visual */}
                                    {isPix ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                                            <QrCode className="w-3.5 h-3.5" /> PIX Online
                                        </span>
                                    ) : isInPerson ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25">
                                            <Banknote className="w-3.5 h-3.5" /> Presencial
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-800 text-neutral-300 border border-white/10">
                                            {apt.payment_method || 'A Definir'}
                                        </span>
                                    )}

                                    <div className="ml-auto flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusInfo.classes}`}>
                                            {statusInfo.label}
                                        </span>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${payInfo.classes}`}>
                                            {payInfo.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Row 2 — client + barber + service + price */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wide mb-0.5">Cliente</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-white font-medium text-sm truncate">{apt.customer_name || "Cliente Convidado"}</p>
                                            {cleanPhone && (
                                                <a
                                                    href={`https://wa.me/55${cleanPhone}?text=Ol%C3%A1%20${encodeURIComponent(apt.customer_name || '')},%20falamos%20da%20Barber%20Premium!`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-emerald-400 hover:text-emerald-300 p-1 hover:bg-emerald-500/10 rounded transition-colors"
                                                    title="Conversar no WhatsApp"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                        {apt.customer_phone && (
                                            <p className="text-neutral-500 text-xs mt-0.5">{apt.customer_phone}</p>
                                        )}
                                    </div>

                                    {showBarberColumn && (
                                        <div>
                                            <p className="text-neutral-500 text-xs uppercase tracking-wide mb-0.5">Barbeiro</p>
                                            <p className="text-white text-sm">{apt.barbers?.profiles?.full_name || "—"}</p>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wide mb-0.5">Serviço</p>
                                        <p className="text-white text-sm truncate">{apt.serviceNames || "—"}</p>
                                    </div>

                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wide mb-0.5">Valor Total</p>
                                        <p className="text-amber-500 font-bold font-serif">{formatCurrency(apt.total_price)}</p>
                                        {isPix && (
                                            <p className="text-[11px] text-neutral-500">Sinal: {formatCurrency(apt.total_price * 0.5)}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Row 3 — action buttons */}
                                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
                                    {/* Payment Toggle */}
                                    {apt.payment_status !== 'paid' ? (
                                        <button
                                            onClick={() => handlePayment(apt.id, 'paid')}
                                            disabled={!!isBusy}
                                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            <Banknote className="w-3.5 h-3.5" />
                                            Marcar como Pago
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handlePayment(apt.id, 'pending')}
                                            disabled={!!isBusy}
                                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border border-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            <Banknote className="w-3.5 h-3.5" />
                                            Desfazer Pago
                                        </button>
                                    )}

                                    {/* Status Controls */}
                                    {apt.status !== 'completed' && (
                                        <button
                                            onClick={() => handleStatus(apt.id, 'completed')}
                                            disabled={!!isBusy}
                                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Concluir Corte
                                        </button>
                                    )}

                                    {apt.status !== 'confirmed' && apt.status !== 'completed' && (
                                        <button
                                            onClick={() => handleStatus(apt.id, 'confirmed')}
                                            disabled={!!isBusy}
                                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Confirmar
                                        </button>
                                    )}

                                    {apt.status !== 'pending' && apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                        <button
                                            onClick={() => handleStatus(apt.id, 'pending')}
                                            disabled={!!isBusy}
                                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-white/5 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            <Clock className="w-3.5 h-3.5" />
                                            Pendente
                                        </button>
                                    )}

                                    {apt.status !== 'cancelled' && (
                                        <button
                                            onClick={() => handleStatus(apt.id, 'cancelled')}
                                            disabled={!!isBusy}
                                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            <XCircle className="w-3.5 h-3.5" />
                                            Cancelar
                                        </button>
                                    )}

                                    {/* Delete — admin only */}
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(apt.id)}
                                            disabled={!!isBusy}
                                            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Excluir
                                        </button>
                                    )}

                                    {isBusy && (
                                        <span className="ml-2 text-xs text-neutral-500 animate-pulse">Atualizando...</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
