# Workshop of Wonders

A crafting and discovery game for kids aged 6 to 9. Collect materials, place them on a crafting table, discover something new, unlock new areas, repeat. Inspired by the discovery loop of Doodle God and the crafting recipes of Minecraft, with all-original art and sounds.

## How to launch

**Easiest:** open `docs/index.html` in any modern browser (double-click it). It is a single self-contained file with no internet connection needed, no accounts, no install.

**From source:**

```
node tools/build.js          # rebuilds docs/index.html from src/
node tests/engine.test.js    # 68 engine and data tests (Node 18+)
python3 tests/browser.test.py   # 40 end-to-end browser checks (needs: pip install playwright && playwright install chromium)
node tools/export-data.js    # writes data/*.json
```

`docs/dev.html` loads the separate source files, which is handier for debugging (local only).

## Publishing on GitHub Pages

Push the whole folder to a repository, then in the repo go to Settings, Pages, choose Deploy from a branch, branch `main`, folder `/docs`. The game appears at `https://<username>.github.io/<repo-name>/`.

To add recipes or items, see [ADDING-RECIPES.md](ADDING-RECIPES.md).

## Project structure

| Path | What it does |
| --- | --- |
| `src/icons.js` | Procedural pixel art. Every icon is drawn from code (16x16 templates and generated block textures). No image files. |
| `src/data_core.js` | Item/recipe builders, wood families, stone, tools. |
| `src/data_more.js` | Metals and gems, farming and food, colors, redstone, magic, creatures. |
| `src/data_world.js` | Legendary tier, biomes, quests. |
| `src/engine.js` | All game rules: indexes, recipe matcher, hints, inventory, stations, quests, progression simulation, dataset validation, save validation, migration, backup storage, import/export. No DOM. |
| `src/audio.js` | Procedural sound effects and music box tune (Web Audio). Created only after the player turns sound on. |
| `src/ui.js` | Interface: rendering, tap-to-place, pointer drag and drop, keyboard, book, map, quests, settings, help, tutorial, celebrations. |
| `src/style.css` | Layout and theme, light and dark, desktop/tablet/phone. |
| `src/index.html` | Page shell. |
| `tools/build.js` | Inlines everything into `docs/index.html` (the page GitHub Pages serves). |
| `tests/` | Engine tests (Node) and browser tests (Playwright/Chromium). |
| `data/` | Exported JSON datasets: items, recipes, quests, biomes. |

The UI never contains recipe rules. Crafting, the book, hints, quests and unlocks all read from the shared dataset through `engine.js`.

## Content

* **539 items, 482 recipes, 56 quests, 8 areas, 6 tiers.**
* Recipes by method: 432 crafting grid (320 shaped, 112 shapeless), 21 smelting, 20 brewing, 9 smithing.
* 451 recipes are Minecraft-style references (Java Edition 1.21) and 31 are original to this game. Every recipe and item carries `sourceType` / `isOriginalContent`, and the book shows a badge.
* 4 secret recipes (Disco Ball, Rubber Duck, Bubble Wand, Party Cake Hat).
* Recipes by the tier they first become reachable: 169, 90, 134, 35, 33, 21.

### Data model

Each item has `id, name, description, category, icon, tags, stackLimit, tier, unlockRequirements, isVanillaReference, isOriginalContent`. Each recipe has `id, name, method, type, gridSize, pattern | list | station slots, ingredients, output, remainders, unlockRequirements, category, tier, hints, discoveryMessage, sourceType, referenceVersion, tags`.

The pattern (shaped) or list (shapeless) is the single source of truth. `ingredients` quantities, `gridSize`, hints and tier are derived from it at load time, so the numbers can never disagree. Tag ingredients like `#planks`, `#logs`, `#coals`, `#wooden_slabs` and `#wool` match any member item, as in Minecraft.

### Matching rules

* Shaped: the filled area of the grid is trimmed and compared cell by cell, so a pattern can sit anywhere (legal translation). Empty cells inside the pattern matter (a chest needs its hole). Horizontal mirroring is accepted where Minecraft accepts it. Shaped recipes are never matched as shapeless.
* Shapeless: exact ingredient multiset, any arrangement, extra items rejected.
* A recipe only fits a grid at least as big as it needs (3-row recipes need the 3x3 grid).
* Furnace, brewing and smithing recipes only work at their station, and each station must be built first.
* If two recipes could ever match the same grid, the validator reports a conflict. There are currently none, and selection is deterministic anyway (shaped first, then dataset order).

### Validation

`Engine.validateData()` checks unknown references, bad quantities, duplicate IDs, malformed patterns, conflicting recipes (grid and station), quest references, biome resources, and then runs a full **progression simulation** from the starting workshop: every recipe, item and quest must be reachable through real gameplay, in order. The test suite fails if anything is unreachable.

