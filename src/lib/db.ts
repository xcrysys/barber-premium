import { createClient } from "@/lib/supabase/client";
import { Barber, Service, Availability, Appointment } from "@/types/database";
import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Sao_Paulo';

// Catálogo Padrão de Serviços de Alto Padrão (Garante que o cliente nunca veja tela vazia)
export const DEFAULT_SERVICES: Service[] = [
    {
        id: "srv-corte-classico",
        name: "Corte Executivo Premium",
        description: "Corte com tesoura e máquina, acabamento milimétrico navalhado, lavagem com shampoo especial e finalização com pomada matte.",
        duration_minutes: 45,
        price: 55,
        image_url: null,
        category: "hair",
        is_active: true
    },
    {
        id: "srv-barba-terapia",
        name: "Barba Terapia Imperial",
        description: "Modelagem completa da barba com toalha quente aromatizada, óleos essenciais, massagem facial e finalização com pós-barba premium.",
        duration_minutes: 35,
        price: 45,
        image_url: null,
        category: "beard",
        is_active: true
    },
    {
        id: "srv-combo-vip",
        name: "Combo VIP Signature (Corte + Barba)",
        description: "Experiência completa: corte refinado, barba terapia imperial, higienização profunda e drink cortesia.",
        duration_minutes: 75,
        price: 90,
        image_url: null,
        category: "combo",
        is_active: true
    },
    {
        id: "srv-tratamento-capilar",
        name: "Tratamento & Hidratação de Couro",
        description: "Esfoliação do couro cabeludo, hidratação profunda antifrizz e fortalecimento capilar com ozonioterapia.",
        duration_minutes: 40,
        price: 65,
        image_url: null,
        category: "treatment",
        is_active: true
    },
    {
        id: "srv-hot-shave",
        name: "Barbearia Clássica à Navalha",
        description: "O clássico barbear tradicional à navalha com espuma aquecida em tigela de cobre e bálsamo refrescante.",
        duration_minutes: 30,
        price: 40,
        image_url: null,
        category: "beard",
        is_active: true
    },
    {
        id: "srv-dia-do-noivo",
        name: "Experiência Master Exclusive",
        description: "Pacote VIP completo: Corte, barba, limpeza de pele, sobrancelha na navalha e finalização de alto nível.",
        duration_minutes: 90,
        price: 160,
        image_url: null,
        category: "combo",
        is_active: true
    }
];

// Barbeiros Mestres Padrão da Casa
export const DEFAULT_BARBERS: Barber[] = [
    {
        id: "barber-sandro",
        full_name: "Sandro Silva (Master Barber)",
        avatar_url: null,
        role: "admin",
        phone: "(11) 99999-8888",
        bio: "Especialista em visagismo masculino, cortes executivos e barba terapia com mais de 10 anos de tradição.",
        specialties: ["Visagismo", "Degradê Americano", "Barba Terapia"],
        instagram_handle: "@sandrobarber",
        is_active: true
    },
    {
        id: "barber-marcos",
        full_name: "Marcos Vinicius (Senior Stylist)",
        avatar_url: null,
        role: "barber",
        phone: "(11) 98888-7777",
        bio: "Especialista em tesoura clássica, freestyle e tratamentos capilares avançados.",
        specialties: ["Tesoura Clássica", "Tratamentos", "Platinado"],
        instagram_handle: "@marcosvbarber",
        is_active: true
    }
];

export const getActiveServices = async (): Promise<Service[]> => {
    try {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("services")
            .select("*")
            .eq("is_active", true)
            .order("price", { ascending: true });

        if (error || !data || data.length === 0) {
            return DEFAULT_SERVICES;
        }
        return data as Service[];
    } catch {
        return DEFAULT_SERVICES;
    }
};

export const getActiveBarbers = async (): Promise<Barber[]> => {
    try {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("barbers")
            .select(`
                *,
                profiles (
                    full_name,
                    avatar_url,
                    phone,
                    role
                )
            `)
            .eq("is_active", true);

        if (error || !data || data.length === 0) {
            return DEFAULT_BARBERS;
        }

        return data.map((b: any) => ({
            ...b,
            id: b.id,
            full_name: b.profiles?.full_name || b.full_name || "Barbeiro",
            avatar_url: b.profiles?.avatar_url || b.avatar_url,
            phone: b.profiles?.phone || b.phone,
            role: b.profiles?.role || b.role || 'barber'
        })) as Barber[];
    } catch {
        return DEFAULT_BARBERS;
    }
};

export const getBarberAvailability = async (barberId: string, date: Date): Promise<string[]> => {
    const defaultSlots = [
        "09:00", "09:45", "10:30", "11:15",
        "13:30", "14:15", "15:00", "15:45",
        "16:30", "17:15", "18:00", "18:45"
    ];

    try {
        const supabase = createClient();
        const zonedDate = toZonedTime(date, TIMEZONE);
        const dayOfWeek = zonedDate.getDay();

        // 1. Horário de expediente
        const { data: shift, error: shiftError } = await supabase
            .from("availability")
            .select("*")
            .eq("barber_id", barberId)
            .eq("day_of_week", dayOfWeek)
            .single();

        if (shiftError || !shift) {
            // Se ainda não cadastrou a escala no banco, retorna horários comerciais padrão
            return defaultSlots;
        }

        // 2. Horários ocupados via RPC
        const startOfDay = new Date(zonedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const startUtc = fromZonedTime(startOfDay, TIMEZONE);

        const endOfDay = new Date(zonedDate);
        endOfDay.setHours(23, 59, 59, 999);
        const endUtc = fromZonedTime(endOfDay, TIMEZONE);

        const { data: busySlots } = await supabase
            .rpc("get_busy_slots", {
                p_barber_id: barberId,
                p_start_time: startUtc.toISOString(),
                p_end_time: endUtc.toISOString()
            });

        const busyList = busySlots || [];

        // 3. Montar slots disponíveis
        const slots: string[] = [];
        const [startHour, startMinute] = shift.start_time.split(":").map(Number);
        const [endHour, endMinute] = shift.end_time.split(":").map(Number);

        let current = new Date(zonedDate);
        current.setHours(startHour, startMinute, 0, 0);

        const endShift = new Date(zonedDate);
        endShift.setHours(endHour, endMinute, 0, 0);

        const nowUtc = new Date();
        const nowInZone = toZonedTime(nowUtc, TIMEZONE);
        const isToday = format(current, 'yyyy-MM-dd') === format(nowInZone, 'yyyy-MM-dd');

        while (current < endShift) {
            if (isToday && current < nowInZone) {
                current.setMinutes(current.getMinutes() + 45);
                continue;
            }

            const timeString = format(current, 'HH:mm');
            const currentUtc = fromZonedTime(current, TIMEZONE);

            const isBusy = busyList.some((b: any) => {
                const bStart = new Date(b.start_time);
                const bEnd = new Date(b.end_time);
                return currentUtc >= bStart && currentUtc < bEnd;
            });

            if (!isBusy) {
                slots.push(timeString);
            }

            current.setMinutes(current.getMinutes() + 45);
        }

        return slots.length > 0 ? slots : defaultSlots;
    } catch {
        return defaultSlots;
    }
};
