let _client = null;

function getSupabase() {
  if (_client) return _client;
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.BIZ_CONFIG || {};
  if (!SUPABASE_URL || SUPABASE_URL.includes("YOUR_PROJECT")) {
    console.warn("Configure js/config.js with your Supabase URL and anon key.");
  }
  _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

window.getSupabase = getSupabase;
