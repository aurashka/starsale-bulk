import React from 'react';
import { X, Heart, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Product } from '../types.ts';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onSelectProduct: (p: Product) => void;
  onQuickAdd: (p: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  products,
  wishlistIds,
  onToggleWishlist,
  onSelectProduct,
  onQuickAdd
}) => {
  if (!isOpen) return null;

  const wishlistedProducts = products.filter(p => wishlistIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between relative transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e7e7e2] flex items-center justify-between bg-[#f8f8f6]">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h2 className="text-lg font-bold font-heading text-neutral-900">
              Saved Wholesale Styles
            </h2>
            <span className="text-xs font-mono bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded-full font-bold">
              {wishlistedProducts.length}
            </span>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 no-scrollbar">
          {wishlistedProducts.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
                <Heart className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-neutral-800">Your Wishlist is Empty</h4>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Click the heart on any wholesale product to save it here for later review and sample orders.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {wishlistedProducts.map((prod) => (
                <div key={prod.id} className="py-3 flex items-center justify-between gap-3">
                  <div 
                    onClick={() => {
                      onSelectProduct(prod);
                      onClose();
                    }}
                    className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                  >
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-14 h-16 object-cover rounded-xl bg-neutral-100 flex-shrink-0 border border-neutral-200 group-hover:opacity-90"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-neutral-900 truncate group-hover:text-black">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        MOQ: {prod.moq} pcs • {prod.category}
                      </p>
                      <div className="text-xs font-black text-neutral-900 mt-1">
                        ${prod.basePrice}
                        <span className="text-[10px] font-normal text-neutral-400 ml-1">/unit</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onQuickAdd(prod)}
                      className="p-2 bg-neutral-900 text-white rounded-full hover:bg-black transition-colors"
                      title="Add lot to bag"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onToggleWishlist(prod.id)}
                      className="p-2 text-neutral-400 hover:text-rose-500 transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {wishlistedProducts.length > 0 && (
          <div className="p-4 border-t border-[#e7e7e2] bg-[#f8f8f6]">
            <button
              onClick={() => {
                wishlistedProducts.forEach(p => onQuickAdd(p));
                onClose();
              }}
              className="w-full py-3 bg-neutral-900 text-white rounded-full font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              <span>Add All to Bulk Bag</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
