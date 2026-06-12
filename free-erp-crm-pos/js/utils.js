window.Utils = {
  escapeHtml(s) {
    const d = document.createElement('div')
    d.textContent = s ?? ''
    return d.innerHTML
  },

  getSystem() {
    const s = sessionStorage.getItem('selected_system')
    return s === 'erp' || s === 'pos' || s === 'crm' ? s : null
  },

  setSystem(sys) {
    sessionStorage.setItem('selected_system', sys)
  },

  showError(elId, msg) {
    const el = document.getElementById(elId)
    if (el) {
      el.textContent = msg
      el.classList.remove('hidden')
    }
  },

  hideError(elId) {
    const el = document.getElementById(elId)
    if (el) el.classList.add('hidden')
  },
}
