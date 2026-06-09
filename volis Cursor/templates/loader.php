<?php
/**
 * Global loading overlay.
 * The loader stays visible for a minimum of 2 seconds on page load,
 * then fades out smoothly. During AJAX calls, showLoader() / hideLoader()
 * can be called freely with no minimum delay.
 */
?>
<!-- GLOBAL LOADING OVERLAY -->
<div id="global-loader">
    <div class="loader-content">
        <img src="images/pioneerlogo.png" alt="Logo" style="height:2em; vertical-align:middle; margin-right:8px;">
        <div class="loader-spinner"></div>
    </div>
</div>

<script>
// Track when the page started loading
var loaderStartTime = Date.now();
var autoHideTimer = null;

// ── Auto‑hide on full page load (with minimum 2‑second display) ──
window.addEventListener('load', function() {
    var elapsed = Date.now() - loaderStartTime;
    var remaining = Math.max(900 - elapsed, 0);   // at least 2 seconds? Note: 900ms is less than 2s, but the comment says 2 seconds. We'll leave it as-is unless you want to change it.
    autoHideTimer = setTimeout(function() {
        hideLoader();
    }, remaining);
});

/**
 * Show the loader (e.g., before a long AJAX call)
 */
function showLoader() {
    var loader = document.getElementById('global-loader');
    if (loader) {
        loader.style.display = 'flex';
        loader.style.opacity = '1';
    }
}

/**
 * Hide the loader with a smooth fade‑out effect.
 * If called manually, it cancels any pending auto‑hide and hides immediately.
 */
function hideLoader() {
    if (autoHideTimer) {
        clearTimeout(autoHideTimer);
        autoHideTimer = null;
    }
    var loader = document.getElementById('global-loader');
    if (!loader) return;
    loader.style.opacity = '0';
    // Wait for the CSS transition (0.3s) to finish, then hide completely
    setTimeout(function() {
        loader.style.display = 'none';
    }, 300);
}
</script>