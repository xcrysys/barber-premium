"use client";

import { useEffect, useState } from "react";
import { Edit2, UserPlus, XCircle, Shield, PlusCircle } from "lucide-react"; // Added PlusCircle
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Barber } from "@/types/database";
import { createBarberAction } from "./actions"; // Import Server Action
import AvailabilityManager from "./availability-manager"; // Import Schedule Component

// Type for non-barber profiles
interface UserCandidate {
    id: string;
    full_name: string;
    email: string;
    role: string;
}

export default function BarbersPage() {
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [candidates, setCandidates] = useState<UserCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false); // New Modal
    const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

    // Form State (Needs Profile + Barber Info)
    const [formData, setFormData] = useState({
        full_name: "",
        specialties: "", // Comma separated
        instagram_handle: "",
        bio: ""
    });

    // New User Form Data
    const [newUserBadera, setNewUserBadera] = useState({
        fullName: "",
        email: "",
        password: ""
    });

    useEffect(() => {
        fetchBarbers();
    }, []);

    const fetchBarbers = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("barbers")
            .select(`
                *,
                profiles (
                   full_name, avatar_url
                )
            `);

        if (error) console.error(error);
        else {
            const flatBarbers = data.map((b: any) => ({
                ...b,
                id: b.id,
                full_name: b.profiles?.full_name,
                avatar_url: b.profiles?.avatar_url
            })) as Barber[];
            setBarbers(flatBarbers);
        }
        setLoading(false);
    };

    const fetchCandidates = async () => {
        // Fetch specific users who can be promoted (not already barbers)
        const supabase = createClient();
        const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, email, role")
            .in('role', ['customer', 'admin']) // Can promote customers or admins
            .order("full_name");

        if (data) {
            // Filter out those who are already in the barbers list
            const barberIds = new Set(barbers.map(b => b.id));
            const available = data.filter(u => !barberIds.has(u.id));
            setCandidates(available as any);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingBarber) return;

        const supabase = createClient();
        const specialtiesArray = formData.specialties.split(',').map(s => s.trim()).filter(s => s);

        const payload = {
            specialties: specialtiesArray,
            instagram_handle: formData.instagram_handle,
            bio: formData.bio
        };

        const { error } = await supabase
            .from("barbers")
            .update(payload)
            .eq("id", editingBarber.id);

        if (!error) {
            // Also update Profile Name separately if needed, but let's stick to barber details
            if (formData.full_name !== editingBarber.full_name) {
                await supabase.from("profiles").update({ full_name: formData.full_name }).eq("id", editingBarber.id);
            }
            alert("Barbeiro atualizado!");
            fetchBarbers();
            closeEditModal();
        } else {
            alert("Erro ao atualizar: " + error.message);
        }
    };

    const handlePromoteUser = async (userId: string) => {
        if (!confirm("Tem certeza? Este usuário ganhará permissões de Barbeiro e aparecerá na agenda.")) return;

        const supabase = createClient();

        // 1. Update Profile Role
        const { error: profileError } = await supabase
            .from("profiles")
            .update({ role: 'barber' })
            .eq("id", userId);

        if (profileError) {
            alert("Erro ao atualizar perfil: " + profileError.message);
            return;
        }

        // 2. Insert into Barbers table
        const { error: barberError } = await supabase
            .from("barbers")
            .insert([{
                id: userId,
                bio: "Barbeiro Premium",
                specialties: ["Cabelo", "Barba"],
                is_active: true
            }]);

        if (barberError) {
            alert("Erro ao criar ficha de barbeiro: " + barberError.message);
        } else {
            alert("Barbeiro adicionado com sucesso!");
            fetchBarbers();
            closeAddModal();
        }
    };

    const handleCreateUser = async () => {
        if (!newUserBadera.fullName || !newUserBadera.email || !newUserBadera.password) {
            alert("Preencha todos os campos!");
            return;
        }

        const formData = new FormData();
        formData.append("fullName", newUserBadera.fullName);
        formData.append("email", newUserBadera.email);
        formData.append("password", newUserBadera.password);

        try {
            const result = await createBarberAction(formData as any); // Type assertion for FormData if needed
            if (result && result.error) {
                alert("Erro: " + result.error);
            } else {
                alert("Barbeiro criado com sucesso! Ele já pode acessar o sistema com o email e senha definidos.");
                setIsCreateUserModalOpen(false);
                setNewUserBadera({ fullName: "", email: "", password: "" });
                fetchBarbers();
            }
        } catch (error: any) {
            alert("Erro inesperado: " + error.message);
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        const supabase = createClient();
        await supabase.from("barbers").update({ is_active: !currentStatus }).eq("id", id);
        fetchBarbers();
    };

    const openEditModal = (barber: Barber) => {
        setEditingBarber(barber);
        setFormData({
            full_name: barber.full_name || "",
            specialties: barber.specialties?.join(", ") || "",
            instagram_handle: barber.instagram_handle || "",
            bio: barber.bio || ""
        });
        setIsEditModalOpen(true);
    };

    const openAddModal = () => {
        fetchCandidates();
        setIsAddModalOpen(true);
    };

    const closeEditModal = () => setIsEditModalOpen(false);
    const closeAddModal = () => setIsAddModalOpen(false);

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <header className="flex justify-between items-center border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white tracking-wide">Barbeiros</h1>
                    <p className="text-neutral-500 mt-1">Gerencie a equipe e horários</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-amber-500/20"
                >
                    <UserPlus className="w-5 h-5" />
                    Novo Barbeiro
                </button>
            </header>

            {/* Barbers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? <p className="text-neutral-500">Carregando...</p> : barbers.map((barber) => (
                    <div key={barber.id} className={`bg-neutral-900/50 border ${barber.is_active ? 'border-white/5' : 'border-red-500/20'} rounded-xl p-6 hover:border-amber-500/30 transition-all flex flex-col items-center text-center gap-4 relative overflow-hidden group`}>
                        {/* Action Buttons */}
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(barber)} className="p-2 bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center text-4xl font-serif border-4 border-neutral-800 group-hover:border-amber-500 transition-colors shadow-lg shadow-black/50 overflow-hidden">
                            {barber.avatar_url ? (
                                <img src={barber.avatar_url} alt={barber.full_name || ""} className="w-full h-full object-cover" />
                            ) : (
                                barber.full_name?.charAt(0)
                            )}
                        </div>

                        <div>
                            <h3 className="text-xl font-medium text-white group-hover:text-amber-500 transition-colors">{barber.full_name}</h3>
                            <p className="text-sm text-neutral-500 mt-1 uppercase tracking-wide truncate max-w-[200px] mx-auto">{barber.specialties?.join(", ")}</p>
                        </div>

                        <div className="flex gap-2 w-full mt-4">
                            <button
                                onClick={() => handleToggleActive(barber.id, !!barber.is_active)}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium uppercase tracking-wide transition-colors border ${barber.is_active ? 'border-green-500/30 text-green-500 hover:bg-green-500/10' : 'border-red-500/30 text-red-500 hover:bg-red-500/10'}`}
                            >
                                {barber.is_active ? 'Ativo' : 'Inativo'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Editar Barbeiro</h2>
                            <button onClick={closeEditModal} className="text-neutral-500 hover:text-white"><XCircle className="w-6 h-6" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">Nome</label>
                                <input className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                    value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">Especialidades (separadas por vírgula)</label>
                                <input className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                    value={formData.specialties} onChange={e => setFormData({ ...formData, specialties: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">Instagram (@handle)</label>
                                <input className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                    value={formData.instagram_handle} onChange={e => setFormData({ ...formData, instagram_handle: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">Bio</label>
                                <textarea className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none h-24"
                                    value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
                            </div>

                            <button onClick={handleSaveEdit} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl mt-4 transition-colors">
                                Salvar Alterações
                            </button>

                            {/* Schedule Manager */}
                            {editingBarber && (
                                <div className="pt-4 border-t border-white/10 mt-6">
                                    <AvailabilityManager barberId={editingBarber.id} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal (Promote User) */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">Adicionar Barbeiro</h2>
                                <p className="text-sm text-neutral-500 mt-1">Selecione um usuário para promover a barbeiro</p>
                            </div>
                            <button onClick={closeAddModal} className="text-neutral-500 hover:text-white"><XCircle className="w-6 h-6" /></button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto space-y-2">
                            {candidates.length === 0 ? (
                                <p className="text-neutral-500 text-center py-8">Nenhum usuário disponível para promoção.</p>
                            ) : (
                                candidates.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-white/5 hover:border-amber-500/50 transition-colors">
                                        <div>
                                            <p className="font-medium text-white">{user.full_name || "Sem Nome"}</p>
                                            <p className="text-xs text-neutral-500">{user.email}</p>
                                            <span className="text-[10px] uppercase bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">{user.role}</span>
                                        </div>
                                        <button
                                            onClick={() => handlePromoteUser(user.id)}
                                            className="bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-500 p-2 rounded-lg transition-all"
                                            title="Promover a Barbeiro"
                                        >
                                            <Shield className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 flex flex-col items-center">
                            <p className="text-xs text-neutral-500 mb-3">
                                Não encontrou o usuário? Cadastre um novo barbeiro do zero.
                            </p>
                            <button
                                onClick={() => { closeAddModal(); setIsCreateUserModalOpen(true); }}
                                className="text-amber-500 hover:text-amber-400 text-sm font-medium flex items-center gap-2 hover:underline"
                            >
                                <PlusCircle className="w-4 h-4" />
                                Cadastrar Novo Barbeiro (Email & Senha)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create NEW User Modal */}
            {isCreateUserModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Cadastrar Novo Barbeiro</h2>
                            <button onClick={() => setIsCreateUserModalOpen(false)} className="text-neutral-500 hover:text-white"><XCircle className="w-6 h-6" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">Nome Completo</label>
                                <input className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                    value={newUserBadera.fullName} onChange={e => setNewUserBadera({ ...newUserBadera, fullName: e.target.value })}
                                    placeholder="Ex: João Silva" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">E-mail Profissional</label>
                                <input className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                    type="email"
                                    value={newUserBadera.email} onChange={e => setNewUserBadera({ ...newUserBadera, email: e.target.value })}
                                    placeholder="email@barbearia.com" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">Senha de Acesso</label>
                                <input className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                    type="password"
                                    value={newUserBadera.password} onChange={e => setNewUserBadera({ ...newUserBadera, password: e.target.value })}
                                    placeholder="Defina uma senha provisória" />
                            </div>

                            <div className="bg-neutral-800 p-3 rounded text-xs text-neutral-400 mt-2">
                                <p>ℹ️ Este usuário será criado imediatamente como <strong>Barbeiro</strong>. Ele poderá usar este email e senha para entrar no sistema.</p>
                            </div>

                            <button onClick={handleCreateUser} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl mt-4 transition-colors">
                                Criar Barbeiro
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
