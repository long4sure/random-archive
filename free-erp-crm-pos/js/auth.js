window.Auth = {
  profile: null,
  session: null,

  redirectUrl() {
    const base = location.origin + location.pathname.replace(/\/$/, '')
    return base + '/#/auth/callback'
  },

  async init() {
    if (!window.supabase) return null
    const { data } = await window.supabase.auth.getSession()
    this.session = data.session
    if (this.session?.user) await this.loadProfile()
    else this.profile = null

    window.supabase.auth.onAuthStateChange(async (_e, session) => {
      this.session = session
      if (session?.user) await this.loadProfile()
      else this.profile = null
      if (typeof window.onAuthChange === 'function') window.onAuthChange()
    })
    return this.session
  },

  async loadProfile() {
    if (!this.session?.user) return null
    const { data, error } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', this.session.user.id)
      .single()
    if (error) {
      console.error(error)
      this.profile = null
      return null
    }
    this.profile = data
    return data
  },

  isLoggedIn() {
    return !!this.session?.user
  },

  isAdmin() {
    return this.profile?.role === 'admin'
  },

  async sendOtp(email, isSignup) {
    const options = { emailRedirectTo: this.redirectUrl() }
    if (isSignup) options.shouldCreateUser = true
    const { error } = await window.supabase.auth.signInWithOtp({ email, options })
    if (error) throw error
  },

  async verifyOtp(email, token) {
    const { data, error } = await window.supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) throw error
    this.session = data.session
    await this.loadProfile()
    return data
  },

  async updateProfileName(fullName, email) {
    const user = this.session?.user
    if (!user) throw new Error('Not signed in')
    const { error } = await window.supabase.from('profiles').upsert(
      { id: user.id, email, full_name: fullName, role: 'user' },
      { onConflict: 'id' }
    )
    if (error) throw error
    await this.loadProfile()
  },

  async signOut() {
    if (window.supabase) await window.supabase.auth.signOut()
    this.session = null
    this.profile = null
  },
}
