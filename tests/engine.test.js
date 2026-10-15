/* Workshop of Wonders - engine tests. Run: node tests/engine.test.js */
const W = require('../tools/load.js');
const E = W.Engine, D = W.Data;
let pass = 0, fail = 0; const failures = [];
function test(name, fn) { try { fn(); pass++; } catch (e) { fail++; failures.push(name + '\n    ' + e.message); } }
function eq(a, b, m) { if (a !== b) throw new Error((m || '') + ' expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a)); }
function ok(v, m) { if (!v) throw new Error(m || 'expected truthy'); }
function mem() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, _m: m }; }
function fresh(opts) {
  const st = E.newState();
  if (opts && opts.grid3) st.grid3 = true;
  return st;
}
function give(st, id, n) { const ws = E.ws(st); ws.inv[id] = (ws.inv[id] || 0) + n; if (ws.invOrder.indexOf(id) < 0) ws.invOrder.push(id); }
function grid(rows) { // rows of 3 strings of ids/null -> flat 9
  const g = new Array(9).fill(null);
  rows.forEach((r, y) => r.forEach((v, x) => { g[y * 3 + x] = v; }));
  return g;
}
function place(st, layout) { layout.forEach((id, i) => { if (id) { give(st, id, 1); const r = E.placeInGrid(st, id, i); if (!r.ok) throw new Error('place failed ' + id + ': ' + r.message); } }); }
const P = 'oak_planks', S = 'stick', _ = null;

// ---------------- dataset ----------------
test('dataset validates with no errors', () => { const v = E.validateData(); eq(v.errors.length, 0, v.errors.slice(0, 5).join('; ')); });
test('recipe count is within 300-500', () => { ok(D.recipes.length >= 300 && D.recipes.length <= 500, 'count ' + D.recipes.length); });
test('every recipe has hints, tier, category and source', () => { D.recipes.forEach(r => { ok(r.hints.length === 3 && r.tier >= 1 && r.category && r.sourceType && r.referenceVersion, r.id); }); });
test('no ambiguous grid recipes', () => { eq(E.findConflicts().length, 0); });
test('conflict detector catches an injected duplicate pattern', () => {
  D.build.shaped('stick', 1, ['P', 'P'], { P: 'birch_planks' }, { id: '__test_dup' });
  const r = D.recipes.pop();
  // run the same detector logic on a temporary index copy
  const saved = E.index.recipesByMethod.crafting_grid;
  r.pattern = r.pattern; r.height = 2; r.width = 1; r.gridSize = 2; r.ingredients = [{ itemId: 'birch_planks', quantity: 2 }];
  E.index.recipesByMethod.crafting_grid = saved.concat([r]);
  const c = E.findConflicts();
  E.index.recipesByMethod.crafting_grid = saved;
  ok(c.some(p => p.indexOf('__test_dup') >= 0 && p.indexOf('stick') >= 0), 'conflict not found');
});
test('original recipes are labelled and vanilla ones declare the reference version', () => {
  ok(E.index.byId.wonder_engine.sourceType === 'original_extension');
  ok(D.items.wonder_engine.isOriginalContent && !D.items.wonder_engine.isVanillaReference);
  eq(E.index.byId.crafting_table.referenceVersion, 'Minecraft Java Edition 1.21');
});

