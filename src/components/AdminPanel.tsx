import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Image as ImageIcon, 
  TrendingDown, 
  RefreshCw, 
  Truck
} from 'lucide-react';
import { Product, WholesaleOrder, BulkTier } from '../types.ts';
import { saveProduct, deleteProductById, subscribeToOrders, seedInitialProducts } from '../services/dataService.ts';
import { SAMPLE_IMAGE_PRESETS } from '../data/defaultProducts.ts';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminLoggedIn: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
  products: Product[];
  onRefreshProducts: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  isAdminLoggedIn,
  onLoginSuccess,
  onLogout,
  products,
  onRefreshProducts
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [orders, setOrders] = useState<WholesaleOrder[]>([]);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form State in ₹ INR
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Sweaters');
  const [formSku, setFormSku] = useState('');
  const [formBasePrice, setFormBasePrice] = useState(799);
  const [formMoq, setFormMoq] = useState(10);
  const [formStock, setFormStock] = useState(1000);
  const [formDescription, setFormDescription] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formColors, setFormColors] = useState<string[]>(['Charcoal', 'Bone']);
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [formImages, setFormImages] = useState<string[]>(['']);
  const [formTiers, setFormTiers] = useState<BulkTier[]>([
    { minQty: 10, maxQty: 49, unitPrice: 749, label: 'Tier 1' },
    { minQty: 50, unitPrice: 650, label: 'Tier 2' }
  ]);
  const [formIsNew, setFormIsNew] = useState(true);
  const [formIsTrending, setFormIsTrending] = useState(false);
  const [formIsFeatured, setFormIsFeatured] = useState(false);

  useEffect(() => {
    if (isOpen && isAdminLoggedIn) {
      const unsub = subscribeToOrders((liveOrders) => {
        setOrders(liveOrders);
      });
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [isOpen, isAdminLoggedIn]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (username.trim() === 'admin' && password === 'admin9557') {
      onLoginSuccess();
      setUsername('');
      setPassword('');
    } else {
      setLoginError('Invalid Administrator credentials (User: admin / Pass: admin9557).');
    }
  };

  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsCreatingNew(false);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormSku(prod.sku);
    setFormBasePrice(prod.basePrice);
    setFormMoq(prod.moq);
    setFormStock(prod.stock);
    setFormDescription(prod.description);
    setFormMaterial(prod.material);
    setFormColors([...prod.colors]);
    setFormSizes([...prod.sizes]);
    setFormImages(prod.images.length > 0 ? [...prod.images] : ['']);
    setFormTiers(prod.bulkTiers && prod.bulkTiers.length > 0 ? [...prod.bulkTiers] : []);
    setFormIsNew(!!prod.isNew);
    setFormIsTrending(!!prod.isTrending);
    setFormIsFeatured(!!prod.isFeatured);
  };

  const startCreateProduct = () => {
    setEditingProduct(null);
    setIsCreatingNew(true);
    setFormName('');
    setFormCategory('Sweaters');
    setFormSku(`STD-IN-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormBasePrice(599);
    setFormMoq(10);
    setFormStock(1200);
    setFormDescription('Heavyweight relaxed streetwear cut, bio-washed cotton, double-needle finish.');
    setFormMaterial('100% Combed Heavy Cotton (380 GSM)');
    setFormColors(['Washed Black', 'Oatmeal Taupe']);
    setFormSizes(['S', 'M', 'L', 'XL', 'XXL']);
    setFormImages(['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80']);
    setFormTiers([
      { minQty: 10, maxQty: 49, unitPrice: 549, label: 'Tier 1 (10-49 pcs)' },
      { minQty: 50, maxQty: 99, unitPrice: 489, label: 'Tier 2 (50-99 pcs)' },
      { minQty: 100, unitPrice: 420, label: 'Tier 3 (100+ pcs bulk)' }
    ]);
    setFormIsNew(true);
    setFormIsTrending(true);
    setFormIsFeatured(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const cleanImages = formImages.filter(img => img.trim().length > 0);
    if (cleanImages.length === 0) {
      cleanImages.push('https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80');
    }

    const targetId = editingProduct ? editingProduct.id : `prod-${Date.now()}`;
    const productToSave: Product = {
      id: targetId,
      name: formName || 'Unnamed Wholesale Style',
      category: formCategory,
      sku: formSku || `STD-IN-${Math.floor(1000 + Math.random() * 9000)}`,
      basePrice: Number(formBasePrice),
      moq: Number(formMoq),
      stock: Number(formStock),
      description: formDescription,
      material: formMaterial,
      colors: formColors.length > 0 ? formColors : ['Standard'],
      sizes: formSizes.length > 0 ? formSizes : ['One Size'],
      images: cleanImages,
      bulkTiers: formTiers,
      isNew: formIsNew,
      isTrending: formIsTrending,
      isFeatured: formIsFeatured,
      createdAt: editingProduct?.createdAt || Date.now()
    };

    try {
      await saveProduct(productToSave);
      setStatusMessage(`Item "${productToSave.name}" successfully saved in Firebase!`);
      setTimeout(() => setStatusMessage(null), 3000);
      setIsCreatingNew(false);
      setEditingProduct(null);
      onRefreshProducts();
    } catch (err) {
      console.error('Save error:', err);
      setStatusMessage('Error saving product to Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (prodId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from wholesale inventory?`)) {
      try {
        await deleteProductById(prodId);
        setStatusMessage(`Item "${name}" removed.`);
        setTimeout(() => setStatusMessage(null), 3000);
        onRefreshProducts();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const addImageField = () => setFormImages([...formImages, '']);
  const updateImageField = (idx: number, val: string) => {
    const next = [...formImages];
    next[idx] = val;
    setFormImages(next);
  };
  const removeImageField = (idx: number) => {
    setFormImages(formImages.filter((_, i) => i !== idx));
  };

  const addTierField = () => {
    const lastTier = formTiers[formTiers.length - 1];
    const newMin = lastTier ? (lastTier.maxQty ? lastTier.maxQty + 1 : lastTier.minQty + 50) : 10;
    setFormTiers([
      ...formTiers,
      { minQty: newMin, unitPrice: Math.max(50, (lastTier?.unitPrice || 500) - 50), label: `Tier ${formTiers.length + 1}` }
    ]);
  };
  const updateTier = (idx: number, field: keyof BulkTier, val: any) => {
    const next = [...formTiers];
    next[idx] = { ...next[idx], [field]: val };
    setFormTiers(next);
  };
  const removeTier = (idx: number) => {
    setFormTiers(formTiers.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      
      {/* Modal Dialog */}
      <div 
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-neutral-300 relative flex flex-col my-auto max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header with Bold Red / Dark styling */}
        <div className="bg-neutral-950 text-white px-6 py-4 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/30 text-red-400 flex items-center justify-center border border-red-500/50">
              <Lock className="w-4 h-4 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-base font-black font-heading tracking-wide">
                STARDOT WHOLESALE ADMIN SUITE
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                Realtime Firebase Database • Rates in ₹ INR • All-India Dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdminLoggedIn && (
              <button
                onClick={onLogout}
                className="text-xs text-neutral-300 hover:text-white px-3 py-1.5 rounded-full border border-neutral-700 hover:bg-neutral-800 transition-colors"
              >
                Exit Admin
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View 1: Hidden Login Form if not logged in */}
        {!isAdminLoggedIn ? (
          <div className="p-8 sm:p-12 max-w-md mx-auto w-full text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-xl font-black font-heading text-neutral-900">
                Staff & Admin Portal
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Enter your administrative credentials to manage bulk products, prices, and orders.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left text-xs">
              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Admin Username</label>
                <input
                  required
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Admin Password</label>
                <input
                  required
                  type="password"
                  placeholder="admin9557"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-black text-sm transition-all shadow-md mt-4"
              >
                Access Control Panel
              </button>
            </form>
          </div>
        ) : (

          /* View 2: Full Admin Dashboard */
          <div className="flex-1 overflow-hidden flex flex-col">
            
            {statusMessage && (
              <div className="bg-emerald-600 text-white text-xs px-6 py-2.5 flex items-center justify-between font-bold">
                <span>{statusMessage}</span>
                <button onClick={() => setStatusMessage(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Dashboard Subnav */}
            <div className="bg-[#fcfcfa] px-6 py-3 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab('products');
                    setIsCreatingNew(false);
                    setEditingProduct(null);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeTab === 'products' && !isCreatingNew && !editingProduct
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
                  }`}
                >
                  Wholesale Catalog ({products.length} Items)
                </button>

                <button
                  onClick={() => {
                    setActiveTab('orders');
                    setIsCreatingNew(false);
                    setEditingProduct(null);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'orders'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-red-600" />
                  <span>Transport Orders ({orders.length})</span>
                </button>
              </div>

              {activeTab === 'products' && !isCreatingNew && !editingProduct && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => seedInitialProducts(products)}
                    className="px-3 py-2 bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100 rounded-full text-xs font-semibold flex items-center gap-1.5"
                    title="Sync/Seed Indian Rupee catalog to Firebase Firestore"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Firebase</span>
                  </button>
                  <button
                    onClick={startCreateProduct}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Style</span>
                  </button>
                </div>
              )}
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              
              {(isCreatingNew || editingProduct) ? (
                <form onSubmit={handleSaveProduct} className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between border-b pb-3 border-neutral-200">
                    <div>
                      <h4 className="text-xl font-black font-heading text-neutral-900">
                        {isCreatingNew ? 'Add New Wholesale Product (₹ INR)' : `Edit: ${editingProduct?.name}`}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        Changes are saved in real-time to Firebase Firestore.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setEditingProduct(null);
                      }}
                      className="text-xs font-bold text-neutral-600 hover:text-black px-3 py-1.5 rounded-full border border-neutral-300"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-neutral-800">Product Name *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Heavyweight Fleece Hoodie 450 GSM"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-neutral-800">Category *</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none bg-white"
                      >
                        <option value="Sweaters">Sweaters & Knitwear</option>
                        <option value="Jackets">Jackets & Outerwear</option>
                        <option value="Shirts">Button-Up Shirts</option>
                        <option value="Hoodies">Heavyweight Hoodies</option>
                        <option value="Pants">Denim & Pants</option>
                        <option value="Shoes">Sneakers & Shoes</option>
                        <option value="Hats">Hats & Accessories</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-neutral-800">SKU Code *</label>
                      <input
                        required
                        type="text"
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-neutral-800">Base Wholesale Price (₹ INR) *</label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={formBasePrice}
                        onChange={(e) => setFormBasePrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-neutral-800">Minimum Order (MOQ pcs) *</label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={formMoq}
                        onChange={(e) => setFormMoq(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none font-bold text-red-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-neutral-800">Available Stock Quantity *</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={formStock}
                        onChange={(e) => setFormStock(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-neutral-800">Fabric Composition & GSM</label>
                      <input
                        type="text"
                        placeholder="e.g. 100% Combed Heavy Cotton (450 GSM)"
                        value={formMaterial}
                        onChange={(e) => setFormMaterial(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Multi-Image Direct Links Setup */}
                  <div className="bg-[#fcfcfa] p-4 rounded-2xl border border-neutral-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-red-600" />
                          Multi-Image Direct Link Setup
                        </span>
                        <p className="text-[11px] text-neutral-500">
                          Paste direct image links or pick from presets.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addImageField}
                        className="px-3 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-full text-xs font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Link</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase flex-shrink-0">Presets:</span>
                      {SAMPLE_IMAGE_PRESETS.map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            if (formImages.length === 1 && !formImages[0]) {
                              setFormImages([preset.url]);
                            } else {
                              setFormImages([...formImages, preset.url]);
                            }
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-md text-[10px] font-medium text-neutral-700 flex-shrink-0 transition-colors"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {formImages.map((imgUrl, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt=""
                              className="w-10 h-10 object-cover rounded-lg border border-neutral-300 bg-white flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-dashed border-neutral-300 bg-white flex items-center justify-center flex-shrink-0 text-neutral-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/..."
                            value={imgUrl}
                            onChange={(e) => updateImageField(idx, e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                          />
                          {formImages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeImageField(idx)}
                              className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bulk Tier Slabs in ₹ */}
                  <div className="bg-[#fcfcfa] p-4 rounded-2xl border border-neutral-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                          <TrendingDown className="w-4 h-4 text-emerald-600" />
                          Volume Slab Discount Rates (₹ INR)
                        </span>
                        <p className="text-[11px] text-neutral-500">
                          Set volume steps in Rupees to encourage 50+ and 100+ pcs purchases.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addTierField}
                        className="px-3 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-full text-xs font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Slab</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formTiers.map((tier, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border border-neutral-200">
                          <span className="text-xs font-bold text-neutral-700 w-16">Slab {idx + 1}:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-neutral-500 text-[11px]">Min Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={tier.minQty}
                              onChange={(e) => updateTier(idx, 'minQty', parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 rounded border border-neutral-300 text-center font-bold"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-neutral-500 text-[11px]">Max Qty:</span>
                            <input
                              type="number"
                              placeholder="No limit"
                              value={tier.maxQty || ''}
                              onChange={(e) => updateTier(idx, 'maxQty', e.target.value ? parseInt(e.target.value) : undefined)}
                              className="w-20 px-2 py-1 rounded border border-neutral-300 text-center"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-neutral-500 text-[11px]">Rate (₹):</span>
                            <input
                              type="number"
                              min="1"
                              value={tier.unitPrice}
                              onChange={(e) => updateTier(idx, 'unitPrice', parseFloat(e.target.value) || 1)}
                              className="w-24 px-2 py-1 rounded border border-neutral-300 text-center font-extrabold text-emerald-700"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeTier(idx)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setEditingProduct(null);
                      }}
                      className="px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-7 py-2.5 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-all flex items-center gap-2 shadow-md"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Saving to Firebase...' : 'Save Product (₹ INR)'}</span>
                    </button>
                  </div>
                </form>

              ) : activeTab === 'products' ? (

                /* Inventory items list */
                <div className="space-y-4">
                  <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden bg-white">
                    {products.map((prod) => (
                      <div key={prod.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                        
                        <div className="flex items-center gap-4">
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-14 h-16 object-cover rounded-xl bg-neutral-100 border border-neutral-200 flex-shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-sm text-neutral-900">{prod.name}</h5>
                              <span className="font-mono text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
                                {prod.sku}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-500 flex flex-wrap items-center gap-3 mt-1">
                              <span>Category: <strong className="text-neutral-800">{prod.category}</strong></span>
                              <span>•</span>
                              <span>MOQ: <strong className="text-red-600">{prod.moq} pcs</strong></span>
                              <span>•</span>
                              <span>Stock: <strong className="text-neutral-800">{prod.stock} pcs</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 justify-between sm:justify-end">
                          <div className="text-right">
                            <span className="text-base font-black text-neutral-900 font-heading">
                              ₹{prod.basePrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-neutral-400 block font-medium">per piece base</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditProduct(prod)}
                              className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                              title="Edit item"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                              title="Delete from Firebase"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

              ) : (

                /* Live Wholesale Orders List from Firebase */
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                      <Truck className="w-12 h-12 text-neutral-300 mx-auto" />
                      <h5 className="font-bold text-neutral-800 text-sm">No wholesale orders booked yet</h5>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                        Orders placed by buyers across India will appear here in real-time from Firebase.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((ord) => (
                        <div key={ord.id} className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-red-600 text-sm">{ord.orderNumber}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  {ord.status}
                                </span>
                              </div>
                              <div className="text-xs text-neutral-500 mt-0.5">
                                Ordered {new Date(ord.createdAt).toLocaleString('en-IN')} by <strong className="text-neutral-900">{ord.companyName}</strong> ({ord.customerName})
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-lg font-black text-neutral-900 font-heading">
                                ₹{ord.totalAmount.toLocaleString('en-IN')}
                              </div>
                              <span className="text-[11px] text-neutral-500 font-semibold">{ord.totalQuantity} pcs lot</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#fcfcfa] p-3 rounded-xl border border-neutral-100">
                            <div>
                              <span className="text-neutral-500 block">Mobile & Email:</span>
                              <span className="font-bold text-neutral-900">{ord.phone} • {ord.email}</span>
                            </div>
                            <div>
                              <span className="text-neutral-500 block">Destination Delivery:</span>
                              <span className="font-bold text-neutral-900">{ord.city}, {ord.state} ({ord.pincode})</span>
                            </div>
                            {ord.gstin && (
                              <div>
                                <span className="text-neutral-500 block">GSTIN:</span>
                                <span className="font-mono font-bold text-neutral-800">{ord.gstin}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-neutral-500 block">Transport Carrier:</span>
                              <span className="font-bold text-emerald-800">{ord.transportPreference || 'VRL Logistics'}</span>
                            </div>
                          </div>

                          <div className="text-xs space-y-1.5 pt-1">
                            <span className="font-bold text-neutral-800">Itemized Breakdown:</span>
                            <div className="divide-y divide-neutral-100">
                              {ord.items.map((it, idx) => (
                                <div key={idx} className="py-1.5 flex items-center justify-between text-neutral-700">
                                  <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                    <span>{it.productName} ({it.size} / {it.color})</span>
                                  </div>
                                  <div className="font-mono font-medium">
                                    {it.quantity} pcs @ ₹{it.unitPrice} = <strong>₹{it.total.toLocaleString('en-IN')}</strong>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
