document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuToggle = document.getElementById('menuToggle');
  const sidebarClose = document.getElementById('sidebarClose');

  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    });
  }

  if (sidebarClose) {
    sidebarClose.addEventListener('click', function() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', function() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }
});
