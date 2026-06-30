import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Plus, 
  Clock, 
  Award, 
  Leaf, 
  Check, 
  AlertCircle, 
  ChevronRight, 
  ChevronDown, 
  IndianRupee, 
  ShieldCheck, 
  Eye, 
  Heart,
  TrendingDown,
  Info
} from 'lucide-react';
import { ProductListing, Order, Donation, User, Review } from '../types';

interface BakeryDashboardProps {
  currentUser: User | null;
  listings: ProductListing[];
  onRefreshListings: () => void;
}

export default function BakeryDashboard({ currentUser, listings, onRefreshListings }: BakeryDashboardProps) {
  const bakeryProfile = currentUser?.bakeryProfile;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'orders' | 'donations' | 'forecast' | 'reviews'>('overview');

  // Listings state
  const [bakeryListings, setBakeryListings] = useState<ProductListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Form states for adding a new listing
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'pastry' | 'bread' | 'cookies' | 'cakes' | 'dessert' | 'savory' | 'other'>('pastry');
  const [formDescription, setFormDescription] = useState('');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formRescuePrice, setFormRescuePrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('3');
  const [formAllergens, setFormAllergens] = useState<string[]>([]);
  const [formIngredients, setFormIngredients] = useState('');
  const [formLabel, setFormLabel] = useState<'vegetarian' | 'eggless' | 'vegan' | 'none'>('none');
  const [formIsRescueBox, setFormIsRescueBox] = useState(false);
  const [formEstimatedValue, setFormEstimatedValue] = useState('');
  const [formHoursUntilExpiry, setFormHoursUntilExpiry] = useState('4');

  // AI Helpers loading state
  const [aiDescriptionLoading, setAiDescriptionLoading] = useState(false);
  const [aiDiscountLoading, setAiDiscountLoading] = useState(false);
  const [aiDiscountHours, setAiDiscountHours] = useState('3');
  const [aiDiscountDemand, setAiDiscountDemand] = useState('medium');
  const [aiJustification, setAiJustification] = useState('');

  // AI Forecast state
  const [forecastWeekday, setForecastWeekday] = useState('Tuesday');
  const [forecastWeather, setForecastWeather] = useState('Cloudy');
  const [forecastsList, setForecastsList] = useState<any[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);

  // AI Sustainability Report
  const [sustainabilityReport, setSustainabilityReport] = useState<string>('');
  const [sustainabilityRecs, setSustainabilityRecs] = useState<string[]>([]);
  const [sustainabilityLoading, setSustainabilityLoading] = useState(false);

  // QR Code Verification
  const [verifyQrCode, setVerifyQrCode] = useState('');
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Load Bakery Content
  const loadBakeryData = async () => {
    if (!bakeryProfile) return;
    try {
      // 1. Listings
      const listingsRes = await fetch(`/api/listings?bakeryId=${bakeryProfile.id}&status=all`);
      const listingsData = await listingsRes.json();
      setBakeryListings(listingsData);

      // 2. Orders
      const ordersRes = await fetch(`/api/orders?bakeryId=${bakeryProfile.id}`);
      const ordersData = await ordersRes.json();
      setOrders(ordersData);

      // 3. Donations
      const donationsRes = await fetch(`/api/donations?bakeryId=${bakeryProfile.id}`);
      const donationsData = await donationsRes.json();
      setDonations(donationsData);

      // 4. Reviews
      const bakeryRes = await fetch(`/api/bakeries/${bakeryProfile.id}`);
      const bakeryData = await bakeryRes.json();
      if (bakeryData.reviews) {
        setReviews(bakeryData.reviews);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBakeryData();
  }, [bakeryProfile, activeTab]);

  // Handle AI Description Generation
  const handleGenerateDescription = async () => {
    if (!formName) {
      alert("Please enter a product name first before generating descriptions!");
      return;
    }
    setAiDescriptionLoading(true);
    try {
      const res = await fetch("/api/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          ingredients: formIngredients,
          category: formCategory
        })
      });
      const data = await res.json();
      setFormDescription(data.text);
    } catch (err) {
      console.error(err);
    } finally {
      setAiDescriptionLoading(false);
    }
  };

  // Handle AI Smart Discount suggestion
  const handleGenerateSmartDiscount = async () => {
    const orig = Number(formOriginalPrice);
    if (!orig || orig <= 0) {
      alert("Please enter a valid original price first to evaluate discounts!");
      return;
    }
    setAiDiscountLoading(true);
    try {
      const res = await fetch("/api/ai/smart-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalPrice: orig,
          category: formCategory,
          hoursToExpiry: Number(aiDiscountHours),
          demandFactor: aiDiscountDemand
        })
      });
      const data = await res.json();
      if (data.suggestedPrice) {
        setFormRescuePrice(data.suggestedPrice.toFixed(2));
        setAiJustification(data.justification);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiDiscountLoading(false);
    }
  };

  // Handle Add Listing Submit
  const handleAddListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bakeryProfile) return;

    const bodyData = {
      bakeryId: bakeryProfile.id,
      name: formName,
      category: formCategory,
      description: formDescription,
      originalPrice: Number(formOriginalPrice),
      rescuePrice: Number(formRescuePrice),
      quantity: Number(formQuantity),
      expiryTime: new Date(Date.now() + Math.min(16, Number(formHoursUntilExpiry || 4)) * 3600000).toISOString(),
      allergens: formAllergens,
      ingredients: formIngredients,
      label: formLabel,
      isRescueBox: formIsRescueBox,
      estimatedValue: formIsRescueBox ? Number(formEstimatedValue || formOriginalPrice) : undefined,
      image: formIsRescueBox 
        ? "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400"
        : "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400"
    };

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        setShowAddForm(false);
        // Reset form
        setFormName('');
        setFormDescription('');
        setFormOriginalPrice('');
        setFormRescuePrice('');
        setFormHoursUntilExpiry('4');
        setAiJustification('');
        loadBakeryData();
        onRefreshListings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Listing
  const handleDeleteListing = async (id: string) => {
    if (!confirm("Are you sure you want to remove this active surplus offer?")) return;
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadBakeryData();
        onRefreshListings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post to NGO Donation directly
  const handleDonateListing = async (listing: ProductListing) => {
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bakeryId: listing.bakeryId,
          title: `Rescue: ${listing.quantity}x ${listing.name}`,
          description: `Converting surplus listing. Category: ${listing.category}. Ingredients: ${listing.ingredients || 'Safe daily baked goods'}`,
          quantity: listing.quantity
        })
      });
      if (res.ok) {
        // Mark listing as donated
        await fetch(`/api/listings/${listing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "donated", quantity: 0 })
        });
        alert("Success! Surplus products pushed to NGO Donation drive. Local NGOs will be notified.");
        loadBakeryData();
        onRefreshListings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // QR Code Verify Action
  const handleVerifyPickup = async (code: string) => {
    setVerifySuccess(null);
    setVerifyError(null);
    
    // Find matching order
    const match = orders.find(o => o.qrCode === code || o.id === code);
    if (!match) {
      setVerifyError("Order lookup failed. Please double check the QR confirmation code.");
      return;
    }

    try {
      const res = await fetch(`/api/orders/${match.id}/verify`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setVerifySuccess(`Verification complete! Rescued by ${match.customerName}. Revenue and carbon metrics compiled.`);
        setVerifyQrCode('');
        loadBakeryData();
      } else {
        setVerifyError(data.error || "Failed to verify order.");
      }
    } catch (err) {
      console.error(err);
      setVerifyError("Verification failed due to connectivity error.");
    }
  };

  // Trigger AI Demand Forecast
  const handleRunForecast = async () => {
    setForecastLoading(true);
    try {
      const res = await fetch("/api/ai/demand-forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bakeryId: bakeryProfile?.id,
          weekday: forecastWeekday,
          weather: forecastWeather
        })
      });
      const data = await res.json();
      if (data.forecasts) {
        setForecastsList(data.forecasts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setForecastLoading(false);
    }
  };

  // Trigger AI Carbon & Sustainability score coach report
  const handleRunSustainabilityReport = async () => {
    if (!bakeryProfile) return;
    setSustainabilityLoading(true);
    try {
      const res = await fetch("/api/ai/sustainability-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          savedKg: bakeryProfile.savedKg,
          savedCo2: bakeryProfile.savedCo2,
          mealsRescued: bakeryProfile.mealsRescued,
          donationsCount: donations.length
        })
      });
      const data = await res.json();
      setSustainabilityReport(data.carbonSavedText);
      setSustainabilityRecs(data.recommendations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSustainabilityLoading(false);
    }
  };

  return (
    <div id="bakery-dashboard-view" className="space-y-8">
      {/* Bakery Header Profile */}
      <section className="bg-white rounded-3xl p-6 md:p-8 border border-amber-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <img 
          src={bakeryProfile?.logo || "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=120"} 
          alt={bakeryProfile?.name} 
          className="w-20 h-20 rounded-2xl object-cover border shadow-sm shrink-0" 
        />
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
            <h1 className="text-2xl font-bold text-brand-brown">{bakeryProfile?.name}</h1>
            <span className="self-center bg-brand-sage text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              Verified Partner
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xl">{bakeryProfile?.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 justify-center md:justify-start font-medium">
            <span>📍 {bakeryProfile?.address}</span>
            <span>🕒 {bakeryProfile?.operatingHours}</span>
            <span>📞 {bakeryProfile?.contact}</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 bg-brand-lightcream px-4 py-3 rounded-2xl border border-amber-100">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-gray-400">Sustainability Score</span>
            <p className="text-2xl font-extrabold text-brand-sage">{bakeryProfile?.sustainabilityScore}/100</p>
          </div>
          <Award className="w-8 h-8 text-brand-sage" />
        </div>
      </section>

      {/* Dashboard Submenu Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-amber-100 pb-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'listings', label: `My Listings (${bakeryListings.length})` },
          { id: 'orders', label: `Reservations (${orders.length})` },
          { id: 'donations', label: `NGO Donations (${donations.length})` },
          { id: 'forecast', label: 'AI Forecasts & Insights' },
          { id: 'reviews', label: `Reviews (${reviews.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            id={`bakery-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition ${
              activeTab === tab.id
                ? 'bg-brand-brown text-white shadow-sm'
                : 'text-gray-500 hover:text-brand-brown hover:bg-amber-50/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Waste Prevented", value: `${bakeryProfile?.savedKg} kg`, desc: "Total baked weight rescued", icon: Leaf, color: "text-brand-sage" },
              { label: "CO₂ Prevention Offset", value: `${bakeryProfile?.savedCo2} kg`, desc: "Prevented emissions", icon: Sparkles, color: "text-indigo-600" },
              { label: "Rescued Customer Meals", value: bakeryProfile?.mealsRescued, desc: "Satisfied customers", icon: Award, color: "text-brand-orange" },
              { label: "Revenue Recovered", value: `₹${bakeryProfile?.revenueRecovered.toFixed(2)}`, desc: "Recovered from food waste", icon: IndianRupee, color: "text-amber-800" },
            ].map((card, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-amber-50 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{card.label}</span>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-extrabold text-brand-brown tracking-tight">{card.value}</p>
                <p className="text-[10px] text-gray-500">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* QR Verification Scanner Box */}
            <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-brand-brown">
                <span className="text-xl">📷</span>
                <h3 className="font-bold text-base">QR Pickup Code Verification</h3>
              </div>
              <p className="text-xs text-gray-500">
                When customers pick up their reserved baked surplus, scan or type their pickup token code below to instantly complete the transaction.
              </p>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g. RESCUE_CONF_ORD102_7K2D"
                  value={verifyQrCode}
                  onChange={(e) => setVerifyQrCode(e.target.value)}
                  className="w-full text-xs font-mono p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-orange focus:outline-none"
                />
                <button
                  onClick={() => handleVerifyPickup(verifyQrCode)}
                  className="w-full py-2.5 bg-brand-brown hover:bg-brand-darkbrown text-white rounded-xl font-bold text-xs transition"
                >
                  Verify Collection Code
                </button>
              </div>

              {verifySuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-start gap-2 border border-emerald-100">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{verifySuccess}</span>
                </div>
              )}

              {verifyError && (
                <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl flex items-start gap-2 border border-red-100">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>{verifyError}</span>
                </div>
              )}

              {/* Fast test selector */}
              <div className="border-t border-gray-100 pt-3">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Simulate scanning of active orders:</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {orders.filter(o => o.status === "reserved").map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setVerifyQrCode(o.qrCode)}
                      className="w-full text-left p-2 bg-amber-50 hover:bg-amber-100/70 rounded-lg text-[11px] font-mono flex justify-between text-brand-brown"
                    >
                      <span>{o.customerName}: {o.listingName}</span>
                      <span className="text-brand-orange font-semibold">Select Code</span>
                    </button>
                  ))}
                  {orders.filter(o => o.status === "reserved").length === 0 && (
                    <span className="text-[10px] text-gray-400 italic">No pending collections to verify.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Listing Status Overview */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-amber-100 p-6 space-y-4 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-brand-brown">Current Leftovers Available</h3>
                <p className="text-xs text-gray-500">Overview of surplus currently posted on the public customer marketplace.</p>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-56">
                {bakeryListings.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">No active surplus listing posted today. Click listings above to add some!</div>
                ) : (
                  bakeryListings.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{l.isRescueBox ? "🎁" : "🥐"}</span>
                        <div>
                          <h4 className="font-bold text-xs text-gray-800">{l.name}</h4>
                          <p className="text-[10px] text-gray-400">Qty: {l.quantity} | ₹{l.rescuePrice.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold capitalize ${
                          l.status === "available" ? "bg-emerald-50 text-brand-sage" : "bg-amber-50 text-amber-700"
                        }`}>
                          {l.status}
                        </span>
                        <button
                          onClick={() => handleDonateListing(l)}
                          className="px-2.5 py-1 bg-brand-orange hover:bg-orange-600 text-white rounded-lg text-[10px] font-bold transition"
                        >
                          Donate to NGO
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setActiveTab('listings')}
                className="w-full py-2 bg-brand-lightcream border border-amber-200 text-brand-brown text-xs font-bold rounded-xl text-center"
              >
                Go to listings manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY LISTINGS */}
      {activeTab === 'listings' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-brand-brown">Surplus Product Inventory</h2>
              <p className="text-xs text-gray-500">Post new unsold baked products, create Surprise Boxes, or manage pricing.</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
            >
              <Plus size={14} />
              {showAddForm ? "Collapse Form" : "List New Surplus"}
            </button>
          </div>

          {/* ADD LISTING FORM WITH INTEGRATED AI ASSISTANCE */}
          {showAddForm && (
            <form onSubmit={handleAddListingSubmit} className="bg-white rounded-3xl p-6 border border-amber-100 shadow-md space-y-6 animate-in slide-in-from-top-4 duration-200">
              <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                <h3 className="font-bold text-sm text-brand-brown uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-orange" /> Listing Creation & AI Assistant Panel
                </h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-500">🎁 This is a Surprise Rescue Box:</label>
                  <input
                    type="checkbox"
                    checked={formIsRescueBox}
                    onChange={(e) => setFormIsRescueBox(e.target.checked)}
                    className="rounded text-brand-orange focus:ring-brand-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Product Name / Box Title:</label>
                    <input
                      type="text"
                      required
                      placeholder={formIsRescueBox ? "e.g. Sweet Surprise Box" : "e.g. Multigrain Sourdough Boule"}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  {/* Category and label */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Category:</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as any)}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none"
                      >
                        <option value="pastry">Pastry</option>
                        <option value="bread">Bread</option>
                        <option value="cookies">Cookies</option>
                        <option value="cakes">Cakes</option>
                        <option value="dessert">Dessert</option>
                        <option value="savory">Savory</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Dietary Label:</label>
                      <select
                        value={formLabel}
                        onChange={(e) => setFormLabel(e.target.value as any)}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none"
                      >
                        <option value="none">None (Standard)</option>
                        <option value="vegetarian">🌱 Vegetarian</option>
                        <option value="vegan">🌱 Vegan</option>
                        <option value="eggless">🥚 Eggless</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing, Qty and Expiry */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Original Price (₹):</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="280"
                        value={formOriginalPrice}
                        onChange={(e) => setFormOriginalPrice(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Rescue Price (₹):</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="110"
                        value={formRescuePrice}
                        onChange={(e) => setFormRescuePrice(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Quantity:</label>
                      <input
                        type="number"
                        required
                        value={formQuantity}
                        onChange={(e) => setFormQuantity(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Hours to Expiry (Max 16):</label>
                      <input
                        type="number"
                        min="1"
                        max="16"
                        required
                        value={formHoursUntilExpiry}
                        onChange={(e) => {
                          if (e.target.value === '') {
                            setFormHoursUntilExpiry('');
                          } else {
                            const val = Math.min(16, Math.max(1, Number(e.target.value)));
                            setFormHoursUntilExpiry(String(val));
                          }
                        }}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  </div>

                  {formIsRescueBox && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Estimated Total Box Value (₹):</label>
                      <input
                        type="number"
                        placeholder="e.g. 800"
                        value={formEstimatedValue}
                        onChange={(e) => setFormEstimatedValue(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Ingredients */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Key Ingredients (comma separated):</label>
                    <input
                      type="text"
                      placeholder="e.g. sourdough discard, rye flour, sesame, sea salt"
                      value={formIngredients}
                      onChange={(e) => setFormIngredients(e.target.value)}
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* AI Helpers Column */}
                <div className="space-y-4 bg-brand-lightcream p-5 rounded-2xl border border-amber-100">
                  <h4 className="font-bold text-xs text-brand-brown uppercase tracking-wider flex items-center gap-1">
                    ⚡ Instant AI Generator Toolkit
                  </h4>

                  {/* AI Smart Discount Widget */}
                  <div className="p-3 bg-white rounded-xl border border-amber-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-brand-brown flex items-center gap-1">
                        🏷️ Smart Discount Engine
                      </span>
                      <button
                        type="button"
                        onClick={handleGenerateSmartDiscount}
                        disabled={aiDiscountLoading}
                        className="text-[10px] font-bold bg-brand-orange hover:bg-orange-600 text-white px-2 py-1 rounded"
                      >
                        {aiDiscountLoading ? "Evaluating..." : "Evaluate Price"}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-gray-600">
                      <div>
                        <span className="block mb-1">Hours left (Max 16):</span>
                        <input
                          type="number"
                          min="1"
                          max="16"
                          value={aiDiscountHours}
                          onChange={(e) => {
                            if (e.target.value === '') {
                              setAiDiscountHours('');
                            } else {
                              const val = Math.min(16, Math.max(1, Number(e.target.value)));
                              setAiDiscountHours(String(val));
                            }
                          }}
                          className="bg-gray-50 border border-gray-200 rounded p-1 w-full text-[10px]"
                        />
                      </div>
                      <div>
                        <span className="block mb-1">Current Store Demand:</span>
                        <select 
                          value={aiDiscountDemand} 
                          onChange={(e) => setAiDiscountDemand(e.target.value)}
                          className="bg-gray-50 border border-gray-200 rounded p-1 w-full text-[10px]"
                        >
                          <option value="low">Low Demand</option>
                          <option value="medium">Normal Demand</option>
                          <option value="high">High Demand</option>
                        </select>
                      </div>
                    </div>

                    {aiJustification && (
                      <p className="text-[10px] text-brand-sage bg-emerald-50 p-2 rounded leading-relaxed border border-emerald-100/50">
                        ✨ {aiJustification}
                      </p>
                    )}
                  </div>

                  {/* AI Copier text generator */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-gray-700">Engaging Product Description:</label>
                      <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={aiDescriptionLoading}
                        className="text-[10px] font-bold bg-brand-brown text-white px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-brand-darkbrown transition shrink-0"
                      >
                        <Sparkles size={10} />
                        {aiDescriptionLoading ? "Writing..." : "AI Generate Desc"}
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Write description here or use AI Generate to write an appetizing surplus-themed text..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full text-xs p-2 border border-gray-200 bg-white rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/10"
                >
                  Publish Surplus Offer
                </button>
              </div>
            </form>
          )}

          {/* LISTINGS TABLE */}
          <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-amber-50">
              <h3 className="font-bold text-sm text-brand-brown uppercase tracking-wider">Active Surplus Directory</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-lightcream/50 text-[10px] uppercase font-bold text-gray-400 border-b border-amber-50">
                    <th className="p-4">Item details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Original</th>
                    <th className="p-4">Rescue Price</th>
                    <th className="p-4">Inventory</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50 text-xs">
                  {bakeryListings.map((l) => (
                    <tr key={l.id} className="hover:bg-amber-50/20">
                      <td className="p-4 font-bold text-brand-brown">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{l.isRescueBox ? "🎁" : "🥖"}</span>
                          <div>
                            <p>{l.name}</p>
                            <span className="text-[9px] uppercase tracking-wide font-bold text-brand-sage">{l.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 capitalize text-gray-500">{l.isRescueBox ? "Rescue Box" : l.category}</td>
                      <td className="p-4 text-gray-400 line-through">₹{l.originalPrice.toFixed(2)}</td>
                      <td className="p-4 font-bold text-brand-brown">₹{l.rescuePrice.toFixed(2)}</td>
                      <td className="p-4 font-semibold">{l.quantity} units</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          l.status === 'available' ? 'bg-emerald-50 text-brand-sage' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {l.status === "available" && (
                          <button
                            onClick={() => handleDonateListing(l)}
                            className="text-[10px] bg-brand-sage hover:bg-emerald-600 text-white font-bold px-2 py-1 rounded"
                          >
                            Donate
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteListing(l.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={15} className="inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {bakeryListings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-gray-400 italic">No listings on record. List one to get started!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RESERVATIONS */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold text-brand-brown">Customer Reservations</h2>
            <p className="text-xs text-gray-500">Track and fulfill reserved orders when customers present their rescue codes.</p>
          </div>

          <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-lightcream/50 text-[10px] uppercase font-bold text-gray-400 border-b border-amber-50">
                  <th className="p-4">Reservation ID</th>
                  <th className="p-4">Item Rescued</th>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Pickup Window</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Verification Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50 text-xs">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-amber-50/20">
                    <td className="p-4 font-mono font-bold text-gray-500">{o.id}</td>
                    <td className="p-4 font-bold text-brand-brown">{o.listingName}</td>
                    <td className="p-4 text-gray-600 font-medium">{o.customerName}</td>
                    <td className="p-4 font-extrabold text-brand-brown">₹{o.totalAmount.toFixed(2)}</td>
                    <td className="p-4 text-gray-500">{o.pickupSlot}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        o.status === "completed" 
                          ? "bg-emerald-50 text-brand-sage" 
                          : o.status === "cancelled" 
                            ? "bg-red-50 text-red-600" 
                            : "bg-orange-50 text-brand-orange animate-pulse"
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {o.status === "reserved" ? (
                        <button
                          onClick={() => handleVerifyPickup(o.qrCode)}
                          className="px-2.5 py-1 rounded bg-brand-brown text-white text-[10px] font-bold hover:bg-brand-darkbrown"
                        >
                          Fulfill Pickup
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-gray-400 uppercase">{o.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-400 italic">No customer reservations logged yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: NGO DONATIONS */}
      {activeTab === 'donations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-brand-brown">NGO Charity Donations</h2>
              <p className="text-xs text-gray-500">Provide direct edible surplus to certified food banks and shelters.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Donation Form */}
            <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-4 shadow-sm h-fit">
              <h3 className="font-bold text-sm text-brand-brown uppercase tracking-wider flex items-center gap-1">
                🌱 Direct Donation Alert
              </h3>
              <p className="text-xs text-gray-500">
                Have unsliced leftover bread, bulk cookies, or pastries safe for consumption? Post a wholesale donation request directly to certified local shelters.
              </p>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g. 10 Sourdough loaves & croissants"
                  id="direct-donation-title"
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50"
                />
                <input
                  type="number"
                  placeholder="Estimated Weight (kg)"
                  id="direct-donation-weight"
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const titleInput = document.getElementById("direct-donation-title") as HTMLInputElement;
                    const weightInput = document.getElementById("direct-donation-weight") as HTMLInputElement;
                    if (!titleInput.value) return alert("Please specify a donation title.");
                    
                    const res = await fetch("/api/donations", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        bakeryId: bakeryProfile?.id,
                        title: titleInput.value,
                        description: "Bulk safe edible surplus baked fresh today.",
                        quantity: Number(weightInput.value || 5)
                      })
                    });
                    if (res.ok) {
                      titleInput.value = '';
                      weightInput.value = '';
                      alert("Donation posted! Community NGOs have been alerted.");
                      loadBakeryData();
                    }
                  }}
                  className="w-full py-2.5 bg-brand-sage hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition"
                >
                  Broadcast Donation Alert
                </button>
              </div>
            </div>

            {/* Donation Records */}
            <div className="md:col-span-2 bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-amber-50">
                <h3 className="font-bold text-sm text-brand-brown uppercase tracking-wider">Donations Ledger</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-lightcream/50 text-[10px] uppercase font-bold text-gray-400 border-b border-amber-50">
                    <th className="p-4">Donation batch</th>
                    <th className="p-4">Weight (kg)</th>
                    <th className="p-4">Claiming NGO</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Scheduled Pick-up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50 text-xs">
                  {donations.map((d) => (
                    <tr key={d.id} className="hover:bg-amber-50/20">
                      <td className="p-4 font-bold text-brand-brown">{d.title}</td>
                      <td className="p-4 font-semibold">{d.quantity} kg</td>
                      <td className="p-4 text-gray-500 font-medium">{d.ngoName || "Waiting for NGO..."}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          d.status === "completed" 
                            ? "bg-emerald-50 text-brand-sage" 
                            : d.status === "accepted" 
                              ? "bg-amber-50 text-amber-700 animate-pulse" 
                              : "bg-blue-50 text-blue-600"
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">
                        {d.scheduledPickup ? new Date(d.scheduledPickup).toLocaleString() : "TBD"}
                      </td>
                    </tr>
                  ))}
                  {donations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-gray-400 italic">No donations registered. Let's feed the community!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AI FORECASTS & IMPACT */}
      {activeTab === 'forecast' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold text-brand-brown">AI Demand forecasting & Carbon Coaching</h2>
            <p className="text-xs text-gray-500">Harness Gemini artificial intelligence to forecast surplus bakery items and measure ecological impact.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Leftover Demand Forecaster widget */}
            <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-brand-brown uppercase tracking-wider flex items-center gap-1">
                  🔮 AI Demand Forecaster
                </h3>
                <button
                  onClick={handleRunForecast}
                  disabled={forecastLoading}
                  className="text-xs font-bold bg-brand-orange hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition"
                >
                  {forecastLoading ? "Calculating Forecasts..." : "Generate Projections"}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Predict leftovers for tomorrow by configuring weekday and weather patterns so you can adjust your dough batch sizes proactively!
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="block font-semibold text-gray-600">Simulated Weekday:</span>
                  <select
                    value={forecastWeekday}
                    onChange={(e) => setForecastWeekday(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday (Pre-weekend)</option>
                    <option value="Saturday">Saturday (Weekend rush)</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="block font-semibold text-gray-600">Weather Forecast:</span>
                  <select
                    value={forecastWeather}
                    onChange={(e) => setForecastWeather(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                  >
                    <option value="Sunny">Sunny & Warm</option>
                    <option value="Cloudy">Cool & Cloudy</option>
                    <option value="Rainy">Heavy Rain (Drops foot traffic)</option>
                    <option value="Stormy">Severe Weather Warnings</option>
                  </select>
                </div>
              </div>

              {/* Forecast outputs list */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                {forecastsList.map((f, idx) => (
                  <div key={idx} className="p-3 bg-brand-lightcream border border-amber-100 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-brand-brown">{f.itemName}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        f.confidenceLevel === "High" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                      }`}>
                        {f.confidenceLevel} Leftover Risk
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>Predicted Surplus: <strong>{f.forecastedLeftoverQty} units</strong></span>
                      <span className="italic text-brand-orange">Action: {f.recommendedAction}</span>
                    </div>
                  </div>
                ))}
                {forecastsList.length === 0 && (
                  <div className="text-center py-6 text-xs text-gray-400 italic">Click "Generate Projections" to evaluate inventory risk models.</div>
                )}
              </div>
            </div>

            {/* AI Carbon reduction & Coach reporter */}
            <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-brand-brown uppercase tracking-wider flex items-center gap-1">
                    ✨ AI Carbon mitigation Coach
                  </h3>
                  <button
                    onClick={handleRunSustainabilityReport}
                    disabled={sustainabilityLoading}
                    className="text-xs font-bold bg-brand-sage hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition"
                  >
                    {sustainabilityLoading ? "Analyzing carbon..." : "Generate Impact Report"}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Analyze your positive carbon prevention stats to fetch personalized feedback and operational tips to maximize sales.
                </p>
              </div>

              {sustainabilityReport ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-brand-sage/20 text-xs text-emerald-800 leading-relaxed font-medium">
                    {sustainabilityReport}
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Actionable Recommendations:</span>
                    <ul className="space-y-2 text-xs">
                      {sustainabilityRecs.map((rec, i) => (
                        <li key={i} className="flex gap-2 text-gray-600 leading-relaxed items-start">
                          <span className="text-brand-orange font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-gray-400 italic border border-dashed border-gray-100 rounded-xl">
                  Click the button to process carbon metric stats and unlock advanced sustainability tips.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold text-brand-brown">Customer Review Cards</h2>
            <p className="text-xs text-gray-500">Read ratings and critiques posted by customers who rescued your surplus goods.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <div>
                      <h4 className="font-bold text-xs text-brand-brown">{r.customerName}</h4>
                      <p className="text-[9px] text-gray-400">{new Date(r.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-brand-orange font-bold">
                    <span>★ {r.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed italic">
                  "{r.comment}"
                </p>
                <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-gray-400 pt-2 border-t border-gray-50 text-center">
                  <div>Quality: <span className="text-brand-brown">{r.foodQuality}/5</span></div>
                  <div>Freshness: <span className="text-brand-brown">{r.freshness}/5</span></div>
                  <div>Pickup: <span className="text-brand-brown">{r.pickupExperience}/5</span></div>
                  <div>Value: <span className="text-brand-brown">{r.valueForMoney}/5</span></div>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="md:col-span-2 text-center py-12 bg-white rounded-2xl border border-amber-100 text-gray-400 text-xs">
                No reviews recorded yet for your bakery.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
