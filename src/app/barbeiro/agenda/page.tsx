
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppointmentsTable } from "@/components/AppointmentsTable";

export default function BarberAgendaPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]); // Default: today
    const [filterName, setFilterName] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [barberId, setBarberId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        initUser();
    }, []);

    useEffect(() => {
        if (barberId !== undefined) fetchAppointments();
    }, [filterDate, barberId]);

    const initUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile?.role === "admin") {
            setIsAdmin(true);
            setBarberId(null); // Admin sees all
        } else {
            setBarberId(user.id); // Barber sees only their own
        }
    };

    const fetchAppointments = async () => {
        setLoading(true);
        const supabase = createClient();

        let query = supabase
            .from("appointments")
            .select(`*, barbers(profiles(full_name))`)
            .order("start_time", { ascending: true });

        // Filter by barber if not admin
        if (barberId) {
            query = query.eq("barber_id", barberId);
        }

        if (filterDate) {
            query = query
                .gte("start_time", `${filterDate}T00:00:00`)
                .lte("start_time", `${filterDate}T23:59:59`);
        } else {
            query = query.limit(50);
        }

        const { data, error } = await query;
        if (error) console.error(error);

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

    return (
        <div className="space-y-8 pb-12">
            <header className="border-b border-white/5 pb-6">
                <h1 className="text-3xl font-serif font-bold text-white">Minha Agenda</h1>
                <p className="text-neutral-500 mt-1">
                    {isAdmin ? "Visão Admin — todos os barbeiros" : "Apenas seus agendamentos"}
                </p>
            </header>

            <AppointmentsTable
                appointments={appointments}
                loading={loading}
                onRefresh={fetchAppointments}
                showBarberColumn={isAdmin}  // Admin sees barber name, barber doesn't need it
                canDelete={isAdmin}          // Only admin can delete
                filterDate={filterDate}
                setFilterDate={setFilterDate}
                filterName={filterName}
                setFilterName={setFilterName}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
            />
        </div>
    );
}
