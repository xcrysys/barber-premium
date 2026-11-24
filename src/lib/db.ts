
import { createClient } from "@/lib/supabase/client";
import { Barber, Service, Availability, Appointment } from "@/types/database";
import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Sao_Paulo';

export const getActiveServices = async (): Promise<Service[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

    if (error) {
        console.error("Error fetching services:", error);
        return [];
    }
    return data as Service[];
};

export const getActiveBarbers = async (): Promise<Barber[]> => {
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

    if (error) {
        console.error("Error fetching barbers:", error);
        return [];
    }

    // Flatten the join for easier usage
    return data.map((b: any) => ({
        ...b,
        id: b.id,
        full_name: b.profiles?.full_name,
        avatar_url: b.profiles?.avatar_url,
        phone: b.profiles?.phone,
        role: b.profiles?.role
    })) as Barber[];
};

export const getBarberAvailability = async (barberId: string, date: Date): Promise<string[]> => {
    const supabase = createClient();

    // Ensure we are working with the correct day in Brazil Zone
    const zonedDate = toZonedTime(date, TIMEZONE);
    const dayOfWeek = zonedDate.getDay();

    // 1. Get Barber's Shift for this day
    const { data: shift, error: shiftError } = await supabase
        .from("availability")
        .select("*")
        .eq("barber_id", barberId)
        .eq("day_of_week", dayOfWeek)
        .single();

    if (shiftError || !shift) {
        return [];
    }

    // 2. Get Existing Appointments
    // We query UTC range to match stored timestamps
    const startOfDay = new Date(zonedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const startUtc = fromZonedTime(startOfDay, TIMEZONE);

    const endOfDay = new Date(zonedDate);
    endOfDay.setHours(23, 59, 59, 999);
    const endUtc = fromZonedTime(endOfDay, TIMEZONE);

    const { data: busySlots, error: busyError } = await supabase
        .rpc("get_busy_slots", {
            p_barber_id: barberId,
            p_start_time: startUtc.toISOString(),
            p_end_time: endUtc.toISOString()
        });

    if (busyError) console.error("Error fetching busy slots via RPC:", busyError);

    // 3. Calculate Available Slots
    const slots: string[] = [];
    const [startHour, startMinute] = shift.start_time.split(":").map(Number);
    const [endHour, endMinute] = shift.end_time.split(":").map(Number);

    // Set 'current' pointer to Start Shift in local time
    let currentInZone = new Date(zonedDate);
    currentInZone.setHours(startHour, startMinute, 0, 0);

    const endShiftInZone = new Date(zonedDate);
    endShiftInZone.setHours(endHour, endMinute, 0, 0);

    const nowUtc = new Date();
    const nowInZone = toZonedTime(nowUtc, TIMEZONE);

    // Check if checking "Today" (in local perspective)
    const isToday = format(currentInZone, 'yyyy-MM-dd') === format(nowInZone, 'yyyy-MM-dd');

    while (currentInZone < endShiftInZone) {

        // 1. Past Time Check
        if (isToday && currentInZone < nowInZone) {
            currentInZone.setMinutes(currentInZone.getMinutes() + 30);
            continue;
        }

        const timeString = format(currentInZone, 'HH:mm');

        // 2. Break Time Check
        let inBreak = false;
        if (shift.break_start && shift.break_end) {
            const [bStartH, bStartM] = shift.break_start.split(":").map(Number);
            const [bEndH, bEndM] = shift.break_end.split(":").map(Number);

            const breakStart = new Date(currentInZone);
            breakStart.setHours(bStartH, bStartM, 0, 0);

            const breakEnd = new Date(currentInZone);
            breakEnd.setHours(bEndH, bEndM, 0, 0);

            if (currentInZone >= breakStart && currentInZone < breakEnd) inBreak = true;
        }

        // 3. Existing Appointment Check (Compare using UTC)
        const currentSlotUtcStart = fromZonedTime(currentInZone, TIMEZONE);
        const currentSlotUtcEnd = new Date(currentSlotUtcStart);
        currentSlotUtcEnd.setMinutes(currentSlotUtcStart.getMinutes() + 30);

        const isBusy = busySlots?.some((slot: any) => {
            const aptStartUtc = new Date(slot.start_time);
            const aptEndUtc = new Date(slot.end_time);

            // Overlap logic: (StartA < EndB) and (EndA > StartB)
            return (currentSlotUtcStart < aptEndUtc && currentSlotUtcEnd > aptStartUtc);
        });

        if (!inBreak && !isBusy) {
            slots.push(timeString);
        }

        currentInZone.setMinutes(currentInZone.getMinutes() + 30);
    }

    return slots;
};

export const createAppointment = async (appointment: Partial<Appointment> & { customer_name?: string, customer_phone?: string }) => {
    const supabase = createClient();

    // Get current user to attach to appointment
    const { data: { user } } = await supabase.auth.getUser();

    // Se estiver logado, pegamos o nome do metadata/profile se não tiver sido enviado
    let name = appointment.customer_name;
    let phone = appointment.customer_phone;

    if (user) {
        // Get profile data if logged in
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', user.id)
            .single();

        if (profile) {
            name = profile.full_name || name;
            phone = profile.phone || phone;
        }
    }

    const payload = {
        ...appointment,
        customer_id: user?.id || null, // Attach user ID if logged in (or null for guest)
        customer_name: name,
        customer_phone: phone
    };

    const { data, error } = await supabase
        .from("appointments")
        .insert([payload])
        .select()
        .single(); // Return created data

    if (error) {
        console.error("Supabase Error:", error);
        throw new Error(error.message);
    }
    return data;
};
