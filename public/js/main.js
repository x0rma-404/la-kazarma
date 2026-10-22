// Tab switching
document.addEventListener('DOMContentLoaded', function() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      const target = this.dataset.tab;
      tabs.forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
      this.classList.add('active');
      const content = document.getElementById('tab-' + target);
      if (content) content.classList.add('active');
    });
  });

  // Auto-dismiss flash messages
  const flashes = document.querySelectorAll('.flash');
  flashes.forEach(function(f) {
    setTimeout(function() {
      f.style.transition = 'opacity 0.5s, transform 0.5s';
      f.style.opacity = '0';
      f.style.transform = 'translateY(-10px)';
      setTimeout(function() { f.remove(); }, 500);
    }, 4000);
  });
});
