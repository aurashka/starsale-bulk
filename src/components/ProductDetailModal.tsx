import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Share2, 
  ShieldCheck, 
  Truck, 
  ShoppingBag,
  Zap,
  TrendingDown,
  CheckCircle2
} from 'lucide-react';
import { Product } from '../types.ts';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, size: string, color: string, quantity: number, unitPrice: number) => void;
  onDirectOrderNow: (product: Product, size: string, color: string, quantity: number, unitPrice: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onDirectOrderNow
}) => {
  if (!product) return null;

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Standard');
  const [quantity, setQuantity] = useState(product.moq || 10);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (product) {
      setActiveImageIdx(0);
      setSelectedSize(product.sizes[0] || 'M');
      setSelectedColor(product.colors[0] || 'Standard');
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

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      
      {/* Modal Dialog */}
      <div 
        className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-neutral-300 relative my-auto flex flex-col md:flex-row max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-white/90 hover:bg-red-600 hover:text-white text-neutral-800 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Image Gallery Slider */}
        <div className="w-full md:w-1/2 bg-[#f4f4f0] relative flex flex-col justify-between p-4 sm:p-6 overflow-hidden min-h-[380px] sm:min-h-[460px]">
          
          {/* Top image bar */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-700 bg-white/90 px-3 py-1 rounded-full font-bold shadow-xs">
              SKU: {product.sku}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-neutral-700 flex items-center justify-center transition-colors shadow-xs"
                title="Share wholesale style"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onToggleWishlist(product.id)}
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-neutral-700 flex items-center justify-center transition-colors shadow-xs"
                title="Save style"
              >
                <Heart 
                  className={`w-4 h-4 ${isWishlisted ? 'fill-red-600 text-red-600' : 'text-neutral-700'}`} 
                />
              </button>
            </div>
          </div>

          {/* Main Showcase Image */}
          <div className="relative my-auto flex items-center justify-center h-[300px] sm:h-[380px]">
            <img
              src={product.images[activeImageIdx] || product.images[0]}
              alt={product.name}
              className="max-h-full max-w-full object-contain filter contrast-[1.03] drop-shadow-md transition-all duration-300"
            />

            {product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-red-600 hover:text-white text-neutral-800 shadow-sm flex items-center justify-center transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-red-600 hover:text-white text-neutral-800 shadow-sm flex items-center justify-center transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Pagination Dots & Thumbnails */}
          <div className="flex flex-col items-center gap-2 z-10 pt-2">
            <div className="flex items-center gap-1.5">
              {product.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activeImageIdx ? 'w-6 bg-red-600' : 'w-2 bg-neutral-300 hover:bg-neutral-500'
                  }`}
                  aria-label={`Image ${idx + 1}`}
                />
              ))}
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      i === activeImageIdx ? 'border-red-600 ring-2 ring-red-600/30' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {copiedLink && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900 text-yellow-300 text-xs px-3 py-1.5 rounded-full shadow-lg font-bold">
              Product link copied to clipboard!
            </div>
          )}
        </div>

        {/* Right Column: Wholesale Specifications & Rupee Bulk Calculator */}
        <div className="w-full md:w-1/2 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto no-scrollbar">
          
          <div className="space-y-4">
            
            {/* Header / Badges */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black tracking-wide uppercase border border-amber-200">
                {product.isNew ? 'New Wholesale Lot' : 'Certified Bulk Lot'}
              </span>
              <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                In Stock: {product.stock} pcs
              </span>
            </div>

            {/* Title & Rupee Base Price */}
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl font-black text-neutral-900 font-heading leading-tight">
                {product.name}
              </h2>
              <div className="text-right">
                <div className="text-2xl font-black text-red-600 font-heading">
                  ₹{currentUnitPrice.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-neutral-500 block font-semibold">per piece wholesale</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              {product.description}
            </p>

            {/* Fabric / Technical Specs */}
            <div className="bg-[#fcfcfa] p-3 rounded-2xl border border-neutral-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Fabric Weight & Specs:</span>
                <span className="font-bold text-neutral-900">{product.material}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Minimum Order Quantity (MOQ):</span>
                <span className="font-extrabold text-red-600">{product.moq} pcs (Any Size/Color)</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700 font-semibold pt-1 border-t border-neutral-100">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> GST Invoice:
                </span>
                <span>5% GST ITC Claimable</span>
              </div>
            </div>

            {/* Bulk Pricing Tier Matrix in ₹ */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-900">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                  Wholesale Volume Slabs (₹ INR)
                </span>
                <span className="text-[11px] text-neutral-500 font-normal">Auto-applied at checkout</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {product.bulkTiers.map((tier, idx) => {
                  const isCurrentTier = 
                    quantity >= tier.minQty && 
                    (!tier.maxQty || quantity <= tier.maxQty);
                  return (
                    <div
                      key={idx}
                      onClick={() => setQuantity(tier.minQty)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isCurrentTier 
                          ? 'border-red-600 bg-red-600 text-white shadow-md' 
                          : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
                      }`}
                    >
                      <div className={`text-[10px] font-bold ${isCurrentTier ? 'text-yellow-200' : 'text-neutral-500'}`}>
                        {tier.minQty}{tier.maxQty ? `-${tier.maxQty}` : '+'} pcs
                      </div>
                      <div className="text-sm font-black mt-0.5">
                        ₹{tier.unitPrice.toLocaleString('en-IN')}
                        <span className="text-[9px] font-normal ml-0.5">/pc</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Size Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-800">Select Size:</span>
                <span className="text-neutral-500 text-[11px]">Indian Standard Sizing</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all ${
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
            <div className="space-y-1.5">
              <span className="font-bold text-neutral-800 text-xs block">
                Colorway: <span className="font-normal text-neutral-600">{selectedColor}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                      selectedColor === c
                        ? 'border-red-600 bg-red-50 font-bold text-red-700'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Quantity Stepper with Live Rupee Savings */}
            <div className="pt-2 border-t border-neutral-200">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-neutral-900">Lot Quantity (MOQ: {product.moq} pcs):</span>
                {savings > 0 && (
                  <span className="text-emerald-800 font-extrabold text-[11px] bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                    Bulk Profit Saved: ₹{savings.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-neutral-300 rounded-full bg-white px-2 py-1 shadow-inner">
                  <button
                    onClick={() => setQuantity(Math.max(product.moq, quantity - 5))}
                    className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center font-bold text-neutral-800 text-base"
                    disabled={quantity <= product.moq}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={product.moq}
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || product.moq;
                      setQuantity(Math.max(product.moq, Math.min(product.stock, val)));
                    }}
                    className="w-16 text-center font-black text-sm text-neutral-900 focus:outline-none"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 5))}
                    className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center font-bold text-neutral-800 text-base"
                  >
                    +
                  </button>
                </div>

                <div className="text-right flex-1">
                  <div className="text-xs text-neutral-500 font-medium">Lot Subtotal:</div>
                  <div className="text-xl font-black text-neutral-900 font-heading">
                    ₹{totalCost.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Bold Red / Dark Theme */}
          <div className="pt-5 mt-4 border-t border-neutral-200 flex items-center gap-3">
            <button
              onClick={() => onAddToCart(product, selectedSize, selectedColor, quantity, currentUnitPrice)}
              className="flex-1 py-3.5 px-4 bg-white border-2 border-neutral-900 text-neutral-900 hover:bg-neutral-100 font-bold text-xs sm:text-sm rounded-full transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-red-600" />
              <span>Add to Bag</span>
            </button>

            <button
              onClick={() => onDirectOrderNow(product, selectedSize, selectedColor, quantity, currentUnitPrice)}
              className="flex-1 py-3.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm rounded-full transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>Order Now</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
