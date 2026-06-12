;(function () {
  const cfg = window.APP_CONFIG || {}
  const url = cfg.SUPABASE_URL || ''
  const key = cfg.SUPABASE_ANON_KEY || ''

  window.isConfigValid = function () {
    return (
      url &&
      key &&
      !url.includes('YOUR_PROJECT') &&
      key !== 'your-anon-key-here'
    )
  }

  if (!window.isConfigValid()) {
    window.supabase = null
    return
  }

  window.supabase = window.supabaseLib.createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
})()
