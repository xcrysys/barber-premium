
export interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: 'customer' | 'barber' | 'admin';
    phone: string | null;
}

export interface Barber extends Profile {
    bio: string | null;
    specialties: string[] | null;
    instagram_handle: string | null;
    is_active: boolean;
}

export interface Service {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: number;
    image_url: string | null;
    category: 'hair' | 'beard' | 'combo' | 'treatment';
    is_active: boolean;
}

export interface Appointment {
    id: string;
    customer_id: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    barber_id: string;
    service_ids: string[];
    start_time: string; // ISO string for frontend
    end_time: string;
    total_price: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    payment_method: 'credit_card' | 'pix' | 'in_person' | null;
    payment_status: 'pending' | 'paid' | 'refunded';
    pix_txid: string | null;
    pix_payload: string | null;
    pix_expiration: string | null;
    notes: string | null;
    created_at: string;

    // Joins (optional for display)
    barber?: { full_name: string | null };
    barbers?: { profiles?: { full_name?: string } } | null;
    customer?: { full_name: string | null; phone: string | null };
}

export interface Availability {
    id: string;
    barber_id: string;
    day_of_week: number; // 0-6
    start_time: string; // "09:00:00"
    end_time: string;
    break_start: string | null;
    break_end: string | null;
}
