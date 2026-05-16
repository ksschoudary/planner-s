// ========== BILLS ==========
const Bills = (() => {
  function render() {
    const container = document.getElementById('billsList');
    const summary   = document.getElementById('billsSummary');
    container.innerHTML = '';

    const bills = DB.getByCategory('bill').sort((a,b) => a.date.localeCompare(b.date));
    const today  = new Date(); today.setHours(0,0,0,0);

    // Summary totals
    const thisMonth = bills.filter(b => {
      const d = new Date(b.date + 'T00:00:00');
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const totalMonth = thisMonth.reduce((s,b) => s + (parseFloat(b.amount)||0), 0);
    const upcoming   = bills.filter(b => {
      const d = new Date(b.date + 'T00:00:00');
      return d >= today;
    });
    const totalUpcoming = upcoming.reduce((s,b) => s + (parseFloat(b.amount)||0), 0);

    summary.innerHTML = `
      <span>This month: <strong>₹${totalMonth.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></span>
      <span>Upcoming: <strong>₹${totalUpcoming.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></span>
    `;

    if (!bills.length) {
      container.innerHTML = `<div class="empty-state"><div class="es-icon">💸</div><div>No bills yet</div></div>`;
      return;
    }

    bills.forEach(ev => {
      const evDate = new Date(ev.date + 'T00:00:00');
      const diff   = Math.ceil((evDate - today) / 864e5);
      const isPast = diff < 0;

      const card = document.createElement('div');
      card.className = 'list-card';
      card.style.opacity = isPast ? '0.6' : '1';
      card.innerHTML = `
        <div class="list-card-icon" style="background:rgba(255,107,157,0.15)">💸</div>
        <div class="list-card-info">
          <div class="list-card-title">${ev.title}</div>
          <div class="list-card-sub">
            ${formatDate(ev.date)}
            ${ev.repeat && ev.repeat !== 'none' ? `· 🔁 ${ev.repeat}` : ''}
            ${isPast ? '· <span style="color:var(--accent2)">Overdue</span>' : ''}
          </div>
        </div>
        <div class="list-card-right">
          ${ev.amount ? `<div class="bill-amount">₹${parseFloat(ev.amount).toLocaleString('en-IN',{minimumFractionDigits:2})}</div>` : ''}
          ${!isPast && diff >= 0 && diff <= 7 ? `<span class="days-badge">Due in ${diff}d</span>` : ''}
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

// ========== CSV EXPORT ==========
function exportCSV() {
  const events = DB.getAll();
  const headers = ['Title','Date','Time','Category','Location','Amount','Reminder','Repeat','Notes','CreatedAt'];
  const rows = events.map(e => [
    `"${(e.title||'').replace(/"/g,'""')}"`,
    e.date||'',
    e.time||'',
    e.category||'',
    `"${(e.location||'').replace(/"/g,'""')}"`,
    e.amount||'',
    e.reminder||'',
    e.repeat||'',
    `"${(e.notes||'').replace(/"/g,'""')}"`,
    e.createdAt||''
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `PlannerS_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
