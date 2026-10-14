/* Workshop of Wonders - catalog part 2: metals, farming, colors, redstone, magic, legendary. */
(function (W) {
  'use strict';
  const D = W.Data, b = D.build, item = b.item, shaped = b.shaped, shapeless = b.shapeless, smelt = b.smelt, brew = b.brew, smith = b.smith;
  const sh = W.Icons.shade;
  const B = function (s, a, extra) { return Object.assign({ t: 'block', s: s, a: a }, extra || {}); };
  const MK = function (m, s, a, extra) { return { t: 'mask', m: m, base: Object.assign({ s: s, a: a }, extra || {}) }; };
  const O = { orig: true };

  // =============== TIER 2: METALS AND GEMS ===============
  item('raw_iron', 'Raw Iron', 'metals_gems', 2, { t: 'chunk', a: '#d8af93', x: '#a87a5a' }, 'Lumpy iron ore. Smelt it!', ['ore'], { res: true });
  item('raw_gold', 'Raw Gold', 'metals_gems', 2, { t: 'chunk', a: '#f2d24a', x: '#c89a2a' }, 'Shiny gold ore. Smelt it!', ['ore'], { res: true });
  item('raw_copper', 'Raw Copper', 'metals_gems', 2, { t: 'chunk', a: '#d8804a', x: '#9a5a32' }, 'Orange copper ore. Smelt it!', ['ore'], { res: true });
  item('diamond', 'Diamond', 'metals_gems', 2, { t: 'gem', a: '#5ae0d8' }, 'The toughest, sparkliest gem.', ['gem'], { res: true });
  item('emerald', 'Emerald', 'metals_gems', 2, { t: 'gem', a: '#3ad86a' }, 'A bright green gem.', ['gem'], { res: true });
  item('lapis_lazuli', 'Lapis Lazuli', 'metals_gems', 2, { t: 'dust', a: '#2a4aba' }, 'Deep blue stone. Also a blue dye!', ['gem', 'dye_source'], { res: true });
  item('amethyst_shard', 'Amethyst Shard', 'metals_gems', 2, { t: 'shard', a: '#a46ae0' }, 'A purple crystal that hums softly.', ['gem', 'crystal'], { res: true });
  item('quartz', 'Nether Quartz', 'metals_gems', 2, { t: 'shard', a: '#ece6dc' }, 'Milky white crystal.', ['gem', 'crystal'], { res: true });
  item('obsidian', 'Obsidian', 'metals_gems', 2, B('noise', '#1e1530', { amt: 0.25 }), 'Super-hard purple-black glass rock.', ['stone'], { res: true });

  item('iron_ingot', 'Iron Ingot', 'metals_gems', 2, { t: 'ingot', a: '#d8d8d8' }, 'A bar of strong iron.', ['metal']);
  item('gold_ingot', 'Gold Ingot', 'metals_gems', 2, { t: 'ingot', a: '#f7d248' }, 'A bar of shiny gold.', ['metal']);
  item('copper_ingot', 'Copper Ingot', 'metals_gems', 2, { t: 'ingot', a: '#e0824a' }, 'A bar of orange copper.', ['metal']);
  smelt('iron_ingot', 'raw_iron');
  smelt('gold_ingot', 'raw_gold');
  smelt('copper_ingot', 'raw_copper');
  item('iron_nugget', 'Iron Nugget', 'metals_gems', 2, { t: 'nugget', a: '#d8d8d8' }, 'A tiny bit of iron.', ['metal']);
  item('gold_nugget', 'Gold Nugget', 'metals_gems', 2, { t: 'nugget', a: '#f7d248' }, 'A tiny bit of gold.', ['metal']);
  shapeless('iron_nugget', 9, ['iron_ingot']);
  shaped('iron_ingot', 1, ['NNN', 'NNN', 'NNN'], { N: 'iron_nugget' }, { id: 'iron_ingot_from_nuggets' });
  shapeless('gold_nugget', 9, ['gold_ingot']);
  shaped('gold_ingot', 1, ['NNN', 'NNN', 'NNN'], { N: 'gold_nugget' }, { id: 'gold_ingot_from_nuggets' });

  [['iron', 'Iron', 'iron_ingot', '#d8d8d8', 'metal'], ['gold', 'Gold', 'gold_ingot', '#f7d248', 'metal'], ['copper', 'Copper', 'copper_ingot', '#e0824a', 'metal'],
   ['diamond', 'Diamond', 'diamond', '#5ae0d8', 'metal'], ['emerald', 'Emerald', 'emerald', '#3ad86a', 'metal'], ['lapis', 'Lapis', 'lapis_lazuli', '#2a4aba', 'metal'],
   ['coal', 'Coal', 'coal', '#2e2e2e', 'noise']].forEach(function (m) {
    const id = m[0] + '_block';
    item(id, 'Block of ' + m[1], 'metals_gems', m[0] === 'coal' ? 1 : 2, B(m[4], m[3], m[4] === 'noise' ? { amt: 0.2 } : {}), 'Nine ' + D.items[m[2]].name.toLowerCase() + 's packed into one block.', ['storage_block'].concat(m[0] === 'coal' ? ['fuel'] : []), m[0] === 'coal' ? { fuel: 320 } : {});
    shaped(id, 1, ['MMM', 'MMM', 'MMM'], { M: m[2] });
    shapeless(m[2], 9, [id], { id: m[2] + '_from_block' });
  });

  D.toolSet('iron', 'Iron', 'iron_ingot', 2, '#d8d8d8');
  D.toolSet('golden', 'Golden', 'gold_ingot', 2, '#f7d248');
  D.toolSet('diamond', 'Diamond', 'diamond', 2, '#5ae0d8');
  D.armorSet('iron', 'Iron', 'iron_ingot', 2, '#d8d8d8');
  D.armorSet('golden', 'Golden', 'gold_ingot', 2, '#f7d248');
  D.armorSet('diamond', 'Diamond', 'diamond', 2, '#5ae0d8');

  item('bucket', 'Bucket', 'tools', 2, { t: 'bucket', a: '#c8c8c8', x: '#5a5a5a' }, 'Carries water, milk and more.', ['tool', 'container']);
  shaped('bucket', 1, ['I.I', '.I.'], { I: 'iron_ingot' });
  item('shears', 'Shears', 'tools', 2, { t: 'shears', a: '#d8d8d8', x: '#5a5a5a' }, 'Snip leaves and wool.', ['tool']);
  shaped('shears', 1, ['.I', 'I.'], { I: 'iron_ingot' });
  item('flint_and_steel', 'Flint and Steel', 'tools', 2, { t: 'flint_steel', a: '#d8d8d8', x: '#4a4a4a' }, 'Strikes sparks to light campfires.', ['tool']);
  shapeless('flint_and_steel', 1, ['iron_ingot', 'flint']);
  item('iron_bars', 'Iron Bars', 'building', 2, { t: 'bars', a: '#a8a8a8' }, 'Strong metal bars for windows.', ['metal']);
  shaped('iron_bars', 16, ['III', 'III'], { I: 'iron_ingot' });
  item('chain', 'Chain', 'building', 2, { t: 'chain', a: '#7a8aa0' }, 'Hang lanterns from the ceiling.', ['metal']);
  shaped('chain', 1, ['N', 'I', 'N'], { N: 'iron_nugget', I: 'iron_ingot' });
  item('lantern', 'Lantern', 'building', 2, { t: 'lantern', a: '#4a4a5a', x: '#ffc04a' }, 'A cozy metal lamp.', ['light']);
  shaped('lantern', 1, ['NNN', 'NTN', 'NNN'], { N: 'iron_nugget', T: 'torch' });
  item('anvil', 'Anvil', 'tools', 2, { t: 'anvil', a: '#5a5a5a' }, 'A heavy block for fixing and naming tools.', ['station', 'metal']);
  shaped('anvil', 1, ['BBB', '.I.', 'III'], { B: 'iron_block', I: 'iron_ingot' });
  item('cauldron', 'Cauldron', 'tools', 2, { t: 'cauldron', a: '#4a4a4a', x: '#3a6ad8' }, 'A big iron pot.', ['container', 'metal']);
  shaped('cauldron', 1, ['I.I', 'I.I', 'III'], { I: 'iron_ingot' });
  item('iron_door', 'Iron Door', 'building', 2, { t: 'door', a: '#d0d0d0', x: '#7a7a7a' }, 'A sturdy metal door.', ['metal', 'door']);
  shaped('iron_door', 3, ['II', 'II', 'II'], { I: 'iron_ingot' });
  item('iron_trapdoor', 'Iron Trapdoor', 'building', 2, { t: 'trapdoor', a: '#d0d0d0' }, 'A metal floor hatch.', ['metal', 'door']);
  shaped('iron_trapdoor', 1, ['II', 'II'], { I: 'iron_ingot' });
  item('heavy_weighted_pressure_plate', 'Heavy Pressure Plate', 'machinery', 2, { t: 'plate', a: '#d0d0d0' }, 'An iron plate that counts what stands on it.', ['metal', 'redstone_input']);
  shaped('heavy_weighted_pressure_plate', 1, ['II'], { I: 'iron_ingot' });
  item('light_weighted_pressure_plate', 'Light Pressure Plate', 'machinery', 2, { t: 'plate', a: '#f7d248' }, 'A gold plate that counts what stands on it.', ['metal', 'redstone_input']);
  shaped('light_weighted_pressure_plate', 1, ['GG'], { G: 'gold_ingot' });
  item('lightning_rod', 'Lightning Rod', 'building', 2, { t: 'lightning_rod', a: '#e0824a' }, 'Catches lightning safely.', ['metal']);
  shaped('lightning_rod', 1, ['C', 'C', 'C'], { C: 'copper_ingot' });
  item('spyglass', 'Spyglass', 'tools', 2, { t: 'spyglass', a: '#e0824a', x: '#a46ae0' }, 'See far-away things up close.', ['tool']);
  shaped('spyglass', 1, ['A', 'C', 'C'], { A: 'amethyst_shard', C: 'copper_ingot' });
  item('amethyst_block', 'Block of Amethyst', 'building', 2, B('speckle', '#8a5ac8', { b: '#6a3aa8', x: '#c8a0f0' }), 'A twinkly purple block.', ['crystal']);
  shaped('amethyst_block', 1, ['AA', 'AA'], { A: 'amethyst_shard' });
  item('tinted_glass', 'Tinted Glass', 'building', 2, B('glass', '#4a3a5a', { tint: '#2a2238cc' }), 'Dark glass that blocks light.', ['glass', 'crystal']);
  shaped('tinted_glass', 2, ['.A.', 'AGA', '.A.'], { A: 'amethyst_shard', G: 'glass' });
  item('quartz_block', 'Block of Quartz', 'building', 2, B('smooth', '#ece6dc'), 'Bright white stone.', ['crystal']);
  shaped('quartz_block', 1, ['QQ', 'QQ'], { Q: 'quartz' });
  item('quartz_pillar', 'Quartz Pillar', 'building', 2, B('pillar', '#ece6dc'), 'A tall white column.', ['crystal']);
  shaped('quartz_pillar', 2, ['Q', 'Q'], { Q: 'quartz_block' });
  item('quartz_slab', 'Quartz Slab', 'building', 2, MK('slab', 'smooth', '#ece6dc'), 'Half a quartz block.', ['crystal', 'slab']);
  shaped('quartz_slab', 6, ['QQQ'], { Q: 'quartz_block' });
  item('quartz_stairs', 'Quartz Stairs', 'building', 2, MK('stairs', 'smooth', '#ece6dc'), 'Bright white steps.', ['crystal', 'stairs']);
  shaped('quartz_stairs', 4, ['Q..', 'QQ.', 'QQQ'], { Q: 'quartz_block' });
  shaped('diorite', 2, ['CQ', 'QC'], { C: 'cobblestone', Q: 'quartz' });
  shapeless('andesite', 2, ['diorite', 'cobblestone']);
  shapeless('granite', 1, ['diorite', 'quartz']);
  item('shield', 'Shield', 'armor', 2, { t: 'shield', a: '#b8945f', c: '#d8d8d8' }, 'Blocks arrows and bumps.', ['equipment']);
  shaped('shield', 1, ['PIP', 'PPP', '.P.'], { P: '#planks', I: 'iron_ingot' });
  item('tripwire_hook', 'Tripwire Hook', 'machinery', 2, { t: 'lever', a: '#b8945f' }, 'Hooks a string to sense movement.', ['redstone_input']);
  shaped('tripwire_hook', 2, ['I', 'S', 'P'], { I: 'iron_ingot', S: 'stick', P: '#planks' });
  item('crossbow', 'Crossbow', 'armor', 2, { t: 'bow', h: '#6e4a22', z: '#d8d8d8' }, 'A powerful bow you can load ahead of time.', ['equipment']);
  shaped('crossbow', 1, ['SIS', 'TJT', '.S.'], { S: 'stick', I: 'iron_ingot', T: 'string', J: 'tripwire_hook' });
  item('smithing_table', 'Smithing Table', 'wood_stone', 2, B('planks', '#3a3a40', { face: 'smith' }), 'Upgrades gear. Opens the Smithing station.', ['station']);
  shaped('smithing_table', 1, ['II', 'PP', 'PP'], { I: 'iron_ingot', P: '#planks' });

  // =============== TIER 3: FARMING, FOOD AND ANIMALS ===============
  const res3 = function (id, name, cat, icon, desc, tags) { item(id, name, cat, 3, icon, desc, tags, { res: true }); };
  res3('wheat_seeds', 'Wheat Seeds', 'farming_food', { t: 'seeds', a: '#5a9a3a' }, 'Plant them to grow wheat.', ['seed']);
  res3('wheat', 'Wheat', 'farming_food', { t: 'wheat', a: '#d8b84a', x: '#8a7a2a' }, 'Golden grain for bread and cookies.', ['crop']);
  res3('sugar_cane', 'Sugar Cane', 'farming_food', { t: 'reeds', a: '#8ad86a', x: '#5a9a3a' }, 'Sweet stalks for sugar and paper.', ['crop']);
  res3('cocoa_beans', 'Cocoa Beans', 'farming_food', { t: 'seeds', a: '#8a5a32', b: '#5a3a22' }, 'Chocolate beans! Also a brown dye.', ['crop', 'dye_source']);
  res3('pumpkin', 'Pumpkin', 'farming_food', B('stripes', '#e0902a', { b: '#c87a1a', stem: true }), 'A big orange pumpkin.', ['crop']);
  res3('melon_slice', 'Melon Slice', 'farming_food', { t: 'slice', a: '#e8403a', x: '#5aa03a' }, 'A juicy slice of melon.', ['food', 'fruit']);
  res3('carrot', 'Carrot', 'farming_food', { t: 'carrot', a: '#f0902a', x: '#5aa03a' }, 'Crunchy and orange.', ['food', 'crop']);
  res3('potato', 'Potato', 'farming_food', { t: 'lump', a: '#d8b46a', x: '#b08a4a' }, 'Bake it for a warm snack.', ['food', 'crop']);
  res3('beetroot', 'Beetroot', 'farming_food', { t: 'turnip', a: '#a42a3a', x: '#5aa03a' }, 'A deep red root vegetable.', ['food', 'crop', 'dye_source']);
  res3('sweet_berries', 'Sweet Berries', 'farming_food', { t: 'berries', a: '#c8282a', x: '#3a7a2a' }, 'Little red berries from a bush.', ['food', 'fruit']);
  res3('red_mushroom', 'Red Mushroom', 'farming_food', { t: 'mushroom', a: '#d02a2a', x: '#e8dcc8' }, 'A spotted red mushroom.', ['mushroom']);
  res3('brown_mushroom', 'Brown Mushroom', 'farming_food', { t: 'mushroom', a: '#9a6a4a', x: '#e8dcc8', w: '#9a6a4a' }, 'A plain brown mushroom.', ['mushroom']);
  res3('cactus', 'Cactus', 'farming_food', B('stripes', '#5a9a3a', { b: '#4a8a2a' }), 'Prickly desert plant. Smelts into green dye.', ['plant']);
  res3('kelp', 'Kelp', 'farming_food', { t: 'reeds', a: '#4a8a5a', x: '#3a7a4a' }, 'Wiggly seaweed.', ['plant']);
  res3('egg', 'Egg', 'animals', { t: 'egg', a: '#efe2c4' }, 'A fresh egg from a chicken.', ['animal_drop']);
  res3('milk_bucket', 'Milk Bucket', 'animals', { t: 'bucket', a: '#c8c8c8', x: '#ffffff' }, 'A bucket of fresh milk.', ['animal_drop', 'bucket_full']);
  res3('water_bucket', 'Water Bucket', 'materials', { t: 'bucket', a: '#c8c8c8', x: '#3a6ad8' }, 'A bucket of water from the well.', ['bucket_full']);
  res3('leather', 'Leather', 'animals', { t: 'hide', a: '#a8603a' }, 'Tough hide for books and armor.', ['animal_drop']);
  res3('bone', 'Bone', 'animals', { t: 'bone', a: '#ece6d8' }, 'Grind it into bone meal.', ['animal_drop']);
  res3('white_wool', 'White Wool', 'building', B('wool', '#f0f0f0'), 'Soft, fluffy wool from a sheep.', ['wool']);
  res3('ink_sac', 'Ink Sac', 'animals', { t: 'drop', a: '#2a2a3a' }, 'Squid ink. A black dye.', ['animal_drop', 'dye_source']);
  res3('honeycomb', 'Honeycomb', 'animals', { t: 'hex', a: '#f0b42a' }, 'Waxy comb from a bee hive.', ['animal_drop']);
  res3('honey_bottle', 'Honey Bottle', 'farming_food', { t: 'bottle', x: '#f0a82a' }, 'Sweet, sticky honey.', ['food']);
  [['raw_beef', 'Raw Beef', '#d8504a'], ['raw_porkchop', 'Raw Porkchop', '#f09090'], ['raw_chicken', 'Raw Chicken', '#f0c0a8'], ['raw_mutton', 'Raw Mutton', '#d0504a']].forEach(function (m) {
    res3(m[0], m[1], 'farming_food', { t: 'meat', a: m[2], x: '#f2f2f2' }, 'Uncooked. Pop it in the furnace!', ['food', 'raw_meat']);
  });
  res3('raw_cod', 'Raw Cod', 'farming_food', { t: 'fish', a: '#c8a878' }, 'A fresh fish. Cook it!', ['food', 'fish']);
  res3('raw_salmon', 'Raw Salmon', 'farming_food', { t: 'fish', a: '#d8604a' }, 'A pink fish. Cook it!', ['food', 'fish']);
  const FLOWERS = [
    ['dandelion', 'Dandelion', '#f7d94a', 'yellow_dye', 1], ['poppy', 'Poppy', '#e02a2a', 'red_dye', 1], ['cornflower', 'Cornflower', '#4a6ae0', 'blue_dye', 1],
    ['blue_orchid', 'Blue Orchid', '#3ac0e0', 'light_blue_dye', 1], ['allium', 'Allium', '#b45ae0', 'magenta_dye', 1], ['azure_bluet', 'Azure Bluet', '#e8eef2', 'light_gray_dye', 1],
    ['orange_tulip', 'Orange Tulip', '#f08a2a', 'orange_dye', 1], ['pink_tulip', 'Pink Tulip', '#f0a0c0', 'pink_dye', 1], ['oxeye_daisy', 'Oxeye Daisy', '#f2f2f2', 'light_gray_dye', 1],
    ['lily_of_the_valley', 'Lily of the Valley', '#ffffff', 'white_dye', 1]
  ];
  FLOWERS.forEach(function (f) { res3(f[0], f[1], 'farming_food', { t: 'flower', a: f[2], x: '#4a8a2a' }, 'A pretty flower. It makes dye!', ['flower', 'dye_source']); });

  // cooked food
  [['cooked_beef', 'Steak', 'raw_beef', '#8a4a2a'], ['cooked_porkchop', 'Cooked Porkchop', 'raw_porkchop', '#c88a5a'], ['cooked_chicken', 'Cooked Chicken', 'raw_chicken', '#d8a060'], ['cooked_mutton', 'Cooked Mutton', 'raw_mutton', '#9a5a3a']].forEach(function (c) {
    item(c[0], c[1], 'farming_food', 3, { t: 'meat', a: c[3], x: '#f2f2f2' }, 'Warm and tasty.', ['food', 'cooked']);
    smelt(c[0], c[2]);
  });
  item('cooked_cod', 'Cooked Cod', 'farming_food', 3, { t: 'fish', a: '#c89a5a' }, 'A tasty cooked fish.', ['food', 'cooked']); smelt('cooked_cod', 'raw_cod');
  item('cooked_salmon', 'Cooked Salmon', 'farming_food', 3, { t: 'fish', a: '#b0603a' }, 'A tasty cooked fish.', ['food', 'cooked']); smelt('cooked_salmon', 'raw_salmon');
  item('baked_potato', 'Baked Potato', 'farming_food', 3, { t: 'lump', a: '#e0b04a', x: '#a87a2a' }, 'Hot, fluffy potato.', ['food', 'cooked']); smelt('baked_potato', 'potato');
  item('dried_kelp', 'Dried Kelp', 'farming_food', 3, { t: 'reeds', a: '#3a4a2a', x: '#2a3a1a' }, 'A crunchy sea snack.', ['food']); smelt('dried_kelp', 'kelp');
  item('dried_kelp_block', 'Dried Kelp Block', 'building', 3, B('stripes', '#3a4a2a', { b: '#2a3a1a' }), 'Kelp pressed into a block. Burns a long time.', ['fuel'], { fuel: 80 });
  shaped('dried_kelp_block', 1, ['KKK', 'KKK', 'KKK'], { K: 'dried_kelp' });
  shapeless('dried_kelp', 9, ['dried_kelp_block'], { id: 'dried_kelp_from_block' });

  item('bread', 'Bread', 'farming_food', 3, { t: 'loaf', a: '#c8903a' }, 'A warm loaf of bread.', ['food']);
  shaped('bread', 1, ['WWW'], { W: 'wheat' });
  item('hay_block', 'Hay Bale', 'farming_food', 3, B('hay', '#d8b84a', { b: '#8a5a2a' }), 'A bundle of wheat. Horses love it.', ['crop']);
  shaped('hay_block', 1, ['WWW', 'WWW', 'WWW'], { W: 'wheat' });
  shapeless('wheat', 9, ['hay_block'], { id: 'wheat_from_hay' });
  item('cookie', 'Cookie', 'farming_food', 3, { t: 'cookie', a: '#c8883a', x: '#4a2a1a' }, 'A chocolate chip cookie!', ['food', 'sweet']);
  shaped('cookie', 8, ['WCW'], { W: 'wheat', C: 'cocoa_beans' });
  item('sugar', 'Sugar', 'farming_food', 3, { t: 'dust', a: '#f8f8f8' }, 'Sweet white sugar.', ['sweet']);
  shapeless('sugar', 1, ['sugar_cane']);
  shapeless('sugar', 3, ['honey_bottle'], { id: 'sugar_from_honey', rem: [{ itemId: 'glass_bottle', quantity: 1 }] });
  item('cake', 'Cake', 'farming_food', 3, { t: 'cake', a: '#f0e8e0', x: '#e8403a' }, 'A whole cake! Time to celebrate.', ['food', 'sweet']);
  shaped('cake', 1, ['MMM', 'SES', 'WWW'], { M: 'milk_bucket', S: 'sugar', E: 'egg', W: 'wheat' }, { rem: [{ itemId: 'bucket', quantity: 3 }], msg: 'You made a cake! The empty buckets go back in your bag.' });
  item('pumpkin_pie', 'Pumpkin Pie', 'farming_food', 3, { t: 'pie', a: '#e0902a', x: '#c8883a' }, 'A spiced autumn pie.', ['food', 'sweet']);
  shapeless('pumpkin_pie', 1, ['pumpkin', 'sugar', 'egg']);
  item('mushroom_stew', 'Mushroom Stew', 'farming_food', 3, { t: 'bowl', a: '#8a6038', x: '#c8a07a' }, 'A warm bowl of stew.', ['food']);
  shapeless('mushroom_stew', 1, ['bowl', 'red_mushroom', 'brown_mushroom']);
  item('beetroot_soup', 'Beetroot Soup', 'farming_food', 3, { t: 'bowl', a: '#8a6038', x: '#a42a3a' }, 'A bowl of bright red soup.', ['food']);
  shapeless('beetroot_soup', 1, ['bowl', 'beetroot', 'beetroot', 'beetroot', 'beetroot', 'beetroot', 'beetroot']);
  item('golden_carrot', 'Golden Carrot', 'farming_food', 3, { t: 'carrot', a: '#f7d248', x: '#c8a02a' }, 'A sparkly golden carrot.', ['food', 'golden']);
  shaped('golden_carrot', 1, ['NNN', 'NCN', 'NNN'], { N: 'gold_nugget', C: 'carrot' });
  item('glistering_melon_slice', 'Glistering Melon Slice', 'farming_food', 3, { t: 'slice', a: '#f7d248', x: '#c8a02a' }, 'A golden melon slice for healing potions.', ['golden', 'brewing']);
  shaped('glistering_melon_slice', 1, ['NNN', 'NMN', 'NNN'], { N: 'gold_nugget', M: 'melon_slice' });
  item('golden_apple', 'Golden Apple', 'farming_food', 3, { t: 'fruit', a: '#f7d248', x: '#c8a02a' }, 'A magical golden apple.', ['food', 'golden']);
  shaped('golden_apple', 1, ['GGG', 'GAG', 'GGG'], { G: 'gold_ingot', A: 'apple' });
  item('melon', 'Melon', 'farming_food', 3, B('stripes', '#7ab83a', { b: '#5a9a2a' }), 'A whole striped melon.', ['crop']);
  shaped('melon', 1, ['MMM', 'MMM', 'MMM'], { M: 'melon_slice' });
  item('melon_seeds', 'Melon Seeds', 'farming_food', 3, { t: 'seeds', a: '#3a3a2a' }, 'Plant them to grow melons.', ['seed']);
  shapeless('melon_seeds', 1, ['melon_slice']);
  item('pumpkin_seeds', 'Pumpkin Seeds', 'farming_food', 3, { t: 'seeds', a: '#e8dca8' }, 'Plant them to grow pumpkins.', ['seed']);
  shapeless('pumpkin_seeds', 4, ['pumpkin']);
  item('bone_meal', 'Bone Meal', 'farming_food', 3, { t: 'dust', a: '#f2f0e8' }, 'Makes plants grow fast. Also a white dye.', ['fertilizer', 'dye_source']);
  shapeless('bone_meal', 3, ['bone']);
  item('bone_block', 'Bone Block', 'building', 3, B('pillar', '#e8e2d0'), 'A block of bones. Spooky but neat.', ['building_material']);
  shaped('bone_block', 1, ['MMM', 'MMM', 'MMM'], { M: 'bone_meal' });
  shapeless('bone_meal', 9, ['bone_block'], { id: 'bone_meal_from_block' });
  item('paper', 'Paper', 'materials', 3, { t: 'paper', a: '#f2f0e0' }, 'For books and maps.', ['paper']);
  shaped('paper', 3, ['RRR'], { R: 'sugar_cane' });
  item('book', 'Book', 'materials', 3, { t: 'book', a: '#8a4a25', x: '#f2f0e0' }, 'Paper bound in leather.', ['paper']);
  shapeless('book', 1, ['paper', 'paper', 'paper', 'leather']);
  item('writable_book', 'Book and Quill', 'materials', 3, { t: 'book_quill', a: '#8a4a25', x: '#f2f0e0' }, 'Write your own stories!', ['paper']);
  shapeless('writable_book', 1, ['book', 'ink_sac', 'feather']);
  item('bookshelf', 'Bookshelf', 'building', 3, B('shelf', '#b8945f'), 'Shelves full of books.', ['decor', 'magic_helper']);
  shaped('bookshelf', 1, ['PPP', 'BBB', 'PPP'], { P: '#planks', B: 'book' });
  item('lectern', 'Lectern', 'wood_stone', 3, B('planks', '#b8945f', { face: 'lectern' }), 'A stand for reading books.', ['station', 'decor']);
  shaped('lectern', 1, ['SSS', '.B.', '.S.'], { S: '#wooden_slabs', B: 'bookshelf' });
  item('cartography_table', 'Cartography Table', 'wood_stone', 3, B('planks', '#6e4a22', { face: 'map' }), 'A map maker\'s desk.', ['station', 'decor']);
  shaped('cartography_table', 1, ['AA', 'PP', 'PP'], { A: 'paper', P: '#planks' });
  item('composter', 'Composter', 'farming_food', 3, B('planks', '#8a6a3e', { face: 'composter' }), 'Turns old plants into bone meal.', ['farm']);
  shaped('composter', 1, ['S.S', 'S.S', 'SSS'], { S: '#wooden_slabs' });
  item('beehive', 'Beehive', 'animals', 3, B('planks', '#c8a050', { face: 'hive' }), 'A cozy home for bees.', ['farm']);
  shaped('beehive', 1, ['PPP', 'HHH', 'PPP'], { P: '#planks', H: 'honeycomb' });
  item('honeycomb_block', 'Honeycomb Block', 'building', 3, B('speckle', '#f0b42a', { b: '#c88a1a', x: '#ffd06a' }), 'A waxy golden block.', ['building_material']);
  shaped('honeycomb_block', 1, ['HH', 'HH'], { H: 'honeycomb' });
  item('honey_block', 'Honey Block', 'building', 3, B('translucent', '#f0a82a', { b: '#f8c86a' }), 'A sticky, bouncy block.', ['building_material']);
  shaped('honey_block', 1, ['HH', 'HH'], { H: 'honey_bottle' }, { rem: [{ itemId: 'glass_bottle', quantity: 4 }] });
  item('candle', 'Candle', 'building', 3, { t: 'candle', a: '#efe2c4' }, 'A little wax candle.', ['light']);
  shaped('candle', 1, ['S', 'H'], { S: 'string', H: 'honeycomb' });
  item('glass_bottle', 'Glass Bottle', 'magic', 3, { t: 'bottle', x: '#cfe8f0' }, 'An empty bottle for water and potions.', ['container']);
  shaped('glass_bottle', 3, ['G.G', '.G.'], { G: 'glass' });
  shapeless('white_wool', 1, ['string', 'string', 'string', 'string'], { id: 'white_wool_from_string' });
  item('item_frame', 'Item Frame', 'building', 3, { t: 'frame', x: '#a8603a', y: '#8a4a2a', z: '#c8804a' }, 'Show off your favorite item on the wall.', ['decor']);
  shaped('item_frame', 1, ['SSS', 'SLS', 'SSS'], { S: 'stick', L: 'leather' });
  D.armorSet('leather', 'Leather', 'leather', 3, '#a8603a');
  item('lead', 'Lead', 'animals', 3, { t: 'lead', a: '#c8a878', x: '#7cc95a' }, 'A rope for walking animals.', ['animal_tool']);
  shaped('lead', 2, ['SS.', 'SB.', '..S'], { S: 'string', B: 'slime_ball' });

  // =============== COLORS ===============
  const COLORS = D.colors = [
    ['white', 'White', '#f0f0f0'], ['orange', 'Orange', '#f07c18'], ['magenta', 'Magenta', '#c74ebd'], ['light_blue', 'Light Blue', '#3ab3da'],
    ['yellow', 'Yellow', '#fed83d'], ['lime', 'Lime', '#80c71f'], ['pink', 'Pink', '#f38baa'], ['gray', 'Gray', '#474f52'],
    ['light_gray', 'Light Gray', '#9d9d97'], ['cyan', 'Cyan', '#169c9c'], ['purple', 'Purple', '#8932b8'], ['blue', 'Blue', '#3c44aa'],
    ['brown', 'Brown', '#835432'], ['green', 'Green', '#5e7c16'], ['red', 'Red', '#b02e26'], ['black', 'Black', '#1d1d21']
  ];
  COLORS.forEach(function (c) { item(c[0] + '_dye', c[1] + ' Dye', 'materials', 3, { t: 'dye', a: c[2] }, 'Colors wool, glass, beds and more ' + c[1].toLowerCase() + '.', ['dye']); });
  FLOWERS.forEach(function (f) { shapeless(f[3], f[4], [f[0]], { id: f[3] + '_from_' + f[0] }); });
  shapeless('red_dye', 1, ['beetroot'], { id: 'red_dye_from_beetroot' });
  shapeless('black_dye', 1, ['ink_sac'], { id: 'black_dye_from_ink_sac' });
  shapeless('brown_dye', 1, ['cocoa_beans'], { id: 'brown_dye_from_cocoa_beans' });
  shapeless('blue_dye', 1, ['lapis_lazuli'], { id: 'blue_dye_from_lapis' });
  shapeless('white_dye', 1, ['bone_meal'], { id: 'white_dye_from_bone_meal' });
  smelt('green_dye', 'cactus', { id: 'green_dye_from_cactus' });
  [['orange_dye', 'red_dye', 'yellow_dye'], ['lime_dye', 'green_dye', 'white_dye'], ['cyan_dye', 'blue_dye', 'green_dye'], ['purple_dye', 'red_dye', 'blue_dye'],
   ['magenta_dye', 'purple_dye', 'pink_dye'], ['pink_dye', 'red_dye', 'white_dye'], ['light_blue_dye', 'blue_dye', 'white_dye'], ['gray_dye', 'black_dye', 'white_dye'],
   ['light_gray_dye', 'gray_dye', 'white_dye']].forEach(function (m) { shapeless(m[0], 2, [m[1], m[2]], { id: m[0] + '_mixed' }); });
  COLORS.forEach(function (c) {
    const k = c[0], N = c[1], col = c[2];
    if (k !== 'white') item(k + '_wool', N + ' Wool', 'building', 3, B('wool', col), 'Soft ' + N.toLowerCase() + ' wool.', ['wool', 'color', 'color_wool']);
    else D.items.white_wool.tags.push('color');
    shapeless(k + '_wool', 1, [k + '_dye', '#wool'], { id: k + '_wool_dyed' });
    item(k + '_carpet', N + ' Carpet', 'building', 3, MK('carpet', 'wool', col), 'A soft ' + N.toLowerCase() + ' rug.', ['carpet', 'color']);
    shaped(k + '_carpet', 3, ['WW'], { W: k + '_wool' });
    item(k + '_bed', N + ' Bed', 'building', 3, { t: 'bed', a: col }, 'A comfy ' + N.toLowerCase() + ' bed. Sweet dreams!', ['bed', 'color']);
    shaped(k + '_bed', 1, ['WWW', 'PPP'], { W: k + '_wool', P: '#planks' });
    item(k + '_stained_glass', N + ' Stained Glass', 'building', 3, B('glass', col, { tint: col + '99' }), 'Glass tinted ' + N.toLowerCase() + '.', ['glass', 'color']);
    shaped(k + '_stained_glass', 8, ['GGG', 'GDG', 'GGG'], { G: 'glass', D: k + '_dye' });
  });

  // =============== TIER 4: REDSTONE AND MACHINERY ===============
  item('redstone', 'Redstone Dust', 'machinery', 4, { t: 'dust', a: '#e0282a' }, 'Magic red dust that carries power.', ['redstone'], { res: true });
  item('slime_ball', 'Slimeball', 'animals', 4, { t: 'orb', a: '#7cc95a', w: '#c8f0b0' }, 'Bouncy green goo.', ['animal_drop'], { res: true });
  item('glowstone_dust', 'Glowstone Dust', 'machinery', 4, { t: 'dust', a: '#f8d870' }, 'Glowing yellow dust.', ['light', 'brewing'], { res: true });
  item('redstone_block', 'Block of Redstone', 'machinery', 4, B('metal', '#b8181a'), 'A block that is always powered.', ['redstone', 'storage_block']);
  shaped('redstone_block', 1, ['RRR', 'RRR', 'RRR'], { R: 'redstone' });
  shapeless('redstone', 9, ['redstone_block'], { id: 'redstone_from_block' });
  item('slime_block', 'Slime Block', 'building', 4, B('translucent', '#7cc95a', { b: '#a8e08a' }), 'Super bouncy!', ['storage_block']);
  shaped('slime_block', 1, ['SSS', 'SSS', 'SSS'], { S: 'slime_ball' });
  shapeless('slime_ball', 9, ['slime_block'], { id: 'slime_ball_from_block' });
  item('glowstone', 'Glowstone', 'building', 4, B('lamp', '#e8c050', { b: '#a87a2a' }), 'A glowing block of light.', ['light']);
  shaped('glowstone', 1, ['GG', 'GG'], { G: 'glowstone_dust' });
  item('redstone_torch', 'Redstone Torch', 'machinery', 4, { t: 'torch', x: '#e0282a', y: '#a01a1a', z: '#ff8a8a' }, 'A torch that powers machines.', ['redstone']);
  shaped('redstone_torch', 1, ['R', 'S'], { R: 'redstone', S: 'stick' });
  item('repeater', 'Redstone Repeater', 'machinery', 4, { t: 'repeater', a: '#a8a8a8', x: '#e0282a' }, 'Makes signals stronger and slower.', ['redstone']);
  shaped('repeater', 1, ['TRT', 'SSS'], { T: 'redstone_torch', R: 'redstone', S: 'stone' });
  item('comparator', 'Redstone Comparator', 'machinery', 4, { t: 'repeater', a: '#a8a8a8', x: '#ece6dc' }, 'Compares signals. Clever!', ['redstone']);
  shaped('comparator', 1, ['.T.', 'TQT', 'SSS'], { T: 'redstone_torch', Q: 'quartz', S: 'stone' });
  item('piston', 'Piston', 'machinery', 4, B('cobble', '#7a7a7a', { face: 'piston' }), 'Pushes blocks. Whoosh!', ['redstone', 'machine']);
  shaped('piston', 1, ['PPP', 'CIC', 'CRC'], { P: '#planks', C: 'cobblestone', I: 'iron_ingot', R: 'redstone' });
  item('sticky_piston', 'Sticky Piston', 'machinery', 4, B('cobble', '#7a7a7a', { face: 'piston', sticky: true }), 'Pushes and pulls blocks.', ['redstone', 'machine']);
  shaped('sticky_piston', 1, ['S', 'P'], { S: 'slime_ball', P: 'piston' });
  item('observer', 'Observer', 'machinery', 4, B('cobble', '#5a5a5a', { face: 'eye' }), 'Watches for changes and sends a signal.', ['redstone', 'machine']);
  shaped('observer', 1, ['CCC', 'RRQ', 'CCC'], { C: 'cobblestone', R: 'redstone', Q: 'quartz' });
  item('dispenser', 'Dispenser', 'machinery', 4, B('cobble', '#7a7a7a', { face: 'mouth' }), 'Shoots out items.', ['redstone', 'machine']);
  shaped('dispenser', 1, ['CCC', 'CBC', 'CRC'], { C: 'cobblestone', B: 'bow', R: 'redstone' });
  item('dropper', 'Dropper', 'machinery', 4, B('cobble', '#7a7a7a', { face: 'hole' }), 'Drops items out.', ['redstone', 'machine']);
  shaped('dropper', 1, ['CCC', 'C.C', 'CRC'], { C: 'cobblestone', R: 'redstone' });
  item('redstone_lamp', 'Redstone Lamp', 'machinery', 4, B('lamp', '#c88a3a', { b: '#6a4a2a' }), 'A lamp you can switch on with redstone.', ['redstone', 'light']);
  shaped('redstone_lamp', 1, ['.R.', 'RGR', '.R.'], { R: 'redstone', G: 'glowstone' });
  item('target', 'Target', 'machinery', 4, B('noise', '#f2f2f2', { face: 'target' }), 'Hit the bullseye to send a signal.', ['redstone']);
  shaped('target', 1, ['.R.', 'RHR', '.R.'], { R: 'redstone', H: 'hay_block' });
  item('note_block', 'Note Block', 'machinery', 4, B('planks', '#8a5a32', { face: 'note' }), 'Plays a musical note.', ['redstone', 'music']);
  shaped('note_block', 1, ['PPP', 'PRP', 'PPP'], { P: '#planks', R: 'redstone' });
  item('jukebox', 'Jukebox', 'machinery', 4, B('planks', '#6e4a22', { face: 'disc' }), 'Plays music discs.', ['music']);
  shaped('jukebox', 1, ['PPP', 'PDP', 'PPP'], { P: '#planks', D: 'diamond' });
  item('daylight_detector', 'Daylight Detector', 'machinery', 4, MK('slab', 'planks', '#b8945f', { face: 'daylight' }), 'Senses the sun.', ['redstone']);
  shaped('daylight_detector', 1, ['GGG', 'QQQ', 'SSS'], { G: 'glass', Q: 'quartz', S: '#wooden_slabs' });
  item('hopper', 'Hopper', 'machinery', 4, { t: 'hopper', a: '#4a4a4a' }, 'A funnel that moves items.', ['machine']);
  shaped('hopper', 1, ['I.I', 'ICI', '.I.'], { I: 'iron_ingot', C: 'chest' });
  item('compass', 'Compass', 'tools', 4, { t: 'dial', a: '#a8a8a8', x: '#e0282a' }, 'Always points home.', ['tool']);
  shaped('compass', 1, ['.I.', 'IRI', '.I.'], { I: 'iron_ingot', R: 'redstone' });
  item('clock', 'Clock', 'tools', 4, { t: 'dial', a: '#f7d248', x: '#3a6ad8' }, 'Shows day and night.', ['tool']);
  shaped('clock', 1, ['.G.', 'GRG', '.G.'], { G: 'gold_ingot', R: 'redstone' });
  item('map', 'Empty Map', 'tools', 4, { t: 'paper', a: '#e8dcb0', b: '#a89a6a' }, 'Fill it in as you explore.', ['tool', 'paper']);
  shaped('map', 1, ['PPP', 'PCP', 'PPP'], { P: 'paper', C: 'compass' });
  item('crafter', 'Crafter', 'machinery', 4, B('metal', '#6a6a6a', { face: 'crafter' }), 'A machine that crafts by itself!', ['redstone', 'machine']);
  shaped('crafter', 1, ['III', 'ICI', 'RDR'], { I: 'iron_ingot', C: 'crafting_table', R: 'redstone', D: 'dropper' });
  item('minecart', 'Minecart', 'transport', 4, { t: 'minecart', a: '#8a8a8a' }, 'Ride the rails!', ['vehicle']);
  shaped('minecart', 1, ['I.I', 'III'], { I: 'iron_ingot' });
  item('rail', 'Rail', 'transport', 4, { t: 'rail', a: '#a8a8a8' }, 'Track for minecarts.', ['rail']);
  shaped('rail', 16, ['I.I', 'ISI', 'I.I'], { I: 'iron_ingot', S: 'stick' });
  item('powered_rail', 'Powered Rail', 'transport', 4, { t: 'rail', a: '#f7d248', x: '#e0282a' }, 'Gives minecarts a speed boost.', ['rail', 'redstone']);
  shaped('powered_rail', 6, ['G.G', 'GSG', 'GRG'], { G: 'gold_ingot', S: 'stick', R: 'redstone' });
  item('detector_rail', 'Detector Rail', 'transport', 4, { t: 'rail', a: '#a8a8a8', x: '#e0282a' }, 'Sends a signal when a cart rolls over.', ['rail', 'redstone']);
  shaped('detector_rail', 6, ['I.I', 'IPI', 'IRI'], { I: 'iron_ingot', P: 'stone_pressure_plate', R: 'redstone' });
  item('activator_rail', 'Activator Rail', 'transport', 4, { t: 'rail', a: '#a8a8a8', x: '#8a3a3a' }, 'Switches minecart gadgets on.', ['rail', 'redstone']);
  shaped('activator_rail', 6, ['ISI', 'ITI', 'ISI'], { I: 'iron_ingot', S: 'stick', T: 'redstone_torch' });
  item('chest_minecart', 'Minecart with Chest', 'transport', 4, { t: 'minecart', a: '#8a8a8a', x: '#a8783e' }, 'A minecart that carries cargo.', ['vehicle']);
  shapeless('chest_minecart', 1, ['chest', 'minecart']);
  item('furnace_minecart', 'Minecart with Furnace', 'transport', 4, { t: 'minecart', a: '#8a8a8a', x: '#5a5a5a' }, 'A minecart that pushes itself.', ['vehicle']);
  shapeless('furnace_minecart', 1, ['furnace', 'minecart']);
  item('hopper_minecart', 'Minecart with Hopper', 'transport', 4, { t: 'minecart', a: '#8a8a8a', x: '#4a4a4a' }, 'A minecart that picks up items.', ['vehicle']);
  shapeless('hopper_minecart', 1, ['hopper', 'minecart']);

  // =============== TIER 5: MAGIC ===============
  const res5 = function (id, name, icon, desc, tags, cat) { item(id, name, cat || 'magic', 5, icon, desc, tags, { res: true }); };
  res5('nether_wart', 'Nether Wart', { t: 'wart', a: '#a01a2a' }, 'The base of nearly every potion.', ['brewing']);
  res5('blaze_rod', 'Blaze Rod', { t: 'rod', a: '#f0a02a' }, 'A rod that is warm to the touch.', ['brewing', 'fuel']);
  D.items.blaze_rod.fuel = 48;
  res5('ghast_tear', 'Ghast Tear', { t: 'drop', a: '#d8f0f8' }, 'A sparkly tear. Heals in potions.', ['brewing']);
  res5('spider_eye', 'Spider Eye', { t: 'eye', a: '#a01a3a', x: '#e0405a' }, 'A creepy red eye.', ['brewing']);
  res5('gunpowder', 'Gunpowder', { t: 'dust', a: '#5a5a5a' }, 'Grey powder for fireworks.', ['brewing']);
  res5('ender_pearl', 'Ender Pearl', { t: 'pearl', a: '#1d6a5a', x: '#3ad8a0' }, 'A pearl that teleports things.', ['magic_item']);
  res5('phantom_membrane', 'Phantom Membrane', { t: 'membrane', a: '#c8c0a8' }, 'A light wing piece. Helps you float.', ['brewing']);
  res5('rabbit_foot', 'Rabbit\'s Foot', { t: 'rabbit_foot', a: '#c8a878' }, 'A lucky charm for jumping potions.', ['brewing']);
  res5('pufferfish', 'Pufferfish', { t: 'fish', a: '#f0c82a' }, 'A spiky round fish for water breathing.', ['brewing']);
  res5('prismarine_shard', 'Prismarine Shard', { t: 'shard', a: '#5ab8a8' }, 'A sea-green crystal from the ocean.', ['crystal']);

  item('blaze_powder', 'Blaze Powder', 'magic', 5, { t: 'dust', a: '#f0a02a' }, 'Fiery powder for potions and ender eyes.', ['brewing']);
  shapeless('blaze_powder', 2, ['blaze_rod']);
  item('magma_cream', 'Magma Cream', 'magic', 5, { t: 'orb', a: '#e0602a', w: '#f8c84a' }, 'Hot, gooey cream for fire resistance.', ['brewing']);
  shapeless('magma_cream', 1, ['blaze_powder', 'slime_ball']);
  item('fermented_spider_eye', 'Fermented Spider Eye', 'magic', 5, { t: 'eye', a: '#8a3a4a', x: '#c86a6a' }, 'It flips what a potion does!', ['brewing']);
  shapeless('fermented_spider_eye', 1, ['spider_eye', 'brown_mushroom', 'sugar']);
  item('ender_eye', 'Eye of Ender', 'magic', 5, { t: 'pearl', a: '#3a8a3a', x: '#e8f070' }, 'It floats toward far-away places.', ['magic_item']);
  shapeless('ender_eye', 1, ['ender_pearl', 'blaze_powder']);
  item('brewing_stand', 'Brewing Stand', 'magic', 5, { t: 'brewing_stand' }, 'Brews potions. Opens the Brewing station.', ['station']);
  shaped('brewing_stand', 1, ['.B.', 'CCC'], { B: 'blaze_rod', C: 'cobblestone' });
  item('enchanting_table', 'Enchanting Table', 'magic', 5, B('noise', '#1e1530', { amt: 0.2, face: 'enchant' }), 'A table full of glowing magic.', ['station', 'magic_item']);
  shaped('enchanting_table', 1, ['.B.', 'DOD', 'OOO'], { B: 'book', D: 'diamond', O: 'obsidian' });
  item('ender_chest', 'Ender Chest', 'magic', 5, B('noise', '#1e3530', { amt: 0.2, face: 'ender' }), 'A magic chest that shares its space.', ['storage', 'magic_item']);
  shaped('ender_chest', 1, ['OOO', 'OEO', 'OOO'], { O: 'obsidian', E: 'ender_eye' });
  item('end_crystal', 'End Crystal', 'magic', 5, { t: 'crystal_ball', x: '#e080f0', z: '#ffc0ff' }, 'A floating pink crystal.', ['magic_item']);
  shaped('end_crystal', 1, ['GGG', 'GEG', 'GTG'], { G: 'glass', E: 'ender_eye', T: 'ghast_tear' });
  item('fire_charge', 'Fire Charge', 'magic', 5, { t: 'orb', a: '#6a2a1a', w: '#f0a02a' }, 'A little ball of fire.', ['magic_item']);
  shapeless('fire_charge', 3, ['gunpowder', 'blaze_powder', '#coals']);
  item('firework_rocket', 'Firework Rocket', 'magic', 5, { t: 'rod', a: '#d8403a', c: '#f2f2f2' }, 'Whoosh! Sparkles in the sky.', ['celebration']);
  shapeless('firework_rocket', 3, ['paper', 'gunpowder']);
  item('prismarine', 'Prismarine', 'building', 5, B('speckle', '#5a9a8a', { b: '#3a7a6a', x: '#7ac8b8' }), 'A shimmering sea stone.', ['crystal']);
  shaped('prismarine', 1, ['SS', 'SS'], { S: 'prismarine_shard' });
  item('prismarine_bricks', 'Prismarine Bricks', 'building', 5, B('stonebricks', '#6ab8a8'), 'Bricks from the ocean palace.', ['crystal']);
  shaped('prismarine_bricks', 1, ['SSS', 'SSS', 'SSS'], { S: 'prismarine_shard' });

  item('water_bottle', 'Water Bottle', 'magic', 5, { t: 'bottle', x: '#3a6ad8' }, 'Plain water. The start of every potion.', ['potion_base']);
  shapeless('water_bottle', 3, ['glass_bottle', 'glass_bottle', 'glass_bottle', 'water_bucket'], { orig: true, rem: [{ itemId: 'bucket', quantity: 1 }], note: 'In Minecraft you fill bottles from water. Here one bucket fills three bottles, like a cauldron.' });
  const POT = function (id, name, col, desc) { item(id, name, 'magic', 5, { t: 'bottle', x: col }, desc, ['potion']); };
  POT('awkward_potion', 'Awkward Potion', '#3a5ad8', 'A plain potion, ready for a magic ingredient.');
  POT('potion_of_swiftness', 'Potion of Swiftness', '#7cc8e8', 'Makes you zoom super fast.');
  POT('potion_of_leaping', 'Potion of Leaping', '#22ff4c', 'Jump really high!');
  POT('potion_of_healing', 'Potion of Healing', '#f82423', 'Heals you right up.');
  POT('potion_of_poison', 'Potion of Poison', '#4e9331', 'Yucky green potion.');
  POT('potion_of_regeneration', 'Potion of Regeneration', '#cd5cab', 'Heals you slowly over time.');
  POT('potion_of_strength', 'Potion of Strength', '#932423', 'Makes you extra strong.');
  POT('potion_of_fire_resistance', 'Potion of Fire Resistance', '#e49a3a', 'Stay safe near fire and lava.');
  POT('potion_of_night_vision', 'Potion of Night Vision', '#1f1fa1', 'See in the dark like a cat.');
  POT('potion_of_water_breathing', 'Potion of Water Breathing', '#2e5299', 'Breathe underwater like a fish.');
  POT('potion_of_slow_falling', 'Potion of Slow Falling', '#f7f8e0', 'Float down like a feather.');
  POT('potion_of_invisibility', 'Potion of Invisibility', '#7f8392', 'Now you see me, now you don\'t!');
  POT('potion_of_slowness', 'Potion of Slowness', '#5a6c81', 'Everything goes slooow.');
  POT('potion_of_weakness', 'Potion of Weakness', '#484d48', 'Makes you feel weak and wobbly.');
  POT('strong_potion_of_swiftness', 'Potion of Swiftness II', '#9ad8f0', 'Even faster zooming!');
  POT('strong_potion_of_healing', 'Potion of Healing II', '#ff4a4a', 'Super healing.');
  POT('strong_potion_of_strength', 'Potion of Strength II', '#b02a2a', 'Super strength!');
  POT('strong_potion_of_leaping', 'Potion of Leaping II', '#5aff7a', 'Super-duper jumps.');
  POT('long_potion_of_night_vision', 'Long Potion of Night Vision', '#2a2ac0', 'Night vision that lasts longer.');
  POT('long_potion_of_swiftness', 'Long Potion of Swiftness', '#6ab8d8', 'Speed that lasts longer.');
  brew('awkward_potion', 'water_bottle', 'nether_wart');
  [['potion_of_swiftness', 'sugar'], ['potion_of_leaping', 'rabbit_foot'], ['potion_of_healing', 'glistering_melon_slice'], ['potion_of_poison', 'spider_eye'],
   ['potion_of_regeneration', 'ghast_tear'], ['potion_of_strength', 'blaze_powder'], ['potion_of_fire_resistance', 'magma_cream'], ['potion_of_night_vision', 'golden_carrot'],
   ['potion_of_water_breathing', 'pufferfish'], ['potion_of_slow_falling', 'phantom_membrane']].forEach(function (p) { brew(p[0], 'awkward_potion', p[1]); });
  brew('potion_of_invisibility', 'potion_of_night_vision', 'fermented_spider_eye');
  brew('potion_of_slowness', 'potion_of_swiftness', 'fermented_spider_eye');
  brew('potion_of_weakness', 'water_bottle', 'fermented_spider_eye');
  brew('strong_potion_of_swiftness', 'potion_of_swiftness', 'glowstone_dust');
  brew('strong_potion_of_healing', 'potion_of_healing', 'glowstone_dust');
  brew('strong_potion_of_strength', 'potion_of_strength', 'glowstone_dust');
  brew('strong_potion_of_leaping', 'potion_of_leaping', 'glowstone_dust');
  brew('long_potion_of_night_vision', 'potion_of_night_vision', 'redstone');
  brew('long_potion_of_swiftness', 'potion_of_swiftness', 'redstone');

  // ---- original magic content ----
  item('sparkle_dust', 'Sparkle Dust', 'magic', 5, { t: 'dust', a: '#f0a0f0', c: '#ffffff' }, 'Glittery dust that makes things magical. Original to this game.', ['magic_item', 'original'], O);
  shapeless('sparkle_dust', 3, ['glowstone_dust', 'redstone', 'sugar'], { orig: true, msg: 'Sparkle Dust! Try adding it to things to make them magical.' });
  item('wonder_wand', 'Wonder Wand', 'magic', 5, { t: 'wand', a: '#6e4a22', x: '#f7c843', z: '#ffffff' }, 'A wand that crackles with sparkles.', ['magic_item', 'original'], O);
  shaped('wonder_wand', 1, ['..A', '.B.', 'B..'], { A: 'amethyst_shard', B: 'blaze_rod' }, { orig: true, msg: 'A Wonder Wand! The magic chamber can feel it.' });
  item('seeing_sphere', 'Seeing Sphere', 'magic', 5, { t: 'crystal_ball', x: '#a46ae0', z: '#e8d0ff' }, 'A crystal ball that shows faraway places.', ['magic_item', 'original'], O);
  shaped('seeing_sphere', 1, ['.G.', 'GEG', '.A.'], { G: 'glass', E: 'ender_eye', A: 'amethyst_block' }, O);
  item('wizard_hat', 'Wizard Hat', 'armor', 5, { t: 'hat', a: '#5a3ab8', x: '#f7c843' }, 'A pointy hat full of stars.', ['magic_item', 'original'], O);
  shaped('wizard_hat', 1, ['.W.', 'WSW'], { W: 'purple_wool', S: 'sparkle_dust' }, O);
  item('moon_lantern', 'Moon Lantern', 'magic', 5, { t: 'lantern', a: '#3a3a6a', x: '#d0e8ff' }, 'A lantern with a little moon inside.', ['light', 'original'], O);
  shapeless('moon_lantern', 1, ['lantern', 'sparkle_dust', 'glowstone_dust'], O);
  item('star_shard', 'Star Shard', 'magic', 5, { t: 'star', a: '#f7d248', c: '#fff4b0' }, 'A tiny fallen star.', ['magic_item', 'original'], O);
  shapeless('star_shard', 1, ['amethyst_shard', 'sparkle_dust', 'gold_nugget'], O);
  item('spell_book', 'Spell Book', 'magic', 5, { t: 'book', a: '#5a3ab8', x: '#f0e8ff' }, 'A book of shimmering spells.', ['magic_item', 'original'], O);
  shapeless('spell_book', 1, ['book', 'sparkle_dust', 'lapis_lazuli'], O);
  item('magic_candle', 'Magic Candle', 'magic', 5, { t: 'candle', a: '#c8a0ff', x: '#a0f0ff' }, 'A candle with a blue magic flame.', ['light', 'original'], O);
  shapeless('magic_candle', 1, ['candle', 'sparkle_dust'], O);
  item('rainbow_thread', 'Rainbow Thread', 'magic', 5, { t: 'rainbow' }, 'Thread spun from every color of the rainbow.', ['magic_item', 'original'], O);
  shapeless('rainbow_thread', 1, ['red_dye', 'orange_dye', 'yellow_dye', 'lime_dye', 'light_blue_dye', 'blue_dye', 'purple_dye', 'string'], { orig: true, msg: 'All the colors in one thread!' });
  item('bubble_wand', 'Bubble Wand', 'magic', 5, { t: 'wand', a: '#c8c8c8', x: '#a0f0ff', z: '#ffffff' }, 'Blow giant bubbles! A silly secret.', ['toy', 'original', 'secret'], { orig: true, secret: true });
  shapeless('bubble_wand', 1, ['stick', 'slime_ball', 'water_bottle'], { orig: true, secret: true, msg: 'Bloop bloop! You found a secret bubble wand.' });
  item('disco_ball', 'Disco Ball', 'magic', 5, { t: 'disco', a: '#c8d0e0' }, 'A spinning party light. A fun secret!', ['toy', 'light', 'original', 'secret'], { orig: true, secret: true });
  shaped('disco_ball', 1, ['.C.', 'GAG', '.G.'], { C: 'chain', G: 'glass', A: 'amethyst_shard' }, { orig: true, secret: true, msg: 'Party time! You found the secret Disco Ball.' });

  // ---- creatures (original figurines) ----
  item('snow_pal', 'Snow Pal', 'animals', 3, { t: 'snowman' }, 'A friendly snow buddy figure.', ['creature', 'original'], O);
  shaped('snow_pal', 1, ['P', 'S', 'S'], { P: 'pumpkin', S: 'snow_block' }, { orig: true, msg: 'A Snow Pal! Inspired by building a snow golem.' });
  item('iron_guardian', 'Iron Guardian', 'animals', 4, { t: 'helmet', a: '#c8c8c8', c: '#ffffff', b: '#7a8a6a' }, 'A tiny statue of a big iron protector.', ['creature', 'original'], O);
  shaped('iron_guardian', 1, ['.P.', 'BBB', '.B.'], { P: 'pumpkin', B: 'iron_block' }, { orig: true, msg: 'An Iron Guardian! Inspired by building an iron golem.' });
  item('rubber_duck', 'Rubber Duck', 'animals', 3, { t: 'duck', a: '#fed83d', x: '#f07c18' }, 'Squeak! A bathtime buddy. A silly secret.', ['creature', 'toy', 'original', 'secret'], { orig: true, secret: true });
  shapeless('rubber_duck', 1, ['yellow_wool', 'orange_dye', 'water_bucket'], { orig: true, secret: true, rem: [{ itemId: 'water_bucket', quantity: 1 }], msg: 'Squeak squeak! You found the secret Rubber Duck.' });
  item('bunny_plush', 'Bunny Plush', 'animals', 3, { t: 'rabbit_foot', a: '#f2f2f2', x: '#f38baa' }, 'A soft, huggable bunny.', ['creature', 'toy', 'original'], O);
  shapeless('bunny_plush', 1, ['white_wool', 'white_wool', 'pink_dye', 'carrot'], O);
  item('party_hat_cake', 'Party Cake Hat', 'armor', 3, { t: 'cake', a: '#f38baa', x: '#fed83d' }, 'A whole cake... on your head! A silly secret.', ['toy', 'original', 'secret'], { orig: true, secret: true });
  shapeless('party_hat_cake', 1, ['cake', 'leather_helmet'], { orig: true, secret: true, msg: 'Hats off! Wait, it is a cake. You found a secret!' });
  item('clockwork_parrot', 'Clockwork Parrot', 'animals', 4, { t: 'duck', a: '#3ac04a', x: '#e8403a' }, 'A wind-up parrot that chirps on the hour.', ['creature', 'machine', 'original'], O);
  shaped('clockwork_parrot', 1, ['FFF', 'FCF', '.R.'], { F: 'feather', C: 'clock', R: 'repeater' }, O);
})(typeof window !== 'undefined' ? (window.WOW = window.WOW || {}) : (globalThis.WOW = globalThis.WOW || {}));
