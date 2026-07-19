import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Star, Grid3x3, List, Pencil, Trash2, Filter } from 'lucide-react';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { formatINR } from '@/utils/format';
import { resolveImageUrl } from '@/lib/api';
import type { Product } from '@/types';
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useApi';
import toast from 'react-hot-toast';

const emptyForm = { name: '', category: '', price: '', stock: '', description: '', image: '' };

export default function ProductsPage() {
  const { data: products = [], isLoading } = useProducts();
  const addProductMut = useAddProduct();
  const updateProductMut = useUpdateProduct();
  const deleteProductMut = useDeleteProduct();

  const [q, setQ] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = products.filter((p) =>
    (filter === 'All' || p.category === filter) && p.name.toLowerCase().includes(q.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      stock: String(p.stock),
      description: p.description,
      image: p.image || '',
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }
    const payload = {
      name: form.name,
      category: form.category || 'General',
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      description: form.description,
      // Only send `image` when we have one so backend picks defaults on create.
      ...(form.image ? { image: form.image } : {}),
    };
    try {
      if (editing) {
        // Send image explicitly (including empty string) when editing so removals stick.
        await updateProductMut.mutateAsync({
          id: editing.id,
          patch: { ...payload, image: form.image || '' },
        });
        toast.success('Product updated');
      } else {
        await addProductMut.mutateAsync(payload);
        toast.success('Product added');
      }
      setForm(emptyForm);
      setEditing(null);
      setOpen(false);
    } catch {
      toast.error('Could not save product');
    }
  };

  const askRemove = (p: Product) => setPendingDelete(p);
  const confirmRemove = async () => {
    if (!pendingDelete) return;
    try {
      await deleteProductMut.mutateAsync(pendingDelete.id);
      toast.success('Product deleted');
      setPendingDelete(null);
    } catch {
      toast.error('Could not delete');
    }
  };

  const toggleAvailable = async (p: Product) => {
    try { await updateProductMut.mutateAsync({ id: p.id, patch: { available: !p.available } }); }
    catch { toast.error('Could not update'); }
  };

  // When editing, changes to the image happen live (persisted immediately) so that
  // the "Remove" confirmation prompt inside ImageUploader properly deletes storage.
  const onProductImageChange = async (url: string | null) => {
    setForm((f) => ({ ...f, image: url || '' }));
    if (editing) {
      try {
        await updateProductMut.mutateAsync({
          id: editing.id,
          patch: { image: url || '' },
        });
      } catch {
        toast.error('Could not update image');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Products</h2>
          <p className="text-sm text-gray-500">{products.length} items in your catalog</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Product</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Search products..." value={q} onChange={(e) => setQ(e.target.value)} icon={<Search className="h-4 w-4" />} className="flex-1" />
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((c) => (
              <button key={c} onClick={() => setFilter(c)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${filter === c ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-zinc-800 p-1">
            <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-white dark:bg-zinc-900 shadow-soft' : ''}`}><Grid3x3 className="h-4 w-4" /></button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-white dark:bg-zinc-900 shadow-soft' : ''}`}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4"><Filter className="h-8 w-8 text-gray-400" /></div>
          <p className="font-semibold">No products found</p>
          <p className="text-sm text-gray-500 mt-1">Try a different search or add a new product.</p>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card hover className="overflow-hidden group">
                <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-zinc-800">
                  <img src={resolveImageUrl(p.image)} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {p.popular && <Badge color="accent"><Star className="h-3 w-3" /> Popular</Badge>}
                    {p.discount ? <Badge color="red">{p.discount}% OFF</Badge> : null}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 shadow-soft"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => askRemove(p)} className="p-1.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 shadow-soft text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  {!p.available && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Badge color="gray">Out of stock</Badge></div>}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-sm">{formatINR(p.price)}</span>
                      {p.offerPrice && <span className="text-xs text-gray-400 line-through">{formatINR(p.offerPrice)}</span>}
                    </div>
                    <span className="text-xs text-gray-500">Stock: {p.stock}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-900 text-left text-xs text-gray-500">
              <tr><th className="p-4">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th className="pr-4">Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 dark:border-zinc-800">
                  <td className="p-4"><div className="flex items-center gap-3"><img src={resolveImageUrl(p.image)} className="h-10 w-10 rounded-lg object-cover" /><span className="font-medium">{p.name}</span></div></td>
                  <td>{p.category}</td>
                  <td className="font-semibold">{formatINR(p.price)}</td>
                  <td>{p.stock}</td>
                  <td><button onClick={() => toggleAvailable(p)}>{p.available ? <Badge color="green">Available</Badge> : <Badge color="red">Out</Badge>}</button></td>
                  <td className="pr-4"><div className="flex gap-1"><button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"><Pencil className="h-4 w-4" /></button><button onClick={() => askRemove(p)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Product' : 'Add New Product'} size="lg">
        <div className="space-y-4">
          <ImageUploader
            variant="card"
            label="Product Image"
            value={form.image || null}
            onChange={onProductImageChange}
            removeTitle="Remove product image?"
            removeMessage="The product will fall back to a default image until you upload a new one."
            processOptions={{ maxDimension: 1200, quality: 0.85 }}
          />
          <Input label="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Alphonso Mango" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Fruits" />
            <Input label="Price (\u20b9)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="350" />
          </div>
          <Input label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="24" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Fresh Ratnagiri mangoes" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={addProductMut.isPending || updateProductMut.isPending}>{editing ? 'Save Changes' : 'Add Product'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
        title="Delete this product?"
        message={pendingDelete ? `"${pendingDelete.name}" and its image will be permanently removed.` : ''}
        confirmLabel="Delete"
        loading={deleteProductMut.isPending}
      />
    </div>
  );
}
