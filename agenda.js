// ========== AGENDA ==========
const Agenda = (() => {
  let activeFilter = 'all';

  function setFilter(f) { activeFilter = f; render(); }

  function render() {
    const container = document.getElementById('agendaList');
    container.innerHTML = '';

    let events = DB.getAll();
    if (activeFilter !== 'all') events = events.filter(e => e.category === activeFilter);
    events.sort((a,b) => a.date.localeCompare(b.date) || (a.time||'').localeCompare(b.time||''));

    // Group by date
    const groups = {};
    events.forEach(ev => {
      if (!groups[ev.date]) groups[ev.date] = [];
      groups[ev.date].push(ev);
    });

    const today = new Date().toISOString().slice(0,10);
    const sortedDates = Object.keys(groups).sort();

    if (!sortedDates.length) {
      container.innerHTML = `<div class="empty-state"><div class="es-icon">☰</div><div>No events yet – tap + to add</div></div>`;
      return;
    }

    sortedDates.forEach(dateStr => {
      const group = document.createElement('div');
      group.className = 'agenda-day-group';

      const label = document.createElement('div');
      label.className = 'agenda-day-label';
      label.textContent = formatAgendaDate(dateStr, today);
      group.appendChild(label);

      groups[dateStr].forEach(ev => {
        group.appendChild(createAgendaItem(ev));
      });

      container.appendChild(group);
    });
  }

  function createAgendaItem(ev) {
    const item = document.createElement('div');
    item.className = 'agenda-item';
    const color = getCatColor(ev.category);
    item.innerHTML = `
      <div class="agenda-cat-bar" style="background:${color}"></div>
      <div class="agenda-info">
        <div class="agenda-title">${catEmoji(ev.category)} ${ev.title}</div>
        <div class="agenda-meta">
          ${ev.time ? `<span>⏰ ${ev.time}</span>` : ''}
          ${ev.location ? `<span>📍 ${ev.location}</span>` : ''}
          ${ev.repeat && ev.repeat !== 'none' ? `<span>🔁 ${ev.repeat}</span>` : ''}
          ${ev.amount ? `<span>₹${parseFloat(ev.amount).toLocaleString('en-IN')}</span>` : ''}
        </div>
      </div>
      <div class="agenda-actions">
        <button class="icon-btn" onclick="editEvent('${ev.id}')">✎</button>
        <button class="icon-btn del" onclick="deleteEvent('${ev.id}')">✕</button>
      </div>
    `;
    return item;
  }

  function formatAgendaDate(str, today) {
    if (str === today) return '📌 Today';
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    if (str === tomorrow.toISOString().slice(0,10)) return '⏩ Tomorrow';
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric', year:'numeric' });
  }

  return { render, setFilter };
})();
