import Link from 'next/link';
import { Navbar } from "@/components/Navbar";
import {
    Scissors, Clock, Star, MapPin, Phone,
    ChevronRight, Sparkles, ShieldCheck, Award, Crown,
    Flame, CheckCircle2, Calendar, Coffee, UserCheck
} from "lucide-react";

export default function Home() {
    return (
        <div className="bg-neutral-950 text-white min-h-screen font-sans selection:bg-amber-500 selection:text-black">
            <Navbar />

            {/* ── HERO ────────────────────────────────── */}
            <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-20 pb-16">
                {/* Background Textures */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),transparent)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />

                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
                    {/* Badge Superior */}
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        <Sparkles className="w-3.5 h-3.5" />
                        Barbearia Tradicional & Visagismo Masculino
                    </div>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold leading-tight tracking-tight mb-6">
                        A Arte do Corte Clássico com{' '}
                        <span className="text-amber-500 relative inline-block">
                            Precisão Cirúrgica
                            <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                        </span>
                    </h1>

                    <p className="text-neutral-400 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                        Esqueça filas e esperas. Escolha seu barbeiro de confiança, reserve em menos de 1 minuto e viva uma experiência completa de cuidado, estilo e exclusividade.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            href="/agendar"
                            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-4 rounded-xl text-base transition-all duration-300 hover:shadow-[0_0_35px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Calendar className="w-5 h-5" />
                            Agendar Horário Agora
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/admin"
                            className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white px-7 py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
                        >
                            <UserCheck className="w-4 h-4 text-amber-500" />
                            Painel Administrativo
                        </Link>
                    </div>

                    {/* Provas Sociais */}
                    <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-16 max-w-xl mx-auto pt-8 border-t border-white/10">
                        <div>
                            <div className="text-2xl sm:text-3xl font-bold text-amber-500 font-serif">10+ Anos</div>
                            <div className="text-neutral-500 text-xs uppercase tracking-wider mt-1">Tradição & Estilo</div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-bold text-amber-500 font-serif">5.000+</div>
                            <div className="text-neutral-500 text-xs uppercase tracking-wider mt-1">Cortes Realizados</div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-bold text-amber-500 font-serif flex items-center justify-center gap-1">
                                4.9 <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            </div>
                            <div className="text-neutral-500 text-xs uppercase tracking-wider mt-1">Avaliação Média</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CARDÁPIO DE SERVIÇOS PREMIUM ────────────────────────── */}
            <section id="servicos" className="py-24 px-6 max-w-6xl mx-auto">
                <div className="text-center mb-16 space-y-3">
                    <span className="text-amber-500 text-xs font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full">
                        Cardápio de Procedimentos
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
                        Nossos Serviços Exclusivos
                    </h2>
                    <p className="text-neutral-400 text-sm sm:text-base max-w-lg mx-auto">
                        Cada serviço foi desenhado com técnicas tradicionais de barbearia europeia e visagismo moderno.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        {
                            category: "Cabelo",
                            name: "Corte Executivo Premium",
                            desc: "Análise visagista, corte na tesoura e máquina, lavagem com shampoo mentolado e styling com pomada matte.",
                            duration: "45 min",
                            price: "R$ 55,00",
                            icon: Scissors,
                            featured: true
                        },
                        {
                            category: "Barba",
                            name: "Barba Terapia Imperial",
                            desc: "Modelagem completa da barba, toalha quente aromatizada, massagem com óleos essenciais e hidratação do fio.",
                            duration: "35 min",
                            price: "R$ 45,00",
                            icon: Flame,
                            featured: false
                        },
                        {
                            category: "Experiência Completa",
                            name: "Combo VIP Signature",
                            desc: "Corte executivo + barba terapia imperial, alinhamento de sobrancelha e drink cortesia da casa.",
                            duration: "75 min",
                            price: "R$ 90,00",
                            icon: Crown,
                            featured: true
                        },
                        {
                            category: "Tratamento",
                            name: "Tratamento & Ozonioterapia",
                            desc: "Desintoxicação profunda do couro cabeludo, estimulação capilar e reconstrução antifrizz de alto rendimento.",
                            duration: "40 min",
                            price: "R$ 65,00",
                            icon: Sparkles,
                            featured: false
                        },
                        {
                            category: "Clássico",
                            name: "Barbearia à Navalha Quente",
                            desc: "Barbear à moda antiga com lâmina descartável, espuma aquecida em tigela de cobre e pós-barba refrescante.",
                            duration: "30 min",
                            price: "R$ 40,00",
                            icon: Award,
                            featured: false
                        },
                        {
                            category: "Exclusivo",
                            name: "Experiência Master Noivo",
                            desc: "Atendimento vip completo: corte, barba, limpeza facial express, penteado e sessão de fotos reservada.",
                            duration: "90 min",
                            price: "R$ 160,00",
                            icon: ShieldCheck,
                            featured: false
                        },
                    ].map((s) => {
                        const Icon = s.icon;
                        return (
                            <div
                                key={s.name}
                                className={`group relative bg-neutral-900/60 hover:bg-neutral-900 border rounded-2xl p-7 transition-all duration-300 flex flex-col justify-between ${
                                    s.featured
                                        ? "border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.06)]"
                                        : "border-white/10 hover:border-white/20"
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:scale-105 transition-transform">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                            {s.category}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-serif font-bold text-white group-hover:text-amber-400 transition-colors mb-2">
                                        {s.name}
                                    </h3>
                                    <p className="text-neutral-400 text-xs leading-relaxed mb-6 font-light">
                                        {s.desc}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] text-neutral-500 flex items-center gap-1 mb-0.5">
                                            <Clock className="w-3 h-3 text-neutral-400" />
                                            {s.duration}
                                        </div>
                                        <div className="text-amber-500 font-serif font-bold text-xl">
                                            {s.price}
                                        </div>
                                    </div>

                                    <Link
                                        href="/agendar"
                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-sm"
                                    >
                                        Agendar <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── PADRÃO DE QUALIDADE (DIFERENCIAIS) ─────────────────── */}
            <section className="py-20 bg-neutral-900/30 border-y border-white/5 px-6">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex items-start gap-4 p-4">
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex-shrink-0">
                            <Coffee className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-serif font-bold text-white text-lg mb-1">Cerveja & Café Cortesia</h4>
                            <p className="text-neutral-400 text-xs leading-relaxed font-light">
                                Relaxe no nosso lounge com café expresso moído na hora ou cerveja artesanal gelada.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4">
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex-shrink-0">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-serif font-bold text-white text-lg mb-1">Biossegurança Rigorosa</h4>
                            <p className="text-neutral-400 text-xs leading-relaxed font-light">
                                Lâminas 100% descartáveis, navalhas esterilizadas em autoclave e toalhas higienizadas individualmente.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4">
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex-shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-serif font-bold text-white text-lg mb-1">Pontualidade Britânica</h4>
                            <p className="text-neutral-400 text-xs leading-relaxed font-light">
                                Seu horário é sagrado. Você senta na cadeira no minuto exato agendado, sem esperas.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ELEGANTE ───────────────────────────────────── */}
            <footer className="border-t border-white/10 py-12 px-6 bg-black text-neutral-400 text-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <span className="font-serif font-bold text-amber-500 text-lg tracking-wider">PREMIUM BARBER</span>
                        <p className="text-xs text-neutral-500 mt-1">© 2026 Todos os direitos reservados.</p>
                    </div>

                    <div className="flex items-center gap-6 text-xs uppercase tracking-wider">
                        <Link href="/agendar" className="hover:text-amber-500 transition-colors">Agendar Horário</Link>
                        <Link href="/admin" className="hover:text-amber-500 transition-colors">Acesso Administrativo</Link>
                        <Link href="/teste-pix" className="hover:text-amber-500 transition-colors">Testador de PIX</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
