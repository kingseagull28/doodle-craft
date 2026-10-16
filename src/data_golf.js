/* Workshop of Wonders - Chip Shot expansion: mini golf gear, obstacles, themed holes and rare golf treasures.
   All 20 items are original content and live in the 'chip_shot' book collection. */
(function (W) {
  'use strict';
  const D = W.Data, b = D.build, item = b.item, shaped = b.shaped;
  const O = { orig: true };
  const CAT = 'chip_shot';
  // An item's tier is the highest tier among its ingredients, so it unlocks with them.
  const tierOf = function (ids) { return Math.max.apply(null, ids.map(function (id) { return D.items[id].tier; })); };
  const golf = function (id, name, tpl, colors, desc, ingredients) {
    item(id, name, CAT, tierOf(ingredients), Object.assign({ t: tpl }, colors), desc, [CAT, 'golf', 'original'], O);
  };
  const GRASS = { a: '#4fb03a', c: '#7ad858', b: '#2e7a24' };

  D.collections = D.collections || {};
  D.collections[CAT] = {
    name: 'Chip Shot',
    description: 'Grab your putter and get ready for tiny adventures! Build crazy obstacles, explore wild mini golf courses, and discover legendary golfing treasures!',
    icon: { t: 'chip_shot_icon' },
    masterTitle: '⛳ CHIP SHOT CHAMPION! 🏆',
    masterText: 'You\'ve conquered every obstacle, mastered every miniature hole, and earned your place among the mini golf legends!',
    badge: 'Chip Shot Champion'
  };

  // ---------- golf basics ----------
  golf('golf_ball', 'Golf Ball', 'golf_ball', { a: '#f2f2ea', c: '#ffffff', b: '#c4c4bc' }, 'A tiny white golf ball with little dimples.', ['white_wool', 'snowball']);
  shaped('golf_ball', 4, ['.W.', 'WSW', '.W.'], { W: 'white_wool', S: 'snowball' }, { orig: true, msg: 'Golf Balls! Ready to putt.' });

  golf('putter', 'Putter', 'putter', {}, 'A little club for tapping the ball.', ['stick', 'iron_ingot']);
  shaped('putter', 1, ['.S', '.S', 'IS'], { S: 'stick', I: 'iron_ingot' }, O);

  golf('putting_green', 'Putting Green', 'turf_patch', { x: '#8a5a30' }, 'Soft green grass for a golf course.', ['green_wool', 'dirt']);
  shaped('putting_green', 4, ['GGG', 'DDD'], { G: 'green_wool', D: 'dirt' }, O);

  golf('golf_hole_flag', 'Golf Hole and Flag', 'hole_flag', {}, 'A hole with a red flag. Aim here!', ['red_wool', 'stick', 'putting_green', 'golf_ball']);
  shaped('golf_hole_flag', 1, ['.R.', '.S.', 'PBP'], { R: 'red_wool', S: 'stick', P: 'putting_green', B: 'golf_ball' }, { orig: true, msg: 'A Golf Hole and Flag! Now build a course.' });

  golf('scorecard', 'Scorecard', 'scorecard', { a: '#f4ecd0', b: '#b8a888', x: '#4fb03a' }, 'Write down your score with the tiny pencil.', ['paper', 'ink_sac', 'feather']);
  shaped('scorecard', 1, ['PPP', '.I.', '.F.'], { P: 'paper', I: 'ink_sac', F: 'feather' }, O);

  // ---------- course obstacles ----------
  golf('windmill_obstacle', 'Windmill Obstacle', 'windmill', {}, 'A little windmill. Its blades go round and round.', ['oak_planks', 'iron_ingot', 'putting_green']);
  shaped('windmill_obstacle', 1, ['.P.', 'PIP', 'GGG'], { P: 'oak_planks', I: 'iron_ingot', G: 'putting_green' }, O);

  golf('golf_ramp', 'Ramp', 'ramp', { a: '#4fb03a', c: '#7ad858' }, 'A green ramp. Up and over!', ['oak_slab', 'putting_green']);
  shaped('golf_ramp', 2, ['..S', '.SS', 'GGG'], { S: 'oak_slab', G: 'putting_green' }, O);

  golf('golf_loop', 'Golf Loop-the-Loop', 'track_loop', GRASS, 'A big green loop. The ball rolls upside down!', ['golf_ramp', 'putting_green']);
  shaped('golf_loop', 1, ['RGR', 'R.R', '.G.'], { R: 'golf_ramp', G: 'putting_green' }, O);

  golf('golf_tunnel', 'Tunnel', 'tunnel', { a: '#9a9a9a', b: '#6a6a6a', c: '#c0c0c0', x: '#4fb03a' }, 'A stone tunnel. Roll the ball through!', ['stone_bricks', 'putting_green']);
  shaped('golf_tunnel', 1, ['BBB', 'B.B', 'GGG'], { B: 'stone_bricks', G: 'putting_green' }, O);

  golf('water_hazard', 'Water Hazard', 'pond', { x: '#3a8ad8', z: '#8ac8f0' }, 'A little pond with a bridge. Try not to splash!', ['water_bucket', 'putting_green', 'blue_wool', 'dirt']);
  shaped('water_hazard', 1, ['.W.', 'GBG', 'DDD'], { W: 'water_bucket', G: 'putting_green', B: 'blue_wool', D: 'dirt' }, { orig: true, rem: [{ itemId: 'bucket', quantity: 1 }], msg: 'A Water Hazard! The empty bucket goes back in your bag.' });

  golf('sand_trap', 'Sand Trap', 'bunker', { x: '#e8d090', z: '#f4e4b0', y: '#c8a860' }, 'A patch of soft sand. Watch out!', ['sand', 'putting_green', 'dirt']);
  shaped('sand_trap', 1, ['.S.', 'GSG', 'DDD'], { S: 'sand', G: 'putting_green', D: 'dirt' }, O);

  // ---------- themed holes ----------
  golf('pirate_ship_hole', 'Pirate Ship Hole', 'pirate_ship', {}, 'A golf hole on a little pirate ship. Ahoy!', ['white_wool', 'oak_planks', 'stick', 'putting_green', 'golf_hole_flag']);
  shaped('pirate_ship_hole', 1, ['.W.', 'PSP', 'GHG'], { W: 'white_wool', P: 'oak_planks', S: 'stick', G: 'putting_green', H: 'golf_hole_flag' }, O);

  golf('castle_hole', 'Castle Hole', 'castle', { a: '#a0a0a0', b: '#7a7a7a', c: '#c8c8c8' }, 'Putt the ball through the castle gate.', ['stone_bricks', 'golf_tunnel', 'putting_green', 'golf_hole_flag']);
  shaped('castle_hole', 1, ['B.B', 'BTB', 'GHG'], { B: 'stone_bricks', T: 'golf_tunnel', G: 'putting_green', H: 'golf_hole_flag' }, O);

  // The game has no Lava Bucket, Blackstone or Magma Block, so Magma Cream, Obsidian and a Campfire stand in.
  golf('volcano_hole', 'Volcano Hole', 'volcano', { a: '#4a3a3a', b: '#2a2020', x: '#f39a2e', z: '#d8b878' }, 'A golf hole by a tiny glowing volcano.', ['magma_cream', 'obsidian', 'campfire', 'putting_green', 'golf_hole_flag']);
  shaped('volcano_hole', 1, ['.M.', 'OCO', 'GHG'], { M: 'magma_cream', O: 'obsidian', C: 'campfire', G: 'putting_green', H: 'golf_hole_flag' }, O);

  // The game has no Dragon Head, so a Bone Block sits in the middle too.
  golf('dinosaur_hole', 'Dinosaur Hole', 'dinosaur', { a: '#5cc040', c: '#8ae070' }, 'Putt the ball into a friendly dino\'s mouth!', ['bone_block', 'green_wool', 'putting_green', 'golf_hole_flag']);
  shaped('dinosaur_hole', 1, ['.B.', 'WBW', 'GHG'], { B: 'bone_block', W: 'green_wool', G: 'putting_green', H: 'golf_hole_flag' }, O);

  // ---------- rare golf treasures ----------
  golf('golden_golf_ball', 'Golden Golf Ball', 'shiny_ball', { a: '#f7c843', c: '#fff0a0', b: '#c8901a' }, 'A shiny gold golf ball. So rare!', ['gold_ingot', 'golf_ball']);
  shaped('golden_golf_ball', 1, ['GGG', 'GBG', '.G.'], { G: 'gold_ingot', B: 'golf_ball' }, { orig: true, msg: 'A Golden Golf Ball! It sparkles in the sun.' });

  golf('exploding_golf_ball', 'Exploding Golf Ball', 'exploding_ball', { a: '#d8302a', c: '#f06a5a' }, 'A silly red and black ball with a fuse. It only goes pop!', ['gunpowder', 'golf_ball', 'tnt']);
  shaped('exploding_golf_ball', 1, ['.P.', 'PBP', '.T.'], { P: 'gunpowder', B: 'golf_ball', T: 'tnt' }, { orig: true, msg: 'An Exploding Golf Ball! Do not worry. It just goes pop!' });

  golf('rainbow_golf_ball', 'Rainbow Golf Ball', 'rainbow_ball', {}, 'A golf ball with every color of the rainbow.', ['red_dye', 'golf_ball']);
  shaped('rainbow_golf_ball', 1, ['ROY', 'GBL', 'PWK'], { R: 'red_dye', O: 'orange_dye', Y: 'yellow_dye', G: 'green_dye', B: 'golf_ball', L: 'blue_dye', P: 'purple_dye', W: 'white_dye', K: 'black_dye' }, O);

  golf('potato_putter', 'Potato Putter', 'potato_putter', { a: '#c8a060', b: '#9a7840' }, 'A putter with a potato on the end. So silly!', ['potato', 'putter', 'stick']);
  shaped('potato_putter', 1, ['P', 'U', 'S'], { P: 'potato', U: 'putter', S: 'stick' }, { orig: true, msg: 'A Potato Putter! Who put a potato on it?' });

  golf('diamond_golf_trophy', 'Diamond Golf Trophy', 'trophy', { a: '#5fe0e8', c: '#c8fbff', b: '#2a9aa8', x: '#f7c843', z: '#fff0a0' }, 'The greatest golf prize of all!', ['diamond', 'golden_golf_ball', 'gold_ingot']);
  shaped('diamond_golf_trophy', 1, ['DDD', 'DBD', '.G.'], { D: 'diamond', B: 'golden_golf_ball', G: 'gold_ingot' }, { orig: true, msg: 'The Diamond Golf Trophy! You are a golf legend!' });
})(typeof window !== 'undefined' ? (window.WOW = window.WOW || {}) : (globalThis.WOW = globalThis.WOW || {}));
