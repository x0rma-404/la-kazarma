/* sidebar.js — La Kazarma — dedicated sidebar logic */
'use strict';

(function() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');

  if (!sidebar) return;

  // Mark active links on load
  const path = window.location.pathname;
  sidebar.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (href && href !== '/' && path.startsWith(href))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Expose open/close globally so main.js can call them
  window.KazarmaSidebar = {
    open() {
      sidebar.classList.add('open');
      overlay && overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    },
    close() {
      sidebar.classList.remove('open');
      overlay && overlay.classList.remove('active');
      document.body.style.overflow = '';
    },
    toggle() {
      sidebar.classList.contains('open') ? this.close() : this.open();
    }
  };

  // Close on overlay click
  overlay && overlay.addEventListener('click', () => window.KazarmaSidebar.close());

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') window.KazarmaSidebar.close();
  });
})();
