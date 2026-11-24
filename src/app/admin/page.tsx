
"use client";

import { useEffect, useState } from "react";
import {
    CalendarIcon, TrendingUp, Users, DollarSign, Clock,
    ChevronLeft, ChevronRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
    todayRevenue: number;
    todayCount: number;
    weekCount: number;
}

interface AdminAppointment {
    id: string;
    start_time: string;
    total_price: number;
    status: string;
    profiles: { full_name: string | null } | null; // Customer (might be null if guest checkout not fully implemented)
    barbers: {
        id: string;
        profiles: { full_name: string } | null
    } | null;
    services: { name: string }[] | null; // This requires a many-to-many lookup, doing simple for now
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({ todayRevenue: 0, todayCount: 0, weekCount: 0 });
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        const supabase = createClient();
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Fetch Today's Appointments
        const { data: todayData, error } = await supabase
            .from("appointments")
            .select(`
        *,
        barbers (
          profiles (full_name)
        )
      `)
            .gte('start_time', `${todayStr}T00:00:00`)
            .lte('start_time', `${todayStr}T23:59:59`)
            .order('start_time', { ascending: true });

        if (error) console.error("Error fetching dashboard:", error);

        const todayApts = todayData || [];

        // Calculate Stats
        const revenue = todayApts.reduce((acc, curr) => acc + (curr.total_price || 0), 0);

        setStats({
            todayRevenue: revenue,
            todayCount: todayApts.length,
            weekCount: 0 // TODO: Implement week range query
        });

        setAppointments(todayApts);
        setLoading(false);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <header className="flex justify-between items-center border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white tracking-wide">Dashboard</h1>
                    <p className="text-neutral-500 mt-1">Visão geral do dia</p>
                </div>
                <button
                    onClick={fetchDashboardData}
                    className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-white/5"
                >
                    Atualizar
                </button>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-6 flex items-start justify-between">
                    <div>
                        <p className="text-neutral-500 text-sm uppercase tracking-wider mb-2">Faturamento Hoje</p>
                        <h3 className="text-3xl font-bold text-white">{formatCurrency(stats.todayRevenue)}</h3>
                    </div>
                    <div className="bg-neutral-800/50 p-3 rounded-lg text-amber-500">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-6 flex items-start justify-between">
                    <div>
                        <p className="text-neutral-500 text-sm uppercase tracking-wider mb-2">Agendamentos Hoje</p>
                        <h3 className="text-3xl font-bold text-white">{stats.todayCount}</h3>
                    </div>
                    <div className="bg-neutral-800/50 p-3 rounded-lg text-amber-500">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-6 flex items-start justify-between opacity-50">
                    <div>
                        <p className="text-neutral-500 text-sm uppercase tracking-wider mb-2">Novos Clientes</p>
                        <h3 className="text-3xl font-bold text-white">-</h3>
                        <span className="text-xs text-neutral-600">Em breve</span>
                    </div>
                    <div className="bg-neutral-800/50 p-3 rounded-lg text-amber-500">
                        <Users className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Main Content: Today's Schedule */}
            <section className="bg-neutral-900/30 border border-white/5 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-medium text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" />
                        Agenda de Hoje ({format(new Date(), "dd 'de' MMMM", { locale: ptBR })})
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-950/50 text-neutral-500 text-xs uppercase tracking-wider border-b border-white/5">
                                <th className="px-6 py-4 font-medium">Horário</th>
                                <th className="px-6 py-4 font-medium">Barbeiro</th>
                                <th className="px-6 py-4 font-medium">Valor</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={4} className="p-6 text-center text-neutral-500">Carregando...</td></tr>
                            ) : appointments.length === 0 ? (
                                <tr><td colSpan={4} className="p-6 text-center text-neutral-500">Nenhum agendamento para hoje.</td></tr>
                            ) : (
                                appointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-amber-500 font-bold">
                                            {format(new Date(apt.start_time), 'HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 text-white">
                                            {(apt.barbers as any)?.profiles?.full_name || 'Desconhecido'}
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">
                                            {formatCurrency(apt.total_price)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                        ${apt.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                    apt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                        'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                {apt.status === 'confirmed' ? 'Confirmado' : apt.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
