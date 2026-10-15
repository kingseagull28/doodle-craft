# Workshop of Wonders

A crafting and discovery browser game for kids aged 6 to 9 (Minecraft-style recipes plus Doodle God-style discovery). Live on GitHub Pages from the `docs/` folder. The main player is a kindergartner, so everything a player reads must be short, friendly and easy to understand.

## How the project is built

* Plain JavaScript, no frameworks, no build tools beyond Node. No npm packages.
* `src/` is the source. `tools/build.js` inlines everything into one self-contained file: `docs/index.html`. That file is what GitHub Pages serves.
* Never edit `docs/index.html` by hand. Edit `src/`, then rebuild.

| File | Holds |
| --- | --- |
| `src/icons.js` | Procedural pixel-art icons (16x16 templates, block textures, block faces) |
| `src/data_core.js` | Item and recipe builders, wood, stone, basic tools |
| `src/data_more.js` | Metals, farming, colors, redstone, magic, creatures |
| `src/data_world.js` | Legendary tier, biomes (areas), quests |
| `src/engine.js` | All game rules, validation, saving. No DOM access. |
| `src/audio.js` | Procedural Web Audio sound and music |
| `src/ui.js` | Interface. Reads all rules from the engine and data. |
| `src/style.css`, `src/index.html` | Styles and page shell |
| `ADDING-RECIPES.md` | How to write items and recipes. Read it before adding content. |

## Every change, in this order

1. Make the change in `src/`.
2. `node tests/engine.test.js` must report 0 failed. It also validates the whole dataset (unknown IDs, recipe conflicts, unreachable items, impossible quests).
3. `node tools/build.js` to rebuild `docs/index.html`.
4. `node tools/export-data.js` if items, recipes, quests or biomes changed.
5. For content or gameplay changes, add a line under `## Unreleased` at the top of `CHANGELOG.md` (create the heading if it is missing). Do not change `GAME_VERSION` per change. Update the counts in `README.md` if they changed.
6. Add tests in `tests/engine.test.js` for new rules or recipes worth protecting.
7. Commit with a clear message. Do not push; the owner pushes from GitHub Desktop.

### Releasing (once per push)

The version goes up once per push, not per change. When the owner says they are ready to push:

1. Bump `GAME_VERSION` in `src/engine.js` once for everything under `## Unreleased` (1.2.0 to 1.3.0 if anything new was added, 1.2.1 for fixes only).
2. Rename `## Unreleased` in `CHANGELOG.md` to `## <version> (<today>)`.
3. Run the tests and the build, then commit as "Release <version>".

If `GAME_VERSION` was already bumped in commits that are not pushed yet (`git log origin/main..HEAD`), fold the changes into that version instead of bumping again.

`tests/browser.test.py` needs Python and Playwright. Treat it as optional and skip it if those are not installed.

## Rules that must not be broken

* **Protect saved games.** Never rename or reuse an existing item, recipe, quest or biome ID. Add new IDs instead. Saves live in each player's browser and cannot be fixed by hand.
* **Recipes are data, not UI code.** Add content only through the builders (`item`, `shaped`, `shapeless`, `smelt`, `brew`, `smith`, `quest`). Never put recipe logic in `ui.js`.
* **Label recipes honestly.** Real Minecraft recipes follow Java Edition 1.21 exactly. Anything invented gets `orig: true`. If unsure whether a recipe is exactly vanilla, mark it original.
* **No external assets.** No image files, CDNs, fonts, network requests or third-party scripts. Icons are drawn in `src/icons.js`. The game must work offline.
* **Safe text only.** Use the `h()` helper and `textContent`. Never use `innerHTML` with any data.
* **Kid-friendly.** No time limits, no punishment for experimenting, nothing scary or violent. Nothing in the workshop explodes or hurts anyone. Player-facing text: short sentences, simple words, no em dashes.
* **Nothing is ever lost.** Failed crafts and invalid actions must never destroy items. Any change to inventory logic needs a test.
* Don't add "Minecraft" to the game's name or title. It may appear only as a description ("Minecraft-style recipe").

## When the owner asks for a new recipe or item

* Ask only if something essential is missing (ingredients or result). Otherwise make sensible choices: pick the tier from the ingredients, write a one-line description, choose an icon template from `src/icons.js`, and say what you chose.
* If a pattern would collide with an existing recipe, the validator reports a conflict. Suggest a different arrangement rather than removing the old recipe.
* After building, explain in a few plain sentences what was added and how to make it in the game.
