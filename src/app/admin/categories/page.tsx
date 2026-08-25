'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCategories, createCategory, updateCategory } from '@/services/product-service';
import { Category } from '@/types';
import { FolderTree, Plus, Edit2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/toast-context';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();
  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      showToast('Failed to load categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getCategories();
        if (isMounted) setCategories(data);
      } catch {
        if (isMounted) showToast('Failed to load categories.', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setIsFeatured(false);
    setSortOrder('0');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setSlug(c.slug);
    setDescription(c.description || '');
    setImageUrl(c.imageUrl || '');
    setIsFeatured(c.isFeatured ?? false);
    setSortOrder(String(c.sortOrder || 0));
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      showToast('Name and slug are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        showToast('Authentication required.', 'error');
        return;
      }

      if (editingCategory) {
        const res = await updateCategory(data.user.id, editingCategory.id, {
          name,
          slug,
          description,
          imageUrl,
          isFeatured,
          sortOrder: parseInt(sortOrder, 10) || 0,
        });

        if (res.success) {
          showToast(`Category '${name}' updated successfully.`, 'success');
          setIsModalOpen(false);
          loadData();
        } else {
          showToast(res.error || 'Failed to update category.', 'error');
        }
      } else {
        const res = await createCategory(data.user.id, {
          name,
          slug,
          description,
          imageUrl,
          isFeatured,
          sortOrder: parseInt(sortOrder, 10) || 0,
        });

        if (res.success) {
          showToast(`Category '${name}' created successfully!`, 'success');
          setIsModalOpen(false);
          loadData();
        } else {
          showToast(res.error || 'Failed to create category.', 'error');
        }
      }
    } catch {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-amber-600" /> Categories Hierarchy
          </h1>
          <p className="text-xs text-stone-500 font-semibold">Organize store navigation and product taxonomy</p>
        </div>
        <Button onClick={openCreateModal} variant="primary" className="bg-slate-900 font-bold gap-1.5 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Create Category
        </Button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs text-stone-500 font-semibold flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> Loading store taxonomy...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FolderTree className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No categories found</p>
            <p className="text-xs text-stone-500">Create your first product category to organize your catalog.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">URL Slug</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Display Order</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-slate-800">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'}
                          alt={c.name}
                          className="w-9 h-9 rounded-xl object-cover border border-stone-200"
                        />
                        <span className="font-bold text-slate-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-600">{c.slug}</td>
                    <td className="py-3.5 px-4 text-stone-500 max-w-xs truncate">{c.description || '—'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.sortOrder}</td>
                    <td className="py-3.5 px-4">
                      {c.isFeatured ? (
                        <Badge variant="brand" className="gap-1">
                          <Sparkles className="w-3 h-3" /> FEATURED
                        </Badge>
                      ) : (
                        <span className="text-stone-400 font-normal">Standard</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-slate-900 hover:text-white transition-colors"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingCategory ? 'Edit Store Category' : 'Create Store Category'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Apparel & Fashion"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">URL Slug *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Category Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  placeholder="Brief description of products in this category..."
                />
              </div>

              <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <span>Show as Featured Category on Storefront</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="bg-slate-900" isLoading={submitting}>
                  {editingCategory ? 'Save Category' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
