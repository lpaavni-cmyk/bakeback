import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  ShoppingBag, 
  Award, 
  HelpCircle, 
  Home as HomeIcon, 
  Bell, 
  LogOut, 
  User as UserIcon, 
  Leaf, 
  UserCheck, 
  Lock,
  ChevronRight,
  Info
} from 'lucide-react';

import { User } from './types';
import Home from './components/Home';
import Explore from './components/Explore';
import BakeryDashboard from './components/BakeryDashboard';
import NgoDashboard from './components/NgoDashboard';
import AdminDashboard from './components/AdminDashboard';
import MyOrders from './components/MyOrders';
import AddProductPanel from './components/AddProductPanel';

export default function App() {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<string>('home');

  // User Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('customer@bakeback.com');
  const [authPassword, setAuthPassword] = useState('customer123');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Notifications Drawer State
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, text: "🌱 Flash Deal: surprise box listed nearby at 70% off!", time: "2m ago", read: false },
    { id: 2, text: "🤝 NGO 'Feed the City' has successfully distributed 20 meals from your donation!", time: "1h ago", read: true },
    { id: 3, text: "✨ Welcome to bakeback! Start rescuing delicious leftovers today.", time: "1d ago", read: true }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Listings count for home preview
  const [listingsCount, setListingsCount] = useState(0);

  // Load current session from localStorage or default to logged-in user for immediate testing!
  useEffect(() => {
    // Automatically log in customer on first load so the app has full data loaded and ready to play!
    handleSimulatedLogin("customer@bakeback.com");
  }, []);

  // Fetch count of listings for the home page badge
  const fetchListingsCount = async () => {
    try {
      const res = await fetch("/api/listings");
      const data = await res.json();
      setListingsCount(data.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchListingsCount();
  }, [currentUser, currentPage]);

  // Handle Login Simulation
  const handleSimulatedLogin = async (emailStr: string) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const password = emailStr.startsWith('customer') 
        ? 'customer123' 
        : emailStr.startsWith('bakery') 
          ? 'bakery123' 
          : emailStr.startsWith('ngo') 
            ? 'ngo123' 
            : 'admin123';

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailStr, password })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
        // Direct auto-routing to convenient dashboards
        if (data.role === 'customer') setCurrentPage('explore');
        else if (data.role === 'bakery') setCurrentPage('dashboard');
        else if (data.role === 'ngo') setCurrentPage('donations');
        else if (data.role === 'admin') setCurrentPage('admin');
      } else {
        setAuthError(data.error || "Login simulation failed.");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Could not reach backend server.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Standard Login Form Handler
  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
        if (data.role === 'customer') setCurrentPage('explore');
        else if (data.role === 'bakery') setCurrentPage('dashboard');
        else if (data.role === 'ngo') setCurrentPage('donations');
        else if (data.role === 'admin') setCurrentPage('admin');
      } else {
        setAuthError(data.error || "Invalid credentials.");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Failed to reach auth gateway.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Refresh User session (to sync points, coupons, etc.)
  const refreshUserSession = async () => {
    if (!currentUser) return;
    try {
      // Simulate by logging in again with standard credentials
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, password: currentUser.email.split('@')[0] + '123' })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Reservation / Checkout call
  const handleReserveItem = async (listingId: string, quantity: number, pickupSlot: string) => {
    if (!currentUser) return { error: "Please log in." };
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          customerId: currentUser.id,
          quantity,
          pickupSlot
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Post a notification about the new rescue order
        setNotifications([
          { id: Date.now(), text: `🎉 Reservation confirmed: ${quantity}x ${data.listingName}!`, time: "Just now", read: false },
          ...notifications
        ]);
        await refreshUserSession();
        return data;
      }
      return { error: data.error };
    } catch (err) {
      console.error(err);
      return { error: "Failed to connect to checkout api." };
    }
  };

  // Unread notifications helper
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-brand-cream text-brand-darkbrown font-sans flex flex-col justify-between">
      
      {/* GLOBAL HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs px-4 md:px-8 py-3.5 flex items-center justify-between">
        
        {/* App Logo & Title */}
        <button 
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-2.5 group text-left focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-brown text-white flex items-center justify-center font-display font-extrabold text-xl group-hover:bg-brand-darkbrown transition shadow shadow-amber-900/10">
            b
          </div>
          <div>
            <span className="font-display font-extrabold text-lg text-brand-brown block leading-none">bakeback</span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-brand-sage leading-none">Leftover Rescue Hub</span>
          </div>
        </button>

        {/* Global Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold text-gray-500">
          <button 
            onClick={() => setCurrentPage('home')}
            className={`px-3 py-2 rounded-lg transition ${currentPage === 'home' ? 'bg-amber-50 text-brand-brown' : 'hover:bg-amber-50/30 hover:text-brand-brown'}`}
          >
            Home
          </button>
          
          <button 
            onClick={() => setCurrentPage('explore')}
            className={`px-3 py-2 rounded-lg transition ${currentPage === 'explore' ? 'bg-amber-50 text-brand-brown' : 'hover:bg-amber-50/30 hover:text-brand-brown'}`}
          >
            Marketplace
          </button>

          {currentUser?.role === 'customer' && (
            <button 
              onClick={() => setCurrentPage('orders')}
              className={`px-3 py-2 rounded-lg transition ${currentPage === 'orders' ? 'bg-amber-50 text-brand-brown' : 'hover:bg-amber-50/30 hover:text-brand-brown'}`}
            >
              My Rescues Ledger
            </button>
          )}

          {currentUser?.role === 'bakery' && (
            <button 
              onClick={() => setCurrentPage('dashboard')}
              className={`px-3 py-2 rounded-lg transition ${currentPage === 'dashboard' ? 'bg-amber-50 text-brand-brown' : 'hover:bg-amber-50/30 hover:text-brand-brown'}`}
            >
              Bakery Dashboard
            </button>
          )}

          <button 
            onClick={() => setCurrentPage('add-product')}
            className={`px-3 py-2 rounded-lg transition font-extrabold flex items-center gap-1 ${currentPage === 'add-product' ? 'bg-brand-orange text-white' : 'hover:bg-amber-50/30 hover:text-brand-brown text-brand-orange bg-amber-50/50'}`}
          >
            ➕ Add a Product
          </button>

          {currentUser?.role === 'ngo' && (
            <button 
              onClick={() => setCurrentPage('donations')}
              className={`px-3 py-2 rounded-lg transition ${currentPage === 'donations' ? 'bg-amber-50 text-brand-brown' : 'hover:bg-amber-50/30 hover:text-brand-brown'}`}
            >
              NGO Coordination
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button 
              onClick={() => setCurrentPage('admin')}
              className={`px-3 py-2 rounded-lg transition ${currentPage === 'admin' ? 'bg-amber-50 text-brand-brown' : 'hover:bg-amber-50/30 hover:text-brand-brown'}`}
            >
              Admin Vetting
            </button>
          )}

          <button 
            onClick={() => setCurrentPage('about')}
            className={`px-3 py-2 rounded-lg transition ${currentPage === 'about' ? 'bg-amber-50 text-brand-brown' : 'hover:bg-amber-50/30 hover:text-brand-brown'}`}
          >
            About
          </button>
        </nav>

        {/* User Account Controls */}
        <div className="flex items-center gap-3">
          
          {currentUser ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  id="notif-bell-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-500 hover:text-brand-brown rounded-full hover:bg-gray-100 transition relative"
                >
                  <Bell size={18} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-orange text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Notifications Panel Box */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-amber-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="font-bold text-xs text-brand-brown">Notifications</span>
                      <button 
                        onClick={() => {
                          setNotifications(notifications.map(n => ({ ...n, read: true })));
                        }}
                        className="text-[10px] font-bold text-brand-sage hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className={`p-2 rounded-lg text-xs leading-relaxed ${n.read ? 'bg-white text-gray-500' : 'bg-orange-50/70 text-brand-brown font-semibold'}`}>
                          <p>{n.text}</p>
                          <span className="text-[9px] text-gray-400 mt-0.5 block">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Logged in avatar info */}
              <div className="flex items-center gap-2 border-l border-amber-100 pl-3">
                <img 
                  src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"} 
                  className="w-8 h-8 rounded-full border object-cover shadow-sm shrink-0" 
                  alt={currentUser.name}
                />
                <div className="hidden sm:block text-left text-[10px] font-bold leading-tight">
                  <span className="text-brand-brown block max-w-[100px] truncate">{currentUser.name}</span>
                  <span className="text-brand-sage block font-extrabold uppercase tracking-wide">{currentUser.role}</span>
                </div>
                <button
                  id="logout-btn"
                  onClick={() => {
                    setCurrentUser(null);
                    setCurrentPage('home');
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition ml-1"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setCurrentPage('login')}
              className="px-4 py-2 bg-brand-brown hover:bg-brand-darkbrown text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Sign In / Simulate Roles
            </button>
          )}

        </div>
      </header>

      {/* MOBILE NAV BAR */}
      <div className="md:hidden sticky top-14 z-30 bg-amber-50/95 border-b border-amber-100/50 px-4 py-2 flex justify-around text-xs font-bold text-gray-500">
        <button onClick={() => setCurrentPage('home')} className={currentPage === 'home' ? 'text-brand-brown' : ''}>Home</button>
        <button onClick={() => setCurrentPage('explore')} className={currentPage === 'explore' ? 'text-brand-brown' : ''}>Marketplace</button>
        <button onClick={() => setCurrentPage('add-product')} className={currentPage === 'add-product' ? 'text-brand-orange font-bold font-mono' : 'text-brand-orange/85 font-semibold'}>➕ Add Product</button>
        {currentUser?.role === 'customer' && (
          <button onClick={() => setCurrentPage('orders')} className={currentPage === 'orders' ? 'text-brand-brown' : ''}>Ledger</button>
        )}
        {currentUser?.role === 'bakery' && (
          <button onClick={() => setCurrentPage('dashboard')} className={currentPage === 'dashboard' ? 'text-brand-brown' : ''}>Dashboard</button>
        )}
        {currentUser?.role === 'ngo' && (
          <button onClick={() => setCurrentPage('donations')} className={currentPage === 'donations' ? 'text-brand-brown' : ''}>Donations</button>
        )}
        {currentUser?.role === 'admin' && (
          <button onClick={() => setCurrentPage('admin')} className={currentPage === 'admin' ? 'text-brand-brown' : ''}>Admin</button>
        )}
        <button onClick={() => setCurrentPage('about')} className={currentPage === 'about' ? 'text-brand-brown' : ''}>About</button>
      </div>

      {/* MAIN CONTAINER CONTENT VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-12">
        
        {currentPage === 'home' && (
          <Home 
            currentUser={currentUser} 
            onSwitchRole={handleSimulatedLogin} 
            onNavigate={setCurrentPage} 
            listingsCount={listingsCount}
          />
        )}

        {currentPage === 'explore' && (
          <Explore 
            currentUser={currentUser} 
            onNavigate={setCurrentPage} 
            onReserve={handleReserveItem}
          />
        )}

        {currentPage === 'add-product' && (
          <AddProductPanel 
            currentUser={currentUser}
            onSwitchRole={handleSimulatedLogin}
            onNavigate={setCurrentPage}
            onRefreshListings={fetchListingsCount}
          />
        )}

        {currentPage === 'orders' && currentUser?.role === 'customer' && (
          <MyOrders 
            currentUser={currentUser} 
            onRefreshUser={refreshUserSession}
          />
        )}

        {currentPage === 'dashboard' && currentUser?.role === 'bakery' && (
          <BakeryDashboard 
            currentUser={currentUser} 
            listings={[]} // loaded inside dashboard
            onRefreshListings={fetchListingsCount}
          />
        )}

        {currentPage === 'donations' && currentUser?.role === 'ngo' && (
          <NgoDashboard 
            currentUser={currentUser}
          />
        )}

        {currentPage === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard 
            currentUser={currentUser}
          />
        )}

        {/* ABOUT / HOW IT WORKS PAGE */}
        {currentPage === 'about' && (
          <div className="bg-white rounded-3xl p-8 border border-amber-100 shadow-sm max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
            <div className="text-center space-y-2">
              <span className="text-4xl">🍞</span>
              <h2 className="text-3xl font-bold text-brand-brown">About Leftover Rescue Hub</h2>
              <p className="text-gray-500 text-sm">Empowering communities to mitigate commercial food waste through intelligent redistribution.</p>
            </div>

            <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
              <p>
                <strong>bakeback</strong> is a smart marketplace application that links artisan bakeries, conscious customers, and local charitable NGOs together in a seamless sustainability network.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-amber-50">
                <div className="space-y-2">
                  <h4 className="font-extrabold text-brand-brown text-base flex items-center gap-1.5">
                    🥐 Retail Surpluses
                  </h4>
                  <p className="text-xs">
                    Bakeries list day-old breads, surplus croissants, or custom surprise 'Rescue Boxes' at up to 70% off. Customers purchase them, securing quality food at affordable rates while providing immediate revenue recovery.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-extrabold text-brand-sage text-base flex items-center gap-1.5">
                    🏘️ NGO Integration
                  </h4>
                  <p className="text-xs">
                    Instead of discarding premium edible food, bakeries push batches directly to local shelters. NGOs claim the broadcasts and schedule pickup slots seamlessly, distributing meals to those in need.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-amber-50 space-y-3">
                <h4 className="font-extrabold text-brand-brown text-base">Carbon Mitigation Coefficients</h4>
                <p className="text-xs text-gray-500">
                  Every kilogram of commercial food rescued directly mitigates methane decomposition from landfill disposal. We assume a standard factor of <strong>2.5 kg of CO₂ emissions prevented per kg of food rescued</strong>. Total impact metrics are updated live inside partner and customer dashboards.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LOGIN AND ROLE SELECTION SCREEN */}
        {currentPage === 'login' && !currentUser && (
          <div className="max-w-md w-full mx-auto bg-white border border-amber-100 p-8 rounded-3xl shadow-lg space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-brand-brown">Welcome to bakeback</h2>
              <p className="text-xs text-gray-400">Sign in to list surplus, claim donations, or rescue meals.</p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-100">
                ⚠️ {authError}
              </div>
            )}

            <form onSubmit={handleFormLogin} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Email Address:</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Password:</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-brand-brown hover:bg-brand-darkbrown text-white font-bold rounded-xl transition shadow"
              >
                {authLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="border-t border-amber-50 pt-4 space-y-3">
              <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wide">Or fast-login preset simulation roles:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleSimulatedLogin("customer@bakeback.com")}
                  className="p-2.5 bg-brand-lightcream hover:bg-amber-100/50 rounded-xl font-bold text-brand-brown text-center"
                >
                  Alex (Customer)
                </button>
                <button
                  onClick={() => handleSimulatedLogin("bakery@bakeback.com")}
                  className="p-2.5 bg-brand-lightcream hover:bg-amber-100/50 rounded-xl font-bold text-brand-brown text-center"
                >
                  Elena (Bakery Owner)
                </button>
                <button
                  onClick={() => handleSimulatedLogin("ngo@bakeback.com")}
                  className="p-2.5 bg-brand-lightcream hover:bg-amber-100/50 rounded-xl font-bold text-brand-brown text-center"
                >
                  Marcus (NGO Shelter)
                </button>
                <button
                  onClick={() => handleSimulatedLogin("admin@bakeback.com")}
                  className="p-2.5 bg-brand-lightcream hover:bg-amber-100/50 rounded-xl font-bold text-brand-brown text-center"
                >
                  Sarah (Admin)
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-amber-100 py-6 text-center text-xs text-gray-400 font-medium">
        <p>© 2026 bakeback – Smart Bakery Surplus & Carbon Mitigation platform.</p>
        <p className="text-[10px] text-gray-300 mt-1">Mitigating methane output and commercial food loss with intelligent redistributive algorithms.</p>
      </footer>

    </div>
  );
}