// ---------------- recipe correctness ----------------
test('shaped recipe matches its exact pattern (wooden pickaxe)', () => {
  eq(E.match(grid([[P, P, P], [_, S, _], [_, S, _]]), 3).id, 'wooden_pickaxe');
});
test('shaped recipe fails with wrong relative positions', () => {
  eq(E.match(grid([[P, P, P], [S, _, _], [_, S, _]]), 3), null);
});
test('shaped recipe succeeds when translated within the grid', () => {
  eq(E.match(grid([[_, _, _], [_, _, P], [_, _, P]]), 3).id, 'stick');
  eq(E.match(grid([[P, _, _], [P, _, _], [_, _, _]]), 3).id, 'stick');
});
test('shaped recipe accepts the horizontal mirror when allowed (axe)', () => {
  eq(E.match(grid([[P, P, _], [P, S, _], [_, S, _]]), 3).id, 'wooden_axe');
  eq(E.match(grid([[P, P, _], [S, P, _], [S, _, _]]), 3).id, 'wooden_axe');
});
test('shaped recipe is never treated as shapeless', () => {
  eq(E.match(grid([[P, S, _], [P, _, _], [P, S, _]]), 3), null);
});
test('empty slots inside a pattern are significant (chest needs a hole)', () => {
  eq(E.match(grid([[P, P, P], [P, _, P], [P, P, P]]), 3).id, 'chest');
  eq(E.match(grid([[P, P, P], [P, P, P], [P, P, P]]), 3), null);
});
test('shapeless recipe works in any arrangement', () => {
  eq(E.match(grid([['iron_ingot', _, _], [_, _, _], [_, _, 'flint']]), 3).id, 'flint_and_steel');
  eq(E.match(grid([[_, 'flint', _], ['iron_ingot', _, _], [_, _, _]]), 3).id, 'flint_and_steel');
});
test('shapeless recipe handles repeated ingredients and quantities', () => {
  const g = grid([['paper', 'paper', 'leather'], ['paper', _, _], [_, _, _]]);
  eq(E.match(g, 3).id, 'book');
  eq(E.match(grid([['paper', 'paper', 'leather'], [_, _, _], [_, _, _]]), 3), null, 'missing a paper');
});
test('shapeless recipe rejects extra ingredients', () => {
  eq(E.match(grid([['paper', 'paper', 'leather'], ['paper', 'paper', _], [_, _, _]]), 3), null);
});
test('tag ingredients accept any member (sticks from birch planks)', () => {
  eq(E.match(grid([['birch_planks', _, _], ['birch_planks', _, _], [_, _, _]]), 3).id, 'stick');
  eq(E.match(grid([['birch_planks', _, _], ['oak_planks', _, _], [_, _, _]]), 3).id, 'stick');
});
test('specific-wood recipes reject other woods (oak door needs oak)', () => {
  eq(E.match(grid([['oak_planks', 'oak_planks', _], ['oak_planks', 'oak_planks', _], ['oak_planks', 'oak_planks', _]]), 3).id, 'oak_door');
  eq(E.match(grid([['oak_planks', 'birch_planks', _], ['oak_planks', 'oak_planks', _], ['oak_planks', 'oak_planks', _]]), 3), null);
});
test('output quantities are correct', () => {
  eq(E.match(grid([[P, _, _], [P, _, _], [_, _, _]]), 3).output.quantity, 4);
  eq(E.match(grid([['glass', 'glass', 'glass'], ['glass', 'glass', 'glass'], [_, _, _]]), 3).output.quantity, 16);
  eq(E.index.byId.oak_planks.output.quantity, 4);
});
test('3x3 recipes cannot be made in the 2x2 grid', () => {
  // wooden pickaxe needs 3 rows; the 2x2 grid cannot hold it and the matcher refuses size-3 recipes
  eq(E.index.byId.wooden_pickaxe.gridSize, 3);
  const g2 = ['iron_ingot', 'flint', null, null];
  eq(E.match(g2, 2).id, 'flint_and_steel');
  eq(E.matchAll(['paper', 'paper', 'paper', 'leather'], 2)[0].id, 'book');
  const shapeless5 = E.index.byId.fermented_spider_eye; eq(shapeless5.gridSize, 2);
  eq(E.index.byId.beetroot_soup.gridSize, 3);
});
test('station-only recipes are not crafted in the grid', () => {
  eq(E.match(grid([['raw_iron', _, _], [_, _, _], [_, _, _]]), 3), null);
  const a = E.analyze(grid([['raw_iron', _, _], [_, _, _], [_, _, _]]), 3, fresh());
  eq(a.kind, 'station'); eq(a.station, 'furnace');
});
test('smelting requires the furnace to be discovered', () => {
  const st = fresh(); give(st, 'cobblestone', 1); give(st, 'coal', 1);
  const r = E.placeInStation(st, 'smelting', 'input', 'cobblestone');
  ok(!r.ok, 'should be locked'); eq(st.adventure.inv.cobblestone, 9, 'items not lost');
});
test('smelting consumes input and fuel correctly', () => {
  const st = fresh(); st.discoveredItems.furnace = 1;
  ok(E.placeInStation(st, 'smelting', 'input', 'cobblestone').ok);
  ok(E.placeInStation(st, 'smelting', 'fuel', 'coal').ok);
  const before = st.adventure.inv.coal;
  const res = E.runStation(st, 'smelting');
  ok(res.ok, res.message); eq(res.recipe.id, 'stone');
  eq(st.adventure.inv.stone, 1); eq(st.adventure.stations.smelting.heat, 28, 'coal = 8 smelts');
  eq(st.adventure.inv.coal, before, 'fuel taken from slot, not inventory');
});
test('furnace without fuel refuses and keeps the input', () => {
  const st = fresh(); st.discoveredItems.furnace = 1;
  E.placeInStation(st, 'smelting', 'input', 'sand');
  const res = E.runStation(st, 'smelting');
  ok(!res.ok && res.needFuel); eq(st.adventure.stations.smelting.input, 'sand');
});
test('non-fuel items are rejected from the fuel slot', () => {
  const st = fresh(); st.discoveredItems.furnace = 1;
  ok(!E.placeInStation(st, 'smelting', 'fuel', 'sand').ok); eq(st.adventure.inv.sand, 4);
});
test('brewing and smithing use their own methods and stations', () => {
  const st = fresh(); give(st, 'water_bottle', 1); give(st, 'nether_wart', 1);
  ok(!E.placeInStation(st, 'brewing', 'base', 'water_bottle').ok, 'locked without stand');
  st.discoveredItems.brewing_stand = 1;
  ok(E.placeInStation(st, 'brewing', 'base', 'water_bottle').ok); ok(E.placeInStation(st, 'brewing', 'ingredient', 'nether_wart').ok);
  eq(E.runStation(st, 'brewing').recipe.id, 'awkward_potion');
  st.discoveredItems.smithing_table = 1;
  give(st, 'netherite_upgrade_smithing_template', 1); give(st, 'diamond_sword', 1); give(st, 'netherite_ingot', 1);
  E.placeInStation(st, 'smithing', 'template', 'netherite_upgrade_smithing_template'); E.placeInStation(st, 'smithing', 'base', 'diamond_sword'); E.placeInStation(st, 'smithing', 'addition', 'netherite_ingot');
  const r = E.runStation(st, 'smithing'); eq(r.recipe.id, 'netherite_sword'); eq(st.adventure.inv.diamond_sword, 0);
});

