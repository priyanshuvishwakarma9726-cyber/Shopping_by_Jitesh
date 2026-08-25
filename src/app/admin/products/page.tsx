'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getProducts, getCategories, createProduct, updateProduct, toggleProductActive } from '@/services/product-service';
import { Product, Category } from '@/types';
import { Plus, Search, Edit2, Power, Loader2, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/toast-context';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [brand, setBrand] = useState('Shopping by Jitesh');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [initialStock, setInitialStock] = useState('50');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();
  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        getProducts({ search, categorySlug: selectedCategory || undefined, pageSize: 50 }),
        getCategories(),
      ]);
      setProducts(prodRes.products);
      setCategories(catRes);
      if (catRes.length > 0 && !categoryId) {
        setCategoryId(catRes[0].id);
      }
    } catch {
      showToast('Failed to load products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          getProducts({ search, categorySlug: selectedCategory || undefined, pageSize: 50 }),
          getCategories(),
        ]);
        if (isMounted) {
          setProducts(prodRes.products);
          setCategories(catRes);
          if (catRes.length > 0 && !categoryId) {
            setCategoryId(catRes[0].id);
          }
        }
      } catch {
        if (isMounted) showToast('Failed to load products.', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [search, selectedCategory, categoryId, showToast]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setTitle('');
    setSlug('');
    setSku('');
    setBasePrice('');
    setSalePrice('');
    setBrand('Shopping by Jitesh');
    setImageUrl('');
    setDescription('');
    setInitialStock('50');
    setIsFeatured(false);
    setIsActive(true);
    if (categories.length > 0) setCategoryId(categories[0].id);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setTitle(p.title);
    setSlug(p.slug);
    setSku(p.sku);
    setCategoryId(p.categoryId);
    setBasePrice(String(p.basePrice));
    setSalePrice(p.salePrice ? String(p.salePrice) : '');
    setBrand(p.brand || 'Shopping by Jitesh');
    setImageUrl(p.images?.[0]?.imageUrl || '');
    setDescription(p.description);
    setInitialStock('50');
    setIsFeatured(p.isFeatured);
    setIsActive(p.isActive);
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingProduct) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBase = parseFloat(basePrice);
    const parsedSale = salePrice.trim() ? parseFloat(salePrice) : null;
    const parsedStock = parseInt(initialStock, 10);

    if (isNaN(parsedBase) || parsedBase <= 0) {
      showToast('Please enter a valid base price greater than zero.', 'error');
      return;
    }

    if (parsedSale !== null && (isNaN(parsedSale) || parsedSale > parsedBase)) {
      showToast('Sale price cannot exceed base price.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        showToast('Authentication required.', 'error');
        return;
      }

      if (editingProduct) {
        const res = await updateProduct(data.user.id, editingProduct.id, {
          title,
          slug,
          sku,
          categoryId,
          basePrice: parsedBase,
          salePrice: parsedSale,
          brand,
          imageUrl,
          description,
          isFeatured,
          isActive,
        });

        if (res.success) {
          showToast(`Product '${title}' updated successfully.`, 'success');
          setIsModalOpen(false);
          loadData();
        } else {
          showToast(res.error || 'Failed to update product.', 'error');
        }
      } else {
        const res = await createProduct(data.user.id, {
          title,
          slug,
          sku,
          categoryId,
          basePrice: parsedBase,
          salePrice: parsedSale,
          brand,
          imageUrl,
          description,
          initialStock: isNaN(parsedStock) ? 50 : parsedStock,
          isFeatured,
          isActive,
        });

        if (res.success) {
          showToast(`Product '${title}' created successfully!`, 'success');
          setIsModalOpen(false);
          loadData();
        } else {
          showToast(res.error || 'Failed to create product.', 'error');
        }
      }
    } catch {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const res = await toggleProductActive(data.user.id, p.id, !p.isActive);
      if (res.success) {
        showToast(`Product status set to ${!p.isActive ? 'Active' : 'Inactive'}.`, 'info');
        loadData();
      } else {
        showToast(res.error || 'Failed to update status.', 'error');
      }
    } catch {
      showToast('Error updating status.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-amber-600" /> Products Catalog Management
          </h1>
          <p className="text-xs text-stone-500 font-semibold">Create, modify, and monitor active store products</p>
        </div>
        <Button onClick={openCreateModal} variant="primary" className="bg-slate-900 font-bold gap-1.5 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Product SKU
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by product title or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs text-stone-500 font-semibold flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> Loading products from TiDB Cloud...
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <PackageCheck className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No products found</p>
            <p className="text-xs text-stone-500">Try clearing search filters or add a new product SKU.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Sale Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-slate-800">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'}
                          alt={p.title}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{p.title}</p>
                          <p className="text-[10px] text-stone-400 font-mono">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-600">{p.sku}</td>
                    <td className="py-3.5 px-4 text-stone-600">{p.categoryName || 'General'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{p.basePrice.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-600">
                      {p.salePrice ? `₹${p.salePrice.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.isActive ? <Badge variant="success">ACTIVE</Badge> : <Badge variant="neutral">INACTIVE</Badge>}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-slate-900 hover:text-white transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`p-2 rounded-xl transition-colors ${
                          p.isActive
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                        }`}
                        title={p.isActive ? 'Deactivate Product' : 'Activate Product'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 max-w-xl w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">
              {editingProduct ? 'Edit Catalog Product' : 'Create New Product SKU'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Product Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Premium ANC Headphones"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">URL Slug *</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">SKU Code *</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="e.g. AUD-ANC-900"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Base Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Sale Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                    placeholder="Optional discount"
                  />
                </div>

                {!editingProduct && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Initial Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={initialStock}
                      onChange={(e) => setInitialStock(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Product Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                  placeholder="Product specifications, materials, warranty details..."
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Featured Product</span>
                </label>

                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Active for Sale</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="bg-slate-900" isLoading={submitting}>
                  {editingProduct ? 'Save Changes' : 'Create Product SKU'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
