// ============================================================
// BizDemo — Shared Supabase client + Auth helpers
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// ── CONFIG ────────────────────────────────────────────────
// Replace these with your Supabase project credentials
// Supabase Dashboard → Settings → API
export const SUPABASE_URL = 'https://jezsjmrufvbsuroyqgja.supabase.co'
export const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplenNqbXJ1ZnZic3Vyb3lxZ2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MjkwMTcsImV4cCI6MjA5NDMwNTAxN30.59Pb37Py4B84VhULeeBFkEJo0WmIhQI7_axHU-t6ctU'
// ─────────────────────────────────────────────────────────

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON)

// ── AUTH ──────────────────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data.user
}

export async function signUp(email, password, name) {
  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { name } }
  })
  if (error) throw new Error(error.message)
  return data.user
}

export async function signOut() {
  await sb.auth.signOut()
}

export async function getUser() {
  const { data } = await sb.auth.getUser()
  return data?.user || null
}

// Redirect to login if not authenticated
export async function requireAuth(loginPath = 'login.html') {
  const user = await getUser()
  if (!user) {
    window.location.href = loginPath
    return null
  }
  return user
}

// Redirect to dashboard if already authenticated
export async function redirectIfAuth(dashPath = 'dashboard.html') {
  const user = await getUser()
  if (user) window.location.href = dashPath
}

// ── UI HELPERS ────────────────────────────────────────────

export const peso = n =>
  '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0 })

export function showError(elId, msg) {
  const el = document.getElementById(elId)
  if (!el) return
  el.textContent = msg
  el.classList.add('show')
}

export function hideError(elId) {
  const el = document.getElementById(elId)
  if (el) el.classList.remove('show')
}

export function setLoading(btnId, loading, label = 'Save') {
  const btn = document.getElementById(btnId)
  if (!btn) return
  btn.disabled = loading
  btn.textContent = loading ? 'Please wait…' : label
}

export function openModal(id) {
  document.getElementById(id)?.classList.add('open')
}

export function closeModal(id) {
  document.getElementById(id)?.classList.remove('open')
}

export function showPage(pageId, navClass = 'nav-item') {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  document.querySelectorAll(`.${navClass}`).forEach(n => n.classList.remove('active'))
  document.getElementById('page-' + pageId)?.classList.add('active')
  document.querySelector(`[data-page="${pageId}"]`)?.classList.add('active')
}

export function initials(name = '') {
  return name.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
}

export function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── TOAST ─────────────────────────────────────────────────

export function toast(msg, type = 'success') {
  const t = document.createElement('div')
  t.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${type === 'success' ? '#1D8A5E' : '#C84B2F'};
    color:#fff;padding:10px 18px;border-radius:8px;
    font-size:13px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.15);
    animation:fadeIn .2s ease;
  `
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 2800)
}
