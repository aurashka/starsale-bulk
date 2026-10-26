import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame, ArrowRight } from 'lucide-react';
import { Product } from '../types.ts';
import { ProductCard } from './ProductCard.tsx';

interface HorizontalProductScrollerProps {
  title: string;
  subtitle?: string;
  products: Product[];
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onSelectProduct: (p: Product) => void;
  onQuickAdd: (p: Product) => void;
  onViewAll?: () => void;
  badge?: string;
}

export const HorizontalProductScroller: React.FC<HorizontalProductScrollerProps> = ({
  title,
  subtitle,
  products,
  wishlistIds,
  onToggleWishlist,
  onSelectProduct,
  onQuickAdd,
  onViewAll,
  badge
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header with Title and Scroll Controls */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            {badge && (
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-500" />
                {badge}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 font-heading tracking-tight">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action and Arrow buttons */}
        <div className="flex items-center gap-2">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-bold text-neutral-800 hover:text-black flex items-center gap-1 mr-2 px-3 py-1.5 rounded-full hover:bg-[#ebebe5] transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 flex items-center justify-center text-neutral-700 active:scale-95 transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 flex items-center justify-center text-neutral-700 active:scale-95 transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Container */}
      <div 
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 pb-3"
      >
        {products.map((product) => (
          <div 
            key={product.id} 
            className="flex-shrink-0 w-[240px] sm:w-[270px] md:w-[290px]"
          >
            <ProductCard
              product={product}
              isWishlisted={wishlistIds.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
              onSelectProduct={onSelectProduct}
              onQuickAdd={onQuickAdd}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
