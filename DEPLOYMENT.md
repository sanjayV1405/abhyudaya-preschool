# Abhyudaya Preschool — Vercel Production Deployment Guide

This guide walks you through deploying the **Abhyudaya Preschool** website to [Vercel](https://vercel.com) with database integration (Supabase) and SPA routing.

---

## 🚀 Quick Deployment Options

### Option 1: Deploy via GitHub + Vercel Web Dashboard (Recommended)

1. **Push your code to GitHub**:
   ```bash
   # If you haven't created a GitHub repo yet:
   # 1. Create a new repository on https://github.com/new
   # 2. Link and push:
   git remote add origin https://github.com/YOUR_USERNAME/abhyudaya-preschool.git
   git branch -M main
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository (`abhyudaya-preschool`).
   - If prompted for **Root Directory**:
     - If the repository root is the project itself, leave it as `./`.
     - If the repository has nested folders, select `Premium Preschool Website (3)/Premium Preschool Website`.
   - **Framework Preset**: `Vite` (automatically detected).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Configure Environment Variables** in Vercel:
   Under **Project Settings → Environment Variables**, add:
   | Key | Value | Description |
   | --- | --- | --- |
   | `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` | Your Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase Public Anonymous API Key |
   | `VITE_ADMIN_ACCESS_KEY` | `abhyudaya-admin-2026` | Custom Admin Dashboard PIN / password |

   *(Note: If Supabase variables are not set yet, the website runs safely in demo/offline mode without crashing).*

4. **Click Deploy**:
   - Vercel will build the project in ~15-20 seconds.
   - Your site will be live at `https://your-project-name.vercel.app`.

---

### Option 2: Deploy via Vercel CLI

If you prefer deploying directly from your terminal:

1. **Install Vercel CLI globally**:
   ```bash
   npm install -g vercel
   ```

2. **Log in to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to Preview**:
   ```bash
   vercel
   ```
   Follow the prompts:
   - *Set up and deploy?* **Y**
   - *Which scope?* Select your account
   - *Link to existing project?* **N**
   - *Project name?* `abhyudaya-preschool`
   - *Directory?* `./`

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## ⚙️ Configuration Files Included

This project includes pre-configured deployment settings:

- **`vercel.json`**:
  - Configures Single Page Application (SPA) catch-all routing so deep URLs (like `/admin`) reload smoothly without 404s.
  - Sets 1-year immutable caching on hashed assets (`/assets/*`).
  - Sets 1-day caching on public static images and icons.
- **`vite.config.ts`**:
  - Optimized production bundle with automatic code-splitting (`AdminPage` lazy chunk).
  - Modern ES import attributes (`with { type: 'json' }`).
- **`.figma/make/site.json`**:
  - Configured with `robots.index: true` for full Google search indexing.
  - Complete SEO meta title, description, and OpenGraph tags.
- **`.gitignore`**:
  - Excludes `.env.local` and sensitive credentials from Git history.

---

## 🗄️ Supabase Production Setup (One-time)

To connect real form submissions and the admin dashboard to Supabase:

1. Create a project at [database.new](https://database.new).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Run the migration script located at:
   `supabase/migrations/20260301000000_create_preschool_schema.sql`
4. Run the seed script located at:
   `supabase/migrations/20260301000001_seed_initial_data.sql`
5. Copy your **Project URL** and **Anon Key** from **Project Settings → API** and add them to Vercel's Environment Variables.

---

## 🧪 Post-Deployment Verification Checklist

Once deployed to Vercel:

- [ ] **Homepage**: Verify hero section, program cards, floating CTAs, and counter animations load smoothly.
- [ ] **Admissions / Enquiry Form**: Submit a test enquiry. Verify confirmation toast message.
- [ ] **Admin Portal**: Navigate to `/admin`, enter your access key, and verify submissions are listed.
- [ ] **Responsive Test**: Open site on mobile (iPhone/Android) and desktop browser.
- [ ] **Direct Navigation**: Refresh `/admin` or deep URLs to verify Vercel SPA rewrites handle the route without 404.
- [ ] **SEO / Favicon**: Verify the favicon shows in the browser tab and meta tags appear when sharing links.