// ---------------- inventory correctness ----------------
test('placing and collecting consumes exactly the ingredients', () => {
  const st = fresh();
  ok(E.placeInGrid(st, 'oak_log', 0).ok);
  eq(st.adventure.inv.oak_log, 7);
  const r = E.collect(st);
  ok(r.ok); eq(st.adventure.inv.oak_planks, 4); eq(st.adventure.inv.oak_log, 7);
  ok(st.adventure.grid.every(x => x === null));
});
test('repeated collect cannot duplicate output', () => {
  const st = fresh(); E.placeInGrid(st, 'oak_log', 0);
  ok(E.collect(st).ok); ok(!E.collect(st).ok); ok(!E.collect(st).ok);
  eq(st.adventure.inv.oak_planks, 4);
});
test('invalid combinations never destroy ingredients', () => {
  const st = fresh();
  E.placeInGrid(st, 'dirt', 0); E.placeInGrid(st, 'sand', 3);
  const total = E.totalItems(st.adventure);
  ok(!E.collect(st).ok); eq(E.totalItems(st.adventure), total);
  E.clearGrid(st); eq(st.adventure.inv.dirt, 4); eq(st.adventure.inv.sand, 4);
});
test('removing an ingredient returns it to inventory', () => {
  const st = fresh(); E.placeInGrid(st, 'coal', 2); eq(st.adventure.inv.coal, 3);
  ok(E.removeFromGrid(st, 2).ok); eq(st.adventure.inv.coal, 4); eq(st.adventure.grid[2], null);
});
test('placing on an occupied slot swaps and returns the old item', () => {
  const st = fresh(); E.placeInGrid(st, 'coal', 0); E.placeInGrid(st, 'sand', 0);
  eq(st.adventure.grid[0], 'sand'); eq(st.adventure.inv.coal, 4); eq(st.adventure.inv.sand, 3);
});
test('cannot place an item you do not have', () => {
  const st = fresh(); const r = E.placeInGrid(st, 'diamond', 0); ok(!r.ok); eq(st.adventure.grid[0], null);
});
test('unlimited resources can be replenished, locked ones cannot', () => {
  const st = fresh(); ok(E.replenish(st, 'oak_log', 64).ok); eq(st.adventure.inv.oak_log, 72);
  ok(!E.replenish(st, 'raw_iron', 5).ok); eq(st.adventure.inv.raw_iron, undefined);
});
test('inventory sorting preserves all quantities', () => {
  const st = fresh(); give(st, 'diamond', 3); give(st, 'stick', 12); give(st, 'apple', 2);
  const before = JSON.stringify(Object.entries(st.adventure.inv).sort());
  E.sortInventory(st);
  eq(JSON.stringify(Object.entries(st.adventure.inv).sort()), before);
  eq(st.adventure.invOrder.length, Object.keys(st.adventure.inv).filter(k => st.adventure.inv[k] > 0).length);
});
test('large stacks and repeated crafting stay consistent', () => {
  const st = fresh(); E.replenish(st, 'oak_log', 999); const start = st.adventure.inv.oak_log;
  for (let i = 0; i < 200; i++) { E.placeInGrid(st, 'oak_log', i % 4); ok(E.collect(st).ok); }
  eq(st.adventure.inv.oak_log, start - 200); eq(st.adventure.inv.oak_planks, 800);
});
test('repeat refills the last layout only when ingredients exist', () => {
  const st = fresh(); E.placeInGrid(st, 'oak_log', 1); E.collect(st);
  ok(E.repeat(st).ok); eq(st.adventure.grid[1], 'oak_log');
  E.collect(st); st.adventure.inv.oak_log = 0;
  const r = E.repeat(st); ok(!r.ok && r.missing[0] === 'oak_log');
});
test('remainders are returned (cake gives back buckets)', () => {
  const st = fresh({ grid3: true });
  place(st, grid([['milk_bucket', 'milk_bucket', 'milk_bucket'], ['sugar', 'egg', 'sugar'], ['wheat', 'wheat', 'wheat']]));
  const r = E.collect(st); ok(r.ok); eq(r.recipe.id, 'cake'); eq(st.adventure.inv.cake, 1); eq(st.adventure.inv.bucket, 3);
});

