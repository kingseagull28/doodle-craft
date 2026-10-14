/* Workshop of Wonders - interface. Reads all rules from WOW.Engine / WOW.Data.
   Text is always inserted with textContent (never innerHTML) so saved/imported data cannot inject markup. */
(function (W) {
  'use strict';
  const D = W.Data, E = W.Engine, Icons = W.Icons, Snd = W.Audio;
  let st, store;
  const ui = { tab: 'grid', bagTab: 'bag', bagSearch: '', take: 8, selected: null, bookCat: 'all', bookSearch: '', bookItem: null, bookMode: 'all',
    overlay: null, overlayReturn: null, celebrations: [], celebrating: false, saveTimer: null, lastBookCount: 0, tutStep: 0 };
  const $ = function (s, r) { return (r || document).querySelector(s); };

  // ---------- tiny DOM helper (safe text only) ----------
  function h(tag, attrs) {
    const el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'style') el.setAttribute('style', v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (let i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) { if (c === null || c === undefined || c === false) return; if (Array.isArray(c)) c.forEach(function (x) { add(el, x); }); else el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c); }
  function icon(id, cls) { const it = D.items[id]; return h('img', { class: 'px' + (cls ? ' ' + cls : ''), src: it ? Icons.toDataURL(it.icon, id) : '', alt: '', draggable: 'false' }); }
  function name(id) { return D.items[id] ? D.items[id].name : id; }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

  // ---------- saving ----------
  function memoryStorage() { const m = {}; return { getItem: function (k) { return k in m ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; } }; }
  function pickStorage() { try { const t = '__wow_test'; localStorage.setItem(t, '1'); localStorage.removeItem(t); return { s: localStorage, persistent: true }; } catch (e) { return { s: memoryStorage(), persistent: false }; } }
  let persistent = true;
  function scheduleSave() {
    setSaveText('Saving...');
    clearTimeout(ui.saveTimer);
    ui.saveTimer = setTimeout(saveNow, 250);
  }
  function saveNow() {
    clearTimeout(ui.saveTimer);
    const r = store.save(st);
    setSaveText(!r.ok ? 'Not saved' : persistent ? 'Saved' : 'Saved for now');
  }
  function setSaveText(t) { const el = $('#saveStatus'); if (el) el.textContent = t; }

  // ---------- feedback, toasts, floaters ----------
  let fb = { text: 'Tap an item in your bag, then tap a square on the table.', kind: '', actions: [] };
  function feedback(text, kind, actions) { fb = { text: text, kind: kind || '', actions: actions || [] }; renderFeedback(); }
  function renderFeedback() {
    const el = $('#feedback'); if (!el) return;
    clear(el); el.className = 'feedback' + (fb.kind ? ' ' + fb.kind : '');
    el.appendChild(h('span', { class: 'fbtext', 'data-mark': fb.kind === 'good' ? '\u2714' : fb.kind === 'warn' ? '\u2728' : '' , text: fb.text }));
    if (fb.actions.length) el.appendChild(h('span', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, fb.actions.map(function (a) { return h('button', { class: 'btn small ' + (a.cls || ''), onclick: a.fn, text: a.label }); })));
  }
  let toastTimer = null;
  function toast(text) {
    let t = $('#toast'); if (!t) { t = h('div', { id: 'toast', class: 'toast', role: 'status' }); document.body.appendChild(t); }
    t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function floater(text, el) {
    if (!el || reduceMotion()) return;
    const r = el.getBoundingClientRect();
    const f = h('div', { class: 'floater', text: text, style: 'left:' + (r.left + r.width / 2 - 14) + 'px;top:' + (r.top) + 'px' });
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 820);
  }
  function reduceMotion() { return document.documentElement.classList.contains('reduce-motion') || (!document.documentElement.classList.contains('full-motion') && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  // ---------- top bar & dock ----------
  function tierQuests(t) { return D.quests.filter(function (q) { return q.tier === t && !q.optional; }); }
  function renderTop() {
    const tier = D.tiers[st.tier];
    const main = tierQuests(st.tier);
    const done = main.filter(function (q) { return st.quests[q.id]; }).length;
    const milestone = main.find(function (q) { return q.milestone; });
    const p = $('#progress'); clear(p);
    const pct = Math.round(100 * done / Math.max(1, main.length));
    const stats = E.discoveryStats(st);
    p.appendChild(h('div', { class: 'row' }, h('span', { text: 'Tier ' + st.tier + ': ' + tier.name }), h('span', { text: stats.items + ' of ' + stats.totalItems + ' found', style: 'margin-left:auto;font-weight:600' })));
    p.appendChild(h('div', { class: 'bar', role: 'progressbar', 'aria-label': 'Tier progress', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) }, h('i', { style: 'width:' + pct + '%' })));
    const next = milestone && !st.quests[milestone.id] ? 'Next big goal: ' + milestone.name : (st.sandboxUnlocked ? 'Everything unlocked! Try Creative Sandbox.' : 'Tier complete!');
    p.appendChild(h('div', { class: 'row', style: 'font-weight:600;font-size:14px;margin-top:2px' }, h('span', { text: next })));
    const ms = $('#modeSwitch'); clear(ms); ms.hidden = !st.sandboxUnlocked;
    if (st.sandboxUnlocked) {
      ms.appendChild(h('button', { 'aria-pressed': String(st.mode === 'adventure'), onclick: function () { setMode('adventure'); }, text: 'Adventure' }));
      ms.appendChild(h('button', { 'aria-pressed': String(st.mode === 'sandbox'), onclick: function () { setMode('sandbox'); }, text: 'Creative' }));
    }
    const sb = $('#soundBtn'); sb.setAttribute('aria-pressed', String(st.settings.sound)); sb.title = st.settings.sound ? 'Sound is on' : 'Sound is off';
    $('#soundLabel').textContent = st.settings.sound ? 'Sound on' : 'Sound off';
    const banner = $('#banner'); banner.hidden = st.mode !== 'sandbox';
    const qb = $('#questBadge'); const n = E.activeQuests(st).length; qb.textContent = String(n); qb.hidden = !n;
  }
  function setMode(m) {
    const r = E.setMode(st, m);
    if (!r.ok) { toast(r.message); return; }
    ui.selected = null; ui.tab = 'grid';
    feedback(m === 'sandbox' ? 'Creative Sandbox: every item is free in the Supply Crate. Your adventure is safe.' : 'Back to your adventure!', 'good');
    scheduleSave(); render();
  }

  // ---------- workshop strip ----------
  const SHELF = ['crafting_table', 'furnace', 'chest', 'barrel', 'workshop_shelf', 'smithing_table', 'anvil', 'cauldron', 'lantern', 'composter', 'beehive', 'bookshelf', 'jukebox', 'note_block', 'crafter', 'brewing_stand', 'enchanting_table', 'moon_lantern', 'seeing_sphere', 'disco_ball', 'beacon', 'wonder_engine'];
  function renderWorkshop() {
    const doors = $('#doors'); clear(doors);
    D.biomes.forEach(function (b) {
      const open = st.biomes.indexOf(b.id) >= 0;
      doors.appendChild(h('button', { class: 'door' + (open ? '' : ' locked'), style: 'background:' + b.color, 'aria-label': b.name + (open ? ', open' : ', locked'), onclick: function () { openMap(b.id); } },
        icon(b.icon), h('span', { text: open ? b.name.split(' ').slice(-1)[0] : '???' }), open ? null : h('span', { class: 'lock', text: 'Locked' })));
    });
    const shelf = $('#shelf'); clear(shelf);
    const got = SHELF.filter(function (id) { return st.crafted[id]; });
    if (!got.length) shelf.appendChild(h('span', { class: 'empty', text: 'Your shelf is empty. Things you build will show up here!' }));
    got.forEach(function (id) { shelf.appendChild(h('span', { title: name(id) }, icon(id), h('span', { class: 'sr', text: name(id) }))); });
  }

  // ---------- bench ----------
  const STATIONS = [
    { key: 'grid', label: 'Crafting', item: 'crafting_table' },
    { key: 'smelting', label: 'Furnace', item: 'furnace' },
    { key: 'brewing', label: 'Brewing', item: 'brewing_stand' },
    { key: 'smithing', label: 'Smithing', item: 'smithing_table' }
  ];
  function renderBench() {
    const tabs = $('#benchTabs'); clear(tabs);
    STATIONS.forEach(function (s) {
      const unlocked = s.key === 'grid' || E.hasStation(st, s.key);
      tabs.appendChild(h('button', { class: 'tab' + (unlocked ? '' : ' locked'), role: 'tab', 'aria-selected': String(ui.tab === s.key), 'aria-label': s.label + (unlocked ? '' : ' (locked)'),
        onclick: function () { ui.tab = s.key; renderBench(); } }, icon(s.item), h('span', { text: s.label })));
    });
    const body = $('#benchBody'); clear(body);
    if (ui.tab === 'grid') renderGrid(body); else renderStation(body, ui.tab);
    renderHolding(); renderFeedback();
  }
  function slotEl(id, attrs) {
    const el = h('button', Object.assign({ class: 'slot' }, attrs));
    if (id) { el.appendChild(icon(id)); el.setAttribute('aria-label', (attrs['aria-label'] || '') + name(id)); }
    return el;
  }
  function renderGrid(body) {
    const size = E.gridSize(st), cells = E.gridCells(st);
    const g = h('div', { class: 'grid s' + size, role: 'group', 'aria-label': 'Crafting grid ' + size + ' by ' + size });
    cells.forEach(function (id, i) {
      const s = slotEl(id, { 'data-drop': 'grid', 'data-slot': String(i), 'data-drag': id ? 'grid' : null, 'aria-label': 'Grid square ' + (i + 1) + ': ' + (id ? '' : 'empty') });
      if (ui.selected && !id) s.classList.add('ready');
      s.addEventListener('click', function () { if (dragGuard()) return; gridTap(i); });
      g.appendChild(s);
    });
    const r = E.match(cells, size);
    const out = h('button', { class: 'slot output' + (r ? ' ready' : ''), id: 'outputSlot', 'aria-label': r ? 'Collect ' + r.output.quantity + ' ' + r.name : 'Result: nothing yet', onclick: function () { if (dragGuard()) return; collect(); } });
    if (r) { out.appendChild(icon(r.output.itemId)); if (r.output.quantity > 1) out.appendChild(h('span', { class: 'qty', text: String(r.output.quantity) })); }
    const known = r && st.discoveredRecipes[r.id];
    body.appendChild(h('div', { class: 'craftrow' }, g, h('span', { class: 'arrow' + (r ? ' lit' : ''), 'aria-hidden': 'true', text: '\u279C' }),
      h('div', { class: 'outwrap' }, out, h('div', { class: 'outname', text: r ? (known ? r.name : r.name + '!') : (size === 2 ? '2 by 2 table' : '3 by 3 table') }))));
    const btns = h('div', { class: 'benchbtns' });
    btns.appendChild(h('button', { class: 'btn go', disabled: !r, onclick: collect, text: 'Collect' }));
    btns.appendChild(h('button', { class: 'btn', disabled: !E.ws(st).grid.some(Boolean), onclick: function () { E.clearGrid(st); Snd.play('remove'); afterGridChange(); }, text: 'Clear' }));
    const ws = E.ws(st);
    btns.appendChild(h('button', { class: 'btn', disabled: !ws.lastLayout || ws.grid.some(Boolean), onclick: repeatCraft, text: 'Make again' }));
    body.appendChild(btns);
  }
  function stationSlot(method, key, label) {
    const id = E.ws(st).stations[method][key];
    const s = slotEl(id, { 'data-drop': 'station', 'data-method': method, 'data-key': key, 'data-drag': id ? 'station' : null, 'aria-label': label + ': ' + (id ? '' : 'empty') });
    if (ui.selected && !id) s.classList.add('ready');
    s.addEventListener('click', function () { if (dragGuard()) return; stationTap(method, key); });
    return h('div', { class: 'slotbox' }, s, h('span', { text: label }));
  }
  function renderStation(body, method) {
    const def = STATIONS.find(function (s) { return s.key === method; });
    if (!E.hasStation(st, method)) {
      body.appendChild(h('div', { class: 'locknote' }, icon(def.item), h('p', { text: 'Craft a ' + name(def.item) + ' to use this station.' }),
        h('button', { class: 'btn', onclick: function () { openBook(def.item); }, text: 'How do I make one?' })));
      return;
    }
    const ws = E.ws(st), s = ws.stations[method];
    const r = E.stationMatch(st, method);
    const row = h('div', { class: 'stationrow' });
    if (method === 'smelting') {
      const fire = h('div', { class: 'flame' + (s.heat > 0 || s.fuel ? ' on' : ''), 'aria-hidden': 'true' }, h('i'));
      row.appendChild(h('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:6px' }, stationSlot('smelting', 'input', 'To cook'), fire, stationSlot('smelting', 'fuel', 'Fuel')));
    } else if (method === 'brewing') {
      row.appendChild(stationSlot('brewing', 'ingredient', 'Ingredient'));
      row.appendChild(stationSlot('brewing', 'base', 'Bottle'));
    } else {
      row.appendChild(stationSlot('smithing', 'template', 'Template'));
      row.appendChild(stationSlot('smithing', 'base', 'Gear'));
      row.appendChild(stationSlot('smithing', 'addition', 'Material'));
    }
    row.appendChild(h('span', { class: 'arrow' + (r ? ' lit' : ''), 'aria-hidden': 'true', text: '\u279C' }));
    const out = h('div', { class: 'slot output' + (r ? ' ready' : ''), 'aria-hidden': 'true' });
    if (r) out.appendChild(icon(r.output.itemId));
    row.appendChild(h('div', { class: 'outwrap' }, out, h('div', { class: 'outname', text: r ? r.name : 'Nothing yet' })));
    body.appendChild(row);
    if (method === 'smelting') body.appendChild(h('p', { class: 'heat', style: 'text-align:center', text: st.mode === 'sandbox' ? 'Creative mode: no fuel needed.' : 'Fire left: ' + Math.floor(s.heat / 4) + ' item' + (Math.floor(s.heat / 4) === 1 ? '' : 's') + '. One coal cooks 8 things.' }));
    const verb = method === 'smelting' ? 'Smelt' : method === 'brewing' ? 'Brew' : 'Upgrade';
    body.appendChild(h('div', { class: 'benchbtns' },
      h('button', { class: 'btn go', disabled: !r, onclick: function () { runStation(method); }, text: r ? verb + ' ' + r.name : verb }),
      h('button', { class: 'btn', onclick: function () { Object.keys(s).forEach(function (k) { if (k !== 'heat') E.removeFromStation(st, method, k); }); Snd.play('remove'); scheduleSave(); renderBench(); renderBag(); }, text: 'Empty' })));
  }
  function renderHolding() {
    const el = $('#holding'); clear(el);
    if (!ui.selected) { el.hidden = true; return; }
    el.hidden = false;
    const n = E.count(st, ui.selected);
    el.appendChild(icon(ui.selected));
    el.appendChild(h('span', { class: 'grow' }, h('span', { text: name(ui.selected) + ' x' + n + '.' }), h('span', { class: 'hint', text: ' Tap a square to place it.' })));
    el.appendChild(h('button', { class: 'btn small', 'aria-label': 'About ' + name(ui.selected), onclick: function () { openBook(ui.selected); }, text: 'Info' }));
    el.appendChild(h('button', { class: 'btn small', 'aria-label': 'Put down ' + name(ui.selected), onclick: function () { select(null); }, text: 'Put down' }));
  }

  // ---------- actions ----------
  function select(id) {
    ui.selected = ui.selected === id ? null : id;
    if (ui.selected) Snd.play('pick');
    renderBench(); renderBag();
  }
  function gridTap(i) {
    const ws = E.ws(st), cur = ws.grid[i];
    if (ui.selected) {
      if (cur === ui.selected) { E.removeFromGrid(st, i); Snd.play('remove'); afterGridChange(); return; }
      const r = E.placeInGrid(st, ui.selected, i);
      if (!r.ok) { needMore(r); return; }
      Snd.play('place'); afterGridChange(i);
      if (!E.count(st, ui.selected)) { ui.selected = null; renderBench(); renderBag(); }
      return;
    }
    if (cur) { E.removeFromGrid(st, i); Snd.play('remove'); afterGridChange(); }
    else feedback('Pick something from your bag first, then tap this square.', '');
  }
  function needMore(r) {
    Snd.play('fail');
    const id = r.need;
    if (id && E.isResourceAvailable(st, id)) feedback(r.message, 'warn', [{ label: 'Get 8 more', cls: 'gold', fn: function () { E.replenish(st, id, 8); Snd.play('supply'); feedback('Got 8 ' + name(id) + '.', 'good'); scheduleSave(); renderBag(); renderBench(); } }]);
    else feedback(r.message || 'That did not work.', 'warn');
  }
  function afterGridChange(popSlot) {
    const size = E.gridSize(st), cells = E.gridCells(st);
    const r = E.match(cells, size);
    if (r) feedback(st.discoveredRecipes[r.id] ? 'Ready! Tap the big square to collect ' + r.output.quantity + ' ' + r.name + '.' : 'Something new is ready! Tap the big square to collect it.', 'good');
    else if (cells.some(Boolean)) {
      const a = E.analyze(cells, size, st);
      if (!st.settings.hints) feedback('No recipe yet. Keep experimenting!', '');
      else if (a.kind === 'station') feedback(a.message, 'warn', E.hasStation(st, a.recipe.method) ? [{ label: 'Go to ' + (a.recipe.method === 'smelting' ? 'Furnace' : a.recipe.method === 'brewing' ? 'Brewing' : 'Smithing'), fn: function () { E.clearGrid(st); ui.tab = a.recipe.method; renderBench(); renderBag(); } }] : []);
      else feedback(a.message, a.kind === 'none' ? '' : 'warn');
    } else feedback('Tap an item in your bag, then tap a square on the table.', '');
    scheduleSave(); renderBench(); renderBag();
    if (popSlot !== undefined) { const s = document.querySelector('[data-drop="grid"][data-slot="' + popSlot + '"]'); if (s) s.classList.add('pop'); }
  }
  let collecting = false;
  function collect() {
    if (collecting) return; // one collect per tap even with overlapping events
    collecting = true;
    try {
      const outEl = $('#outputSlot');
      const r = E.collect(st);
      if (!r.ok) { Snd.play('fail'); if (outEl) { outEl.classList.remove('shake'); void outEl.offsetWidth; outEl.classList.add('shake'); } return; }
      st.stats.experiments++;
      Snd.play('craft');
      floater('+' + r.output.quantity, outEl);
      handleCraftResult(r);
      feedback('You made ' + r.output.quantity + ' ' + r.recipe.name + '!', 'good');
      scheduleSave(); render();
    } finally { setTimeout(function () { collecting = false; }, 120); }
  }
  function repeatCraft() {
    const r = E.repeat(st);
    if (!r.ok) {
      Snd.play('fail');
      const canGet = r.missing && r.missing.every(function (id) { return E.isResourceAvailable(st, id); });
      feedback(r.message, 'warn', canGet ? [{ label: 'Get more and refill', cls: 'gold', fn: function () { r.missing.forEach(function (id) { E.replenish(st, id, 8); }); Snd.play('supply'); repeatCraft(); } }] : []);
      return;
    }
    Snd.play('place'); afterGridChange();
  }
  function stationTap(method, key) {
    const s = E.ws(st).stations[method];
    if (ui.selected) {
      if (s[key] === ui.selected) { E.removeFromStation(st, method, key); Snd.play('remove'); }
      else { const r = E.placeInStation(st, method, key, ui.selected); if (!r.ok) { needMore(r); return; } Snd.play('place'); if (!E.count(st, ui.selected)) ui.selected = null; }
    } else if (s[key]) { E.removeFromStation(st, method, key); Snd.play('remove'); }
    else { feedback('Pick something from your bag first.', ''); return; }
    stationFeedback(method); scheduleSave(); renderBench(); renderBag();
  }
  function stationFeedback(method) {
    const r = E.stationMatch(st, method);
    if (r) feedback('Ready to make ' + r.name + '!', 'good');
    else feedback(method === 'smelting' ? 'Put something to cook on top and fuel underneath.' : method === 'brewing' ? 'Put a bottle and an ingredient in.' : 'Put a template, a piece of gear and a material in.', '');
  }
  function runStation(method) {
    const prev = Object.assign({}, E.ws(st).stations[method]);
    const r = E.runStation(st, method);
    if (!r.ok) {
      Snd.play('fail');
      if (r.needFuel) { const fuel = ['coal', 'charcoal', 'oak_planks'].find(function (f) { return E.count(st, f) > 0; }); feedback(r.message, 'warn', fuel ? [{ label: 'Add ' + name(fuel), fn: function () { E.placeInStation(st, 'smelting', 'fuel', fuel); renderBench(); renderBag(); runStation(method); } }] : []); }
      else feedback(r.message, 'warn');
      return;
    }
    Snd.play(method === 'smelting' ? 'smelt' : 'craft');
    E.refillStation(st, method, prev);
    handleCraftResult(r);
    feedback('You made ' + r.recipe.name + '!', 'good');
    scheduleSave(); render();
  }
  function handleCraftResult(r) {
    ui.flash = r.output.itemId; if (ui.bagTab !== 'bag') ui.bagTab = 'bag';
    if (r.firstItem) queueCelebration({ type: 'item', item: r.output.itemId, recipe: r.recipe });
    r.quests.forEach(function (q) { Snd.play('quest'); toast('Quest complete: ' + q.name); });
    r.unlocks.forEach(function (u) { queueCelebration(Object.assign({ type: 'unlock' }, u)); });
  }

  // ---------- bag and supply ----------
  function renderBag() {
    const tabs = $('#bagTabs'); clear(tabs);
    [['bag', 'My Bag', 'chest'], ['supply', 'Supply Crate', 'barrel']].forEach(function (t) {
      tabs.appendChild(h('button', { class: 'tab', role: 'tab', 'aria-selected': String(ui.bagTab === t[0]), onclick: function () { ui.bagTab = t[0]; renderBag(); } }, icon(t[2]), h('span', { text: t[1] })));
    });
    const tools = $('#bagTools'); clear(tools);
    const search = h('input', { class: 'search', type: 'search', placeholder: 'Find an item', 'aria-label': 'Find an item', value: ui.bagSearch });
    search.addEventListener('input', function () { ui.bagSearch = search.value; renderBagItems(); });
    tools.appendChild(search);
    if (ui.bagTab === 'bag') tools.appendChild(h('button', { class: 'btn small', onclick: function () { E.sortInventory(st); scheduleSave(); renderBagItems(); toast('Bag sorted!'); }, text: 'Sort' }));
    else {
      const amt = h('div', { class: 'amount', role: 'group', 'aria-label': 'How many to take' });
      [1, 8, 64].forEach(function (n) { amt.appendChild(h('button', { 'aria-pressed': String(ui.take === n), onclick: function () { ui.take = n; renderBag(); }, text: 'x' + n })); });
      tools.appendChild(amt);
    }
    renderBagItems();
  }
  function renderBagItems() {
    const box = $('#items'); clear(box);
    const q = ui.bagSearch.trim().toLowerCase();
    const filt = function (id) { return !q || name(id).toLowerCase().indexOf(q) >= 0 || D.items[id].tags.some(function (t) { return t.indexOf(q) >= 0; }); };
    if (ui.bagTab === 'bag') {
      const ids = E.invList(st).filter(filt);
      if (!ids.length) box.appendChild(h('p', { class: 'empty-msg', text: q ? 'Nothing matches.' : 'Your bag is empty. Visit the Supply Crate!' }));
      let lastCat = null;
      const sorted = isSorted(ids);
      ids.forEach(function (id) {
        if (sorted && D.items[id].category !== lastCat) { lastCat = D.items[id].category; box.appendChild(h('div', { class: 'groupname', text: catName(lastCat) })); }
        const n = E.count(st, id);
        const el = h('button', { class: 'slot' + (ui.selected === id ? ' selected' : ''), 'data-drag': 'bag', 'data-id': id, 'aria-pressed': String(ui.selected === id), 'aria-label': name(id) + ', ' + n, title: name(id) + ': ' + D.items[id].description },
          icon(id), h('span', { class: 'qty', text: String(n) }), h('span', { class: 'lbl', text: shortName(id) }));
        el.addEventListener('click', function () { if (dragGuard()) return; select(id); });
        if (ui.flash === id) el.classList.add('pop');
        box.appendChild(el);
      });
      if (ui.flash) {
        const f = box.querySelector('[data-id="' + ui.flash + '"]');
        if (f) { // reveal the new item inside the bag without scrolling the page
          if (box.scrollWidth > box.clientWidth) box.scrollLeft = Math.max(0, f.offsetLeft - box.clientWidth / 2 + f.offsetWidth / 2);
          else if (box.scrollHeight > box.clientHeight) box.scrollTop = Math.max(0, f.offsetTop - box.clientHeight / 2);
        }
        ui.flash = null;
      }
    } else {
      const ids = E.supplyList(st).filter(filt);
      ids.forEach(function (id) {
        const el = h('button', { class: 'slot crate', 'aria-label': 'Take ' + ui.take + ' ' + name(id), title: name(id) + ': ' + D.items[id].description },
          icon(id), h('span', { class: 'plus', text: '+' + ui.take }), h('span', { class: 'lbl', text: shortName(id) }));
        el.addEventListener('click', function () {
          const r = E.replenish(st, id, ui.take);
          if (r.ok) { Snd.play('supply'); floater('+' + ui.take, el); feedback('Got ' + ui.take + ' ' + name(id) + '. They are in your bag.', 'good'); scheduleSave(); renderTop(); renderBench(); }
        });
        box.appendChild(el);
      });
      const locked = D.itemOrder.filter(function (id) { return D.items[id].resource && !E.isResourceAvailable(st, id); }).length;
      if (locked && st.mode !== 'sandbox') box.appendChild(h('p', { class: 'empty-msg', text: locked + ' more supplies unlock as you open new areas.' }));
    }
  }
  function isSorted(ids) {
    const order = {}; D.categories.forEach(function (c, i) { order[c[0]] = i; });
    for (let i = 1; i < ids.length; i++) if (order[D.items[ids[i]].category] < order[D.items[ids[i - 1]].category]) return false;
    return ids.length > 6;
  }
  function shortName(id) { const n = name(id); return n.length > 14 ? n.slice(0, 13) + '\u2026' : n; }
  function catName(c) { const x = D.categories.find(function (k) { return k[0] === c; }); return x ? x[1] : c; }

  // ---------- quests ----------
  function questCards() {
    const frag = h('div');
    const act = E.activeQuests(st);
    const main = act.filter(function (q) { return !q.optional; }), opt = act.filter(function (q) { return q.optional; });
    if (!main.length && !opt.length) frag.appendChild(h('p', { text: 'All quests done! You are a master crafter.' }));
    main.forEach(function (q, i) { frag.appendChild(questCard(q, i === 0)); });
    if (opt.length) { frag.appendChild(h('div', { class: 'qsection', text: 'Bonus challenges' })); opt.forEach(function (q) { frag.appendChild(questCard(q, false)); }); }
    const doneN = Object.keys(st.quests).length;
    frag.appendChild(h('div', { class: 'qsection', text: doneN + ' of ' + D.quests.length + ' quests complete' }));
    return frag;
  }
  function questCard(q, isMain) {
    const p = E.questProgress(st, q);
    const card = h('div', { class: 'qcard' + (isMain ? ' main' : '') });
    card.appendChild(h('h3', null, q.milestone ? h('span', { 'aria-hidden': 'true', text: '\u2605' }) : null, h('span', { text: q.name })));
    card.appendChild(h('p', { text: q.description }));
    const targets = q.conditions.craft || (q.conditions.craftAny || []).filter(function (x) { return !E.isTag(x); });
    if (targets.length) {
      const row = h('div', { class: 'qtargets' });
      targets.slice(0, 8).forEach(function (id) {
        const done = !!st.crafted[id], known = !!st.discoveredItems[id];
        row.appendChild(h('button', { class: 'qtarget' + (done ? ' done' : ''), 'aria-label': (known ? name(id) : 'Mystery item') + (done ? ', done' : ''), title: known ? name(id) : 'Mystery item', onclick: function () { openBook(id); } }, icon(id)));
      });
      card.appendChild(row);
    }
    card.appendChild(h('div', { class: 'qbar', role: 'progressbar', 'aria-label': q.name + ' progress', 'aria-valuenow': String(p.done), 'aria-valuemin': '0', 'aria-valuemax': String(p.need) }, h('i', { style: 'width:' + Math.round(100 * p.done / p.need) + '%' })));
    const rw = q.rewards, bits = [];
    if (rw.grid3) bits.push('Reward: the big 3 by 3 grid');
    if (rw.biome) bits.push('Reward: opens ' + D.biomes.find(function (b) { return b.id === rw.biome; }).name);
    if (rw.sandbox) bits.push('Reward: Creative Sandbox');
    if (bits.length) card.appendChild(h('p', { style: 'margin:6px 0 0;font-size:14px;font-weight:700', text: bits.join('. ') }));
    return card;
  }
  function renderQuests() { const el = $('#questList'); clear(el); el.appendChild(questCards()); }

  // ---------- overlays ----------
  function openOverlay(build, opts) {
    closeOverlay(true);
    ui.overlayReturn = document.activeElement;
    const ov = h('div', { class: 'overlay', id: 'overlay', onclick: function (e) { if (e.target === ov && !(opts && opts.modal)) closeOverlay(); } });
    const dlg = h('div', { class: 'panel dialog ' + ((opts && opts.cls) || ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dlgTitle' });
    ov.appendChild(dlg);
    document.body.appendChild(ov);
    ui.overlay = { build: build, opts: opts || {}, el: dlg };
    build(dlg);
    const f = dlg.querySelector('[data-autofocus]') || dlg.querySelector('button, input, [tabindex]');
    if (f) f.focus();
  }
  function rebuildOverlay() { if (!ui.overlay) return; const sc = ui.overlay.el.querySelector('.body'); const top = sc ? sc.scrollTop : 0; clear(ui.overlay.el); ui.overlay.build(ui.overlay.el); const sc2 = ui.overlay.el.querySelector('.body'); if (sc2) sc2.scrollTop = top; }
  function closeOverlay(silent) {
    const ov = $('#overlay'); if (ov) ov.remove();
    const had = !!ui.overlay; ui.overlay = null;
    if (had && !silent && ui.overlayReturn && ui.overlayReturn.focus) ui.overlayReturn.focus();
  }
  function header(title, extra) {
    return h('header', null, h('h2', { id: 'dlgTitle', text: title }), extra || null, h('button', { class: 'btn small', 'aria-label': 'Close', onclick: function () { closeOverlay(); }, text: 'Close' }));
  }

  // ----- book -----
  function openBook(itemId) { ui.bookItem = itemId || null; openOverlay(buildBook, { cls: 'book' }); }
  function bookVisible(id) {
    const it = D.items[id];
    if (st.discoveredItems[id]) return 'known';
    if (st.mode === 'sandbox') return 'mystery';
    if (it.secret || it.resource) return null;
    if (it.tier <= st.tier && (E.index.byOutput[id] || []).length) return 'mystery';
    return null;
  }
  function buildBook(dlg) {
    if (ui.bookItem) { buildDetail(dlg, ui.bookItem); return; }
    const stats = E.discoveryStats(st);
    dlg.appendChild(header('Discovery Book'));
    const body = h('div', { class: 'body' });
    const secrets = (E.index.tagMembers.secret || []);
    body.appendChild(h('div', { class: 'stats' },
      h('span', { class: 'chip', text: stats.items + ' / ' + stats.totalItems + ' items' }),
      h('span', { class: 'chip', text: stats.recipes + ' / ' + stats.totalRecipes + ' recipes' }),
      h('span', { class: 'chip', text: secrets.filter(function (s) { return st.discoveredItems[s]; }).length + ' / ' + secrets.length + ' secrets' })));
    const search = h('input', { class: 'search', type: 'search', placeholder: 'Search the book', 'aria-label': 'Search the book', value: ui.bookSearch, style: 'width:100%;margin-top:10px' });
    search.addEventListener('input', function () { ui.bookSearch = search.value; renderEntries(); });
    body.appendChild(search);
    const modes = h('div', { class: 'filters', role: 'group', 'aria-label': 'Show' });
    [['all', 'Found and mysteries'], ['known', 'Found only'], ['mystery', 'Mysteries only']].forEach(function (m) {
      modes.appendChild(h('button', { 'aria-pressed': String(ui.bookMode === m[0]), onclick: function () { ui.bookMode = m[0]; rebuildOverlay(); }, text: m[1] }));
    });
    body.appendChild(modes);
    const cats = h('div', { class: 'filters', role: 'group', 'aria-label': 'Category' });
    [['all', 'Everything']].concat(D.categories).forEach(function (c) {
      cats.appendChild(h('button', { 'aria-pressed': String(ui.bookCat === c[0]), onclick: function () { ui.bookCat = c[0]; rebuildOverlay(); }, text: c[1] }));
    });
    body.appendChild(cats);
    const list = h('div', { class: 'cat', id: 'bookList' });
    body.appendChild(list);
    const later = h('p', { id: 'bookLater', style: 'font-weight:700' });
    body.appendChild(later);
    dlg.appendChild(body);
    function renderEntries() {
      clear(list);
      const q = ui.bookSearch.trim().toLowerCase();
      let hiddenLater = 0, shown = 0;
      D.itemOrder.forEach(function (id) {
        const vis = bookVisible(id), it = D.items[id];
        if (!vis) { if (!st.discoveredItems[id] && !it.secret) hiddenLater++; return; }
        if (ui.bookCat !== 'all' && it.category !== ui.bookCat) return;
        if (ui.bookMode !== 'all' && ui.bookMode !== vis) return;
        if (q && (vis !== 'known' || (it.name.toLowerCase().indexOf(q) < 0 && !it.tags.some(function (t) { return t.indexOf(q) >= 0; })))) return;
        shown++;
        list.appendChild(h('button', { class: 'entry' + (vis === 'mystery' ? ' mystery' : ''), 'aria-label': vis === 'known' ? it.name : 'Mystery item', onclick: function () { ui.bookItem = id; rebuildOverlay(); } },
          icon(id), h('span', { text: vis === 'known' ? it.name : '???' })));
      });
      if (!shown) list.appendChild(h('p', { class: 'empty-msg', text: q ? 'Nothing found. Mystery items only show their name once you discover them.' : 'Nothing here yet. Keep crafting!' }));
      later.textContent = hiddenLater ? hiddenLater + ' more items are waiting in tiers you have not reached yet.' : '';
    }
    renderEntries();
  }
  function patternGrid(r, mini) {
    const w = r.type === 'shaped' ? 3 : 3;
    const g = h('div', { class: 'grid s3' + (mini ? ' mini' : ''), 'aria-label': 'Recipe pattern' });
    const cells = new Array(9).fill(null);
    if (r.type === 'shaped') r.pattern.forEach(function (row, y) { row.forEach(function (ing, x) { cells[y * w + x] = ing; }); });
    else r.list.forEach(function (ing, i) { cells[i] = ing; });
    cells.forEach(function (ing) {
      const shown = ing ? (E.isTag(ing) ? E.tagItems(ing)[0] : ing) : null;
      const s = h('div', { class: 'slot', title: ing ? E.ingredientName(ing) : '' });
      if (shown) s.appendChild(icon(shown));
      if (ing && E.isTag(ing)) s.appendChild(h('span', { class: 'lbl', text: 'any' }));
      g.appendChild(s);
    });
    return g;
  }
  function recipeView(r, withButton) {
    const box = h('div', { class: 'recipebox' });
    const methodName = { crafting_grid: r.type === 'shaped' ? 'Crafting grid, this exact shape' : 'Crafting grid, any order', smelting: 'Furnace', brewing: 'Brewing Stand', smithing: 'Smithing Table' }[r.method];
    if (r.method === 'crafting_grid') box.appendChild(patternGrid(r, true));
    else {
      const ings = r.method === 'smelting' ? [r.input, '#coals'] : r.method === 'brewing' ? [r.base, r.ingredient] : [r.template, r.base, r.addition];
      box.appendChild(h('div', { class: 'grid mini', style: 'grid-template-columns:repeat(' + ings.length + ',40px)' }, ings.map(function (ing) { const s = h('div', { class: 'slot', title: E.ingredientName(ing) }); s.appendChild(icon(E.isTag(ing) ? E.tagItems(ing)[0] : ing)); return s; })));
    }
    box.appendChild(h('span', { class: 'arrow', 'aria-hidden': 'true', text: '\u279C' }));
    box.appendChild(h('div', { class: 'slot mini', style: '--cell:48px' }, icon(r.output.itemId), r.output.quantity > 1 ? h('span', { class: 'qty', text: String(r.output.quantity) }) : null));
    const info = h('div', { style: 'flex:1;min-width:180px' },
      h('div', { style: 'font-weight:700', text: methodName }),
      h('div', { style: 'font-size:14px', text: 'Needs: ' + r.ingredients.map(function (i) { return i.quantity + ' ' + E.ingredientName(i.itemId); }).join(', ') + '. Makes ' + r.output.quantity + '.' }),
      h('div', { style: 'margin-top:4px' }, h('span', { class: 'chip ' + (r.sourceType === 'original_extension' ? 'orig' : 'van'), text: r.sourceType === 'original_extension' ? 'Original recipe' : 'Minecraft-style recipe' })),
      r.note ? h('div', { style: 'font-size:14px;margin-top:4px', text: r.note }) : null);
    box.appendChild(info);
    if (withButton) box.appendChild(h('button', { class: 'btn go small', onclick: function () { putOnTable(r); }, text: r.method === 'crafting_grid' ? 'Put on the table' : 'Put in the ' + (r.method === 'smelting' ? 'Furnace' : r.method === 'brewing' ? 'Brewing Stand' : 'Smithing Table') }));
    return box;
  }
  function putOnTable(r) {
    const res = E.autofill(st, r.id);
    if (!res.ok) {
      const canGet = res.missing && res.missing.every(function (id) { return E.isResourceAvailable(st, id); });
      if (canGet) { res.missing.forEach(function (id) { E.replenish(st, id, 8); }); const again = E.autofill(st, r.id); if (again.ok) toast('Got missing supplies from the crate.'); else { toast(again.message); return; } }
      else { toast(res.message); return; }
    }
    ui.tab = r.method === 'crafting_grid' ? 'grid' : r.method; ui.selected = null;
    closeOverlay(); Snd.play('place');
    if (r.method === 'crafting_grid') afterGridChange(); else { stationFeedback(r.method); scheduleSave(); render(); }
  }
  function buildDetail(dlg, id) {
    const it = D.items[id], vis = bookVisible(id) || (st.discoveredItems[id] ? 'known' : 'mystery');
    const known = vis === 'known';
    dlg.appendChild(header(known ? it.name : 'Mystery item', h('button', { class: 'btn small', onclick: function () { ui.bookItem = null; rebuildOverlay(); }, text: 'Back' })));
    const body = h('div', { class: 'body' });
    const left = h('div', { class: 'big' + (known ? '' : ' mystery') }, icon(id));
    const right = h('div');
    if (known) {
      right.appendChild(h('h3', { text: it.name }));
      right.appendChild(h('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px' },
        h('span', { class: 'chip', text: catName(it.category) }), h('span', { class: 'chip', text: 'Tier ' + it.tier }),
        h('span', { class: 'chip ' + (it.isOriginalContent ? 'orig' : 'van'), text: it.isOriginalContent ? 'Original to this game' : 'Minecraft-style item' }),
        h('span', { class: 'chip', text: 'In bag: ' + E.count(st, id) })));
      right.appendChild(h('p', { text: it.description }));
      if (it.resource) {
        const b = D.biomes.find(function (x) { return x.resources.indexOf(id) >= 0; });
        right.appendChild(h('p', { style: 'font-weight:700', text: 'Get it from the Supply Crate. It comes from the ' + b.name + '.' }));
      }
      const recs = E.knownRecipesFor(st, id);
      if (recs.length) { right.appendChild(h('h4', { text: 'How to make it' })); recs.forEach(function (r) { right.appendChild(recipeView(r, true)); }); }
      const allRecs = E.index.byOutput[id] || [];
      const unknownWays = allRecs.filter(function (r) { return recs.indexOf(r) < 0; }).length;
      if (unknownWays) right.appendChild(h('p', { style: 'font-weight:700', text: unknownWays === 1 ? 'There is one more way to make this. Keep experimenting!' : 'There are ' + unknownWays + ' more ways to make this. Keep experimenting!' }));
    } else {
      right.appendChild(h('h3', { text: 'Mystery item' }));
      right.appendChild(h('p', { text: 'You have not discovered this yet. Can you figure out how to make it?' }));
      right.appendChild(hintLadder(id));
    }
    // uses
    const usedIn = (E.index.usedIn[id] || []).map(function (rid) { return E.index.byId[rid]; });
    if (known && usedIn.length) {
      right.appendChild(h('h4', { text: 'Used to make' }));
      const outs = {}; usedIn.forEach(function (r) { outs[r.output.itemId] = true; });
      const ids = Object.keys(outs);
      const shown = ids.filter(function (o) { return st.discoveredItems[o]; });
      const row = h('div', { class: 'uses' });
      shown.slice(0, 40).forEach(function (o) { row.appendChild(h('button', { onclick: function () { ui.bookItem = o; rebuildOverlay(); } }, icon(o), h('span', { text: name(o) }))); });
      right.appendChild(row);
      const myst = ids.length - shown.length;
      if (myst) right.appendChild(h('p', { text: myst === 1 ? 'It is also part of 1 thing you have not found yet.' : 'It is also part of ' + myst + ' things you have not found yet.' }));
    }
    const qs = D.quests.filter(function (q) { return !st.quests[q.id] && ((q.conditions.craft || []).indexOf(id) >= 0 || (q.conditions.craftAny || []).indexOf(id) >= 0); });
    if (qs.length) right.appendChild(h('p', { style: 'font-weight:700', text: 'Needed for quest: ' + qs.map(function (q) { return q.name; }).join(', ') + '.' }));
    body.appendChild(h('div', { class: 'detail' }, left, right));
    dlg.appendChild(body);
  }
  function hintLadder(id) {
    const box = h('div', { class: 'hintbox' });
    if (!st.settings.hints) { box.appendChild(h('p', { text: 'Hints are turned off. You can turn them on in Settings.' })); return box; }
    const recs = (E.index.byOutput[id] || []).filter(function (r) { return !r.secret; }).sort(function (a, b) { return a.tier - b.tier; });
    if (!recs.length) { box.appendChild(h('p', { text: 'This one is a secret. Keep experimenting!' })); return box; }
    const r = recs[0];
    const lvl = st.hintLevels[id] || 0;
    box.appendChild(h('strong', { text: 'Hints' }));
    const ol = h('ol');
    for (let i = 0; i < lvl; i++) ol.appendChild(h('li', { text: r.hints[i] }));
    if (lvl) box.appendChild(ol);
    if (lvl >= 3) {
      box.appendChild(h('p', { style: 'font-weight:700', text: 'It is called ' + name(id) + '.' }));
      box.appendChild(recipeView(r, false));
    }
    if (lvl < 3) box.appendChild(h('button', { class: 'btn gold small', onclick: function () { st.hintLevels[id] = lvl + 1; scheduleSave(); rebuildOverlay(); }, text: lvl === 0 ? 'Show a small hint' : lvl === 1 ? 'Show a bigger hint' : 'Show me the answer' }));
    return box;
  }

  // ----- map -----
  function openMap(focus) { openOverlay(function (dlg) { buildMap(dlg, focus); }); }
  function buildMap(dlg) {
    dlg.appendChild(header('Workshop Map'));
    const body = h('div', { class: 'body' });
    body.appendChild(h('p', { text: 'Finish big goals to open new areas. Each area adds new supplies to your Supply Crate.' }));
    const grid = h('div', { class: 'biomes' });
    D.biomes.forEach(function (b) {
      const open = st.biomes.indexOf(b.id) >= 0;
      const q = D.quests.find(function (x) { return x.rewards.biome === b.id; });
      grid.appendChild(h('div', { class: 'biome' + (open ? '' : ' locked'), style: 'background:' + b.color },
        h('h3', null, icon(b.icon), h('span', { text: b.name })),
        h('div', { text: open ? b.blurb : (q ? 'Opens with the quest "' + q.name + '".' : 'Open from the start.') }),
        h('div', { style: 'font-weight:700;margin-top:4px', text: 'Tier ' + b.tier + (open ? ', open' : ', locked') }),
        h('div', { class: 'res' }, b.resources.slice(0, 24).map(function (id) { const im = icon(id); im.title = open ? name(id) : '???'; return im; }))));
    });
    body.appendChild(grid);
    dlg.appendChild(body);
  }

  // ----- quests overlay (narrow screens) -----
  function openQuests() { openOverlay(function (dlg) { dlg.appendChild(header('Quests')); const b = h('div', { class: 'body' }); b.appendChild(questCards()); dlg.appendChild(b); }, { cls: 'narrow' }); }

  // ----- settings -----
  function sw(label, checked, fn, desc) {
    const b = h('button', { class: 'switch', role: 'switch', 'aria-checked': String(checked), 'aria-label': label, onclick: function () { fn(!checked); } });
    return h('div', { class: 'setrow' }, h('div', null, h('strong', { text: label }), desc ? h('div', { style: 'font-size:14px', text: desc }) : null), b);
  }
  function applySettings() {
    Snd.setSfx(st.settings.sound);
    if (st.settings.music) { if (!Snd.setMusic(true)) { st.settings.music = false; } } else Snd.setMusic(false);
    const root = document.documentElement;
    root.classList.toggle('reduce-motion', st.settings.motion === 'reduce');
    root.classList.toggle('full-motion', st.settings.motion === 'full');
  }
  function openSettings() {
    openOverlay(function (dlg) {
      dlg.appendChild(header('Settings'));
      const b = h('div', { class: 'body' });
      b.appendChild(sw('Sound effects', st.settings.sound, function (v) { st.settings.sound = v; applySettings(); Snd.play('craft'); saveNow(); renderTop(); rebuildOverlay(); }, Snd.available() ? 'Little clicks and chimes.' : 'Sound is not available in this browser.'));
      b.appendChild(sw('Music', st.settings.music, function (v) { st.settings.music = v; applySettings(); saveNow(); rebuildOverlay(); }, 'A gentle music box tune.'));
      b.appendChild(sw('Hints', st.settings.hints, function (v) { st.settings.hints = v; saveNow(); rebuildOverlay(); afterGridChange(); }, 'Helpful tips when a mix does not work, and hints in the book.'));
      const motion = h('div', { class: 'amount', role: 'group', 'aria-label': 'Motion' });
      [['auto', 'Auto'], ['reduce', 'Less'], ['full', 'Full']].forEach(function (m) { motion.appendChild(h('button', { 'aria-pressed': String(st.settings.motion === m[0]), onclick: function () { st.settings.motion = m[0]; applySettings(); saveNow(); rebuildOverlay(); }, text: m[1] })); });
      b.appendChild(h('div', { class: 'setrow' }, h('div', null, h('strong', { text: 'Animations' }), h('div', { style: 'font-size:14px', text: 'Auto follows your device setting.' })), motion));
      b.appendChild(h('div', { class: 'setrow' }, h('div', null, h('strong', { text: 'Save file' }), h('div', { style: 'font-size:14px', text: 'Make a backup or move your game to another device.' })),
        h('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, h('button', { class: 'btn small', onclick: exportSave, text: 'Export save' }), h('button', { class: 'btn small', onclick: importSave, text: 'Import save' }))));
      b.appendChild(h('div', { class: 'setrow' }, h('div', null, h('strong', { text: 'Tutorial' })), h('button', { class: 'btn small', onclick: function () { ui.tutStep = 0; openTutorial(); }, text: 'Show tutorial' })));
      b.appendChild(h('div', { class: 'setrow' }, h('div', null, h('strong', { text: 'Start over' }), h('div', { style: 'font-size:14px', text: 'Erases all progress on this device.' })), h('button', { class: 'btn danger small', onclick: confirmReset, text: 'Reset progress' })));
      if (!persistent) b.appendChild(h('p', { style: 'font-weight:700', text: 'This browser is blocking saved games, so progress lasts until you close the page. Use Export save to keep it.' }));
      b.appendChild(h('p', { style: 'font-size:13px', text: 'Workshop of Wonders ' + E.GAME_VERSION + '. Recipes reference ' + D.referenceVersion + '. Not affiliated with Mojang or Microsoft.' }));
      dlg.appendChild(b);
    }, { cls: 'narrow' });
  }
  function confirmDialog(title, text, yesLabel, onYes, danger) {
    openOverlay(function (dlg) {
      dlg.appendChild(header(title));
      dlg.appendChild(h('div', { class: 'body' }, h('p', { style: 'font-size:18px', text: text }),
        h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end' },
          h('button', { class: 'btn', 'data-autofocus': true, onclick: function () { closeOverlay(); }, text: 'No, go back' }),
          h('button', { class: 'btn ' + (danger ? 'danger' : 'go'), onclick: function () { closeOverlay(); onYes(); }, text: yesLabel }))));
    }, { cls: 'narrow', modal: true });
  }
  function confirmReset() {
    confirmDialog('Erase everything?', 'This deletes your discoveries, quests and items on this device. You cannot undo it. A copy of the old save is kept as a backup until your next reset.', 'Yes, erase my game', function () {
      const r = store.reset(true);
      st = r.state; ui.selected = null; ui.tab = 'grid'; applySettings(); saveNow(); render();
      feedback('Fresh start! Tap an Oak Log, then tap the table.', 'good');
    }, true);
  }
  function exportSave() {
    const text = E.exportSave(st);
    let downloaded = false;
    try {
      const blob = new Blob([text], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: 'workshop-of-wonders-save.json' });
      document.body.appendChild(a); a.click(); a.remove(); downloaded = true;
    } catch (e) { downloaded = false; }
    openOverlay(function (dlg) {
      dlg.appendChild(header('Export save'));
      const ta = h('textarea', { readonly: true, rows: '6', style: 'width:100%;font:12px monospace', 'aria-label': 'Save code' });
      ta.value = text;
      dlg.appendChild(h('div', { class: 'body' },
        h('p', { text: downloaded ? 'Your save file is downloading. If nothing downloaded, copy this save code and keep it somewhere safe.' : 'Copy this save code and keep it somewhere safe.' }),
        ta, h('div', { style: 'display:flex;gap:8px;margin-top:8px' }, h('button', { class: 'btn', onclick: function () {
          ta.select();
          const done = function () { toast('Save code copied!'); };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { try { document.execCommand('copy'); done(); } catch (e) { toast('Select the text and copy it.'); } });
          else { try { document.execCommand('copy'); done(); } catch (e) { toast('Select the text and copy it.'); } }
        }, text: 'Copy save code' }))));
    }, { cls: 'narrow' });
  }
  function importSave() {
    openOverlay(function (dlg) {
      dlg.appendChild(header('Import save'));
      const file = h('input', { type: 'file', accept: '.json,application/json', 'aria-label': 'Choose a save file' });
      const ta = h('textarea', { rows: '5', style: 'width:100%;font:12px monospace', placeholder: 'Or paste a save code here', 'aria-label': 'Save code' });
      const msg = h('p', { role: 'alert', style: 'font-weight:700' });
      const tryText = function (text) {
        const r = E.importSave(text);
        if (!r.ok) { msg.textContent = 'That save could not be loaded: ' + r.errors.slice(0, 2).join(' ') + ' Your current game was not changed.'; Snd.play('fail'); return; }
        const n = Object.keys(r.state.discoveredItems).length;
        confirmDialog('Replace your game?', 'This save has ' + n + ' discoveries and is on tier ' + r.state.tier + '. Your current game will be replaced.', 'Yes, load it', function () {
          st = r.state; ui.selected = null; ui.tab = 'grid'; applySettings(); saveNow(); render(); toast('Save loaded!');
        });
      };
      file.addEventListener('change', function () {
        const f = file.files && file.files[0]; if (!f) return;
        if (f.size > 5e6) { msg.textContent = 'That file is too big to be a save.'; return; }
        const rd = new FileReader(); rd.onload = function () { tryText(String(rd.result)); }; rd.onerror = function () { msg.textContent = 'Could not read that file.'; }; rd.readAsText(f);
      });
      dlg.appendChild(h('div', { class: 'body' }, h('p', { text: 'Choose a save file you exported earlier, or paste a save code.' }), file,
        h('div', { style: 'margin-top:10px' }, ta), h('button', { class: 'btn go', style: 'margin-top:8px', onclick: function () { if (ta.value.trim()) tryText(ta.value.trim()); else msg.textContent = 'Paste a save code first.'; }, text: 'Load pasted code' }), msg));
    }, { cls: 'narrow' });
  }

  // ----- help -----
  function openHelp() {
    openOverlay(function (dlg) {
      dlg.appendChild(header('How to play'));
      const sec = function (t, p) { return [h('h3', { text: t }), h('p', { text: p })]; };
      dlg.appendChild(h('div', { class: 'body help' },
        h('button', { class: 'btn gold', onclick: function () { ui.tutStep = 0; openTutorial(); }, text: 'Show the picture tutorial' }),
        sec('Crafting', 'Tap an item in your bag to pick it up, then tap squares on the crafting table. When something appears in the big square, tap it to collect it. The items on the table get used up.'),
        sec('Shaped and any-order recipes', 'Some recipes need an exact shape, like a pickaxe: three planks on top, two sticks down the middle. You can slide the whole shape anywhere on the table, and some shapes can be flipped. Other recipes are any-order: just put the right things anywhere.'),
        sec('Moving items', 'Tap to pick up and tap to place. You can also drag items onto the table. On a phone or tablet, press and hold an item for a moment, then drag. Tap an item on the table to send it back to your bag. Clear table sends everything back.'),
        sec('Getting more supplies', 'Open the Supply Crate and tap anything to get more. Choose x1, x8 or x64. You never run out, and nothing is lost when a mix does not work.'),
        sec('Furnace, Brewing and Smithing', 'Some things are cooked, brewed or upgraded instead of crafted. Build the station first, then use its tab above the table. The furnace needs fuel like coal or wood.'),
        sec('The Discovery Book', 'Everything you discover goes in the book with its recipe. Dark shapes are mystery items you can make now. Tap one for hints: a small hint, a bigger hint, and then the answer. Tap Put on the table to set up any recipe you know.'),
        sec('Quests and new areas', 'Quests show you what to try next. Big goals with a star open new areas, and each new area adds new supplies to the crate. Bonus challenges are just for fun.'),
        sec('Tiers', 'There are six tiers: Wood and stone, Metals and gems, Farming and cooking, Redstone and machines, Magic and secrets, and Legendary creations. Build the Wonder Engine to unlock Creative Sandbox.'),
        sec('Saving', 'The game saves by itself after every change. In Settings you can export a save file as a backup, import one, or start over.'),
        sec('About the recipes', 'Recipes marked Minecraft-style follow ' + D.referenceVersion + '. Recipes marked Original are made up for this game. This is a fan-made game with original art and is not affiliated with Mojang or Microsoft.')));
    });
  }

  // ----- tutorial -----
  const TUT = [
    { t: 'Welcome to your workshop!', p: 'This is your bag. Everything you own lives here.', pic: ['oak_log', 'cobblestone', 'dirt', 'coal'] },
    { t: 'Put things on the table', p: 'Tap an item in your bag. Then tap a square on the crafting table.', pic: ['oak_log', '\u279C', 'crafting_table'] },
    { t: 'Or drag them', p: 'You can drag items onto the table too. On a tablet or phone, press and hold first, then drag.', pic: ['oak_planks', '\u279C', 'crafting_table'] },
    { t: 'Changed your mind?', p: 'Tap an item on the table to put it back in your bag. Nothing ever gets lost.', pic: ['crafting_table', '\u279C', 'chest'] },
    { t: 'Collect what you made', p: 'When something shows up in the big square, tap it to collect it!', pic: ['oak_log', '\u279C', 'oak_planks'] },
    { t: 'Try new mixes', p: 'Experiment! Every new thing you make goes into your Discovery Book.', pic: ['oak_planks', '+', 'stick', '\u279C', 'wooden_pickaxe'] },
    { t: 'Stuck? Ask the book', p: 'Open the Book and tap a dark mystery shape to get a hint.', pic: ['book', '\u279C', 'diamond_pickaxe'] },
    { t: 'Quests open new areas', p: 'Follow the quests to open the forest, the mine and more. New areas bring new supplies.', pic: ['writable_book', '\u279C', 'birch_log', 'raw_iron', 'wheat'] }
  ];
  function openTutorial() {
    openOverlay(function (dlg) {
      const s = TUT[ui.tutStep];
      dlg.appendChild(header(s.t));
      const pic = h('div', { class: 'pic', 'aria-hidden': 'true' }, s.pic.map(function (x) { return D.items[x] ? icon(x) : h('span', { style: 'font-size:34px;font-weight:900', text: x }); }));
      const dots = h('div', { class: 'dots', 'aria-label': 'Step ' + (ui.tutStep + 1) + ' of ' + TUT.length }, TUT.map(function (_, i) { return h('i', { class: i === ui.tutStep ? 'on' : '' }); }));
      const last = ui.tutStep === TUT.length - 1;
      dlg.appendChild(h('div', { class: 'body tut' }, pic, h('p', { style: 'font-size:20px', text: s.p }), dots,
        h('div', { style: 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap' },
          ui.tutStep > 0 ? h('button', { class: 'btn', onclick: function () { ui.tutStep--; rebuildOverlay(); }, text: 'Back' }) : null,
          h('button', { class: 'btn', onclick: endTutorial, text: 'Skip' }),
          h('button', { class: 'btn go', 'data-autofocus': true, onclick: function () { if (last) endTutorial(); else { ui.tutStep++; rebuildOverlay(); } }, text: last ? 'Start crafting!' : 'Next' }))));
    }, { cls: 'narrow' });
  }
  function endTutorial() { st.settings.tutorialDone = true; saveNow(); closeOverlay(); }
  function openWelcome() {
    openOverlay(function (dlg) {
      dlg.appendChild(header('Workshop of Wonders'));
      dlg.appendChild(h('div', { class: 'body tut' },
        h('div', { class: 'pic', 'aria-hidden': 'true' }, icon('crafting_table'), icon('oak_log'), icon('wooden_pickaxe'), icon('diamond'), icon('wonder_engine', 'mystery')),
        h('p', { style: 'font-size:20px', text: 'Craft, discover and build your very own workshop!' }),
        h('div', { style: 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap' },
          h('button', { class: 'btn go', 'data-autofocus': true, onclick: function () { ui.tutStep = 0; openTutorial(); }, text: 'Show me how' }),
          h('button', { class: 'btn', onclick: endTutorial, text: 'Just play' })),
        h('div', { style: 'margin-top:14px' }, sw('Sound effects', st.settings.sound, function (v) { st.settings.sound = v; applySettings(); Snd.play('craft'); saveNow(); renderTop(); rebuildOverlay(); }))));
    }, { cls: 'narrow', modal: true });
  }

  // ---------- celebrations ----------
  function queueCelebration(c) { ui.celebrations.push(c); if (!ui.celebrating) nextCelebration(); }
  function nextCelebration() {
    const c = ui.celebrations.shift();
    const old = $('#celebrate'); if (old) old.remove();
    if (!c) { ui.celebrating = false; return; }
    ui.celebrating = true;
    let iconId, kicker, title, text;
    if (c.type === 'item') {
      iconId = c.item; kicker = D.items[c.item].secret ? 'Secret discovery!' : 'New discovery!'; title = name(c.item);
      text = c.recipe.discoveryMessage || D.items[c.item].description;
      const uses = (E.index.usedIn[c.item] || []).length;
      if (!c.recipe.discoveryMessage && uses) text += ' It is used in ' + uses + ' recipe' + (uses > 1 ? 's' : '') + '.';
      Snd.play('discover');
    } else if (c.type === 'grid3') { iconId = 'crafting_table'; kicker = 'Upgrade!'; title = 'Big crafting table'; text = 'Your table is now 3 by 3. Tools, doors and lots more can be made now!'; Snd.play('unlock'); }
    else if (c.type === 'biome') { const b = D.biomes.find(function (x) { return x.id === c.biome; }); iconId = b.icon; kicker = 'New area unlocked!'; title = b.name; text = b.blurb + ' New supplies are in your Supply Crate.'; Snd.play('unlock'); }
    else if (c.type === 'tier') { iconId = ['', 'oak_log', 'iron_ingot', 'wheat', 'redstone', 'nether_wart', 'nether_star'][c.tier]; kicker = 'Tier ' + c.tier + '!'; title = D.tiers[c.tier].name; text = 'A whole new set of things to discover.'; Snd.play('unlock'); }
    else { iconId = 'wonder_engine'; kicker = 'You did it!'; title = 'Creative Sandbox'; text = 'Switch to Creative at the top to build with every item for free. Your adventure stays saved.'; Snd.play('unlock'); }
    const done = function () { wrap.remove(); nextCelebration(); };
    const wrap = h('div', { class: 'celebrate', id: 'celebrate', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'celTitle', onclick: function (e) { if (e.target === wrap) done(); } },
      h('div', { class: 'panel card' }, h('div', { class: 'rays', 'aria-hidden': 'true' }), h('div', { class: 'icon' }, icon(iconId)),
        h('div', { class: 'kicker', text: kicker }), h('h2', { id: 'celTitle', text: title }), h('p', { text: text }),
        h('button', { class: 'btn gold', 'data-autofocus': true, onclick: done, text: 'Awesome!' })));
    document.body.appendChild(wrap);
    const b = wrap.querySelector('button'); if (b) b.focus();
    confetti();
  }
  function confetti() {
    if (reduceMotion()) return;
    const box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
    const cols = ['#ffcf3a', '#3fae4a', '#3a7ad8', '#e8403a', '#a46ae0', '#f38baa'];
    for (let i = 0; i < 36; i++) box.appendChild(h('i', { style: 'left:' + Math.random() * 100 + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 0.5).toFixed(2) + 's' }));
    document.body.appendChild(box); setTimeout(function () { box.remove(); }, 2300);
  }

  // ---------- drag and drop (pointer based, works with mouse and touch) ----------
  const drag = { src: null, active: false, x0: 0, y0: 0, timer: null, ghost: null, target: null, suppress: false, pointerId: null };
  function dragGuard() { if (drag.suppress) { drag.suppress = false; return true; } return false; }
  function onPointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const el = e.target.closest('[data-drag]');
    if (!el || ui.overlay) return;
    const kind = el.getAttribute('data-drag');
    let id = null;
    if (kind === 'bag') id = el.getAttribute('data-id');
    else if (kind === 'grid') id = E.ws(st).grid[+el.getAttribute('data-slot')];
    else if (kind === 'station') id = E.ws(st).stations[el.getAttribute('data-method')][el.getAttribute('data-key')];
    if (!id) return;
    drag.src = { kind: kind, id: id, slot: kind === 'grid' ? +el.getAttribute('data-slot') : null, method: el.getAttribute('data-method'), key: el.getAttribute('data-key') };
    drag.x0 = e.clientX; drag.y0 = e.clientY; drag.pointerId = e.pointerId; drag.active = false;
    clearTimeout(drag.timer);
    if (e.pointerType !== 'mouse' && kind === 'bag') drag.timer = setTimeout(function () { startDrag(drag.x0, drag.y0); }, 260); // hold to drag; quick swipes still scroll
  }
  function startDrag(x, y) {
    if (!drag.src || drag.active) return;
    drag.active = true;
    document.body.classList.add('dragging');
    drag.ghost = h('div', { class: 'ghost', 'aria-hidden': 'true' }, icon(drag.src.id));
    document.body.appendChild(drag.ghost);
    moveGhost(x, y);
    Snd.play('pick');
  }
  function moveGhost(x, y) {
    if (!drag.ghost) return;
    drag.ghost.style.left = x + 'px'; drag.ghost.style.top = y + 'px';
    const under = document.elementFromPoint(x, y);
    const t = under && under.closest('[data-drop]');
    if (drag.target && drag.target !== t) drag.target.classList.remove('drop-target');
    drag.target = t; if (t) t.classList.add('drop-target');
  }
  function onPointerMove(e) {
    if (!drag.src || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0, dist = Math.sqrt(dx * dx + dy * dy);
    if (!drag.active) {
      if (drag.src.kind === 'bag' && e.pointerType !== 'mouse') { if (dist > 10) cancelDrag(); return; }
      if (dist > 6) startDrag(e.clientX, e.clientY); else return;
    }
    moveGhost(e.clientX, e.clientY);
  }
  function onPointerUp(e) {
    if (!drag.src || e.pointerId !== drag.pointerId) return;
    clearTimeout(drag.timer);
    if (!drag.active) { drag.src = null; return; }
    const src = drag.src, t = drag.target;
    endDrag();
    drag.suppress = true; setTimeout(function () { drag.suppress = false; }, 350);
    drop(src, t);
  }
  function cancelDrag() { clearTimeout(drag.timer); endDrag(); }
  function endDrag() {
    if (drag.ghost) drag.ghost.remove();
    if (drag.target) drag.target.classList.remove('drop-target');
    document.body.classList.remove('dragging');
    drag.ghost = null; drag.target = null; drag.active = false; drag.src = null;
  }
  function drop(src, t) {
    const tKind = t && t.getAttribute('data-drop');
    if (src.kind === 'bag') {
      if (tKind === 'grid') { const r = E.placeInGrid(st, src.id, +t.getAttribute('data-slot')); if (!r.ok) { needMore(r); return; } Snd.play('place'); afterGridChange(+t.getAttribute('data-slot')); }
      else if (tKind === 'station') { const r = E.placeInStation(st, t.getAttribute('data-method'), t.getAttribute('data-key'), src.id); if (!r.ok) { needMore(r); return; } Snd.play('place'); stationFeedback(t.getAttribute('data-method')); scheduleSave(); renderBench(); renderBag(); }
      return;
    }
    if (src.kind === 'grid') {
      if (tKind === 'grid') { E.moveInGrid(st, src.slot, +t.getAttribute('data-slot')); Snd.play('place'); afterGridChange(+t.getAttribute('data-slot')); }
      else { E.removeFromGrid(st, src.slot); Snd.play('remove'); afterGridChange(); }
      return;
    }
    if (src.kind === 'station') {
      E.removeFromStation(st, src.method, src.key);
      if (tKind === 'station' && t.getAttribute('data-method') === src.method) E.placeInStation(st, src.method, t.getAttribute('data-key'), src.id);
      Snd.play('remove'); stationFeedback(src.method); scheduleSave(); renderBench(); renderBag();
    }
  }

  // ---------- keyboard ----------
  function onKey(e) {
    if (e.key === 'Escape') {
      if ($('#celebrate')) { $('#celebrate button').click(); return; }
      if (ui.overlay && !ui.overlay.opts.modal) { closeOverlay(); return; }
      if (ui.selected) { select(null); return; }
    }
    if (ui.overlay && e.key === 'Tab') { // keep focus inside dialogs
      const f = Array.prototype.slice.call(ui.overlay.el.querySelectorAll('button, input, textarea, [tabindex]:not([tabindex="-1"])')).filter(function (x) { return !x.disabled; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  }

  // ---------- render all ----------
  function render() {
    renderTop(); renderWorkshop(); renderBench(); renderBag(); renderQuests();
    if (ui.overlay) rebuildOverlay();
  }

  // Draw item icons in small batches while the player is idle so the Book opens instantly.
  function warmIcons() {
    const ids = D.itemOrder.slice(); let i = 0;
    const idle = window.requestIdleCallback || function (fn) { return setTimeout(function () { fn({ timeRemaining: function () { return 8; } }); }, 30); };
    const step = function (dl) { const t0 = Date.now(); while (i < ids.length && (dl.timeRemaining() > 2 || Date.now() - t0 < 4)) { const it = D.items[ids[i]]; Icons.toDataURL(it.icon, ids[i]); i++; if (Date.now() - t0 > 12) break; } if (i < ids.length) idle(step); };
    idle(step);
  }
  function boot() {
    const pick = pickStorage(); persistent = pick.persistent;
    store = E.Store(pick.s, 'workshop-of-wonders');
    const loaded = store.load();
    st = loaded.state;
    applySettings();
    // static shell bindings
    $('#soundBtn').addEventListener('click', function () { st.settings.sound = !st.settings.sound; applySettings(); Snd.play('craft'); saveNow(); renderTop(); });
    $('#btnBook').addEventListener('click', function () { openBook(); });
    $('#btnMap').addEventListener('click', function () { openMap(); });
    $('#btnQuests').addEventListener('click', openQuests);
    $('#btnHelp').addEventListener('click', openHelp);
    $('#btnSettings').addEventListener('click', openSettings);
    ['btnBook', 'btnMap', 'btnQuests', 'btnHelp', 'btnSettings', 'soundBtn'].forEach(function (id) { const b = $('#' + id); const ic = b.getAttribute('data-icon'); if (ic) b.insertBefore(icon(ic), b.firstChild); });
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', function (e) { if (drag.src && e.pointerId === drag.pointerId) cancelDrag(); });
    document.addEventListener('touchmove', function (e) { if (drag.active) e.preventDefault(); }, { passive: false });
    document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('[data-drag]')) e.preventDefault(); });
    document.addEventListener('keydown', onKey);
    window.addEventListener('pagehide', saveNow);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') saveNow(); });
    render();
    saveNow();
    if (loaded.status === 'updated') toast('The game was updated. Your progress is safe!');
    else if (loaded.status === 'recovered') toast('Your last save had a problem, so we loaded your backup.');
    else if (loaded.status === 'reset_corrupt') toast('Your save could not be read, so a new game started. The old data was kept safe.');
    if (!st.settings.tutorialDone) openWelcome();
    warmIcons();
    W.UI = { state: function () { return st; }, render: render, select: select, gridTap: gridTap, collect: collect, openBook: openBook, saveNow: saveNow };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.WOW = window.WOW || {});
