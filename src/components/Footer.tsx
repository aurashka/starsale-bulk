import React from 'react';
import { ShieldCheck, Truck, PackageCheck, PhoneCall, CheckCircle2 } from 'lucide-react';
import { CompanyFooterInfo } from '../types.ts';
import { DEFAULT_FOOTER_INFO } from '../data/defaultProducts.ts';

interface FooterProps {
  footerInfo?: CompanyFooterInfo;
}

export const Footer: React.FC<FooterProps> = ({ footerInfo }) => {
  const info = footerInfo || DEFAULT_FOOTER_INFO;

  return (
    <footer className="bg-neutral-950 text-neutral-400 text-xs border-t border-neutral-800 pt-12 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Wholesale Value Pillars with Clean Red / Neutral Accents (NO Yellow) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-10 border-b border-neutral-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-900/30 border border-red-800/40 flex items-center justify-center text-white flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">Heavyweight GSM Certified</h5>
              <p className="text-[11px] text-neutral-400 mt-0.5">Lab-tested compact cotton, 450 GSM fleece, pre-shrunk anti-pilling.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white flex-shrink-0">
              <Truck className="w-5 h-5 text-neutral-200" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">All-India Transport & Bilti</h5>
              <p className="text-[11px] text-neutral-400 mt-0.5">VRL, TCI, Delhivery Cargo & local transport booking to your godown.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-white flex-shrink-0">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">Low MOQ From 10 Pieces</h5>
              <p className="text-[11px] text-neutral-400 mt-0.5">Scale your boutique from trial sample lots up to 10,000+ pcs cartons.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center justify-center text-white flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">5% GST ITC Claimable</h5>
              <p className="text-[11px] text-neutral-400 mt-0.5">100% tax compliant GST invoice and e-Way bills generated instantly.</p>
            </div>
          </div>
        </div>

        {/* Footer Links & Info - Editable from Admin Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div>
            <div className="font-heading font-black text-white text-lg tracking-tight mb-2 flex items-center gap-1.5">
              <span>{info.brandTitle || 'STARDOT'}</span>
              <span className="w-2 h-2 rounded-full bg-red-800 inline-block"></span>
              <span className="text-[10px] text-red-200 font-mono">{info.brandSubtitle || 'B2B INDIA'}</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed whitespace-pre-line">
              {info.aboutText}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-neutral-300 text-xs font-bold">
              <PhoneCall className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span>B2B Desk: {info.b2bPhone}</span>
            </div>
          </div>

          <div>
            <h6 className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] mb-3">Wholesale Hubs</h6>
            <ul className="space-y-1.5 text-[11px]">
              {(info.wholesaleHubs || []).map((hub, i) => (
                <li key={i}>{hub}</li>
              ))}
            </ul>
          </div>

          <div>
            <h6 className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] mb-3">Buyer Facilities</h6>
            <ul className="space-y-1.5 text-[11px]">
              {(info.buyerFacilities || []).map((fac, i) => (
                <li key={i}>{fac}</li>
              ))}
            </ul>
          </div>

          <div>
            <h6 className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] mb-3">Trade Compliance</h6>
            <ul className="space-y-1.5 text-[11px]">
              {info.gstin && <li>GSTIN: {info.gstin}</li>}
              {info.hsnCode && <li>HSN Code: {info.hsnCode}</li>}
              {info.supportEmail && <li>{info.supportEmail}</li>}
              {info.supportHours && <li>{info.supportHours}</li>}
            </ul>
          </div>
        </div>

        {/* Clean Bottom Bar - Completely removed "Realtime Firebase Sync Active" */}
        <div className="pt-8 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            © {new Date().getFullYear()} {info.bottomCopyrightText || 'Stardot Wholesale India Pvt. Ltd. All rates in Indian Rupees (₹ INR) for registered trade buyers.'}
          </div>

          <div className="flex items-center gap-4 text-neutral-400">
            <span>{info.bottomNetworkText || 'All-India Transport Network'}</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