// ---------------- discovery and progression ----------------
test('first craft records a discovery once', () => {
  const st = fresh(); E.placeInGrid(st, 'oak_log', 0); const a = E.collect(st); ok(a.firstItem && a.firstRecipe);
  E.placeInGrid(st, 'oak_log', 0); const b = E.collect(st); ok(!b.firstItem && !b.firstRecipe);
  eq(Object.keys(st.discoveredItems).filter(k => k === 'oak_planks').length, 1);
});
test('quest chain completes in order and respects prerequisites', () => {
  const st = fresh();
  st.crafted.stick = 1; // sticks crafted before planks quest is done
  let r = E.evaluateQuests(st); ok(!st.quests.t1_sticks, 'sticks quest must wait for planks');
  E.placeInGrid(st, 'oak_log', 0); r = E.collect(st);
  ok(st.quests.t1_planks && st.quests.t1_sticks, 'both complete once prerequisite is met');
});
test('crafting table quest unlocks the 3x3 grid and returns 2x2 items', () => {
  const st = fresh(); E.replenish(st, 'oak_log', 4);
  E.placeInGrid(st, 'oak_log', 0); E.collect(st);
  E.placeInGrid(st, 'oak_planks', 0); E.placeInGrid(st, 'oak_planks', 2); E.collect(st); // 2x2 vertical = sticks
  eq(E.gridSize(st), 2);
  E.placeInGrid(st, 'oak_log', 0); E.collect(st);
  [0, 1, 2, 3].forEach(i => E.placeInGrid(st, 'oak_planks', i));
  const r = E.collect(st); eq(r.recipe.id, 'crafting_table');
  ok(st.grid3); eq(E.gridSize(st), 3); ok(r.unlocks.some(u => u.type === 'grid3'));
});
test('locked content does not unlock prematurely', () => {
  const st = fresh(); ok(st.biomes.indexOf('forge') < 0); ok(st.resources.indexOf('raw_iron') < 0); eq(st.tier, 1);
  st.crafted.wooden_pickaxe = 1; E.evaluateQuests(st); ok(st.biomes.indexOf('forest') < 0, 'needs crafting table quest first');
});
test('milestone opens the next tier and biome resources', () => {
  const st = fresh();
  ['oak_planks', 'stick', 'crafting_table', 'wooden_pickaxe', 'furnace', 'stone_pickaxe', 'stone_axe', 'chest', 'torch', 'glass'].forEach(id => { st.crafted[id] = 1; });
  E.evaluateQuests(st);
  eq(st.tier, 2); ok(st.biomes.indexOf('forge') >= 0); ok(E.replenish(st, 'raw_iron', 1).ok);
});
test('full playthrough simulation completes every quest and unlocks sandbox', () => {
  const sim = E.simulateProgression();
  eq(Object.keys(sim.questDone).length, D.quests.length); eq(sim.finalTier, 6);
});
test('sandbox unlocks only at the Wonder Engine and keeps adventure separate', () => {
  const st = fresh(); ok(!E.setMode(st, 'sandbox').ok);
  st.sandboxUnlocked = true; give(st, 'diamond', 5);
  ok(E.setMode(st, 'sandbox').ok); eq(E.count(st, 'diamond'), 0, 'sandbox has its own bag');
  ok(E.replenish(st, 'nether_star', 3).ok, 'sandbox supply has everything');
  eq(E.gridSize(st), 3); ok(E.hasStation(st, 'brewing'));
  E.setMode(st, 'adventure'); eq(E.count(st, 'diamond'), 5);
});
test('wonder engine quest grants sandbox in a real state', () => {
  const st = fresh(); D.quests.forEach(q => { if (q.id !== 't6_engine') st.quests[q.id] = 1; });
  st.crafted.wonder_engine = 1; const r = E.evaluateQuests(st); ok(st.sandboxUnlocked); ok(r.unlocks.some(u => u.type === 'sandbox'));
});

