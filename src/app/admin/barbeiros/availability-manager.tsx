
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Loader2, Clock } from "lucide-react";

interface Availability {
    id?: string;
    barber_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    break_start?: string;
    break_end?: string;
}

interface Props {
    barberId: string;
}

const DAYS_MAP = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function AvailabilityManager({ barberId }: Props) {
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAvailability();
    }, [barberId]);

    const fetchAvailability = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("availability")
            .select("*")
            .eq("barber_id", barberId)
            .order("day_of_week");

        if (error) {
            console.error(error);
        } else {
            // Garantir que todos os dias existam no array (0 a 6)
            const fullWeek = [];
            for (let i = 0; i <= 6; i++) {
                const existing = data?.find(a => a.day_of_week === i);
                if (existing) {
                    fullWeek.push(existing);
                } else {
                    // Placeholder para dia sem horário (folga)
                    fullWeek.push({
                        barber_id: barberId,
                        day_of_week: i,
                        start_time: "",
                        end_time: "",
                        break_start: "",
                        break_end: ""
                    } as any);
                }
            }
            setAvailability(fullWeek);
        }
        setLoading(false);
    };

    const handleChange = (dayIndex: number, field: keyof Availability, value: string) => {
        const newAvail = [...availability];
        const index = newAvail.findIndex(a => a.day_of_week === dayIndex);
        if (index !== -1) {
            newAvail[index] = { ...newAvail[index], [field]: value };
            setAvailability(newAvail);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const supabase = createClient();

        try {
            // 1. Delete existing for this barber
            await supabase
                .from("availability")
                .delete()
                .eq("barber_id", barberId);

            // 2. Insert new (only valid ones)
            const validEntries = availability
                .filter(a => a.start_time && a.end_time) // Só salva dias com horário definido
                .map(a => ({
                    barber_id: barberId,
                    day_of_week: a.day_of_week,
                    start_time: a.start_time,
                    end_time: a.end_time,
                    break_start: a.break_start || null,
                    break_end: a.break_end || null
                }));

            if (validEntries.length > 0) {
                const { error } = await supabase.from("availability").insert(validEntries);
                if (error) throw error;
            }

            alert("Horários atualizados com sucesso!");
        } catch (error: any) {
            alert("Erro ao salvar horários: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></div>;

    return (
        <div className="bg-black/40 rounded-xl p-4 border border-white/5 mt-4">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Configurar Agenda Semanal
            </h3>

            <div className="space-y-3">
                {availability.map((day) => (
                    <div key={day.day_of_week} className="grid grid-cols-12 gap-2 items-center text-sm">
                        <div className="col-span-3 text-neutral-400 font-medium">
                            {DAYS_MAP[day.day_of_week]}
                        </div>
                        <div className="col-span-4 flex gap-1">
                            <input
                                type="time"
                                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white w-full text-xs"
                                value={day.start_time?.slice(0, 5) || ""}
                                onChange={e => handleChange(day.day_of_week, "start_time", e.target.value)}
                            />
                            <span className="text-neutral-600">-</span>
                            <input
                                type="time"
                                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white w-full text-xs"
                                value={day.end_time?.slice(0, 5) || ""}
                                onChange={e => handleChange(day.day_of_week, "end_time", e.target.value)}
                            />
                        </div>
                        <div className="col-span-1 text-center text-neutral-600 text-[10px] uppercase">
                            Pausa
                        </div>
                        <div className="col-span-4 flex gap-1">
                            <input
                                type="time"
                                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-300 w-full text-xs placeholder-neutral-700"
                                value={day.break_start?.slice(0, 5) || ""}
                                onChange={e => handleChange(day.day_of_week, "break_start", e.target.value)}
                            />
                            <span className="text-neutral-600">-</span>
                            <input
                                type="time"
                                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-300 w-full text-xs placeholder-neutral-700"
                                value={day.break_end?.slice(0, 5) || ""}
                                onChange={e => handleChange(day.day_of_week, "break_end", e.target.value)}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-[10px] text-neutral-600 mt-3 mb-4">
                * Deixe os campos vazios para marcar o dia como folga.
            </p>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-lg transition-colors text-sm font-medium"
            >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Horários
            </button>
        </div>
    );
}
