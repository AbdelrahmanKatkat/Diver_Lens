// runs before first paint so the page does not flash the wrong theme
try {
  var t = localStorage.getItem('dcl.theme');
  if (!t) t = window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
