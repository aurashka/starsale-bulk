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
  Truck,
  ArrowUp,
  ArrowDown,
  Tag,
  Layers,
  CheckCircle2,
  ListOrdered,
  Building2,
  Phone,
  Mail,
  FileText,
  ArrowLeft,
  Eye,
  AlertTriangle,
  Check,
  Sparkles,
  SlidersHorizontal,
  ArrowUpDown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Users,
  Search,
  Clock,
  UserCheck,
  QrCode,
  AlertCircle,
  Upload,
  Copy
} from 'lucide-react';
import { Product, WholesaleOrder, BulkTier, CategoryItem, ProductSpecCard, CompanyFooterInfo, HeroSlide, PaymentSettings } from '../types.ts';
import { 
  saveProduct, 
  deleteProductById, 
  subscribeToOrders, 
  seedInitialProducts,
  updateProductSequences,
  saveCategory,
  deleteCategoryById,
  updateOrderStatus,
  deleteOrderById,
  purgeCorruptOrders,
  isValidRealOrder,
  saveFooterInfo,
  getLocalFooterInfo,
  subscribeToHeroSlides,
  saveHeroSlide,
  deleteHeroSlideById,
  updateHeroSlideSequences,
  seedInitialHeroSlides,
  updateProductPlacements,
  getLocalHeroSlides,
  getLocalPaymentSettings,
  savePaymentSettings,
  subscribeToPaymentSettings,
  acceptOrderPayment,
  rejectOrderPayment,
  updateOrderTracking
} from '../services/dataService.ts';
import { SAMPLE_IMAGE_PRESETS, DEFAULT_FOOTER_INFO, DEFAULT_HERO_SLIDES, DEFAULT_PAYMENT_SETTINGS } from '../data/defaultProducts.ts';
import { formatPrice, formatDate } from '../utils/format.ts';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminLoggedIn: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
  products: Product[];
  categories: CategoryItem[];
  onRefreshProducts: () => void;
  footerInfo?: CompanyFooterInfo;
  onFooterUpdate?: (info: CompanyFooterInfo) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  isAdminLoggedIn,
  onLoginSuccess,
  onLogout,
  products,
  categories,
  onRefreshProducts,
  footerInfo,
  onFooterUpdate
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tabs: 'products' | 'placements' | 'hero' | 'categories' | 'orders' | 'payment' | 'footer'
  const [activeTab, setActiveTab] = useState<'products' | 'placements' | 'hero' | 'categories' | 'orders' | 'payment' | 'footer'>('products');
  const [orders, setOrders] = useState<WholesaleOrder[]>([]);

  // Payment Gateway & Freight Charge Settings State
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => getLocalPaymentSettings());
  const [isSavingPaymentSettings, setIsSavingPaymentSettings] = useState(false);
  const [copiedAdminUpi, setCopiedAdminUpi] = useState(false);
  const qrFileInputRef = React.useRef<HTMLInputElement>(null);

  // Hero Banner Slides State
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => getLocalHeroSlides());
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isCreatingSlide, setIsCreatingSlide] = useState(false);
  const [isSavingSlide, setIsSavingSlide] = useState(false);

  // Slide Form Fields
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideTag, setSlideTag] = useState('India B2B Bulk Sourcing');
  const [slideBadge, setSlideBadge] = useState('Up to 35% Bulk Margin');
  const [slideBadgeColor, setSlideBadgeColor] = useState('bg-emerald-700 text-white');
  const [slideImageUrl, setSlideImageUrl] = useState('');
  const [slideLinkedProductId, setSlideLinkedProductId] = useState<string>('');
  const [slideButtonText, setSlideButtonText] = useState('Browse Wholesale Rates');

  // List Curations & Ordering Sub-tab: 'horizontal' | 'vertical'
  const [placementTab, setPlacementTab] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isSavingPlacements, setIsSavingPlacements] = useState(false);

  // Product Editing / Creation State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Custom in-UI Delete Confirmation (Reliable in iframes without window.confirm)
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: 'product' | 'category' | 'heroSlide' | 'order';
    id: string;
    name: string;
    extraId?: string;
  } | null>(null);

  // Transport Orders State: User-Wise grouping, compact accordion rows, real orders filtering
  const [orderViewMode, setOrderViewMode] = useState<'user_wise' | 'all_latest'>('user_wise');
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [expandedBuyerKeys, setExpandedBuyerKeys] = useState<string[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [isPurgingOrders, setIsPurgingOrders] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [orderEditDrafts, setOrderEditDrafts] = useState<Record<string, {
    status?: WholesaleOrder['status'];
    bilti?: string;
    note?: string;
    carrier?: string;
    paymentNote?: string;
  }>>({});

  // Form State in ₹ INR
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Sweaters');
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [quickCategoryInput, setQuickCategoryInput] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBasePrice, setFormBasePrice] = useState(799);
  const [formMoq, setFormMoq] = useState(10);
  const [formStock, setFormStock] = useState(1000);
  const [formDescription, setFormDescription] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formColors, setFormColors] = useState<string[]>(['Charcoal', 'Bone']);
  const [customColorInput, setCustomColorInput] = useState('');
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customCommaSizesInput, setCustomCommaSizesInput] = useState('');
  const [formImages, setFormImages] = useState<string[]>(['']);
  const [formShowHorizontal, setFormShowHorizontal] = useState(true);
  const [formShowVertical, setFormShowVertical] = useState(true);
  const [formPlacement, setFormPlacement] = useState<'both' | 'horizontal' | 'vertical'>('both');
  const [formTiers, setFormTiers] = useState<BulkTier[]>([
    { minQty: 10, maxQty: 49, unitPrice: 749, label: 'Tier 1' },
    { minQty: 50, unitPrice: 650, label: 'Tier 2' }
  ]);
  const [formSpecCards, setFormSpecCards] = useState<ProductSpecCard[]>([]);
  const [formIsNew, setFormIsNew] = useState(true);
  const [formIsTrending, setFormIsTrending] = useState(false);
  const [formIsFeatured, setFormIsFeatured] = useState(false);

  // Category Manager State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Footer & Mill Info State
  const [footerData, setFooterData] = useState<CompanyFooterInfo>(footerInfo || getLocalFooterInfo());
  const [isSavingFooter, setIsSavingFooter] = useState(false);

  useEffect(() => {
    if (footerInfo) {
      setFooterData(footerInfo);
    }
  }, [footerInfo]);

  // Subscribe to Hero Slides
  useEffect(() => {
    const unsubHero = subscribeToHeroSlides((slides) => {
      setHeroSlides(slides);
    });
    return () => {
      if (typeof unsubHero === 'function') unsubHero();
    };
  }, []);

  // Subscribe to Payment Settings
  useEffect(() => {
    const unsubPay = subscribeToPaymentSettings((settings) => {
      setPaymentSettings(settings);
    });
    return () => {
      if (typeof unsubPay === 'function') unsubPay();
    };
  }, []);

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
      setLoginError('Invalid Administrator credentials. Use admin / admin9557');
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
    setFormShowHorizontal(prod.showInHorizontal !== undefined ? prod.showInHorizontal : (prod.displayPlacement !== 'vertical'));
    setFormShowVertical(prod.showInVertical !== undefined ? prod.showInVertical : (prod.displayPlacement !== 'horizontal'));
    setFormPlacement(prod.displayPlacement || 'both');
    setFormTiers(prod.bulkTiers && prod.bulkTiers.length > 0 ? [...prod.bulkTiers] : []);
    if (prod.specCards && prod.specCards.length > 0) {
      setFormSpecCards(JSON.parse(JSON.stringify(prod.specCards)));
    } else {
      setFormSpecCards([
        {
          id: `spec-${Date.now()}`,
          title: 'Fabric & Manufacturing Specs',
          items: [
            { label: 'Fabric & GSM', value: prod.material || '100% Combed Heavy Cotton (380 GSM)' },
            { label: 'Minimum Order (MOQ)', value: `${prod.moq || 10} pieces` }
          ],
          description: prod.description || ''
        }
      ]);
    }
    setFormIsNew(!!prod.isNew);
    setFormIsTrending(!!prod.isTrending);
    setFormIsFeatured(!!prod.isFeatured);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startCreateProduct = () => {
    setEditingProduct(null);
    setIsCreatingNew(true);
    setFormName('');
    setFormCategory(categories.find(c => c.id !== 'all')?.id || 'Sweaters');
    setFormSku(`STD-IN-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormBasePrice(699);
    setFormMoq(10);
    setFormStock(1000);
    setFormDescription('Heavyweight relaxed streetwear cut, bio-washed cotton, double-needle finish.');
    setFormMaterial('100% Combed Heavy Cotton (380 GSM)');
    setFormColors(['Washed Black', 'Oatmeal Taupe']);
    setFormSizes(['S', 'M', 'L', 'XL', 'XXL']);
    setFormImages(['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80']);
    setFormShowHorizontal(true);
    setFormShowVertical(true);
    setFormPlacement('both');
    setFormTiers([
      { minQty: 10, maxQty: 49, unitPrice: 649, label: 'Tier 1 (10-49 pcs)' },
      { minQty: 50, maxQty: 99, unitPrice: 589, label: 'Tier 2 (50-99 pcs)' },
      { minQty: 100, unitPrice: 499, label: 'Tier 3 (100+ pcs bulk)' }
    ]);
    setFormSpecCards([
      {
        id: `spec-${Date.now()}`,
        title: 'Fabric & Manufacturing Specs',
        items: [
          { label: 'Fabric & GSM', value: '100% Ring-Spun Cotton Denim (14.5 oz)' },
          { label: 'Minimum Order (MOQ)', value: '5 pieces' }
        ],
        description: 'Distressed vintage acid wash worker jacket. Heavy 14oz Japanese denim twill with custom antique brass hardware and reinforced double-needle stitching.'
      }
    ]);
    setFormIsNew(true);
    setFormIsTrending(true);
    setFormIsFeatured(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const cleanImages = formImages.filter(img => img.trim().length > 0);
    if (cleanImages.length === 0) {
      cleanImages.push('https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80');
    }

    const targetId = editingProduct ? editingProduct.id : `prod-${Date.now()}`;
    const targetPlacement = formShowHorizontal && formShowVertical ? 'both' : formShowHorizontal ? 'horizontal' : 'vertical';

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
      showInHorizontal: formShowHorizontal,
      showInVertical: formShowVertical,
      horizontalSequence: editingProduct?.horizontalSequence ?? (editingProduct?.sequence || products.length + 1),
      verticalSequence: editingProduct?.verticalSequence ?? (editingProduct?.sequence || products.length + 1),
      displayPlacement: targetPlacement,
      sequence: editingProduct?.sequence || products.length + 1,
      bulkTiers: formTiers,
      specCards: formSpecCards,
      isNew: formIsNew,
      isTrending: formIsTrending,
      isFeatured: formIsFeatured,
      createdAt: editingProduct?.createdAt || Date.now()
    };

    try {
      await saveProduct(productToSave);
      setStatusMessage(`Item "${productToSave.name}" successfully saved in Firebase!`);
      setTimeout(() => setStatusMessage(null), 3500);
      setIsCreatingNew(false);
      setEditingProduct(null);
      onRefreshProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Save error:', err);
      setStatusMessage('Error saving product to Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------
  // HERO SLIDE HANDLERS
  // -------------------------------------------------------------
  const startCreateSlide = () => {
    setEditingSlide(null);
    setIsCreatingSlide(true);
    setSlideTitle('Tirupur &\nSurat Rates');
    setSlideSubtitle('Direct mill prices for boutiques, retail showrooms & online brands.');
    setSlideTag('India B2B Bulk Sourcing');
    setSlideBadge('Up to 35% Bulk Margin');
    setSlideBadgeColor('bg-emerald-700 text-white');
    setSlideImageUrl('https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1800&q=80');
    setSlideLinkedProductId(products[0]?.id || '');
    setSlideButtonText('Browse Wholesale Lot');
  };

  const startEditSlide = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setIsCreatingSlide(false);
    setSlideTitle(slide.title);
    setSlideSubtitle(slide.subtitle);
    setSlideTag(slide.tag || 'India B2B Bulk Sourcing');
    setSlideBadge(slide.badge || '');
    setSlideBadgeColor(slide.badgeColor || 'bg-red-800 text-white');
    setSlideImageUrl(slide.imageUrl);
    setSlideLinkedProductId(slide.linkedProductId || '');
    setSlideButtonText(slide.buttonText || 'Browse Wholesale Rates');
  };

  const handleSaveHeroSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSlide(true);
    const targetId = editingSlide ? editingSlide.id : `hero-${Date.now()}`;
    const slideToSave: HeroSlide = {
      id: targetId,
      title: slideTitle.trim() || 'Wholesale Apparel Lots',
      subtitle: slideSubtitle.trim() || 'Direct mill pricing for registered retail brands.',
      tag: slideTag.trim() || 'India B2B Bulk Sourcing',
      badge: slideBadge.trim() || undefined,
      badgeColor: slideBadgeColor,
      imageUrl: slideImageUrl.trim() || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1800&q=80',
      linkedProductId: slideLinkedProductId.trim() || undefined,
      buttonText: slideButtonText.trim() || 'Browse Wholesale Lot',
      sequence: editingSlide?.sequence ?? (heroSlides.length + 1)
    };

    try {
      await saveHeroSlide(slideToSave);
      setStatusMessage(`Hero Banner slide "${slideToSave.title.replace(/\n/g, ' ')}" saved to Firebase!`);
      setTimeout(() => setStatusMessage(null), 3500);
      setEditingSlide(null);
      setIsCreatingSlide(false);
    } catch (err) {
      console.error('Slide save error:', err);
      setStatusMessage('Error saving hero slide.');
    } finally {
      setIsSavingSlide(false);
    }
  };

  const handleMoveHeroSlide = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= heroSlides.length) return;
    const copy = [...heroSlides];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    await updateHeroSlideSequences(copy);
    setHeroSlides(copy);
    setStatusMessage('Banner slide sequence updated!');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleResetHeroBanners = async () => {
    await seedInitialHeroSlides(DEFAULT_HERO_SLIDES);
    setHeroSlides(DEFAULT_HERO_SLIDES);
    setStatusMessage('Hero banner slides restored to defaults!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // -------------------------------------------------------------
  // PLACEMENT CURATION & SEQUENCE HANDLERS
  // -------------------------------------------------------------
  const handleToggleProductPlacement = async (productId: string, list: 'horizontal' | 'vertical') => {
    const target = products.find(p => p.id === productId);
    if (!target) return;

    if (list === 'horizontal') {
      const currentVal = target.showInHorizontal !== undefined 
        ? target.showInHorizontal 
        : (!target.displayPlacement || target.displayPlacement === 'both' || target.displayPlacement === 'horizontal');
      const nextVal = !currentVal;
      await updateProductPlacements([{ id: productId, showInHorizontal: nextVal }]);
    } else {
      const currentVal = target.showInVertical !== undefined 
        ? target.showInVertical 
        : (!target.displayPlacement || target.displayPlacement === 'both' || target.displayPlacement === 'vertical');
      const nextVal = !currentVal;
      await updateProductPlacements([{ id: productId, showInVertical: nextVal }]);
    }
    onRefreshProducts();
  };

  const handleMovePlacementOrder = async (
    activeItems: Product[],
    currentIndex: number, 
    direction: 'up' | 'down', 
    list: 'horizontal' | 'vertical'
  ) => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= activeItems.length) return;

    const copy = [...activeItems];
    const temp = copy[currentIndex];
    copy[currentIndex] = copy[targetIndex];
    copy[targetIndex] = temp;

    const updates = copy.map((p, idx) => {
      if (list === 'horizontal') {
        return { id: p.id, horizontalSequence: idx + 1 };
      } else {
        return { id: p.id, verticalSequence: idx + 1 };
      }
    });

    await updateProductPlacements(updates);
    onRefreshProducts();
    setStatusMessage(`${list === 'horizontal' ? 'Horizontal Scroller' : 'Vertical Catalog'} position updated!`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleSelectAllPlacements = async (list: 'horizontal' | 'vertical', value: boolean) => {
    setIsSavingPlacements(true);
    try {
      const updates = products.map((p, idx) => {
        if (list === 'horizontal') {
          return { id: p.id, showInHorizontal: value, horizontalSequence: idx + 1 };
        } else {
          return { id: p.id, showInVertical: value, verticalSequence: idx + 1 };
        }
      });
      await updateProductPlacements(updates);
      onRefreshProducts();
      setStatusMessage(`All products ${value ? 'selected for' : 'removed from'} ${list === 'horizontal' ? 'Horizontal Scroller' : 'Vertical Catalog'}!`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e) {
      console.error(e);
      setStatusMessage('Error updating placements.');
    } finally {
      setIsSavingPlacements(false);
    }
  };

  // Reordering Sequence via Arrows (Move Up / Move Down)
  const handleMoveProduct = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return;

    const copy = [...products];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    await updateProductSequences(copy);
    onRefreshProducts();
    setStatusMessage(`Catalog sequence updated!`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Category Management Handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const id = newCategoryName.trim().replace(/\s+/g, '-');
    await saveCategory({ id, name: newCategoryName.trim() });
    setNewCategoryName('');
    setStatusMessage(`Category "${newCategoryName}" created!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCategoryName.trim()) return;
    await saveCategory({ id, name: editingCategoryName.trim() });
    setEditingCategoryId(null);
    setEditingCategoryName('');
    setStatusMessage(`Category updated!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFooter(true);
    try {
      await saveFooterInfo(footerData);
      if (onFooterUpdate) onFooterUpdate(footerData);
      setStatusMessage('Company Profile & Mill Footer details saved to Firebase!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Footer save error:', err);
      setStatusMessage('Error saving company profile to Firebase.');
    } finally {
      setIsSavingFooter(false);
    }
  };

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage('Please select a valid image file (PNG, JPG, or WEBP).');
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage('Scanner QR image should be under 2MB.');
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPaymentSettings(prev => ({
          ...prev,
          qrCodeUrl: result
        }));
        setStatusMessage('Custom QR code scanner image uploaded! Click "Save Settings" to save to Firebase.');
        setTimeout(() => setStatusMessage(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateDynamicQr = () => {
    const upi = paymentSettings.upiId.trim();
    if (!upi) {
      setStatusMessage('Please enter a valid UPI ID (e.g. stardot.b2b@okhdfcbank) first.');
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }
    const name = paymentSettings.upiName.trim() || 'Stardot Wholesale India';
    const dynamicQr = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`upi://pay?pa=${upi}&pn=${encodeURIComponent(name)}&cu=INR`)}`;
    setPaymentSettings(prev => ({
      ...prev,
      qrCodeUrl: dynamicQr
    }));
    setStatusMessage('Generated dynamic QR Code from UPI ID! Click "Save Settings" to apply.');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleResetQrToDefault = () => {
    setPaymentSettings(prev => ({
      ...prev,
      qrCodeUrl: DEFAULT_PAYMENT_SETTINGS.qrCodeUrl
    }));
    setStatusMessage('QR Code reset to default scanner.');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPaymentSettings(true);
    try {
      await savePaymentSettings(paymentSettings);
      setStatusMessage('UPI Payment Gateway & Delivery charge setup saved to Firebase!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Payment settings save error:', err);
      setStatusMessage('Error saving payment setup to Firebase.');
    } finally {
      setIsSavingPaymentSettings(false);
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

  // -------------------------------------------------------------
  // VIEW 1: STAFF LOGIN FULL-PAGE
  // -------------------------------------------------------------
  if (!isAdminLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 bg-[#fafaf9] overflow-y-auto flex flex-col font-sans animate-in fade-in duration-200">
        <header className="bg-red-900 text-white px-4 sm:px-8 py-4 flex items-center justify-between border-b border-red-950">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-white/90 hover:text-white text-xs font-bold transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Store</span>
            </button>
            <span className="text-xs font-mono text-red-200 hidden sm:inline">• Administrative Access</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-10 shadow-xl border border-neutral-200 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-800 flex items-center justify-center mx-auto border border-red-100 shadow-xs">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black font-heading text-neutral-900">
                Staff Authentication
              </h2>
              <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                Enter your administrative credentials to manage wholesale catalog, add products, adjust sequencing, and dispatch cargo.
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-bold flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-neutral-800">Admin Username</label>
                <input
                  required
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-neutral-800">Admin Password</label>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none text-sm font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-red-800 hover:bg-red-900 text-white rounded-xl font-black text-sm transition-all shadow-md active:scale-98 mt-2"
              >
                Access Control Panel
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: DEDICATED FULL-PAGE ADD / EDIT PRODUCT WORKSPACE
  // -------------------------------------------------------------
  if (isCreatingNew || editingProduct) {
    return (
      <div className="fixed inset-0 z-50 bg-[#fafaf9] overflow-y-auto flex flex-col font-sans animate-in fade-in duration-200">
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(false);
                setEditingProduct(null);
              }}
              className="flex items-center gap-2 p-2 -ml-2 rounded-xl text-neutral-700 hover:text-red-800 hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-900" />
              <span className="text-xs font-bold text-neutral-800 hidden sm:inline">Back to Products</span>
            </button>
            <div className="h-5 w-px bg-neutral-200 hidden sm:block" />
            <div>
              <h1 className="text-sm sm:text-base font-black font-heading text-neutral-900">
                {isCreatingNew ? 'Add New Wholesale Product' : `Edit: ${editingProduct?.name || formName}`}
              </h1>
              <p className="text-[11px] text-neutral-500 font-mono">
                {formSku} • Category: {formCategory} • Base Rate: ₹{formatPrice(formBasePrice)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(false);
                setEditingProduct(null);
              }}
              className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={isSaving}
              className="px-5 sm:px-6 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Product (₹)'}</span>
            </button>
          </div>
        </header>

        {/* Status Toast */}
        {statusMessage && (
          <div className="bg-emerald-700 text-white text-xs px-6 py-2.5 flex items-center justify-between font-bold shadow-xs">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Full-Width Responsive Form Container */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32 flex-1">
          <form onSubmit={handleSaveProduct} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 8 Columns: Details, Pricing, Sizing, Colors, Fabrics, Spec Cards, Slabs */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Card 1: Core Specifications */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-xs space-y-5">
                <div className="border-b border-neutral-100 pb-3">
                  <h3 className="text-sm font-black font-heading text-neutral-900 uppercase tracking-wide">
                    1. Product Identity & Category
                  </h3>
                  <p className="text-xs text-neutral-500">Title, SKU code, category assignment, and catalog placement.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-neutral-800">Product Style Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Heavyweight Loopback Fleece Hoodie 450 GSM"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-neutral-800">Wholesale Category *</label>
                      <button
                        type="button"
                        onClick={() => setShowQuickAddCategory(!showQuickAddCategory)}
                        className="text-[11px] font-bold text-red-800 hover:text-red-900"
                      >
                        {showQuickAddCategory ? 'Close' : '+ New Category'}
                      </button>
                    </div>

                    {showQuickAddCategory ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Category name..."
                          value={quickCategoryInput}
                          onChange={(e) => setQuickCategoryInput(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-red-800 focus:outline-none text-xs"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!quickCategoryInput.trim()) return;
                            const newId = quickCategoryInput.trim().replace(/\s+/g, '-');
                            await saveCategory({ id: newId, name: quickCategoryInput.trim() });
                            setFormCategory(newId);
                            setQuickCategoryInput('');
                            setShowQuickAddCategory(false);
                            setStatusMessage(`Category "${quickCategoryInput.trim()}" added & selected!`);
                            setTimeout(() => setStatusMessage(null), 2500);
                          }}
                          className="px-3 py-2 bg-red-800 text-white rounded-xl font-bold text-xs hover:bg-red-900"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none bg-white font-medium"
                      >
                        {categories.filter(c => c.id !== 'all').map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-800">SKU Code *</label>
                    <input
                      required
                      type="text"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2 pt-2 border-t border-neutral-100">
                    <label className="font-bold text-neutral-800 block text-xs">
                      Storefront List Placements (Selective Display) *
                    </label>
                    <p className="text-[11px] text-neutral-500">
                      Choose which storefront lists this product will appear in.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        formShowHorizontal ? 'border-red-800 bg-red-50/40 text-neutral-900' : 'border-neutral-200 bg-white text-neutral-600'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formShowHorizontal}
                          onChange={(e) => setFormShowHorizontal(e.target.checked)}
                          className="mt-0.5 rounded text-red-800 focus:ring-red-800"
                        />
                        <div>
                          <span className="font-bold text-xs block">Horizontal Product Scroller</span>
                          <span className="text-[11px] text-neutral-500 leading-tight block">
                            Top spotlight carousel on storefront
                          </span>
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        formShowVertical ? 'border-red-800 bg-red-50/40 text-neutral-900' : 'border-neutral-200 bg-white text-neutral-600'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formShowVertical}
                          onChange={(e) => setFormShowVertical(e.target.checked)}
                          className="mt-0.5 rounded text-red-800 focus:ring-red-800"
                        />
                        <div>
                          <span className="font-bold text-xs block">Vertical Catalog Grid</span>
                          <span className="text-[11px] text-neutral-500 leading-tight block">
                            Main full-width category inventory grid
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Pricing, Minimum Order & Inventory */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-xs space-y-5">
                <div className="border-b border-neutral-100 pb-3">
                  <h3 className="text-sm font-black font-heading text-neutral-900 uppercase tracking-wide">
                    2. Wholesale Pricing & Inventory (₹ INR)
                  </h3>
                  <p className="text-xs text-neutral-500">Base wholesale rate per unit, minimum order quantity, and warehouse stock.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-800">Base Price (₹ INR) *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formBasePrice}
                      onChange={(e) => setFormBasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none font-extrabold text-neutral-900 text-sm"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none font-extrabold text-red-800 text-sm"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Screen-Friendly Flexible Sizing Grid */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-xs space-y-4 text-xs">
                <div className="border-b border-neutral-100 pb-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-black font-heading text-neutral-900 uppercase tracking-wide">
                      3. Sizing Grid & Custom Sizes (Screen-Friendly)
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Write custom sizes (XL, XXL, 28, 30, Free Size) or batch add with commas.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                    {formSizes.length} sizes active
                  </span>
                </div>

                {/* Active Sizes Chips with Remove (X) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-700 block text-[11px]">Active Sizing Chips:</label>
                  <div className="flex flex-wrap gap-2 min-h-[44px] p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 items-center">
                    {formSizes.length === 0 ? (
                      <span className="text-neutral-400 text-xs italic">No sizes selected. Use presets or type custom sizes below.</span>
                    ) : (
                      formSizes.map((sz, szIdx) => (
                        <span
                          key={`${sz}-${szIdx}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-bold font-mono shadow-2xs"
                        >
                          <span>{sz}</span>
                          <button
                            type="button"
                            onClick={() => setFormSizes(formSizes.filter(s => s !== sz))}
                            className="w-4 h-4 rounded-full hover:bg-red-800 flex items-center justify-center transition-colors text-white/80 hover:text-white"
                            title={`Remove ${sz}`}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Presets: Alpha & Numbers */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase">Standard Sizes:</span>
                    {['S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          if (formSizes.includes(sz)) {
                            setFormSizes(formSizes.filter(s => s !== sz));
                          } else {
                            setFormSizes([...formSizes, sz]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                          formSizes.includes(sz)
                            ? 'bg-red-800 text-white border-red-800'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase">Waist / Numbers:</span>
                    {['28', '30', '32', '34', '36', '38', '40', '42'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          if (formSizes.includes(num)) {
                            setFormSizes(formSizes.filter(s => s !== num));
                          } else {
                            setFormSizes([...formSizes, num]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                          formSizes.includes(num)
                            ? 'bg-red-800 text-white border-red-800'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom manual inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Type single size (e.g. 4XL, 44, Large)"
                      value={customSizeInput}
                      onChange={(e) => setCustomSizeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = customSizeInput.trim();
                          if (val && !formSizes.includes(val)) {
                            setFormSizes([...formSizes, val]);
                            setCustomSizeInput('');
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white focus:outline-none focus:border-red-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = customSizeInput.trim();
                        if (val && !formSizes.includes(val)) {
                          setFormSizes([...formSizes, val]);
                          setCustomSizeInput('');
                        }
                      }}
                      className="px-3.5 py-2 bg-neutral-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-colors"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Or batch add comma separated (e.g. 28, 30, 32, 34)"
                      value={customCommaSizesInput}
                      onChange={(e) => setCustomCommaSizesInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const parts = customCommaSizesInput.split(',').map(s => s.trim()).filter(Boolean);
                          const combined = Array.from(new Set([...formSizes, ...parts]));
                          setFormSizes(combined);
                          setCustomCommaSizesInput('');
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white focus:outline-none focus:border-red-800 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const parts = customCommaSizesInput.split(',').map(s => s.trim()).filter(Boolean);
                        const combined = Array.from(new Set([...formSizes, ...parts]));
                        setFormSizes(combined);
                        setCustomCommaSizesInput('');
                      }}
                      className="px-3.5 py-2 bg-red-800 text-white rounded-xl font-bold text-xs hover:bg-red-900 transition-colors"
                    >
                      Add Batch
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 4: Colors Palette */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-xs space-y-4 text-xs">
                <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black font-heading text-neutral-900 uppercase tracking-wide">
                      4. Colors & Colorways
                    </h3>
                    <p className="text-xs text-neutral-500">Pick standard apparel hues or type custom fabric dye names.</p>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                    {formColors.length} colors
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 items-center min-h-[44px]">
                  {formColors.map((col, colIdx) => (
                    <span
                      key={`${col}-${colIdx}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-xs font-semibold"
                    >
                      <span>{col}</span>
                      <button
                        type="button"
                        onClick={() => setFormColors(formColors.filter(c => c !== col))}
                        className="w-4 h-4 rounded-full hover:bg-red-800 flex items-center justify-center text-white/80 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-neutral-500">Presets:</span>
                  {['Charcoal', 'Bone', 'Washed Black', 'Vintage White', 'Olive', 'Navy', 'Ash Grey'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        if (!formColors.includes(c)) setFormColors([...formColors, c]);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700"
                    >
                      + {c}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type custom color name (e.g. Acid Taupe, Sage Green)"
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customColorInput.trim() && !formColors.includes(customColorInput.trim())) {
                          setFormColors([...formColors, customColorInput.trim()]);
                          setCustomColorInput('');
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white focus:outline-none focus:border-red-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customColorInput.trim() && !formColors.includes(customColorInput.trim())) {
                        setFormColors([...formColors, customColorInput.trim()]);
                        setCustomColorInput('');
                      }
                    }}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-xl font-bold text-xs hover:bg-black"
                  >
                    + Add Color
                  </button>
                </div>
              </div>

              {/* Card 5: Fabric, Fit & Product Details */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-xs space-y-4 text-xs">
                <div className="border-b border-neutral-100 pb-3">
                  <h3 className="text-sm font-black font-heading text-neutral-900 uppercase tracking-wide">
                    5. Fabric Specifications & Product Details
                  </h3>
                  <p className="text-xs text-neutral-500">Material composition, weight GSM, and silhouette description.</p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Fabric Composition, Weight & GSM *</label>
                  <input
                    type="text"
                    placeholder="e.g. 100% Combed Heavy Cotton (380 GSM Heavyweight)"
                    value={formMaterial}
                    onChange={(e) => setFormMaterial(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Detailed Product Description & Sourcing Notes *</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none text-xs leading-relaxed"
                    placeholder="Heavyweight relaxed streetwear cut, bio-washed cotton, double-needle finish..."
                  />
                </div>
              </div>

              {/* Card 6: Dynamic Specification & Technical Cards */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-xs space-y-5 text-xs">
                <div className="border-b border-neutral-100 pb-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-black font-heading text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-800" />
                      6. Custom Technical Cards ({formSpecCards.length})
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Add customized cards (Fabric & GSM, MOQ, Weave, Rich Text fit notes) shown on the product detail page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormSpecCards([
                        ...formSpecCards,
                        {
                          id: `spec-${Date.now()}`,
                          title: 'Fabric & Manufacturing Specs',
                          items: [
                            { label: 'Fabric & GSM', value: formMaterial || '100% Cotton Denim (14.5 oz)' },
                            { label: 'Minimum Order (MOQ)', value: `${formMoq} pieces` }
                          ],
                          description: formDescription || ''
                        }
                      ]);
                    }}
                    className="px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Technical Card</span>
                  </button>
                </div>

                {formSpecCards.length === 0 ? (
                  <div className="p-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-300 text-center text-neutral-400">
                    No custom technical cards added. Click "+ Add Technical Card" to create dedicated Fabric, Care, or Packaging specs cards.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {formSpecCards.map((card, cardIdx) => (
                      <div key={card.id || cardIdx} className="bg-neutral-50 p-4 sm:p-5 rounded-2xl border border-neutral-200 space-y-4">
                        
                        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                              Card Title #{cardIdx + 1}
                            </label>
                            <input
                              type="text"
                              value={card.title}
                              onChange={(e) => {
                                const copy = [...formSpecCards];
                                copy[cardIdx] = { ...copy[cardIdx], title: e.target.value };
                                setFormSpecCards(copy);
                              }}
                              placeholder="e.g. Fabric & Manufacturing Specs"
                              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 font-bold text-xs focus:border-red-800 focus:outline-none bg-white"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setFormSpecCards(formSpecCards.filter((_, i) => i !== cardIdx));
                            }}
                            className="p-2 text-neutral-400 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors mt-4"
                            title="Delete this card"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Key-Value Specification Rows */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-neutral-700">Specification Pairs (Label : Value)</span>
                            <button
                              type="button"
                              onClick={() => {
                                const copy = [...formSpecCards];
                                copy[cardIdx] = {
                                  ...copy[cardIdx],
                                  items: [...(copy[cardIdx].items || []), { label: '', value: '' }]
                                };
                                setFormSpecCards(copy);
                              }}
                              className="text-[11px] font-bold text-red-800 hover:text-red-900"
                            >
                              + Add Spec Row
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(card.items || []).map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Label (e.g. Fabric & GSM)"
                                  value={item.label}
                                  onChange={(e) => {
                                    const copy = [...formSpecCards];
                                    const currentItems = copy[cardIdx].items ? [...copy[cardIdx].items!] : [];
                                    currentItems[itemIdx] = { ...currentItems[itemIdx], label: e.target.value };
                                    copy[cardIdx] = { ...copy[cardIdx], items: currentItems };
                                    setFormSpecCards(copy);
                                  }}
                                  className="w-1/3 px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white focus:border-red-800 focus:outline-none"
                                />
                                <span className="text-neutral-400 font-bold">:</span>
                                <input
                                  type="text"
                                  placeholder="Value (e.g. 100% Ring-Spun Cotton Denim (14.5 oz))"
                                  value={item.value}
                                  onChange={(e) => {
                                    const copy = [...formSpecCards];
                                    const currentItems = copy[cardIdx].items ? [...copy[cardIdx].items!] : [];
                                    currentItems[itemIdx] = { ...currentItems[itemIdx], value: e.target.value };
                                    copy[cardIdx] = { ...copy[cardIdx], items: currentItems };
                                    setFormSpecCards(copy);
                                  }}
                                  className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white focus:border-red-800 focus:outline-none font-medium"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const copy = [...formSpecCards];
                                    const currentItems = copy[cardIdx].items ? [...copy[cardIdx].items!] : [];
                                    copy[cardIdx] = {
                                      ...copy[cardIdx],
                                      items: currentItems.filter((_, i) => i !== itemIdx)
                                    };
                                    setFormSpecCards(copy);
                                  }}
                                  className="p-2 text-neutral-400 hover:text-red-800 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Description / Rich notes for this card */}
                        <div className="space-y-1 pt-1">
                          <label className="text-[11px] font-bold text-neutral-700 block">
                            Card Paragraph / Technical Notes (Rich Text)
                          </label>
                          <textarea
                            rows={2}
                            value={card.description}
                            onChange={(e) => {
                              const copy = [...formSpecCards];
                              copy[cardIdx] = { ...copy[cardIdx], description: e.target.value };
                              setFormSpecCards(copy);
                            }}
                            placeholder="e.g. Distressed vintage acid wash worker jacket. Heavy 14oz Japanese denim twill with custom antique brass hardware..."
                            className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white focus:border-red-800 focus:outline-none"
                          />
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 7: Bulk Volume Slabs */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-xs space-y-4 text-xs">
                <div className="border-b border-neutral-100 pb-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-black font-heading text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-emerald-700" />
                      7. Volume Slab Discount Rates (₹ INR)
                    </h3>
                    <p className="text-xs text-neutral-500">Tiered bulk rates in Rupees based on order quantity.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addTierField}
                    className="px-3.5 py-1.5 bg-neutral-900 text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs hover:bg-black"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Slab</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formTiers.map((tier, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                      <span className="text-xs font-bold text-neutral-700 w-16">Slab {idx + 1}:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-500 text-[11px]">Min Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={tier.minQty}
                          onChange={(e) => updateTier(idx, 'minQty', parseInt(e.target.value) || 1)}
                          className="w-20 px-2.5 py-1.5 rounded-lg border border-neutral-300 text-center font-bold bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-500 text-[11px]">Max Qty:</span>
                        <input
                          type="number"
                          placeholder="No limit"
                          value={tier.maxQty || ''}
                          onChange={(e) => updateTier(idx, 'maxQty', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-neutral-300 text-center bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-500 text-[11px]">Unit Rate (₹):</span>
                        <input
                          type="number"
                          min="1"
                          value={tier.unitPrice}
                          onChange={(e) => updateTier(idx, 'unitPrice', parseFloat(e.target.value) || 1)}
                          className="w-28 px-2.5 py-1.5 rounded-lg border border-neutral-300 text-center font-black text-red-800 bg-white"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeTier(idx)}
                        className="p-1.5 text-neutral-400 hover:text-red-800 ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right 4 Columns: Sticky Gallery, Presets, Badges, and Live Buyer Preview */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
              
              {/* Multi-Image Direct Links */}
              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black font-heading text-neutral-900 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-red-800" />
                      Product Images ({formImages.filter(i => i.trim()).length})
                    </h3>
                    <p className="text-[11px] text-neutral-500">Paste direct image links or pick from presets.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addImageField}
                    className="px-3 py-1 bg-neutral-900 text-white rounded-full text-xs font-bold hover:bg-black"
                  >
                    + Add Link
                  </button>
                </div>

                {/* Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
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
                        className="px-2 py-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md text-[10px] font-semibold text-neutral-700 transition-colors"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image List */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto no-scrollbar">
                  {formImages.map((imgUrl, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt=""
                          className="w-12 h-12 object-cover rounded-xl border border-neutral-300 bg-neutral-50 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center flex-shrink-0 text-neutral-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={imgUrl}
                        onChange={(e) => updateImageField(idx, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none text-xs"
                      />
                      {formImages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageField(idx)}
                          className="p-1.5 text-neutral-400 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges & Flags */}
              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-3 text-xs">
                <div className="border-b border-neutral-100 pb-2">
                  <h4 className="font-bold text-neutral-900">Merchandising Flags</h4>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsNew}
                      onChange={(e) => setFormIsNew(e.target.checked)}
                      className="w-4 h-4 rounded text-red-800 focus:ring-red-800 border-neutral-300"
                    />
                    <span className="font-medium text-neutral-800">Mark as New Season Style</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsTrending}
                      onChange={(e) => setFormIsTrending(e.target.checked)}
                      className="w-4 h-4 rounded text-red-800 focus:ring-red-800 border-neutral-300"
                    />
                    <span className="font-medium text-neutral-800">Hot Sourcing / Trending</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsFeatured}
                      onChange={(e) => setFormIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-red-800 focus:ring-red-800 border-neutral-300"
                    />
                    <span className="font-medium text-neutral-800">Featured in Top Highlights</span>
                  </label>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-neutral-600" />
                    Wholesale Card Preview
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">Live</span>
                </div>

                <div className="bg-[#fafaf9] rounded-xl overflow-hidden border border-neutral-200">
                  <div className="aspect-[4/5] bg-neutral-100 relative overflow-hidden">
                    <img
                      src={formImages[0] || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=400&q=80'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {formIsNew && (
                        <span className="bg-red-800 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                          New
                        </span>
                      )}
                      {formIsTrending && (
                        <span className="bg-neutral-900 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Hot
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <span className="text-[10px] text-neutral-500 font-mono">{formSku}</span>
                    <h5 className="font-bold text-xs text-neutral-900 line-clamp-1">
                      {formName || 'Wholesale Style Name'}
                    </h5>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="font-black text-sm text-neutral-900 font-heading">
                        ₹{formatPrice(formBasePrice)}
                      </span>
                      <span className="text-[10px] text-red-800 font-bold">MOQ: {formMoq} pcs</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </form>
        </div>

        {/* Floating Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
          <div className="text-xs text-neutral-500 hidden sm:flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Active SKU: <strong>{formSku}</strong> • Rates in ₹ INR • Synced with Firebase</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(false);
                setEditingProduct(null);
              }}
              className="px-5 py-2.5 rounded-full border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={isSaving}
              className="px-7 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-full text-xs font-black flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving to Firebase...' : 'Save Product (₹ INR)'}</span>
            </button>
          </div>
        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: FULL-PAGE ADMIN SUITE DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-[#fafaf9] overflow-y-auto flex flex-col font-sans animate-in fade-in duration-200">
      
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-red-900 text-white border-b border-red-950 shadow-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
            title="Return to Wholesale Store"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Store</span>
          </button>
          <div className="h-4 w-px bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black font-heading tracking-wide">
                STARDOT WHOLESALE ADMIN SUITE
              </h2>
              <p className="text-[10px] text-red-200 font-mono hidden sm:block">
                Firebase Realtime Database • Rates in ₹ INR • Full-Screen Manager
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onLogout}
            className="text-xs text-white/80 hover:text-white px-3 py-1.5 rounded-full border border-white/30 hover:bg-white/10 transition-colors"
          >
            Exit Admin
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Status Notice Toast */}
      {statusMessage && (
        <div className="bg-emerald-700 text-white text-xs px-6 py-2.5 flex items-center justify-between font-bold shadow-xs">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Subnavigation Bar */}
      <div className="bg-white border-b border-neutral-200 sticky top-14 z-30 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'products'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Catalog Products ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('placements')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'placements'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>List Curations & Order</span>
            </button>

            <button
              onClick={() => setActiveTab('hero')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'hero'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Top Scroller ({heroSlides.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'categories'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Category Manager ({categories.length - 1})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Transport Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('payment')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'payment'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>UPI & Freight Setup</span>
            </button>

            <button
              onClick={() => setActiveTab('footer')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'footer'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Footer & Mill Profile</span>
            </button>
          </div>

          {/* Quick Actions per Tab */}
          {activeTab === 'products' && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => seedInitialProducts(products)}
                className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-200"
                title="Sync/Seed catalog to Firebase"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Firebase</span>
              </button>
              <button
                onClick={startCreateProduct}
                className="px-5 py-2 bg-red-800 hover:bg-red-900 text-white rounded-full text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Style</span>
              </button>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setPaymentSettings(DEFAULT_PAYMENT_SETTINGS);
                  setStatusMessage('Reset to default UPI settings. Click Save to persist.');
                  setTimeout(() => setStatusMessage(null), 3500);
                }}
                className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-200"
                title="Restore default UPI and freight settings"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleResetHeroBanners}
                className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-200"
                title="Restore default hero slides"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore Defaults</span>
              </button>
              <button
                onClick={startCreateSlide}
                className="px-5 py-2 bg-red-800 hover:bg-red-900 text-white rounded-full text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Hero Slide</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-28 flex-1">
        
        {/* TAB 1: PRODUCTS INVENTORY CATALOG */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
              <div>
                <h3 className="text-base font-black font-heading text-neutral-900">
                  Wholesale Products Inventory
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Reorder sequence using Up (↑) / Down (↓) arrows. Click pencil to edit or trash to delete with confirmation.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200">
                  Total: {products.length} Styles
                </span>
                <button
                  onClick={startCreateProduct}
                  className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Products List Table / Cards */}
            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              {products.map((prod, index) => (
                <div 
                  key={prod.id || `prod-${index}`} 
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/70 transition-colors"
                >
                  
                  <div className="flex items-center gap-3.5">
                    {/* Sequence Ordering Arrows */}
                    <div className="flex flex-col gap-1 items-center bg-neutral-100 p-1.5 rounded-xl border border-neutral-200 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveProduct(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-neutral-600 hover:text-red-800 disabled:opacity-20 hover:bg-white rounded transition-colors"
                        title="Move Up in sequence"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-bold font-mono text-neutral-800">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMoveProduct(index, 'down')}
                        disabled={index === products.length - 1}
                        className="p-1 text-neutral-600 hover:text-red-800 disabled:opacity-20 hover:bg-white rounded transition-colors"
                        title="Move Down in sequence"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-14 h-16 object-cover rounded-xl bg-neutral-100 border border-neutral-200 flex-shrink-0 shadow-2xs"
                    />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-neutral-900">{prod.name}</h4>
                        <span className="font-mono text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-bold">
                          {prod.sku}
                        </span>
                        {prod.isNew && (
                          <span className="text-[9px] font-bold uppercase bg-red-50 text-red-800 border border-red-200 px-1.5 py-0.5 rounded">
                            New
                          </span>
                        )}
                        {prod.isTrending && (
                          <span className="text-[9px] font-bold uppercase bg-neutral-900 text-white px-1.5 py-0.5 rounded">
                            Hot
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-neutral-500 flex flex-wrap items-center gap-2">
                        <span>Category: <strong className="text-neutral-800">{prod.category}</strong></span>
                        <span>•</span>
                        <span>MOQ: <strong className="text-red-800 font-bold">{prod.moq} pcs</strong></span>
                        <span>•</span>
                        <span>Stock: <strong className="text-neutral-800">{prod.stock}</strong></span>
                        <span>•</span>
                        <span>Placement: <strong className="text-neutral-800 capitalize">{prod.displayPlacement || 'both'}</strong></span>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {(prod.sizes || []).map((s, sIdx) => (
                          <span key={`${prod.id || index}-sz-${s}-${sIdx}`} className="text-[10px] font-mono bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right side actions and pricing */}
                  <div className="flex items-center gap-4 justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100">
                    <div className="text-left md:text-right">
                      <span className="text-base font-black text-neutral-900 font-heading">
                        ₹{formatPrice(prod?.basePrice)}
                      </span>
                      <span className="text-[10px] text-neutral-400 block font-medium">base rate / pc</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditProduct(prod)}
                        className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
                        title="Edit product"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirmState({ isOpen: true, type: 'product', id: prod.id, name: prod.name })}
                        className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 transition-colors flex items-center gap-1.5 text-xs font-bold"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: LIST CURATIONS & SEQUENCING (HORIZONTAL & VERTICAL) */}
        {activeTab === 'placements' && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-black font-heading text-neutral-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-red-800" />
                  <span>Curated Storefront Lists & Position Ordering</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Select precisely which products appear in the top Horizontal Scroller and Vertical Catalog, and arrange their sequence with Up/Down arrows.
                </p>
              </div>

              {/* Sub-tab toggle buttons */}
              <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200 self-start md:self-auto">
                <button
                  onClick={() => setPlacementTab('horizontal')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    placementTab === 'horizontal'
                      ? 'bg-red-800 text-white shadow-xs'
                      : 'text-neutral-700 hover:text-black hover:bg-neutral-200/60'
                  }`}
                >
                  <span>Horizontal Scroller</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    placementTab === 'horizontal' ? 'bg-red-950/60 text-white' : 'bg-neutral-200 text-neutral-700 font-mono'
                  }`}>
                    {products.filter(p => p.showInHorizontal !== undefined ? p.showInHorizontal : (!p.displayPlacement || p.displayPlacement === 'both' || p.displayPlacement === 'horizontal')).length}
                  </span>
                </button>

                <button
                  onClick={() => setPlacementTab('vertical')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    placementTab === 'vertical'
                      ? 'bg-red-800 text-white shadow-xs'
                      : 'text-neutral-700 hover:text-black hover:bg-neutral-200/60'
                  }`}
                >
                  <span>Vertical Catalog Grid</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    placementTab === 'vertical' ? 'bg-red-950/60 text-white' : 'bg-neutral-200 text-neutral-700 font-mono'
                  }`}>
                    {products.filter(p => p.showInVertical !== undefined ? p.showInVertical : (!p.displayPlacement || p.displayPlacement === 'both' || p.displayPlacement === 'vertical')).length}
                  </span>
                </button>
              </div>
            </div>

            {/* Active Placement List Section */}
            {(() => {
              const isHorizontal = placementTab === 'horizontal';
              const activeList = products
                .filter(p => isHorizontal
                  ? (p.showInHorizontal !== undefined ? p.showInHorizontal : (!p.displayPlacement || p.displayPlacement === 'both' || p.displayPlacement === 'horizontal'))
                  : (p.showInVertical !== undefined ? p.showInVertical : (!p.displayPlacement || p.displayPlacement === 'both' || p.displayPlacement === 'vertical'))
                )
                .sort((a, b) => isHorizontal
                  ? (a.horizontalSequence ?? a.sequence ?? 999) - (b.horizontalSequence ?? b.sequence ?? 999)
                  : (a.verticalSequence ?? a.sequence ?? 999) - (b.verticalSequence ?? b.sequence ?? 999)
                );

              const inactiveList = products.filter(p => !activeList.some(a => a.id === p.id));

              return (
                <div className="space-y-6">
                  {/* Controls Bar */}
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-800">
                        {isHorizontal ? 'Horizontal Scroller' : 'Vertical Catalog'}:
                      </span>
                      <span className="font-mono bg-white border border-neutral-200 px-2.5 py-1 rounded-lg text-red-800 font-black">
                        {activeList.length} of {products.length} Products Active
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectAllPlacements(placementTab, true)}
                        disabled={isSavingPlacements}
                        className="px-3.5 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 rounded-xl font-bold transition-all"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => handleSelectAllPlacements(placementTab, false)}
                        disabled={isSavingPlacements}
                        className="px-3.5 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 rounded-xl font-bold transition-all"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>

                  {/* Active Curated Sequence List */}
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
                      <div>
                        <h4 className="font-black font-heading text-neutral-900 text-sm">
                          Active Display Sequence ({activeList.length})
                        </h4>
                        <p className="text-[11px] text-neutral-500">
                          These items appear on the storefront in the exact sequence shown below. Use the Up/Down arrows to shift positions.
                        </p>
                      </div>
                    </div>

                    {activeList.length === 0 ? (
                      <div className="p-12 text-center text-xs text-neutral-500 space-y-2">
                        <p className="font-bold text-neutral-700">No products currently selected for this list.</p>
                        <p>Check the box next to any product in the list below to include it.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {activeList.map((prod, idx) => (
                          <div key={prod.id || `active-${idx}`} className="p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-neutral-50/80 transition-colors">
                            
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Sequence Badge */}
                              <span className="w-7 h-7 rounded-xl bg-red-800 text-white font-mono font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                                #{idx + 1}
                              </span>

                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={() => handleToggleProductPlacement(prod.id, placementTab)}
                                className="rounded text-red-800 focus:ring-red-800 w-4 h-4 cursor-pointer"
                                title="Uncheck to remove from this list"
                              />

                              {/* Product Thumbnail */}
                              <img
                                src={prod?.images?.[0] || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=200&q=80'}
                                alt={prod?.name || 'Product'}
                                className="w-11 h-11 rounded-xl object-cover bg-neutral-100 border border-neutral-200 flex-shrink-0"
                              />

                              {/* Product Info */}
                              <div className="min-w-0">
                                <h5 className="font-bold text-xs text-neutral-900 truncate">
                                  {prod?.name || 'Unnamed Product'}
                                </h5>
                                <p className="text-[11px] text-neutral-500 font-mono">
                                  {prod?.sku || 'SKU'} • {prod?.category || 'General'} • <strong className="text-red-800 font-bold">₹{formatPrice(prod?.basePrice)}</strong> (MOQ {prod?.moq ?? 1} pcs)
                                </p>
                              </div>
                            </div>

                            {/* Up / Down Arrow Position Controls */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleMovePlacementOrder(activeList, idx, 'up', placementTab)}
                                disabled={idx === 0}
                                className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 disabled:opacity-30 disabled:pointer-events-none text-neutral-700 flex items-center justify-center transition-all"
                                title="Move Up in sequence"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleMovePlacementOrder(activeList, idx, 'down', placementTab)}
                                disabled={idx === activeList.length - 1}
                                className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 disabled:opacity-30 disabled:pointer-events-none text-neutral-700 flex items-center justify-center transition-all"
                                title="Move Down in sequence"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inactive Products (Available to Add) */}
                  {inactiveList.length > 0 && (
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
                        <div>
                          <h4 className="font-black font-heading text-neutral-900 text-sm">
                            Available to Include ({inactiveList.length})
                          </h4>
                          <p className="text-[11px] text-neutral-500">
                            Click the checkbox or "+ Include" to activate these styles in the {isHorizontal ? 'Horizontal Scroller' : 'Vertical Catalog'}.
                          </p>
                        </div>
                      </div>

                      <div className="divide-y divide-neutral-100">
                        {inactiveList.map((prod, inIdx) => (
                          <div key={prod.id || `inactive-${inIdx}`} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-neutral-50/80 transition-colors opacity-75 hover:opacity-100">
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={false}
                                onChange={() => handleToggleProductPlacement(prod.id, placementTab)}
                                className="rounded text-red-800 focus:ring-red-800 w-4 h-4 cursor-pointer"
                                title="Check to include in this list"
                              />

                              <img
                                src={prod?.images?.[0] || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=200&q=80'}
                                alt={prod?.name || 'Product'}
                                className="w-10 h-10 rounded-xl object-cover bg-neutral-100 border border-neutral-200 flex-shrink-0 filter grayscale-50"
                              />

                              <div className="min-w-0">
                                <h5 className="font-bold text-xs text-neutral-800 truncate">
                                  {prod?.name || 'Unnamed Product'}
                                </h5>
                                <p className="text-[11px] text-neutral-500 font-mono">
                                  {prod?.sku || 'SKU'} • {prod?.category || 'General'} • ₹{formatPrice(prod?.basePrice)}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleToggleProductPlacement(prod.id, placementTab)}
                              className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-red-800 hover:text-white text-neutral-700 text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Include</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: TOP IMAGE SCROLLER (HERO BANNERS) */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-black font-heading text-neutral-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-red-800" />
                  <span>Top Image Scroller (Hero Banners)</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Edit revolving hero slides, promotional titles, and attach pre-added catalog products with custom 'Browse Lot' buttons.
                </p>
              </div>

              <button
                onClick={startCreateSlide}
                className="px-5 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md active:scale-95 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Hero Slide</span>
              </button>
            </div>

            {/* Hero Slides List */}
            <div className="space-y-4">
              {heroSlides.map((slide, idx) => {
                const linkedProd = slide.linkedProductId ? products.find(p => p.id === slide.linkedProductId) : undefined;

                return (
                  <div key={slide.id || `slide-${idx}`} className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Sequence Order & Position Arrows */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                        <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white font-mono font-black text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleMoveHeroSlide(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-neutral-100 disabled:opacity-20 text-neutral-600 transition-colors"
                            title="Move slide earlier"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveHeroSlide(idx, 'down')}
                            disabled={idx === heroSlides.length - 1}
                            className="p-1 rounded hover:bg-neutral-100 disabled:opacity-20 text-neutral-600 transition-colors"
                            title="Move slide later"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Slide Preview Image */}
                      <div className="relative w-36 h-24 sm:w-44 sm:h-28 rounded-xl overflow-hidden bg-neutral-900 flex-shrink-0 border border-neutral-200">
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          className="w-full h-full object-cover brightness-90"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/70 text-white backdrop-blur-xs font-mono">
                          Slide {idx + 1}
                        </span>
                      </div>

                      {/* Slide Details */}
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                            {slide.tag || 'B2B Sourcing'}
                          </span>
                          {slide.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200">
                              {slide.badge}
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-black font-heading text-neutral-900 whitespace-pre-line leading-tight">
                          {slide.title}
                        </h4>
                        <p className="text-xs text-neutral-500 line-clamp-2">
                          {slide.subtitle}
                        </p>

                        {/* Linked Pre-added Product Info */}
                        <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                          {linkedProd ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Linked Product: {linkedProd.name} (SKU: {linkedProd.sku} • ₹{formatPrice(linkedProd.basePrice)})</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-400 font-mono">
                              • No product linked (Browses general catalog)
                            </span>
                          )}

                          <span className="text-[11px] text-neutral-500 font-mono">
                            Button: "{slide.buttonText || 'Browse Wholesale Rates'}"
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                      <button
                        onClick={() => startEditSlide(slide)}
                        className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Slide</span>
                      </button>

                      <button
                        onClick={() => setDeleteConfirmState({
                          isOpen: true,
                          type: 'heroSlide',
                          id: slide.id,
                          name: slide.title.replace(/\n/g, ' ')
                        })}
                        className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Hero Slide Add / Edit Modal */}
            {(isCreatingSlide || editingSlide) && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 my-8 space-y-6 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                    <div>
                      <h3 className="text-lg font-black font-heading text-neutral-900">
                        {editingSlide ? 'Edit Hero Banner Slide' : 'Add New Hero Banner Slide'}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Configure headline, imagery, and optionally link a pre-added wholesale product.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsCreatingSlide(false);
                        setEditingSlide(null);
                      }}
                      className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveHeroSlide} className="space-y-4 text-xs">
                    
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-800">Slide Headline Title *</label>
                      <textarea
                        required
                        rows={2}
                        value={slideTitle}
                        onChange={(e) => setSlideTitle(e.target.value)}
                        placeholder="e.g. 450 GSM\nFleece Lots"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none font-bold text-sm"
                      />
                      <p className="text-[10px] text-neutral-400">Press enter for line breaks in the title.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-neutral-800">Subtitle / Tagline *</label>
                      <input
                        required
                        type="text"
                        value={slideSubtitle}
                        onChange={(e) => setSlideSubtitle(e.target.value)}
                        placeholder="Direct mill prices for boutiques, retail showrooms & online brands."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-800">Top Pill Tag</label>
                        <input
                          type="text"
                          value={slideTag}
                          onChange={(e) => setSlideTag(e.target.value)}
                          placeholder="e.g. India B2B Bulk Sourcing"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-neutral-800">Highlight Badge Text</label>
                        <input
                          type="text"
                          value={slideBadge}
                          onChange={(e) => setSlideBadge(e.target.value)}
                          placeholder="e.g. Up to 35% Bulk Margin"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* PRE-ADDED PRODUCT LINK SELECTION */}
                    <div className="space-y-2 p-4 bg-red-50/50 rounded-2xl border border-red-100">
                      <label className="font-bold text-neutral-900 block text-xs">
                        Attach Pre-Added Catalog Product (Direct Browse Action)
                      </label>
                      <p className="text-[11px] text-neutral-600 leading-tight">
                        When a buyer clicks this hero slide or browse button, it will directly open this product's full wholesale view!
                      </p>

                      <select
                        value={slideLinkedProductId}
                        onChange={(e) => {
                          const pid = e.target.value;
                          setSlideLinkedProductId(pid);
                          if (pid) {
                            const match = products.find(p => p.id === pid);
                            if (match && (!slideButtonText || slideButtonText === 'Browse Wholesale Rates')) {
                              setSlideButtonText(`Browse Lot (₹${match.basePrice})`);
                            }
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none bg-white font-medium text-xs"
                      >
                        <option value="">-- None (Generic Catalog Action) --</option>
                        {products.map((p, pIdx) => (
                          <option key={p.id || `opt-prod-${pIdx}`} value={p.id}>
                            {p.name} — SKU: {p.sku} • ₹{formatPrice(p.basePrice)} (MOQ {p.moq})
                          </option>
                        ))}
                      </select>

                      {slideLinkedProductId && (
                        (() => {
                          const sel = products.find(p => p.id === slideLinkedProductId);
                          if (!sel) return null;
                          return (
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-red-200 mt-2">
                              <img
                                src={sel.images[0]}
                                alt={sel.name}
                                className="w-12 h-12 rounded-lg object-cover border border-neutral-200"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-xs text-neutral-900 block truncate">{sel.name}</span>
                                <span className="text-[11px] text-neutral-500 font-mono">
                                  SKU: {sel.sku} • Base Rate: ₹{formatPrice(sel.basePrice)} • MOQ: {sel.moq} pcs
                                </span>
                              </div>
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                Linked
                              </span>
                            </div>
                          );
                        })()
                      )}
                    </div>

                    {/* Custom Browse Button Text */}
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-800">Browse Button Text *</label>
                      <input
                        required
                        type="text"
                        value={slideButtonText}
                        onChange={(e) => setSlideButtonText(e.target.value)}
                        placeholder="e.g. Browse Wholesale Lot, View Denim Lot, Order Now"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none font-bold"
                      />
                    </div>

                    {/* Background Image URL with preset picker */}
                    <div className="space-y-2">
                      <label className="font-bold text-neutral-800">Background Image URL *</label>
                      <input
                        required
                        type="url"
                        value={slideImageUrl}
                        onChange={(e) => setSlideImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none font-mono text-[11px]"
                      />

                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className="text-[11px] font-bold text-neutral-500">Pick Preset:</span>
                        {SAMPLE_IMAGE_PRESETS.slice(0, 5).map((preset, prIdx) => (
                          <button
                            key={`${preset.url}-${prIdx}`}
                            type="button"
                            onClick={() => setSlideImageUrl(preset.url)}
                            className="px-2.5 py-1 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-[11px] text-neutral-700 font-medium"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingSlide(false);
                          setEditingSlide(null);
                        }}
                        className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingSlide}
                        className="px-6 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl font-black shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSavingSlide ? 'Saving...' : 'Save Banner Slide'}</span>
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: CATEGORY MANAGER */}
        {activeTab === 'categories' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
              <h3 className="text-base font-black font-heading text-neutral-900">
                Category Manager
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Create new wholesale categories or edit/delete pre-created categories. Changes apply immediately to storefront and product filters.
              </p>
            </div>

            {/* Add New Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                required
                type="text"
                placeholder="Enter new category name (e.g. Ethnic Streetwear, Oversized Polos)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none text-xs bg-white shadow-2xs font-medium"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </form>

            {/* Existing Categories List */}
            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              {categories.map((cat, catIdx) => (
                <div key={cat.id || `cat-${catIdx}`} className="p-4 flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors">
                  {editingCategoryId === cat.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-red-800 text-xs focus:outline-none font-bold"
                      />
                      <button
                        onClick={() => handleUpdateCategory(cat.id)}
                        className="px-4 py-2 bg-red-800 text-white text-xs font-bold rounded-xl"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCategoryId(null)}
                        className="px-3 py-2 border border-neutral-300 text-neutral-600 text-xs font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Tag className="w-4 h-4 text-red-800" />
                        <span className="text-xs font-bold text-neutral-900">{cat.name}</span>
                        {cat.id === 'all' && (
                          <span className="text-[10px] font-mono bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded">
                            Default Root
                          </span>
                        )}
                      </div>

                      {cat.id !== 'all' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingCategoryId(cat.id);
                              setEditingCategoryName(cat.name);
                            }}
                            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold flex items-center gap-1"
                            title="Edit category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmState({ isOpen: true, type: 'category', id: cat.id, name: cat.name })}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 text-xs font-bold flex items-center gap-1"
                            title="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TRANSPORT ORDERS & BILTI TRACKING */}
        {activeTab === 'orders' && (() => {
          // 1. Filter out empty, corrupt, or deleted demo orders
          const realOrders = orders
            .filter(isValidRealOrder)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

          // 2. Search & Status filter
          const filteredOrders = realOrders.filter(ord => {
            const q = orderSearchQuery.toLowerCase().trim();
            const matchQuery = !q || 
              (ord.orderNumber && ord.orderNumber.toLowerCase().includes(q)) ||
              (ord.customerName && ord.customerName.toLowerCase().includes(q)) ||
              (ord.companyName && ord.companyName.toLowerCase().includes(q)) ||
              (ord.phone && ord.phone.includes(q)) ||
              (ord.city && ord.city.toLowerCase().includes(q)) ||
              (ord.trackingBiltiNumber && ord.trackingBiltiNumber.toLowerCase().includes(q)) ||
              (ord.trackingTicketId && ord.trackingTicketId.toLowerCase().includes(q));

            const matchStatus = orderStatusFilter === 'all' || ord.status === orderStatusFilter;
            return matchQuery && matchStatus;
          });

          // 3. User-Wise Grouping
          interface BuyerGroup {
            key: string;
            userId: string;
            customerName: string;
            companyName: string;
            phone: string;
            email: string;
            city: string;
            orders: WholesaleOrder[];
            totalSpent: number;
            totalPieces: number;
            latestOrderDate: number;
          }

          const buyerGroups: BuyerGroup[] = [];
          const buyerMap = new Map<string, BuyerGroup>();

          filteredOrders.forEach(ord => {
            const cleanPhone10 = (ord.phone || '').replace(/\D/g, '').slice(-10);
            const resolvedUid = ord.userId || (cleanPhone10 ? `usr_${cleanPhone10}` : 'usr_guest');
            const key = resolvedUid;

            if (!buyerMap.has(key)) {
              const newGroup: BuyerGroup = {
                key,
                userId: resolvedUid,
                customerName: ord.customerName || 'Direct Buyer',
                companyName: ord.companyName || 'Retail Store',
                phone: ord.phone || '',
                email: ord.email || '',
                city: ord.city || '',
                orders: [],
                totalSpent: 0,
                totalPieces: 0,
                latestOrderDate: ord.createdAt || 0
              };
              buyerMap.set(key, newGroup);
              buyerGroups.push(newGroup);
            }

            const g = buyerMap.get(key)!;
            g.orders.push(ord);
            g.totalSpent += (ord.totalAmount || 0);
            g.totalPieces += (ord.totalQuantity || 0);
            if ((ord.createdAt || 0) > g.latestOrderDate) {
              g.latestOrderDate = ord.createdAt || 0;
            }
          });

          // Sort buyer groups by their latest order date (newest buyer at top)
          buyerGroups.sort((a, b) => b.latestOrderDate - a.latestOrderDate);

          // Within each group, sort orders strictly latest top
          buyerGroups.forEach(g => {
            g.orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          });

          const toggleOrderExpand = (orderId: string) => {
            setExpandedOrderIds(prev => 
              prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
            );
          };

          const toggleBuyerExpand = (key: string) => {
            setExpandedBuyerKeys(prev => 
              prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
            );
          };

          const handlePurgeOrders = async () => {
            setIsPurgingOrders(true);
            try {
              const purged = await purgeCorruptOrders();
              setStatusMessage(purged > 0 ? `Cleaned ${purged} corrupt/empty orders.` : 'No empty or corrupt orders found.');
              setTimeout(() => setStatusMessage(null), 3500);
            } catch (err) {
              console.error(err);
              setStatusMessage('Error purging corrupt orders.');
            } finally {
              setIsPurgingOrders(false);
            }
          };

          const getDraft = (ord: WholesaleOrder) => {
            return orderEditDrafts[ord.id] || {
              status: ord.status || 'Pending Review',
              bilti: ord.trackingBiltiNumber || '',
              note: ord.statusNote || '',
              carrier: ord.trackingCarrier || ''
            };
          };

          const updateDraft = (ordId: string, patch: Partial<{ status: WholesaleOrder['status']; bilti: string; note: string; carrier: string }>) => {
            setOrderEditDrafts(prev => ({
              ...prev,
              [ordId]: {
                ...(prev[ordId] || {}),
                ...patch
              }
            }));
          };

          const handleSaveOrderStatus = async (ord: WholesaleOrder) => {
            const draft = getDraft(ord);
            const newStatus = draft.status || ord.status || 'Pending Review';
            const biltiVal = draft.bilti !== undefined ? draft.bilti.trim() : (ord.trackingBiltiNumber || '');
            const noteVal = draft.note !== undefined ? draft.note.trim() : (ord.statusNote || '');

            let step = 1;
            if (newStatus === 'Pending Review' || newStatus === 'Payment Verification') step = 1;
            else if (newStatus === 'Confirmed') step = 2;
            else if (newStatus === 'Dispatched') step = 3;
            else if (newStatus === 'Out for Delivery') step = 4;
            else if (newStatus === 'Delivered') step = 5;
            else if (newStatus === 'Delivery Attempted') step = 6;
            else if (newStatus === 'Rejected') step = 0;

            const carrierVal = draft.carrier !== undefined ? draft.carrier.trim() : (ord.trackingCarrier || '');

            setSavingOrderId(ord.id);
            try {
              await updateOrderStatus(ord.id, newStatus, step, biltiVal, noteVal, ord.userId, carrierVal);
              setOrders(prev => prev.map(o => o.id === ord.id ? {
                ...o,
                status: newStatus,
                trackingStep: step,
                trackingBiltiNumber: biltiVal,
                statusNote: noteVal,
                updatedAt: Date.now()
              } : o));
              setStatusMessage(`Order ${ord.orderNumber} updated in-place to "${newStatus}"!`);
              setTimeout(() => setStatusMessage(null), 3500);
            } catch (err) {
              console.error(err);
              setStatusMessage('Error saving order updates.');
            } finally {
              setSavingOrderId(null);
            }
          };

          // Render a single compact order row (expandable)
          const renderCompactOrderRow = (ord: WholesaleOrder) => {
            const isExpanded = expandedOrderIds.includes(ord.id);
            const draft = getDraft(ord);
            const isSavingThis = savingOrderId === ord.id;

            return (
              <div 
                key={ord.id} 
                className={`bg-white border rounded-2xl transition-all overflow-hidden ${
                  isExpanded ? 'border-red-300 ring-2 ring-red-100 shadow-md' : 'border-neutral-200 hover:border-neutral-300 shadow-xs'
                }`}
              >
                {/* Compact Row Header Bar - Click to Expand */}
                <div 
                  onClick={() => toggleOrderExpand(ord.id)}
                  className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-neutral-50/70 transition-colors select-none"
                >
                  {/* Left: Chevron + Order # + Date/Time + Buyer Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOrderExpand(ord.id);
                      }}
                      className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center flex-shrink-0 transition-transform"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-red-800" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-xs text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-300 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-emerald-700" />
                          <span>Ticket #{ord.trackingTicketId || `TRK-${(ord.orderNumber || '').replace(/[^0-9]/g, '')}`}</span>
                        </span>
                        <span className="font-mono font-black text-xs sm:text-sm text-red-900 bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-200">
                          {ord.orderNumber}
                        </span>
                        
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{formatDate(ord.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className="font-black text-neutral-900">
                          {ord.customerName || 'Valued Buyer'}
                        </span>
                        {ord.companyName && ord.companyName !== ord.customerName && (
                          <span className="text-neutral-500 truncate max-w-[180px]">
                            • {ord.companyName}
                          </span>
                        )}
                        {ord.phone && (
                          <a 
                            href={`tel:${ord.phone}`} 
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-neutral-600 hover:text-red-700 bg-neutral-100 px-2 py-0.5 rounded-md text-[11px]"
                          >
                            📞 {ord.phone}
                          </a>
                        )}
                        {ord.city && (
                          <span className="text-neutral-500 text-[11px]">
                            📍 {ord.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity + Amount + Status Badge + Quick Delete */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 flex-shrink-0">
                    <div className="text-left md:text-right">
                      <div className="text-sm sm:text-base font-black text-neutral-900 font-heading">
                        ₹{formatPrice(ord.totalAmount)}
                      </div>
                      <span className="text-[11px] font-bold text-neutral-500 font-mono">
                        {ord.totalQuantity ?? 0} pcs
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      ord.status === 'Rejected'
                        ? 'bg-red-50 text-red-900 border-red-300'
                        : ord.status === 'Delivery Attempted'
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : ord.status === 'Delivered'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : ord.status === 'Dispatched'
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        : ord.status === 'Confirmed'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                    }`}>
                      {ord.status || 'Pending Review'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmState({
                          isOpen: true,
                          type: 'order',
                          id: ord.id,
                          name: `Order ${ord.orderNumber} (${ord.customerName})`,
                          extraId: ord.userId
                        });
                      }}
                      className="p-1.5 text-neutral-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Permanently delete order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* EXPANDED INNER SYSTEM - Shown on Click */}
                {isExpanded && (
                  <div className="border-t border-neutral-200 bg-[#fbfbfa] p-4 sm:p-6 space-y-5 animate-in fade-in duration-150">
                    
                    {/* Consignment Overview Banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
                      <div className="space-y-0.5">
                        <span className="text-neutral-400 block text-[11px] uppercase font-bold tracking-wider">Buyer & Contact:</span>
                        <div className="font-bold text-neutral-900">{ord.customerName} ({ord.companyName || 'B2B Retailer'})</div>
                        <div className="text-neutral-700 font-mono">{ord.phone}</div>
                        <div className="text-neutral-500 truncate">{ord.email}</div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-neutral-400 block text-[11px] uppercase font-bold tracking-wider">Destination Godown:</span>
                        <div className="font-bold text-neutral-900">{ord.city}, {ord.state} ({ord.pincode})</div>
                        <div className="text-neutral-700 leading-relaxed">{ord.shippingAddress}</div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-neutral-400 block text-[11px] uppercase font-bold tracking-wider">Transport & GST:</span>
                        <div className="font-bold text-neutral-800">{ord.transportPreference || 'VRL Logistics Road Freight'}</div>
                        <div className="text-neutral-600 font-mono">GSTIN: {ord.gstin || 'Unregistered'}</div>
                        {ord.notes && (
                          <div className="text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-1">
                            Note: {ord.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Consignment Lot Breakdown */}
                    <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                        <span className="font-black text-neutral-900 text-xs">
                          Consignment Lots ({ord.items?.length || 0} Products • {ord.totalQuantity} Units):
                        </span>
                        <span className="text-xs font-mono font-bold text-red-700">
                          Total Value: ₹{formatPrice(ord.totalAmount)}
                        </span>
                      </div>

                      <div className="divide-y divide-neutral-100">
                        {(ord.items || []).map((item, itIdx) => (
                          <div key={item.productId ? `${item.productId}-${itIdx}` : `item-${itIdx}`} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              {item.image && (
                                <img 
                                  src={item.image} 
                                  alt={item.productName} 
                                  className="w-10 h-12 object-cover rounded-lg bg-neutral-100 border border-neutral-200 flex-shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-neutral-900 truncate">{item.productName}</div>
                                <div className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5">
                                  <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700 font-bold">{item.size}</span>
                                  <span>•</span>
                                  <span>{item.color}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right font-mono text-xs flex-shrink-0">
                              <span className="text-neutral-500">{item.quantity} pcs × ₹{formatPrice(item.unitPrice)} = </span>
                              <strong className="text-neutral-900">₹{formatPrice(item.total)}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Active Message Note Banner if present */}
                    {ord.statusNote && (
                      <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                        ord.status === 'Rejected'
                          ? 'bg-red-50 border-red-200 text-red-950'
                          : ord.status === 'Delivery Attempted'
                          ? 'bg-amber-50 border-amber-200 text-amber-950'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                      }`}>
                        <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-800" />
                        <div>
                          <span className="font-bold block">Current Message Note Visible to Buyer:</span>
                          <span className="text-xs">{ord.statusNote}</span>
                        </div>
                      </div>
                    )}

                    {/* IN-PLACE Status, Tracing ID & Custom Note Controller */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-300 space-y-4 text-xs shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2.5">
                        <span className="font-black text-neutral-900 flex items-center gap-2 text-xs sm:text-sm">
                          <Truck className="w-4 h-4 text-red-800" />
                          <span>Update Status, Tracing Bilti & Custom Message Note:</span>
                        </span>
                        <span className="text-[11px] font-mono font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                          In-place Firebase Sync (No Duplication)
                        </span>
                      </div>

                      {/* Status + Bilti ID Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-neutral-700 block text-[11px]">Consignment Status *</label>
                          <select
                            value={draft.status || ord.status || 'Pending Review'}
                            onChange={(e) => updateDraft(ord.id, { status: e.target.value as WholesaleOrder['status'] })}
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold bg-white focus:outline-none focus:border-red-800 shadow-xs"
                          >
                            <option value="Pending Review">Pending Review (Step 1)</option>
                            <option value="Payment Verification">Payment Verification (Step 1)</option>
                            <option value="Confirmed">Confirmed & Packing (Step 2)</option>
                            <option value="Dispatched">Dispatched / Road Cargo (Step 3)</option>
                            <option value="Out for Delivery">Out for Delivery to Godown (Step 4)</option>
                            <option value="Delivered">Delivered to Godown (Step 5)</option>
                            <option value="Delivery Attempted">Delivery Attempted (Step 6)</option>
                            <option value="Rejected">Rejected / Cancelled</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-neutral-700 block text-[11px]">Tracing ID / Bilti LR No.</label>
                          <input
                            type="text"
                            value={draft.bilti !== undefined ? draft.bilti : (ord.trackingBiltiNumber || '')}
                            onChange={(e) => updateDraft(ord.id, { bilti: e.target.value })}
                            placeholder="e.g. VRL-BLT-9201 / DEL-AWB-88219"
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs font-mono bg-white focus:outline-none focus:border-red-800 font-bold shadow-xs"
                          />
                        </div>
                      </div>

                      {/* Custom Message Note for Buyer */}
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-700 flex items-center justify-between text-[11px]">
                          <span>Custom Message Note for Buyer (e.g. Rejection reason, Delivery attempt note, Dispatch update)</span>
                          <span className="text-neutral-400 font-normal">Shows in buyer profile</span>
                        </label>
                        <input
                          type="text"
                          value={draft.note !== undefined ? draft.note : (ord.statusNote || '')}
                          onChange={(e) => updateDraft(ord.id, { note: e.target.value })}
                          placeholder="Type custom note for buyer..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:outline-none focus:border-red-800 font-medium shadow-xs"
                        />
                      </div>

                      {/* Quick Presets + Save In-Place Action */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              updateDraft(ord.id, {
                                status: 'Delivery Attempted',
                                note: 'Delivery attempted: Destination godown was unreachable/closed. Re-attempt scheduled.'
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition-all"
                          >
                            + Quick Delivery Attempted
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateDraft(ord.id, {
                                status: 'Rejected',
                                note: 'Consignment rejected: Address unverified or stock shortage at mill.'
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 text-[11px] font-bold transition-all"
                          >
                            + Quick Rejected
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateDraft(ord.id, {
                                status: 'Dispatched',
                                note: 'Goods handed over to transport carrier. Bilti generated.'
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold transition-all"
                          >
                            + Mark Dispatched
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateDraft(ord.id, {
                                status: 'Out for Delivery',
                                note: 'Parcel arrived at local godown. Out for delivery to buyer shop.'
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 text-[11px] font-bold transition-all"
                          >
                            + Out for Delivery
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateDraft(ord.id, {
                                status: 'Delivered',
                                note: 'Parcel safely delivered and handed over at buyer shop/godown.'
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold transition-all"
                          >
                            + Mark Delivered
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteConfirmState({
                                isOpen: true,
                                type: 'order',
                                id: ord.id,
                                name: `Order ${ord.orderNumber}`,
                                extraId: ord.userId
                              });
                            }}
                            className="px-3.5 py-2.5 rounded-xl border border-neutral-300 hover:border-red-600 text-neutral-600 hover:text-red-700 text-xs font-bold transition-colors"
                          >
                            Delete
                          </button>

                          <button
                            type="button"
                            disabled={isSavingThis}
                            onClick={() => handleSaveOrderStatus(ord)}
                            className="px-5 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 disabled:opacity-50 active:scale-95"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSavingThis ? 'Saving in-place...' : 'Save & Sync to Firebase'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          };

          return (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Toolbar & Header */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black font-heading text-neutral-900 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-red-800" />
                    <span>Transport Cargo & Wholesale Orders</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Real orders organized user-wise with latest orders at top. Click any order row to expand details, update status or tracking.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Purge Ghost/Corrupt Orders Button */}
                  <button
                    type="button"
                    disabled={isPurgingOrders}
                    onClick={handlePurgeOrders}
                    className="px-3 py-1.5 rounded-xl border border-neutral-300 hover:border-red-600 text-neutral-600 hover:text-red-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                    title="Clean corrupted, empty, or ghost orders"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPurgingOrders ? 'animate-spin' : ''}`} />
                    <span>{isPurgingOrders ? 'Cleaning...' : 'Clean Empty/Ghost Orders'}</span>
                  </button>

                  <span className="text-xs font-mono font-bold text-neutral-700 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200">
                    {realOrders.length} Real Orders ({buyerGroups.length} Buyers)
                  </span>
                </div>
              </div>

              {/* View Switcher & Search Bar */}
              <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                
                {/* View Switcher: User-Wise vs All Orders */}
                <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setOrderViewMode('user_wise')}
                    className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                      orderViewMode === 'user_wise'
                        ? 'bg-white text-red-900 shadow-xs font-black'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>User-Wise (Buyer Grouped)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderViewMode('all_latest')}
                    className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                      orderViewMode === 'all_latest'
                        ? 'bg-white text-red-900 shadow-xs font-black'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>All Orders (Latest Top)</span>
                  </button>
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Search buyer, phone, order #, city..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-red-800 text-xs"
                    />
                  </div>

                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold focus:outline-none focus:border-red-800"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Payment Verification">Payment Verification (Pending)</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Delivery Attempted">Delivery Attempted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

              </div>

              {/* Order Content */}
              {filteredOrders.length === 0 ? (
                <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-neutral-200 shadow-xs">
                  <Truck className="w-14 h-14 text-neutral-300 mx-auto" />
                  <h4 className="font-bold text-neutral-800 text-sm">No real transport orders match your search</h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    New buyer bookings will automatically appear here in real-time from Firebase.
                  </p>
                </div>
              ) : orderViewMode === 'user_wise' ? (
                
                /* VIEW MODE 1: USER-WISE GROUPED */
                <div className="space-y-4">
                  {buyerGroups.map((group) => {
                    const isBuyerExpanded = !expandedBuyerKeys.includes(group.key); // Expanded by default

                    return (
                      <div 
                        key={group.key}
                        className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden transition-all"
                      >
                        {/* Buyer Header Banner */}
                        <div 
                          onClick={() => toggleBuyerExpand(group.key)}
                          className="p-4 sm:p-5 bg-gradient-to-r from-[#fbfbfa] to-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-neutral-100/70 select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-900 font-black font-heading flex items-center justify-center text-sm border border-red-200 flex-shrink-0">
                              {(group.customerName || 'U').slice(0, 1).toUpperCase()}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-black text-sm sm:text-base text-neutral-900">
                                    {group.customerName}
                                  </h4>
                                  <span className="font-mono font-bold text-[10px] bg-red-100 text-red-950 px-2 py-0.5 rounded border border-red-200">
                                    User ID: {group.userId}
                                  </span>
                                </div>
                                {group.companyName && (
                                  <span className="text-xs text-neutral-500 font-semibold">
                                    • {group.companyName}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-neutral-500 flex flex-wrap items-center gap-2 mt-0.5">
                                {group.phone && <span className="font-mono text-neutral-700">📞 {group.phone}</span>}
                                {group.city && <span>• 📍 {group.city}</span>}
                                <span>• Latest: {formatDate(group.latestOrderDate)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-200">
                            <div className="text-left sm:text-right">
                              <span className="text-xs font-mono font-black text-red-900 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200 block">
                                {group.orders.length} {group.orders.length === 1 ? 'Order' : 'Orders'}
                              </span>
                              <span className="text-[11px] font-bold text-neutral-600 block mt-0.5 font-mono">
                                Total ₹{formatPrice(group.totalSpent)} • {group.totalPieces} pcs
                              </span>
                            </div>

                            <div className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-500">
                              {isBuyerExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Buyer's Orders (Latest on top) */}
                        {isBuyerExpanded && (
                          <div className="p-3 sm:p-4 bg-neutral-50/50 space-y-3">
                            {group.orders.map(renderCompactOrderRow)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              ) : (

                /* VIEW MODE 2: FLAT ALL ORDERS (LATEST ON TOP) */
                <div className="space-y-3">
                  {filteredOrders.map(renderCompactOrderRow)}
                </div>

              )}

            </div>
          );
        })()}

        {/* TAB 4: FOOTER & MILL PROFILE */}
        {activeTab === 'footer' && (
          <form onSubmit={handleSaveFooter} className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black font-heading text-neutral-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-red-800" />
                  Company Profile & Mill Footer Customization
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Edit wholesale hubs, buyer facilities, contact desk, GST compliance, and footer details saved in Firebase.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFooterData(DEFAULT_FOOTER_INFO)}
                className="text-xs font-bold text-neutral-600 hover:text-red-800 px-4 py-2 rounded-xl border border-neutral-300 hover:border-red-800 transition-colors"
              >
                Reset Defaults
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Brand Name</label>
                  <input
                    type="text"
                    value={footerData.brandTitle || ''}
                    onChange={(e) => setFooterData({ ...footerData, brandTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-bold focus:border-red-800 focus:outline-none"
                    placeholder="STARDOT"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Tagline / Subtitle</label>
                  <input
                    type="text"
                    value={footerData.brandSubtitle || ''}
                    onChange={(e) => setFooterData({ ...footerData, brandSubtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none"
                    placeholder="B2B INDIA"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-neutral-800">Industrial Mill & B2B Bio</label>
                  <textarea
                    rows={3}
                    value={footerData.aboutText || ''}
                    onChange={(e) => setFooterData({ ...footerData, aboutText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none leading-relaxed"
                    placeholder="Industrial B2B textile & apparel manufacturing supplier. Serving streetwear brands, boutiques, and retail chains across India."
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-red-800" />
                    B2B Contact Desk
                  </label>
                  <input
                    type="text"
                    value={footerData.b2bPhone || ''}
                    onChange={(e) => setFooterData({ ...footerData, b2bPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-mono focus:border-red-800 focus:outline-none font-bold"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-red-800" />
                    Wholesale Email Support
                  </label>
                  <input
                    type="email"
                    value={footerData.supportEmail || ''}
                    onChange={(e) => setFooterData({ ...footerData, supportEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none"
                    placeholder="support@stardot.in"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Support Hours</label>
                  <input
                    type="text"
                    value={footerData.supportHours || ''}
                    onChange={(e) => setFooterData({ ...footerData, supportHours: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none"
                    placeholder="Mon - Sat: 9:00 AM - 8:00 PM IST"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">GSTIN Registration</label>
                  <input
                    type="text"
                    value={footerData.gstin || ''}
                    onChange={(e) => setFooterData({ ...footerData, gstin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-mono focus:border-red-800 focus:outline-none uppercase font-bold"
                    placeholder="27AABCS9821R1Z8"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-neutral-800">HSN Tariff Code</label>
                  <input
                    type="text"
                    value={footerData.hsnCode || ''}
                    onChange={(e) => setFooterData({ ...footerData, hsnCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-mono focus:border-red-800 focus:outline-none font-bold"
                    placeholder="6109 / 6203 Apparel"
                  />
                </div>

                {/* Wholesale Hubs list */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-neutral-800 flex items-center justify-between">
                    <span>Wholesale Hubs & Warehouses (One entry per line)</span>
                    <span className="text-[10px] text-neutral-400 font-normal">{(footerData.wholesaleHubs || []).length} locations</span>
                  </label>
                  <textarea
                    rows={5}
                    value={(footerData.wholesaleHubs || []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      setFooterData({ ...footerData, wholesaleHubs: lines });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-mono focus:border-red-800 focus:outline-none leading-relaxed"
                    placeholder="Tirupur Knitwear Mill Dispatch&#10;Surat Fabric & Denim Yards&#10;Ludhiana Winter Fleece Facility&#10;Mumbai & Delhi-NCR Godowns&#10;Bengaluru & Hyderabad Cargo"
                  />
                </div>

                {/* Buyer Facilities list */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-neutral-800 flex items-center justify-between">
                    <span>Buyer Facilities & Mill Benefits (One entry per line)</span>
                    <span className="text-[10px] text-neutral-400 font-normal">{(footerData.buyerFacilities || []).length} facilities</span>
                  </label>
                  <textarea
                    rows={5}
                    value={(footerData.buyerFacilities || []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      setFooterData({ ...footerData, buyerFacilities: lines });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-mono focus:border-red-800 focus:outline-none leading-relaxed"
                    placeholder="Fabric Swatch Sample Books&#10;Custom Relabeling & Neck Tags&#10;Multi-Tier Bulk Slab Rates (₹)&#10;Direct Mill Pricing Guarantee&#10;Pallet & Master Carton Packing"
                  />
                </div>

                {/* Footer bottom legal text */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-neutral-800">Footer Bottom Copyright & Dispatch Disclaimer</label>
                  <input
                    type="text"
                    value={footerData.bottomCopyrightText || ''}
                    onChange={(e) => setFooterData({ ...footerData, bottomCopyrightText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:border-red-800 focus:outline-none font-medium"
                    placeholder="Stardot Wholesale India Pvt. Ltd. All rates in Indian Rupees (₹ INR) for registered trade buyers."
                  />
                </div>

              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingFooter}
                  className="px-8 py-3 bg-red-800 text-white rounded-xl font-black text-xs hover:bg-red-900 transition-all flex items-center gap-2 shadow-md active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingFooter ? 'Saving to Firebase...' : 'Save Profile & Mill Footer'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 5: UPI PAYMENT GATEWAY & FREIGHT LOGISTICS SETUP */}
        {activeTab === 'payment' && (
          <form onSubmit={handleSavePaymentSettings} className="space-y-6 max-w-5xl mx-auto">
            {/* Hidden File Input for QR Image Upload */}
            <input
              type="file"
              ref={qrFileInputRef}
              onChange={handleQrFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Top Header Card */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black font-heading text-neutral-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-red-800" />
                  UPI Payment Gateway & Freight Logistics Setup
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Admin panel se UPI ID aur QR Code scanner ko customize karein, freight delivery fees set karein, aur Cash on Delivery (COD) advance token manage karein.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentSettings(DEFAULT_PAYMENT_SETTINGS);
                    setStatusMessage('Settings reset to default. Click Save to persist.');
                    setTimeout(() => setStatusMessage(null), 3500);
                  }}
                  className="text-xs font-bold text-neutral-600 hover:text-red-800 px-3.5 py-2 rounded-xl border border-neutral-300 hover:border-red-800 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </div>

            {/* Main 2-Column Section: UPI & QR Setup vs Live Customer Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. UPI ID & Merchant Name */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-red-800" />
                      Merchant UPI ID & Payee Name
                    </h4>
                    <span className="text-[10px] bg-red-50 text-red-800 font-bold px-2 py-0.5 rounded-full border border-red-100">
                      Live Gateway Sync
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-neutral-800">
                          Merchant UPI ID / VPA <span className="text-red-800">*</span>
                        </label>
                        {paymentSettings.upiId && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(paymentSettings.upiId);
                              setCopiedAdminUpi(true);
                              setTimeout(() => setCopiedAdminUpi(false), 2000);
                            }}
                            className="text-[11px] font-bold text-red-800 hover:text-red-900 flex items-center gap-1"
                          >
                            {copiedAdminUpi ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Test Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={paymentSettings.upiId || ''}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, upiId: e.target.value.trim() })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-mono font-bold focus:border-red-800 focus:outline-none"
                        placeholder="e.g. stardot.b2b@okhdfcbank or 9876543210@paytm"
                        required
                      />
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Yeh UPI ID checkout par QR code ke niche show hogi jise user copy karke kisi bhi app se pay kar sakta hai.
                      </p>
                    </div>

                    <div>
                      <label className="font-bold text-neutral-800 block mb-1">
                        Business / Payee Display Name <span className="text-red-800">*</span>
                      </label>
                      <input
                        type="text"
                        value={paymentSettings.upiName || ''}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, upiName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-medium focus:border-red-800 focus:outline-none"
                        placeholder="e.g. Stardot Wholesale India Pvt Ltd"
                        required
                      />
                      <p className="text-[11px] text-neutral-400 mt-1">
                        GPay / PhonePe / Paytm par account holder ka naam dikhega.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. QR Code Scanner Customization */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-red-800" />
                      QR Code Scanner Image Customization
                    </h4>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      PNG, JPG, or Dynamic URL
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <p className="text-neutral-600 leading-relaxed">
                      Aap yahan apna <strong>Custom Scanner Image (PhonePe / Google Pay standee photo / shop scanner)</strong> upload kar sakte hain, ya direct image link paste kar sakte hain, ya apne UPI ID se automatically generate kar sakte hain:
                    </p>

                    {/* Action Buttons to change QR */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => qrFileInputRef.current?.click()}
                        className="px-4 py-3 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Scanner Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateDynamicQr}
                        className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Auto-Generate from UPI</span>
                      </button>
                    </div>

                    {/* QR Code Image URL field */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-neutral-800">
                          QR Code Image URL / Base64 Data
                        </label>
                        {paymentSettings.qrCodeUrl && (
                          <button
                            type="button"
                            onClick={handleResetQrToDefault}
                            className="text-[11px] font-bold text-neutral-500 hover:text-red-800 underline"
                          >
                            Reset to Default QR
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={paymentSettings.qrCodeUrl || ''}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, qrCodeUrl: e.target.value.trim() })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-mono text-neutral-700 focus:border-red-800 focus:outline-none"
                        placeholder="https://... or auto-generated URL (or upload image above)"
                      />
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Agar custom link ya image uploaded hai toh wahi QR code gateway par show hoga.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Live Customer Preview Card (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4 sticky top-24">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-red-800" />
                      Live Buyer Gateway Preview
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <Check className="w-2.5 h-2.5" />
                      Active QR
                    </span>
                  </div>

                  {/* Mock Gateway Card that looks like user view */}
                  <div className="bg-neutral-50 p-4 sm:p-5 rounded-2xl border border-neutral-200 text-center space-y-3.5">
                    <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs inline-block mx-auto">
                      <img
                        src={
                          paymentSettings.qrCodeUrl ||
                          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                            `upi://pay?pa=${paymentSettings.upiId || 'stardot.b2b@okhdfcbank'}&pn=${encodeURIComponent(
                              paymentSettings.upiName || 'Stardot Wholesale India'
                            )}&cu=INR`
                          )}`
                        }
                        alt="UPI Payment QR Code"
                        className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider block">
                        Merchant UPI ID / VPA
                      </span>
                      <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-xs">
                        <span className="font-mono font-bold text-xs text-neutral-900 select-all">
                          {paymentSettings.upiId || 'stardot.b2b@okhdfcbank'}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-neutral-600">
                      <span className="text-neutral-400">Payee:</span>{' '}
                      <strong className="text-neutral-800">{paymentSettings.upiName || 'Stardot Wholesale India'}</strong>
                    </div>

                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/70 text-[11px] text-amber-800 flex items-center justify-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Supports PhonePe, Google Pay, Paytm, BHIM, Cred</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-500 text-center italic">
                    Yeh QR Code live checkout modal aur buyer tracking section me automatically show hota hai.
                  </p>
                </div>
              </div>

            </div>

            {/* Freight Delivery Charges & Cash on Delivery Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Delivery Freight Settings */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-red-800" />
                    Delivery & Road Cargo Freight Setup
                  </h4>
                  <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    Road Transport Bilti
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                    <div>
                      <p className="font-bold text-neutral-900">Free Delivery for All Orders</p>
                      <p className="text-[11px] text-neutral-500">Agar on hai toh kisi bhi order par delivery charge nahi lagega.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentSettings.isFreeDelivery}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, isFreeDelivery: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-800"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-neutral-800 block mb-1">
                        Flat Road Cargo Freight (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 font-bold text-neutral-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={paymentSettings.flatDeliveryCharge}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, flatDeliveryCharge: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-neutral-300 font-bold text-xs focus:border-red-800 focus:outline-none"
                          disabled={paymentSettings.isFreeDelivery}
                        />
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">Standard transport bilti charges.</p>
                    </div>

                    <div>
                      <label className="font-bold text-neutral-800 block mb-1">
                        Free Delivery Threshold (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 font-bold text-neutral-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={paymentSettings.freeDeliveryThreshold}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, freeDeliveryThreshold: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-neutral-300 font-bold text-xs focus:border-red-800 focus:outline-none"
                          disabled={paymentSettings.isFreeDelivery}
                        />
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">Is amount se upar ke order par shipping free hogi.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cash on Delivery (COD) Settings */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-red-800" />
                    Cash on Delivery (COD) & Advance Token
                  </h4>
                  <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    Wholesale Bilti COD
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                    <div>
                      <p className="font-bold text-neutral-900">Enable Cash on Delivery (COD)</p>
                      <p className="text-[11px] text-neutral-500">Checkout par buyers ko COD option select karne ki permission de.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentSettings.isCodEnabled}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, isCodEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-800"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-neutral-800 block mb-1">
                        Extra COD Handling Charge (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 font-bold text-neutral-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={paymentSettings.codExtraCharge}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, codExtraCharge: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-neutral-300 font-bold text-xs focus:border-red-800 focus:outline-none"
                          disabled={!paymentSettings.isCodEnabled}
                        />
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">COD choose karne par extra charge jo add hoga.</p>
                    </div>

                    <div>
                      <label className="font-bold text-neutral-800 block mb-1">
                        Mandatory Advance Token (₹) <span className="text-red-800">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 font-bold text-neutral-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={paymentSettings.codAdvanceAmount}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, codAdvanceAmount: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-neutral-300 font-bold text-xs focus:border-red-800 focus:outline-none"
                          disabled={!paymentSettings.isCodEnabled}
                        />
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">COD confirm karne ke liye buyer ko pehle QR se itna token pay karna padega.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Save Action Button */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
              <div className="text-xs text-neutral-500">
                Aapke changes turant <strong>Firebase & Local Storage</strong> me sync ho jayenge aur customer checkout par live reflect karenge.
              </div>

              <button
                type="submit"
                disabled={isSavingPaymentSettings}
                className="px-8 py-3.5 bg-red-800 hover:bg-red-900 text-white rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingPaymentSettings ? 'Saving to Firebase...' : 'Save UPI & Freight Settings'}</span>
              </button>
            </div>

          </form>
        )}

      </main>

      {/* ------------------------------------------------------------- */}
      {/* CUSTOM BUILT-IN DELETION CONFIRMATION MODAL (NO WINDOW.CONFIRM) */}
      {/* ------------------------------------------------------------- */}
      {deleteConfirmState && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 text-center space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-800 flex items-center justify-center mx-auto border border-red-100">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base font-black font-heading text-neutral-900">
                Confirm {deleteConfirmState.type === 'product' ? 'Product' : deleteConfirmState.type === 'heroSlide' ? 'Hero Banner' : deleteConfirmState.type === 'order' ? 'Transport Order' : 'Category'} Deletion
              </h4>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-neutral-900 font-bold">"{deleteConfirmState.name}"</strong>?
                This will immediately remove it from Firebase and local records.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmState(null)}
                className="px-5 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { type, id, name, extraId } = deleteConfirmState;
                  setDeleteConfirmState(null);
                  if (type === 'product') {
                    try {
                      await deleteProductById(id);
                      setStatusMessage(`Product "${name}" deleted successfully.`);
                      setTimeout(() => setStatusMessage(null), 3500);
                      onRefreshProducts();
                    } catch (err) {
                      console.error(err);
                      setStatusMessage('Error deleting product.');
                    }
                  } else if (type === 'category') {
                    try {
                      await deleteCategoryById(id);
                      setStatusMessage(`Category "${name}" deleted.`);
                      setTimeout(() => setStatusMessage(null), 3500);
                    } catch (err) {
                      console.error(err);
                      setStatusMessage('Error deleting category.');
                    }
                  } else if (type === 'heroSlide') {
                    try {
                      await deleteHeroSlideById(id);
                      setStatusMessage(`Hero Banner slide "${name}" deleted.`);
                      setTimeout(() => setStatusMessage(null), 3500);
                    } catch (err) {
                      console.error(err);
                      setStatusMessage('Error deleting hero slide.');
                    }
                  } else if (type === 'order') {
                    try {
                      await deleteOrderById(id, extraId);
                      setStatusMessage(`Order "${name}" permanently deleted.`);
                      setTimeout(() => setStatusMessage(null), 3500);
                      setOrders(prev => prev.filter(o => o.id !== id));
                    } catch (err) {
                      console.error(err);
                      setStatusMessage('Error deleting order.');
                    }
                  }
                }}
                className="px-6 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
