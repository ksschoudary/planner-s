// ========== REMINDERS ==========
const Reminders = (() => {
  function render() {
    const container = document.getElementById('remindersList');
    container.innerHTML = '';

    const today = new Date(); today.setHours(0,0,0,0);
    let events = DB.getAll()
      .filter(e => e.reminder && e.reminder !== '0')
      .sort((a,b) => a.date.localeCompare(b.date));

    if (!events.length) {
      container.innerHTML = `<div class="empty-state"><div class="es-icon">🔔</div><div>No reminders set</div></div>`;
      return;
    }

    events.forEach(ev => {
      const evDate = new Date(ev.date + 'T00:00:00');
      const diff = Math.ceil((evDate - today) / 864e5);
      const color = getCatColor(ev.category);
      let daysLabel = diff < 0 ? `${Math.abs(diff)}d ago` : diff === 0 ? 'Today' : `in ${diff}d`;
      let urgency = diff >= 0 && diff <= parseInt(ev.reminder) ? 'var(--accent4)' : 'var(--text-faint)';

      const card = document.createElement('div');
      card.className = 'list-card';
      card.innerHTML = `
        <div class="list-card-icon" style="background:${color}22">${catEmoji(ev.category)}</div>
        <div class="list-card-info">
          <div class="list-card-title">${ev.title}</div>
          <div class="list-card-sub">${formatDate(ev.date)} · Remind ${ev.reminder}d before</div>
        </div>
        <div class="list-card-right">
          <span class="days-badge" style="color:${urgency}">${daysLabel}</span>
          <div style="display:flex;gap:4px;margin-top:4px">
            <button class="icon-btn" onclick="editEvent('${ev.id}')">✎</button>
            <button class="icon-btn del" onclick="deleteEvent('${ev.id}')">✕</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function formatDate(str) {
    if (!str) return '';
    return new Date(str + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  }

  return { render };
})();