// ---------------- hints ----------------
test('hint: right ingredients in the wrong arrangement', () => {
  const st = fresh({ grid3: true });
  const a = E.analyze(grid([[P, P, P], [S, _, _], [_, S, _]]), 3, st); eq(a.kind, 'arrangement');
});
test('hint: needs another ingredient points to a real recipe', () => {
  const st = fresh({ grid3: true });
  const a = E.analyze(grid([['paper', 'paper', _], [_, _, _], [_, _, _]]), 3, st);
  eq(a.kind, 'more'); ok(a.recipe.ingredients.some(i => i.itemId === 'paper'), 'related recipe');
});
test('hint: never reveals unrelated recipes for nonsense', () => {
  const a = E.analyze(grid([['dirt', 'diamond', _], [_, 'feather', _], [_, _, 'ink_sac']]), 3, fresh());
  eq(a.kind, 'none'); eq(a.recipe, undefined);
});
test('hint: secret recipes are never hinted', () => {
  const a = E.analyze(grid([['chain', _, _], ['glass', 'amethyst_shard', _], [_, _, _]]), 3, fresh());
  ok(!a.recipe || !a.recipe.secret);
});
test('hint: big recipe in small grid asks for crafting table', () => {
  const a = E.analyze(['oak_planks', 'oak_planks', 'oak_planks', 'oak_planks'].concat([null, null, null, null, null]), 3, fresh());
  ok(a.kind !== 'bigger_grid'); // crafting table itself fits 2x2
  const b = E.analyze(['wheat', 'wheat', 'wheat', null], 2, fresh()); // bread is 3 wide
  ok(b.kind === 'bigger_grid' || b.kind === 'more', b.kind);
});

