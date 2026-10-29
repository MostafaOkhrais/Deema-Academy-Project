/* Applies the saved theme before first paint (loaded synchronously from <head>). */
try {
  var t = localStorage.getItem('deema-theme');
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
} catch (_) { /* storage unavailable */ }
