(() => {
  const form = document.getElementById('brief-builder');
  const summary = document.getElementById('brief-summary');
  if (!form || !summary) return;

  const boxes = Array.from(document.querySelectorAll('input[name="services"]'));
  if (!boxes.length) return;

  // The empty-state copy is authored in the HTML, so it survives with
  // JS off; hold on to it rather than duplicating the string here.
  const emptyText = summary.textContent;

  function list(names) {
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  function update() {
    const chosen = boxes.filter((b) => b.checked).map((b) => b.value);
    summary.textContent = chosen.length
      ? `${chosen.length} selected: ${list(chosen)}.`
      : emptyText;
  }

  boxes.forEach((b) => b.addEventListener('change', update));

  // Fold the selection into the same `brief` param the estimator uses,
  // so contact-form.js has one prefill path to support rather than two.
  // Done on submit (not per-change) because the individual `services`
  // checkboxes would otherwise also ride along in the query string and
  // duplicate what `brief` already says.
  form.addEventListener('submit', (e) => {
    const chosen = boxes.filter((b) => b.checked).map((b) => b.value);
    if (!chosen.length) return; // let it submit bare; contact page still loads

    e.preventDefault();
    const params = new URLSearchParams({
      brief: `Interested in: ${list(chosen)}.`,
    });
    window.location.href = `contact.html?${params.toString()}`;
  });

  update();
})();
