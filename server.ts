import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// ----------------------------------------------------
// DB Persistence setup (JSON-based local DB)
// ----------------------------------------------------
const DB_FILE = path.join(process.cwd(), "database.json");

// Define basic initial structure
const initialDb = {
  users: [
    {
      id: "cust-alex",
      email: "customer@bakeback.com",
      password: "customer123", // kept simple for mockup login
      name: "Alex Mercer",
      role: "customer",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
      customerProfile: {
        loyaltyPoints: 350,
        greenBadges: ["Rescue Rookie", "CO₂ Fighter", "Pastry Defender"],
        savedKg: 8.5,
        savedCo2: 21.25, // 2.5kg CO2 per kg food saved
        savedMeals: 17,
        coupons: [
          { code: "SWEETRESCUE", discountAmount: 100.0, description: "₹100 off next surprise box", expiryDate: "2026-08-30" }
        ]
      }
    },
    {
      id: "bakery-crust",
      email: "bakery@bakeback.com",
      password: "bakery123",
      name: "Elena Rostova",
      role: "bakery",
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120",
      bakeryProfile: {
        id: "bakery-crust",
        name: "Crust & Crumb Artisan Bakery",
        logo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=120",
        description: "Artisanal breads, flaky pastries, and rustic sourdoughs baked fresh daily with stone-ground heritage flour.",
        address: "42 Bakers Row, Sourdough Heights",
        latitude: 37.7749,
        longitude: -122.4194,
        operatingHours: "07:00 - 19:00",
        contact: "+1 (555) 123-4567",
        safetyCertificate: "FSSAI-9021382103",
        gstNumber: "GST-992120-A",
        sustainabilityScore: 92,
        rating: 4.8,
        reviewsCount: 4,
        savedKg: 142.0,
        savedCo2: 355.0,
        mealsRescued: 284,
        revenueRecovered: 18500.00
      }
    },
    {
      id: "ngo-feed",
      email: "ngo@bakeback.com",
      password: "ngo123",
      name: "Marcus Vance",
      role: "ngo",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
      ngoProfile: {
        id: "ngo-feed",
        name: "Feed the City Shelter",
        description: "Community shelter and kitchen supporting local vulnerable families with healthy hot meals and baked rescues.",
        address: "707 Hope Street, Downtown",
        contact: "+1 (555) 987-6543",
        registrationNumber: "REG-NGO-55102",
        mealsDistributed: 1540
      }
    },
    {
      id: "admin-sarah",
      email: "admin@bakeback.com",
      password: "admin123",
      name: "Sarah Connor",
      role: "admin",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"
    }
  ],
  listings: [
    {
      id: "list-1",
      bakeryId: "bakery-crust",
      bakeryName: "Crust & Crumb Artisan Bakery",
      name: "Sourdough Country Loaf",
      category: "bread",
      description: "Tangy artisan sourdough with a caramelized crunchy crust and open, chewy interior.",
      originalPrice: 280.00,
      rescuePrice: 110.00,
      quantity: 4,
      expiryTime: new Date(Date.now() + 3 * 3600000).toISOString(), // 3 hours from now
      pickupStart: "17:00",
      pickupEnd: "19:00",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
      allergens: ["wheat", "gluten"],
      ingredients: "Organic heritage wheat flour, water, sea salt, wild yeast culture.",
      label: "vegan",
      status: "available",
      isRescueBox: false
    },
    {
      id: "list-2",
      bakeryId: "bakery-crust",
      bakeryName: "Crust & Crumb Artisan Bakery",
      name: "Classic Butter Croissant Bag",
      category: "pastry",
      description: "A pack of 3 flaky, golden-brown butter croissants layered using French Normandy butter.",
      originalPrice: 400.00,
      rescuePrice: 160.00,
      quantity: 2,
      expiryTime: new Date(Date.now() + 4 * 3600000).toISOString(), // 4 hours from now
      pickupStart: "17:00",
      pickupEnd: "19:00",
      image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400",
      allergens: ["wheat", "dairy", "eggs", "gluten"],
      ingredients: "Wheat flour, butter, sugar, yeast, milk, eggs, salt.",
      label: "vegetarian",
      status: "available",
      isRescueBox: false
    },
    {
      id: "list-3",
      bakeryId: "bakery-crust",
      bakeryName: "Crust & Crumb Artisan Bakery",
      name: "Assorted Sweet Treat Rescue Box",
      category: "dessert",
      description: "A surprise box of our delicious daily baked treats! May include muffins, sweet croissants, danishes, or brownies.",
      originalPrice: 800.00,
      rescuePrice: 250.00,
      quantity: 5,
      expiryTime: new Date(Date.now() + 5 * 3600000).toISOString(),
      pickupStart: "18:00",
      pickupEnd: "19:00",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
      allergens: ["wheat", "dairy", "eggs", "nuts", "gluten"],
      ingredients: "Various artisan sweet goods. May contain nuts, chocolate, vanilla, and dairy.",
      label: "vegetarian",
      status: "available",
      isRescueBox: true,
      estimatedValue: 800.00
    },
    {
      id: "list-4",
      bakeryId: "bakery-crust",
      bakeryName: "Crust & Crumb Artisan Bakery",
      name: "Sourdough Chocolate Chip Cookies",
      category: "cookies",
      description: "Rich, chewy cookies with hints of caramel and sea salt, baked with sourdough discard.",
      originalPrice: 300.00,
      rescuePrice: 120.00,
      quantity: 1,
      expiryTime: new Date(Date.now() + 6 * 3600000).toISOString(),
      pickupStart: "17:00",
      pickupEnd: "19:00",
      image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=400",
      allergens: ["wheat", "dairy", "soy", "gluten"],
      ingredients: "Flour, sourdough culture, brown sugar, organic butter, dark chocolate chips, sea salt.",
      label: "eggless",
      status: "available",
      isRescueBox: false
    },
    {
      id: "list-5",
      bakeryId: "bakery-crust",
      bakeryName: "Crust & Crumb Artisan Bakery",
      name: "Tres Leches Pastry Slice",
      category: "dessert",
      description: "Heavenly light sponge cake soaked in three kinds of milk, topped with freshly whipped cream.",
      originalPrice: 250.00,
      rescuePrice: 99.00,
      quantity: 3,
      expiryTime: new Date(Date.now() + 7 * 3600000).toISOString(),
      pickupStart: "17:00",
      pickupEnd: "19:00",
      image: "https://images.unsplash.com/photo-1549590143-d5855148a9d5?auto=format&fit=crop&q=80&w=400",
      allergens: ["wheat", "dairy", "gluten"],
      ingredients: "Flour, milk, condensed milk, evaporated milk, heavy cream, vanilla, sugar.",
      label: "vegetarian",
      status: "available",
      isRescueBox: false
    },
    {
      id: "list-6",
      bakeryId: "bakery-crust",
      bakeryName: "Crust & Crumb Artisan Bakery",
      name: "Fudgy Chocolate Brownie Pack",
      category: "dessert",
      description: "A pack of 4 decadent, rich chocolate brownies with a crackly top and ultra-fudgy center.",
      originalPrice: 180.00,
      rescuePrice: 70.00,
      quantity: 4,
      expiryTime: new Date(Date.now() + 8 * 3600000).toISOString(),
      pickupStart: "17:00",
      pickupEnd: "19:00",
      image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400",
      allergens: ["wheat", "dairy", "gluten"],
      ingredients: "Cocoa powder, butter, chocolate chunks, flour, sugar, vanilla.",
      label: "eggless",
      status: "available",
      isRescueBox: false
    },
    {
      id: "list-7",
      bakeryId: "bakery-crust",
      bakeryName: "Crust & Crumb Artisan Bakery",
      name: "Blueberry Cheesecake Slice",
      category: "dessert",
      description: "Creamy, velvety New York-style cheesecake slice topped with a sweet, tangy wild blueberry compote.",
      originalPrice: 300.00,
      rescuePrice: 120.00,
      quantity: 2,
      expiryTime: new Date(Date.now() + 9 * 3600000).toISOString(),
      pickupStart: "17:00",
      pickupEnd: "19:00",
      image: "https://images.unsplash.com/photo-1524351199679-46cddf530c04?auto=format&fit=crop&q=80&w=400",
      allergens: ["wheat", "dairy", "gluten"],
      ingredients: "Cream cheese, graham cracker crust, butter, sour cream, blueberry glaze, sugar.",
      label: "vegetarian",
      status: "available",
      isRescueBox: false
    }
  ],
  orders: [
    {
      id: "ord-101",
      listingId: "list-1",
      listingName: "Sourdough Country Loaf",
      listingImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
      bakeryId: "bakery-crust",
      bakeryName: "Crust & Crumb Artisan Bakery",
      customerId: "cust-alex",
      customerName: "Alex Mercer",
      quantity: 1,
      totalAmount: 110.00,
      pickupSlot: "17:00 - 19:00",
      status: "completed",
      qrCode: "RESCUE_CONF_ORD101_3X9A",
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), // Yesterday
      hasReview: true
    },
    {
      id: "ord-102",
      listingId: "list-2",
      listingName: "Classic Butter Croissant Bag",
      listingImage: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400",
      bakeryId: "bakery-crust",
      bakeryName: "Crust & Crumb Artisan Bakery",
      customerId: "cust-alex",
      customerName: "Alex Mercer",
      quantity: 1,
      totalAmount: 160.00,
      pickupSlot: "17:00 - 19:00",
      status: "reserved",
      qrCode: "RESCUE_CONF_ORD102_7K2D",
      timestamp: new Date().toISOString()
    }
  ],
  donations: [
    {
      id: "don-1",
      bakeryId: "bakery-crust",
      bakeryName: "Crust & Crumb Artisan Bakery",
      ngoId: "ngo-feed",
      ngoName: "Feed the City Shelter",
      title: "10kg Assorted Artisan Sourdough & Baguettes",
      description: "A large batch of surplus unsliced sourdough loaves and crisp French baguettes, baked fresh this morning.",
      quantity: 10, // kg
      status: "completed",
      timestamp: new Date(Date.now() - 36 * 3600000).toISOString(),
      scheduledPickup: "2026-06-28T18:30:00.000Z"
    },
    {
      id: "don-2",
      bakeryId: "bakery-crust",
      bakeryName: "Crust & Crumb Artisan Bakery",
      title: "Savory Vegetable Puff Tray",
      description: "Tasty vegetarian pastries filled with spiced potato, peas, and carrots. Safe for consumption.",
      quantity: 3, // trays
      status: "available",
      timestamp: new Date().toISOString()
    }
  ],
  reviews: [
    {
      id: "rev-1",
      bakeryId: "bakery-crust",
      customerId: "cust-alex",
      customerName: "Alex Mercer",
      rating: 5,
      foodQuality: 5,
      freshness: 5,
      pickupExperience: 5,
      valueForMoney: 5,
      comment: "Absolutely amazing sourdough! It was still incredibly fresh, and picking it up was seamless. Saving money while rescuing food is my absolute favorite thing now.",
      timestamp: new Date(Date.now() - 23 * 3600000).toISOString()
    }
  ]
};

