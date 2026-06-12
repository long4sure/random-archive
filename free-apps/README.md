# BizSuite

ERP, POS, and CRM in vanilla HTML/JS with Supabase.

## Setup (3 steps, all in the browser)

1. **Supabase** → SQL Editor → run `supabase/migrations/002_rerun_safe.sql`
2. **Supabase** → Settings → API → copy URL + anon key into `js/config.js`
3. **Supabase** → Authentication → Providers → turn **Email** ON

**Double-click `START.bat`** (do not open `index.html` directly).

See `SETUP.txt` for details.

## Admin

```sql
update public.profiles set role = 'admin' where email = 'you@email.com';
```
