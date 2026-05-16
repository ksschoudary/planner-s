// ========== DB: localStorage-based storage ==========
const DB = (() => {
  const KEY = 'plannerS_events_v2';

  function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function save(events) {
    localStorage.setItem(KEY, JSON.stringify(events));
  }

  function add(ev) {
    const events = getAll();
    ev.id = Date.now() + Math.random().toString(36).slice(2);
    ev.createdAt = new Date().toISOString();
    events.push(ev);
    save(events);

    // Handle recurring events — generate up to 2 years ahead
    if (ev.repeat && ev.repeat !== 'none') {
      generateRecurring(ev, events);
      save(events);
    }
    return ev;
  }

  function generateRecurring(baseEv, eventsArr) {
    const base = new Date(baseEv.date);
    const limit = new Date();
    limit.setFullYear(limit.getFullYear() + 2);
    let current = new Date(base);
    let count = 0;

    while (count < 200) {
      advance(current, baseEv.repeat);
      if (current > limit) break;
      const clone = { ...baseEv };
      clone.id = Date.now() + Math.random().toString(36).slice(2) + count;
      clone.date = current.toISOString().slice(0, 10);
      clone.parentId = baseEv.id;
      clone.isRecurring = true;
      eventsArr.push(clone);
      count++;
    }
  }

  function advance(d, repeat) {
    switch (repeat) {
      case 'daily':     d.setDate(d.getDate() + 1); break;
      case 'weekly':    d.setDate(d.getDate() + 7); break;
      case 'monthly':   d.setMonth(d.getMonth() + 1); break;
      case 'quarterly': d.setMonth(d.getMonth() + 3); break;
      case 'yearly':    d.setFullYear(d.getFullYear() + 1); break;
    }
  }

  function update(id, changes) {
    const events = getAll().map(e => e.id === id ? { ...e, ...changes } : e);
    save(events);
  }

  function remove(id) {
    save(getAll().filter(e => e.id !== id));
  }

  function getById(id) {
    return getAll().find(e => e.id === id);
  }

  function getForDate(dateStr) {
    return getAll().filter(e => e.date === dateStr);
  }

  function getForMonth(year, month) {
    // month is 1-based
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return getAll().filter(e => e.date && e.date.startsWith(prefix));
  }

  function getUpcoming(days) {
    const today = new Date(); today.setHours(0,0,0,0);
    const future = new Date(today); future.setDate(future.getDate() + days);
    return getAll().filter(e => {
      const d = new Date(e.date + 'T00:00:00');
      return d >= today && d <= future;
    }).sort((a,b) => a.date.localeCompare(b.date));
  }

  function getWithReminders() {
    const today = new Date(); today.setHours(0,0,0,0);
    return getAll().filter(e => {
      if (!e.reminder || e.reminder === '0') return false;
      const evDate = new Date(e.date + 'T00:00:00');
      const diff = Math.ceil((evDate - today) / 864e5);
      return diff >= 0 && diff <= parseInt(e.reminder);
    });
  }

  function getByCategory(cat) {
    if (!cat || cat === 'all') return getAll();
    return getAll().filter(e => e.category === cat);
  }

  return { getAll, add, update, remove, getById, getForDate, getForMonth, getUpcoming, getWithReminders, getByCategory };
})();
