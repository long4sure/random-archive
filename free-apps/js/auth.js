const SYSTEM_KEY = "biz_selected_system";
const PENDING_REG_KEY = "biz_pending_registration";

function getSelectedSystem() {
  return sessionStorage.getItem(SYSTEM_KEY) || new URLSearchParams(location.search).get("system");
}

function setSelectedSystem(system) {
  if (system) sessionStorage.setItem(SYSTEM_KEY, system);
}

function systemLabel(system) {
  const labels = { erp: "ERP", pos: "POS", crm: "CRM", admin: "Admin" };
  return labels[system] || system?.toUpperCase() || "App";
}

function systemDashboardPath(system) {
  const map = {
    erp: "erp/index.html",
    pos: "pos/index.html",
    crm: "crm/index.html",
    admin: "admin/index.html",
  };
  return appUrl(map[system] || "index.html");
}

async function getSession() {
  const sb = getSupabase();
  const { data } = await sb.auth.getSession();
  return data.session;
}

async function getProfile() {
  const session = await getSession();
  if (!session) return null;
  const sb = getSupabase();
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();
  if (error) return null;
  return data;
}

async function requireAuth(allowedSystems = []) {
  const session = await getSession();
  if (!session) {
    const system = getSelectedSystem();
    location.href = appUrl(`login.html${system ? `?system=${system}` : ""}`);
    return null;
  }
  const profile = await getProfile();
  if (!profile) {
    await signOut();
    return null;
  }
  if (allowedSystems.includes("admin") && profile.role !== "admin") {
    location.href = appUrl("index.html");
    return null;
  }
  return { session, profile };
}

async function logActivity(system, action, details = {}) {
  const session = await getSession();
  if (!session) return;
  const sb = getSupabase();
  await sb.from("app_activity").insert({
    user_id: session.user.id,
    system,
    action,
    details,
  });
}

/** Sends 6-digit code by email (Supabase — no terminal setup) */
function authErrorMessage(err) {
  if (!err) return "Something went wrong";
  return err.message || err.error_description || err.msg || String(err);
}

async function sendAuthOtp(email) {
  const sb = getSupabase();
  const { error } = await sb.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
  });
  if (error) throw new Error(authErrorMessage(error));
}

/** Checks the 6-digit code from email */
async function verifyEmailOtp(email, token) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: String(token),
    type: "email",
  });
  if (error) throw new Error(authErrorMessage(error));
  await logActivity("auth", "otp_verified", {});
  return data;
}

async function signUpWithPassword(email, password, full_name) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { full_name } },
  });
  if (error) throw new Error(authErrorMessage(error));
  return data;
}

async function signInWithPassword(email, password) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error(authErrorMessage(error));
  await logActivity("auth", "login_password", {});
  return data;
}

async function markProfileVerified(full_name) {
  const session = await getSession();
  if (!session) return;
  const sb = getSupabase();
  await sb
    .from("profiles")
    .update({ email_verified: true, full_name: full_name || undefined })
    .eq("id", session.user.id);
}

async function signOut() {
  const sb = getSupabase();
  await sb.auth.signOut();
  sessionStorage.removeItem(SYSTEM_KEY);
  location.href = appUrl("index.html");
}

function savePendingRegistration(data) {
  sessionStorage.setItem(PENDING_REG_KEY, JSON.stringify(data));
}

function getPendingRegistration() {
  const raw = sessionStorage.getItem(PENDING_REG_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearPendingRegistration() {
  sessionStorage.removeItem(PENDING_REG_KEY);
}

async function redirectAfterAuth() {
  const profile = await getProfile();
  const system = getSelectedSystem();

  if (profile?.role === "admin" && !system) {
    location.href = appUrl("admin/index.html");
    return;
  }

  if (system && ["erp", "pos", "crm"].includes(system)) {
    location.href = systemDashboardPath(system);
    return;
  }

  location.href = appUrl("dashboard.html");
}

window.getSelectedSystem = getSelectedSystem;
window.setSelectedSystem = setSelectedSystem;
window.systemLabel = systemLabel;
window.systemDashboardPath = systemDashboardPath;
window.getSession = getSession;
window.getProfile = getProfile;
window.requireAuth = requireAuth;
window.logActivity = logActivity;
window.sendAuthOtp = sendAuthOtp;
window.verifyEmailOtp = verifyEmailOtp;
window.signUpWithPassword = signUpWithPassword;
window.signInWithPassword = signInWithPassword;
window.markProfileVerified = markProfileVerified;
window.signOut = signOut;
window.savePendingRegistration = savePendingRegistration;
window.getPendingRegistration = getPendingRegistration;
window.clearPendingRegistration = clearPendingRegistration;
window.redirectAfterAuth = redirectAfterAuth;
