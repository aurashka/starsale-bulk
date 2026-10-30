import React, { useState } from 'react';
import { Heart, Plus, Share2, Banknote, AlertCircle } from 'lucide-react';
import { Product } from '../types.ts';
import { formatPrice } from '../utils/format.ts';
import { getProductShortCode, copyProductShareLink } from '../utils/productCode.ts';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onSelectProduct,
  onQuickAdd
}) => {
  const [copied, setCopied] = useState(false);
  const shortCode = getProductShortCode(product);
  const tiers = product?.bulkTiers || [];
  const baseRate = product?.basePrice ?? 0;
  const isOutOfStock = Boolean(product?.isOutOfStock || (typeof product?.stock === 'number' && product.stock <= 0));
  const isCodAvailable = product?.codAvailable !== false;

  const lowestBulkPrice = tiers.length > 0
    ? Math.min(...tiers.map(t => t.unitPrice || baseRate))
    : baseRate;

  const maxDiscountPercent = baseRate > 0
    ? Math.max(0, Math.round(((baseRate - lowestBulkPrice) / baseRate) * 100))
    : 0;

  const handleQuickShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copyProductShareLink(product);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={() => onSelectProduct(product)}
      className={`group bg-white rounded-2xl p-2.5 sm:p-3 border border-neutral-200 hover:border-red-800/60 transition-all duration-300 flex flex-col justify-between hover:shadow-lg cursor-pointer relative ${
        isOutOfStock ? 'opacity-70 hover:opacity-85 filter contrast-[0.95]' : ''
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-neutral-100">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80'}
          alt={product.name}
          className={`w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 ${
            isOutOfStock ? 'filter grayscale-[30%]' : ''
          }`}
          loading="lazy"
        />

        {/* Highlighted Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-neutral-950/45 backdrop-blur-[0.5px] flex items-center justify-center p-2 z-10 pointer-events-none">
            <span className="px-3 py-1.5 rounded-lg bg-neutral-900/95 text-white border border-red-500/60 text-[11px] font-black uppercase tracking-wider shadow-xl flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span>Out of Stock</span>
            </span>
          </div>
        )}

        {/* Quick Share Link Button */}
        <button
          onClick={handleQuickShare}
          className="absolute top-2 right-11 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-neutral-700 hover:text-red-800 hover:bg-white transition-all shadow-sm active:scale-90 z-20"
          title={`Copy link with ID #${shortCode}`}
        >
          {copied ? (
            <span className="text-[10px] font-bold text-emerald-700 font-mono">✓</span>
          ) : (
            <Share2 className="w-3.5 h-3.5 text-neutral-700" />
          )}
        </button>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-neutral-700 hover:text-red-800 hover:bg-white transition-all shadow-sm active:scale-90 z-20"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-red-800 text-red-800' : 'text-neutral-700'
            }`} 
          />
        </button>

        {/* Badges - White & Darkish Red Theme */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
          {product.isNew && (
            <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
              New Lot
            </span>
          )}
          {maxDiscountPercent > 0 && !isOutOfStock && (
            <span className="px-2 py-0.5 rounded-md bg-red-800 text-white text-[10px] font-black tracking-wider uppercase shadow-sm">
              Up to -{maxDiscountPercent}% Bulk
            </span>
          )}
          {/* Monocolor Cash on Delivery Badge (Zero Emojis) */}
          {isCodAvailable && (
            <span className="px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-sm text-neutral-900 text-[10px] font-bold border border-neutral-200/90 shadow-2xs flex items-center gap-1">
              <Banknote className="w-3 h-3 text-neutral-800" />
              <span>Cash on Delivery</span>
            </span>
          )}
        </div>

        {/* Sizes Pill Bottom Left */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-sm text-neutral-900 text-[10px] font-bold border border-neutral-200 z-10">
          {product.sizes[0]} - {product.sizes[product.sizes.length - 1]}
        </div>

        {/* Quick Add Button (Hidden if Out of Stock) */}
        {!isOutOfStock && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(product);
            }}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-red-800 text-white flex items-center justify-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-md hover:bg-red-900 z-20"
            title="Quick Order MOQ Lot"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Card Info */}
      <div className="pt-3 pb-1 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono gap-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="truncate">{product.category}</span>
              <span>•</span>
              <span className="text-red-800 font-bold bg-red-50 border border-red-200 px-1 py-0.2 rounded text-[10px] font-mono tracking-tight flex-shrink-0">
                #{shortCode}
              </span>
            </div>
            <span className="bg-neutral-100 text-neutral-800 px-1.5 py-0.2 rounded text-[10px] font-bold border border-neutral-200 flex-shrink-0">
              MOQ: {product.moq} pcs
            </span>
          </div>

          <h3 className="font-bold text-sm text-neutral-900 mt-1 line-clamp-1 group-hover:text-red-800 transition-colors">
            {product.name}
          </h3>

          <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
            {product.material}
          </p>
        </div>

        {/* Pricing Rows in INR (₹) */}
        <div className="pt-2 mt-2 border-t border-neutral-100 flex items-baseline justify-between">
          <div>
            <div className="text-base font-black text-neutral-900 font-heading">
              ₹{formatPrice(product?.basePrice)}
            </div>
            {lowestBulkPrice < baseRate && !isOutOfStock && (
              <div className="text-[11px] font-bold text-emerald-800">
                Bulk: <span className="font-extrabold">₹{formatPrice(lowestBulkPrice)}</span>/pc
              </div>
            )}
          </div>

          <div className="text-right">
            {isOutOfStock ? (
              <span className="text-[10px] font-bold font-mono text-red-800 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded block">
                Out of Stock
              </span>
            ) : (
              <span className="text-[10px] font-mono text-neutral-500 block">
                Stock: {product.stock} pcs
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
