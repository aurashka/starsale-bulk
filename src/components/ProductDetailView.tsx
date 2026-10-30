import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Share2, 
  ShieldCheck, 
  Truck, 
  ShoppingBag,
  Zap,
  TrendingDown,
  CheckCircle2,
  Check,
  Layers,
  Copy,
  Banknote,
  AlertCircle
} from 'lucide-react';
import { Product } from '../types.ts';
import { formatPrice } from '../utils/format.ts';
import { getProductShortCode, copyProductShareLink, getWhatsAppShareUrl } from '../utils/productCode.ts';

interface ProductDetailViewProps {
  product: Product;
  onBack: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, size: string, color: string, quantity: number, unitPrice: number) => void;
  onDirectOrderNow: (product: Product, size: string, color: string, quantity: number, unitPrice: number) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onBack,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onDirectOrderNow
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || 'Standard');
  const [quantity, setQuantity] = useState(product?.moq || 10);
  const [copiedLink, setCopiedLink] = useState(false);
  const shortCode = getProductShortCode(product);
  const isOutOfStock = Boolean(product?.isOutOfStock || (typeof product?.stock === 'number' && product.stock <= 0));
  const isCodAvailable = product?.codAvailable !== false;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (product) {
      setActiveImageIdx(0);
      setSelectedSize(product.sizes?.[0] || 'M');
      setSelectedColor(product.colors?.[0] || 'Standard');
      setQuantity(product.moq || 10);
    }
  }, [product]);

  const calculateUnitPrice = (qty: number): number => {
    if (!product.bulkTiers || product.bulkTiers.length === 0) {
      return product.basePrice;
    }
    const sortedTiers = [...product.bulkTiers].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sortedTiers) {
      if (qty >= tier.minQty) {
        return tier.unitPrice;
      }
    }
    return product.basePrice;
  };

  const currentUnitPrice = calculateUnitPrice(quantity);
  const totalCost = currentUnitPrice * quantity;
  const regularTotal = product.basePrice * quantity;
  const savings = regularTotal - totalCost;

  const nextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setActiveImageIdx((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const handleShare = async () => {
    const url = await copyProductShareLink(product);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} (Product ID: #${shortCode})`,
          url: url
        });
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-neutral-900 pb-36 animate-in fade-in duration-200">
      
      {/* Top Header Bar for Full-Screen Product View */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-800 hover:text-red-800 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-neutral-100 group-hover:bg-red-50 text-neutral-800 group-hover:text-red-800 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span>Back to Catalog</span>
        </button>

        <div className="flex items-center gap-2">
          {/* 6-Character Unique ID Pill */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 px-3 py-1.5 rounded-full transition-colors font-mono text-xs font-bold text-neutral-800 shadow-2xs"
            title="Click to copy direct product link"
          >
            <span className="text-[10px] uppercase text-neutral-500 font-sans font-bold">ID:</span>
            <span className="text-red-800 font-black">#{shortCode}</span>
            <Copy className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors"
            title="Share Style"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleWishlist(product.id)}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors"
            title="Save to Wishlist"
          >
            <Heart 
              className={`w-4 h-4 ${isWishlisted ? 'fill-red-800 text-red-800' : 'text-neutral-700'}`} 
            />
          </button>
        </div>
      </div>

      {copiedLink && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-xs px-4 py-2 rounded-full shadow-lg font-bold flex items-center gap-2 animate-in fade-in">
          <span>Product link copied with ID #{shortCode}!</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Image Showcase (Large Full Screen Style) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Primary Image Viewer */}
            <div className="relative aspect-[4/5] sm:aspect-[1/1] w-full rounded-3xl overflow-hidden bg-white border border-neutral-200 shadow-sm flex items-center justify-center p-4">
              <img
                src={product.images[activeImageIdx] || product.images[0]}
                alt={product.name}
                className="max-h-full max-w-full object-contain filter contrast-[1.02] drop-shadow-sm transition-all duration-300"
              />

              {/* Slider Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-red-800 hover:text-white text-neutral-800 shadow-md flex items-center justify-center transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-red-800 hover:text-white text-neutral-800 shadow-md flex items-center justify-center transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {product.isNew && (
                  <span className="px-3 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-black uppercase tracking-wider">
                    New Wholesale Lot
                  </span>
                )}
                <span className="px-3 py-1 rounded-md bg-red-800 text-white text-[11px] font-black uppercase tracking-wider">
                  Factory MOQ: {product.moq} pcs
                </span>
              </div>
            </div>

            {/* Thumbnails strip for multiple images */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`w-20 h-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 bg-white ${
                      i === activeImageIdx 
                        ? 'border-red-800 ring-2 ring-red-800/30 shadow-md' 
                        : 'border-neutral-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Wholesale Specifications, Details, Tiers */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1 flex-wrap">
                <span>Category: <strong className="text-neutral-800">{product.category}</strong></span>
                <span>•</span>
                <span>SKU: <strong className="text-neutral-800">{product.sku}</strong></span>
                <span>•</span>
                <span className="bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded-md font-bold text-[11px]">
                  ID: #{shortCode}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 font-heading leading-tight">
                {product.name}
              </h1>

              {/* Direct 6-Character Link Sharing Banner */}
              <div className="mt-2.5 p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">Share Code:</span>
                  <span className="font-mono font-black text-xs text-red-800 bg-white border border-red-200 px-2.5 py-0.5 rounded-md shadow-2xs">
                    #{shortCode}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
                    ?p={shortCode}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                    title="Copy direct share link with 6-char ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={getWhatsAppShareUrl(product)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                    title="Share on WhatsApp"
                  >
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Base Price & In-Stock Status */}
              <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-neutral-200">
                <div>
                  <div className="text-3xl font-black text-red-800 font-heading">
                    ₹{formatPrice(currentUnitPrice)}
                  </div>
                  <span className="text-xs text-neutral-500 font-medium">base wholesale rate per piece</span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Ready Stock: {product.stock} pcs
                  </span>
                </div>
              </div>
            </div>

            {/* Specification Cards: Supports multiple customizable cards (Title, Options/Items, Rich details) */}
            {product.specCards && product.specCards.length > 0 ? (
              <div className="space-y-3">
                {product.specCards.map((card, cIdx) => (
                  <div key={card.id || cIdx} className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-2 text-xs">
                    <h3 className="font-bold text-neutral-900 flex items-center gap-2 text-xs uppercase tracking-wider font-heading">
                      <Layers className="w-4 h-4 text-red-800" />
                      {card.title || 'Technical & Manufacturing Specs'}
                    </h3>
                    
                    {card.items && card.items.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100">
                        {card.items.map((item, itIdx) => (
                          <div key={itIdx}>
                            <span className="text-neutral-500 block">{item.label}:</span>
                            <span className="font-bold text-neutral-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {card.description && (
                      <p className="text-neutral-600 leading-relaxed pt-2 border-t border-neutral-100 text-xs whitespace-pre-line">
                        {card.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Default Fabric & Technical Specification Box */
              <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-2 text-xs">
                <h3 className="font-bold text-neutral-900 flex items-center gap-2 text-xs uppercase tracking-wider font-heading">
                  <Layers className="w-4 h-4 text-red-800" />
                  Fabric & Manufacturing Specs
                </h3>
                
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100">
                  <div>
                    <span className="text-neutral-500 block">Fabric & GSM:</span>
                    <span className="font-bold text-neutral-800">{product.material || '100% Combed Heavy Cotton'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Minimum Order (MOQ):</span>
                    <span className="font-bold text-red-800">{product.moq} pieces</span>
                  </div>
                </div>

                <p className="text-neutral-600 leading-relaxed pt-2 border-t border-neutral-100 text-xs whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Wholesale Volume Slabs Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-900">
                <span className="flex items-center gap-1.5 text-red-800">
                  <TrendingDown className="w-4 h-4" />
                  Volume Tier Discount Slabs
                </span>
                <span className="text-[11px] text-neutral-500 font-normal">Auto-applied at billing</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {product.bulkTiers.map((tier, idx) => {
                  const isCurrentTier = 
                    quantity >= tier.minQty && 
                    (!tier.maxQty || quantity <= tier.maxQty);
                  return (
                    <div
                      key={idx}
                      onClick={() => setQuantity(Math.max(product.moq || 1, tier.minQty))}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        isCurrentTier 
                          ? 'border-red-800 bg-red-800 text-white shadow-md' 
                          : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
                      }`}
                    >
                      <div className={`text-[10px] font-bold ${isCurrentTier ? 'text-red-100' : 'text-neutral-500'}`}>
                        {tier.minQty}{tier.maxQty ? `-${tier.maxQty}` : '+'} pcs
                      </div>
                      <div className="text-base font-black mt-0.5">
                        ₹{formatPrice(tier.unitPrice)}
                        <span className="text-[10px] font-normal ml-0.5">/pc</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Size Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-800">Available Sizes:</span>
                <span className="text-neutral-500 text-[11px]">Selected: {selectedSize}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                      selectedSize === s
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div className="space-y-2">
              <span className="font-bold text-neutral-800 text-xs block">
                Colorway: <span className="font-semibold text-red-800">{selectedColor}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-3.5 py-1.5 text-xs rounded-xl border transition-all ${
                      selectedColor === c
                        ? 'border-red-800 bg-red-50 font-bold text-red-800'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-neutral-100 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Truck className="w-4 h-4 text-red-800" /> All-India Cargo Freight
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-700" /> 5% GST Invoice Credit
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* FLOATING PERSISTENT BOTTOM BUY BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 sm:px-8 py-3.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Quantity Stepper & Savings info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-neutral-300 rounded-full bg-white px-2 py-1 shadow-inner">
              <button
                onClick={() => {
                  const minMoq = product.moq || 1;
                  const step = (quantity - minMoq >= 5) ? 5 : 1;
                  setQuantity(Math.max(minMoq, quantity - step));
                }}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center font-bold text-neutral-800 text-base disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={quantity <= (product.moq || 1)}
                title={quantity <= (product.moq || 1) ? `Minimum order is ${product.moq || 1} pcs` : 'Decrease'}
              >
                -
              </button>
              <input
                type="number"
                min={product.moq || 1}
                max={product.stock}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    setQuantity(Math.min(product.stock, val));
                  }
                }}
                onBlur={() => {
                  const minMoq = product.moq || 1;
                  if (quantity < minMoq) {
                    setQuantity(minMoq);
                  }
                }}
                className="w-14 text-center font-black text-sm text-neutral-900 focus:outline-none"
              />
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 5))}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center font-bold text-neutral-800 text-base"
                title="Increase"
              >
                +
              </button>
            </div>

            {/* Total price info */}
            <div>
              <div className="text-[11px] text-neutral-500 font-medium">
                Total ({quantity} pcs @ ₹{currentUnitPrice}):
              </div>
              <div className="text-xl sm:text-2xl font-black text-neutral-900 font-heading leading-tight">
                ₹{formatPrice(totalCost)}
              </div>
              {savings > 0 && (
                <span className="text-[10px] text-emerald-700 font-bold hidden sm:inline">
                  Saved ₹{formatPrice(savings)} with bulk slab
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons: White / Darkish Red */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                const safeQty = Math.max(product.moq || 1, quantity);
                onAddToCart(product, selectedSize, selectedColor, safeQty, currentUnitPrice);
              }}
              className="py-3 px-4 sm:px-6 bg-white border-2 border-neutral-900 text-neutral-900 hover:bg-neutral-100 font-bold text-xs sm:text-sm rounded-full transition-all active:scale-95 flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4 text-red-800" />
              <span className="hidden sm:inline">Add to Bag</span>
              <span className="sm:hidden">Bag</span>
            </button>

            <button
              onClick={() => {
                const safeQty = Math.max(product.moq || 1, quantity);
                onDirectOrderNow(product, selectedSize, selectedColor, safeQty, currentUnitPrice);
              }}
              className="py-3 px-6 sm:px-8 bg-red-800 hover:bg-red-900 text-white font-black text-xs sm:text-sm rounded-full transition-all active:scale-95 flex items-center gap-2 shadow-lg"
            >
              <Zap className="w-4 h-4 text-red-200" />
              <span>Order Now</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
