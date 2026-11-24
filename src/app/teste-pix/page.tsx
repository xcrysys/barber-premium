"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import Link from "next/link";
import { generatePixPayload } from "@/lib/pix";
import {
    QrCode, Copy, Check, ArrowLeft, DollarSign,
    ShieldCheck, Sparkles, AlertCircle, Smartphone, ExternalLink
} from "lucide-react";

export default function TestePixPage() {
    const [pixKey, setPixKey] = useState(process.env.NEXT_PUBLIC_PIX_KEY || "");
    const [receiverName, setReceiverName] = useState(process.env.NEXT_PUBLIC_PIX_RECEIVER_NAME || "SANDRO SILVA");
    const [receiverCity, setReceiverCity] = useState(process.env.NEXT_PUBLIC_PIX_RECEIVER_CITY || "SAO PAULO");
    const [amount, setAmount] = useState<number>(1.00);
    const [txId, setTxId] = useState<string>("TESTE01");

    const [pixPayload, setPixPayload] = useState<string>("");
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleGenerate = async () => {
        setErrorMsg("");
        if (!pixKey.trim()) {
            setErrorMsg("Por favor, digite sua Chave PIX (CPF, Celular, E-mail ou Chave Aleatória).");
            return;
        }

        try {
            const payload = generatePixPayload({
                pixKey: pixKey.trim(),
                receiverName: receiverName.trim() || "BARBER PREMIUM",
                receiverCity: receiverCity.trim() || "SAO PAULO",
                amount: amount > 0 ? amount : undefined,
                txId: txId.trim() || "***",
            });

            setPixPayload(payload);

            const url = await QRCode.toDataURL(payload, {
                width: 400,
                margin: 2,
                color: {
                    dark: "#000000",
                    light: "#ffffff",
                },
                errorCorrectionLevel: "M",
            });

            setQrCodeDataUrl(url);
        } catch (err: any) {
            console.error("Erro ao gerar PIX:", err);
            setErrorMsg("Falha ao gerar QR Code: " + err.message);
        }
    };

    // Gera automaticamente se já houver chave
    useEffect(() => {
        if (pixKey) {
            handleGenerate();
        }
    }, []);

    const handleCopy = () => {
        if (!pixPayload) return;
        navigator.clipboard.writeText(pixPayload);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-neutral-400 hover:text-amber-500 text-sm transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar ao Início
                    </Link>

                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold text-amber-500 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        Simulador & Validador de PIX
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                        Laboratório de Teste do <span className="text-amber-500">PIX Real</span>
                    </h1>
                    <p className="text-neutral-400 text-sm sm:text-base max-w-xl mx-auto">
                        Insira sua chave PIX, gere o QR Code oficial do Banco Central e aponte o app do seu banco para testar o recebimento direto na sua conta!
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* FORMULÁRIO DE CONFIGURAÇÃO */}
                    <div className="bg-neutral-950 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white text-lg">1. Configure seus Dados</h2>
                                <p className="text-xs text-neutral-500">O dinheiro cairá 100% nesta conta</p>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {errorMsg}
                            </div>
                        )}

                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                                    Sua Chave PIX *
                                </label>
                                <input
                                    type="text"
                                    value={pixKey}
                                    onChange={(e) => setPixKey(e.target.value)}
                                    placeholder="Ex: seu CPF, Celular, E-mail ou EVP"
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
                                />
                                <p className="text-[11px] text-neutral-500 mt-1.5">
                                    Formatos: CPF (apenas números), Telefone (+5511999998888), E-mail ou Chave Aleatória.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                                        Nome do Recebedor
                                    </label>
                                    <input
                                        type="text"
                                        value={receiverName}
                                        onChange={(e) => setReceiverName(e.target.value)}
                                        placeholder="SANDRO SILVA"
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
                                    />
                                    <span className="text-[10px] text-neutral-500">Sem acentos (máx 25 car.)</span>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                                        Cidade
                                    </label>
                                    <input
                                        type="text"
                                        value={receiverCity}
                                        onChange={(e) => setReceiverCity(e.target.value)}
                                        placeholder="SAO PAULO"
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
                                    />
                                    <span className="text-[10px] text-neutral-500">Sem acentos (máx 15 car.)</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                                    Valor de Teste (R$)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-neutral-500 font-mono">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-amber-500 outline-none font-mono font-bold transition-colors"
                                    />
                                </div>
                                <div className="flex gap-2 mt-2">
                                    {[0.01, 1.00, 10.00, 45.00, 75.00].map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => setAmount(v)}
                                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                                                amount === v
                                                    ? "bg-amber-500/20 border-amber-500 text-amber-400 font-bold"
                                                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                                            }`}
                                        >
                                            R$ {v.toFixed(2)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                                    Identificador / TxID
                                </label>
                                <input
                                    type="text"
                                    value={txId}
                                    onChange={(e) => setTxId(e.target.value)}
                                    placeholder="TESTE01"
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors font-mono uppercase"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGenerate}
                            className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-base transition-all shadow-[0_0_25px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <QrCode className="w-5 h-5" />
                            Gerar QR Code Oficial
                        </button>
                    </div>

                    {/* DISPLAY DO QR CODE & RESULTADO */}
                    <div className="bg-neutral-950 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl flex flex-col items-center">
                        <div className="w-full flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="flex items-center gap-2 text-white font-bold text-lg">
                                <Smartphone className="w-5 h-5 text-amber-500" />
                                2. Resultado Pronto para Leitura
                            </div>
                            <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                EMVCo Oficial ✓
                            </span>
                        </div>

                        {qrCodeDataUrl ? (
                            <div className="flex flex-col items-center space-y-6 w-full animate-fade-in">
                                {/* MOLDURA DO QR CODE */}
                                <div className="p-4 bg-white rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.08)] border-4 border-amber-500/30">
                                    <img
                                        src={qrCodeDataUrl}
                                        alt="QR Code PIX Real"
                                        className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                                    />
                                </div>

                                <div className="text-center space-y-1">
                                    <div className="text-xs text-neutral-400 uppercase tracking-widest">
                                        Valor Configurado
                                    </div>
                                    <div className="text-3xl font-serif font-bold text-amber-500">
                                        R$ {amount.toFixed(2).replace(".", ",")}
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                        Beneficiário: <strong className="text-white">{receiverName}</strong>
                                    </div>
                                </div>

                                {/* COPIA E COLA */}
                                <div className="w-full space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold block">
                                        Código Pix Copia e Cola
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={pixPayload}
                                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-300 font-mono select-all outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCopy}
                                            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 ${
                                                copied
                                                    ? "bg-emerald-500 text-black"
                                                    : "bg-amber-500 hover:bg-amber-400 text-black"
                                            }`}
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            {copied ? "Copiado!" : "Copiar"}
                                        </button>
                                    </div>
                                </div>

                                {/* INSTRUÇÃO DE TESTE NO APP */}
                                <div className="w-full bg-neutral-900/60 border border-white/5 rounded-xl p-4 text-xs text-neutral-300 space-y-2">
                                    <div className="font-bold text-amber-400 flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4" />
                                        Como testar agora no seu celular:
                                    </div>
                                    <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                                        <li>Abra o aplicativo do seu banco (Nubank, Inter, Itaú, Bradesco, etc.).</li>
                                        <li>Selecione <strong>Área Pix ➔ Ler QR Code</strong>.</li>
                                        <li>Aponte a câmera para o QR Code acima na sua tela.</li>
                                        <li>O app vai reconhecer o valor e exibir: <em>"Transferindo para: {receiverName}"</em>.</li>
                                        <li><strong>Você não precisa pagar de verdade</strong>: apenas veja se o seu nome e banco aparecem corretamente na tela de confirmação!</li>
                                    </ol>
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center text-neutral-500 space-y-3">
                                <QrCode className="w-16 h-16 mx-auto opacity-20" />
                                <p className="text-sm">Preencha sua Chave PIX ao lado e clique em Gerar.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* VALIDADORES EXTERNOS OFICIAIS */}
                <div className="bg-neutral-950/60 border border-white/5 rounded-2xl p-6 text-sm space-y-3">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-amber-500" />
                        Quer validar em um site terceiro do Banco Central?
                    </h3>
                    <p className="text-neutral-400 text-xs leading-relaxed">
                        Copie a linha do <strong>Pix Copia e Cola</strong> gerada acima e cole em qualquer validador público de BRCode (ex: <a href="https://pix.nascent.run/" target="_blank" rel="noreferrer" className="text-amber-400 underline">pix.nascent.run</a> ou no validador do Banco Central). Ele vai destrinchar todas as tags (Tag 26 Chave Pix, Tag 54 Valor, Tag 58 País BR, Tag 59 Nome, Tag 63 CRC16) comprovando 100% de conformidade com a especificação oficial brasileira!
                    </p>
                </div>

            </div>
        </div>
    );
}
