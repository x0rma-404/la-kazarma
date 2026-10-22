/* ─── main.js — La Kazarma ─────────────────────────────── */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ── Flash message auto-dismiss ──────────────────────────────────
  const flashes = document.querySelectorAll('.flash');
  flashes.forEach(el => {
    // Close button
    const closeBtn = el.querySelector('.flash-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => dismissFlash(el));
    }
    // Auto-dismiss after 5s
    setTimeout(() => dismissFlash(el), 5000);
  });

  function dismissFlash(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    el.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => el.remove(), 300);
  }

  // ── Sidebar toggle ──────────────────────────────────────────────
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger-btn');

  function openSidebar() {
    sidebar && sidebar.classList.add('open');
    overlay && overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar && sidebar.classList.remove('open');
    overlay && overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburger && hamburger.addEventListener('click', () => {
    sidebar && sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  overlay && overlay.addEventListener('click', closeSidebar);

  // ── Active nav link detection ───────────────────────────────────
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar-nav a, .mobile-bottom-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (currentPath === href || (href !== '/' && currentPath.startsWith(href)))) {
      link.classList.add('active');
    }
  });

  // ── Confirm dialogs for destructive actions ─────────────────────
  document.querySelectorAll('[data-confirm]').forEach(el => {
    el.addEventListener('click', e => {
      const msg = el.getAttribute('data-confirm') || 'Are you sure?';
      if (!confirm(msg)) e.preventDefault();
    });
  });

  // ── Password strength indicator ─────────────────────────────────
  const pwdInput = document.getElementById('password');
  const strengthBar = document.getElementById('strength-bar');
  const strengthLabel = document.getElementById('strength-label');

  if (pwdInput && strengthBar) {
    pwdInput.addEventListener('input', () => {
      const val = pwdInput.value;
      let score = 0;
      if (val.length >= 8)  score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      strengthBar.className = 'password-strength-bar';
      const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
      const classes = ['', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong'];

      if (val.length === 0) {
        strengthBar.style.width = '0';
        if (strengthLabel) strengthLabel.textContent = '';
      } else {
        strengthBar.classList.add(classes[score]);
        if (strengthLabel) strengthLabel.textContent = labels[score];
      }
    });
  }

  // ── Admin AJAX actions ──────────────────────────────────────────
  document.querySelectorAll('[data-admin-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.adminAction;
      const userId = btn.dataset.userId;
      const codeId = btn.dataset.codeId;

      let url, method = 'POST';

      if (action === 'approve')         url = `/admin/users/${userId}/approve`;
      else if (action === 'reject')     url = `/admin/users/${userId}/reject`;
      else if (action === 'suspend')    url = `/admin/users/${userId}/suspend`;
      else if (action === 'reactivate') url = `/admin/users/${userId}/reactivate`;
      else if (action === 'gen-code')   url = `/admin/invitation-codes`;
      else if (action === 'deactivate-code') url = `/admin/invitation-codes/${codeId}/deactivate`;

      if (!url) return;

      try {
        const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' } });
        const data = await resp.json();

        if (data.success) {
          if (action === 'gen-code') {
            appendNewCode(data.code);
          } else {
            window.location.reload();
          }
        } else {
          alert(data.error || 'Action failed.');
        }
      } catch (err) {
        alert('Network error. Please try again.');
        console.error(err);
      }
    });
  });

  function appendNewCode(code) {
    const tbody = document.getElementById('inv-codes-tbody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${code.code}</code></td>
      <td>Just now</td>
      <td>—</td>
      <td>—</td>
      <td><span class="badge badge-approved">Active</span></td>
      <td>
        <button class="btn btn-sm btn-danger" data-admin-action="deactivate-code" data-code-id="${code.id}">Deactivate</button>
      </td>`;
    tbody.prepend(tr);
    // Re-bind the new button
    tr.querySelector('[data-admin-action]').addEventListener('click', async function() {
      const resp = await fetch(`/admin/invitation-codes/${code.id}/deactivate`, { method: 'POST' });
      const data = await resp.json();
      if (data.success) window.location.reload();
    });
  }

  // ── Admin tab switching ─────────────────────────────────────────
  const tabBtns = document.querySelectorAll('[data-tab]');
  const tabPanels = document.querySelectorAll('[data-tab-panel]');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      const panel = document.querySelector(`[data-tab-panel="${target}"]`);
      if (panel) panel.classList.remove('hidden');
    });
  });

  // Activate first tab by default
  if (tabBtns.length > 0) tabBtns[0].click();

});
