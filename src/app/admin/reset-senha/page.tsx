
"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, UserPlus } from "lucide-react";
import { resetUserPasswordAction, createAuthForExistingBarber } from "./actions";

type Tab = "reset" | "create";

export default function ResetSenhaPage() {
    const [tab, setTab] = useState<Tab>("create"); // Default to "create" since that's the common case
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "error" | "warning"; msg: string } | null>(null);

    // Reset form
    const [resetEmail, setResetEmail] = useState("");
    const [resetPass, setResetPass] = useState("");
    const [resetConfirm, setResetConfirm] = useState("");

    // Create form
    const [createId, setCreateId] = useState("");
    const [createEmail, setCreateEmail] = useState("");
    const [createPass, setCreatePass] = useState("");

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);
        if (resetPass !== resetConfirm) { setResult({ type: "error", msg: "As senhas não coincidem." }); return; }
        setLoading(true);
        const res = await resetUserPasswordAction(resetEmail.trim(), resetPass);
        setLoading(false);

        if (res.error) {
            setResult({ type: "error", msg: res.error });
        } else if ((res as any).warning) {
            setResult({ type: "warning", msg: (res as any).warning });
        } else {
            setResult({ type: "success", msg: `✅ Senha atualizada com sucesso para ${resetEmail}!` });
            setResetEmail(""); setResetPass(""); setResetConfirm("");
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);
        if (!createId || !createEmail || !createPass) { setResult({ type: "error", msg: "Preencha todos os campos." }); return; }
        setLoading(true);
        const res = await createAuthForExistingBarber(createId.trim(), createEmail.trim(), createPass);
        setLoading(false);

        if (res.error) {
            setResult({ type: "error", msg: res.error });
        } else {
            setResult({ type: "success", msg: `✅ Conta de login criada! O barbeiro já pode entrar em /login com o email e senha definidos.` });
            setCreateId(""); setCreateEmail(""); setCreatePass("");
        }
    };

    return (
        <div className="space-y-8 pb-12 max-w-2xl">
            <header className="border-b border-white/5 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <KeyRound className="w-6 h-6 text-amber-500" />
                    <h1 className="text-3xl font-serif font-bold text-white">Gerenciar Acessos</h1>
                </div>
                <p className="text-neutral-500">Crie ou redefina senhas de usuários do sistema.</p>
            </header>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-900 p-1 rounded-xl border border-white/5 w-fit">
                <button
                    onClick={() => { setTab("create"); setResult(null); }}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === "create" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}`}
                >
                    <UserPlus className="w-4 h-4 inline mr-1.5" />
                    Criar Login (novo)
                </button>
                <button
                    onClick={() => { setTab("reset"); setResult(null); }}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === "reset" ? "bg-amber-500 text-black" : "text-neutral-400 hover:text-white"}`}
                >
                    <KeyRound className="w-4 h-4 inline mr-1.5" />
                    Redefinir Senha
                </button>
            </div>

            {/* Feedback */}
            {result && (
                <div className={`flex items-start gap-3 p-4 rounded-xl text-sm ${result.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" :
                        result.type === "warning" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" :
                            "bg-red-500/10 border border-red-500/20 text-red-400"
                    }`}>
                    {result.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                    <span>{result.msg}</span>
                </div>
            )}

            {/* ── TAB: Criar Login ── */}
            {tab === "create" && (
                <div className="space-y-4">
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-400">
                        <p className="font-medium mb-1">ℹ️ Para barbeiros criados pelo banco de dados (seed)</p>
                        <p className="text-blue-400/70">
                            Esses barbeiros existem na agenda mas nunca tiveram conta de login.
                            Preencha o UUID do perfil deles para criar o acesso.
                        </p>
                    </div>

                    <div className="bg-neutral-900/80 border border-white/5 rounded-xl p-4 text-xs text-neutral-500 font-mono">
                        <p className="text-neutral-400 font-sans text-sm font-medium mb-2">Onde achar o UUID do barbeiro?</p>
                        <p>No Supabase → SQL Editor, cole:</p>
                        <code className="block bg-black/50 rounded p-2 mt-1 text-amber-400">
                            SELECT id, full_name FROM public.profiles WHERE role = &#39;barber&#39;;
                        </code>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-4 bg-neutral-900 border border-white/5 rounded-2xl p-6">
                        <div>
                            <label className="block text-xs uppercase text-neutral-500 tracking-wider mb-2">UUID do Perfil (do banco)</label>
                            <input
                                type="text"
                                required
                                value={createId}
                                onChange={e => setCreateId(e.target.value)}
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-amber-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-neutral-500 tracking-wider mb-2">E-mail de Login</label>
                            <input
                                type="email"
                                required
                                value={createEmail}
                                onChange={e => setCreateEmail(e.target.value)}
                                placeholder="gabriel@barber.com"
                                className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-neutral-500 tracking-wider mb-2">Senha Provisória</label>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    required
                                    minLength={6}
                                    value={createPass}
                                    onChange={e => setCreatePass(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 pr-12 text-white focus:border-amber-500 outline-none"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300">
                                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition-colors">
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : <><UserPlus className="w-4 h-4" /> Criar Login do Barbeiro</>}
                        </button>
                    </form>
                </div>
            )}

            {/* ── TAB: Redefinir Senha ── */}
            {tab === "reset" && (
                <form onSubmit={handleReset} className="space-y-4 bg-neutral-900 border border-white/5 rounded-2xl p-6">
                    <div>
                        <label className="block text-xs uppercase text-neutral-500 tracking-wider mb-2">E-mail do Usuário</label>
                        <input type="email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                            className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-neutral-500 tracking-wider mb-2">Nova Senha</label>
                        <div className="relative">
                            <input type={showPass ? "text" : "password"} required minLength={6} value={resetPass} onChange={e => setResetPass(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 pr-12 text-white focus:border-amber-500 outline-none" />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600">
                                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-neutral-500 tracking-wider mb-2">Confirmar Senha</label>
                        <input type={showPass ? "text" : "password"} required value={resetConfirm} onChange={e => setResetConfirm(e.target.value)}
                            placeholder="Repita a senha"
                            className={`w-full bg-black border rounded-lg px-4 py-3 text-white outline-none ${resetConfirm && resetConfirm !== resetPass ? 'border-red-500/50' : 'border-neutral-800 focus:border-amber-500'}`} />
                        {resetConfirm && resetConfirm !== resetPass && <p className="text-red-400 text-xs mt-1">As senhas não coincidem.</p>}
                    </div>
                    <button type="submit" disabled={loading || (!!resetConfirm && resetConfirm !== resetPass)}
                        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition-colors">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Atualizando...</> : <><KeyRound className="w-4 h-4" /> Atualizar Senha</>}
                    </button>
                </form>
            )}
        </div>
    );
}
