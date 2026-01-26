import React, { useState } from 'react';
import { ShoppingCart, Search, Filter, Plus, Save, X, AlertCircle } from 'lucide-react';
import { InventoryItem } from '../../types';
import { inventoryService } from '../../services/inventoryService';

interface InventoryViewProps {
    inventory: InventoryItem[];
    onRefresh: () => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({ inventory, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // New Item State
    const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
        name: '', stock: 0, minStock: 5, price: 0, category: '', unit: 'Pcs'
    });

    const handleUpdateStock = async (id: string, newStock: number) => {
        try {
            await inventoryService.updateStock(id, newStock);
            onRefresh();
        } catch (e) {
            console.error(e);
            alert("Failed to update stock");
        }
    };

    const handleSaveNewItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await inventoryService.create({
                name: newItem.name!,
                stock: Number(newItem.stock),
                minStock: Number(newItem.minStock),
                price: Number(newItem.price),
                category: newItem.category!,
                unit: newItem.unit!
            });
            setIsAdding(false);
            setNewItem({ name: '', stock: 0, minStock: 5, price: 0, category: '', unit: 'Pcs' });
            onRefresh();
        } catch (e) {
            console.error(e);
            alert("Failed to add item");
        }
    };

    const handleConfigUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editItem) {
            try {
                await inventoryService.update(editItem.id, {
                    minStock: Number(editItem.minStock),
                    price: Number(editItem.price)
                });
                setEditItem(null);
                onRefresh();
            } catch (e) {
                console.error(e);
                alert("Failed to update item");
            }
        }
    };

    const filteredInventory = inventory.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory</h2>
                    <p className="text-slate-500 text-sm">Manage parts and stock levels</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-600/20 flex items-center transition-all font-bold text-sm"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add Item
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search parts..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 flex items-center shadow-sm font-medium">
                    <Filter className="w-5 h-5 mr-2" /> Filter
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInventory.map(item => (
                    <div key={item.id} className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 hover:border-blue-200 transition-all group relative overflow-hidden">

                        {item.stock <= item.minStock && (
                            <div className="absolute top-0 right-0 p-2 bg-red-50 rounded-bl-2xl">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-slate-50 p-3 rounded-xl">
                                <ShoppingCart className="w-6 h-6 text-slate-600" />
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-slate-900">{item.stock} <span className="text-sm text-slate-400 font-normal">{item.unit}</span></p>
                                <p className={`text-xs font-bold uppercase tracking-wide ${item.stock <= item.minStock ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {item.stock <= item.minStock ? 'Low Stock' : 'In Stock'}
                                </p>
                            </div>
                        </div>

                        <h3 className="font-bold text-slate-900 text-lg mb-1">{item.name}</h3>
                        <p className="text-slate-500 text-sm mb-4">{item.category} • Rp {item.price.toLocaleString()}</p>

                        {editItem?.id === item.id ? (
                            <form onSubmit={handleConfigUpdate} className="bg-slate-50 p-4 rounded-xl space-y-3 border border-blue-200">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Min</label>
                                        <input type="number" className="w-full p-2 rounded border border-slate-200" value={editItem.minStock} onChange={e => setEditItem({ ...editItem, minStock: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Price</label>
                                        <input type="number" className="w-full p-2 rounded border border-slate-200" value={editItem.price} onChange={e => setEditItem({ ...editItem, price: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold">Save</button>
                                    <button type="button" onClick={() => setEditItem(null)} className="flex-1 bg-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold">Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex gap-2 pt-4 border-t border-slate-50">
                                <button
                                    onClick={() => handleUpdateStock(item.id, item.stock - 1)}
                                    className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold text-lg"
                                    disabled={item.stock <= 0}
                                >-</button>
                                <button
                                    onClick={() => handleUpdateStock(item.id, item.stock + 1)}
                                    className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold text-lg"
                                >+</button>
                                <button
                                    onClick={() => setEditItem(item)}
                                    className="px-3 py-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200"
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Item Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-8 duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-900">Add New Item</h3>
                            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveNewItem} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Item Name</label>
                                <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Stock</label>
                                    <input type="number" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" value={newItem.stock} onChange={e => setNewItem({ ...newItem, stock: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Min Stock</label>
                                    <input type="number" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" value={newItem.minStock} onChange={e => setNewItem({ ...newItem, minStock: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Price (Rp)</label>
                                    <input type="number" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Unit</label>
                                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })}>
                                        <option>Pcs</option>
                                        <option>Botol</option>
                                        <option>Set</option>
                                        <option>Liter</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category</label>
                                <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" placeholder="e.g. Oli, Ban" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all mt-4">Save Item</button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default InventoryView;
