// ========== NOTES ==========
const Notes = (() => {
  function render() {
    const container = document.getElementById('notesList');
    container.innerHTML = '';
    const events = DB.getByCategory('note').sort((a,b) => b.createdAt.localeCompare(a.createdAt));

    if (!events.length) {
      container.innerHTML = `<div class="empty-state" style="grid-column:span 2"><div class="es-icon">📝</div><div>No notes yet</div></div>`;
      return;
    }

    events.forEach(ev => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.style.borderTop = `3px solid ${getCatColor('note')}`;
      card.innerHTML = `
        <div class="note-card-title">${ev.title}</div>
        ${ev.notes ? `<div class="note-card-body">${ev.notes}</div>` : ''}
        <div class="note-card-footer">
          <span>${formatShortDate(ev.date)}</span>
          <div style="display:flex;gap:4px">
            <button class="icon-btn" style="width:24px;height:24px;font-size:11px" onclick="editEvent('${ev.id}')">✎</button>
            <button class="icon-btn del" style="width:24px;height:24px;font-size:11px" onclick="deleteEvent('${ev.id}')">✕</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function formatShortDate(str) {
    if (!str) return '';
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
  }

  return { render };
})();
