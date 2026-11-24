"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import {
    X,
    Copy,
    Check,
    Clock,
    ShieldCheck,
    Calendar,
    Scissors,
    User,
    QrCode as QrCodeIcon,
    RefreshCw,
    Wallet,
    Sparkles
} from "lucide-react";
import { generatePixPayload } from "@/lib/pix";

export interface PixPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmPayment: () => Promise<void> | void;
    onPayInPerson?: () => Promise<void> | void;

    // Booking Details
    serviceName: string;
    barberName: string;
    selectedDate: string | Date;
    selectedTime: string;
    totalPrice: number;
    amountToPay: number; // Signal (e.g. 50%) or total
    isDeposit?: boolean;

    // Optional Pix Details
    pixPayload?: string;
    pixTxId?: string;
    expiresInMinutes?: number; // Default: 15
    appointmentId?: string;
}

export function PixPaymentModal({
    isOpen,
    onClose,
    onConfirmPayment,
    onPayInPerson,
    serviceName,
    barberName,
    selectedDate,
    selectedTime,
    totalPrice,
    amountToPay,
    isDeposit = true,
    pixPayload: providedPixPayload,
    pixTxId,
    expiresInMinutes = 15,
    appointmentId,
}: PixPaymentModalProps) {
    // Generate Pix string if not provided
    const pixCode = useMemo(() => {
        if (providedPixPayload) return providedPixPayload;

        const defaultKey = process.env.NEXT_PUBLIC_PIX_KEY || "financeiro@barberpremium.com.br";
        const receiverName = process.env.NEXT_PUBLIC_PIX_RECEIVER_NAME || "BARBER PREMIUM CLUB";
        const receiverCity = process.env.NEXT_PUBLIC_PIX_RECEIVER_CITY || "SAO PAULO";

        return generatePixPayload({
            pixKey: defaultKey,
            receiverName,
            receiverCity,
            amount: amountToPay,
            txId: pixTxId || "BP" + Math.floor(1000 + Math.random() * 9000),
        });
    }, [providedPixPayload, amountToPay, pixTxId]);

    // QR Code Image Data URL
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    // Countdown Timer (Default 15 minutes = 900 seconds)
    const totalSeconds = expiresInMinutes * 60;
    const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

    // Generate High-Definition QR Code
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        QRCode.toDataURL(pixCode, {
            width: 480,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
            errorCorrectionLevel: "M",
        })
            .then((url) => {
                if (isMounted) setQrCodeDataUrl(url);
            })
            .catch(() => {
                const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(pixCode)}`;
                if (isMounted) setQrCodeDataUrl(fallbackUrl);
            });

        return () => {
            isMounted = false;
        };
    }, [pixCode, isOpen]);

    // Timer Effect
    useEffect(() => {
        if (!isOpen || isConfirmed) return;

        setSecondsLeft(totalSeconds);
        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, totalSeconds, isConfirmed]);

    // Polling automático de status caso appointmentId esteja disponível
    useEffect(() => {
        if (!isOpen || !appointmentId || isConfirmed) return;

        const pollInterval = setInterval(async () => {
            try {
                const res = await fetch(`/api/pix?appointmentId=${appointmentId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.isPaid) {
                        setIsConfirmed(true);
                    }
                }
            } catch (err) {
                // Ignore silent network jitter
            }
        }, 4000);

        return () => clearInterval(pollInterval);
    }, [isOpen, appointmentId, isConfirmed]);

    // Copy handler
    const handleCopyPix = async () => {
        try {
            await navigator.clipboard.writeText(pixCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            const input = document.createElement("textarea");
            input.value = pixCode;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    // Confirm Payment
    const handleConfirm = async () => {
        setIsVerifying(true);
        setVerifyError(null);
        try {
            await onConfirmPayment();
            setIsConfirmed(true);
        } catch (error: any) {
            console.error("Erro ao confirmar pagamento:", error);
            setVerifyError(error.message || "Não foi possível validar o pagamento. Tente novamente.");
        } finally {
            setIsVerifying(false);
        }
    };

    // Format remaining time MM:SS
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    const progressPercent = (secondsLeft / totalSeconds) * 100;

    // Format formatted date
    const formattedDateText = useMemo(() => {
        if (!selectedDate) return "";
        if (typeof selectedDate === "string") return selectedDate;
        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "short",
            weekday: "short",
        }).format(selectedDate);
    }, [selectedDate]);

    const formatBRL = (val: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="relative w-full max-w-lg bg-neutral-950 border border-amber-500/25 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.12)] overflow-hidden z-10 my-auto text-neutral-100"
                    >
                        {/* Top Subtle Amber Ambient Bar */}
                        <div className="h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 w-full" />

                        {/* SUCCESS / CONFIRMED SCREEN */}
                        {isConfirmed ? (
                            <div className="p-8 text-center space-y-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                                    className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                                >
                                    <Check className="w-10 h-10 stroke-[2.5]" />
                                </motion.div>

                                <div className="space-y-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        <Sparkles className="w-3.5 h-3.5" /> Agendamento Confirmado
                                    </span>
                                    <h3 className="text-2xl font-serif font-bold text-white">
                                        Experiência Reservada com Sucesso!
                                    </h3>
                                    <p className="text-neutral-400 text-sm max-w-sm mx-auto">
                                        Seu pagamento de <strong className="text-white">{formatBRL(amountToPay)}</strong> foi registrado. Aguardamos você para seu momento exclusivo.
                                    </p>
                                </div>

                                {/* Booking Confirmation Summary */}
                                <div className="bg-neutral-900/60 border border-white/5 rounded-xl p-4 text-left text-sm space-y-2.5">
                                    <div className="flex justify-between items-center text-neutral-400">
                                        <span>Serviço:</span>
                                        <span className="font-medium text-white">{serviceName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-neutral-400">
                                        <span>Barbeiro:</span>
                                        <span className="font-medium text-white">{barberName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-neutral-400">
                                        <span>Data e Horário:</span>
                                        <span className="font-medium text-amber-400">{formattedDateText} às {selectedTime}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-neutral-400 pt-2 border-t border-white/5">
                                        <span>Total do Serviço:</span>
                                        <span className="font-bold text-white">{formatBRL(totalPrice)}</span>
                                    </div>
                                    {isDeposit && (
                                        <div className="flex justify-between items-center text-neutral-400 text-xs">
                                            <span>Restante a acertar na barbearia:</span>
                                            <span className="font-medium text-amber-500/90">{formatBRL(totalPrice - amountToPay)}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-base transition-all duration-200 shadow-lg shadow-amber-500/20 cursor-pointer"
                                >
                                    Concluir e Voltar
                                </button>
                            </div>
                        ) : (
                            /* MAIN PIX PAYMENT VIEW */
                            <div className="p-5 sm:p-7 space-y-5">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                Aguardando Pagamento
                                            </span>
                                            {isDeposit && (
                                                <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">
                                                    Sinal 50%
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                                            Pagamento Instantâneo via PIX
                                        </h2>
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="text-neutral-500 hover:text-white p-1.5 rounded-lg bg-neutral-900 border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                                        aria-label="Fechar modal"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Booking Mini Summary Card */}
                                <div className="bg-neutral-900/80 border border-white/10 rounded-xl p-3.5 sm:p-4 space-y-3">
                                    <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                                <Scissors className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-white leading-tight">{serviceName}</h4>
                                                <p className="text-xs text-neutral-400 flex items-center gap-1">
                                                    <User className="w-3 h-3 text-neutral-500" /> {barberName}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xs text-neutral-400">Pagar agora</div>
                                            <div className="text-base sm:text-lg font-bold text-amber-400 font-serif">
                                                {formatBRL(amountToPay)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-neutral-300">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                                            {formattedDateText}
                                        </span>
                                        <span className="flex items-center gap-1.5 font-medium text-amber-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            {selectedTime}
                                        </span>
                                        {isDeposit && (
                                            <span className="text-neutral-500 text-[11px]">
                                                (Restante no local: {formatBRL(totalPrice - amountToPay)})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Countdown Progress Bar */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-neutral-400 flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-amber-400" /> Expira em:
                                        </span>
                                        <span
                                            className={`font-mono font-bold tracking-wider ${
                                                secondsLeft < 180 ? "text-rose-400 animate-pulse" : "text-amber-400"
                                            }`}
                                        >
                                            {secondsLeft > 0 ? formattedTime : "EXPIRADO"}
                                        </span>
                                    </div>

                                    <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                                            style={{ width: `${progressPercent}%` }}
                                            transition={{ ease: "linear", duration: 1 }}
                                        />
                                    </div>
                                </div>

                                {/* Central QR Code Display */}
                                <div className="flex flex-col items-center justify-center py-2">
                                    <div className="relative p-3 bg-white rounded-2xl shadow-xl shadow-amber-500/5 border-2 border-amber-500/30 group">
                                        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-amber-500" />
                                        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-amber-500" />
                                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-amber-500" />
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-amber-500" />

                                        {qrCodeDataUrl ? (
                                            <img
                                                src={qrCodeDataUrl}
                                                alt="QR Code Pix"
                                                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center text-neutral-400 gap-2">
                                                <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                                                <span className="text-xs">Gerando QR Code...</span>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-[12px] text-neutral-400 mt-2.5 text-center flex items-center gap-1.5">
                                        <QrCodeIcon className="w-3.5 h-3.5 text-amber-400" />
                                        Abra o app do seu banco e aponte a câmera para pagar
                                    </p>
                                </div>

                                {/* Pix Copia e Cola Field with 1-Click Copy */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs text-neutral-400">
                                        <span>Ou utilize o código Copia e Cola:</span>
                                        {copied && (
                                            <motion.span
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-amber-400 font-semibold flex items-center gap-1"
                                            >
                                                <Check className="w-3 h-3" /> Copiado com sucesso!
                                            </motion.span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-1.5 pl-3 focus-within:border-amber-500/50 transition-colors">
                                        <span className="text-xs text-neutral-400 font-mono truncate select-all flex-1">
                                            {pixCode}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleCopyPix}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                copied
                                                    ? "bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                                                    : "bg-neutral-800 hover:bg-neutral-700 text-white hover:text-amber-400 border border-white/5"
                                            }`}
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span>Copiado!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3.5 h-3.5" />
                                                    <span>Copiar Código</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {verifyError && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-red-400 text-xs text-center">
                                        {verifyError}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-2">
                                    {/* Primary Confirmation Button */}
                                    <button
                                        type="button"
                                        onClick={handleConfirm}
                                        disabled={isVerifying || secondsLeft === 0}
                                        className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-base transition-all duration-200 shadow-[0_0_25px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {isVerifying ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                <span>Validando Pagamento...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-5 h-5" />
                                                <span>Já realizei o pagamento (Confirmar)</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Secondary: Pay in Person */}
                                    {onPayInPerson && (
                                        <button
                                            type="button"
                                            onClick={onPayInPerson}
                                            disabled={isVerifying}
                                            className="w-full py-2.5 rounded-xl bg-transparent hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <Wallet className="w-4 h-4 text-amber-500/80" />
                                            <span>Prefiro pagar presencialmente no local</span>
                                        </button>
                                    )}
                                </div>

                                {/* Security / Trust Badge */}
                                <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-neutral-500 border-t border-white/5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500/70" />
                                    <span>Pagamento direto e instantâneo via Banco Central do Brasil</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export default PixPaymentModal;
