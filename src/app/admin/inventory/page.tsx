'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAdminInventory, updateInventoryStock, AdminInventoryItem } from '@/services/inventory-service';
import { Boxes, Search, AlertTriangle, CheckCircle2, Edit2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/toast-context';

export default function AdminInventoryPage() {
  const [items, setItems] = useState<AdminInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<AdminInventoryItem | null>(null);
  const [editQty, setEditQty] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const dataItems = await getAdminInventory(data.user.id, search);
        setItems(dataItems);
      }
    } catch {
      showToast('Failed to load inventory levels.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user && isMounted) {
          const dataItems = await getAdminInventory(data.user.id, search);
          if (isMounted) setItems(dataItems);
        }
      } catch {
        if (isMounted) showToast('Failed to load inventory levels.', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [search, showToast, supabase.auth]);

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const newQty = parseInt(editQty, 10);
    if (isNaN(newQty) || newQty < 0) {
      showToast('Quantity available cannot be negative.', 'error');
      return;
    }

    setSaving(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        showToast('Authentication required.', 'error');
        return;
      }

      const res = await updateInventoryStock(data.user.id, selectedItem.id, newQty);
      if (res.success) {
        showToast(`Stock for ${selectedItem.productTitle} updated to ${newQty}.`, 'success');
        setSelectedItem(null);
        loadData();
      } else {
        showToast(res.error || 'Failed to update stock.', 'error');
      }
    } catch {
      showToast('Error updating stock level.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-600" /> Inventory & Stock Control
          </h1>
          <p className="text-xs text-stone-500 font-semibold">Monitor catalog product availability and restock thresholds</p>
        </div>

        <Button onClick={loadData} variant="secondary" className="text-xs font-bold gap-1.5 self-start sm:self-auto">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Stock
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by Product Title, SKU or Category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Inventory Stock Table */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs text-stone-500 font-semibold flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> Loading real stock levels from TiDB...
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Boxes className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No inventory items found</p>
            <p className="text-xs text-stone-500">Products in your catalog will appear here with live availability status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Product Title</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quantity Available</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-slate-800">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.productTitle}</td>
                    <td className="py-3.5 px-4 font-mono text-stone-600">{item.sku}</td>
                    <td className="py-3.5 px-4 text-stone-600">{item.categoryName}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                      {item.quantityAvailable} <span className="text-[10px] font-normal text-stone-500">units</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.quantityAvailable === 0 ? (
                        <Badge variant="danger" className="gap-1">
                          <AlertTriangle className="w-3 h-3" /> OUT OF STOCK
                        </Badge>
                      ) : item.quantityAvailable <= item.lowStockThreshold ? (
                        <Badge variant="warning" className="gap-1">
                          <AlertTriangle className="w-3 h-3" /> LOW STOCK (≤{item.lowStockThreshold})
                        </Badge>
                      ) : (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" /> IN STOCK
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setEditQty(String(item.quantityAvailable));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-slate-900 hover:text-white transition-colors font-bold inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Adjust Inventory Stock</h3>
            <p className="text-xs text-stone-600">
              Update available units for <span className="font-bold text-slate-900">{selectedItem.productTitle}</span> (SKU: {selectedItem.sku}).
            </p>

            <form onSubmit={handleUpdateStock} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Quantity Available</label>
                <input
                  type="number"
                  min="0"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setSelectedItem(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="bg-slate-900" isLoading={saving}>
                  Update Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
