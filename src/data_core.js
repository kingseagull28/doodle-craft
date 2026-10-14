/* Workshop of Wonders - item and recipe catalog (part 1: builders + wood + stone).
   One authoritative dataset drives crafting, the book, hints and quests.
   Vanilla references: Minecraft Java Edition 1.21 crafting/smelting/brewing/smithing. */
(function (W) {
  'use strict';
  const REF = 'Minecraft Java Edition 1.21';
  const D = W.Data = W.Data || {};
  const ITEMS = D.items = {};
  const ORDER = D.itemOrder = [];
  const RECIPES = D.recipes = [];
  D.referenceVersion = REF;

  D.categories = [
    ['materials', 'Materials'], ['wood_stone', 'Wood and stone'], ['tools', 'Tools'],
    ['building', 'Building blocks'], ['metals_gems', 'Metals and gems'], ['farming_food', 'Farming and food'],
    ['animals', 'Animals and creatures'], ['transport', 'Transportation'], ['machinery', 'Machinery'],
    ['armor', 'Armor and equipment'], ['magic', 'Potions and magic'], ['legendary', 'Legendary creations']
  ];
  D.tiers = [
    null,
    { n: 1, name: 'Wood and stone', color: '#a8783e' },
    { n: 2, name: 'Metals and gems', color: '#8fb8d8' },
    { n: 3, name: 'Farming and cooking', color: '#6fbf4a' },
    { n: 4, name: 'Redstone and machines', color: '#d8433a' },
    { n: 5, name: 'Magic and secrets', color: '#a15ae0' },
    { n: 6, name: 'Legendary creations', color: '#f7c843' }
  ];

  // ---------- builders ----------
  function item(id, name, cat, tier, icon, desc, tags, o) {
    o = o || {};
    if (ITEMS[id]) throw new Error('Duplicate item id: ' + id);
    ITEMS[id] = {
      id: id, name: name, description: desc, category: cat, tier: tier, icon: icon,
      tags: tags || [], stackLimit: o.stack || 64, isVanillaReference: !o.orig, isOriginalContent: !!o.orig,
      secret: !!o.secret, resource: !!o.res, fuel: o.fuel || 0, unlockRequirements: o.unlock || []
    };
    ORDER.push(id);
    return ITEMS[id];
  }
  function base(o, out, qty) {
    o = o || {};
    return {
      id: o.id || out, output: { itemId: out, quantity: qty }, sourceType: o.orig ? 'original_extension' : 'vanilla_reference',
      referenceVersion: o.orig ? 'Workshop of Wonders original' : REF, remainders: o.rem || [], secret: !!o.secret,
      discoveryMessage: o.msg || '', unlockRequirements: o.req || [], note: o.note || ''
    };
  }
  function shaped(out, qty, pat, key, o) {
    const r = base(o, out, qty);
    r.method = 'crafting_grid'; r.type = 'shaped'; r.mirror = !(o && o.mirror === false);
    r.pattern = pat.map(function (row) {
      return row.split('').map(function (ch) {
        if (ch === '.') return null;
        if (!key[ch]) throw new Error('Pattern key ' + ch + ' missing in ' + r.id);
        return key[ch];
      });
    });
    RECIPES.push(r); return r;
  }
  function shapeless(out, qty, list, o) {
    const r = base(o, out, qty);
    r.method = 'crafting_grid'; r.type = 'shapeless'; r.list = list.slice();
    RECIPES.push(r); return r;
  }
  function smelt(out, input, o) {
    const r = base(o, out, 1);
    r.method = 'smelting'; r.input = input; RECIPES.push(r); return r;
  }
  function brew(out, potionBase, ingr, o) {
    const r = base(o, out, 1);
    r.method = 'brewing'; r.base = potionBase; r.ingredient = ingr; RECIPES.push(r); return r;
  }
  function smith(out, tpl, b, add, o) {
    const r = base(o, out, 1);
    r.method = 'smithing'; r.template = tpl; r.base = b; r.addition = add; RECIPES.push(r); return r;
  }
  D.build = { item: item, shaped: shaped, shapeless: shapeless, smelt: smelt, brew: brew, smith: smith };

  const sh = W.Icons.shade;
  const B = function (s, a, extra) { return Object.assign({ t: 'block', s: s, a: a }, extra || {}); };
  const MK = function (m, s, a, extra) { return { t: 'mask', m: m, base: Object.assign({ s: s, a: a }, extra || {}) }; };

  // ---------- starting basics ----------
  item('dirt', 'Dirt', 'materials', 1, B('speckle', '#8b5e3c', { b: '#5e3d22', x: '#a0714a' }), 'Soft brown ground. Great for gardens.', ['soil', 'building_material'], { res: true });
  item('cobblestone', 'Cobblestone', 'wood_stone', 1, B('cobble', '#8a8a8a'), 'Bumpy stone. The start of every stone tool.', ['stone', 'building_material'], { res: true });
  item('sand', 'Sand', 'materials', 1, B('speckle', '#dbd3a0', { b: '#c8bd86', x: '#ece5b8', p: 0.15 }), 'Smelt it to make glass.', ['sand'], { res: true });
  item('coal', 'Coal', 'materials', 1, { t: 'lump', a: '#3a3a3a', x: '#1d1d1d' }, 'Black fuel for furnaces and torches.', ['coals', 'fuel'], { res: true, fuel: 32 });

  // ---------- wood families ----------
  const WOODS = [
    ['oak', 'Oak', '#b8945f', { a: '#6b5232' }],
    ['spruce', 'Spruce', '#7a5a34', { a: '#3b2a1a' }],
    ['birch', 'Birch', '#d7c185', { a: '#e3e0d2', b: '#2a2a2a', spots: true, spotColor: '#2a2a2a' }],
    ['jungle', 'Jungle', '#b07a52', { a: '#5a4a24' }],
    ['acacia', 'Acacia', '#ad5d32', { a: '#676157' }],
    ['dark_oak', 'Dark Oak', '#5a3b1c', { a: '#3c2c18' }],
    ['mangrove', 'Mangrove', '#8a3d36', { a: '#5a4632' }],
    ['cherry', 'Cherry', '#e3b3ad', { a: '#3a2430' }]
  ];
  D.woods = WOODS.map(function (w) { return w[0]; });
  WOODS.forEach(function (w) {
    const id = w[0], N = w[1], pc = w[2], P = id + '_planks';
    item(id + '_log', N + ' Log', 'wood_stone', 1, Object.assign({ t: 'block', s: 'log' }, w[3], w[3].b ? {} : { b: sh(w[3].a, -0.3) }), 'A chunk of ' + N.toLowerCase() + ' tree. Turn it into planks.', ['wood', 'logs', 'fuel'], { res: true, fuel: 6 });
    item(P, N + ' Planks', 'wood_stone', 1, B('planks', pc), 'Flat ' + N.toLowerCase() + ' boards for building and crafting.', ['wood', 'planks', 'fuel'], { fuel: 6 });
    item(id + '_slab', N + ' Slab', 'building', 1, MK('slab', 'planks', pc), 'Half a block of ' + N.toLowerCase() + ' wood.', ['wood', 'wooden_slabs', 'fuel'], { fuel: 3 });
    item(id + '_stairs', N + ' Stairs', 'building', 1, MK('stairs', 'planks', pc), 'Step up! ' + N + ' stairs.', ['wood', 'stairs']);
    item(id + '_fence', N + ' Fence', 'building', 1, MK('fence', 'planks', pc), 'Keeps animals in the garden.', ['wood', 'fence']);
    item(id + '_fence_gate', N + ' Fence Gate', 'building', 1, MK('gate', 'planks', pc), 'A fence that opens like a door.', ['wood', 'fence']);
    item(id + '_door', N + ' Door', 'building', 1, { t: 'door', a: pc, x: sh(pc, -0.45) }, 'A tall wooden door.', ['wood', 'door']);
    item(id + '_trapdoor', N + ' Trapdoor', 'building', 1, { t: 'trapdoor', a: pc }, 'A little door for floors.', ['wood', 'door']);
    item(id + '_sign', N + ' Sign', 'building', 1, { t: 'sign', a: pc }, 'Write a message for visitors.', ['wood', 'decor']);
    item(id + '_boat', N + ' Boat', 'transport', 1, { t: 'boat', a: pc }, 'Float across lakes and rivers.', ['wood', 'vehicle', 'vehicle_boat']);
    item(id + '_button', N + ' Button', 'machinery', 1, { t: 'button', a: pc }, 'Press it to send a quick signal.', ['wood', 'redstone_input']);
    item(id + '_pressure_plate', N + ' Pressure Plate', 'machinery', 1, { t: 'plate', a: pc }, 'Step on it to send a signal.', ['wood', 'redstone_input']);

    shapeless(P, 4, [id + '_log'], { id: P });
    shaped(id + '_slab', 6, ['PPP'], { P: P });
    shaped(id + '_stairs', 4, ['P..', 'PP.', 'PPP'], { P: P });
    shaped(id + '_fence', 3, ['PSP', 'PSP'], { P: P, S: 'stick' });
    shaped(id + '_fence_gate', 1, ['SPS', 'SPS'], { P: P, S: 'stick' });
    shaped(id + '_door', 3, ['PP', 'PP', 'PP'], { P: P });
    shaped(id + '_trapdoor', 2, ['PPP', 'PPP'], { P: P });
    shaped(id + '_sign', 3, ['PPP', 'PPP', '.S.'], { P: P, S: 'stick' });
    shaped(id + '_boat', 1, ['P.P', 'PPP'], { P: P });
    shapeless(id + '_button', 1, [P]);
    shaped(id + '_pressure_plate', 1, ['PP'], { P: P });
  });

  // ---------- shared wood crafts ----------
  item('stick', 'Stick', 'wood_stone', 1, { t: 'stick' }, 'Handles for tools, torches and more.', ['wood', 'fuel'], { fuel: 2 });
  item('crafting_table', 'Crafting Table', 'wood_stone', 1, B('planks', '#b8945f', { face: 'table' }), 'A bigger workbench. Unlocks the 3 by 3 grid!', ['station']);
  item('chest', 'Chest', 'wood_stone', 1, B('planks', '#a8783e', { face: 'latch' }), 'A box to keep your treasures.', ['storage']);
  item('barrel', 'Barrel', 'wood_stone', 1, B('planks', '#8a6a3e', { face: 'barrel' }), 'Round wooden storage.', ['storage']);
  item('bowl', 'Bowl', 'farming_food', 1, { t: 'bowl_empty', a: '#8a6038' }, 'Holds soups and stews.', ['wood', 'container']);
  item('ladder', 'Ladder', 'building', 1, { t: 'ladder' }, 'Climb up and down.', ['wood', 'climb']);
  item('charcoal', 'Charcoal', 'materials', 1, { t: 'lump', a: '#4a3a30', x: '#2a1d16' }, 'Fuel made by cooking logs.', ['coals', 'fuel'], { fuel: 32 });
  item('torch', 'Torch', 'building', 1, { t: 'torch' }, 'A little flame that lights the dark.', ['light']);
  item('campfire', 'Campfire', 'building', 1, { t: 'campfire' }, 'Cozy flames for a camping night.', ['light', 'decor']);
  shaped('stick', 4, ['P', 'P'], { P: '#planks' });
  shaped('crafting_table', 1, ['PP', 'PP'], { P: '#planks' });
  shaped('chest', 1, ['PPP', 'P.P', 'PPP'], { P: '#planks' });
  shaped('barrel', 1, ['PSP', 'P.P', 'PSP'], { P: '#planks', S: '#wooden_slabs' });
  shaped('bowl', 4, ['P.P', '.P.'], { P: '#planks' });
  shaped('ladder', 3, ['S.S', 'SSS', 'S.S'], { S: 'stick' });
  smelt('charcoal', '#logs');
  shaped('torch', 4, ['C', 'S'], { C: '#coals', S: 'stick' });
  shaped('campfire', 1, ['.S.', 'SCS', 'LLL'], { S: 'stick', C: '#coals', L: '#logs' });

  // ---------- tool and armor helpers ----------
  const TOOLS = [
    ['pickaxe', 'Pickaxe', ['MMM', '.S.', '.S.'], 'Digs stone and ore.'],
    ['axe', 'Axe', ['MM', 'MS', '.S'], 'Chops wood quickly.'],
    ['shovel', 'Shovel', ['M', 'S', 'S'], 'Digs dirt, sand and gravel.'],
    ['hoe', 'Hoe', ['MM', '.S', '.S'], 'Gets soil ready for seeds.'],
    ['sword', 'Sword', ['M', 'M', 'S'], 'A trusty blade for adventures.']
  ];
  D.toolKinds = TOOLS.map(function (t) { return t[0]; });
  function toolSet(prefix, N, mat, tier, color, extraTag) {
    TOOLS.forEach(function (t) {
      const id = prefix + '_' + t[0];
      item(id, N + ' ' + t[1], 'tools', tier, { t: t[0], a: color }, t[3] + ' Made of ' + N.toLowerCase() + '.', ['tool', t[0], prefix].concat(extraTag || []));
      shaped(id, 1, t[2], { M: mat, S: 'stick' });
    });
  }
  const ARMOR = [
    ['helmet', 'Helmet', ['MMM', 'M.M']], ['chestplate', 'Chestplate', ['M.M', 'MMM', 'MMM']],
    ['leggings', 'Leggings', ['MMM', 'M.M', 'M.M']], ['boots', 'Boots', ['M.M', 'M.M']]
  ];
  D.armorKinds = ARMOR.map(function (a) { return a[0]; });
  function armorSet(prefix, N, mat, tier, color) {
    ARMOR.forEach(function (a) {
      const id = prefix + '_' + a[0];
      item(id, N + ' ' + a[1], 'armor', tier, { t: a[0], a: color }, 'Protective ' + N.toLowerCase() + ' ' + a[1].toLowerCase() + '.', ['armor', a[0], prefix]);
      shaped(id, 1, a[2], { M: mat });
    });
  }
  D.toolSet = toolSet; D.armorSet = armorSet;
  toolSet('wooden', 'Wooden', '#planks', 1, '#b8945f');

  // ---------- stone ----------
  item('stone', 'Stone', 'wood_stone', 1, B('noise', '#7d7d7d', { amt: 0.06 }), 'Smooth grey stone, made by smelting cobblestone.', ['stone', 'building_material']);
  item('furnace', 'Furnace', 'wood_stone', 1, B('cobble', '#7a7a7a', { face: 'mouth', lit: true }), 'Cooks food and smelts ores. Opens the Furnace station.', ['station']);
  shaped('furnace', 1, ['CCC', 'C.C', 'CCC'], { C: 'cobblestone' });
  smelt('stone', 'cobblestone');
  toolSet('stone', 'Stone', 'cobblestone', 1, '#8a8a8a');

  function stoneFamily(baseId, N, tex, slab, stairs, wall) {
    if (slab) { item(baseId + '_slab', N + ' Slab', 'building', 1, MK('slab', tex.s, tex.a, tex), 'Half a block of ' + N.toLowerCase() + '.', ['stone', 'slab']); shaped(baseId + '_slab', 6, ['PPP'], { P: baseId }); }
    if (stairs) { item(baseId + '_stairs', N + ' Stairs', 'building', 1, MK('stairs', tex.s, tex.a, tex), N + ' steps.', ['stone', 'stairs']); shaped(baseId + '_stairs', 4, ['P..', 'PP.', 'PPP'], { P: baseId }); }
    if (wall) { item(baseId + '_wall', N + ' Wall', 'building', 1, MK('wall', tex.s, tex.a, tex), 'A sturdy ' + N.toLowerCase() + ' wall.', ['stone', 'wall']); shaped(baseId + '_wall', 6, ['PPP', 'PPP'], { P: baseId }); }
  }
  // cobblestone family uses "cobblestone_slab" etc.
  stoneFamily('cobblestone', 'Cobblestone', { s: 'cobble', a: '#8a8a8a' }, true, true, true);
  item('stone_slab', 'Stone Slab', 'building', 1, MK('slab', 'noise', '#7d7d7d'), 'Half a block of stone.', ['stone', 'slab']);
  shaped('stone_slab', 6, ['PPP'], { P: 'stone' });
  item('stone_stairs', 'Stone Stairs', 'building', 1, MK('stairs', 'noise', '#7d7d7d'), 'Smooth stone steps.', ['stone', 'stairs']);
  shaped('stone_stairs', 4, ['P..', 'PP.', 'PPP'], { P: 'stone' });
  item('stone_bricks', 'Stone Bricks', 'building', 1, B('stonebricks', '#7d7d7d'), 'Neat stone bricks for castles.', ['stone', 'building_material']);
  shaped('stone_bricks', 4, ['SS', 'SS'], { S: 'stone' });
  item('stone_brick_slab', 'Stone Brick Slab', 'building', 1, MK('slab', 'stonebricks', '#7d7d7d'), 'Half a block of stone bricks.', ['stone', 'slab']);
  shaped('stone_brick_slab', 6, ['PPP'], { P: 'stone_bricks' });
  item('stone_brick_stairs', 'Stone Brick Stairs', 'building', 1, MK('stairs', 'stonebricks', '#7d7d7d'), 'Castle steps.', ['stone', 'stairs']);
  shaped('stone_brick_stairs', 4, ['P..', 'PP.', 'PPP'], { P: 'stone_bricks' });
  item('stone_brick_wall', 'Stone Brick Wall', 'building', 1, MK('wall', 'stonebricks', '#7d7d7d'), 'A castle wall.', ['stone', 'wall']);
  shaped('stone_brick_wall', 6, ['PPP', 'PPP'], { P: 'stone_bricks' });
  item('cracked_stone_bricks', 'Cracked Stone Bricks', 'building', 1, B('stonebricks', '#7a7a7a', { crack: true }), 'Old, cracked bricks. Spooky!', ['stone']);
  smelt('cracked_stone_bricks', 'stone_bricks');
  item('chiseled_stone_bricks', 'Chiseled Stone Bricks', 'building', 1, B('chiseled', '#7d7d7d'), 'Fancy carved stone.', ['stone']);
  shaped('chiseled_stone_bricks', 1, ['S', 'S'], { S: 'stone_brick_slab' });
  item('smooth_stone', 'Smooth Stone', 'building', 1, B('smooth', '#a0a0a0'), 'Extra-smooth stone.', ['stone']);
  smelt('smooth_stone', 'stone');
  item('smooth_stone_slab', 'Smooth Stone Slab', 'building', 1, MK('slab', 'smooth', '#a0a0a0'), 'A neat half block.', ['stone', 'slab']);
  shaped('smooth_stone_slab', 6, ['PPP'], { P: 'smooth_stone' });
  item('stone_button', 'Stone Button', 'machinery', 1, { t: 'button', a: '#8a8a8a' }, 'A stone button that sends a signal.', ['stone', 'redstone_input']);
  shapeless('stone_button', 1, ['stone']);
  item('stone_pressure_plate', 'Stone Pressure Plate', 'machinery', 1, { t: 'plate', a: '#8a8a8a' }, 'Step on it to send a signal.', ['stone', 'redstone_input']);
  shaped('stone_pressure_plate', 1, ['SS'], { S: 'stone' });
  item('lever', 'Lever', 'machinery', 1, { t: 'lever', a: '#8a8a8a' }, 'Flip it on and off.', ['redstone_input']);
  shaped('lever', 1, ['S', 'C'], { S: 'stick', C: 'cobblestone' });

  // ---------- forest + mine resources ----------
  item('vine', 'Vines', 'materials', 1, { t: 'reeds', a: '#4a7a2a', x: '#3a6a20' }, 'Leafy vines that make stone mossy.', ['plant'], { res: true });
  item('apple', 'Apple', 'farming_food', 1, { t: 'fruit', a: '#d8342a', x: '#5a8a2a' }, 'A crunchy red apple.', ['food', 'fruit'], { res: true });
  item('string', 'String', 'animals', 1, { t: 'string', a: '#f2f2f2' }, 'Strong thread for bows and wool.', ['animal_drop'], { res: true });
  item('feather', 'Feather', 'animals', 1, { t: 'feather', a: '#f2f2f2' }, 'Light as air. Used for arrows and quills.', ['animal_drop'], { res: true });
  item('snowball', 'Snowball', 'materials', 1, { t: 'orb', a: '#f4fbff' }, 'Packed snow. Brrr!', ['snow'], { res: true });
  item('gravel', 'Gravel', 'materials', 1, B('cobble', '#8a8078'), 'Loose little stones.', ['soil'], { res: true });
  item('flint', 'Flint', 'materials', 1, { t: 'shard', a: '#4a4a4a' }, 'A sharp stone for arrows and fire starters.', ['stone'], { res: true });
  item('clay_ball', 'Clay Ball', 'materials', 1, { t: 'lump', a: '#a4a8b8', x: '#8a8e9e' }, 'Squishy clay. Bake it into bricks.', ['clay'], { res: true });
  item('granite', 'Granite', 'wood_stone', 1, B('speckle', '#9a6a55', { b: '#7a4a3a', x: '#c08a78' }), 'Pinkish speckled stone.', ['stone'], { res: true });
  item('diorite', 'Diorite', 'wood_stone', 1, B('speckle', '#c8c8c8', { b: '#9a9a9a', x: '#ffffff' }), 'White speckled stone.', ['stone'], { res: true });
  item('andesite', 'Andesite', 'wood_stone', 1, B('speckle', '#8a8a8a', { b: '#6a6a6a', x: '#a8a8a8' }), 'Grey speckled stone.', ['stone'], { res: true });

  item('mossy_cobblestone', 'Mossy Cobblestone', 'building', 1, B('cobble', '#7a8a6a'), 'Cobblestone covered in green moss.', ['stone']);
  shapeless('mossy_cobblestone', 1, ['cobblestone', 'vine']);
  item('mossy_stone_bricks', 'Mossy Stone Bricks', 'building', 1, B('stonebricks', '#7d7d7d', { moss: true }), 'Old castle bricks with moss.', ['stone']);
  shapeless('mossy_stone_bricks', 1, ['stone_bricks', 'vine']);
  [['granite', 'Granite', '#9a6a55'], ['diorite', 'Diorite', '#c8c8c8'], ['andesite', 'Andesite', '#8a8a8a']].forEach(function (s) {
    item('polished_' + s[0], 'Polished ' + s[1], 'building', 1, B('smooth', s[2]), 'Shiny, smooth ' + s[1].toLowerCase() + '.', ['stone']);
    shaped('polished_' + s[0], 4, ['SS', 'SS'], { S: s[0] });
    item(s[0] + '_wall', s[1] + ' Wall', 'building', 1, MK('wall', 'speckle', s[2]), 'A speckled ' + s[1].toLowerCase() + ' wall.', ['stone', 'wall']);
    shaped(s[0] + '_wall', 6, ['PPP', 'PPP'], { P: s[0] });
  });

  item('sandstone', 'Sandstone', 'building', 1, B('smooth', '#d8cb94'), 'Sand pressed into stone.', ['sand', 'stone']);
  shaped('sandstone', 1, ['SS', 'SS'], { S: 'sand' });
  item('cut_sandstone', 'Cut Sandstone', 'building', 1, B('stonebricks', '#d8cb94'), 'Neatly cut sandstone.', ['sand', 'stone']);
  shaped('cut_sandstone', 4, ['SS', 'SS'], { S: 'sandstone' });
  item('sandstone_slab', 'Sandstone Slab', 'building', 1, MK('slab', 'smooth', '#d8cb94'), 'Half a sandstone block.', ['sand', 'slab']);
  shaped('sandstone_slab', 6, ['PPP'], { P: 'sandstone' });
  item('sandstone_stairs', 'Sandstone Stairs', 'building', 1, MK('stairs', 'smooth', '#d8cb94'), 'Desert steps.', ['sand', 'stairs']);
  shaped('sandstone_stairs', 4, ['P..', 'PP.', 'PPP'], { P: 'sandstone' });
  item('sandstone_wall', 'Sandstone Wall', 'building', 1, MK('wall', 'smooth', '#d8cb94'), 'A desert wall.', ['sand', 'wall']);
  shaped('sandstone_wall', 6, ['PPP', 'PPP'], { P: 'sandstone' });
  item('chiseled_sandstone', 'Chiseled Sandstone', 'building', 1, B('chiseled', '#d8cb94'), 'Sandstone with a carved pattern.', ['sand']);
  shaped('chiseled_sandstone', 1, ['S', 'S'], { S: 'sandstone_slab' });
  item('smooth_sandstone', 'Smooth Sandstone', 'building', 1, B('smooth', '#e0d4a0'), 'Baked smooth sandstone.', ['sand']);
  smelt('smooth_sandstone', 'sandstone');

  item('glass', 'Glass', 'building', 1, B('glass', '#cfe8f0'), 'Clear glass made from sand.', ['glass']);
  smelt('glass', 'sand');
  item('glass_pane', 'Glass Pane', 'building', 1, MK('pane', 'glass', '#cfe8f0'), 'A thin window.', ['glass']);
  shaped('glass_pane', 16, ['GGG', 'GGG'], { G: 'glass' });
  item('brick', 'Brick', 'materials', 1, { t: 'ingot', a: '#b0573a' }, 'A baked clay brick.', ['clay']);
  smelt('brick', 'clay_ball');
  item('bricks', 'Bricks', 'building', 1, B('bricks', '#9a4a32', { m: '#c8b8a8' }), 'A classic brick block.', ['clay', 'building_material']);
  shaped('bricks', 1, ['BB', 'BB'], { B: 'brick' });
  item('brick_slab', 'Brick Slab', 'building', 1, MK('slab', 'bricks', '#9a4a32', { m: '#c8b8a8' }), 'Half a brick block.', ['clay', 'slab']);
  shaped('brick_slab', 6, ['PPP'], { P: 'bricks' });
  item('brick_stairs', 'Brick Stairs', 'building', 1, MK('stairs', 'bricks', '#9a4a32', { m: '#c8b8a8' }), 'Brick steps.', ['clay', 'stairs']);
  shaped('brick_stairs', 4, ['P..', 'PP.', 'PPP'], { P: 'bricks' });
  item('brick_wall', 'Brick Wall', 'building', 1, MK('wall', 'bricks', '#9a4a32', { m: '#c8b8a8' }), 'A garden brick wall.', ['clay', 'wall']);
  shaped('brick_wall', 6, ['PPP', 'PPP'], { P: 'bricks' });
  item('flower_pot', 'Flower Pot', 'building', 1, { t: 'bowl_empty', a: '#9a4a32' }, 'A pot for your favorite flower.', ['decor', 'clay']);
  shaped('flower_pot', 1, ['B.B', '.B.'], { B: 'brick' });
  item('clay', 'Clay Block', 'building', 1, B('noise', '#a4a8b8', { amt: 0.04 }), 'A block of soft clay.', ['clay']);
  shaped('clay', 1, ['CC', 'CC'], { C: 'clay_ball' });
  item('terracotta', 'Terracotta', 'building', 1, B('noise', '#985e43', { amt: 0.04 }), 'Baked clay in warm orange.', ['clay', 'terracotta']);
  smelt('terracotta', 'clay');
  item('coarse_dirt', 'Coarse Dirt', 'building', 1, B('speckle', '#77553a', { b: '#4a3422', x: '#8a8078', p: 0.2 }), 'Rough, rocky dirt.', ['soil']);
  shaped('coarse_dirt', 4, ['DG', 'GD'], { D: 'dirt', G: 'gravel' });
  item('snow_block', 'Snow Block', 'building', 1, B('noise', '#f4fbff', { amt: 0.03 }), 'A big block of snow.', ['snow']);
  shaped('snow_block', 1, ['SS', 'SS'], { S: 'snowball' });
  item('snow', 'Snow Layer', 'building', 1, MK('layer', 'noise', '#f4fbff'), 'A thin blanket of snow.', ['snow']);
  shaped('snow', 6, ['SSS'], { S: 'snow_block' });
  item('stonecutter', 'Stonecutter', 'machinery', 1, B('smooth', '#7d7d7d', { face: 'cutter' }), 'A saw for cutting stone neatly.', ['station', 'decor']);
  shaped('stonecutter', 1, ['.I.', 'SSS'], { I: 'iron_ingot', S: 'stone' });
  item('grindstone', 'Grindstone', 'machinery', 1, B('smooth', '#8a8a8a', { face: 'grind' }), 'A spinning stone wheel.', ['station', 'decor']);
  shaped('grindstone', 1, ['SLS', 'P.P'], { S: 'stick', L: 'stone_slab', P: '#planks' });

  // wood-based utility blocks
  item('fishing_rod', 'Fishing Rod', 'tools', 1, { t: 'fishing_rod' }, 'Catch fish from the water.', ['tool']);
  shaped('fishing_rod', 1, ['..S', '.ST', 'S.T'], { S: 'stick', T: 'string' });
  item('bow', 'Bow', 'armor', 1, { t: 'bow' }, 'Shoots arrows far away.', ['equipment']);
  shaped('bow', 1, ['.ST', 'S.T', '.ST'], { S: 'stick', T: 'string' });
  item('arrow', 'Arrow', 'armor', 1, { t: 'arrow' }, 'Ammo for your bow.', ['equipment']);
  shaped('arrow', 4, ['F', 'S', 'E'], { F: 'flint', S: 'stick', E: 'feather' });
  item('fletching_table', 'Fletching Table', 'wood_stone', 1, B('planks', '#c8b080', { face: 'fletch' }), 'An arrow-maker\'s workbench.', ['station', 'decor']);
  shaped('fletching_table', 1, ['FF', 'PP', 'PP'], { F: 'flint', P: '#planks' });
  item('loom', 'Loom', 'wood_stone', 1, B('planks', '#a8783e', { face: 'loom' }), 'Weaves patterns into cloth.', ['station', 'decor']);
  shaped('loom', 1, ['SS', 'PP'], { S: 'string', P: '#planks' });
  item('painting', 'Painting', 'building', 1, { t: 'frame', x: '#5a9ad8', y: '#4a8a3a', z: '#f7d94a' }, 'A pretty picture for your wall.', ['decor']);
  shaped('painting', 1, ['SSS', 'SWS', 'SSS'], { S: 'stick', W: '#wool' });
  item('workshop_shelf', 'Workshop Shelf', 'wood_stone', 1, MK('slab', 'shelf', '#a8783e'), 'An original workshop shelf to show off your favorite things.', ['decor', 'original'], { orig: true });
  shaped('workshop_shelf', 1, ['SSS', 'P.P'], { S: '#wooden_slabs', P: 'stick' }, { orig: true, msg: 'Your workshop has a shelf now. Fancy!' });
})(typeof window !== 'undefined' ? (window.WOW = window.WOW || {}) : (globalThis.WOW = globalThis.WOW || {}));
