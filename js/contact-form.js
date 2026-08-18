(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const success = document.getElementById('form-success');
  const status = document.getElementById('form-status');

  const validators = {
    name: (v) => v.trim().length > 0 || 'Enter your name.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email address.',
    description: (v) => v.trim().length > 0 || 'Tell us a little about the project.',
  };

  function fieldFor(input) {
    return input.closest('.field');
  }

  function validate(input) {
    const rule = validators[input.name];
    if (!rule) return true;
    const result = rule(input.value);
    const field = fieldFor(input);
    const errorEl = field.querySelector('.field-error');
    if (result === true) {
      field.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
      return true;
    }
    field.classList.add('has-error');
    input.setAttribute('aria-invalid', 'true');
    if (errorEl) errorEl.textContent = result;
    return false;
  }

  // Validate on blur, not on every keystroke — per the brief, errors
  // should appear once someone has finished with a field, not while
  // they're still typing into it.
  Object.keys(validators).forEach((name) => {
    const input = form.elements[name];
    if (input) input.addEventListener('blur', () => validate(input));
  });

  form.addEventListener('submit', (e) => {
    const allValid = Object.keys(validators)
      .map((name) => form.elements[name])
      .filter(Boolean)
      .map(validate)
      .every(Boolean);

    if (!allValid) {
      e.preventDefault();
      form.querySelector('.has-error input, .has-error textarea')?.focus();
      return;
    }

    // Progressive enhancement: fetch lets the success state replace the
    // form in place instead of navigating to _next. If fetch/JS isn't
    // available, the browser falls through to a normal POST + redirect —
    // still a complete, working submission either way.
    e.preventDefault();
    status.textContent = '';
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })
      .then((res) => {
        if (res.ok) {
          form.classList.add('is-submitted');
          success.classList.add('is-visible');
          success.setAttribute('tabindex', '-1');
          success.focus();
        } else {
          throw new Error('submit-failed');
        }
      })
      .catch(() => {
        status.textContent = "Something went wrong sending that — email us directly at hello@3w.studio and we'll pick it up from there.";
        submitBtn.disabled = false;
      });
  });
})();
