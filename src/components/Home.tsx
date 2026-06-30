import React from 'react';
import { Leaf, Award, Heart, ShoppingBag, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { User, UserRole } from '../types';

interface HomeProps {
  currentUser: User | null;
  onSwitchRole: (email: string) => void;
  onNavigate: (page: string) => void;
  listingsCount: number;
}

export default function Home({ currentUser, onSwitchRole, onNavigate, listingsCount }: HomeProps) {
  const stats = [
    { label: "Food Rescued", value: "248 kg", desc: "Premium baked goods", icon: ShoppingBag, color: "text-brand-orange bg-brand-lightcream" },
    { label: "CO₂ Prevention", value: "620 kg", desc: "Equivalent to 12 trees", icon: Leaf, color: "text-brand-sage bg-emerald-50" },
    { label: "Loyalty Badges Unlocked", value: "1,240+", desc: "By active community savers", icon: Award, color: "text-amber-600 bg-amber-50" },
  ];

  const quickPersonas = [
    { name: "Alex Mercer (Customer)", email: "customer@bakeback.com", role: "customer", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120", slogan: "Rescues premium treats at 60% discount & earns eco rewards." },
    { name: "Elena Rostova (Bakery Owner)", email: "bakery@bakeback.com", role: "bakery", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120", slogan: "Runs 'Crust & Crumb', manages surplus, creates Surprise Boxes & AI forecasts." },
    { name: "Marcus Vance (NGO Shelter)", email: "ngo@bakeback.com", role: "ngo", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120", slogan: "Claims bulk donations of wholesome bread to feed shelter residents." },
    { name: "Sarah Connor (Platform Admin)", email: "admin@bakeback.com", role: "admin", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120", slogan: "Approves compliance, audits safety certificates, and oversees carbon analytics." }
  ];

  return (
    <div id="home-view" className="space-y-12">
      {/* Hero Banner Section */}
      <section className="relative rounded-3xl overflow-hidden bg-brand-brown text-white py-16 px-8 md:px-16 shadow-xl">
        <div className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-overlay" 
             style={{ backgroundImage: `url('https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1200')` }}></div>
        <div className="relative max-w-2xl space-y-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-orange text-white">
            🌱 100% Sustainable & Fresh
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-display leading-tight">
            Rescue Delicious Baked Surplus. <br />
            <span className="text-brand-orange">Save Up to 70%!</span>
          </h1>
          <p className="text-lg text-amber-50">
            Join <strong>bakeback</strong> to help bakeries recover revenue from unsold goods, connect NGOs with premium donations, and secure fresh pastries, loaves, and surprise boxes before closing time.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              id="cta-explore-btn"
              onClick={() => onNavigate('explore')}
              className="px-6 py-3 rounded-xl bg-brand-orange hover:bg-orange-600 transition font-semibold flex items-center gap-2 text-white shadow-lg shadow-orange-700/30"
            >
              Browse Surplus Offers
              <ArrowRight size={18} />
            </button>
            <button 
              id="cta-learn-btn"
              onClick={() => onNavigate('about')}
              className="px-6 py-3 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 transition font-semibold"
            >
              How It Works
            </button>
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm flex items-start gap-4 hover:shadow-md transition">
            <div className={`p-4 rounded-xl ${stat.color} shrink-0`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-brand-brown tracking-tight">{stat.value}</p>
              <h3 className="font-semibold text-gray-800 text-sm mt-1">{stat.label}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{stat.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Role Play Tester Mode */}
      <section className="bg-brand-lightcream p-8 rounded-2xl border border-amber-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-amber-200/50 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-brown">Interactive Multi-User Simulation</h2>
            <p className="text-sm text-gray-600">
              Easily toggle between customer, bakery owner, NGO, and administrator personas to fully test each feature.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-amber-200">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-sage animate-ping"></span>
            <span className="text-xs font-semibold text-brand-brown">Current Role: {currentUser?.role.toUpperCase() || "VISITOR"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickPersonas.map((p) => {
            const isActive = currentUser?.role === p.role;
            return (
              <button
                key={p.role}
                id={`role-switch-${p.role}`}
                onClick={() => onSwitchRole(p.email)}
                className={`text-left p-5 rounded-xl border transition flex flex-col justify-between h-full bg-white relative overflow-hidden ${
                  isActive 
                    ? 'border-brand-orange ring-2 ring-brand-orange/20 shadow-md scale-[1.02]' 
                    : 'border-amber-100 hover:border-amber-300 shadow-sm'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase">
                    Active
                  </span>
                )}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full border object-cover" />
                    <div>
                      <h4 className="font-bold text-brand-brown text-sm line-clamp-1">{p.name}</h4>
                      <span className="text-[10px] uppercase tracking-wide font-semibold text-brand-sage">{p.role}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-3 italic leading-relaxed">
                    "{p.slogan}"
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between w-full">
                  <span className="text-[11px] text-brand-orange font-semibold">Simulate Login</span>
                  <span className="text-xs text-gray-400">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sustainable Vision & Value Proposition */}
      <section className="bg-white rounded-2xl border border-amber-100 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-brand-brown leading-tight">
            Reducing Bakery Waste, One Box at a Time
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Every day, thousands of bakeries are forced to discard fresh croissants, loaves of sourdough bread, and delicate pastries because they can only be sold for a single day.
          </p>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="p-1 rounded-full bg-orange-100 text-brand-orange shrink-0 self-start">✓</span>
              <div>
                <h4 className="font-semibold text-gray-900">Affordable Indulgence</h4>
                <p className="text-sm text-gray-500">Rescue Boxes and standard surplus items listed at discounts up to 70% off.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="p-1 rounded-full bg-emerald-100 text-brand-sage shrink-0 self-start">✓</span>
              <div>
                <h4 className="font-semibold text-gray-900">Charitable Redistribution</h4>
                <p className="text-sm text-gray-500">Unsold items can be instantly flagged for NGO pickup to serve local shelters.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="p-1 rounded-full bg-amber-100 text-amber-700 shrink-0 self-start">✓</span>
              <div>
                <h4 className="font-semibold text-gray-900">Frictionless Verification</h4>
                <p className="text-sm text-gray-500">Confirm reservation collections securely using automatic QR scan keys.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative rounded-2xl overflow-hidden h-72 shadow-lg">
          <img src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600" 
               alt="Bakery treats" 
               className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <div>
              <p className="text-white text-lg font-bold">Only {listingsCount} deals ending soon!</p>
              <button 
                onClick={() => onNavigate('explore')}
                className="text-brand-orange hover:text-white transition font-semibold text-xs flex items-center gap-1 mt-1"
              >
                Browse Now <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