// Read Database Helper
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Database reading error:", err);
    return initialDb;
  }
}

// Write Database Helper
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Database writing error:", err);
  }
}

// Lazy-initialized Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini AI Client successfully initialized server-side.");
    } else {
      console.log("Gemini API key is missing or is the default placeholder. Falling back to structured mock AI mode.");
    }
  }
  return aiClient;
}

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

// 1. Auth API
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find((u: any) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  // Exclude password in return
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

app.post("/api/auth/register", (req, res) => {
  const { email, password, name, role, bakeryName, ngoName, address, contact, certificate } = req.body;
  const db = readDb();
  if (db.users.some((u: any) => u.email === email)) {
    return res.status(400).json({ error: "User with this email already exists" });
  }

  const userId = `user-${Math.random().toString(36).substr(2, 9)}`;
  const newUser: any = {
    id: userId,
    email,
    password,
    name,
    role,
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"
  };

  if (role === "customer") {
    newUser.customerProfile = {
      loyaltyPoints: 0,
      greenBadges: ["Rescue Rookie"],
      savedKg: 0,
      savedCo2: 0,
      savedMeals: 0,
      coupons: []
    };
  } else if (role === "bakery") {
    const bakeryId = `bakery-${Math.random().toString(36).substr(2, 9)}`;
    newUser.id = bakeryId; // Keep ids consistent
    newUser.bakeryProfile = {
      id: bakeryId,
      name: bakeryName || "My New Bakery",
      logo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=120",
      description: "Welcome to our bakery! Fresh pastries, artisanal goods, and delicious rescue opportunities.",
      address: address || "123 Bread Street",
      latitude: 37.7749 + (Math.random() - 0.5) * 0.05,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.05,
      operatingHours: "08:00 - 20:00",
      contact: contact || "+1 (555) 111-2222",
      safetyCertificate: certificate || "PENDING-CERT",
      sustainabilityScore: 75,
      rating: 5.0,
      reviewsCount: 0,
      savedKg: 0,
      savedCo2: 0,
      mealsRescued: 0,
      revenueRecovered: 0
    };
  } else if (role === "ngo") {
    const ngoId = `ngo-${Math.random().toString(36).substr(2, 9)}`;
    newUser.id = ngoId;
    newUser.ngoProfile = {
      id: ngoId,
      name: ngoName || "My Food Recovery NGO",
      description: "Committed to redistributing edible baked surplus to community kitchens and shelters.",
      address: address || "456 Compassion Way",
      contact: contact || "+1 (555) 333-4444",
      registrationNumber: certificate || "NGO-PENDING",
      mealsDistributed: 0
    };
  }

  db.users.push(newUser);
  writeDb(db);

  const { password: _, ...safeUser } = newUser;
  res.json(safeUser);
});

// 2. Bakeries API
app.get("/api/bakeries", (req, res) => {
  const db = readDb();
  const bakeries = db.users
    .filter((u: any) => u.role === "bakery" && u.bakeryProfile)
    .map((u: any) => u.bakeryProfile);
  res.json(bakeries);
});

app.get("/api/bakeries/:id", (req, res) => {
  const db = readDb();
  const bakeryUser = db.users.find((u: any) => u.role === "bakery" && u.id === req.params.id);
  if (!bakeryUser || !bakeryUser.bakeryProfile) {
    return res.status(404).json({ error: "Bakery not found" });
  }
  const reviews = db.reviews.filter((r: any) => r.bakeryId === req.params.id);
  res.json({
    ...bakeryUser.bakeryProfile,
    reviews
  });
});

app.put("/api/bakeries/:id", (req, res) => {
  const db = readDb();
  const userIdx = db.users.findIndex((u: any) => u.id === req.params.id);
  if (userIdx === -1 || !db.users[userIdx].bakeryProfile) {
    return res.status(404).json({ error: "Bakery profile not found" });
  }

  db.users[userIdx].bakeryProfile = {
    ...db.users[userIdx].bakeryProfile,
    ...req.body
  };
  writeDb(db);
  res.json(db.users[userIdx].bakeryProfile);
});

// 3. Listings API
app.get("/api/listings", (req, res) => {
  const db = readDb();
  let listings = db.listings;

  const { category, label, status, bakeryId, search } = req.query;

  if (bakeryId) {
    listings = listings.filter((l: any) => l.bakeryId === bakeryId);
  }
  if (category && category !== "all") {
    listings = listings.filter((l: any) => l.category === category);
  }
  if (label && label !== "all") {
    listings = listings.filter((l: any) => l.label === label);
  }
  if (status) {
    listings = listings.filter((l: any) => l.status === status);
  } else {
    // Default show available or reserved
    listings = listings.filter((l: any) => l.status === "available" || l.status === "reserved");
  }
  if (search) {
    const s = String(search).toLowerCase();
    listings = listings.filter((l: any) => 
      l.name.toLowerCase().includes(s) || 
      l.description.toLowerCase().includes(s) ||
      l.bakeryName.toLowerCase().includes(s)
    );
  }

  res.json(listings);
});

app.post("/api/listings", (req, res) => {
  const db = readDb();
  const { bakeryId, name, category, description, originalPrice, rescuePrice, quantity, expiryTime, pickupStart, pickupEnd, image, allergens, ingredients, label, isRescueBox, estimatedValue } = req.body;

  const bakeryUser = db.users.find((u: any) => u.id === bakeryId);
  const bakeryName = bakeryUser?.bakeryProfile?.name || "Artisan Bakery";

  let finalExpiryTime = expiryTime;
  if (finalExpiryTime) {
    const hoursLeft = (new Date(finalExpiryTime).getTime() - Date.now()) / 3600000;
    if (hoursLeft > 16) {
      finalExpiryTime = new Date(Date.now() + 16 * 3600000).toISOString();
    }
  } else {
    finalExpiryTime = new Date(Date.now() + 4 * 3600000).toISOString();
  }

  const newListing = {
    id: `list-${Math.random().toString(36).substr(2, 9)}`,
    bakeryId,
    bakeryName,
    name,
    category,
    description,
    originalPrice: Number(originalPrice),
    rescuePrice: Number(rescuePrice),
    quantity: Number(quantity),
    expiryTime: finalExpiryTime,
    pickupStart: pickupStart || "17:00",
    pickupEnd: pickupEnd || "19:00",
    image: image || "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
    allergens: Array.isArray(allergens) ? allergens : [],
    ingredients: ingredients || "",
    label: label || "none",
    status: "available",
    isRescueBox: Boolean(isRescueBox),
    estimatedValue: estimatedValue ? Number(estimatedValue) : undefined
  };

  db.listings.unshift(newListing);
  writeDb(db);
  res.json(newListing);
});

app.put("/api/listings/:id", (req, res) => {
  const db = readDb();
  const idx = db.listings.findIndex((l: any) => l.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Listing not found" });
  }

  const updateData = { ...req.body };
  if (updateData.expiryTime) {
    const hoursLeft = (new Date(updateData.expiryTime).getTime() - Date.now()) / 3600000;
    if (hoursLeft > 16) {
      updateData.expiryTime = new Date(Date.now() + 16 * 3600000).toISOString();
    }
  }

  db.listings[idx] = {
    ...db.listings[idx],
    ...updateData
  };
  writeDb(db);
  res.json(db.listings[idx]);
});

app.delete("/api/listings/:id", (req, res) => {
  const db = readDb();
  const idx = db.listings.findIndex((l: any) => l.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Listing not found" });
  }
  db.listings.splice(idx, 1);
  writeDb(db);
  res.json({ success: true });
});

// 4. Orders & Reservations API
app.get("/api/orders", (req, res) => {
  const db = readDb();
  const { customerId, bakeryId } = req.query;
  let orders = db.orders;

  if (customerId) {
    orders = orders.filter((o: any) => o.customerId === customerId);
  }
  if (bakeryId) {
    orders = orders.filter((o: any) => o.bakeryId === bakeryId);
  }

  // Sort orders by timestamp descending
  orders.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(orders);
});

app.post("/api/orders", (req, res) => {
  const db = readDb();
  const { listingId, customerId, quantity, pickupSlot } = req.body;

  const listing = db.listings.find((l: any) => l.id === listingId);
  if (!listing) {
    return res.status(404).json({ error: "Product listing not found" });
  }
  if (listing.quantity < quantity || listing.status !== "available") {
    return res.status(400).json({ error: "Product no longer available in the requested quantity" });
  }

  const customer = db.users.find((u: any) => u.id === customerId);
  if (!customer) {
    return res.status(404).json({ error: "Customer profile not found" });
  }

  // Deduct listing quantity
  listing.quantity -= quantity;
  if (listing.quantity === 0) {
    listing.status = "sold_out";
  }

  const orderId = `ord-${Math.floor(100 + Math.random() * 900)}`;
  const totalAmount = listing.rescuePrice * quantity;

  const newOrder = {
    id: orderId,
    listingId: listing.id,
    listingName: listing.name,
    listingImage: listing.image,
    bakeryId: listing.bakeryId,
    bakeryName: listing.bakeryName,
    customerId: customer.id,
    customerName: customer.name,
    quantity,
    totalAmount: Number(totalAmount.toFixed(2)),
    pickupSlot: pickupSlot || `${listing.pickupStart} - ${listing.pickupEnd}`,
    status: "reserved",
    qrCode: `RESCUE_CONF_${orderId}_${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    timestamp: new Date().toISOString()
  };

  db.orders.unshift(newOrder);

  // Add loyalty points (+10 pts per rescue order)
  if (customer.customerProfile) {
    customer.customerProfile.loyaltyPoints += 15 * quantity;
    // Auto unlock badges
    if (customer.customerProfile.loyaltyPoints >= 500 && !customer.customerProfile.greenBadges.includes("Sustain Champion")) {
      customer.customerProfile.greenBadges.push("Sustain Champion");
    }
  }

  writeDb(db);
  res.json(newOrder);
});

// QR Pickup Verification
app.post("/api/orders/:id/verify", (req, res) => {
  const db = readDb();
  const order = db.orders.find((o: any) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  if (order.status !== "reserved") {
    return res.status(400).json({ error: `Order is already ${order.status}` });
  }

  order.status = "completed";

  // Update customer stats
  const customer = db.users.find((u: any) => u.id === order.customerId);
  const kgSaved = order.quantity * 0.5; // assume average item is 0.5 kg
  const co2Saved = Number((kgSaved * 2.5).toFixed(2)); // 2.5kg CO2 per kg food saved

  if (customer && customer.customerProfile) {
    customer.customerProfile.savedKg = Number((customer.customerProfile.savedKg + kgSaved).toFixed(2));
    customer.customerProfile.savedCo2 = Number((customer.customerProfile.savedCo2 + co2Saved).toFixed(2));
    customer.customerProfile.savedMeals += order.quantity;
  }

  // Update bakery statistics
  const bakeryUser = db.users.find((u: any) => u.id === order.bakeryId);
  if (bakeryUser && bakeryUser.bakeryProfile) {
    bakeryUser.bakeryProfile.savedKg = Number((bakeryUser.bakeryProfile.savedKg + kgSaved).toFixed(2));
    bakeryUser.bakeryProfile.savedCo2 = Number((bakeryUser.bakeryProfile.savedCo2 + co2Saved).toFixed(2));
    bakeryUser.bakeryProfile.mealsRescued += order.quantity;
    bakeryUser.bakeryProfile.revenueRecovered = Number((bakeryUser.bakeryProfile.revenueRecovered + order.totalAmount).toFixed(2));

    // Recalculate sustainability score based on waste saved and reviews
    bakeryUser.bakeryProfile.sustainabilityScore = Math.min(100, Math.floor(75 + bakeryUser.bakeryProfile.mealsRescued * 0.2));
  }

  writeDb(db);
  res.json({ success: true, order });
});

// Cancel Order
app.post("/api/orders/:id/cancel", (req, res) => {
  const db = readDb();
  const order = db.orders.find((o: any) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  if (order.status !== "reserved") {
    return res.status(400).json({ error: "Only active reservations can be cancelled" });
  }

  order.status = "cancelled";

  // Restore listing quantity
  const listing = db.listings.find((l: any) => l.id === order.listingId);
  if (listing) {
    listing.quantity += order.quantity;
    if (listing.status === "sold_out") {
      listing.status = "available";
    }
  }

  writeDb(db);
  res.json({ success: true, order });
});

// 5. Donations API (NGO portal)
app.get("/api/donations", (req, res) => {
  const db = readDb();
  const { ngoId, bakeryId, status } = req.query;
  let donations = db.donations;

  if (ngoId) {
    donations = donations.filter((d: any) => d.ngoId === ngoId);
  }
  if (bakeryId) {
    donations = donations.filter((d: any) => d.bakeryId === bakeryId);
  }
  if (status) {
    donations = donations.filter((d: any) => d.status === status);
  }

  // Sort by date descending
  donations.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(donations);
});

app.post("/api/donations", (req, res) => {
  const db = readDb();
  const { bakeryId, title, description, quantity } = req.body;

  const bakeryUser = db.users.find((u: any) => u.id === bakeryId);
  const bakeryName = bakeryUser?.bakeryProfile?.name || "Artisan Bakery";

  const newDonation = {
    id: `don-${Math.random().toString(36).substr(2, 9)}`,
    bakeryId,
    bakeryName,
    title,
    description,
    quantity: Number(quantity) || 1,
    status: "available",
    timestamp: new Date().toISOString()
  };

  db.donations.unshift(newDonation);
  writeDb(db);
  res.json(newDonation);
});

// NGO claim/accept donation
app.post("/api/donations/:id/accept", (req, res) => {
  const db = readDb();
  const { ngoId, scheduledPickup } = req.body;

  const donation = db.donations.find((d: any) => d.id === req.params.id);
  if (!donation) {
    return res.status(404).json({ error: "Donation listing not found" });
  }
  if (donation.status !== "available") {
    return res.status(400).json({ error: "Donation already claimed" });
  }

  const ngoUser = db.users.find((u: any) => u.id === ngoId);
  if (!ngoUser || ngoUser.role !== "ngo") {
    return res.status(400).json({ error: "Invalid NGO profile claiming donation" });
  }

  donation.ngoId = ngoId;
  donation.ngoName = ngoUser.ngoProfile?.name || ngoUser.name;
  donation.status = "accepted";
  donation.scheduledPickup = scheduledPickup || new Date(Date.now() + 2 * 3600000).toISOString();

  writeDb(db);
  res.json(donation);
});

// NGO confirm pickup completed
app.post("/api/donations/:id/complete", (req, res) => {
  const db = readDb();
  const donation = db.donations.find((d: any) => d.id === req.params.id);
  if (!donation) {
    return res.status(404).json({ error: "Donation listing not found" });
  }
  if (donation.status !== "accepted") {
    return res.status(400).json({ error: "Donation must be accepted before pickup can be completed" });
  }

  donation.status = "completed";

  // Update NGO stats (distributed meals, assuming 1kg food ≈ 2 meals)
  const ngoUser = db.users.find((u: any) => u.id === donation.ngoId);
  if (ngoUser && ngoUser.ngoProfile) {
    const meals = Math.ceil(donation.quantity * 2);
    ngoUser.ngoProfile.mealsDistributed += meals;
  }

  // Update bakery statistics
  const bakeryUser = db.users.find((u: any) => u.id === donation.bakeryId);
  if (bakeryUser && bakeryUser.bakeryProfile) {
    const kgSaved = donation.quantity; // Assume quantity represents kg in donations
    const co2Saved = Number((kgSaved * 2.5).toFixed(2));

    bakeryUser.bakeryProfile.savedKg = Number((bakeryUser.bakeryProfile.savedKg + kgSaved).toFixed(2));
    bakeryUser.bakeryProfile.savedCo2 = Number((bakeryUser.bakeryProfile.savedCo2 + co2Saved).toFixed(2));
    bakeryUser.bakeryProfile.mealsRescued += Math.ceil(kgSaved * 2);
    bakeryUser.bakeryProfile.sustainabilityScore = Math.min(100, bakeryUser.bakeryProfile.sustainabilityScore + 3);
  }

  writeDb(db);
  res.json(donation);
});

// 6. Reviews & Rating API
app.post("/api/orders/:id/review", (req, res) => {
  const db = readDb();
  const order = db.orders.find((o: any) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  if (order.status !== "completed") {
    return res.status(400).json({ error: "Can only review completed pick-ups" });
  }

  const { rating, foodQuality, freshness, pickupExperience, valueForMoney, comment } = req.body;

  const reviewId = `rev-${Math.random().toString(36).substr(2, 9)}`;
  const newReview = {
    id: reviewId,
    bakeryId: order.bakeryId,
    customerId: order.customerId,
    customerName: order.customerName,
    rating: Number(rating),
    foodQuality: Number(foodQuality),
    freshness: Number(freshness),
    pickupExperience: Number(pickupExperience),
    valueForMoney: Number(valueForMoney),
    comment: comment || "",
    timestamp: new Date().toISOString()
  };

  db.reviews.push(newReview);
  order.hasReview = true;

  // Recalculate Bakery Average Rating
  const bakeryUser = db.users.find((u: any) => u.id === order.bakeryId);
  if (bakeryUser && bakeryUser.bakeryProfile) {
    const bakeryReviews = db.reviews.filter((r: any) => r.bakeryId === order.bakeryId);
    const avg = bakeryReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / bakeryReviews.length;
    bakeryUser.bakeryProfile.rating = Number(avg.toFixed(1));
    bakeryUser.bakeryProfile.reviewsCount = bakeryReviews.length;
  }

  writeDb(db);
  res.json(newReview);
});

// 7. Loyalty Program coupon redeem
app.post("/api/rewards/redeem", (req, res) => {
  const db = readDb();
  const { customerId, couponType } = req.body;

  const customer = db.users.find((u: any) => u.id === customerId);
  if (!customer || !customer.customerProfile) {
    return res.status(404).json({ error: "Customer profile not found" });
  }

  let cost = 100;
  let discount = 100.00;
  let desc = "₹100 off next rescue purchase";

  if (couponType === "medium") {
    cost = 200;
    discount = 250.00;
    desc = "₹250 off next rescue purchase";
  } else if (couponType === "large") {
    cost = 400;
    discount = 500.00;
    desc = "₹500 off any bakery items";
  }

  if (customer.customerProfile.loyaltyPoints < cost) {
    return res.status(400).json({ error: "Insufficient loyalty rescue points" });
  }

  customer.customerProfile.loyaltyPoints -= cost;
  const newCoupon = {
    code: `RESCUE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    discountAmount: discount,
    description: desc,
    expiryDate: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0] // 30 days
  };

  customer.customerProfile.coupons.push(newCoupon);
  writeDb(db);
  res.json({ success: true, pointsLeft: customer.customerProfile.loyaltyPoints, coupon: newCoupon });
});

