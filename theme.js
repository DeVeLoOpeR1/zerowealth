/*
 * Zero Wealth — single site-wide theme setting.
 * Load in <head> (blocking) on every page so the theme is applied before first paint.
 * The theme only changes when the user presses the theme button; the choice is saved
 * once and applies to every page and every open tab. Default is light.
 */
(function () {
  var KEY = 'zw-theme';
  var root = document.documentElement;

  function read() {
    try {
      var t = localStorage.getItem(KEY);
      if (t === 'dark' || t === 'light') return t;
      // migrate the old SIP-only key once
      t = localStorage.getItem('sip-theme');
      localStorage.removeItem('sip-theme');
      if (t === 'dark' || t === 'light') { localStorage.setItem(KEY, t); return t; }
    } catch (e) {}
    return 'light';
  }

  function syncButtons() {
    var dark = root.dataset.theme === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.textContent = dark ? '☀' : '☾';
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      btn.setAttribute('aria-pressed', String(dark));
    });
  }

  function apply(theme) {
    root.dataset.theme = theme;
    syncButtons();
    // pages redraw canvas charts on this event
    window.dispatchEvent(new Event('zw-theme-change'));
  }

  root.dataset.theme = read();

  window.zwTheme = {
    get: function () { return root.dataset.theme; },
    set: function (theme) {
      try { localStorage.setItem(KEY, theme); } catch (e) {}
      apply(theme);
    },
    toggle: function () { this.set(root.dataset.theme === 'dark' ? 'light' : 'dark'); }
  };

  // keep other open tabs/pages in step
  window.addEventListener('storage', function (e) {
    if (e.key === KEY && (e.newValue === 'dark' || e.newValue === 'light')) apply(e.newValue);
  });
  // pages restored from the back/forward cache may hold a stale theme
  window.addEventListener('pageshow', function () {
    var t = read();
    if (t !== root.dataset.theme) apply(t); else syncButtons();
  });

  document.addEventListener('DOMContentLoaded', function () {
    syncButtons();
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-theme-toggle]')) window.zwTheme.toggle();
    });
  });
})();
