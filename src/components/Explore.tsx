import React, { useState, useEffect } from 'react';
import { Search, MapPin, SlidersHorizontal, ShoppingCart, Tag, ShieldCheck, Heart, Star, Compass, Clock, Check, HelpCircle } from 'lucide-react';
import { ProductListing, User } from '../types';

interface ExploreProps {
  currentUser: User | null;
  onNavigate: (page: string) => void;
  onReserve: (listingId: string, quantity: number, pickupSlot: string) => Promise<any>;
}

export default function Explore({ currentUser, onNavigate, onReserve }: ExploreProps) {
  // Listings and search state
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLabel, setSelectedLabel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('ending_soon');
  const [loading, setLoading] = useState(true);

  // Favorites state (local state, persists inside memory/session)
  const [favorites, setFavorites] = useState<string[]>([]);

  // Cart/Checkout state
  const [cart, setCart] = useState<{ listing: ProductListing; qty: number } | null>(null);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [pickupSlot, setPickupSlot] = useState('');
  const [submittingReservation, setSubmittingReservation] = useState(false);

  // Map view state
  const [showMapView, setShowMapView] = useState(false);
  const [selectedMapBakery, setSelectedMapBakery] = useState<string | null>(null);

  // Load listings from REST API
  const fetchListings = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedCategory !== 'all') query.append('category', selectedCategory);
      if (selectedLabel !== 'all') query.append('label', selectedLabel);
      if (search) query.append('search', search);

      const res = await fetch(`/api/listings?${query.toString()}`);
      const data = await res.json();
      
      // Client sort fallback
      let sortedData = [...data];
      if (sortBy === 'cheapest') {
        sortedData.sort((a, b) => a.rescuePrice - b.rescuePrice);
      } else if (sortBy === 'highest_discount') {
        sortedData.sort((a, b) => {
          const discA = ((a.originalPrice - a.rescuePrice) / a.originalPrice);
          const discB = ((b.originalPrice - b.rescuePrice) / b.originalPrice);
          return discB - discA;
        });
      } else if (sortBy === 'ending_soon') {
        sortedData.sort((a, b) => new Date(a.expiryTime).getTime() - new Date(b.expiryTime).getTime());
      }

      setListings(sortedData);
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [search, selectedCategory, selectedLabel, sortBy]);

  // Toggle favorite helper
  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fav => fav !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  // Open Checkout / Add to cart
  const handleAddToCart = (listing: ProductListing) => {
    setCart({ listing, qty: 1 });
    setPickupSlot(`${listing.pickupStart} - ${listing.pickupEnd}`);
    setCheckoutModal(true);
    setCheckoutSuccess(false);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || !currentUser) return;

    setSubmittingReservation(true);
    try {
      const response = await onReserve(cart.listing.id, cart.qty, pickupSlot);
      if (response && !response.error) {
        setCheckoutSuccess(true);
        setTimeout(() => {
          setCheckoutModal(false);
          setCart(null);
          fetchListings(); // Refresh inventory
          onNavigate('orders'); // Go to My Orders page
        }, 2200);
      } else {
        alert(response.error || "Failed to make reservation. Check quantity.");
      }
    } catch (err) {
      console.error(err);
      alert("Error confirming reservation.");
    } finally {
      setSubmittingReservation(false);
    }
  };

  return (
    <div id="explore-view" className="space-y-8">
      {/* Title Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-brown">Marketplace Explorer</h1>
          <p className="text-gray-600 text-sm">Discover and rescue discounted goodies ending soon near you.</p>
        </div>
        <div className="flex gap-3">
          <button
            id="toggle-map-btn"
            onClick={() => setShowMapView(!showMapView)}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 border text-sm transition ${
              showMapView 
                ? 'bg-brand-brown border-brand-brown text-white shadow-sm' 
                : 'bg-white border-amber-100 hover:border-amber-300 text-brand-brown'
            }`}
          >
            <Compass size={18} />
            {showMapView ? "View List Grid" : "Interactive Live Map"}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
            <input
              id="search-input"
              type="text"
              placeholder="Search by bakery name, croissants, bread..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-brand-orange focus:bg-white focus:outline-none rounded-xl text-sm"
            />
          </div>

          {/* Label Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Dietary:</span>
            {['all', 'vegan', 'vegetarian', 'eggless'].map((label) => (
              <button
                key={label}
                id={`filter-label-${label}`}
                onClick={() => setSelectedLabel(label)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition ${
                  selectedLabel === label
                    ? 'bg-brand-sage border-brand-sage text-white'
                    : 'bg-white border-amber-100 text-gray-600 hover:border-amber-300'
                }`}
              >
                {label === 'all' ? 'All Diets' : label}
              </button>
            ))}
          </div>

          {/* Sort Selection */}
          <div className="flex items-center gap-2 border-l border-gray-100 pl-2">
            <SlidersHorizontal size={14} className="text-gray-400 shrink-0" />
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-brand-brown focus:ring-0 cursor-pointer focus:outline-none"
            >
              <option value="ending_soon">Ending Soon</option>
              <option value="cheapest">Price: Low to High</option>
              <option value="highest_discount">Highest Discount</option>
            </select>
          </div>
        </div>

        {/* Category Filters row */}
        <div className="flex flex-wrap items-center gap-2 border-t border-amber-50 pt-3">
          {['all', 'pastry', 'bread', 'cookies', 'cakes', 'dessert', 'savory'].map((category) => (
            <button
              key={category}
              id={`filter-category-${category}`}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition capitalize ${
                selectedCategory === category
                  ? 'bg-brand-orange text-white shadow-sm'
                  : 'bg-amber-50/50 hover:bg-amber-50 text-brand-brown hover:text-orange-700'
              }`}
            >
              {category === 'all' ? '🥐 All Goods' : category}
            </button>
          ))}
        </div>
      </div>

      {/* INTERACTIVE LIVE MAP VIEW */}
      {showMapView && (
        <div id="interactive-live-map" className="bg-white border border-amber-100 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-brand-brown">Nearby Rescue Map</h2>
              <p className="text-xs text-gray-500">Visual coordinates of participating surplus hubs in your neighborhood.</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-brand-orange"></span> Bakery</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-brand-sage"></span> Active Deals</span>
            </div>
          </div>

          {/* Visual Interactive SVG Map Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 relative h-96 bg-sky-50 rounded-2xl overflow-hidden border border-sky-100 shadow-inner flex items-center justify-center">
              {/* Map Grid Elements */}
              <div className="absolute inset-0 opacity-15" style={{ 
                backgroundImage: 'radial-gradient(#5d4037 1px, transparent 1px), radial-gradient(#5d4037 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px'
              }}></div>
              
              {/* Street representation */}
              <div className="absolute top-1/3 left-0 w-full h-10 bg-gray-200/50 -rotate-2"></div>
              <div className="absolute top-0 left-1/2 w-12 h-full bg-gray-200/50 rotate-12"></div>
              <div className="absolute top-3/4 left-0 w-full h-8 bg-gray-200/50 rotate-3"></div>

              {/* Map Pins */}
              {/* Pin 1: Crust & Crumb Bakery */}
              <button
                onClick={() => setSelectedMapBakery("bakery-crust")}
                className="absolute top-1/4 left-1/3 group transform -translate-x-1/2 -translate-y-1/2 focus:outline-none"
              >
                <div className="relative flex flex-col items-center">
                  <div className="p-2 rounded-full bg-brand-brown text-white shadow-md group-hover:scale-110 transition duration-200">
                    <MapPin className="w-5 h-5 text-brand-orange" fill="currentColor" />
                  </div>
                  <div className="mt-1 bg-brand-brown text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    Crust & Crumb
                  </div>
                  <span className="absolute -top-1 -right-1 bg-brand-sage text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    4
                  </span>
                </div>
              </button>

              {/* Pin 2: General Bakery */}
              <button
                onClick={() => setSelectedMapBakery("bakery-other")}
                className="absolute top-2/3 left-2/3 group transform -translate-x-1/2 -translate-y-1/2 focus:outline-none"
              >
                <div className="relative flex flex-col items-center">
                  <div className="p-2 rounded-full bg-brand-brown text-white shadow-md opacity-70 group-hover:opacity-100 transition">
                    <MapPin className="w-5 h-5 text-yellow-500" fill="currentColor" />
                  </div>
                  <div className="mt-1 bg-white border border-gray-200 text-brand-brown text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    Golden Grain
                  </div>
                </div>
              </button>

              {/* Compass Indicator */}
              <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded-full border border-gray-200">
                <Compass className="w-5 h-5 text-brand-brown animate-spin" style={{ animationDuration: '8s' }} />
              </div>
            </div>

            {/* Map Sidebar details */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-brand-brown uppercase tracking-wider">Map Selections</h3>
              {selectedMapBakery === "bakery-crust" ? (
                <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=120" className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-bold text-sm text-brand-brown">Crust & Crumb</h4>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Star className="w-3 h-3 text-brand-orange" fill="currentColor" /> 4.8 Rating
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Located 1.2 miles away. pickup times: <strong>17:00 - 19:00</strong>. Active bakery supporting community NGO drives.
                  </p>
                  <button 
                    onClick={() => {
                      setSearch("Crust & Crumb");
                      setShowMapView(false);
                    }}
                    className="w-full py-1.5 rounded-lg bg-brand-orange text-white font-bold text-xs hover:bg-orange-600 transition"
                  >
                    View Active Listings ({listings.length})
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center h-64 text-gray-500">
                  <MapPin className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-xs">Click on any map pin to inspect store location and browse current sustainability surplus lists.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LOADING AND LISTINGS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-80 border border-amber-50 animate-pulse space-y-3 p-4">
              <div className="bg-gray-200 h-40 rounded-xl w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center max-w-lg mx-auto space-y-4">
          <p className="text-4xl">🥐</p>
          <h3 className="text-xl font-bold text-brand-brown">No Surplus Found</h3>
          <p className="text-sm text-gray-500">
            No active goods found for this category or filter right now. Bakeries usually post fresh surplus listings between 15:00 and 18:00 daily.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedLabel('all');
              setSearch('');
            }}
            className="px-4 py-2 bg-brand-orange text-white text-xs font-bold rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((l) => {
            const discount = Math.round(((l.originalPrice - l.rescuePrice) / l.originalPrice) * 100);
            const hoursLeft = Math.max(0, Math.ceil((new Date(l.expiryTime).getTime() - Date.now()) / 3600000));
            const isFav = favorites.includes(l.id);

            return (
              <div
                key={l.id}
                id={`product-card-${l.id}`}
                className="bg-white rounded-2xl border border-amber-100 hover:border-amber-300 shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Image Section */}
                <div className="relative h-44 bg-gray-100">
                  <img src={l.image} alt={l.name} className="w-full h-full object-cover" />
                  
                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm border border-amber-100 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full text-brand-brown">
                    {l.isRescueBox ? "🎁 Surprise Box" : l.category}
                  </span>

                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(l.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-rose-500 hover:bg-white shadow transition"
                  >
                    <Heart className="w-4 h-4" fill={isFav ? "currentColor" : "none"} />
                  </button>

                  {/* Discount Badge */}
                  <span className="absolute bottom-3 left-3 bg-brand-orange text-white text-xs font-extrabold px-2 py-0.5 rounded-lg shadow">
                    -{discount}% OFF
                  </span>

                  {/* Expiry Clock */}
                  <span className="absolute bottom-3 right-3 bg-brand-brown/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow">
                    <Clock size={10} />
                    {hoursLeft <= 0 ? "Expired" : `${hoursLeft}h left`}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Bakery Name */}
                    <p className="text-[11px] font-semibold text-brand-sage uppercase tracking-wide flex items-center gap-1">
                      <MapPin size={10} />
                      {l.bakeryName}
                    </p>

                    {/* Product Name */}
                    <h3 className="font-bold text-gray-900 text-base mt-1 line-clamp-1">{l.name}</h3>
                    
                    {/* Description */}
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[32px]">{l.description}</p>
                    
                    {/* Dietary Label */}
                    {l.label && l.label !== 'none' && (
                      <span className="inline-block bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded mt-2 border border-emerald-100 uppercase">
                        🌱 {l.label}
                      </span>
                    )}
                  </div>

                  {/* Price and Rescue CTA */}
                  <div className="pt-2 border-t border-amber-50">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <span className="text-lg font-extrabold text-brand-brown">₹{l.rescuePrice.toFixed(2)}</span>
                        <span className="text-xs text-gray-400 line-through ml-2">₹{l.originalPrice.toFixed(2)}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                        {l.quantity} available
                      </span>
                    </div>

                    {currentUser?.role === "customer" ? (
                      <button
                        onClick={() => handleAddToCart(l)}
                        disabled={l.quantity <= 0 || hoursLeft <= 0}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                          l.quantity <= 0 || hoursLeft <= 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-brand-brown hover:bg-brand-darkbrown text-white shadow-sm'
                        }`}
                      >
                        <ShoppingCart size={14} />
                        {l.quantity <= 0 ? "Sold Out" : "Reserve Surplus Item"}
                      </button>
                    ) : (
                      <div className="text-center py-1.5 bg-gray-50 rounded-lg text-[10px] text-gray-500 font-medium">
                        Log in as Customer to Reserve
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CHECKOUT / PAYMENT MODAL DRAWER */}
      {checkoutModal && cart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-amber-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {checkoutSuccess ? (
              <div className="p-10 text-center space-y-4">
                <div className="w-16 h-16 bg-brand-sage text-white rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
                  ✓
                </div>
                <h3 className="text-2xl font-bold text-brand-brown">Surplus Rescued!</h3>
                <p className="text-sm text-gray-500">
                  Your reservation of <strong>{cart.listing.name}</strong> was confirmed successfully. We have auto-generated your pickup QR code inside your orders ledger!
                </p>
                <div className="py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg max-w-xs mx-auto">
                  +15 Rescue Points Added 🌿
                </div>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-5">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="text-lg font-bold text-brand-brown">Confirm Reservation</h3>
                  <button 
                    type="button" 
                    onClick={() => setCheckoutModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Item Details Card */}
                <div className="flex gap-3 bg-brand-lightcream p-3 rounded-xl border border-amber-100">
                  <img src={cart.listing.image} className="w-16 h-16 object-cover rounded-lg" />
                  <div>
                    <h4 className="font-bold text-sm text-brand-brown">{cart.listing.name}</h4>
                    <p className="text-xs text-gray-500">{cart.listing.bakeryName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-extrabold text-brand-brown">₹{cart.listing.rescuePrice.toFixed(2)}</span>
                      <span className="text-xs text-gray-400 line-through">₹{cart.listing.originalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity select */}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700">Select Quantity:</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={cart.qty <= 1}
                      onClick={() => setCart({ ...cart, qty: cart.qty - 1 })}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center font-bold text-brand-brown hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm">{cart.qty}</span>
                    <button
                      type="button"
                      disabled={cart.qty >= cart.listing.quantity}
                      onClick={() => setCart({ ...cart, qty: cart.qty + 1 })}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center font-bold text-brand-brown hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Pickup Window */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Clock size={12} className="text-brand-orange" /> Designated Pickup Slot:
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupSlot}
                    onChange={(e) => setPickupSlot(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-semibold focus:outline-none focus:border-brand-orange focus:bg-white"
                  />
                  <p className="text-[10px] text-brand-orange italic">Pickup cutoff time matches operating hours.</p>
                </div>

                {/* Interactive Payment Methods */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-700 block">Simulate Stripe Payment:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'card', name: '💳 Card' },
                      { id: 'upi', name: '📱 UPI ID' },
                      { id: 'gpay', name: '🌟 Google Pay' },
                      { id: 'wallet', name: '💼 Wallet' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                          paymentMethod === m.id
                            ? 'bg-brand-brown border-brand-brown text-white shadow-sm'
                            : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto summary & submit */}
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtotal:</span>
                    <span>₹{(cart.listing.rescuePrice * cart.qty).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>GST (Platform Support):</span>
                    <span className="text-brand-sage font-semibold">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-brand-brown pt-1">
                    <span>Total Amount:</span>
                    <span>₹{(cart.listing.rescuePrice * cart.qty).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingReservation}
                  className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
                >
                  {submittingReservation ? "Simulating Payment..." : `Pay ₹${(cart.listing.rescuePrice * cart.qty).toFixed(2)} & Reserve`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
