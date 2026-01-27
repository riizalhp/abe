import React, { useState } from 'react';
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

    const handleUpdateStock = async (id: string, qtyChange: number) => {
        try {
            await inventoryService.updateStock(id, qtyChange);
            onRefresh();
        } catch (e) {
            console.error('Inventory update error:', e);
            alert("Failed to update stock: " + (e.message || 'Unknown error'));
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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory</h1>
                    <p className="text-slate-500">Manage parts and stock levels</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="h-12 bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg shadow-lg shadow-primary/20 flex items-center transition-all font-bold text-sm justify-center"
                >
                    <span className="material-symbols-outlined mr-2">add</span> Add Item
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                    <input
                        type="text"
                        placeholder="Search parts..."
                        className="w-full h-12 pl-11 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center shadow-sm font-medium transition-colors">
                    <span className="material-symbols-outlined mr-2">filter_list</span> Filter
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredInventory.map(item => (
                    <div key={item.id} className="bg-white dark:bg-[#1A2230] p-6 rounded-xl border border-border-light dark:border-slate-800 shadow-soft hover:shadow-hover transition-all group relative">

                        {item.stock <= item.minStock && (
                            <div className="absolute top-0 right-0 p-2">
                                <span className="px-2 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold rounded-full">
                                    Low Stock
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">inventory</span>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.stock} <span className="text-sm text-slate-400 font-normal">{item.unit}</span></p>
                                <p className={`text-xs font-bold uppercase tracking-wide ${
                                    item.stock <= item.minStock 
                                        ? 'text-red-500 dark:text-red-400' 
                                        : 'text-green-500 dark:text-green-400'
                                }`}>
                                    {item.stock <= item.minStock ? 'Low Stock' : 'In Stock'}
                                </p>
                            </div>
                        </div>

                        <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{item.name}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{item.category} • Rp {item.price.toLocaleString()}</p>

                        {editItem?.id === item.id ? (
                            <form onSubmit={handleConfigUpdate} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-3 border border-primary/20">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Min Stock</label>
                                        <input 
                                            type="number" 
                                            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                                            value={editItem.minStock} 
                                            onChange={e => setEditItem({ ...editItem, minStock: Number(e.target.value) })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Price</label>
                                        <input 
                                            type="number" 
                                            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                                            value={editItem.price} 
                                            onChange={e => setEditItem({ ...editItem, price: Number(e.target.value) })} 
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 h-10 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold transition-all">Save</button>
                                    <button type="button" onClick={() => setEditItem(null)} className="flex-1 h-10 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-sm font-bold transition-all">Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex gap-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                                <button
                                    onClick={() => handleUpdateStock(item.id, -1)}
                                    className="flex-1 h-10 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-lg transition-all"
                                    disabled={item.stock <= 0}
                                >-</button>
                                <button
                                    onClick={() => handleUpdateStock(item.id, +1)}
                                    className="flex-1 h-10 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-lg transition-all"
                                >+</button>
                                <button
                                    onClick={() => setEditItem(item)}
                                    className="h-10 px-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">settings</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Item Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1A2230] rounded-xl shadow-soft w-full max-w-md border border-border-light dark:border-slate-800">
                        <div className="p-6 border-b border-border-light dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Add New Item</h3>
                            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSaveNewItem} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold">Item Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" 
                                    value={newItem.name} 
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })} 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold">Stock</label>
                                    <input 
                                        type="number" 
                                        required 
                                        className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" 
                                        value={newItem.stock} 
                                        onChange={e => setNewItem({ ...newItem, stock: Number(e.target.value) })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold">Min Stock</label>
                                    <input 
                                        type="number" 
                                        required 
                                        className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" 
                                        value={newItem.minStock} 
                                        onChange={e => setNewItem({ ...newItem, minStock: Number(e.target.value) })} 
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold">Price (Rp)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" 
                                        value={newItem.price} 
                                        onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold">Unit</label>
                                    <select 
                                        className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm appearance-none" 
                                        value={newItem.unit} 
                                        onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                                    >
                                        <option>Pcs</option>
                                        <option>Botol</option>
                                        <option>Set</option>
                                        <option>Liter</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold">Category</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" 
                                    placeholder="e.g. Oli, Ban" 
                                    value={newItem.category} 
                                    onChange={e => setNewItem({ ...newItem, category: e.target.value })} 
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all mt-6 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">save</span>
                                Save Item
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default InventoryView;
