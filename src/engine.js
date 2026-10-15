/* Workshop of Wonders - game engine. Pure game logic with no DOM access.
   All crafting, hints, quests and unlocks read from WOW.Data. */
(function (W) {
  'use strict';
  const D = W.Data;
  const E = W.Engine = {};
  const SCHEMA_VERSION = 2;
  const GAME_VERSION = '1.3.0';
  E.SCHEMA_VERSION = SCHEMA_VERSION; E.GAME_VERSION = GAME_VERSION;
  const STATION_ITEM = { smelting: 'furnace', brewing: 'brewing_stand', smithing: 'smithing_table' };
  E.STATION_ITEM = STATION_ITEM;
  const SMELT_COST = 4; // fuel units are quarter-items: coal = 32 units = 8 smelts

  // ---------- indexes and finalization ----------
  const I = E.index = { byOutput: {}, byId: {}, tagMembers: {}, usedIn: {}, recipesByMethod: { crafting_grid: [], smelting: [], brewing: [], smithing: [] } };
  function isTag(s) { return typeof s === 'string' && s.charAt(0) === '#'; }
  E.isTag = isTag;
  function tagName(t) {
    const names = { '#planks': 'any Planks', '#logs': 'any Log', '#wooden_slabs': 'any Wooden Slab', '#coals': 'Coal or Charcoal', '#wool': 'any Wool' };
    return names[t] || ('any ' + t.slice(1).replace(/_/g, ' '));
  }
  E.ingredientName = function (ing) { return isTag(ing) ? tagName(ing) : (D.items[ing] ? D.items[ing].name : ing); };
  E.matchesIng = function (ing, itemId) {
    if (!itemId) return false;
    if (isTag(ing)) { const it = D.items[itemId]; return !!it && it.tags.indexOf(ing.slice(1)) >= 0; }
    return ing === itemId;
  };
  E.tagItems = function (tag) { return I.tagMembers[tag.slice(1)] || []; };

  function finalize() {
    D.itemOrder.forEach(function (id) {
      D.items[id].tags.forEach(function (t) { (I.tagMembers[t] = I.tagMembers[t] || []).push(id); });
      if (D.items[id].secret && D.items[id].tags.indexOf('secret') < 0) { D.items[id].tags.push('secret'); (I.tagMembers.secret = I.tagMembers.secret || []).push(id); }
    });
    D.recipes.forEach(function (r) {
      const out = D.items[r.output.itemId];
      r.name = out ? out.name : r.output.itemId;
      r.category = out ? out.category : 'materials';
      r.tags = out ? out.tags.slice() : [];
      // canonical ingredient list derived from the pattern/list/slots
      const counts = {};
      const add = function (x) { if (x) counts[x] = (counts[x] || 0) + 1; };
      if (r.method === 'crafting_grid') {
        if (r.type === 'shaped') {
          r.pattern.forEach(function (row) { row.forEach(add); });
          r.height = r.pattern.length; r.width = Math.max.apply(null, r.pattern.map(function (row) { return row.length; }));
          r.pattern = r.pattern.map(function (row) { while (row.length < r.width) row.push(null); return row; });
          r.gridSize = Math.max(r.height, r.width) <= 2 ? 2 : 3;
        } else {
          r.list.forEach(add);
          r.gridSize = r.list.length <= 4 ? 2 : 3;
        }
      } else if (r.method === 'smelting') { add(r.input); r.gridSize = 0; }
      else if (r.method === 'brewing') { add(r.base); add(r.ingredient); r.gridSize = 0; }
      else if (r.method === 'smithing') { add(r.template); add(r.base); add(r.addition); r.gridSize = 0; }
      r.ingredients = Object.keys(counts).map(function (k) { return { itemId: k, quantity: counts[k] }; });
      r.station = STATION_ITEM[r.method] || null;
      if (r.station && r.unlockRequirements.indexOf('item:' + r.station) < 0) r.unlockRequirements = r.unlockRequirements.concat(['item:' + r.station]);
      if (r.gridSize === 3 && r.unlockRequirements.indexOf('grid3') < 0) r.unlockRequirements = r.unlockRequirements.concat(['grid3']);
      I.byId[r.id] = r;
      (I.byOutput[r.output.itemId] = I.byOutput[r.output.itemId] || []).push(r);
      I.recipesByMethod[r.method].push(r);
      r.ingredients.forEach(function (ing) {
        const ids = isTag(ing.itemId) ? E.tagItems(ing.itemId) : [ing.itemId];
        ids.forEach(function (id) { (I.usedIn[id] = I.usedIn[id] || []); if (I.usedIn[id].indexOf(r.id) < 0) I.usedIn[id].push(r.id); });
      });
    });
    // progression simulation gives each item the tier it first becomes reachable
    const sim = E.simulateProgression();
    D.itemOrder.forEach(function (id) { if (sim.itemTier[id]) D.items[id].tier = sim.itemTier[id]; });
    D.recipes.forEach(function (r) {
      r.tier = sim.recipeTier[r.id] || (D.items[r.output.itemId] && D.items[r.output.itemId].tier) || 1;
      r.hints = buildHints(r);
      r.unlockRequirements = r.unlockRequirements.concat(sim.recipeTier[r.id] ? ['tier:' + r.tier] : []);
    });
    D.itemOrder.forEach(function (id) {
      const it = D.items[id];
      if (it.resource) {
        const bi = D.biomes.find(function (bb) { return bb.resources.indexOf(id) >= 0; });
        it.unlockRequirements = bi ? ['biome:' + bi.id] : [];
      } else it.unlockRequirements = (I.byOutput[id] || []).length ? ['recipe:' + I.byOutput[id][0].id] : [];
    });
    E.simulation = sim;
  }

  const CAT_HINT = {
    materials: 'It is a basic material.', wood_stone: 'It belongs with wood and stone things.', tools: 'It is a tool.',
    building: 'It is a building block or decoration.', metals_gems: 'It is made of metal or gems.', farming_food: 'It is food or comes from the farm.',
    animals: 'It has to do with animals or creatures.', transport: 'It helps you travel.', machinery: 'It is part of a machine.',
    armor: 'It is armor or adventure gear.', magic: 'It is magical.', legendary: 'It is a legendary creation.',
    jump_man: 'It is a Jump Man thing.'
  };
  function rarest(r) {
    let best = null, bt = -1;
    r.ingredients.forEach(function (ing) {
      const t = isTag(ing.itemId) ? 0 : (D.items[ing.itemId] ? D.items[ing.itemId].tier : 0);
      if (t > bt) { bt = t; best = ing.itemId; }
    });
    return best;
  }
  function buildHints(r) {
    const h = [CAT_HINT[r.category] || 'Keep experimenting!'];
    const key = rarest(r);
    if (r.method === 'smelting') h.push('Try cooking ' + E.ingredientName(r.input) + ' in the Furnace.');
    else if (r.method === 'brewing') h.push('It is brewed. It needs ' + E.ingredientName(r.ingredient) + '.');
    else if (r.method === 'smithing') h.push('Upgrade gear at the Smithing station with ' + E.ingredientName(r.addition) + '.');
    else h.push('It uses ' + E.ingredientName(key) + (r.ingredients.length > 1 ? ' and ' + (r.ingredients.length - 1) + ' other kind' + (r.ingredients.length > 2 ? 's' : '') + ' of ingredient.' : '.'));
    if (r.method === 'crafting_grid') {
      h.push(r.type === 'shaped' ? 'Arrange: ' + r.ingredients.map(function (i) { return i.quantity + ' ' + E.ingredientName(i.itemId); }).join(', ') + ' in the pattern shown.' :
        'Put these anywhere in the grid: ' + r.ingredients.map(function (i) { return i.quantity + ' ' + E.ingredientName(i.itemId); }).join(', ') + '.');
    } else if (r.method === 'smelting') h.push('Furnace: ' + E.ingredientName(r.input) + ' plus any fuel.');
    else if (r.method === 'brewing') h.push('Brewing: ' + E.ingredientName(r.base) + ' + ' + E.ingredientName(r.ingredient) + '.');
    else h.push('Smithing: ' + E.ingredientName(r.template) + ' + ' + E.ingredientName(r.base) + ' + ' + E.ingredientName(r.addition) + '.');
    return h;
  }

  // ---------- grid matching ----------
  // grid: flat array (size*size) of item ids or null
  function trim(grid, size) {
    let minR = size, maxR = -1, minC = size, maxC = -1;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (grid[r * size + c]) { minR = Math.min(minR, r); maxR = Math.max(maxR, r); minC = Math.min(minC, c); maxC = Math.max(maxC, c); }
    if (maxR < 0) return null;
    const rows = [];
    for (let r = minR; r <= maxR; r++) { const row = []; for (let c = minC; c <= maxC; c++) row.push(grid[r * size + c] || null); rows.push(row); }
    return rows;
  }
  E.trimGrid = trim;
  function shapedMatches(r, rows) {
    if (rows.length !== r.height || rows[0].length !== r.width) return false;
    const tryIt = function (mirror) {
      for (let y = 0; y < r.height; y++) for (let x = 0; x < r.width; x++) {
        const want = r.pattern[y][mirror ? r.width - 1 - x : x], have = rows[y][x];
        if (!want && !have) continue;
        if (!want || !have || !E.matchesIng(want, have)) return false;
      }
      return true;
    };
    return tryIt(false) || (r.mirror && tryIt(true));
  }
  function shapelessMatches(ingList, items) {
    if (ingList.length !== items.length) return false;
    // assign specific ingredients first, then tags (bipartite-safe for this dataset; verified by tests)
    const order = ingList.slice().sort(function (a, b) { return (isTag(a) ? 1 : 0) - (isTag(b) ? 1 : 0); });
    const pool = items.slice();
    for (let i = 0; i < order.length; i++) {
      const idx = pool.findIndex(function (it) { return E.matchesIng(order[i], it); });
      if (idx < 0) return false;
      pool.splice(idx, 1);
    }
    return true;
  }
  E.shapelessMatches = shapelessMatches;
  // Returns every grid recipe matching the grid, deterministic order: shaped first, then dataset order.
  E.matchAll = function (grid, size) {
    const rows = trim(grid, size);
    if (!rows) return [];
    const items = grid.filter(Boolean);
    const out = [];
    I.recipesByMethod.crafting_grid.forEach(function (r) {
      if (r.gridSize > size) return;
      if (r.type === 'shaped' ? shapedMatches(r, rows) : shapelessMatches(r.list, items)) out.push(r);
    });
    out.sort(function (a, b) { return (a.type === 'shaped' ? 0 : 1) - (b.type === 'shaped' ? 0 : 1); });
    return out;
  };
  E.match = function (grid, size) { return E.matchAll(grid, size)[0] || null; };

  // Friendly analysis of a non-matching grid. Uses only real recipe data.
  E.analyze = function (grid, size, st) {
    const items = grid.filter(Boolean);
    if (!items.length) return { kind: 'empty' };
    const multiset = function (arr) { const m = {}; arr.forEach(function (x) { m[x] = (m[x] || 0) + 1; }); return m; };
    const have = multiset(items);
    const knownFirst = function (list) { return list.sort(function (a, b) { return (st && st.discoveredRecipes[b.id] ? 1 : 0) - (st && st.discoveredRecipes[a.id] ? 1 : 0); }); };
    // 1) a station recipe uses exactly these items
    const stationHit = D.recipes.filter(function (r) {
      if (r.method === 'crafting_grid' || r.secret) return false;
      const ings = r.method === 'smelting' ? [r.input] : r.method === 'brewing' ? [r.base, r.ingredient] : [r.template, r.base, r.addition];
      return shapelessMatches(ings, items);
    });
    if (stationHit.length) {
      const r = stationHit[0];
      const stName = D.items[r.station].name;
      return { kind: 'station', recipe: r, station: r.station, message: 'These go in the ' + (r.method === 'smelting' ? 'Furnace' : r.method === 'brewing' ? 'Brewing Stand' : 'Smithing Table') + ', not the crafting grid.', stationName: stName };
    }
    const sameSet = [], needsMore = [];
    I.recipesByMethod.crafting_grid.forEach(function (r) {
      if (r.secret) return;
      const ings = r.type === 'shaped' ? [].concat.apply([], r.pattern).filter(Boolean) : r.list;
      if (ings.length === items.length) { if (shapelessMatches(ings, items)) sameSet.push(r); }
      else if (ings.length > items.length) {
        // are all current items usable in this recipe?
        const pool = ings.slice(); let ok = true;
        items.forEach(function (it) { const idx = pool.findIndex(function (g) { return E.matchesIng(g, it); }); if (idx < 0) ok = false; else pool.splice(idx, 1); });
        if (ok) needsMore.push(r);
      }
    });
    if (sameSet.length) {
      const r = knownFirst(sameSet)[0];
      if (r.gridSize > size) return { kind: 'bigger_grid', recipe: r, message: 'These materials need a bigger crafting grid. Build a Crafting Table!' };
      return { kind: 'arrangement', recipe: r, message: 'Right materials! Try a different arrangement.' };
    }
    if (needsMore.length) {
      const r = knownFirst(needsMore)[0];
      return { kind: 'more', recipe: r, message: 'Maybe these materials need another ingredient.' };
    }
    const msgs = ['Interesting combination! Try something different.', 'Hmm, nothing yet. Keep experimenting!', 'You learned something new about these materials. Try again!'];
    return { kind: 'none', message: msgs[hashStr(Object.keys(have).sort().join(',')) % msgs.length] };
  };
  function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

  E.findStationRecipe = function (method, slots) {
    return I.recipesByMethod[method].find(function (r) {
      if (method === 'smelting') return E.matchesIng(r.input, slots.input);
      if (method === 'brewing') return E.matchesIng(r.base, slots.base) && E.matchesIng(r.ingredient, slots.ingredient);
      return E.matchesIng(r.template, slots.template) && E.matchesIng(r.base, slots.base) && E.matchesIng(r.addition, slots.addition);
    }) || null;
  };

  // ---------- state ----------
  function emptyWorkspace() {
    return { inv: {}, invOrder: [], grid: new Array(9).fill(null),
      stations: { smelting: { input: null, fuel: null, heat: 0 }, brewing: { base: null, ingredient: null }, smithing: { template: null, base: null, addition: null } },
      lastLayout: null };
  }
  E.newState = function () {
    const st = {
      schema: SCHEMA_VERSION, gameVersion: GAME_VERSION, created: Date.now(),
      adventure: emptyWorkspace(), sandbox: emptyWorkspace(),
      mode: 'adventure', sandboxUnlocked: false,
      grid3: false, tier: 1, biomes: ['workshop'], resources: [],
      discoveredItems: {}, discoveredRecipes: {}, crafted: {}, quests: {}, hintLevels: {}, seenBiomes: { workshop: true },
      settings: { sound: false, music: false, hints: true, motion: 'auto', tutorialDone: false },
      stats: { crafts: 0, experiments: 0 }
    };
    D.biomes[0].resources.forEach(function (id) { unlockResource(st, id); });
    const ws = st.adventure;
    addInv(st, ws, 'oak_log', 8); addInv(st, ws, 'dirt', 4); addInv(st, ws, 'cobblestone', 8); addInv(st, ws, 'sand', 4); addInv(st, ws, 'coal', 4);
    return st;
  };
  function unlockResource(st, id) {
    if (st.resources.indexOf(id) < 0) st.resources.push(id);
    discover(st, id);
  }
  function discover(st, id) {
    if (st.discoveredItems[id]) return false;
    st.discoveredItems[id] = Date.now();
    return true;
  }
  E.ws = function (st) { return st.mode === 'sandbox' ? st.sandbox : st.adventure; };
  function addInv(st, ws, id, n) {
    if (!D.items[id] || !(n > 0)) return;
    ws.inv[id] = (ws.inv[id] || 0) + n;
    if (ws.invOrder.indexOf(id) < 0) ws.invOrder.push(id);
  }
  function takeInv(ws, id, n) {
    if ((ws.inv[id] || 0) < n) return false;
    ws.inv[id] -= n;
    return true;
  }
  E.count = function (st, id) { return E.ws(st).inv[id] || 0; };
  E.gridSize = function (st) { return (st.mode === 'sandbox' || st.grid3) ? 3 : 2; };
  E.gridCells = function (st) { const n = E.gridSize(st); return E.ws(st).grid.slice(0, n * n); };
  E.hasStation = function (st, method) { return st.mode === 'sandbox' || !!st.discoveredItems[STATION_ITEM[method]]; };
  E.isResourceAvailable = function (st, id) { return st.mode === 'sandbox' ? !!D.items[id] && (st.discoveredItems[id] || D.items[id].resource) : st.resources.indexOf(id) >= 0; };
  E.supplyList = function (st) {
    if (st.mode === 'sandbox') return D.itemOrder.filter(function (id) { return D.items[id].resource || st.discoveredItems[id]; });
    return D.itemOrder.filter(function (id) { return st.resources.indexOf(id) >= 0; });
  };
  E.invList = function (st) { const ws = E.ws(st); return ws.invOrder.filter(function (id) { return ws.inv[id] > 0; }); };
  E.totalItems = function (ws) { let n = 0; Object.keys(ws.inv).forEach(function (k) { n += ws.inv[k]; }); ws.grid.forEach(function (g) { if (g) n++; }); Object.keys(ws.stations).forEach(function (k) { const s = ws.stations[k]; Object.keys(s).forEach(function (f) { if (f !== 'heat' && s[f]) n++; }); }); return n; };

  // ---------- actions (each returns a result object; never destroys items on failure) ----------
  E.replenish = function (st, id, n) {
    n = Math.max(1, Math.min(999, n | 0));
    if (!E.isResourceAvailable(st, id)) return { ok: false, message: 'That supply is still locked. Keep going to unlock it!' };
    addInv(st, E.ws(st), id, n);
    return { ok: true, itemId: id, n: n };
  };
  E.placeInGrid = function (st, id, slot) {
    const ws = E.ws(st), size = E.gridSize(st);
    if (slot < 0 || slot >= size * size) return { ok: false, message: 'That spot is not in the grid.' };
    if (!D.items[id]) return { ok: false, message: 'Unknown item.' };
    if (ws.grid[slot] === id) return { ok: true, same: true };
    if (!takeInv(ws, id, 1)) return { ok: false, message: 'You have no ' + D.items[id].name + ' left. Get more from the Supply Crate!', need: id };
    if (ws.grid[slot]) addInv(st, ws, ws.grid[slot], 1);
    ws.grid[slot] = id;
    return { ok: true };
  };
  E.removeFromGrid = function (st, slot) {
    const ws = E.ws(st);
    const id = ws.grid[slot];
    if (!id) return { ok: false };
    ws.grid[slot] = null; addInv(st, ws, id, 1);
    return { ok: true, itemId: id };
  };
  E.moveInGrid = function (st, from, to) {
    const ws = E.ws(st), size = E.gridSize(st);
    if (from === to || from < 0 || to < 0 || from >= size * size || to >= size * size) return { ok: false };
    const t = ws.grid[to]; ws.grid[to] = ws.grid[from]; ws.grid[from] = t;
    return { ok: true };
  };
  E.clearGrid = function (st) {
    const ws = E.ws(st); let n = 0;
    for (let i = 0; i < 9; i++) if (ws.grid[i]) { addInv(st, ws, ws.grid[i], 1); ws.grid[i] = null; n++; }
    return { ok: true, returned: n };
  };
  E.currentMatch = function (st) {
    const size = E.gridSize(st);
    return E.match(E.gridCells(st), size);
  };
  E.collect = function (st) {
    const ws = E.ws(st), size = E.gridSize(st);
    const cells = E.gridCells(st);
    const r = E.match(cells, size);
    if (!r) return { ok: false, message: 'Nothing to collect yet.' };
    ws.lastLayout = cells.slice();
    for (let i = 0; i < 9; i++) ws.grid[i] = null; // ingredients consumed exactly once
    return finishCraft(st, ws, r);
  };
  function finishCraft(st, ws, r) {
    addInv(st, ws, r.output.itemId, r.output.quantity);
    (r.remainders || []).forEach(function (rem) { addInv(st, ws, rem.itemId, rem.quantity); });
    st.stats.crafts++;
    st.crafted[r.output.itemId] = (st.crafted[r.output.itemId] || 0) + r.output.quantity;
    const firstItem = discover(st, r.output.itemId);
    const firstRecipe = !st.discoveredRecipes[r.id];
    st.discoveredRecipes[r.id] = true;
    const prog = E.evaluateQuests(st);
    return { ok: true, recipe: r, output: r.output, firstItem: firstItem, firstRecipe: firstRecipe, quests: prog.completed, unlocks: prog.unlocks };
  }
  // Refill the grid with the last crafted layout from inventory (all or nothing).
  E.canRepeat = function (st) {
    const ws = E.ws(st);
    if (!ws.lastLayout || ws.grid.some(Boolean)) return false;
    return !!E.match(ws.lastLayout, E.gridSize(st));
  };
  E.repeat = function (st) {
    const ws = E.ws(st);
    if (!ws.lastLayout) return { ok: false, message: 'Craft something first.' };
    if (ws.grid.some(Boolean)) E.clearGrid(st);
    const need = {};
    ws.lastLayout.forEach(function (id) { if (id) need[id] = (need[id] || 0) + 1; });
    const missing = Object.keys(need).filter(function (id) { return (ws.inv[id] || 0) < need[id]; });
    if (missing.length) return { ok: false, missing: missing, message: 'You need more ' + missing.map(function (m) { return D.items[m].name; }).join(', ') + '.' };
    ws.lastLayout.forEach(function (id, i) { if (id) { takeInv(ws, id, 1); ws.grid[i] = id; } });
    return { ok: true };
  };
  E.sortInventory = function (st) {
    const ws = E.ws(st);
    const catIdx = {}; D.categories.forEach(function (c, i) { catIdx[c[0]] = i; });
    ws.invOrder = ws.invOrder.filter(function (id) { return ws.inv[id] > 0; }).sort(function (a, b) {
      const A = D.items[a], Bi = D.items[b];
      return (catIdx[A.category] - catIdx[Bi.category]) || (A.tier - Bi.tier) || (D.itemOrder.indexOf(a) - D.itemOrder.indexOf(b));
    });
    return { ok: true };
  };

  // ----- stations -----
  E.placeInStation = function (st, method, slot, id) {
    const ws = E.ws(st), s = ws.stations[method];
    if (!s || !(slot in s) || slot === 'heat') return { ok: false };
    if (!E.hasStation(st, method)) return { ok: false, message: 'Craft a ' + D.items[STATION_ITEM[method]].name + ' first!' };
    if (method === 'smelting' && slot === 'fuel' && !(D.items[id] && D.items[id].fuel > 0)) return { ok: false, message: D.items[id].name + ' does not burn. Try Coal, Charcoal or wood.' };
    if (s[slot] === id) return { ok: true, same: true };
    if (!takeInv(ws, id, 1)) return { ok: false, message: 'You have no ' + D.items[id].name + ' left.', need: id };
    if (s[slot]) addInv(st, ws, s[slot], 1);
    s[slot] = id;
    return { ok: true };
  };
  E.removeFromStation = function (st, method, slot) {
    const ws = E.ws(st), s = ws.stations[method];
    if (!s || !s[slot] || slot === 'heat') return { ok: false };
    addInv(st, ws, s[slot], 1); s[slot] = null;
    return { ok: true };
  };
  E.stationMatch = function (st, method) { return E.findStationRecipe(method, E.ws(st).stations[method]); };
  E.runStation = function (st, method) {
    const ws = E.ws(st), s = ws.stations[method];
    if (!E.hasStation(st, method)) return { ok: false, message: 'Craft a ' + D.items[STATION_ITEM[method]].name + ' first!' };
    const r = E.findStationRecipe(method, s);
    if (!r) {
      const filled = Object.keys(s).filter(function (k) { return k !== 'heat' && k !== 'fuel' && s[k]; });
      return { ok: false, message: filled.length ? 'That will not work here. Try different ingredients!' : 'Put something in first.' };
    }
    if (method === 'smelting') {
      if (st.mode !== 'sandbox' && s.heat < SMELT_COST) {
        if (!s.fuel) return { ok: false, message: 'The furnace needs fuel. Add Coal, Charcoal or wood.', needFuel: true };
        s.heat += D.items[s.fuel].fuel; s.fuel = null;
      }
      if (st.mode !== 'sandbox') s.heat -= SMELT_COST;
      s.input = null;
    } else {
      Object.keys(s).forEach(function (k) { s[k] = null; });
    }
    const res = finishCraft(st, ws, r);
    res.method = method;
    return res;
  };
  // Pull the same ingredients again from inventory after a station run (convenience).
  E.refillStation = function (st, method, prev) {
    const ws = E.ws(st), s = ws.stations[method];
    Object.keys(prev).forEach(function (k) { if (k !== 'heat' && prev[k] && !s[k] && (ws.inv[prev[k]] || 0) > 0) { takeInv(ws, prev[k], 1); s[k] = prev[k]; } });
  };

  // ---------- quests and progression ----------
  E.craftedSet = function (st, list) {
    const seen = {};
    list.forEach(function (x) {
      const ids = isTag(x) ? E.tagItems(x) : [x];
      ids.forEach(function (id) { if (st.crafted[id]) seen[id] = true; });
    });
    return Object.keys(seen).length;
  };
  E.questProgress = function (st, q) {
    const c = q.conditions;
    if (c.craft) { const done = c.craft.filter(function (id) { return st.crafted[id]; }).length; return { done: done, need: c.craft.length }; }
    if (c.craftAny) return { done: Math.min(c.count, E.craftedSet(st, c.craftAny)), need: c.count };
    if (c.discoverCount) return { done: Math.min(c.discoverCount, Object.keys(st.discoveredItems).length), need: c.discoverCount };
    return { done: 0, need: 1 };
  };
  E.questAvailable = function (st, q) { return !st.quests[q.id] && q.prerequisites.every(function (p) { return st.quests[p]; }); };
  E.activeQuests = function (st) { return D.quests.filter(function (q) { return E.questAvailable(st, q); }); };
  E.applyReward = function (st, rw, unlocks) {
    if (rw.grid3 && !st.grid3) {
      // return 2x2 contents before the grid grows
      const ws = st.adventure;
      for (let i = 0; i < 9; i++) if (ws.grid[i]) { addInv(st, ws, ws.grid[i], 1); ws.grid[i] = null; }
      ws.lastLayout = null;
      st.grid3 = true; unlocks.push({ type: 'grid3' });
    }
    if (rw.tier && rw.tier > st.tier) { st.tier = rw.tier; unlocks.push({ type: 'tier', tier: rw.tier }); }
    if (rw.biome && st.biomes.indexOf(rw.biome) < 0) {
      st.biomes.push(rw.biome);
      const b = D.biomes.find(function (x) { return x.id === rw.biome; });
      b.resources.forEach(function (id) { unlockResource(st, id); });
      unlocks.push({ type: 'biome', biome: rw.biome });
    }
    if (rw.sandbox && !st.sandboxUnlocked) { st.sandboxUnlocked = true; unlocks.push({ type: 'sandbox' }); }
  };
  E.evaluateQuests = function (st) {
    const completed = [], unlocks = [];
    let changed = true;
    while (changed) {
      changed = false;
      D.quests.forEach(function (q) {
        if (!E.questAvailable(st, q)) return;
        const p = E.questProgress(st, q);
        if (p.done >= p.need) { st.quests[q.id] = Date.now(); completed.push(q); E.applyReward(st, q.rewards, unlocks); changed = true; }
      });
    }
    return { completed: completed, unlocks: unlocks };
  };

  // Static simulation: which items, recipes and quests are reachable, and at which tier.
  E.simulateProgression = function () {
    const have = {}, itemTier = {}, recipeTier = {}, questDone = {};
    let grid3 = false, tier = 1;
    const biomes = {};
    const unlockBiome = function (id) { if (biomes[id]) return; biomes[id] = true; D.biomes.find(function (b) { return b.id === id; }).resources.forEach(function (r) { if (!have[r]) { have[r] = true; itemTier[r] = tier; } }); };
    unlockBiome('workshop');
    const can = function (ing) { return isTag(ing) ? E.tagItems(ing).some(function (id) { return have[id]; }) : !!have[ing]; };
    let guard = 0, progress = true;
    const closure = function () {
      let more = true, any = false;
      while (more) {
        more = false;
        D.recipes.forEach(function (r) {
          if (recipeTier[r.id]) return;
          if (r.gridSize === 3 && !grid3) return;
          if (r.station && !have[r.station]) return;
          if (!r.ingredients.every(function (i) { return can(i.itemId); })) return;
          recipeTier[r.id] = tier; more = true; any = true;
          [r.output].concat(r.remainders || []).forEach(function (o) { if (!have[o.itemId]) { have[o.itemId] = true; itemTier[o.itemId] = tier; } });
        });
      }
      return any;
    };
    while (progress && guard++ < 500) {
      progress = closure();
      const doneBefore = Object.assign({}, questDone);
      D.quests.forEach(function (q) {
        if (questDone[q.id] || !q.prerequisites.every(function (p) { return doneBefore[p]; })) return;
        const c = q.conditions; let ok = false;
        const reach = function (x) { return isTag(x) ? E.tagItems(x).filter(function (id) { return have[id] && (I.byOutput[id] || []).some(function (r) { return recipeTier[r.id]; }); }).length : ((I.byOutput[x] || []).some(function (r) { return recipeTier[r.id]; }) ? 1 : 0); };
        if (c.craft) ok = c.craft.every(function (id) { return reach(id) > 0; });
        else if (c.craftAny) ok = c.craftAny.reduce(function (s, x) { return s + reach(x); }, 0) >= c.count;
        else if (c.discoverCount) ok = Object.keys(have).length >= c.discoverCount;
        if (!ok) return;
        questDone[q.id] = true; progress = true;
        const rw = q.rewards;
        if (rw.grid3) grid3 = true;
        if (rw.tier) tier = Math.max(tier, rw.tier);
        if (rw.biome) unlockBiome(rw.biome);
      });
    }
    return { have: have, itemTier: itemTier, recipeTier: recipeTier, questDone: questDone, finalTier: tier };
  };

  // ---------- dataset validation ----------
  E.validateData = function () {
    const errors = [], warnings = [];
    const ids = {};
    const itemOk = function (x, where) {
      if (isTag(x)) { if (!E.tagItems(x).length) errors.push(where + ': tag ' + x + ' has no items'); }
      else if (!D.items[x]) errors.push(where + ': unknown item ' + x);
    };
    D.itemOrder.forEach(function (id) {
      const it = D.items[id];
      if (!it.name || !it.description || !it.category || !it.icon) errors.push('item ' + id + ' missing fields');
      if (!D.categories.some(function (c) { return c[0] === it.category; })) errors.push('item ' + id + ' bad category ' + it.category);
      if (!/^[a-z0-9_]+$/.test(id)) errors.push('item id not normalized: ' + id);
    });
    D.recipes.forEach(function (r) {
      if (ids[r.id]) errors.push('duplicate recipe id ' + r.id);
      ids[r.id] = true;
      itemOk(r.output.itemId, 'recipe ' + r.id + ' output');
      if (!(Number.isInteger(r.output.quantity) && r.output.quantity > 0)) errors.push('recipe ' + r.id + ' bad output quantity');
      r.ingredients.forEach(function (i) { itemOk(i.itemId, 'recipe ' + r.id); if (!(Number.isInteger(i.quantity) && i.quantity > 0)) errors.push('recipe ' + r.id + ' bad quantity'); });
      (r.remainders || []).forEach(function (rem) { itemOk(rem.itemId, 'recipe ' + r.id + ' remainder'); });
      if (r.method === 'crafting_grid') {
        if (r.type === 'shaped') {
          if (r.height > 3 || r.width > 3) errors.push('recipe ' + r.id + ' pattern too big');
          if (!r.pattern.some(function (row) { return row.some(Boolean); })) errors.push('recipe ' + r.id + ' empty pattern');
          if (!r.pattern[0].some(Boolean) || !r.pattern[r.height - 1].some(Boolean) || !r.pattern.some(function (row) { return row[0]; }) || !r.pattern.some(function (row) { return row[r.width - 1]; })) errors.push('recipe ' + r.id + ' pattern has empty border rows/cols');
        } else if (r.list.length < 1 || r.list.length > 9) errors.push('recipe ' + r.id + ' shapeless size');
      } else if (['smelting', 'brewing', 'smithing'].indexOf(r.method) < 0) errors.push('recipe ' + r.id + ' unknown method');
      if (['vanilla_reference', 'original_extension'].indexOf(r.sourceType) < 0) errors.push('recipe ' + r.id + ' bad sourceType');
      r.unlockRequirements.forEach(function (u) {
        const p = u.split(':');
        if (p[0] === 'item' && !D.items[p[1]]) errors.push('recipe ' + r.id + ' unlock references unknown item ' + p[1]);
      });
    });
    // conflicts: two grid recipes that accept an identical grid
    const conflicts = E.findConflicts();
    conflicts.forEach(function (c) { errors.push('conflicting recipes: ' + c.join(' vs ')); });
    // station recipes with identical inputs
    ['smelting', 'brewing', 'smithing'].forEach(function (m) {
      const seen = {};
      I.recipesByMethod[m].forEach(function (r) {
        const k = JSON.stringify(r.method === 'smelting' ? [r.input] : r.method === 'brewing' ? [r.base, r.ingredient] : [r.template, r.base, r.addition]);
        if (seen[k]) errors.push('conflicting ' + m + ' recipes ' + seen[k] + ' vs ' + r.id); seen[k] = r.id;
      });
    });
    // quests
    const qids = {};
    D.quests.forEach(function (q) {
      if (qids[q.id]) errors.push('duplicate quest ' + q.id); qids[q.id] = true;
      const c = q.conditions;
      (c.craft || []).forEach(function (x) { itemOk(x, 'quest ' + q.id); });
      (c.craftAny || []).forEach(function (x) { itemOk(x, 'quest ' + q.id); });
      if (q.rewards.biome && !D.biomes.some(function (b) { return b.id === q.rewards.biome; })) errors.push('quest ' + q.id + ' unknown biome');
    });
    D.quests.forEach(function (q) { q.prerequisites.forEach(function (p) { if (!qids[p]) errors.push('quest ' + q.id + ' unknown prerequisite ' + p); }); });
    D.biomes.forEach(function (b) { b.resources.forEach(function (r) { itemOk(r, 'biome ' + b.id); if (D.items[r] && !D.items[r].resource) errors.push('biome ' + b.id + ' lists non-resource ' + r); }); });
    D.itemOrder.forEach(function (id) { if (D.items[id].resource && !D.biomes.some(function (b) { return b.resources.indexOf(id) >= 0; })) errors.push('resource ' + id + ' not in any biome'); });
    // reachability
    const sim = E.simulateProgression();
    D.recipes.forEach(function (r) { if (!sim.recipeTier[r.id]) errors.push('unreachable recipe ' + r.id); });
    D.itemOrder.forEach(function (id) { if (!sim.have[id]) errors.push('unreachable item ' + id); });
    D.quests.forEach(function (q) { if (!sim.questDone[q.id]) errors.push('quest cannot be completed: ' + q.id); });
    // items that are never produced and never used
    D.itemOrder.forEach(function (id) { if (!D.items[id].resource && !(I.byOutput[id] || []).length) errors.push('item with no recipe and not a resource: ' + id); });
    return { errors: errors, warnings: warnings, recipeCount: D.recipes.length, itemCount: D.itemOrder.length, questCount: D.quests.length };
  };

  // Detect pairs of grid recipes that could both match the same grid.
  E.findConflicts = function () {
    const out = [];
    const grid = I.recipesByMethod.crafting_grid;
    const overlap = function (a, b) {
      if (!a && !b) return true; if (!a || !b) return false;
      if (!isTag(a) && !isTag(b)) return a === b;
      const A = isTag(a) ? E.tagItems(a) : [a], Bb = isTag(b) ? E.tagItems(b) : [b];
      return A.some(function (x) { return Bb.indexOf(x) >= 0; });
    };
    const shapedVs = function (a, b) {
      if (a.height !== b.height || a.width !== b.width) return false;
      const t = function (m) { for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) if (!overlap(a.pattern[y][x], b.pattern[y][m ? a.width - 1 - x : x])) return false; return true; };
      return t(false) || (b.mirror && t(true));
    };
    const listOf = function (r) { return r.type === 'shaped' ? [].concat.apply([], r.pattern).filter(Boolean) : r.list; };
    const multisetOverlap = function (la, lb) {
      if (la.length !== lb.length) return false;
      // greedy check using concrete representatives
      const pool = lb.slice();
      for (let i = 0; i < la.length; i++) { const idx = pool.findIndex(function (x) { return overlap(la[i], x); }); if (idx < 0) return false; pool.splice(idx, 1); }
      return true;
    };
    for (let i = 0; i < grid.length; i++) for (let j = i + 1; j < grid.length; j++) {
      const a = grid[i], b = grid[j];
      let hit = false;
      if (a.type === 'shaped' && b.type === 'shaped') hit = shapedVs(a, b);
      else hit = multisetOverlap(listOf(a), listOf(b));
      if (hit) out.push([a.id, b.id]);
    }
    return out;
  };

  // ---------- save validation / migration ----------
  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function validWorkspace(ws, errs, label) {
    if (!isObj(ws)) { errs.push(label + ' missing'); return; }
    if (!isObj(ws.inv)) errs.push(label + '.inv must be an object');
    else Object.keys(ws.inv).forEach(function (k) { if (!D.items[k]) errs.push('unknown item ' + k); else if (!Number.isInteger(ws.inv[k]) || ws.inv[k] < 0 || ws.inv[k] > 1e7) errs.push('bad count for ' + k); });
    if (!Array.isArray(ws.invOrder) || ws.invOrder.some(function (k) { return !D.items[k]; })) errs.push(label + '.invOrder invalid');
    if (!Array.isArray(ws.grid) || ws.grid.length !== 9 || ws.grid.some(function (g) { return g !== null && !D.items[g]; })) errs.push(label + '.grid invalid');
    if (!isObj(ws.stations)) errs.push(label + '.stations invalid');
    else {
      const shape = { smelting: ['input', 'fuel'], brewing: ['base', 'ingredient'], smithing: ['template', 'base', 'addition'] };
      Object.keys(shape).forEach(function (m) {
        const s = ws.stations[m];
        if (!isObj(s)) { errs.push(label + ' station ' + m + ' missing'); return; }
        shape[m].forEach(function (f) { if (s[f] !== null && !D.items[s[f]]) errs.push(label + ' station slot ' + m + '.' + f + ' invalid'); });
      });
      if (!Number.isInteger(ws.stations.smelting && ws.stations.smelting.heat) || ws.stations.smelting.heat < 0) errs.push(label + ' furnace heat invalid');
    }
    if (ws.lastLayout !== null && ws.lastLayout !== undefined && (!Array.isArray(ws.lastLayout) || ws.lastLayout.some(function (g) { return g !== null && !D.items[g]; }))) errs.push(label + '.lastLayout invalid');
  }
  E.migrate = function (obj) {
    if (!isObj(obj)) return obj;
    // schema 1 kept a single top-level workspace; schema 2 splits adventure/sandbox
    if (obj.schema === 1) {
      const o = JSON.parse(JSON.stringify(obj));
      o.adventure = { inv: o.inv || {}, invOrder: o.invOrder || Object.keys(o.inv || {}), grid: o.grid || new Array(9).fill(null),
        stations: o.stations || emptyWorkspace().stations, lastLayout: null };
      o.sandbox = emptyWorkspace(); o.mode = 'adventure';
      delete o.inv; delete o.invOrder; delete o.grid; delete o.stations;
      o.schema = 2;
      return o;
    }
    return obj;
  };
  E.validateSave = function (raw) {
    const errs = [];
    let obj = raw;
    if (typeof raw === 'string') {
      try { obj = JSON.parse(raw); } catch (e) { return { ok: false, errors: ['The file is not valid save data.'] }; }
    }
    if (!isObj(obj)) return { ok: false, errors: ['The save is not an object.'] };
    if (obj.game !== 'workshop-of-wonders' && obj.schema === undefined) return { ok: false, errors: ['This is not a Workshop of Wonders save.'] };
    if (typeof obj.schema !== 'number') return { ok: false, errors: ['Missing save version.'] };
    if (obj.schema > SCHEMA_VERSION) return { ok: false, errors: ['This save comes from a newer version of the game.'] };
    if (obj.schema < 1) return { ok: false, errors: ['This save version is not supported.'] };
    obj = E.migrate(obj);
    validWorkspace(obj.adventure, errs, 'adventure');
    validWorkspace(obj.sandbox, errs, 'sandbox');
    if (['adventure', 'sandbox'].indexOf(obj.mode) < 0) errs.push('bad mode');
    if (typeof obj.grid3 !== 'boolean') errs.push('grid3 must be true or false');
    if (typeof obj.sandboxUnlocked !== 'boolean') errs.push('sandboxUnlocked must be true or false');
    if (!Number.isInteger(obj.tier) || obj.tier < 1 || obj.tier > 6) errs.push('bad tier');
    if (!Array.isArray(obj.biomes) || obj.biomes.some(function (b) { return !D.biomes.some(function (x) { return x.id === b; }); })) errs.push('bad biomes');
    if (!Array.isArray(obj.resources) || obj.resources.some(function (r) { return !D.items[r]; })) errs.push('bad resources');
    ['discoveredItems', 'crafted', 'hintLevels'].forEach(function (k) {
      if (!isObj(obj[k])) errs.push(k + ' invalid'); else Object.keys(obj[k]).forEach(function (id) { if (!D.items[id]) errs.push(k + ' has unknown item ' + id); else if (typeof obj[k][id] !== 'number') errs.push(k + ' bad value'); });
    });
    if (!isObj(obj.discoveredRecipes)) errs.push('discoveredRecipes invalid'); else Object.keys(obj.discoveredRecipes).forEach(function (id) { if (!I.byId[id]) errs.push('unknown recipe ' + id); });
    if (!isObj(obj.quests)) errs.push('quests invalid'); else Object.keys(obj.quests).forEach(function (id) { if (!D.quests.some(function (q) { return q.id === id; })) errs.push('unknown quest ' + id); });
    if (!isObj(obj.settings) || ['sound', 'music', 'hints'].some(function (k) { return typeof obj.settings[k] !== 'boolean'; })) errs.push('settings invalid');
    if (obj.mode === 'sandbox' && !obj.sandboxUnlocked) errs.push('sandbox is locked');
    if (errs.length) return { ok: false, errors: errs };
    // rebuild a clean state object from validated fields only (never keep unknown keys)
    const st = E.newState();
    const pickWs = function (src) {
      return { inv: Object.assign({}, src.inv), invOrder: src.invOrder.slice(), grid: src.grid.slice(),
        stations: { smelting: { input: src.stations.smelting.input, fuel: src.stations.smelting.fuel, heat: src.stations.smelting.heat },
          brewing: { base: src.stations.brewing.base, ingredient: src.stations.brewing.ingredient },
          smithing: { template: src.stations.smithing.template, base: src.stations.smithing.base, addition: src.stations.smithing.addition } },
        lastLayout: Array.isArray(src.lastLayout) ? src.lastLayout.slice() : null };
    };
    st.adventure = pickWs(obj.adventure); st.sandbox = pickWs(obj.sandbox);
    st.mode = obj.mode; st.sandboxUnlocked = obj.sandboxUnlocked; st.grid3 = obj.grid3; st.tier = obj.tier;
    st.biomes = obj.biomes.slice(); st.resources = obj.resources.slice();
    // supplies added to an already-open area by a game update become available right away
    st.biomes.forEach(function (bid) { D.biomes.find(function (b) { return b.id === bid; }).resources.forEach(function (rid) { if (st.resources.indexOf(rid) < 0) st.resources.push(rid); }); });
    st.discoveredItems = Object.assign({}, obj.discoveredItems); st.discoveredRecipes = Object.assign({}, obj.discoveredRecipes);
    st.crafted = Object.assign({}, obj.crafted); st.quests = Object.assign({}, obj.quests); st.hintLevels = Object.assign({}, obj.hintLevels);
    st.resources.forEach(function (rid) { if (!st.discoveredItems[rid]) st.discoveredItems[rid] = Date.now(); });
    st.seenBiomes = isObj(obj.seenBiomes) ? Object.assign({}, obj.seenBiomes) : {};
    st.settings = { sound: obj.settings.sound, music: obj.settings.music, hints: obj.settings.hints,
      motion: ['auto', 'reduce', 'full'].indexOf(obj.settings.motion) >= 0 ? obj.settings.motion : 'auto', tutorialDone: !!obj.settings.tutorialDone };
    st.stats = isObj(obj.stats) ? { crafts: obj.stats.crafts | 0, experiments: obj.stats.experiments | 0 } : { crafts: 0, experiments: 0 };
    st.created = typeof obj.created === 'number' ? obj.created : Date.now();
    return { ok: true, state: st };
  };
  E.serialize = function (st) {
    return JSON.stringify(Object.assign({ game: 'workshop-of-wonders', savedAt: Date.now() }, st, { schema: SCHEMA_VERSION, gameVersion: GAME_VERSION }));
  };

  // ---------- storage with backup (localStorage-like object injected) ----------
  E.Store = function (storage, key) {
    key = key || 'wow-save';
    const KB = key + '-backup', KC = key + '-corrupt';
    return {
      save: function (st) {
        const data = E.serialize(st);
        const check = E.validateSave(data);
        if (!check.ok) return { ok: false, errors: check.errors };
        try {
          const prev = storage.getItem(key);
          if (prev && E.validateSave(prev).ok) storage.setItem(KB, prev);
          storage.setItem(key, data);
          return { ok: true };
        } catch (e) { return { ok: false, errors: ['Could not save: storage is full or blocked.'] }; }
      },
      load: function () {
        let raw = null;
        try { raw = storage.getItem(key); } catch (e) { return { state: E.newState(), status: 'unavailable' }; }
        if (!raw) return { state: E.newState(), status: 'new' };
        let v = E.validateSave(raw);
        if (!v.ok) { const fixed = E.dropRetiredIds(raw); if (fixed) { const v2 = E.validateSave(fixed); if (v2.ok) return { state: v2.state, status: 'updated', removed: E.dropRetiredIds.last }; } }
        if (v.ok) return { state: v.state, status: 'loaded' };
        try { storage.setItem(KC, raw); } catch (e) { /* ignore */ }
        const bak = storage.getItem(KB);
        const vb = bak ? E.validateSave(bak) : { ok: false };
        if (vb.ok) { storage.setItem(key, bak); return { state: vb.state, status: 'recovered', errors: v.errors }; }
        return { state: E.newState(), status: 'reset_corrupt', errors: v.errors };
      },
      reset: function (confirmed) {
        if (confirmed !== true) return { ok: false, message: 'Reset needs confirmation.' };
        const prev = storage.getItem(key);
        if (prev) storage.setItem(KB, prev);
        storage.removeItem(key);
        return { ok: true, state: E.newState() };
      }
    };
  };


  // After a game update removes or renames something, an old save may mention IDs that no longer exist.
  // For the player's own saved game we quietly drop those entries instead of rejecting the whole save.
  // (Imported files are still validated strictly.)
  E.dropRetiredIds = function (raw) {
    let o; try { o = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(JSON.stringify(raw)); } catch (e) { return null; }
    if (!isObj(o) || typeof o.schema !== 'number' || o.schema > SCHEMA_VERSION) return null;
    o = E.migrate(o);
    const removed = [];
    const okItem = function (id) { const ok = !!D.items[id]; if (!ok && removed.indexOf(id) < 0) removed.push(id); return ok; };
    const fixWs = function (ws) {
      if (!isObj(ws)) return;
      if (isObj(ws.inv)) Object.keys(ws.inv).forEach(function (k) { if (!okItem(k)) delete ws.inv[k]; });
      if (Array.isArray(ws.invOrder)) ws.invOrder = ws.invOrder.filter(function (k) { return !!D.items[k]; });
      if (Array.isArray(ws.grid)) ws.grid = ws.grid.map(function (g) { return g === null || okItem(g) ? g : null; });
      if (Array.isArray(ws.lastLayout) && ws.lastLayout.some(function (g) { return g !== null && !D.items[g]; })) ws.lastLayout = null;
      if (isObj(ws.stations)) Object.keys(ws.stations).forEach(function (m) { const st = ws.stations[m]; if (isObj(st)) Object.keys(st).forEach(function (f) { if (f !== 'heat' && st[f] !== null && !okItem(st[f])) st[f] = null; }); });
    };
    fixWs(o.adventure); fixWs(o.sandbox);
    if (Array.isArray(o.resources)) o.resources = o.resources.filter(function (r) { return okItem(r); });
    if (Array.isArray(o.biomes)) o.biomes = o.biomes.filter(function (b) { return D.biomes.some(function (x) { return x.id === b; }); });
    ['discoveredItems', 'crafted', 'hintLevels'].forEach(function (k) { if (isObj(o[k])) Object.keys(o[k]).forEach(function (id) { if (!okItem(id)) delete o[k][id]; }); });
    if (isObj(o.discoveredRecipes)) Object.keys(o.discoveredRecipes).forEach(function (id) { if (!I.byId[id]) { delete o.discoveredRecipes[id]; removed.push('recipe ' + id); } });
    if (isObj(o.quests)) Object.keys(o.quests).forEach(function (id) { if (!D.quests.some(function (q) { return q.id === id; })) { delete o.quests[id]; removed.push('quest ' + id); } });
    E.dropRetiredIds.last = removed;
    return JSON.stringify(o);
  };

  // Import: validate before replacing. Returns new state or errors; never touches the current state.
  E.importSave = function (text) {
    if (typeof text !== 'string' || text.length > 5e6) return { ok: false, errors: ['That file is too big or empty.'] };
    return E.validateSave(text);
  };
  E.exportSave = function (st) { return E.serialize(st); };

  // ---------- sandbox ----------
  E.setMode = function (st, mode) {
    if (mode === 'sandbox' && !st.sandboxUnlocked) return { ok: false, message: 'Finish the Wonder Engine to unlock Creative Sandbox.' };
    if (mode !== 'sandbox' && mode !== 'adventure') return { ok: false };
    st.mode = mode;
    return { ok: true };
  };

  E.discoveryStats = function (st) {
    const total = D.itemOrder.length;
    const found = D.itemOrder.filter(function (id) { return st.discoveredItems[id]; }).length;
    const rTotal = D.recipes.length, rFound = Object.keys(st.discoveredRecipes).length;
    return { items: found, totalItems: total, recipes: rFound, totalRecipes: rTotal };
  };

  // ---------- "put it on the table" from the recipe book ----------
  // Picks concrete items for tag ingredients from what the player owns. All or nothing.
  E.planRecipe = function (st, r) {
    const ws = E.ws(st);
    const slots = r.method === 'crafting_grid'
      ? (r.type === 'shaped' ? [].concat.apply([], r.pattern.map(function (row) { return row.concat(new Array(3 - row.length).fill(null)); })).concat(new Array(9).fill(null)).slice(0, r.height * 3)
        : r.list.slice())
      : (r.method === 'smelting' ? [r.input] : r.method === 'brewing' ? [r.base, r.ingredient] : [r.template, r.base, r.addition]);
    const used = {}, picks = [], missing = [];
    slots.forEach(function (ing) {
      if (!ing) { picks.push(null); return; }
      let cands = isTag(ing) ? E.tagItems(ing) : [ing];
      cands = cands.slice().sort(function (a, b) { return (ws.inv[b] || 0) - (ws.inv[a] || 0); });
      const pick = cands.find(function (c) { return (ws.inv[c] || 0) - (used[c] || 0) > 0; });
      if (pick) { used[pick] = (used[pick] || 0) + 1; picks.push(pick); }
      else {
        const any = cands.find(function (c) { return E.isResourceAvailable(st, c); }) || cands[0];
        if (missing.indexOf(any) < 0) missing.push(any);
        picks.push(null);
      }
    });
    return { picks: picks, missing: missing };
  };
  E.autofill = function (st, recipeId) {
    const r = I.byId[recipeId];
    if (!r) return { ok: false, message: 'Unknown recipe.' };
    if (r.method === 'crafting_grid') {
      const size = E.gridSize(st);
      if (r.gridSize > size) return { ok: false, message: 'This needs the big 3 by 3 grid. Build a Crafting Table first!' };
      E.clearGrid(st);
      const plan = E.planRecipe(st, r);
      if (plan.missing.length) return { ok: false, missing: plan.missing, message: 'You need ' + plan.missing.map(function (m) { return D.items[m].name; }).join(', ') + '.' };
      const ws = E.ws(st);
      plan.picks.forEach(function (id, i) {
        if (!id) return;
        const slot = r.type === 'shaped' ? (Math.floor(i / 3) * size + (i % 3)) : i;
        takeInv(ws, id, 1); ws.grid[slot] = id;
      });
      return { ok: true, target: 'grid' };
    }
    if (!E.hasStation(st, r.method)) return { ok: false, message: 'Craft a ' + D.items[STATION_ITEM[r.method]].name + ' first!' };
    const ws = E.ws(st), s = ws.stations[r.method];
    const keys = r.method === 'smelting' ? ['input'] : r.method === 'brewing' ? ['base', 'ingredient'] : ['template', 'base', 'addition'];
    keys.forEach(function (k) { if (s[k]) { addInv(st, ws, s[k], 1); s[k] = null; } });
    const plan = E.planRecipe(st, r);
    if (plan.missing.length) return { ok: false, missing: plan.missing, message: 'You need ' + plan.missing.map(function (m) { return D.items[m].name; }).join(', ') + '.' };
    plan.picks.forEach(function (id, i) { takeInv(ws, id, 1); s[keys[i]] = id; });
    return { ok: true, target: r.method };
  };
  // recipes the player can see in the book for an item
  E.knownRecipesFor = function (st, itemId) { return (I.byOutput[itemId] || []).filter(function (r) { return st.discoveredRecipes[r.id] || st.mode === 'sandbox'; }); };

  finalize();
})(typeof window !== 'undefined' ? (window.WOW = window.WOW || {}) : (globalThis.WOW = globalThis.WOW || {}));
