"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, Calendar, User, Scissors, Check, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PixPaymentModal } from "@/components/PixPaymentModal";
import { getActiveServices, getActiveBarbers, getBarberAvailability } from "@/lib/db";
import { createAppointmentAction, verifyPixPaymentAction } from "./actions";
import { updateAppointmentStatus } from "@/app/admin/actions";
import { Service, Barber, Appointment } from "@/types/database";

export default function BookingPage() {
    const [step, setStep] = useState(1);
    const [services, setServices] = useState<Service[]>([]);
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPixModalOpen, setIsPixModalOpen] = useState(false);
    const [inPersonSuccess, setInPersonSuccess] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);

    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // User State
    const [user, setUser] = useState<any>(null);
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [bookingError, setBookingError] = useState("");

    // Phone helpers
    const formatPhone = (value: string): string => {
        const d = value.replace(/\D/g, '').slice(0, 11);
        if (d.length <= 2) return d;
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    };
    const isValidPhone = (v: string) => {
        const d = v.replace(/\D/g, '');
        return d.length >= 10 && d.length <= 11;
    };

    // Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [servicesData, barbersData] = await Promise.all([
                getActiveServices(),
                getActiveBarbers()
            ]);
            setServices(servicesData);
            setBarbers(barbersData);
            setIsLoading(false);

            // Check User
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchData();
    }, []);

    // Fetch Availability when Barber & Date change
    useEffect(() => {
        if (selectedBarberId && selectedDate) {
            const fetchSlots = async () => {
                setIsLoading(true);
                const slots = await getBarberAvailability(selectedBarberId, selectedDate);
                setAvailableSlots(slots);
                setIsLoading(false);
            };
            fetchSlots();
        }
    }, [selectedBarberId, selectedDate]);

    // Navigation Helpers
    const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    const handleServiceSelect = (id: string) => {
        setSelectedServiceId(id);
        nextStep();
    };

    const handleBarberSelect = (id: string) => {
        setSelectedBarberId(id);
        nextStep();
    };

    const handleTimeSelect = (time: string, date: Date) => {
        setSelectedTime(time);
        setSelectedDate(date);
        nextStep();
    };

    const validateCustomerInfo = () => {
        setBookingError("");
        if (!user) {
            if (!guestName.trim()) {
                setBookingError("Por favor, informe seu nome completo.");
                return false;
            }
            if (!guestPhone || !isValidPhone(guestPhone)) {
                setPhoneError("WhatsApp inválido. Ex: (11) 99999-8888");
                return false;
            }
        }
        return true;
    };

    // Iniciar fluxo PIX
    const handleInitiatePix = async () => {
        if (!selectedServiceId || !selectedBarberId || !selectedDate || !selectedTime) return;
        if (!validateCustomerInfo()) return;

        const service = services.find(s => s.id === selectedServiceId);
        if (!service) return;

        const [hour, minute] = selectedTime.split(':').map(Number);
        const startDate = new Date(selectedDate);
        startDate.setHours(hour, minute, 0, 0);
        const endDate = new Date(startDate);
        endDate.setMinutes(startDate.getMinutes() + service.duration_minutes);

        setIsLoading(true);
        setBookingError("");

        try {
            const result = await createAppointmentAction({
                barber_id: selectedBarberId,
                service_ids: [selectedServiceId],
                start_time: startDate.toISOString(),
                end_time: endDate.toISOString(),
                total_price: service.price,
                payment_method: 'pix',
                status: 'pending',
                customer_id: user?.id ?? null,
                customer_name: user ? (user.user_metadata?.full_name || user.email) : guestName.trim(),
                customer_phone: user ? undefined : guestPhone.replace(/\D/g, ''),
                amount_to_pay: service.price * 0.5
            });

            if (result.error || !result.data) {
                setBookingError("Erro ao iniciar agendamento: " + (result.error || "Tente novamente"));
                setIsLoading(false);
                return;
            }

            setCurrentAppointment(result.data);
            setIsPixModalOpen(true);
        } catch (err: any) {
            setBookingError("Erro inesperado: " + (err.message || "Falha na conexão"));
        } finally {
            setIsLoading(false);
        }
    };

    // Confirmar pagamento PIX dentro do modal
    const handleConfirmPixPayment = async () => {
        if (!currentAppointment?.id) {
            throw new Error("Reserva não localizada para verificação.");
        }

        const verifyResult = await verifyPixPaymentAction(currentAppointment.id);
        if (verifyResult.error) {
            throw new Error(verifyResult.error);
        }

        if (verifyResult.data) {
            setCurrentAppointment(verifyResult.data);
        }
    };

    // Confirmar pagamento Presencial
    const handleConfirmInPerson = async () => {
        if (!selectedServiceId || !selectedBarberId || !selectedDate || !selectedTime) return;
        if (!validateCustomerInfo()) return;

        const service = services.find(s => s.id === selectedServiceId);
        if (!service) return;

        const [hour, minute] = selectedTime.split(':').map(Number);
        const startDate = new Date(selectedDate);
        startDate.setHours(hour, minute, 0, 0);
        const endDate = new Date(startDate);
        endDate.setMinutes(startDate.getMinutes() + service.duration_minutes);

        setIsLoading(true);
        setBookingError("");

        try {
            // Se já existia um agendamento pendente gerado para PIX, apenas atualizamos para presencial
            if (currentAppointment?.id) {
                await updateAppointmentStatus(currentAppointment.id, 'confirmed');
                setIsLoading(false);
                setInPersonSuccess(true);
                setIsPixModalOpen(false);
                return;
            }

            const result = await createAppointmentAction({
                barber_id: selectedBarberId,
                service_ids: [selectedServiceId],
                start_time: startDate.toISOString(),
                end_time: endDate.toISOString(),
                total_price: service.price,
                payment_method: 'in_person',
                status: 'confirmed',
                customer_id: user?.id ?? null,
                customer_name: user ? (user.user_metadata?.full_name || user.email) : guestName.trim(),
                customer_phone: user ? undefined : guestPhone.replace(/\D/g, '')
            });

            setIsLoading(false);

            if (result.error || !result.data) {
                setBookingError("Erro ao agendar: " + (result.error || "Tente novamente"));
                return;
            }

            setCurrentAppointment(result.data);
            setInPersonSuccess(true);
            setIsPixModalOpen(false);
        } catch (err: any) {
            setIsLoading(false);
            setBookingError("Erro ao agendar: " + (err.message || "Erro de conexão"));
        }
    };

    const handleResetAll = () => {
        setStep(1);
        setSelectedServiceId(null);
        setSelectedBarberId(null);
        setSelectedDate(null);
        setSelectedTime(null);
        setGuestName("");
        setGuestPhone("");
        setInPersonSuccess(false);
        setIsPixModalOpen(false);
        setCurrentAppointment(null);
        setBookingError("");
        setPhoneError("");
    };

    const getSelectedService = () => services.find(s => s.id === selectedServiceId);
    const getSelectedBarber = () => barbers.find(b => b.id === selectedBarberId);

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-20">
            {/* LUXURY NAVBAR */}
            <Navbar />

            {/* PROGRESS BAR */}
            <div className="pt-28 px-6 max-w-2xl mx-auto mb-8">
                <div className="flex justify-between relative">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="relative z-10 flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${s <= step
                                    ? "bg-amber-500 border-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                    : "bg-neutral-900 border-neutral-700 text-neutral-500"
                                    }`}
                            >
                                {s < step ? <Check className="w-5 h-5" /> : s}
                            </div>
                            <span className={`text-xs mt-2 uppercase tracking-wide ${s <= step ? "text-amber-500" : "text-neutral-600"}`}>
                                {s === 1 ? "Serviço" : s === 2 ? "Barbeiro" : s === 3 ? "Data" : "Pagamento"}
                            </span>
                        </div>
                    ))}
                    {/* Connecting Line */}
                    <div className="absolute top-5 left-0 w-full h-[2px] bg-neutral-800 -z-0">
                        <div
                            className="h-full bg-amber-500 transition-all duration-500 ease-out"
                            style={{ width: `${((step - 1) / 3) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <main className="px-6 max-w-2xl mx-auto">

                {isLoading && step === 1 && services.length === 0 && (
                    <div className="text-center py-20 text-neutral-500 animate-pulse">Carregando catálogo de serviços...</div>
                )}

                {/* STEP 1: SERVICES */}
                {step === 1 && services.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-white mb-6">Escolha o Serviço</h2>
                        <div className="grid gap-4">
                            {services.map((service) => (
                                <button
                                    key={service.id}
                                    onClick={() => handleServiceSelect(service.id)}
                                    className="group relative p-5 rounded-xl border border-white/10 bg-neutral-900/50 hover:bg-neutral-800 hover:border-amber-500/50 transition-all text-left flex justify-between items-center overflow-hidden cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/0 to-amber-500/5 group-hover:via-amber-500/10 transition-all duration-500"></div>
                                    <div>
                                        <h3 className="text-lg font-medium text-white group-hover:text-amber-400 transition-colors">{service.name}</h3>
                                        <p className="text-neutral-400 text-sm mt-1">{service.description}</p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500 font-mono uppercase tracking-wider">
                                            <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {service.duration_minutes} min</span>
                                            <span className="flex items-center gap-1"><Scissors className="w-3 h-3" /> {service.category}</span>
                                        </div>
                                    </div>
                                    <div className="text-amber-500 font-bold text-lg font-serif">
                                        R$ {service.price},00
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: BARBERS */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-serif text-white">Escolha o Profissional</h2>
                            <button onClick={prevStep} className="text-sm text-neutral-400 hover:text-white underline decoration-neutral-700 cursor-pointer">Voltar</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {barbers.map((barber) => (
                                <button
                                    key={barber.id}
                                    onClick={() => handleBarberSelect(barber.id)}
                                    className="group p-6 rounded-2xl border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-800 hover:border-amber-500/30 transition-all flex flex-col items-center text-center gap-4 aspect-square justify-center cursor-pointer"
                                >
                                    <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center text-3xl font-serif border-2 border-neutral-700 group-hover:border-amber-500 transition-colors overflow-hidden">
                                        {barber.avatar_url ? (
                                            <img src={barber.avatar_url} alt={barber.full_name || ""} className="w-full h-full object-cover" />
                                        ) : (
                                            barber.full_name?.charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white group-hover:text-amber-500 transition-colors">{barber.full_name}</h3>
                                        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wide">{barber.specialties?.[0]}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: DATE & TIME */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-serif text-white">Escolha o Horário</h2>
                            <button onClick={prevStep} className="text-sm text-neutral-400 hover:text-white underline decoration-neutral-700 cursor-pointer">Voltar</button>
                        </div>

                        {/* Date Selector */}
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                            {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                                const date = new Date();
                                date.setDate(date.getDate() + offset);
                                const isSelected = selectedDate?.toDateString() === date.toDateString();

                                return (
                                    <button
                                        key={offset}
                                        onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                                        className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${isSelected
                                            ? "bg-amber-500 border-amber-500 text-black font-bold shadow-lg shadow-amber-500/20"
                                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600"
                                            }`}
                                    >
                                        <span className="text-xs uppercase">{format(date, 'EEE', { locale: ptBR })}</span>
                                        <span className="text-xl">{format(date, 'd')}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Time Slots */}
                        {selectedDate ? (
                            isLoading ? (
                                <div className="text-center py-10 text-neutral-500 animate-pulse">Buscando horários disponíveis...</div>
                            ) : availableSlots.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {availableSlots.map((time) => (
                                        <button
                                            key={time}
                                            onClick={() => handleTimeSelect(time, selectedDate)}
                                            className="py-3 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:border-amber-500/50 text-neutral-300 hover:text-white transition-all text-sm font-medium cursor-pointer"
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-neutral-500 bg-neutral-900/30 rounded-lg border border-neutral-800">
                                    Nenhum horário disponível para esta data. Selecione outro dia.
                                </div>
                            )
                        ) : (
                            <div className="text-center py-10 text-neutral-600">Selecione uma data acima para visualizar os horários.</div>
                        )}
                    </div>
                )}

                {/* STEP 4: CONFIRMATION & PAYMENT */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-serif text-white">Confirmação da Reserva</h2>
                            <button onClick={prevStep} className="text-sm text-neutral-400 hover:text-white underline decoration-neutral-700 cursor-pointer">Voltar</button>
                        </div>

                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-4">
                            {/* Summary Card */}
                            <div className="flex justify-between items-start border-b border-white/5 pb-4">
                                <div>
                                    <h3 className="text-lg font-medium text-white">{getSelectedService()?.name}</h3>
                                    <p className="text-neutral-400 text-sm mt-1">com {getSelectedBarber()?.full_name}</p>
                                </div>
                                <div className="text-amber-500 text-xl font-bold font-serif">
                                    R$ {getSelectedService()?.price},00
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-2">
                                <div className="flex items-center gap-3 text-neutral-300">
                                    <Calendar className="w-5 h-5 text-neutral-500" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-neutral-500 uppercase">Data</span>
                                        <span className="capitalize">{selectedDate && format(selectedDate, "d 'de' MMMM", { locale: ptBR })}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-neutral-300">
                                    <ClockIcon className="w-5 h-5 text-neutral-500" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-neutral-500 uppercase">Horário</span>
                                        <span className="font-mono text-amber-400">{selectedTime}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User Check (Guest vs Auth) */}
                        <div className="bg-neutral-900/30 p-5 rounded-xl border border-white/5">
                            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wide mb-3">Seus Dados de Contato</h3>
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-amber-500" />
                                    <div>
                                        <p className="text-white font-medium">{user.user_metadata?.full_name || user.email}</p>
                                        <p className="text-xs text-neutral-500">Cliente cadastrado ✓</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Seu Nome Completo *"
                                        className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none transition-colors"
                                        value={guestName}
                                        onChange={e => setGuestName(e.target.value)}
                                    />
                                    <div>
                                        <input
                                            type="tel"
                                            placeholder="WhatsApp: (XX) 9XXXX-XXXX *"
                                            maxLength={16}
                                            className={`w-full bg-black border rounded-lg p-3 text-white outline-none transition-colors ${phoneError ? 'border-red-500 focus:border-red-400' : 'border-neutral-800 focus:border-amber-500'
                                                }`}
                                            value={guestPhone}
                                            onChange={e => {
                                                setGuestPhone(formatPhone(e.target.value));
                                                setPhoneError("");
                                            }}
                                        />
                                        {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                                    </div>
                                    <p className="text-xs text-neutral-500">* Enviamos a confirmação e lembrete direto no seu WhatsApp.</p>
                                </div>
                            )}
                        </div>

                        {bookingError && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                                {bookingError}
                            </div>
                        )}

                        {inPersonSuccess ? (
                            <div className="bg-neutral-900/80 border border-amber-500/30 rounded-2xl p-6 text-center space-y-4 shadow-xl">
                                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                    <Check className="w-8 h-8 stroke-[2.5]" />
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <Sparkles className="w-3.5 h-3.5" /> Reserva Confirmada
                                </span>
                                <h3 className="text-2xl font-serif font-bold text-white">
                                    Agendamento Realizado!
                                </h3>
                                <p className="text-neutral-400 text-sm max-w-md mx-auto">
                                    Seu horário foi reservado com sucesso com {getSelectedBarber()?.full_name}. O pagamento será realizado presencialmente na recepção ou cadeira.
                                </p>
                                <button
                                    onClick={handleResetAll}
                                    className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-base transition-all cursor-pointer"
                                >
                                    Realizar Outro Agendamento
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-3 pt-2">
                                    <button
                                        onClick={handleInitiatePix}
                                        disabled={isLoading}
                                        className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <DollarSign className="w-5 h-5" />
                                        <span>{isLoading ? "Processando..." : "Pagar 50% no Pix (Garantir Reserva)"}</span>
                                    </button>

                                    <button
                                        onClick={handleConfirmInPerson}
                                        disabled={isLoading}
                                        className="w-full py-4 rounded-xl border border-neutral-700 hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-300 hover:text-white font-medium transition-all cursor-pointer"
                                    >
                                        {isLoading ? "Confirmando..." : "Pagar no Local (Presencial)"}
                                    </button>
                                </div>

                                <p className="text-center text-xs text-neutral-500 mt-4">
                                    Ao confirmar, seu horário fica reservado e bloqueado para outros clientes.
                                </p>
                            </>
                        )}

                    </div>
                )}

            </main>

            {/* PIX PAYMENT MODAL */}
            <PixPaymentModal
                isOpen={isPixModalOpen}
                onClose={() => setIsPixModalOpen(false)}
                onConfirmPayment={handleConfirmPixPayment}
                onPayInPerson={handleConfirmInPerson}
                serviceName={getSelectedService()?.name || "Serviço Barber Premium"}
                barberName={getSelectedBarber()?.full_name || "Barbeiro Especialista"}
                selectedDate={selectedDate || new Date()}
                selectedTime={selectedTime || ""}
                totalPrice={getSelectedService()?.price || 0}
                amountToPay={(getSelectedService()?.price || 0) * 0.5}
                isDeposit={true}
                appointmentId={currentAppointment?.id}
                pixPayload={currentAppointment?.pix_payload || undefined}
                pixTxId={currentAppointment?.pix_txid || undefined}
            />
        </div>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
    );
}
