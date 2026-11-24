
import Link from 'next/link';
import { Navbar } from "@/components/Navbar";
import { Scissors, Clock, Star, MapPin, Phone, Instagram, ChevronRight, Sparkles, Shield, Award } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />

      {/* ── HERO ────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(197,160,89,0.12),transparent)]" />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Premium Barbershop — Desde 2015
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif font-bold leading-none tracking-tight mb-6">
            Arte em cada{' '}
            <span className="text-amber-500 relative">
              corte
              <span className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
            </span>
          </h1>

          <p className="text-neutral-400 text-lg sm:text-xl max-w-xl mx-auto mb-12 leading-relaxed">
            A experiência definitiva em cuidados masculinos. Precisão, estilo e exclusividade em cada detalhe.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/agendar"
              className="group bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-4 rounded-xl text-base transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] flex items-center gap-2"
            >
              Agendar Agora
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl text-base transition-colors flex items-center gap-2"
            >
              Criar Conta
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-lg mx-auto">
            {[
              { value: "10+", label: "Anos de Experiência" },
              { value: "5k+", label: "Clientes Satisfeitos" },
              { value: "4.9★", label: "Avaliação Média" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-amber-500 font-serif">{stat.value}</div>
                <div className="text-neutral-500 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-neutral-600">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-neutral-700 animate-pulse" />
        </div>
      </section>

      {/* ── SERVIÇOS ────────────────────────────── */}
      <section id="servicos" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">O que oferecemos</span>
          <h2 className="text-4xl font-serif font-bold mt-3">Nossos Serviços</h2>
          <p className="text-neutral-500 mt-3 max-w-md mx-auto">Cada serviço pensado para realçar o seu melhor</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "✂️", name: "Corte Clássico", desc: "Tesoura e máquina com acabamento perfeito.", price: "R$ 45" },
            { icon: "🪒", name: "Barba Completa", desc: "Toalha quente, navalha e hidratação.", price: "R$ 35" },
            { icon: "💈", name: "Corte + Barba", desc: "Pacote completo para o visual ideal.", price: "R$ 75" },
            { icon: "🧴", name: "Tratamento Capilar", desc: "Hidratação e reconstrução profissional.", price: "R$ 60" },
            { icon: "👑", name: "VIP Experience", desc: "Procedimento completo com drink incluído.", price: "R$ 150" },
            { icon: "🔥", name: "Hot Towel Shave", desc: "Barbearia clássica com toalha quente.", price: "R$ 50" },
          ].map((s) => (
            <div key={s.name} className="group bg-neutral-900/50 hover:bg-neutral-900 border border-white/5 hover:border-amber-500/20 rounded-2xl p-6 transition-all duration-300 cursor-pointer">
              <div className="text-3xl mb-4">{s.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{s.name}</h3>
              <p className="text-neutral-500 text-sm mb-4 leading-relaxed">{s.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-amber-500 font-bold font-serif text-lg">{s.price}</span>
                <Link href="/agendar" className="text-neutral-600 group-hover:text-amber-500 transition-colors text-sm font-medium flex items-center gap-1">
                  Agendar <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/agendar" className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3 rounded-xl transition-colors inline-flex items-center gap-2">
            Ver Disponibilidade
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── POR QUE NÓS ─────────────────────────── */}
      <section className="py-24 px-6 bg-neutral-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Por que escolher</span>
            <h2 className="text-4xl font-serif font-bold mt-3">A diferença Barber Premium</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Award, title: "Barbeiros Certificados", desc: "Equipe treinada nas melhores técnicas nacionais e internacionais." },
              { icon: Shield, title: "Produtos Premium", desc: "Apenas produtos de alta qualidade para sua pele e cabelo." },
              { icon: Star, title: "Experiência VIP", desc: "Ambiente exclusivo, café artesanal e atendimento personalizado." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-white font-bold text-xl mb-3">{title}</h3>
                <p className="text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOBRE / INFO ─────────────────────────── */}
      <section id="sobre" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Sobre nós</span>
            <h2 className="text-4xl font-serif font-bold mt-3 mb-6">Mais que uma barbearia, um ritual</h2>
            <p className="text-neutral-400 leading-relaxed mb-6">
              Fundada com a missão de oferecer a melhor experiência em grooming masculino, a Barber Premium combina técnicas tradicionais com as tendências mais modernas.
            </p>
            <p className="text-neutral-500 leading-relaxed">
              Cada visita é pensada para que você saia não apenas com um corte perfeito, mas com confiança renovada.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Clock, label: "Seg – Sáb", value: "09:00 – 20:00" },
              { icon: MapPin, label: "Localização", value: "Centro, Vitória – ES" },
              { icon: Phone, label: "WhatsApp", value: "(27) 99999-0000" },
              { icon: Instagram, label: "Instagram", value: "@barberpremium" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-neutral-900/50 border border-white/5 rounded-xl p-5">
                <Icon className="w-5 h-5 text-amber-500 mb-3" />
                <div className="text-neutral-500 text-xs uppercase tracking-wide">{label}</div>
                <div className="text-white font-medium mt-1 text-sm">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-b from-neutral-900 to-black border border-amber-500/10 rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(197,160,89,0.06),transparent)] pointer-events-none" />
          <Scissors className="w-10 h-10 text-amber-500 mx-auto mb-6" />
          <h2 className="text-4xl font-serif font-bold mb-4">Pronto para o melhor corte da sua vida?</h2>
          <p className="text-neutral-400 mb-8">Agende agora e garanta o seu horário. Sem filas, sem espera.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/agendar" className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-4 rounded-xl transition-all hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]">
              Agendar Horário
            </Link>
            <Link href="/login" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl transition-colors">
              Criar Conta Grátis
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-neutral-400">
            <Scissors className="w-4 h-4 text-amber-500" />
            <span className="font-serif font-bold text-white">Barber Premium</span>
          </div>
          <div className="flex items-center gap-6 text-neutral-600 text-sm">
            <Link href="/agendar" className="hover:text-white transition-colors">Agendar</Link>
            <Link href="/minha-conta" className="hover:text-white transition-colors">Minha Conta</Link>
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
          </div>
          <p className="text-neutral-700 text-xs">© 2026 Barber Premium. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
