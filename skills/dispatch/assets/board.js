const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
const search = document.querySelector('input[type="search"]');
let selected = 0;
function filter() {
  const query = search.value.trim().toLocaleLowerCase();
  let shown = 0;
  panels.forEach((panel, index) => {
    let visible = 0;
    panel.querySelectorAll('.issue').forEach(card => {
      card.hidden = !card.dataset.search.includes(query);
      if (!card.hidden) visible++;
    });
    panel.querySelector('.empty').hidden = visible > 0;
    if (index === selected) shown = visible;
  });
  document.querySelector('.filter-status').textContent = query
    ? `${shown} matching ${shown === 1 ? 'issue' : 'issues'} in ${tabs[selected].dataset.label}. Section totals include all saved issues.`
    : '';
}
function show(index, focus = false) {
  selected = index;
  tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
  });
  panels.forEach((panel, i) => { panel.hidden = i !== index; });
  filter();
  if (focus) tabs[index].focus();
}
document.querySelectorAll('[data-target]').forEach(button => {
  button.addEventListener('click', () => show(Number(button.dataset.target), true));
});
search.addEventListener('input', filter);
document.querySelector('[role="tablist"]').addEventListener('keydown', event => {
  const offsets = { ArrowRight: 1, ArrowLeft: -1 };
  if (event.key in offsets) show((selected + offsets[event.key] + tabs.length) % tabs.length, true);
  else if (event.key === 'Home') show(0, true);
  else if (event.key === 'End') show(tabs.length - 1, true);
  else return;
  event.preventDefault();
});
show(0);