// Admin verification triggers
app.post("/api/admin/verify", (req, res) => {
  const db = readDb();
  const { targetId, role } = req.body; // targetId can be bakeryId or ngoId

  const userIdx = db.users.findIndex((u: any) => u.id === targetId);
  if (userIdx === -1) {
    return res.status(404).json({ error: "Entity not found" });
  }

  if (role === "bakery" && db.users[userIdx].bakeryProfile) {
    db.users[userIdx].bakeryProfile.safetyCertificate = "VERIFIED-APPROVED";
    db.users[userIdx].bakeryProfile.sustainabilityScore = Math.max(80, db.users[userIdx].bakeryProfile.sustainabilityScore);
  } else if (role === "ngo" && db.users[userIdx].ngoProfile) {
    db.users[userIdx].ngoProfile.registrationNumber = "NGO-VERIFIED-ACTIVE";
  }

  writeDb(db);
  res.json({ success: true, message: "Verification approved successfully." });
});

// ----------------------------------------------------
// AI / GEMINI API INTEGRATIONS (lazy-initialized)
// ----------------------------------------------------

// Endpoint 1: Engaging product description generator
app.post("/api/ai/description", async (req, res) => {
  const { name, ingredients, category } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    // Elegant, high-fidelity mock fallback
    const fallbackDesc = `Rescued fresh! Indulge in our delicious artisanal ${name || 'bakery item'} crafted with quality ingredients including ${ingredients || 'love and care'}. Perfectly baked, sustainable, and ready to enjoy.`;
    return res.json({ text: fallbackDesc, isMock: true });
  }

  try {
    const prompt = `Product Name: "${name}"\nCategory: "${category}"\nKey Ingredients: "${ingredients || "Standard premium bakery ingredients"}"\n\nGenerate an engaging, mouth-watering description (maximum 2 sentences) optimized for Leftover Rescue Hub. Keep it fresh, appetising, and briefly mention the eco-friendly rescue aspect. Do not use generic filler words.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert copywriter for a premium sustainable bakery app called bakeback. Generate short, appetizing descriptions focused on taste and reducing food waste.",
        temperature: 0.7,
      }
    });

    res.json({ text: response.text || "Freshly baked surplus goodies ready to rescue!", isMock: false });
  } catch (error: any) {
    console.error("Gemini description error:", error);
    const fallbackDesc = `Rescue our delicious, freshly made ${name || 'item'} baked with pure ingredients. Save a delicious treat from going to waste today!`;
    res.json({ text: fallbackDesc, error: error.message, isMock: true });
  }
});

// Endpoint 2: Smart Discount Engine
app.post("/api/ai/smart-discount", async (req, res) => {
  const { originalPrice, category, hoursToExpiry, demandFactor } = req.body;
  const ai = getGeminiClient();

  const basePrice = Number(originalPrice);
  if (isNaN(basePrice) || basePrice <= 0) {
    return res.status(400).json({ error: "Invalid original price" });
  }

  // Enforce 16 hours limit maximum
  const clampedHours = Math.min(16, Number(hoursToExpiry || 3));

  // Pre-calculated default formulas for secure client-side robustness if API is down
  let calculatedDiscount = 40; // Default 40%
  if (clampedHours <= 1) calculatedDiscount = 65;
  else if (clampedHours <= 3) calculatedDiscount = 50;
  else if (clampedHours <= 6) calculatedDiscount = 35;

  if (demandFactor === "low") calculatedDiscount += 10;
  if (demandFactor === "high") calculatedDiscount -= 10;
  calculatedDiscount = Math.min(80, Math.max(20, calculatedDiscount)); // clamp between 20% and 80%

  const calculatedPrice = Number((basePrice * (1 - calculatedDiscount / 100)).toFixed(2));
  const defaultFallback = {
    suggestedPrice: calculatedPrice,
    discountPercentage: calculatedDiscount,
    justification: `Based on standard bakery rescue protocols, a ${calculatedDiscount}% discount is applied as there are only ${clampedHours} hours left before expiry with ${demandFactor} demand.`
  };

  if (!ai) {
    return res.json({ ...defaultFallback, isMock: true });
  }

  try {
    const prompt = `Original Price: ₹${basePrice}\nCategory: ${category}\nHours until Expiry: ${clampedHours}\nCurrent Store Demand: ${demandFactor}\n\nRecommend an optimized rescue price and discount percentage (between 20% and 80%). Provide a concise, professional 1-sentence business logic justification. Return the response as a single valid JSON object.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an AI Smart Discount Engine for Leftover Rescue Hub. Analyze inventory conditions to suggest prices. You MUST output a strictly valid JSON response matching this schema: {\"suggestedPrice\": number, \"discountPercentage\": number, \"justification\": \"string\"}",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedPrice: { type: Type.NUMBER, description: "Suggested discounted rescue price" },
            discountPercentage: { type: Type.NUMBER, description: "Discount percentage as integer" },
            justification: { type: Type.STRING, description: "1-sentence business justification" }
          },
          required: ["suggestedPrice", "discountPercentage", "justification"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ ...parsed, isMock: false });
  } catch (error: any) {
    console.error("Gemini smart discount error:", error);
    res.json({ ...defaultFallback, error: error.message, isMock: true });
  }
});

