import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, ChevronLeft, ChevronRight, Zap, CheckCircle2, Eye, ExternalLink } from 'lucide-react';
import { HeroSlide, Product } from '../types.ts';
import { DEFAULT_HERO_SLIDES } from '../data/defaultProducts.ts';

interface HeroBannerProps {
  slides?: HeroSlide[];
  products?: Product[];
  onShopNow: (category?: string) => void;
  onSelectProduct?: (product: Product) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ 
  slides = DEFAULT_HERO_SLIDES,
  products = [],
  onShopNow,
  onSelectProduct 
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const displaySlides = slides && slides.length > 0 ? slides : DEFAULT_HERO_SLIDES;

  useEffect(() => {
    if (currentSlide >= displaySlides.length) {
      setCurrentSlide(0);
    }
  }, [displaySlides.length, currentSlide]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displaySlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [displaySlides.length]);

  const activeSlide = displaySlides[currentSlide] || displaySlides[0];
  const linkedProduct = activeSlide?.linkedProductId 
    ? products.find(p => p.id === activeSlide.linkedProductId) 
    : undefined;

  const handleSlideAction = (slide: HeroSlide) => {
    if (slide.linkedProductId) {
      const match = products.find(p => p.id === slide.linkedProductId);
      if (match && onSelectProduct) {
        onSelectProduct(match);
        return;
      }
    }
    // Generic fallback: scroll or filter
    onShopNow();
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
      <div className="relative w-full h-[380px] sm:h-[440px] md:h-[480px] rounded-3xl overflow-hidden shadow-2xl bg-neutral-950 group border border-neutral-800">
        
        {/* Slides */}
        {displaySlides.map((slide, idx) => {
          const slideLinkedProduct = slide.linkedProductId 
            ? products.find(p => p.id === slide.linkedProductId) 
            : undefined;

          return (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover object-center filter brightness-[0.7] contrast-110 transform scale-100 transition-transform duration-1000 group-hover:scale-105"
              />
              
              {/* Atmospheric dark gradients */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-red-950/20" />

              {/* Slide Content */}
              <div className="absolute inset-0 p-6 sm:p-10 md:p-14 flex flex-col justify-between max-w-xl text-white">
                
                {/* Top tags & badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-900/80 backdrop-blur-md border border-neutral-700 text-red-200">
                    <Sparkles className="w-3.5 h-3.5 text-red-400" />
                    {slide.tag || 'India B2B Bulk Sourcing'}
                  </span>

                  {slideLinkedProduct && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/70 backdrop-blur-md border border-red-800/80 text-white">
                      <Eye className="w-3.5 h-3.5 text-red-300" />
                      <span>Linked Lot: {slideLinkedProduct.sku}</span>
                    </span>
                  )}
                </div>

                {/* Middle Headline */}
                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.08] whitespace-pre-line font-heading">
                    {slide.title}
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-neutral-300 max-w-md font-normal leading-relaxed">
                    {slide.subtitle}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleSlideAction(slide)}
                      className="inline-flex items-center gap-2 bg-red-800 hover:bg-red-700 text-white font-black text-xs sm:text-sm px-6 sm:px-7 py-3 sm:py-3.5 rounded-full transition-all active:scale-95 shadow-xl group/btn"
                    >
                      <span>
                        {slide.buttonText || (slideLinkedProduct ? `Browse Lot (₹${slideLinkedProduct.basePrice})` : 'Browse Wholesale Rates')}
                      </span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>

                    {slide.badge && (
                      <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-black px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-md ${slide.badgeColor || 'bg-red-800 text-white'}`}>
                        <Zap className="w-3.5 h-3.5" />
                        <span>{slide.badge}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom trust indicators */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-300 font-mono">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Pan-India Mill Dispatch
                  </span>
                  <span className="text-neutral-500">•</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                    5% GST ITC Claimable
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Carousel Prev/Next Buttons */}
        {displaySlides.length > 1 && (
          <>
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + displaySlides.length) % displaySlides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-red-800 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-neutral-700"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % displaySlides.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-red-800 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-neutral-700"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {displaySlides.length > 1 && (
          <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5">
            {displaySlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlide ? 'w-7 bg-red-600' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