## Progression

| Tier | Main quests | Milestone reward |
| --- | --- | --- |
| 1 Wood and stone | planks, sticks, Crafting Table (unlocks the 3x3 grid), wooden pickaxe (opens Forest), furnace, stone tools (opens Mine) | Workshop Upgrade opens the Forge |
| 2 Metals and gems | iron ingot, bucket, iron pickaxe, any iron armor, diamond pickaxe | Forge Master opens the Farm |
| 3 Farming and cooking | bread, cookies, a dye, colored wool, a book | Grand Feast opens the Clockwork Room |
| 4 Redstone and machines | redstone torch, piston, minecart and rails, clock or compass | Clockwork Room opens the Moonlit Chamber |
| 5 Magic and secrets | brewing stand, awkward potion, a real potion, Sparkle Dust, Eye of Ender, Enchanting Table | Archmage opens the Hall of Legends |
| 6 Legendary | netherite ingot, a netherite upgrade, beacon, six engine parts | The Wonder Engine unlocks Creative Sandbox |

Plus 22 optional bonus challenges. Each area adds new materials to the Supply Crate. Resources are unlimited: tap anything in the crate to take 1, 8 or 64. Crafting still consumes real quantities, and a failed mix never destroys anything.

**Design choice:** the spec asks for a crafting table in the starting kit and a 3x3 unlock after an early milestone. Since a Minecraft pickaxe needs a 3x3 grid, the workshop starts with a small 2x2 table and building a Crafting Table upgrades it to 3x3, which matches how Minecraft works.

**Creative Sandbox** has its own bag and table, every item in the crate, every station, and no fuel needed. The adventure is kept separately and you can switch back at any time.

## Saving

Saves to `localStorage` after every change (debounced) and when the page is hidden. Before overwriting, the previous valid save is kept as a backup. Loading validates every field; a corrupt save falls back to the backup, and if both fail a new game starts while the unreadable data is preserved under a separate key. Saves carry a schema version, schema 1 saves are migrated, and newer versions are refused politely. If a game update removes an item, your own saved game drops just that item instead of being rejected. Import validates structure, types and every item, recipe and quest ID, rebuilds a clean state object (unknown keys are dropped), and asks before replacing progress. Reset needs explicit confirmation.

## Verified (tests actually run)

Engine tests, 68 passing: dataset validity and reachability, recipe count, conflict detection (including an injected conflict), shaped/shapeless/translation/mirroring/empty-cell rules, quantities, grid size limits, station gating, fuel, brewing and smithing, consumption, double-collect protection, harmless failures, returning items, swaps, replenishing, locked supplies, sorting, 200 repeated crafts, Make again, remainders, discoveries, quest prerequisites, 3x3 unlock, tier and biome unlocks, sandbox isolation, hints (arrangement, missing ingredient, no unrelated reveals, secrets never hinted), save round trip, import/export, invalid JSON, unknown IDs, wrong types, newer versions, migration, bad imports not touching progress, no key injection, backup recovery, reset confirmation, refusing to save invalid state, book autofill, and saves surviving an update that removes an item.

Browser tests in Chromium, 40 passing: mouse click-to-place, double-click safety, mouse drag to the table and back to the bag, friendly failure messages, book search and detail, mystery silhouettes, progressive hints, 3x3 unlock in play, keyboard Enter to select and place, Supply Crate x64, progress surviving reload, furnace smelting, hints toggle, reset cancel and confirm, invalid import rejected, no console errors, phone width with no horizontal scroll, touch tap-to-place, touch hold-then-drag, quick swipes not starting drags, table and bag visible together on a phone, new items scrolled into view, every dialog fitting a 375px phone, zero network requests at runtime, and corrupt-save recovery.

## Not verified / known limitations

* Browser tests ran in Chromium only. Safari and Firefox were not tested. Touch was tested with emulated touch events, not a physical device.
* Sound and music were checked for errors only, not listened to.
* Minecraft-style recipes were written from knowledge of Java Edition 1.21 and checked for internal consistency by the validator. They were not machine-compared against the game's own data files.
* Simplifications: one item per grid square (use Make again to repeat); furnace fuel is simplified (coal or charcoal cooks 8, logs and planks 1.5); the brewing stand needs no blaze powder fuel; potions, machines and redstone parts are collectible crafts and do not simulate effects. Water bottles come from an original bucket recipe instead of filling at water. Snow Pal and Iron Guardian are original figurines standing in for Minecraft's golem builds.
* Not included: dyed terracotta, concrete, banners, dyed candles, stripped logs and hanging signs, and many decorative stone variants.
* In some sandboxed hosts (such as a hosted artifact page), file downloads may be blocked. Export then shows a save code to copy instead.

Fan-made and not affiliated with Mojang or Microsoft.
