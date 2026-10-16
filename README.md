# Abhyudaya Preschool — Website & Database Integration

A premium preschool website with full Supabase PostgreSQL database integration, secure enquiry submission, and admin management.

---

## Quick Start

```bash
npm install
npm run dev
```

---

## 1. Required Software

- Node.js >= 18, npm >= 9
- Supabase account (free tier works)
- Vercel account for deployment

---

## 2. Create Supabase Project

1. Sign in at https://supabase.com
2. Click **New Project** → Name: `abhyudaya-preschool`, Region: Asia South (Mumbai)
3. Wait ~2 min for provisioning
4. Go to **Project Settings → API** and copy:
   - Project URL → `VITE_SUPABASE_URL`
   - Anon/Public Key → `VITE_SUPABASE_PUBLISHABLE_KEY`

> Never use the `service_role` key in the frontend.

---

## 3. Apply Database Migrations

Open **Supabase Dashboard → SQL Editor → New query** and run (in order):

1. `supabase/migrations/20260301000000_create_preschool_schema.sql`
2. `supabase/migrations/20260301000001_seed_initial_data.sql`

This creates all tables, RLS policies, and seeds initial data.

---

## 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

Restart `npm run dev`. The amber warning banner on the Contact page will disappear.

---

## 5. Test the Enquiry Form

1. Go to **Contact** page
2. Fill Parent Name + Phone, click **Send Enquiry**
3. Green success banner = DB saved
4. Verify in Supabase → Table Editor → enquiries

---

## 6. Configure Admin Authentication

1. Supabase Dashboard → **Authentication → Users → Add user**
2. Enter admin email + strong password
3. Click **Admin** link (small, in footer) → Login → See enquiry dashboard

---

## 7. Deploy to Vercel

1. Push project to GitHub
2. Import repo in Vercel
3. Build Command: `npm run build` | Output: `dist`
4. Add environment variables in Vercel → Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Deploy

---

## Database Tables

| Table | Public Read | Public Write | Admin |
|-------|-------------|--------------|-------|
| enquiries | ❌ | ✅ (INSERT only, validated) | ✅ Full |
| programs | ✅ (published only) | ❌ | ✅ Full |
| events | ✅ (published only) | ❌ | ✅ Full |
| announcements | ✅ (published only) | ❌ | ✅ Full |
| gallery | ✅ (published only) | ❌ | ✅ Full |
| testimonials | ✅ (published only) | ❌ | ✅ Full |

---

## Project Structure

```
src/
├── App.tsx                     # Main SPA with all pages
├── lib/
│   ├── supabase.ts             # Supabase client singleton
│   └── db.ts                   # Service layer (submit/fetch)
├── types/
│   └── database.ts             # TypeScript types
├── components/
│   └── AdminPage.tsx           # Secure admin dashboard
supabase/
└── migrations/
    ├── 20260301000000_create_preschool_schema.sql
    └── 20260301000001_seed_initial_data.sql
.env.example                    # Copy to .env.local with real keys
```

---

## Post-Deploy Verification

- [ ] Website loads with all animations intact
- [ ] Contact page has no amber warning banner
- [ ] Test enquiry saves successfully (green banner)
- [ ] Enquiry appears in Supabase Table Editor
- [ ] Admin login works and shows enquiry dashboard
- [ ] Status updates persist in database
- [ ] Mobile layout responsive
- [ ] WhatsApp buttons open pre-filled chats
