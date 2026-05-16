// ========== CALENDAR ==========
const Calendar = (() => {
  let currentYear, currentMonth, selectedDate, activeFilter = 'all';

  function init() {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth() + 1; // 1-based
    selectedDate = now.toISOString().slice(0, 10);
    render();
    renderDayPreview(selectedDate);

    document.getElementById('prevMonth').addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 1) { currentMonth = 12; currentYear--; }
      render();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 12) { currentMonth = 1; currentYear++; }
      render();
    });
  }

  function setFilter(f) {
    activeFilter = f;
    render();
    renderDayPreview(selectedDate);
  }

  function render() {
    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
    document.getElementById('calMonthYear').textContent =
      `${monthNames[currentMonth-1]} ${currentYear}`;

    const grid = document.getElementById('calGrid');
    grid.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInPrev  = new Date(currentYear, currentMonth - 1, 0).getDate();

    const eventsThisMonth = DB.getForMonth(currentYear, currentMonth);
    const today = new Date().toISOString().slice(0, 10);

    // Build map: date string → events
    const evMap = {};
    eventsThisMonth.forEach(e => {
      if (activeFilter !== 'all' && e.category !== activeFilter) return;
      if (!evMap[e.date]) evMap[e.date] = [];
      evMap[e.date].push(e);
    });

    // Prev month padding
    for (let i = 0; i < firstDay; i++) {
      const day = daysInPrev - firstDay + i + 1;
      const d = createDayCell(currentYear, currentMonth - 1 || 12, day, evMap, today, true);
      grid.appendChild(d);
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = createDayCell(currentYear, currentMonth, d, evMap, today, false);
      grid.appendChild(cell);
    }

    // Next month padding
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    let nextDay = 1;
    for (let i = firstDay + daysInMonth; i < totalCells; i++, nextDay++) {
      const cell = createDayCell(currentYear, currentMonth + 1 > 12 ? 1 : currentMonth + 1, nextDay, evMap, today, true);
      grid.appendChild(cell);
    }
  }

  function createDayCell(year, month, day, evMap, today, otherMonth) {
    const adjustedYear = month < 1 ? year - 1 : month > 12 ? year + 1 : year;
    const adjustedMonth = month < 1 ? 12 : month > 12 ? 1 : month;
    const dateStr = `${adjustedYear}-${String(adjustedMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

    const cell = document.createElement('div');
    cell.className = 'cal-day';
    if (otherMonth) cell.classList.add('other-month');
    if (dateStr === today) cell.classList.add('today');
    if (dateStr === selectedDate) cell.classList.add('selected');

    const numEl = document.createElement('div');
    numEl.className = 'day-num';
    numEl.textContent = day;
    cell.appendChild(numEl);

    const events = evMap[dateStr] || [];
    if (events.length) {
      const evWrap = document.createElement('div');
      evWrap.className = 'day-events';
      const maxShow = 3;
      events.slice(0, maxShow).forEach(ev => {
        const dot = document.createElement('div');
        dot.className = `day-event-dot cat-${ev.category}`;
        dot.style.background = getCatColor(ev.category) + '33';
        dot.style.color = getCatColor(ev.category);
        dot.style.borderLeft = `2px solid ${getCatColor(ev.category)}`;
        dot.textContent = catEmoji(ev.category) + ' ' + ev.title;
        evWrap.appendChild(dot);
      });
      if (events.length > maxShow) {
        const more = document.createElement('div');
        more.className = 'day-event-dot more';
        more.textContent = `+${events.length - maxShow} more`;
        evWrap.appendChild(more);
      }
      cell.appendChild(evWrap);
    }

    cell.addEventListener('click', () => {
      document.querySelectorAll('.cal-day.selected').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      selectedDate = dateStr;
      renderDayPreview(dateStr);
    });

    return cell;
  }

  function renderDayPreview(dateStr) {
    const titleEl = document.getElementById('dayPreviewTitle');
    const listEl  = document.getElementById('dayPreviewList');
    const today   = new Date().toISOString().slice(0, 10);
    titleEl.textContent = dateStr === today ? "Today's Events" : formatDateLabel(dateStr);

    let events = DB.getForDate(dateStr);
    if (activeFilter !== 'all') events = events.filter(e => e.category === activeFilter);
    events.sort((a,b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

    listEl.innerHTML = '';
    if (!events.length) {
      listEl.innerHTML = '<div class="preview-empty">No events – tap a date or + to add</div>';
      return;
    }

    events.forEach(ev => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      item.style.borderLeftColor = getCatColor(ev.category);
      item.innerHTML = `
        <span class="preview-time">${ev.time || '--:--'}</span>
        <span style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${catEmoji(ev.category)} ${ev.title}</span>
        <button class="icon-btn" onclick="editEvent('${ev.id}')">✎</button>
        <button class="icon-btn del" onclick="deleteEvent('${ev.id}')">✕</button>
      `;
      listEl.appendChild(item);
    });
  }

  function formatDateLabel(str) {
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
  }

  function refresh() { render(); renderDayPreview(selectedDate); }

  return { init, render, setFilter, renderDayPreview, refresh };
})();

function getCatColor(cat) {
  const map = {
    event: '#7c6fff', bill: '#ff6b9d', note: '#43e3c5',
    meeting: '#ffb547', birthday: '#ff8c69', task: '#69d89d', holiday: '#6bb5ff'
  };
  return map[cat] || '#7c6fff';
}

function catEmoji(cat) {
  const map = {
    event:'📅', bill:'💸', note:'📝', meeting:'🤝',
    birthday:'🎂', task:'✅', holiday:'🏖️'
  };
  return map[cat] || '📅';
}
