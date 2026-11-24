
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Calendar, Clock, Scissors, User as UserIcon,
    LogOut, ChevronRight, Phone, Mail, Plus
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";

type Tab = "agendamentos" | "historico" | "perfil";

export default function CustomerDashboard() {
    const [tab, setTab] = useState<Tab>("agendamentos");
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            setLoading(false);
            return;
        }

        setUser(user);

        const { data, error } = await supabase
            .from("appointments")
            .select(`*, barbers ( id, profiles (full_name) )`)
            .eq("customer_id", user.id)
            .order("start_time", { ascending: false });

        if (error) console.error("Appointments error:", error.message);

        if (data && data.length > 0) {
            const { data: allServices } = await supabase.from("services").select("id, name");
            const serviceMap = new Map(allServices?.map(s => [s.id, s.name]) ?? []);
            setAppointments(data.map(apt => ({
                ...apt,
                serviceNames: (apt.service_ids as string[])?.map(sid => serviceMap.get(sid) || "Serviço").join(", ") ?? "—"
            })));
        } else {
            setAppointments([]);
        }

        setLoading(false);
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
    };

    // Auth gate
    if (!loading && !user) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <Scissors className="w-10 h-10 text-amber-500 mb-6" />
                <h1 className="text-2xl font-serif font-bold mb-3">Área Restrita</h1>
                <p className="text-neutral-500 mb-8 text-center max-w-sm">
                    Faça login para visualizar seus agendamentos e gerenciar seu perfil.
                </p>
                <Link href="/login?next=/minha-conta" className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-xl font-bold transition-colors">
                    Entrar / Criar Conta
                </Link>
            </div>
        );
    }

    const now = new Date();
    const futureAppointments = appointments.filter(a => new Date(a.start_time) >= now);
    const pastAppointments = appointments.filter(a => new Date(a.start_time) < now);

    const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
        { id: "agendamentos", label: "Próximos", icon: Calendar, count: futureAppointments.length },
        { id: "historico", label: "Histórico", icon: Clock, count: pastAppointments.length },
        { id: "perfil", label: "Perfil", icon: UserIcon },
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-20 max-w-4xl mx-auto px-4 pb-16">
                {/* Header */}
                <div className="py-8 flex items-center justify-between">
                    <div>
                        <p className="text-neutral-500 text-sm mb-1">Bem-vindo de volta</p>
                        <h1 className="text-2xl font-serif font-bold text-white">
                            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Cliente"}
                        </h1>
                    </div>
                    <Link
                        href="/agendar"
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Agendamento
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-neutral-950 border border-white/5 p-1 rounded-xl mb-8">
                    {tabs.map(({ id, label, icon: Icon, count }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${tab === id
                                ? "bg-neutral-800 text-white shadow"
                                : "text-neutral-500 hover:text-neutral-300"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{label}</span>
                            {count !== undefined && count > 0 && (
                                <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${tab === id ? 'bg-amber-500 text-black' : 'bg-neutral-700 text-neutral-400'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Tab Content */}
                {!loading && tab === "agendamentos" && (
                    <AppointmentsSection appointments={futureAppointments} isFuture={true} />
                )}
                {!loading && tab === "historico" && (
                    <AppointmentsSection appointments={pastAppointments} isFuture={false} />
                )}
                {!loading && tab === "perfil" && user && (
                    <ProfileSection user={user} onLogout={handleLogout} />
                )}
            </div>
        </div>
    );
}

/* ── COMPONENTS ─────────────────────────────────── */

function AppointmentsSection({ appointments, isFuture }: { appointments: any[], isFuture: boolean }) {
    if (appointments.length === 0) {
        return (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                <Calendar className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-500 mb-2">{isFuture ? "Nenhum agendamento futuro." : "Nenhum histórico ainda."}</p>
                {isFuture && (
                    <Link href="/agendar" className="text-amber-500 hover:text-amber-400 font-medium text-sm transition-colors inline-flex items-center gap-1 mt-2">
                        Agendar agora <ChevronRight className="w-3 h-3" />
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {appointments.map(apt => (
                <AppointmentCard key={apt.id} appointment={apt} isFuture={isFuture} />
            ))}
        </div>
    );
}

function AppointmentCard({ appointment, isFuture }: { appointment: any, isFuture: boolean }) {
    const statusMap: Record<string, { label: string; classes: string }> = {
        confirmed: { label: "Confirmado", classes: "bg-green-500/10 text-green-400 border-green-500/20" },
        pending: { label: "Pendente", classes: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
        cancelled: { label: "Cancelado", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
    };
    const status = statusMap[appointment.status] ?? statusMap.pending;

    return (
        <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between transition-all ${isFuture ? 'bg-neutral-900 border-amber-500/15 hover:border-amber-500/30' : 'bg-neutral-950 border-white/5 opacity-70'}`}>
            <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                    <span className="font-mono text-amber-500 font-bold text-base">
                        {format(new Date(appointment.start_time), "dd/MM", { locale: ptBR })}
                    </span>
                    <span className="text-neutral-700">·</span>
                    <span className="font-mono text-white font-medium">
                        {format(new Date(appointment.start_time), "HH:mm")}
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${status.classes}`}>
                        {status.label}
                    </span>
                </div>
                <h3 className="text-white font-semibold">{appointment.serviceNames}</h3>
                <p className="text-neutral-500 text-sm flex items-center gap-1.5">
                    <Scissors className="w-3 h-3" />
                    {appointment.barbers?.profiles?.full_name || "Barbeiro"}
                </p>
            </div>

            <div className="text-right shrink-0">
                <p className="text-amber-500 font-bold font-serif text-xl">
                    {formatCurrency(appointment.total_price)}
                </p>
                <p className="text-neutral-600 text-xs mt-0.5 capitalize">
                    {appointment.payment_method === 'in_person' ? 'Pagar no local' : appointment.payment_method}
                </p>
            </div>
        </div>
    );
}

function ProfileSection({ user, onLogout }: { user: any, onLogout: () => void }) {
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [phoneError, setPhoneError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single();
            if (data?.full_name) setFullName(data.full_name);
            if (data?.phone) setPhone(formatPhone(data.phone));
        };
        fetchProfile();
    }, [user.id]);

    const formatPhone = (value: string): string => {
        const d = value.replace(/\D/g, '').slice(0, 11);
        if (d.length <= 2) return d;
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(formatPhone(e.target.value));
        setPhoneError("");
    };

    const isValidPhone = (v: string) => {
        const d = v.replace(/\D/g, '');
        return d.length >= 10 && d.length <= 11;
    };

    const handleSave = async () => {
        if (!fullName.trim()) { setMsg({ type: 'error', text: 'Nome é obrigatório.' }); return; }
        if (phone && !isValidPhone(phone)) { setPhoneError("WhatsApp inválido. Ex: (27) 99999-8888"); return; }

        setLoading(true);
        setMsg(null);
        const supabase = createClient();
        const rawPhone = phone.replace(/\D/g, '');

        const { error } = await supabase.from('profiles').update({ full_name: fullName.trim(), phone: rawPhone }).eq('id', user.id);
        await supabase.auth.updateUser({ data: { full_name: fullName.trim(), phone: rawPhone } });

        setMsg(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Dados salvos com sucesso! ✓' });
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* User Info Card */}
            <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-xl font-serif">
                        {(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">{user.user_metadata?.full_name || "Cliente"}</h3>
                        <p className="text-neutral-500 text-sm flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3.5 h-3.5" /> {user.email}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-neutral-500 uppercase font-bold tracking-wide block mb-1.5">Nome Completo *</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            className="w-full bg-black border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-white outline-none transition-colors"
                            placeholder="Seu nome completo"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-neutral-500 uppercase font-bold tracking-wide block mb-1.5">
                            <Phone className="w-3.5 h-3.5 inline mr-1" />WhatsApp
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={handlePhoneChange}
                            maxLength={16}
                            className={`w-full bg-black border rounded-lg p-3 text-white outline-none transition-colors ${phoneError ? 'border-red-500' : 'border-neutral-800 focus:border-amber-500'}`}
                            placeholder="(XX) 9XXXX-XXXX"
                        />
                        {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold px-6 py-2.5 rounded-lg transition-colors"
                        >
                            {loading ? "Salvando..." : "Salvar Dados"}
                        </button>
                        {msg && (
                            <span className={`text-sm font-medium ${msg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {msg.text}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Logout */}
            <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 bg-neutral-950 hover:bg-red-950/30 border border-white/5 hover:border-red-500/20 text-neutral-500 hover:text-red-400 py-3 rounded-xl transition-all text-sm font-medium"
            >
                <LogOut className="w-4 h-4" />
                Sair da conta
            </button>
        </div>
    );
}
