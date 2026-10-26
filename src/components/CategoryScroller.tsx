import React from 'react';
import { 
  Shirt, 
  Layers, 
  Sparkles, 
  Footprints, 
  Tag
} from 'lucide-react';
import { CategoryItem } from '../types.ts';

interface CategoryScrollerProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
}

export const CategoryScroller: React.FC<CategoryScrollerProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'all': return <Sparkles className="w-4 h-4 text-red-700" />;
      case 'Sweaters': return <Layers className="w-4 h-4 text-red-800" />;
      case 'Jackets': return <Layers className="w-4 h-4 text-neutral-700" />;
      case 'Shirts': return <Shirt className="w-4 h-4 text-red-800" />;
      case 'Hoodies': return <Shirt className="w-4 h-4 text-neutral-800" />;
      case 'Pants': return <Layers className="w-4 h-4 text-neutral-700" />;
      case 'Shoes': return <Footprints className="w-4 h-4 text-red-700" />;
      default: return <Tag className="w-4 h-4 text-red-800" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
          <h2 className="text-xs font-black uppercase tracking-wider text-neutral-900 font-heading">
            Wholesale Categories
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Factory MOQ from 5–15 pcs
        </span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-red-800 text-white shadow-md'
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
