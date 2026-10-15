/* Workshop of Wonders - legendary tier, biomes, quests. */
(function (W) {
  'use strict';
  const D = W.Data, b = D.build, item = b.item, shaped = b.shaped, shapeless = b.shapeless, smelt = b.smelt, smith = b.smith;
  const B = function (s, a, extra) { return Object.assign({ t: 'block', s: s, a: a }, extra || {}); };
  const O = { orig: true };

  // =============== TIER 6: LEGENDARY ===============
  item('ancient_debris', 'Ancient Debris', 'legendary', 6, B('cobble', '#6a4a3a'), 'A super-rare, super-tough rock.', ['ore'], { res: true });
  item('netherrack', 'Netherrack', 'legendary', 6, B('speckle', '#7a2a2a', { b: '#5a1a1a', x: '#9a4a4a' }), 'Warm red rock from a fiery land.', ['stone'], { res: true });
  item('netherite_upgrade_smithing_template', 'Netherite Upgrade Template', 'legendary', 6, { t: 'template', a: '#4a3a3a', x: '#8a5a4a' }, 'A pattern for upgrading diamond gear.', ['template'], { res: true });
  item('nether_star', 'Nether Star', 'legendary', 6, { t: 'star', a: '#e8f0f8', c: '#ffffff' }, 'A brilliant star. Powers a beacon.', ['legendary_material'], { res: true });
  item('netherite_scrap', 'Netherite Scrap', 'legendary', 6, { t: 'chunk', a: '#6a4a3a', x: '#4a3228' }, 'Melted debris, ready to become netherite.', ['metal']);
  smelt('netherite_scrap', 'ancient_debris');
  item('netherite_ingot', 'Netherite Ingot', 'legendary', 6, { t: 'ingot', a: '#4a3a3a' }, 'The strongest metal of all.', ['metal']);
  shapeless('netherite_ingot', 1, ['netherite_scrap', 'netherite_scrap', 'netherite_scrap', 'netherite_scrap', 'gold_ingot', 'gold_ingot', 'gold_ingot', 'gold_ingot']);
  item('netherite_block', 'Block of Netherite', 'legendary', 6, B('metal', '#3a3030'), 'Nine netherite ingots in one block.', ['storage_block']);
  shaped('netherite_block', 1, ['NNN', 'NNN', 'NNN'], { N: 'netherite_ingot' });
  shapeless('netherite_ingot', 9, ['netherite_block'], { id: 'netherite_ingot_from_block' });
  shaped('netherite_upgrade_smithing_template', 2, ['DTD', 'DND', 'DDD'], { D: 'diamond', T: 'netherite_upgrade_smithing_template', N: 'netherrack' }, { id: 'netherite_template_copy' });
  D.toolKinds.forEach(function (k) {
    item('netherite_' + k, 'Netherite ' + k.charAt(0).toUpperCase() + k.slice(1), 'tools', 6, { t: k, a: '#4a3a3a' }, 'Legendary-strength ' + k + '.', ['tool', k, 'netherite']);
    smith('netherite_' + k, 'netherite_upgrade_smithing_template', 'diamond_' + k, 'netherite_ingot');
  });
  D.armorKinds.forEach(function (k) {
    item('netherite_' + k, 'Netherite ' + k.charAt(0).toUpperCase() + k.slice(1), 'armor', 6, { t: k, a: '#4a3a3a' }, 'The toughest armor there is.', ['armor', k, 'netherite']);
    smith('netherite_' + k, 'netherite_upgrade_smithing_template', 'diamond_' + k, 'netherite_ingot');
  });
  item('beacon', 'Beacon', 'legendary', 6, B('glass', '#9ff3f0', { face: 'beacon' }), 'Shines a beam of light into the sky.', ['legendary_material', 'light']);
  shaped('beacon', 1, ['GGG', 'GSG', 'OOO'], { G: 'glass', S: 'nether_star', O: 'obsidian' });

  // original legendary project parts
  const L = function (id, name, icon, desc, tags) { item(id, name, 'legendary', 6, icon, desc, ['legendary_part', 'original'].concat(tags || []), O); };
  L('ember_scale', 'Ember Scale', { t: 'shield', a: '#e0602a', c: '#f7c843', h: '#6a2a1a' }, 'A scale that glows like a campfire. Part of the Wonder Engine.');
  shapeless('ember_scale', 1, ['netherite_scrap', 'magma_cream', 'emerald'], { orig: true, msg: 'An Ember Scale! One piece of the Wonder Engine.' });
  L('prism_lens', 'Prism Lens', { t: 'gem', a: '#c8a0ff' }, 'Bends light into rainbows. Part of the Wonder Engine.');
  shaped('prism_lens', 1, ['.T.', 'TDT', '.S.'], { T: 'tinted_glass', D: 'diamond', S: 'sparkle_dust' }, { orig: true, msg: 'A Prism Lens! One piece of the Wonder Engine.' });
  L('sky_gear', 'Sky Gear', { t: 'dial', a: '#c8c8c8', x: '#e0282a' }, 'A gear that never stops turning. Part of the Wonder Engine.');
  shaped('sky_gear', 1, ['.R.', 'IOI', '.R.'], { R: 'redstone_block', I: 'iron_block', O: 'observer' }, { orig: true, msg: 'A Sky Gear! One piece of the Wonder Engine.' });
  L('heartwood_core', 'Heartwood Core', B('log', '#8a5a2a', { b: '#f7c843', spots: true, spotColor: '#f7c843' }), 'The heart of the oldest tree. Part of the Wonder Engine.');
  shaped('heartwood_core', 1, ['LLL', 'LGL', 'LLL'], { L: '#logs', G: 'golden_apple' }, { orig: true, msg: 'A Heartwood Core! One piece of the Wonder Engine.' });
  L('star_compass', 'Star Compass', { t: 'dial', a: '#f7d248', x: '#a46ae0' }, 'Points toward wonders. Part of the Wonder Engine.');
  shapeless('star_compass', 1, ['compass', 'star_shard', 'sparkle_dust'], { orig: true, msg: 'A Star Compass! One piece of the Wonder Engine.' });
  L('rainbow_crystal', 'Rainbow Crystal', { t: 'gem', a: '#f38baa', c: '#a0f0ff' }, 'A crystal holding every color. Part of the Wonder Engine.');
  shaped('rainbow_crystal', 1, ['.R.', 'RAR', '.D.'], { R: 'rainbow_thread', A: 'amethyst_block', D: 'diamond' }, { orig: true, msg: 'A Rainbow Crystal! One piece of the Wonder Engine.' });
  L('wonder_engine', 'The Wonder Engine', B('metal', '#f7c843', { face: 'core' }), 'The legendary machine at the heart of your workshop. You did it!', ['final']);
  shaped('wonder_engine', 1, ['SLC', 'GHG', 'RBR'], { S: 'ember_scale', L: 'prism_lens', C: 'star_compass', G: 'sky_gear', H: 'heartwood_core', R: 'rainbow_crystal', B: 'beacon' }, { orig: true, msg: 'THE WONDER ENGINE! Your workshop roars to life. Creative Sandbox is unlocked!' });
  L('starforged_sword', 'Starforged Sword', { t: 'sword', a: '#c8d8ff', x: '#f7d248' }, 'A sword with a star in its blade.', ['equipment']);
  shaped('starforged_sword', 1, ['T', 'T', 'N'], { T: 'star_shard', N: 'netherite_sword' }, O);
  L('starforged_pickaxe', 'Starforged Pickaxe', { t: 'pickaxe', a: '#c8d8ff' }, 'Digs through anything, and twinkles while it does.', ['equipment']);
  shaped('starforged_pickaxe', 1, ['TTT', '.N.'], { T: 'star_shard', N: 'netherite_pickaxe' }, O);
  L('crown_of_wonders', 'Crown of Wonders', { t: 'crown', a: '#f7d248', x: '#3ad86a' }, 'A crown for the master of the workshop.', ['equipment']);
  shaped('crown_of_wonders', 1, ['EDE', 'GGG'], { E: 'emerald', D: 'diamond', G: 'gold_ingot' }, O);
  L('phoenix_cape', 'Phoenix Cape', { t: 'chestplate', a: '#e0602a', c: '#f7c843' }, 'A cape of warm feathers that never burns.', ['equipment']);
  shaped('phoenix_cape', 1, ['F.F', 'EME', 'F.F'], { F: 'feather', E: 'ember_scale', M: 'phantom_membrane' }, O);
  L('sky_boots', 'Sky Boots', { t: 'boots', a: '#a0d8ff', c: '#ffffff' }, 'Boots that make every step feel like floating.', ['equipment']);
  shapeless('sky_boots', 1, ['netherite_boots', 'phantom_membrane', 'feather', 'star_shard'], O);

  // =============== BIOMES ===============
  const res = function (filter) { return D.itemOrder.filter(function (id) { const it = D.items[id]; return it.resource && filter(it); }); };
  D.biomes = [
    { id: 'workshop', name: 'Starter Workshop', tier: 1, color: '#c69c5e', icon: 'crafting_table', blurb: 'Your cozy workshop with a little crafting table.',
      resources: ['oak_log', 'dirt', 'cobblestone', 'sand', 'coal'] },
    { id: 'forest', name: 'Whispering Forest', tier: 1, color: '#4f8a3a', icon: 'birch_log', blurb: 'Eight kinds of trees, vines, apples and feathers.',
      resources: ['spruce_log', 'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log', 'mangrove_log', 'cherry_log', 'vine', 'apple', 'string', 'feather', 'snowball'] },
    { id: 'mine', name: 'Pebble Mine', tier: 1, color: '#7d7d7d', icon: 'granite', blurb: 'Gravel, flint, clay and speckled stones.',
      resources: ['gravel', 'flint', 'clay_ball', 'granite', 'diorite', 'andesite'] },
    { id: 'forge', name: 'Glowing Forge', tier: 2, color: '#d8804a', icon: 'iron_ingot', blurb: 'Ores and gems to melt and shape.',
      resources: ['raw_iron', 'raw_gold', 'raw_copper', 'diamond', 'emerald', 'lapis_lazuli', 'amethyst_shard', 'quartz', 'obsidian'] },
    { id: 'farm', name: 'Sunny Farm', tier: 3, color: '#7ab83a', icon: 'wheat', blurb: 'Crops, flowers, animals and a water well.',
      resources: res(function (it) { return it.tier === 3; }) },
    { id: 'machine', name: 'Clockwork Room', tier: 4, color: '#c8382a', icon: 'redstone', blurb: 'Redstone, slime, gunpowder and glowing dust.',
      resources: ['redstone', 'slime_ball', 'glowstone_dust', 'gunpowder'] },
    { id: 'magic', name: 'Moonlit Chamber', tier: 5, color: '#8a4ad8', icon: 'nether_wart', blurb: 'Rare ingredients for potions and spells.',
      resources: res(function (it) { return it.tier === 5; }) },
    { id: 'legend', name: 'Hall of Legends', tier: 6, color: '#f7c843', icon: 'nether_star', blurb: 'The rarest treasures in the world.',
      resources: res(function (it) { return it.tier === 6; }) }
  ];

  // =============== QUESTS ===============
  // cond: { craft: [ids] } all crafted; { craftAny: [ids or #tag], count } distinct crafted; { discoverCount: n }
  const Q = D.quests = [];
  function quest(id, name, desc, tier, cond, reward, o) {
    o = o || {};
    Q.push({ id: id, name: name, description: desc, tier: tier, prerequisites: o.pre || [], conditions: cond, rewards: reward || {}, optional: !!o.opt, milestone: !!o.milestone, biome: o.biome || null });
  }
  // Tier 1
  quest('t1_planks', 'Make some planks', 'Put an Oak Log in the crafting grid and collect the planks.', 1, { craft: ['oak_planks'] }, {});
  quest('t1_sticks', 'Snap some sticks', 'Stack two planks on top of each other.', 1, { craft: ['stick'] }, {}, { pre: ['t1_planks'] });
  quest('t1_table', 'Build a Crafting Table', 'Fill the 2 by 2 grid with planks. It makes your grid bigger!', 1, { craft: ['crafting_table'] }, { grid3: true }, { pre: ['t1_sticks'] });
  quest('t1_pickaxe', 'Wooden Pickaxe', 'Three planks across the top, two sticks down the middle.', 1, { craft: ['wooden_pickaxe'] }, { biome: 'forest' }, { pre: ['t1_table'] });
  quest('t1_furnace', 'Build a Furnace', 'Make a ring of cobblestone with an empty middle.', 1, { craft: ['furnace'] }, {}, { pre: ['t1_pickaxe'] });
  quest('t1_stone_tools', 'Stone Tools', 'Make two different stone tools.', 1, { craftAny: ['stone_pickaxe', 'stone_axe', 'stone_shovel', 'stone_hoe', 'stone_sword'], count: 2 }, { biome: 'mine' }, { pre: ['t1_furnace'] });
  quest('t1_upgrade', 'Workshop Upgrade', 'Craft a Chest, a Torch and some Glass to brighten up the workshop.', 1, { craft: ['chest', 'torch', 'glass'] }, { tier: 2, biome: 'forge' }, { pre: ['t1_stone_tools'], milestone: true });
  quest('t1_lumber', 'Lumberjack', 'Make planks from 5 different kinds of trees.', 1, { craftAny: ['#planks'], count: 5 }, {}, { pre: ['t1_pickaxe'], opt: true });
  quest('t1_boat', 'Ahoy!', 'Build any wooden boat.', 1, { craftAny: ['#vehicle_boat'], count: 1 }, {}, { pre: ['t1_table'], opt: true });
  quest('t1_castle', 'Castle Builder', 'Craft Stone Bricks and Stone Brick Stairs.', 1, { craft: ['stone_bricks', 'stone_brick_stairs'] }, {}, { pre: ['t1_furnace'], opt: true });
  quest('t1_camp', 'Camp Night', 'Build a Campfire.', 1, { craft: ['campfire'] }, {}, { pre: ['t1_pickaxe'], opt: true });
  // Tier 2
  quest('t2_iron', 'Iron Age', 'Smelt Raw Iron into an Iron Ingot.', 2, { craft: ['iron_ingot'] }, {}, { pre: ['t1_upgrade'] });
  quest('t2_bucket', 'Bucket Time', 'Craft a Bucket.', 2, { craft: ['bucket'] }, {}, { pre: ['t2_iron'] });
  quest('t2_pick', 'Iron Pickaxe', 'Craft an Iron Pickaxe.', 2, { craft: ['iron_pickaxe'] }, {}, { pre: ['t2_iron'] });
  quest('t2_armor', 'Armor Up', 'Craft any piece of iron armor.', 2, { craftAny: ['iron_helmet', 'iron_chestplate', 'iron_leggings', 'iron_boots'], count: 1 }, {}, { pre: ['t2_iron'] });
  quest('t2_diamond', 'Diamonds!', 'Craft a Diamond Pickaxe.', 2, { craft: ['diamond_pickaxe'] }, {}, { pre: ['t2_pick'] });
  quest('t2_master', 'Forge Master', 'Craft an Anvil, a Lantern and a Smithing Table.', 2, { craft: ['anvil', 'lantern', 'smithing_table'] }, { tier: 3, biome: 'farm' }, { pre: ['t2_bucket', 't2_armor', 't2_diamond'], milestone: true });
  quest('t2_full_iron', 'Knight in Shining Armor', 'Craft all four pieces of iron armor.', 2, { craft: ['iron_helmet', 'iron_chestplate', 'iron_leggings', 'iron_boots'] }, {}, { pre: ['t2_armor'], opt: true });
  quest('t2_gems', 'Gem Collector', 'Craft blocks of Diamond, Emerald and Lapis.', 2, { craft: ['diamond_block', 'emerald_block', 'lapis_block'] }, {}, { pre: ['t2_diamond'], opt: true });
  quest('t2_spy', 'Lookout', 'Craft a Spyglass.', 2, { craft: ['spyglass'] }, {}, { pre: ['t2_iron'], opt: true });
  // Tier 3
  quest('t3_bread', 'Baker', 'Bake a loaf of Bread from wheat.', 3, { craft: ['bread'] }, {}, { pre: ['t2_master'] });
  quest('t3_cookie', 'Cookie Time', 'Make Cookies with wheat and cocoa.', 3, { craft: ['cookie'] }, {}, { pre: ['t3_bread'] });
  quest('t3_dye', 'Splash of Color', 'Turn a flower into dye.', 3, { craftAny: ['#dye'], count: 1 }, {}, { pre: ['t2_master'] });
  quest('t3_wool', 'Colorful Wool', 'Dye some wool any color you like.', 3, { craftAny: ['#color_wool'], count: 1 }, {}, { pre: ['t3_dye'] });
  quest('t3_book', 'Bookworm', 'Make a Book from paper and leather.', 3, { craft: ['book'] }, {}, { pre: ['t2_master'] });
  quest('t3_feast', 'Grand Feast', 'Make a Cake and a Pumpkin Pie for a party!', 3, { craft: ['cake', 'pumpkin_pie'] }, { tier: 4, biome: 'machine' }, { pre: ['t3_cookie', 't3_wool', 't3_book'], milestone: true });
  quest('t3_rainbow', 'Rainbow Maker', 'Dye wool in 6 different colors.', 3, { craftAny: ['#color_wool'], count: 6 }, {}, { pre: ['t3_wool'], opt: true });
  quest('t3_chef', 'Little Chef', 'Cook 5 different foods in the furnace.', 3, { craftAny: ['#cooked'], count: 5 }, {}, { pre: ['t3_bread'], opt: true });
  quest('t3_bed', 'Bedtime', 'Craft a bed in any color.', 3, { craftAny: ['#bed'], count: 1 }, {}, { pre: ['t3_wool'], opt: true });
  quest('t3_garden', 'Happy Garden', 'Craft a Composter and a Beehive.', 3, { craft: ['composter', 'beehive'] }, {}, { pre: ['t3_bread'], opt: true });
  quest('t3_snow', 'Snow Buddy', 'Build a Snow Pal from a pumpkin and snow.', 3, { craft: ['snow_pal'] }, {}, { pre: ['t2_master'], opt: true });
  // Tier 4
  quest('t4_torch', 'Red Power', 'Craft a Redstone Torch.', 4, { craft: ['redstone_torch'] }, {}, { pre: ['t3_feast'] });
  quest('t4_piston', 'Push It', 'Craft a Piston.', 4, { craft: ['piston'] }, {}, { pre: ['t4_torch'] });
  quest('t4_rails', 'All Aboard', 'Craft a Minecart and some Rails.', 4, { craft: ['minecart', 'rail'] }, {}, { pre: ['t4_torch'] });
  quest('t4_time', 'Tick Tock', 'Craft a Clock or a Compass.', 4, { craftAny: ['clock', 'compass'], count: 1 }, {}, { pre: ['t4_torch'] });
  quest('t4_room', 'Clockwork Room', 'Craft an Observer and a Crafter.', 4, { craft: ['observer', 'crafter'] }, { tier: 5, biome: 'magic' }, { pre: ['t4_piston', 't4_rails', 't4_time'], milestone: true });
  quest('t4_express', 'Express Train', 'Craft a Powered Rail and a Minecart with Chest.', 4, { craft: ['powered_rail', 'chest_minecart'] }, {}, { pre: ['t4_rails'], opt: true });
  quest('t4_lamp', 'Lights On', 'Craft a Redstone Lamp.', 4, { craft: ['redstone_lamp'] }, {}, { pre: ['t4_torch'], opt: true });
  quest('t4_tnt', 'Big Red Block', 'Craft TNT from Gunpowder and Sand.', 4, { craft: ['tnt'] }, {}, { pre: ['t4_torch'], opt: true });
  quest('t4_parrot', 'Wind-up Friend', 'Build a Clockwork Parrot.', 4, { craft: ['clockwork_parrot'] }, {}, { pre: ['t4_time'], opt: true });
  // Tier 5
  quest('t5_stand', 'Potion Lab', 'Craft a Brewing Stand.', 5, { craft: ['brewing_stand'] }, {}, { pre: ['t4_room'] });
  quest('t5_awkward', 'Awkward!', 'Brew an Awkward Potion from a Water Bottle and Nether Wart.', 5, { craft: ['awkward_potion'] }, {}, { pre: ['t5_stand'] });
  quest('t5_potion', 'First Potion', 'Brew any potion with a real effect.', 5, { craftAny: ['potion_of_swiftness', 'potion_of_leaping', 'potion_of_healing', 'potion_of_poison', 'potion_of_regeneration', 'potion_of_strength', 'potion_of_fire_resistance', 'potion_of_night_vision', 'potion_of_water_breathing', 'potion_of_slow_falling'], count: 1 }, {}, { pre: ['t5_awkward'] });
  quest('t5_sparkle', 'Sparkle!', 'Mix Glowstone Dust, Redstone and Sugar.', 5, { craft: ['sparkle_dust'] }, {}, { pre: ['t4_room'] });
  quest('t5_eye', 'Eye of Ender', 'Craft an Eye of Ender.', 5, { craft: ['ender_eye'] }, {}, { pre: ['t4_room'] });
  quest('t5_enchant', 'Enchanter', 'Craft an Enchanting Table.', 5, { craft: ['enchanting_table'] }, {}, { pre: ['t4_room'] });
  quest('t5_archmage', 'Archmage', 'Craft a Wonder Wand and a Spell Book.', 5, { craft: ['wonder_wand', 'spell_book'] }, { tier: 6, biome: 'legend' }, { pre: ['t5_potion', 't5_sparkle', 't5_eye', 't5_enchant'], milestone: true });
  quest('t5_potions', 'Potion Master', 'Brew 8 different potions.', 5, { craftAny: ['#potion'], count: 8 }, {}, { pre: ['t5_potion'], opt: true });
  quest('t5_secret', 'Secret Finder', 'Find any secret recipe.', 5, { craftAny: ['#secret'], count: 1 }, {}, { pre: ['t4_room'], opt: true });
  quest('t5_secrets', 'Secret Keeper', 'Find all four secret recipes.', 5, { craftAny: ['#secret'], count: 4 }, {}, { pre: ['t5_secret'], opt: true });
  // Tier 6
  quest('t6_netherite', 'Netherite!', 'Make a Netherite Ingot.', 6, { craft: ['netherite_ingot'] }, {}, { pre: ['t5_archmage'] });
  quest('t6_upgrade', 'Ultimate Upgrade', 'Upgrade any diamond tool at the Smithing station.', 6, { craftAny: ['netherite_pickaxe', 'netherite_axe', 'netherite_shovel', 'netherite_hoe', 'netherite_sword'], count: 1 }, {}, { pre: ['t6_netherite'] });
  quest('t6_beacon', 'Beam of Light', 'Craft a Beacon.', 6, { craft: ['beacon'] }, {}, { pre: ['t5_archmage'] });
  quest('t6_parts', 'Engine Parts', 'Craft all six Wonder Engine parts.', 6, { craft: ['ember_scale', 'prism_lens', 'sky_gear', 'heartwood_core', 'star_compass', 'rainbow_crystal'] }, {}, { pre: ['t6_netherite'] });
  quest('t6_engine', 'The Wonder Engine', 'Put all the parts together with a Beacon in the middle row.', 6, { craft: ['wonder_engine'] }, { sandbox: true }, { pre: ['t6_parts', 't6_beacon', 't6_upgrade'], milestone: true });
  quest('t6_gear', 'Legendary Gear', 'Craft the Starforged Sword and the Crown of Wonders.', 6, { craft: ['starforged_sword', 'crown_of_wonders'] }, {}, { pre: ['t6_upgrade'], opt: true });
  quest('t6_collector', 'Grand Collector', 'Discover 300 items.', 6, { discoverCount: 300 }, {}, { pre: ['t5_archmage'], opt: true });
})(typeof window !== 'undefined' ? (window.WOW = window.WOW || {}) : (globalThis.WOW = globalThis.WOW || {}));
