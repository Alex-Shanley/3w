(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('mobile-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (form && status) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const description = form.elements.description.value.trim();
      if (!name || !email || !description) {
        status.textContent = 'Please fill in your name, email and project description.';
        status.style.color = '#b3261e';
        return;
      }
      status.textContent = 'Thanks — we\'ll reply within one working day.';
      status.style.color = 'var(--slate)';
      form.reset();
    });
  }
})();
