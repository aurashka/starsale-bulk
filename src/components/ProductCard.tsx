import React from 'react';
import { Heart, Plus } from 'lucide-react';
import { Product } from '../types.ts';
import { formatPrice } from '../utils/format.ts';

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
  const tiers = product?.bulkTiers || [];
  const baseRate = product?.basePrice ?? 0;
  const lowestBulkPrice = tiers.length > 0
    ? Math.min(...tiers.map(t => t.unitPrice || baseRate))
    : baseRate;

  const maxDiscountPercent = baseRate > 0
    ? Math.max(0, Math.round(((baseRate - lowestBulkPrice) / baseRate) * 100))
    : 0;

  return (
    <div 
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-2xl p-2.5 sm:p-3 border border-neutral-200 hover:border-red-800/60 transition-all duration-300 flex flex-col justify-between hover:shadow-lg cursor-pointer relative"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-neutral-100">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80'}
          alt={product.name}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-neutral-700 hover:text-red-800 hover:bg-white transition-all shadow-sm active:scale-90"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-red-800 text-red-800' : 'text-neutral-700'
            }`} 
          />
        </button>

        {/* Badges - White & Darkish Red Theme */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {product.isNew && (
            <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
              New Lot
            </span>
          )}
          {maxDiscountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-red-800 text-white text-[10px] font-black tracking-wider uppercase shadow-sm">
              Up to -{maxDiscountPercent}% Bulk
            </span>
          )}
        </div>

        {/* Sizes Pill Bottom Left */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-sm text-neutral-900 text-[10px] font-bold border border-neutral-200">
          {product.sizes[0]} - {product.sizes[product.sizes.length - 1]}
        </div>

        {/* Quick Add Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(product);
          }}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-red-800 text-white flex items-center justify-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-md hover:bg-red-900"
          title="Quick Order MOQ Lot"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Card Info */}
      <div className="pt-3 pb-1 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
            <span>{product.category}</span>
            <span className="bg-neutral-100 text-neutral-800 px-1.5 py-0.2 rounded text-[10px] font-bold border border-neutral-200">
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
            {lowestBulkPrice < baseRate && (
              <div className="text-[11px] font-bold text-emerald-800">
                Bulk: <span className="font-extrabold">₹{formatPrice(lowestBulkPrice)}</span>/pc
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-neutral-500 block">
              Stock: {product.stock} pcs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
