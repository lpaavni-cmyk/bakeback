import React, { useState, useEffect } from 'react';
import { Leaf, Clock, MapPin, Check, Compass, Award, Calendar, ShieldCheck, Heart } from 'lucide-react';
import { Donation, User } from '../types';

interface NgoDashboardProps {
  currentUser: User | null;
}

export default function NgoDashboard({ currentUser }: NgoDashboardProps) {
  const ngoProfile = currentUser?.ngoProfile;

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'available' | 'schedule' | 'history'>('available');

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  // Scheduled pickup form fields
  const [claimDonationId, setClaimDonationId] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('18:00');

  // Load NGO Donations
  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/donations");
      const data = await res.json();
      setDonations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [activeTab]);

  // Claim Donation
  const handleClaimDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ngoProfile || !claimDonationId) return;

    try {
      const scheduledIso = new Date(`${pickupDate}T${pickupTime}:00`).toISOString();
      const res = await fetch(`/api/donations/${claimDonationId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ngoId: ngoProfile.id,
          scheduledPickup: scheduledIso
        })
      });

      if (res.ok) {
        setClaimDonationId(null);
        alert("Donation claimed successfully! Pickup has been scheduled.");
        fetchDonations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Complete pickup
  const handleCompletePickup = async (donationId: string) => {
    try {
      const res = await fetch(`/api/donations/${donationId}/complete`, { method: "POST" });
      if (res.ok) {
        alert("Pickup completed successfully! Meals distribution counter updated.");
        fetchDonations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="ngo-dashboard-view" className="space-y-8 animate-in fade-in duration-200">
      {/* NGO Header Profile */}
      <section className="bg-white rounded-3xl p-6 md:p-8 border border-amber-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-sage text-white flex items-center justify-center text-3xl font-extrabold shadow-sm shrink-0">
          🏘️
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
            <h1 className="text-2xl font-bold text-brand-brown">{ngoProfile?.name}</h1>
            <span className="self-center bg-brand-sage text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              {ngoProfile?.registrationNumber === "NGO-VERIFIED-ACTIVE" ? "Verified NGO Partner" : "Verification Pending"}
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xl">{ngoProfile?.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 justify-center md:justify-start font-medium">
            <span>📍 {ngoProfile?.address}</span>
            <span>📞 {ngoProfile?.contact}</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 bg-brand-lightcream px-4 py-3 rounded-2xl border border-amber-100">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-gray-400">Meals Distributed</span>
            <p className="text-2xl font-extrabold text-brand-sage">{ngoProfile?.mealsDistributed || 0}</p>
          </div>
          <Award className="w-8 h-8 text-brand-sage" />
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-amber-100 pb-1">
        {[
          { id: 'available', label: 'Discover Food Alerts' },
          { id: 'schedule', label: 'Claimed Pickup Schedule' },
          { id: 'history', label: 'Recovery History' }
        ].map((tab) => (
          <button
            key={tab.id}
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

      {/* TAB 1: DISCOVER AVAILABLE DONATIONS */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-brand-brown">Wholesale Surplus Broadcasts</h2>
            <p className="text-xs text-gray-500">Real-time donation alerts broadcasted by local bakeries after baking cycles.</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              <div className="bg-gray-100 h-32 rounded-2xl"></div>
              <div className="bg-gray-100 h-32 rounded-2xl"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {donations.filter(d => d.status === 'available').map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-brand-sage uppercase tracking-wider">
                          📍 {d.bakeryName}
                        </span>
                        <h3 className="font-extrabold text-base text-brand-brown mt-0.5">{d.title}</h3>
                      </div>
                      <span className="bg-orange-50 text-brand-orange border border-orange-100 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                        {d.quantity} kg weight
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed italic">"{d.description}"</p>
                  </div>

                  <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400">Broadcasted: {new Date(d.timestamp).toLocaleDateString()}</span>
                    <button
                      onClick={() => {
                        setClaimDonationId(d.id);
                        // set current date as default picker
                        setPickupDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="px-4 py-2 bg-brand-brown hover:bg-brand-darkbrown text-white text-xs font-bold rounded-xl transition shadow"
                    >
                      Claim & Schedule Pickup
                    </button>
                  </div>
                </div>
              ))}

              {donations.filter(d => d.status === 'available').length === 0 && (
                <div className="md:col-span-2 bg-white rounded-2xl border border-amber-100 p-12 text-center text-gray-400 text-xs">
                  🌿 All clear! There are currently no unclaimed bakery surplus alerts available in your sector. Check back later after closing times!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLAIMED PICKUP SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-brand-brown">Your Scheduled Collections</h2>
            <p className="text-xs text-gray-500">Pick up these batches during the coordinated slots and confirm completion to distribute meals.</p>
          </div>

          <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-lightcream/50 text-[10px] uppercase font-bold text-gray-400 border-b border-amber-50">
                  <th className="p-4">Donation details</th>
                  <th className="p-4">Donor Bakery</th>
                  <th className="p-4">Bulk Weight</th>
                  <th className="p-4">Scheduled Collection</th>
                  <th className="p-4 text-right">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50 text-xs">
                {donations.filter(d => d.ngoId === ngoProfile?.id && d.status === 'accepted').map((d) => (
                  <tr key={d.id} className="hover:bg-amber-50/20">
                    <td className="p-4 font-bold text-brand-brown">{d.title}</td>
                    <td className="p-4 text-gray-600 font-medium">{d.bakeryName}</td>
                    <td className="p-4 font-bold text-brand-sage">{d.quantity} kg</td>
                    <td className="p-4 text-gray-500 font-semibold">
                      📅 {d.scheduledPickup ? new Date(d.scheduledPickup).toLocaleString() : "Pending"}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleCompletePickup(d.id)}
                        className="px-3 py-1.5 bg-brand-sage hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold"
                      >
                        Confirm Collection Completed
                      </button>
                    </td>
                  </tr>
                ))}
                {donations.filter(d => d.ngoId === ngoProfile?.id && d.status === 'accepted').length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-gray-400 italic">No claimed pickups scheduled. Browse active surplus to coordinate rescues.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RECOVERY HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-brand-brown">Food Recovery Metrics</h2>
            <p className="text-xs text-gray-500">Log of successfully distributed food batches claimed and distributed by your NGO organization.</p>
          </div>

          <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-lightcream/50 text-[10px] uppercase font-bold text-gray-400 border-b border-amber-50">
                  <th className="p-4">Batch Title</th>
                  <th className="p-4">Donor Bakery</th>
                  <th className="p-4">Bulk Weight</th>
                  <th className="p-4">Meals Distributed</th>
                  <th className="p-4">Fulfillment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50 text-xs">
                {donations.filter(d => d.ngoId === ngoProfile?.id && d.status === 'completed').map((d) => (
                  <tr key={d.id} className="hover:bg-amber-50/20 text-gray-500">
                    <td className="p-4 font-bold text-brand-brown">{d.title}</td>
                    <td className="p-4 font-medium">{d.bakeryName}</td>
                    <td className="p-4 font-bold">{d.quantity} kg</td>
                    <td className="p-4 text-brand-sage font-extrabold">{Math.ceil(d.quantity * 2)} meals distributed</td>
                    <td className="p-4">{new Date(d.timestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
                {donations.filter(d => d.ngoId === ngoProfile?.id && d.status === 'completed').length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-gray-400 italic">No completed recovery entries logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLAIM SCHEDULER POPUP MODAL */}
      {claimDonationId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleClaimDonationSubmit}
            className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-amber-100 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-brand-brown">Schedule Donation Pickup</h3>
              <button 
                type="button" 
                onClick={() => setClaimDonationId(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Plan your pickup carefully. Bakeries require collection windows usually around closing time. Ensure you bring containers suited for loose baked loaves.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-extrabold text-gray-400">Pickup Date:</label>
                <input
                  type="date"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-extrabold text-gray-400">Pickup Time:</label>
                <input
                  type="time"
                  required
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-sage hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow transition mt-2"
            >
              Confirm Coordinated Claim
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