// ---------------- save, import, export ----------------
test('progress survives a save/load cycle', () => {
  const s = mem(), store = E.Store(s);
  const st = fresh(); E.placeInGrid(st, 'oak_log', 0); E.collect(st); st.settings.sound = true; st.settings.hints = false;
  ok(store.save(st).ok);
  const l = store.load(); eq(l.status, 'loaded');
  eq(l.state.adventure.inv.oak_planks, 4); eq(l.state.adventure.inv.oak_log, 7);
  ok(l.state.discoveredItems.oak_planks); ok(l.state.quests.t1_planks);
  eq(l.state.settings.sound, true); eq(l.state.settings.hints, false);
});
test('valid export can be imported', () => {
  const st = fresh(); st.adventure.inv.coal = 77; const txt = E.exportSave(st);
  const r = E.importSave(txt); ok(r.ok, (r.errors || []).join()); eq(r.state.adventure.inv.coal, 77);
});
test('invalid JSON is rejected safely', () => { const r = E.importSave('{oops'); ok(!r.ok); });
test('unknown item ids are rejected', () => {
  const o = JSON.parse(E.exportSave(fresh())); o.adventure.inv.super_sword_9000 = 1;
  ok(!E.importSave(JSON.stringify(o)).ok);
});
test('wrong types are rejected', () => {
  const o = JSON.parse(E.exportSave(fresh())); o.adventure.inv.coal = '5'; ok(!E.importSave(JSON.stringify(o)).ok);
  const o2 = JSON.parse(E.exportSave(fresh())); o2.grid3 = 'yes'; ok(!E.importSave(JSON.stringify(o2)).ok);
});
test('newer save versions are refused gracefully', () => {
  const o = JSON.parse(E.exportSave(fresh())); o.schema = 99; const r = E.importSave(JSON.stringify(o)); ok(!r.ok); ok(/newer/.test(r.errors[0]));
});
test('older schema 1 saves are migrated', () => {
  const o = JSON.parse(E.exportSave(fresh()));
  const v1 = Object.assign({}, o, { schema: 1, inv: { coal: 9 }, invOrder: ['coal'], grid: new Array(9).fill(null), stations: o.adventure.stations });
  delete v1.adventure; delete v1.sandbox; delete v1.mode;
  const r = E.importSave(JSON.stringify(v1)); ok(r.ok, (r.errors || []).join()); eq(r.state.adventure.inv.coal, 9);
});
test('importing a bad save does not change current progress', () => {
  const s = mem(), store = E.Store(s); const st = fresh(); st.adventure.inv.coal = 50; store.save(st);
  const r = E.importSave('{"schema":2,"adventure":5}'); ok(!r.ok);
  eq(store.load().state.adventure.inv.coal, 50);
});
test('imported data cannot inject extra keys or code', () => {
  const o = JSON.parse(E.exportSave(fresh())); o.__proto__polluted = 1; o.evil = '<script>alert(1)</script>';
  const r = E.importSave(JSON.stringify(o)); ok(r.ok); eq(r.state.evil, undefined);
});
test('corrupt main save falls back to the backup', () => {
  const s = mem(), store = E.Store(s); const st = fresh(); st.adventure.inv.coal = 11; store.save(st);
  st.adventure.inv.coal = 12; store.save(st); // previous valid save becomes backup
  s.setItem('wow-save', '{corrupt');
  const l = store.load(); eq(l.status, 'recovered'); eq(l.state.adventure.inv.coal, 11);
  ok(s.getItem('wow-save-corrupt'), 'corrupt data preserved for inspection');
});
test('missing save starts a new game', () => { eq(E.Store(mem()).load().status, 'new'); });
test('reset requires explicit confirmation', () => {
  const s = mem(), store = E.Store(s); const st = fresh(); st.adventure.inv.coal = 42; store.save(st);
  ok(!store.reset().ok); ok(!store.reset('yes').ok); eq(store.load().state.adventure.inv.coal, 42);
  ok(store.reset(true).ok); eq(store.load().status, 'new');
});
test('never saves invalid state over a valid save', () => {
  const s = mem(), store = E.Store(s); const st = fresh(); st.adventure.inv.coal = 5; store.save(st);
  st.adventure.inv.not_an_item = 3; ok(!store.save(st).ok);
  eq(store.load().state.adventure.inv.coal, 5);
});


