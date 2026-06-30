import React, { useState, useEffect } from 'react';
import { Leaf, Clock, MapPin, QrCode, Award, ShieldAlert, Star, CreditCard, Sparkles } from 'lucide-react';
import { Order, User, Coupon } from '../types';

interface MyOrdersProps {
  currentUser: User | null;
  onRefreshUser: () => void;
}

export default function MyOrders({ currentUser, onRefreshUser }: MyOrdersProps) {
  const profile = currentUser?.customerProfile;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal state
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [foodQuality, setFoodQuality] = useState(5);
  const [freshness, setFreshness] = useState(5);
  const [pickupExp, setPickupExp] = useState(5);
  const [valueMoney, setValueMoney] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Selected QR Code for display
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);

  // Load Customer Orders
  const fetchOrders = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?customerId=${currentUser.id}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  // Cancel reservation
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this reservation? This returns the items back to the marketplace directory.")) return;

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      if (res.ok) {
        alert("Reservation cancelled successfully.");
        fetchOrders();
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Redeem coupon
  const handleRedeemCoupon = async (type: 'small' | 'medium' | 'large') => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: currentUser.id, couponType: type })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Success! Generated Coupon Code: ${data.coupon.code}. Added to your wallet.`);
        onRefreshUser();
      } else {
        alert(data.error || "Failed to redeem points.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrderId) return;

    try {
      const res = await fetch(`/api/orders/${reviewOrderId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          foodQuality,
          freshness,
          pickupExperience: pickupExp,
          valueForMoney: valueMoney,
          comment: reviewComment
        })
      });

      if (res.ok) {
        setReviewOrderId(null);
        setReviewComment('');
        alert("Thank you for your feedback! Your review was submitted successfully.");
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="customer-ledger-view" className="space-y-8 animate-in fade-in duration-200">
      
      {/* Customer Header summary & Stats */}
      <section className="bg-white rounded-3xl p-6 md:p-8 border border-amber-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <img 
          src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"} 
          className="w-16 h-16 rounded-full border object-cover shrink-0" 
        />
        <div className="flex-1 text-center md:text-left space-y-1">
          <h1 className="text-2xl font-bold text-brand-brown">{currentUser?.name}</h1>
          <p className="text-xs text-gray-500 font-medium">Customer Account ID: <span className="font-mono">{currentUser?.id}</span></p>
          <div className="flex flex-wrap gap-2 pt-1 justify-center md:justify-start">
            {profile?.greenBadges.map((b) => (
              <span key={b} className="bg-brand-sage/10 text-brand-sage text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-brand-sage/20">
                🌱 {b}
              </span>
            ))}
          </div>
        </div>

        {/* Impact stats card */}
        <div className="flex gap-4 shrink-0 bg-brand-lightcream px-5 py-4 rounded-2xl border border-amber-100 divide-x divide-amber-200/50">
          <div className="text-center pr-3">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Rescued Meals</span>
            <p className="text-xl font-extrabold text-brand-brown">{profile?.savedMeals || 0}</p>
          </div>
          <div className="text-center px-4">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">CO₂ Prev. (kg)</span>
            <p className="text-xl font-extrabold text-brand-sage">{profile?.savedCo2 || 0}</p>
          </div>
          <div className="text-center pl-3">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Loyalty Points</span>
            <p className="text-xl font-extrabold text-amber-600">{profile?.loyaltyPoints || 0} pts</p>
          </div>
        </div>
      </section>

      {/* Grid Layout: Orders and Loyalty rewards shop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Orders Ledgers */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Reservations */}
          <div className="bg-white rounded-3xl border border-amber-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-base text-brand-brown uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-orange animate-pulse" /> Active Reservations
            </h3>
            <p className="text-xs text-gray-500">
              Present your reservation confirmation codes or QR codes to the bakery staff before closing hours to claim your surplus.
            </p>

            {loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="bg-gray-100 h-16 rounded-xl"></div>
              </div>
            ) : orders.filter(o => o.status === "reserved").length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs italic bg-gray-50 rounded-xl border border-dashed border-gray-100">
                You have no active food reservations scheduled. Browse the marketplace to rescue some treats!
              </div>
            ) : (
              <div className="space-y-3">
                {orders.filter(o => o.status === "reserved").map((o) => (
                  <div key={o.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-3 items-center">
                      <img src={o.listingImage} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <h4 className="font-bold text-sm text-brand-brown">{o.listingName}</h4>
                        <p className="text-[10px] text-gray-400">By <strong>{o.bakeryName}</strong> | Qty: {o.quantity}</p>
                        <p className="text-xs text-amber-800 font-semibold mt-0.5">🕒 Pickup slot: {o.pickupSlot}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setActiveQrCode(o.qrCode)}
                        className="px-3.5 py-1.5 bg-brand-brown hover:bg-brand-darkbrown text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
                      >
                        <QrCode size={14} /> Show QR
                      </button>
                      <button
                        onClick={() => handleCancelOrder(o.id)}
                        className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Rescues ledger */}
          <div className="bg-white rounded-3xl border border-amber-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-base text-brand-brown uppercase tracking-wider flex items-center gap-1">
              🌱 Food Rescues History
            </h3>
            
            <div className="space-y-3 overflow-y-auto max-h-96">
              {orders.filter(o => o.status !== "reserved").map((o) => (
                <div key={o.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-3 items-center">
                    <img src={o.listingImage} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-bold text-sm text-brand-brown">{o.listingName}</h4>
                      <p className="text-[10px] text-gray-400">Donor: {o.bakeryName} | Amount: ₹{o.totalAmount.toFixed(2)}</p>
                      <span className={`inline-block text-[9px] font-extrabold uppercase mt-1 ${
                        o.status === "completed" ? "text-brand-sage" : "text-gray-400"
                      }`}>
                        {o.status === "completed" ? "✓ Rescued Successfully" : "Cancelled"}
                      </span>
                    </div>
                  </div>

                  {o.status === "completed" && !o.hasReview && (
                    <button
                      onClick={() => setReviewOrderId(o.id)}
                      className="px-4 py-1.5 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
                    >
                      Leave Review Card
                    </button>
                  )}
                  {o.hasReview && (
                    <span className="text-[10px] font-bold text-gray-400 italic">Review Card Submitted</span>
                  )}
                </div>
              ))}
              {orders.filter(o => o.status !== "reserved").length === 0 && (
                <span className="text-xs text-gray-400 italic block py-4 text-center">No historic rescues found in ledger logs.</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Loyalty Rewards Ledger & Point Redeem Store */}
        <div className="space-y-6">
          
          {/* Coupon wallet summary */}
          <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-brand-brown uppercase tracking-wider flex items-center gap-1.5">
              🎟️ My Discount Coupons Wallet
            </h3>
            
            <div className="space-y-2">
              {profile?.coupons.map((c) => (
                <div key={c.code} className="p-3 bg-amber-50 border border-dashed border-amber-200 rounded-xl text-xs space-y-1 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brand-brown text-sm">₹{c.discountAmount.toFixed(2)} SAVING</span>
                    <span className="font-mono text-[10px] font-extrabold bg-brand-brown text-white px-1.5 py-0.5 rounded">
                      {c.code}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-tight">{c.description}</p>
                  <p className="text-[9px] text-gray-400">Expires: {c.expiryDate}</p>
                </div>
              ))}
              {(!profile?.coupons || profile.coupons.length === 0) && (
                <p className="text-xs text-gray-400 italic py-2 text-center">Your Coupon wallet is empty. Earn points and redeem below!</p>
              )}
            </div>
          </div>

          {/* Loyalty store */}
          <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-brand-brown uppercase tracking-wider flex items-center gap-1.5">
              🌱 Loyalty Rewards Shop
            </h3>
            <p className="text-xs text-gray-500">
              Spend your green rescue points to redeem high-value discount coupons to purchase more surprise rescue boxes!
            </p>

            <div className="space-y-3">
              {[
                { type: "small", pts: 100, save: "₹100 Save", desc: "₹100 discount coupon for bakery orders." },
                { type: "medium", pts: 200, save: "₹250 Save", desc: "₹250 discount coupon for bakery orders." },
                { type: "large", pts: 400, save: "₹500 Save", desc: "₹500 mega saving discount coupon." }
              ].map((item) => {
                const canAfford = (profile?.loyaltyPoints || 0) >= item.pts;
                return (
                  <div key={item.type} className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-brown">{item.save}</span>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 rounded">{item.pts} pts</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight">{item.desc}</p>
                    </div>

                    <button
                      disabled={!canAfford}
                      onClick={() => handleRedeemCoupon(item.type as any)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition ${
                        canAfford 
                          ? 'bg-brand-orange hover:bg-orange-600 text-white' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      Redeem
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* POPUP: ACTIVE QR CODE OVERLAY */}
      {activeQrCode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full border border-amber-100 text-center space-y-4 shadow-xl animate-in fade-in scale-in duration-200">
            <h3 className="font-bold text-brand-brown text-base">Present to Bakery Clerk</h3>
            <p className="text-xs text-gray-500">The store staff will scan this code to confirm your pick-up package immediately.</p>
            
            {/* Visual simulated QR code box */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mx-auto w-48 h-48 flex flex-col items-center justify-center relative shadow-inner">
              <span className="text-6xl animate-pulse">📱</span>
              <p className="mt-4 font-mono font-bold text-[10px] text-brand-brown bg-white border border-gray-200 px-3 py-1 rounded shadow">
                {activeQrCode}
              </p>
            </div>

            <button
              onClick={() => setActiveQrCode(null)}
              className="w-full py-2 bg-brand-brown hover:bg-brand-darkbrown text-white text-xs font-bold rounded-xl transition"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* POPUP: REVIEW WRITING CARDS */}
      {reviewOrderId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleReviewSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-amber-100 shadow-xl overflow-y-auto max-h-[90vh] animate-in fade-in scale-in duration-200"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-brand-brown text-base">Submit Review Card</h3>
              <button type="button" onClick={() => setReviewOrderId(null)} className="text-gray-400 font-bold hover:text-gray-600">✕</button>
            </div>

            <p className="text-xs text-gray-500">How was your sustainable rescue experience? Rate each aspect to reward the bakery's green efforts.</p>

            {/* Score Sliders */}
            <div className="space-y-3">
              {[
                { label: "Overall Rating", val: rating, set: setRating },
                { label: "Food Quality", val: foodQuality, set: setFoodQuality },
                { label: "Food Freshness", val: freshness, set: setFreshness },
                { label: "Staff Pickup Experience", val: pickupExp, set: setPickupExp },
                { label: "Value for Money", val: valueMoney, set: setValueMoney }
              ].map((slider) => (
                <div key={slider.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>{slider.label}:</span>
                    <span className="text-brand-orange font-bold">★ {slider.val} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={slider.val}
                    onChange={(e) => slider.set(Number(e.target.value))}
                    className="w-full h-1 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                  />
                </div>
              ))}

              {/* Comment text */}
              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-gray-700">Comments:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Delicious crust, warm staff! Still completely fresh and sweet."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition"
            >
              Submit Review Card
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