// Endpoint 3: Demand Forecasting for leftovers
app.post("/api/ai/demand-forecast", async (req, res) => {
  const { bakeryId, weekday, weather } = req.body;
  const ai = getGeminiClient();

  const standardForecast = [
    { itemName: "Butter Croissant Bag", forecastedLeftoverQty: 3, confidenceLevel: "High", recommendedAction: "Price at 50% rescue discount by 17:00 to trigger fast evening pickup" },
    { itemName: "Sourdough Boule", forecastedLeftoverQty: 5, confidenceLevel: "High", recommendedAction: "List as a surprise 'Savory Rescue Box' or alert NGO shelter by 18:00" },
    { itemName: "Assorted Sweet Pastries", forecastedLeftoverQty: 2, confidenceLevel: "Medium", recommendedAction: "Combine remaining Danish pastries into a Sweet Rescue Box" },
    { itemName: "Custom Celebration Cakes", forecastedLeftoverQty: 1, confidenceLevel: "Low", recommendedAction: "Offer flash-sale discount at 40% discount during final 2 hours" }
  ];

  if (!ai) {
    return res.json({ forecasts: standardForecast, isMock: true });
  }

  try {
    const prompt = `Forecast surplus inventory for Bakery ID: ${bakeryId} on a ${weekday} during ${weather} weather. Return a JSON array list of likely leftovers.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a senior bakery inventory forecasting AI. Predict leftovers and suggest proactive discount/rescue actions. Output a JSON object containing a 'forecasts' property which is an array of objects: {\"itemName\": string, \"forecastedLeftoverQty\": number, \"confidenceLevel\": \"High\"|\"Medium\"|\"Low\", \"recommendedAction\": string}",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            forecasts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemName: { type: Type.STRING },
                  forecastedLeftoverQty: { type: Type.NUMBER },
                  confidenceLevel: { type: Type.STRING, description: "High, Medium, or Low" },
                  recommendedAction: { type: Type.STRING }
                },
                required: ["itemName", "forecastedLeftoverQty", "confidenceLevel", "recommendedAction"]
              }
            }
          },
          required: ["forecasts"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ ...parsed, isMock: false });
  } catch (error: any) {
    console.error("Gemini demand forecast error:", error);
    res.json({ forecasts: standardForecast, error: error.message, isMock: true });
  }
});

// Endpoint 4: Sustainability insights and carbon report
app.post("/api/ai/sustainability-insights", async (req, res) => {
  const { savedKg, savedCo2, mealsRescued, donationsCount } = req.body;
  const ai = getGeminiClient();

  const fallbackReport = {
    carbonSavedText: `You have successfully saved ${savedKg || 0} kg of delicious bakery food from waste, preventing approximately ${savedCo2 || 0} kg of CO₂ from entering our atmosphere. This is equivalent to saving the energy output of charging ${(savedKg || 0) * 15} smartphones!`,
    recommendations: [
      "Create bundled 'Morning Sunrise Surprise Boxes' for fast morning pick-ups to clear leftover goods from the previous night.",
      "Integrate our express NGO donation pathway to auto-post surplus bread loaves right after closing time.",
      "Advertise 'Sourdough Discard Specials' using day-old bread for seasoned croutons, sweet pudding, or French toast ingredients."
    ]
  };

  if (!ai) {
    return res.json({ ...fallbackReport, isMock: true });
  }

  try {
    const prompt = `Bakery Rescue Statistics:\n- Total Food Rescued: ${savedKg} kg\n- Estimated Carbon prevented: ${savedCo2} kg of CO2\n- Rescued Customer Meals: ${mealsRescued}\n- NGO Charity Donations: ${donationsCount}\n\nGenerate an inspiring 2-sentence carbon reduction summary. Also provide exactly 3 actionable, smart bakery-specific suggestions to optimize their rescue efficiency. Output as JSON.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional carbon footprint and food waste mitigation advisor. Help bakeries understand their positive climate impact and suggest tailored strategies. Return a JSON object matching this schema: {\"carbonSavedText\": \"string\", \"recommendations\": [\"string\", \"string\", \"string\"]}",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            carbonSavedText: { type: Type.STRING, description: "Inspiring sustainability impact explanation" },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 highly tailored recommendations"
            }
          },
          required: ["carbonSavedText", "recommendations"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ ...parsed, isMock: false });
  } catch (error: any) {
    console.error("Gemini sustainability insights error:", error);
    res.json({ ...fallbackReport, error: error.message, isMock: true });
  }
});

// ----------------------------------------------------
// VITE OR STATIC STATIC SITES MIDDLEWARE
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BakeBack full-stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
