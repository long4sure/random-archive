# Business Suite — ERP, POS & CRM

Plain **HTML, CSS, and JavaScript** with **Supabase** (auth + database) and **Resend** (OTP email via Supabase SMTP).

**Live:** https://long4sure.github.io/free-apps/

## Files

```
index.html
css/style.css
js/config.js          ← add your Supabase keys
js/config.example.js
js/app.js             ← pages + router
js/auth.js
js/supabase-client.js
js/icons.js
js/utils.js
favicon.svg
```

## Setup

1. Copy `js/config.example.js` → `js/config.js` and add Supabase URL + anon key.
2. In [Supabase](https://supabase.com): enable **Email OTP**, set redirect URL  
   `https://long4sure.github.io/free-apps/#/auth/callback`
3. In Supabase **SMTP**: Resend — host `smtp.resend.com`, user `resend`, password = Resend API key.
4. Create tables with RLS in Supabase (profiles, erp_products, pos_sales, crm_contacts) — use the SQL from your earlier migration or Supabase docs.
5. **GitHub → Settings → Pages** → deploy branch `main` from **`/` (root)**.

## Admin

```sql
update public.profiles set role = 'admin' where email = 'your@email.com';
```

## Local test

```bash
npx serve .
```

Open `http://localhost:3000/#/`
