# Adding recipes and items

All game content lives in three files. The interface reads everything from them, so adding a recipe never needs UI changes.

| File | Holds |
| --- | --- |
| `src/data_core.js` | Wood, stone, basic tools |
| `src/data_more.js` | Metals, farm, colors, redstone, magic, creatures |
| `src/data_world.js` | Legendary tier, areas (biomes), quests |

## A new item

```js
item('pizza', 'Pizza', 'farming_food', 3,
  { t: 'pie', a: '#e8b04a', x: '#c8402f' },          // icon: template + colors
  'A cheesy pizza fresh from the oven.',               // short, kid-friendly
  ['food', 'original'], { orig: true });               // tags, and mark it original
```

Categories: `materials, wood_stone, tools, building, metals_gems, farming_food, animals, transport, machinery, armor, magic, legendary, jump_man`.
Icon templates are listed in `src/icons.js` (`pickaxe`, `gem`, `bottle`, `pie`, `duck`, `star`...), or use `{ t: 'block', s: 'planks', a: '#color' }` for blocks.

## A new recipe

```js
// Shaped: letters are keys, "." is an empty square
shaped('pizza', 1, ['TCT', 'BBB'], { T: 'beetroot', C: 'milk_bucket', B: 'bread' },
  { orig: true, msg: 'Pizza party!', rem: [{ itemId: 'bucket', quantity: 1 }] });

// Any order
shapeless('pizza', 1, ['bread', 'beetroot', 'milk_bucket'], { orig: true });

// Stations
smelt('cooked_thing', 'raw_thing');
brew('potion_of_x', 'awkward_potion', 'some_ingredient');
smith('fancy_sword', 'netherite_upgrade_smithing_template', 'diamond_sword', 'netherite_ingot');
```

Options: `orig: true` (original content badge), `msg` (first-craft message), `rem` (items given back, like empty buckets), `secret: true` (hidden from hints and the book), `id` (needed only if the same item has two recipes), `mirror: false` (shape cannot be flipped).

`#planks`, `#logs`, `#coals`, `#wooden_slabs` and `#wool` mean "any of these."

## Check your work

```
node tests/engine.test.js     # must say 0 failed
node tools/build.js           # rebuilds docs/index.html
```

The validator catches unknown items, typos, two recipes fighting over the same pattern, and anything a player could never reach.

## Rules that protect saved games

* **Adding** items, recipes and quests is always safe.
* **Never reuse an old ID** for something different.
* Renaming or removing is survivable (old saves quietly drop the missing thing) but the player loses that item, so prefer adding over renaming.
* Bump `GAME_VERSION` in `src/engine.js` and add a line to `CHANGELOG.md`.
