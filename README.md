# SMART DINE 🍽️ — QR-Based Food Ordering Mobile App & Kitchen Management Platform

> **Smart Ordering. Faster Service. Better Dining.**

SMART DINE is a complete, commercial-grade restaurant QR ordering and kitchen management ecosystem consisting of:
1. **Customer Mobile Application**: Built with React Native + Expo, featuring Camera QR scanner, locked table sessions, categorized digital menu, dish customization, cart, and real-time live order tracking.
2. **Admin & Kitchen Web Dashboard**: Built with React + Vite + Tailwind CSS (deployable on Netlify), featuring real-time multi-stage Kanban queue, live audio bells, revenue analytics, menu & category CRUD, and table QR standee generator (with SVG/PNG download and print sheets).
3. **Firebase Backend**: Cloud Firestore real-time listeners (`onSnapshot`), Firebase Authentication (RBAC: Admin, Kitchen, Customer), and Firebase Storage.
4. **QR Deep-Linking & Netlify Web Fallback**: Seamless transition from QR scan to native app (`smartdine://table/01`) or instant web ordering (`https://smartdine.netlify.app/menu?table=01`).

---

## 📂 Project Architecture

```
SmartDine/
│
├── mobile/                        # React Native + Expo Mobile App
│   ├── app/                       # Expo Router file-based screens
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx        # Bottom tab navigation
│   │   │   ├── index.tsx          # Customer Home (Profile avatar top-right, Table badge, Categories)
│   │   │   ├── menu.tsx           # Digital Menu (Veg/Non-Veg filter, Categories, Dish cards)
│   │   │   ├── orders.tsx         # Order history & live status
│   │   │   └── profile.tsx        # Full customer profile & account settings
│   │   ├── scanner.tsx            # Camera QR Code Scanner with animated targeting frame
│   │   ├── table-confirm.tsx      # Table validation & session lock confirmation
│   │   ├── food/[id].tsx          # Food details modal (hero image, ingredients, cooking notes, quantity)
│   │   ├── cart.tsx               # Cart with locked table header & GST calculation
│   │   ├── checkout.tsx           # Customer information & Firestore order submission
│   │   ├── order-success.tsx      # Celebration screen with Order ID & direct track button
│   │   ├── track/[id].tsx         # Live 5-stage order progress stepper (Real-time Firestore sync)
│   │   ├── auth/                  # Customer Login & Registration modals
│   │   ├── profile/edit.tsx       # Edit name, phone, and profile photo
│   │   └── _layout.tsx            # Root navigation stack & providers
│   ├── context/                   # AuthContext, TableContext, CartContext
│   ├── firebase/config.ts         # Firebase initialization with offline demo fallback
│   ├── app.json                   # Expo configuration & camera permissions
│   └── package.json
│
├── web/                           # React + Vite + Tailwind CSS Admin/Kitchen & Web Fallback
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing & Portal Selector
│   │   │   ├── CustomerWebMenu.jsx# Web Fallback Menu for table QR scans (?table=01)
│   │   │   ├── CustomerWebCart.jsx# Web Cart & Checkout
│   │   │   ├── CustomerWebTrack.jsx# Live web tracking stepper with real-time sync
│   │   │   ├── KitchenDashboard.jsx# Real-time multi-stage Kanban queue with audio chimes
│   │   │   ├── AdminDashboard.jsx # Revenue metrics, orders chart, 1-click demo data seeder
│   │   │   ├── AdminMenu.jsx      # Food menu CRUD, image upload, in-stock switch, Veg toggle
│   │   │   ├── AdminCategories.jsx# Category management
│   │   │   ├── AdminTables.jsx    # Table CRUD, QR generator, high-res PNG download, printable sheets
│   │   │   └── Login.jsx          # Staff login with 1-click Demo switch
│   │   ├── components/            # Navbar, Sidebar, OrderCard, ProtectedRoute
│   │   ├── context/               # AuthContext, TableOrderContext
│   │   └── firebase/config.js     # Firebase config & cross-tab real-time local sync
│   ├── netlify.toml               # Netlify SPA routing redirects
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── firebase/
│   ├── firestore.rules            # Production Firestore security rules with RBAC
│   ├── storage.rules              # Firebase Storage rules
│   ├── firebase.json              # Firebase CLI deploy configuration
│   └── seed-data.js               # 20+ food items, 9 categories, 10 tables, sample orders
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Run the Web Dashboard & Fallback Menu
```bash
cd web
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to access:
- **Landing Hub**: Explore portals
- **Admin Dashboard**: `/admin` (Analytics, Menu CRUD, Printable Standees)
- **Kitchen Dashboard**: `/kitchen` (Live sound chime & order progression)
- **Customer Web Fallback**: `/menu?table=01` (Table QR scan fallback)

### 2. Run the Customer Mobile App
```bash
cd mobile
npm install
npx expo start
```
- Press `a` to run on Android Emulator / Device.
- Press `w` to run in Web browser preview.
- Scan the Expo QR code using the **Expo Go** app on your physical iOS/Android phone.

---

## 🔥 Firebase Setup Guide

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project named `Smart Dine`.
2. **Enable Authentication**: Under *Authentication > Sign-in method*, enable **Email/Password**.
3. **Enable Cloud Firestore**: Create a Firestore database in production mode.
4. **Enable Firebase Storage**: Enable storage for food and profile images.
5. **Deploy Security Rules**:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```
6. **Environment Variables**:
   Copy `.env.example` to `web/.env` and `mobile/.env` with your Firebase project keys:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=smart-dine-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=smart-dine-app
   VITE_FIREBASE_STORAGE_BUCKET=smart-dine-app.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef
   ```

---

## 🌐 Netlify Deployment Guide

1. Connect your repository to **Netlify**.
2. Set Build Settings:
   - **Base directory**: `web`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Add environment variables under *Site configuration > Environment variables*.
4. Deploy site. Netlify will automatically handle SPA routing redirects via `netlify.toml`.

---

## 📱 Android APK / AAB Build Guide (EAS)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Configure build profile:
   ```bash
   cd mobile
   eas build:configure
   ```
4. Generate standalone Android APK for direct testing:
   ```bash
   eas build -p android --profile preview
   ```
5. Generate Google Play Store Android App Bundle (AAB):
   ```bash
   eas build -p android --profile production
   ```

---

## 🧪 End-to-End Verification Test Flow

1. **Staff Setup**: Open `/admin/tables`, click *Add Table* to create Table 01 and Table 02.
2. **Print/Preview QR**: View the standee QR code with URL `https://smartdine.netlify.app/menu?table=01` or deep link `smartdine://table/01`.
3. **Customer Scan**: Open Mobile App QR scanner or navigate to `/menu?table=01`.
4. **Table Connected**: Table 01 is verified and locked in session.
5. **Add Dishes**: Select *Tandoori Paneer Tikka* & *Chicken Dum Biryani*, customize spice level, and add to cart.
6. **Place Order**: Proceed to checkout and confirm.
7. **Kitchen Sync**: Kitchen Dashboard instantly plays a notification chime and shows the new ticket in **New Orders**.
8. **Kitchen Progression**: Kitchen staff clicks **Accept Order** ➔ **Start Preparing** ➔ **Mark as Ready** ➔ **Complete**.
9. **Live Customer Stepper**: Customer's tracking screen automatically transitions from *Placed* to *Cooking* to *Ready to Serve* without manual refresh!
