import React from 'react';
import { Heart, Plus, Zap } from 'lucide-react';
import { Product } from '../types.ts';

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
  const lowestBulkPrice = product.bulkTiers.length > 0
    ? Math.min(...product.bulkTiers.map(t => t.unitPrice))
    : product.basePrice;

  const maxDiscountPercent = Math.round(((product.basePrice - lowestBulkPrice) / product.basePrice) * 100);

  return (
    <div 
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-2xl p-2.5 sm:p-3 border border-neutral-200 hover:border-red-600/60 transition-all duration-300 flex flex-col justify-between hover:shadow-lg cursor-pointer relative"
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
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-neutral-700 hover:text-red-600 hover:bg-white transition-all shadow-sm active:scale-90"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-red-600 text-red-600' : 'text-neutral-700'
            }`} 
          />
        </button>

        {/* Bold Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {product.isNew && (
            <span className="px-2 py-0.5 rounded-md bg-neutral-950 text-yellow-400 text-[10px] font-black tracking-wider uppercase shadow-xs">
              New Lot
            </span>
          )}
          {maxDiscountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black tracking-wider uppercase shadow-sm">
              Up to -{maxDiscountPercent}% Bulk
            </span>
          )}
        </div>

        {/* Sizes Pill Bottom Left */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-sm text-neutral-900 text-[10px] font-bold border border-neutral-200">
          {product.sizes[0]} - {product.sizes[product.sizes.length - 1]}
        </div>

        {/* Quick Add Button Hover Pill */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(product);
          }}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-md hover:bg-red-700"
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
            <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded text-[10px] font-bold border border-amber-200">
              MOQ: {product.moq} pcs
            </span>
          </div>

          <h3 className="font-bold text-sm text-neutral-900 mt-1 line-clamp-1 group-hover:text-red-600 transition-colors">
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
              ₹{product.basePrice.toLocaleString('en-IN')}
            </div>
            {lowestBulkPrice < product.basePrice && (
              <div className="text-[11px] font-bold text-emerald-700">
                Bulk: <span className="font-extrabold">₹{lowestBulkPrice.toLocaleString('en-IN')}</span>/pc
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
