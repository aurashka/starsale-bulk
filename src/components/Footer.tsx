import React from 'react';
import { ShieldCheck, Truck, RotateCcw, PackageCheck, Lock, PhoneCall, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, isAdminLoggedIn }) => {
  return (
    <footer className="bg-neutral-950 text-neutral-400 text-xs border-t border-neutral-800 pt-12 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Wholesale Value Pillars with Bold Red / Yellow / Green Accents */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-10 border-b border-neutral-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-white flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">Heavyweight GSM Certified</h5>
              <p className="text-[11px] text-neutral-400 mt-0.5">Lab-tested compact cotton, 450 GSM fleece, pre-shrunk anti-pilling.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-white flex-shrink-0">
              <Truck className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">All-India Transport & Bilti</h5>
              <p className="text-[11px] text-neutral-400 mt-0.5">VRL, TCI, Delhivery Cargo & local transport booking to your godown.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-white flex-shrink-0">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">Low MOQ From 10 Pieces</h5>
              <p className="text-[11px] text-neutral-400 mt-0.5">Scale your boutique from trial sample lots up to 10,000+ pcs cartons.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-white flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">5% GST ITC Claimable</h5>
              <p className="text-[11px] text-neutral-400 mt-0.5">100% tax compliant GST invoice and e-Way bills generated instantly.</p>
            </div>
          </div>
        </div>

        {/* Footer Links & Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div>
            <div className="font-heading font-black text-white text-lg tracking-tight mb-2 flex items-center gap-1.5">
              <span>STARDOT</span>
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
              <span className="text-[10px] text-yellow-300 font-mono">B2B INDIA</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Industrial B2B textile & apparel manufacturing supplier. Serving streetwear brands, boutiques, and retail chains across India.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-neutral-300 text-xs font-bold">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>B2B Desk: +91 98765 43210</span>
            </div>
          </div>

          <div>
            <h6 className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] mb-3">Wholesale Hubs</h6>
            <ul className="space-y-1.5 text-[11px]">
              <li>Tirupur Knitwear Mill Dispatch</li>
              <li>Surat Fabric & Denim Yards</li>
              <li>Ludhiana Winter Fleece Facility</li>
              <li>Mumbai & Delhi-NCR Godowns</li>
              <li>Bengaluru & Hyderabad Cargo</li>
            </ul>
          </div>

          <div>
            <h6 className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] mb-3">Buyer Facilities</h6>
            <ul className="space-y-1.5 text-[11px]">
              <li>Fabric Swatch Sample Books</li>
              <li>Custom Relabeling & Neck Tags</li>
              <li>Multi-Tier Bulk Slab Rates (₹)</li>
              <li>Direct Mill Pricing Guarantee</li>
              <li>Pallet & Master Carton Packing</li>
            </ul>
          </div>

          <div>
            <h6 className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] mb-3">Trade Compliance</h6>
            <ul className="space-y-1.5 text-[11px]">
              <li>GSTIN: 27AABCS9821R1Z8</li>
              <li>HSN Code: 6109 / 6203 Apparel</li>
              <li>support@stardot.in</li>
              <li>Mon - Sat: 9:00 AM - 8:00 PM IST</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with discrete Admin Trigger */}
        <div className="pt-8 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            © {new Date().getFullYear()} Stardot Wholesale India Pvt. Ltd. All rates in Indian Rupees (₹ INR) for registered trade buyers.
          </div>

          <div className="flex items-center gap-4">
            <span className="text-emerald-400 font-medium">Realtime Firebase Sync Active</span>
            <span className="text-neutral-700">•</span>
            {/* Hidden admin trigger per request */}
            <button
              onClick={onOpenAdmin}
              className="text-neutral-600 hover:text-yellow-400 transition-colors flex items-center gap-1 cursor-pointer font-mono text-[10px]"
              title="Admin Portal (User: admin / Pass: admin9557)"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>{isAdminLoggedIn ? 'Admin Panel Active' : 'Staff Portal'}</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
