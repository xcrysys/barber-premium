
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppointmentsTable } from "@/components/AppointmentsTable";

export default function AdminAppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState("");
    const [filterName, setFilterName] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    useEffect(() => { fetchAppointments(); }, [filterDate]);

    const fetchAppointments = async () => {
        setLoading(true);
        const supabase = createClient();

        let query = supabase
            .from("appointments")
            .select(`*, barbers(profiles(full_name))`)
            .order("start_time", { ascending: false });

        if (filterDate) {
            query = query
                .gte("start_time", `${filterDate}T00:00:00`)
                .lte("start_time", `${filterDate}T23:59:59`);
        } else {
            query = query.limit(100);
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
            <header className="flex justify-between items-center border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white">Agendamentos</h1>
                    <p className="text-neutral-500 mt-1">Gerencie todos os agendamentos</p>
                </div>
            </header>

            <AppointmentsTable
                appointments={appointments}
                loading={loading}
                onRefresh={fetchAppointments}
                showBarberColumn={true}
                canDelete={true}
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
