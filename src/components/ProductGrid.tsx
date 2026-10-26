import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, ArrowUpDown, Filter, Sparkles, RefreshCw } from 'lucide-react';
import { Product } from '../types.ts';
import { ProductCard } from './ProductCard.tsx';

interface ProductGridProps {
  products: Product[];
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onSelectProduct: (p: Product) => void;
  onQuickAdd: (p: Product) => void;
  selectedCategory: string;
  searchQuery: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  wishlistIds,
  onToggleWishlist,
  onSelectProduct,
  onQuickAdd,
  selectedCategory,
  searchQuery
}) => {
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'moq-asc' | 'stock'>('featured');
  const [stockOnly, setStockOnly] = useState(false);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q)
      );
    }

    // Stock only filter
    if (stockOnly) {
      list = list.filter(p => p.stock > 0);
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price-desc':
        list.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case 'moq-asc':
        list.sort((a, b) => a.moq - b.moq);
        break;
      case 'stock':
        list.sort((a, b) => b.stock - a.stock);
        break;
      case 'featured':
      default:
        list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return list;
  }, [products, selectedCategory, searchQuery, sortBy, stockOnly]);

  return (
    <section id="full-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-[#e8e8e2]">
      
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 font-heading tracking-tight">
              India Wholesale Catalog (₹ INR)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Showing {filteredProducts.length} style{filteredProducts.length === 1 ? '' : 's'} with factory direct rates & GST invoice
            {selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* In Stock Toggle */}
          <button
            onClick={() => setStockOnly(!stockOnly)}
            className={`text-xs px-3.5 py-1.5 rounded-full border transition-all font-bold ${
              stockOnly
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            Ready Stock Dispatch Only
          </button>

          {/* Sort Selector */}
          <div className="relative inline-flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-neutral-300 hover:border-neutral-400 text-neutral-800 text-xs font-bold rounded-full px-4 py-2 pr-8 appearance-none focus:outline-none focus:border-red-800 cursor-pointer shadow-2xs"
            >
              <option value="featured">Sort: Featured Drops</option>
              <option value="price-asc">Rate: Low to High (₹)</option>
              <option value="price-desc">Rate: High to Low (₹)</option>
              <option value="moq-asc">Lowest Minimum Order (MOQ)</option>
              <option value="stock">Highest Ready Stock</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-neutral-300 max-w-lg mx-auto my-6">
          <p className="text-neutral-500 text-sm">
            No wholesale styles found matching "{searchQuery}".
          </p>
          <button
            onClick={() => {
              setSortBy('featured');
              setStockOnly(false);
            }}
            className="mt-4 px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-full hover:bg-neutral-800 transition-all inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistIds.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
              onSelectProduct={onSelectProduct}
              onQuickAdd={onQuickAdd}
            />
          ))}
        </div>
      )}
    </section>
  );
};
