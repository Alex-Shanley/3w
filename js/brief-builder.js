(() => {
  const form = document.getElementById('brief-builder');
  const summary = document.getElementById('brief-summary');
  if (!form || !summary) return;

  const boxes = Array.from(document.querySelectorAll('input[name="services"]'));
  if (!boxes.length) return;

  // The running count, so the band reads as a tally rather than a
  // sentence. It was a single line of muted text in a 542px band that
  // held 60px of content — the payoff for ticking eight things was
  // almost nothing to look at.
  const count = document.getElementById('brief-count');

  // The tally at the foot of the page sits 3,022px below the first
  // "Add to brief" button, so ticking a service gave you no sight of the
  // thing you had just changed. The pill itself says "Added", but not
  // how many. This bar carries the count with you, and only appears once
  // there is a count to carry.
  const bar = document.getElementById('brief-bar');
  const barCount = document.getElementById('bb-count');

  // The empty-state copy is authored in the HTML, so it survives with
  // JS off; hold on to it rather than duplicating the string here.
  const emptyText = summary.textContent;

  function list(names) {
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  function update() {
    const chosen = boxes.filter((b) => b.checked).map((b) => b.value);
    const tally = chosen.length
      ? `${chosen.length} of ${boxes.length} picked`
      : 'Nothing picked yet';
    if (count) count.textContent = tally;
    if (barCount) barCount.textContent = tally;
    if (bar) {
      bar.classList.toggle('is-open', chosen.length > 0);
      bar.setAttribute('aria-hidden', chosen.length ? 'false' : 'true');
    }
    summary.textContent = chosen.length ? `${list(chosen)}.` : emptyText;
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
