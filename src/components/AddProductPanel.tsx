import React, { useState } from 'react';
import { 
  Sparkles, 
  IndianRupee, 
  Plus, 
  Layers, 
  Clock, 
  Percent, 
  Info, 
  Eye, 
  Leaf, 
  AlertCircle, 
  ShoppingBag, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { User } from '../types';

interface AddProductPanelProps {
  currentUser: User | null;
  onSwitchRole: (email: string) => void;
  onNavigate: (page: string) => void;
  onRefreshListings?: () => void;
}

export default function AddProductPanel({ currentUser, onSwitchRole, onNavigate, onRefreshListings }: AddProductPanelProps) {
  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('pastry');
  const [formDescription, setFormDescription] = useState('');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formRescuePrice, setFormRescuePrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('3');
  const [formHoursUntilExpiry, setFormHoursUntilExpiry] = useState('4');
  const [formIngredients, setFormIngredients] = useState('');
  const [formAllergens, setFormAllergens] = useState<string[]>([]);
  const [formLabel, setFormLabel] = useState<'vegetarian' | 'eggless' | 'vegan' | 'none'>('none');
  const [formIsRescueBox, setFormIsRescueBox] = useState(false);
  const [formEstimatedValue, setFormEstimatedValue] = useState('');

  // AI Helpers loading state
  const [aiDescriptionLoading, setAiDescriptionLoading] = useState(false);
  const [aiDiscountLoading, setAiDiscountLoading] = useState(false);
  const [aiDiscountHours, setAiDiscountHours] = useState('4');
  const [aiDiscountDemand, setAiDiscountDemand] = useState<'medium' | 'low' | 'high'>('medium');
  const [aiJustification, setAiJustification] = useState('');

  // UI state
  const [successListed, setSuccessListed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const availableAllergens = [
    { id: 'wheat', label: 'Wheat/Gluten' },
    { id: 'dairy', label: 'Dairy' },
    { id: 'eggs', label: 'Eggs' },
    { id: 'nuts', label: 'Nuts' },
    { id: 'soy', label: 'Soy' },
  ];

  const bakeryProfile = currentUser?.role === 'bakery' ? currentUser.bakeryProfile : null;

  // AI Smart Description
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
      if (res.ok && data.text) {
        setFormDescription(data.text);
      } else {
        alert("Unable to generate description at this moment. Falling back to simple default.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiDescriptionLoading(false);
    }
  };

  // AI Smart Discount evaluation
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
      if (res.ok && data.suggestedPrice) {
        setFormRescuePrice(data.suggestedPrice.toFixed(2));
        setAiJustification(data.justification);
      } else {
        // local fallback calculations
        const disc = aiDiscountDemand === 'low' ? 50 : aiDiscountDemand === 'high' ? 30 : 40;
        const price = Math.round(orig * (1 - disc / 100));
        setFormRescuePrice(String(price));
        setAiJustification(`AI evaluated: Recommended ₹${price} (${disc}% off) based on local demand levels.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiDiscountLoading(false);
    }
  };

  // Toggle allergen selection
  const handleAllergenToggle = (id: string) => {
    if (formAllergens.includes(id)) {
      setFormAllergens(formAllergens.filter(a => a !== id));
    } else {
      setFormAllergens([...formAllergens, id]);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bakeryProfile) {
      setErrorMsg("You must be logged in as a Bakery to list products.");
      return;
    }
    if (!formName) {
      setErrorMsg("Product Name is required.");
      return;
    }
    if (!formOriginalPrice || Number(formOriginalPrice) <= 0) {
      setErrorMsg("Please enter a valid original price.");
      return;
    }
    if (!formRescuePrice || Number(formRescuePrice) <= 0) {
      setErrorMsg("Please enter a valid rescue price.");
      return;
    }

    setLoading(true);
    setErrorMsg('');

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
        setSuccessListed(true);
        if (onRefreshListings) {
          onRefreshListings();
        }
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Failed to submit product.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error connecting to surplus engine.");
    } finally {
      setLoading(false);
    }
  };

  // Reset Form for New Submission
  const handleResetForm = () => {
    setFormName('');
    setFormCategory('pastry');
    setFormDescription('');
    setFormOriginalPrice('');
    setFormRescuePrice('');
    setFormQuantity('3');
    setFormHoursUntilExpiry('4');
    setFormIngredients('');
    setFormAllergens([]);
    setFormLabel('none');
    setFormIsRescueBox(false);
    setFormEstimatedValue('');
    setAiJustification('');
    setSuccessListed(false);
  };

  // Render role switch simulator banner if user is not a Bakery
  if (currentUser?.role !== 'bakery') {
    return (
      <div className="max-w-4xl mx-auto bg-white border border-amber-100 p-8 rounded-3xl shadow-lg space-y-6 text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-3xl">
          🏭
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-brand-brown">Add a Product Panel</h2>
          <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
            The product listing engine is authorized specifically for registered bakery partners. Simulating a bakery owner login gives you immediate access to add products.
          </p>
        </div>

        <div className="bg-brand-lightcream border border-amber-200/50 rounded-2xl p-6 max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-3 text-left">
            <img 
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120" 
              className="w-12 h-12 rounded-full border border-white shadow-sm"
              alt="Elena Rostova"
            />
            <div>
              <h4 className="font-bold text-brand-brown text-sm">Elena Rostova</h4>
              <p className="text-xs text-brand-sage font-semibold">Crust & Crumb Artisan Bakery</p>
            </div>
          </div>
          <button
            onClick={() => onSwitchRole("bakery@bakeback.com")}
            className="w-full py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"
          >
            <Plus size={16} />
            Simulate Login as Elena & Add Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-brown font-display tracking-tight flex items-center gap-2">
            <span>🧁</span> Add a Product Panel
          </h2>
          <p className="text-sm text-gray-500">
            List fresh bakery surplus or create a Surprise Rescue Box. Utilize Gemini AI to recommend smart discounts and descriptions.
          </p>
        </div>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2 border border-amber-200 text-brand-brown hover:bg-amber-50/50 rounded-xl text-xs font-bold transition"
        >
          View My Listings
        </button>
      </div>

      {successListed ? (
        <div className="max-w-2xl mx-auto bg-white border border-emerald-100 p-8 rounded-3xl shadow-lg text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-50 text-brand-sage rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle size={36} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-brand-brown">Product Listed Successfully!</h3>
            <p className="text-xs text-gray-500">
              Your surplus item is now live on the public Marketplace. Customers can discover and reserve it immediately.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={handleResetForm}
              className="px-5 py-2.5 bg-brand-lightcream hover:bg-amber-100/50 text-brand-brown font-bold rounded-xl text-xs transition"
            >
              Add Another Product
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className="px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition shadow"
            >
              Go to Marketplace
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Side */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-amber-100 shadow-md space-y-6">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="font-extrabold text-xs uppercase text-brand-sage tracking-wider">Product Specifications</span>
              <span className="text-[10px] text-gray-400 font-semibold">{bakeryProfile?.name}</span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-100 flex items-center gap-2">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              
              {/* Product Type Checkbox */}
              <div className="bg-amber-50/30 border border-amber-100/50 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-brand-brown text-xs">Surprise Rescue Box?</h4>
                  <p className="text-[10px] text-gray-400">Pack daily assortments at a massive bundled discount</p>
                </div>
                <input
                  type="checkbox"
                  checked={formIsRescueBox}
                  onChange={(e) => setFormIsRescueBox(e.target.checked)}
                  className="w-5 h-5 accent-brand-orange rounded cursor-pointer"
                />
              </div>

              {/* Name & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Product Name:</label>
                  <input
                    type="text"
                    required
                    placeholder={formIsRescueBox ? "e.g. Assorted Sweet Treat Rescue Box" : "e.g. Sourdough Country Loaf"}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Category:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="bread">Bread</option>
                    <option value="pastry">Pastry</option>
                    <option value="cookies">Cookies</option>
                    <option value="dessert">Dessert</option>
                    <option value="savory">Savory</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              {/* Ingredients & Allergens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Key Ingredients (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. organic flour, wild yeast, salt"
                    value={formIngredients}
                    onChange={(e) => setFormIngredients(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Dietary Label:</label>
                  <select
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value as any)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="none">None</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="eggless">Eggless</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
              </div>

              {/* AI Description Assistant */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-gray-700">Engaging Product Description:</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={aiDescriptionLoading}
                    className="text-[10px] font-bold text-brand-orange hover:text-orange-600 flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 transition"
                  >
                    <Sparkles size={11} className={aiDescriptionLoading ? 'animate-spin' : ''} />
                    {aiDescriptionLoading ? "Writing with Gemini..." : "Smart AI Description"}
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="Tell customers why they should rescue this treat today..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              {/* Pricing & Qty */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Original Price (₹):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="280"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Rescue Price (₹):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="110"
                    value={formRescuePrice}
                    onChange={(e) => setFormRescuePrice(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="3"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Hours left (Max 16):</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    required
                    placeholder="4"
                    value={formHoursUntilExpiry}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        setFormHoursUntilExpiry('');
                      } else {
                        const val = Math.min(16, Math.max(1, Number(e.target.value)));
                        setFormHoursUntilExpiry(String(val));
                      }
                    }}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {formIsRescueBox && (
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Estimated Total Box Value (₹):</label>
                  <input
                    type="number"
                    placeholder="e.g. 800"
                    value={formEstimatedValue}
                    onChange={(e) => setFormEstimatedValue(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
              )}

              {/* AI smart discount pricing section */}
              <div className="bg-amber-50/20 rounded-2xl p-4 border border-amber-100/50 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-brand-brown font-bold text-xs">
                    <Sparkles size={13} className="text-brand-orange" />
                    <span>Gemini Smart Discount Recommendation</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateSmartDiscount}
                    disabled={aiDiscountLoading}
                    className="px-2.5 py-1 bg-brand-brown hover:bg-brand-darkbrown text-white text-[10px] font-bold rounded-lg transition"
                  >
                    {aiDiscountLoading ? "Evaluating..." : "Generate AI Recommendation"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="space-y-1">
                    <span className="text-gray-500 font-semibold block">Target Expiry (hrs):</span>
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
                      className="bg-white border border-gray-200 rounded p-1.5 w-full text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-500 font-semibold block">Store Demand:</span>
                    <select
                      value={aiDiscountDemand}
                      onChange={(e) => setAiDiscountDemand(e.target.value as any)}
                      className="bg-white border border-gray-200 rounded p-1.5 w-full text-[10px]"
                    >
                      <option value="medium">Medium Demand</option>
                      <option value="low">Low Demand (+10% discount)</option>
                      <option value="high">High Demand (-10% discount)</option>
                    </select>
                  </div>
                </div>

                {aiJustification && (
                  <div className="p-2.5 bg-white border border-dashed border-amber-200 text-[10px] text-brand-brown rounded-xl leading-relaxed italic">
                    {aiJustification}
                  </div>
                )}
              </div>

              {/* Allergens Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 block">Allergens Present:</label>
                <div className="flex flex-wrap gap-2">
                  {availableAllergens.map((alg) => {
                    const isSelected = formAllergens.includes(alg.id);
                    return (
                      <button
                        key={alg.id}
                        type="button"
                        onClick={() => handleAllergenToggle(alg.id)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition capitalize ${
                          isSelected 
                            ? 'bg-brand-brown text-white border-brand-brown shadow-sm' 
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {alg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition flex-1 text-center"
                >
                  Clear Fields
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold transition flex-[2] flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10"
                >
                  {loading ? "Adding Product..." : "Launch Rescue Offer"}
                </button>
              </div>

            </form>
          </div>

          {/* Dynamic Live Preview Side */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-amber-50/50 p-4 rounded-3xl border border-amber-100/50 space-y-1">
              <span className="font-extrabold text-[10px] text-brand-brown uppercase tracking-wider flex items-center gap-1">
                <Eye size={12} />
                Marketplace Real-time Card Preview
              </span>
              <p className="text-[10px] text-gray-400">This is how your listing will appear to community rescuers.</p>
            </div>

            {/* Simulated Marketplace Card */}
            <div className="bg-white rounded-3xl overflow-hidden border border-amber-100 shadow-md relative group max-w-sm mx-auto">
              
              {/* Product Image preview */}
              <div className="h-44 bg-gray-100 relative overflow-hidden">
                <img 
                  src={
                    formIsRescueBox 
                      ? "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400"
                      : "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400"
                  } 
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  alt="Product preview"
                  referrerPolicy="no-referrer"
                />
                
                {/* Expiry Badge */}
                <div className="absolute top-3 left-3 bg-brand-brown/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-extrabold text-white uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Clock size={10} className="text-amber-400" />
                  <span>{formHoursUntilExpiry || "4"}h left</span>
                </div>

                {/* Rescue Box Badge */}
                {formIsRescueBox && (
                  <div className="absolute top-3 right-3 bg-brand-orange px-2.5 py-1 rounded-lg text-[9px] font-extrabold text-white uppercase tracking-wider shadow-md">
                    Surprise Rescue Box
                  </div>
                )}

                {/* Diet Label */}
                {formLabel !== 'none' && (
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-extrabold text-brand-sage uppercase tracking-wider border border-emerald-50 shadow">
                    🌱 {formLabel}
                  </div>
                )}
              </div>

              {/* Card Details */}
              <div className="p-4 space-y-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-extrabold text-brand-sage uppercase tracking-wider block">
                    {formCategory}
                  </span>
                  <h3 className="font-display font-black text-brand-brown text-base leading-tight">
                    {formName || "Your Delicious Product Name"}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold">
                    By {bakeryProfile?.name || "Your Bakery"}
                  </p>
                </div>

                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                  {formDescription || "A mouthwatering description of your freshly baked surplus goods will go here."}
                </p>

                {/* Allergens Indicators */}
                {formAllergens.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formAllergens.map((alg) => (
                      <span key={alg} className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase">
                        no {alg}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bottom Pricing Row */}
                <div className="pt-2 border-t border-amber-50">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-lg font-extrabold text-brand-brown">
                        ₹{formRescuePrice ? Number(formRescuePrice).toFixed(2) : "0.00"}
                      </span>
                      <span className="text-xs text-gray-400 line-through ml-2">
                        ₹{formOriginalPrice ? Number(formOriginalPrice).toFixed(2) : "0.00"}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      {formQuantity || "3"} available
                    </span>
                  </div>
                </div>

                {/* Action Button Preview */}
                <button 
                  type="button" 
                  disabled
                  className="w-full mt-2 py-2 bg-brand-orange/50 text-white font-bold rounded-xl text-xs cursor-not-allowed"
                >
                  Pay & Reserve
                </button>
              </div>
            </div>

            {/* Sustainability Info Panel */}
            <div className="bg-brand-sage/10 border border-brand-sage/20 rounded-3xl p-5 space-y-3">
              <h4 className="font-bold text-brand-sage text-xs flex items-center gap-1">
                <Leaf size={14} />
                Carbon Reduction Contribution
              </h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                By rescuing this batch of <strong>{formQuantity || "3"} units</strong>, you prevent approximately <strong>{(Number(formQuantity || 3) * 0.5 * 2.5).toFixed(1)} kg of CO₂</strong> emissions from entered landfills! Every single bread loaf, croissant, or sweet box reduces community waste.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
