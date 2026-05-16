// ========== APP ==========

let currentTab = 'Calendar';
let activeFilter = 'all';

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  // Register SW
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Seed sample data on first launch
  if (!localStorage.getItem('plannerS_seeded')) {
    seedSampleData();
    localStorage.setItem('plannerS_seeded', '1');
  }

  Calendar.init();
  renderTicker();
  setupNavigation();
  setupFilters();
  checkReminders();
});

// ---- NAVIGATION ----
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  currentTab = tab;

  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`tab${tab}`).classList.add('active');

  // Show/hide filter row (only on Calendar & Agenda)
  document.getElementById('filterRow').style.display = (tab === 'Calendar' || tab === 'Agenda') ? 'flex' : 'none';

  // Render relevant tab
  if (tab === 'Agenda')    Agenda.render();
  if (tab === 'Notes')     Notes.render();
  if (tab === 'Reminders') Reminders.render();
  if (tab === 'Bills')     Bills.render();
  if (tab === 'Calendar')  Calendar.refresh();
}

// ---- FILTERS ----
function setupFilters() {
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      Calendar.setFilter(activeFilter);
      if (currentTab === 'Agenda') Agenda.setFilter(activeFilter);
    });
  });
}

// ---- TICKER ----
function renderTicker() {
  const today    = new Date().toISOString().slice(0,10);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  const tomStr   = tomorrow.toISOString().slice(0,10);

  const todayEvs = DB.getForDate(today);
  const tomEvs   = DB.getForDate(tomStr);

  let items = [];
  todayEvs.forEach(e => items.push(`${catEmoji(e.category)} ${e.time ? e.time+' · ' : ''}${e.title}`));
  if (tomEvs.length) {
    items.push('|');
    tomEvs.forEach(e => items.push(`Tomorrow · ${catEmoji(e.category)} ${e.title}`));
  }
  if (!items.length) items = ['No events today – enjoy your day ✨'];

  const ticker = document.getElementById('tickerContent');
  ticker.textContent = items.join('   ·   ');

  // re-render every 60s
  setTimeout(renderTicker, 60000);
}

// ---- REMINDERS POPUP ----
function checkReminders() {
  const events = DB.getWithReminders();
  if (!events.length) return;

  const list = document.getElementById('reminderList');
  list.innerHTML = '';
  const today = new Date(); today.setHours(0,0,0,0);

  events.forEach(ev => {
    const evDate = new Date(ev.date + 'T00:00:00');
    const diff = Math.ceil((evDate - today) / 864e5);
    const item = document.createElement('div');
    item.className = 'reminder-popup-item';
    item.innerHTML = `
      <span style="font-size:20px">${catEmoji(ev.category)}</span>
      <span class="ri-title">${ev.title}</span>
      <span class="ri-days">${diff === 0 ? 'Today!' : diff === 1 ? 'Tomorrow' : `in ${diff}d`}</span>
    `;
    list.appendChild(item);
  });

  document.getElementById('reminderPopup').classList.remove('hidden');
}

function closeReminderPopup() {
  document.getElementById('reminderPopup').classList.add('hidden');
}

// ---- EVENT MODAL ----
function openEventModal(defaultCat) {
  document.getElementById('editId').value = '';
  document.getElementById('modalTitle').textContent = 'New Event';
  document.getElementById('evTitle').value = '';
  document.getElementById('evDate').value = new Date().toISOString().slice(0,10);
  document.getElementById('evTime').value = '';
  document.getElementById('evCategory').value = defaultCat || 'event';
  document.getElementById('evLocation').value = '';
  document.getElementById('evReminder').value = '0';
  document.getElementById('evRepeat').value = 'none';
  document.getElementById('evAmount').value = '';
  document.getElementById('evNotes').value = '';
  document.getElementById('eventModal').classList.remove('hidden');
}

function closeEventModal() {
  document.getElementById('eventModal').classList.add('hidden');
}

function saveEvent() {
  const title = document.getElementById('evTitle').value.trim();
  const date  = document.getElementById('evDate').value;
  if (!title) { alert('Please enter a title'); return; }
  if (!date)  { alert('Please select a date'); return; }

  const ev = {
    title,
    date,
    time:     document.getElementById('evTime').value,
    category: document.getElementById('evCategory').value,
    location: document.getElementById('evLocation').value.trim(),
    reminder: document.getElementById('evReminder').value,
    repeat:   document.getElementById('evRepeat').value,
    amount:   document.getElementById('evAmount').value,
    notes:    document.getElementById('evNotes').value.trim()
  };

  const editId = document.getElementById('editId').value;
  if (editId) {
    DB.update(editId, ev);
  } else {
    DB.add(ev);
  }

  closeEventModal();
  refreshAll();
}

function editEvent(id) {
  const ev = DB.getById(id);
  if (!ev) return;
  document.getElementById('editId').value       = ev.id;
  document.getElementById('modalTitle').textContent = 'Edit Event';
  document.getElementById('evTitle').value      = ev.title;
  document.getElementById('evDate').value       = ev.date;
  document.getElementById('evTime').value       = ev.time || '';
  document.getElementById('evCategory').value   = ev.category;
  document.getElementById('evLocation').value   = ev.location || '';
  document.getElementById('evReminder').value   = ev.reminder || '0';
  document.getElementById('evRepeat').value     = ev.repeat || 'none';
  document.getElementById('evAmount').value     = ev.amount || '';
  document.getElementById('evNotes').value      = ev.notes || '';
  document.getElementById('eventModal').classList.remove('hidden');
}

function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  DB.remove(id);
  refreshAll();
}

function refreshAll() {
  Calendar.refresh();
  renderTicker();
  if (currentTab === 'Agenda')    Agenda.render();
  if (currentTab === 'Notes')     Notes.render();
  if (currentTab === 'Reminders') Reminders.render();
  if (currentTab === 'Bills')     Bills.render();
}

// ---- SEED DATA ----
function seedSampleData() {
  const today  = new Date();
  const fmt    = d => d.toISOString().slice(0,10);
  const offset = n => { const d = new Date(today); d.setDate(d.getDate()+n); return fmt(d); };

  const samples = [
    { title:'Team Standup', date: offset(0), time:'09:30', category:'meeting', reminder:'1', repeat:'daily' },
    { title:'Electricity Bill', date: offset(3), category:'bill', amount:'2400', reminder:'3', repeat:'monthly' },
    { title:'Mum\'s Birthday 🎂', date: offset(5), category:'birthday', reminder:'7', repeat:'yearly' },
    { title:'Dentist Appointment', date: offset(2), time:'11:00', category:'event', location:'City Dental Clinic', reminder:'2' },
    { title:'Launch Plan Q3', date: offset(7), category:'task', notes:'Prepare slides and deck' },
    { title:'Diwali', date: offset(14), category:'holiday', reminder:'5' },
    { title:'Project ideas', date: fmt(today), category:'note', notes:'Consider adding AI features to the planning workflow. Explore API integrations.' },
    { title:'Netflix Subscription', date: offset(10), category:'bill', amount:'649', repeat:'monthly', reminder:'3' },
  ];

  samples.forEach(s => DB.add({ repeat: 'none', reminder: '0', ...s }));
}
