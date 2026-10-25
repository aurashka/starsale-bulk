import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, ChevronLeft, ChevronRight, Zap, CheckCircle2 } from 'lucide-react';

interface HeroBannerProps {
  onShopNow: (category?: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopNow }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      tag: 'India B2B Bulk Festival Deal',
      title: 'Tirupur &\nSurat Rates',
      subtitle: 'Direct mill prices for boutiques, retail showrooms & online brands.',
      badge: 'Up to 35% Bulk Margin',
      badgeColor: 'bg-emerald-600',
      category: 'Hoodies',
      bgImage: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1800&q=80',
    },
    {
      id: 2,
      tag: 'Heavyweight Streetwear Blanks (₹ INR)',
      title: '450 GSM\nFleece Lots',
      subtitle: 'Drop-shoulder hoodies, ribbed waffle knitwear & acid wash denim.',
      badge: 'MOQ from only 10 pcs',
      badgeColor: 'bg-red-600',
      category: 'Sweaters',
      bgImage: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1800&q=80',
    },
    {
      id: 3,
      tag: 'Fast Indian Transport Dispatch',
      title: 'Resort\nWorkwear',
      subtitle: 'Vertical striped resort shirts, heavy cotton poplin & vintage skaters.',
      badge: 'Full GST 5% Invoice Credit',
      badgeColor: 'bg-amber-500 text-neutral-950',
      category: 'Shirts',
      bgImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1800&q=80',
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
      <div className="relative w-full h-[370px] sm:h-[440px] md:h-[480px] rounded-3xl overflow-hidden shadow-2xl bg-neutral-950 group border border-neutral-800">
        
        {/* Slides */}
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.bgImage}
              alt={slide.title}
              className="w-full h-full object-cover object-center filter brightness-[0.7] contrast-110 transform scale-100 transition-transform duration-1000 group-hover:scale-105"
            />
            
            {/* Bold color atmospheric gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-red-950/20" />

            {/* Content */}
            <div className="absolute inset-0 p-6 sm:p-10 md:p-14 flex flex-col justify-between max-w-xl text-white">
              
              {/* Top tag with bold accents */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-900/80 backdrop-blur-md border border-neutral-700 text-yellow-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {slide.tag}
                </span>
              </div>

              {/* Middle Headline */}
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] whitespace-pre-line font-heading">
                  {slide.title}
                </h1>
                <p className="text-sm sm:text-base text-neutral-300 max-w-md font-normal leading-relaxed">
                  {slide.subtitle}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onShopNow(slide.category)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm px-7 py-3.5 rounded-full transition-all active:scale-95 shadow-xl group/btn"
                  >
                    <span>Browse Wholesale Rates</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>

                  <div className={`flex items-center gap-2 text-xs sm:text-sm font-black px-4 py-2.5 rounded-full shadow-md ${slide.badgeColor}`}>
                    <Zap className="w-3.5 h-3.5" />
                    <span>{slide.badge}</span>
                  </div>
                </div>
              </div>

              {/* Bottom trust indicators */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-300 font-mono">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Pan-India VRL / TCI Cargo
                </span>
                <span className="text-neutral-500">•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
                  5% GST ITC Claimable
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Prev/Next Buttons */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-neutral-700"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-neutral-700"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Pagination Dots */}
        <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-7 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