// ---------------- autofill from the book ----------------
test('autofill places a shaped recipe and it crafts', () => {
  const st = fresh({ grid3: true }); give(st, 'oak_planks', 3); give(st, 'stick', 2);
  const r = E.autofill(st, 'wooden_pickaxe'); ok(r.ok, r.message);
  eq(E.currentMatch(st).id, 'wooden_pickaxe'); ok(E.collect(st).ok); eq(st.adventure.inv.wooden_pickaxe, 1);
});
test('autofill picks tag members the player owns', () => {
  const st = fresh({ grid3: true }); give(st, 'cherry_planks', 2);
  ok(E.autofill(st, 'stick').ok); eq(E.currentMatch(st).id, 'stick');
});
test('autofill reports missing items without consuming anything', () => {
  const st = fresh({ grid3: true }); const before = E.totalItems(st.adventure);
  const r = E.autofill(st, 'diamond_pickaxe'); ok(!r.ok && r.missing.length); eq(E.totalItems(st.adventure), before);
});
test('autofill respects the 2x2 grid limit', () => { const st = fresh(); ok(!E.autofill(st, 'wooden_pickaxe').ok); });


test('own save survives an update that retired an item', () => {
  const s = mem(), store = E.Store(s); const st = fresh(); st.adventure.inv.coal = 13; store.save(st);
  const o = JSON.parse(s.getItem('wow-save')); o.adventure.inv.old_removed_thing = 4; o.adventure.invOrder.push('old_removed_thing');
  o.discoveredItems.old_removed_thing = 1; o.adventure.grid[0] = 'old_removed_thing'; o.quests.old_quest = 1;
  s.setItem('wow-save', JSON.stringify(o));
  const l = store.load(); eq(l.status, 'updated'); eq(l.state.adventure.inv.coal, 13);
  eq(l.state.adventure.inv.old_removed_thing, undefined); eq(l.state.adventure.grid[0], null); ok(l.removed.indexOf('old_removed_thing') >= 0);
});
test('imports stay strict about unknown ids', () => {
  const o = JSON.parse(E.exportSave(fresh())); o.adventure.inv.old_removed_thing = 1; o.adventure.invOrder.push('old_removed_thing');
  ok(!E.importSave(JSON.stringify(o)).ok);
});


test('TNT uses the real checkerboard recipe', () => {
  const G = 'gunpowder', Sd = 'sand';
  const r = E.match(grid([[G, Sd, G], [Sd, G, Sd], [G, Sd, G]]), 3); eq(r && r.id, 'tnt'); eq(r.output.quantity, 1);
  eq(E.match(grid([[Sd, G, Sd], [G, Sd, G], [Sd, G, Sd]]), 3), null, 'swapped checkerboard is not TNT');
  eq(D.items.tnt.tier, 4); eq(D.items.gunpowder.tier, 4);
});
test('gunpowder unlocks with the Clockwork Room', () => {
  const st = fresh(); ['oak_planks','stick','crafting_table','wooden_pickaxe','furnace','stone_pickaxe','stone_axe','chest','torch','glass','iron_ingot','bucket','iron_pickaxe','iron_helmet','diamond_pickaxe','anvil','lantern','smithing_table','bread','cookie','red_dye','red_wool','book','cake','pumpkin_pie'].forEach(i => { st.crafted[i] = 1; });
  E.evaluateQuests(st); ok(st.biomes.indexOf('machine') >= 0); ok(E.replenish(st, 'gunpowder', 5).ok);
});
test('older saves get supplies added to areas they already opened', () => {
  const st = fresh(); st.biomes.push('machine'); st.resources = st.resources.filter(r => r !== 'gunpowder');
  const r = E.importSave(E.exportSave(st)); ok(r.ok); ok(r.state.resources.indexOf('gunpowder') >= 0); ok(r.state.discoveredItems.gunpowder);
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
failures.forEach(f => console.log('  FAIL ' + f));
process.exit(fail ? 1 : 0);
