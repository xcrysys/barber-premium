
"use client";

import { useEffect, useState } from "react";
import {
    Search, Plus, Filter, MoreVertical, Edit2, Trash2, CheckCircle, XCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Service } from "@/types/database";
import { saveServiceAction, deleteServiceAction } from "./actions";

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        duration_minutes: "",
        category: "hair"
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("services")
            .select("*")
            .order("name", { ascending: true });

        if (error) console.error(error);
        else setServices(data as Service[]);
        setLoading(false);
    };

    const handleSave = async () => {
        const payload: any = {
            id: editingService?.id, // undefined means create
            name: formData.name,
            description: formData.description,
            price: Number(formData.price),
            duration_minutes: Number(formData.duration_minutes),
            category: formData.category,
            is_active: true
        };

        const result = await saveServiceAction(payload);
        if (result.error) {
            alert("Erro ao salvar serviço: " + result.error);
        } else {
            alert(editingService ? "Serviço atualizado!" : "Serviço criado!");
            fetchServices();
            closeModal();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este serviço?")) return;

        const result = await deleteServiceAction(id);
        if (result.error) {
            alert("Erro ao excluir. Verifique se não há agendamentos vinculados.");
        } else {
            alert("Serviço excluído.");
            fetchServices();
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        const supabase = createClient();
        await supabase.from("services").update({ is_active: !currentStatus }).eq("id", id);
        fetchServices();
    };

    const openModal = (service?: Service) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                description: service.description || "",
                price: service.price.toString(),
                duration_minutes: service.duration_minutes.toString(),
                category: service.category
            });
        } else {
            setEditingService(null);
            setFormData({ name: "", description: "", price: "", duration_minutes: "", category: "hair" });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white tracking-wide">Serviços</h1>
                    <p className="text-neutral-500 mt-1">Gerencie os tratamentos disponíveis</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/10"
                >
                    <Plus className="w-5 h-5" />
                    Novo Serviço
                </button>
            </header>

            {/* Filter Bar */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Buscar serviços..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <p className="text-neutral-500">Carregando...</p>
                ) : filteredServices.map((service) => (
                    <div key={service.id} className="group bg-neutral-900/50 border border-white/5 rounded-xl p-5 hover:border-amber-500/30 transition-all relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="bg-neutral-800 px-3 py-1 rounded-full text-xs font-mono text-neutral-400 uppercase tracking-wider">
                                {service.category}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openModal(service)} className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(service.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-neutral-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-medium text-white mb-2 relative z-10">{service.name}</h3>
                        <p className="text-neutral-500 text-sm mb-6 line-clamp-2 relative z-10">{service.description}</p>

                        <div className="flex items-center justify-between border-t border-white/5 pt-4 relative z-10">
                            <div className="flex flex-col">
                                <span className="text-xs text-neutral-500 uppercase">Preço</span>
                                <span className="text-amber-500 font-bold text-lg">{formatCurrency(service.price)}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-neutral-500 uppercase">Duração</span>
                                <span className="text-white font-mono">{service.duration_minutes} min</span>
                            </div>
                        </div>

                        {/* Toggle Active */}
                        <button
                            onClick={() => handleToggleActive(service.id, !!service.is_active)}
                            className={`absolute bottom-4 right-4 z-20 hidden`} // Keeping logic but hidden for now to simplify UI
                        >
                            {service.is_active ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal - Simple Implementation */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h2>
                            <button onClick={closeModal} className="text-neutral-500 hover:text-white"><XCircle className="w-6 h-6" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">Nome</label>
                                <input className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase text-neutral-500 mb-1">Preço (R$)</label>
                                    <input type="number" className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                        value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-neutral-500 mb-1">Duração (min)</label>
                                    <input type="number" className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                        value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">Categoria</label>
                                <select className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                    value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="hair">Cabelo</option>
                                    <option value="beard">Barba</option>
                                    <option value="combo">Combo</option>
                                    <option value="treatment">Tratamento</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">Descrição</label>
                                <textarea className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none h-24"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <button onClick={handleSave} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl mt-4 transition-colors">
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
