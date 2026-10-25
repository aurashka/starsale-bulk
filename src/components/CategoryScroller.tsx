import React from 'react';
import { 
  Shirt, 
  Layers, 
  Sparkles, 
  Footprints, 
  Smile
} from 'lucide-react';
import { CATEGORIES } from '../data/defaultProducts.ts';

interface CategoryScrollerProps {
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
}

export const CategoryScroller: React.FC<CategoryScrollerProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'all': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'Sweaters': return <Layers className="w-4 h-4 text-rose-500" />;
      case 'Jackets': return <Layers className="w-4 h-4 text-amber-500" />;
      case 'Shirts': return <Shirt className="w-4 h-4 text-sky-500" />;
      case 'Hoodies': return <Shirt className="w-4 h-4 text-emerald-500" />;
      case 'Pants': return <Layers className="w-4 h-4 text-indigo-500" />;
      case 'Shoes': return <Footprints className="w-4 h-4 text-orange-500" />;
      case 'Hats': return <Smile className="w-4 h-4 text-yellow-500" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600"></span>
          <h2 className="text-xs font-black uppercase tracking-wider text-neutral-900 font-heading">
            Browse Wholesale Segments
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Factory MOQ from 5–15 pcs
        </span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'bg-white text-neutral-800 hover:border-neutral-400 border border-neutral-300'
              }`}
            >
              <span>{getCategoryIcon(cat.id)}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
