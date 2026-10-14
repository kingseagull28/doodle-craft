"""End-to-end browser checks for Workshop of Wonders (Chromium via Playwright).
Run: python3 tests/browser.test.py   (after: node tools/build.js)"""
import asyncio, json, sys
from playwright.async_api import async_playwright
URL = 'file:///home/claude/wow/docs/index.html'
results = []
def check(name, cond, extra=''):
    results.append((name, bool(cond), extra))

async def state(pg): return await pg.evaluate('JSON.parse(JSON.stringify(WOW.UI.state()))')
async def bag_item(pg, id): return pg.locator(f'#items [data-id="{id}"]')
async def grid_slot(pg, i): return pg.locator(f'[data-drop="grid"][data-slot="{i}"]')
async def dismiss(pg):
    for _ in range(6):
        if await pg.locator('#celebrate').count(): await pg.locator('#celebrate button').click(); await pg.wait_for_timeout(60)
        else: break

async def desktop(b):
    ctx = await b.new_context(viewport={'width': 1366, 'height': 900})
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    await pg.goto(URL); await pg.click('text=Just play')
    # click-to-place: log -> planks
    await (await bag_item(pg, 'oak_log')).click()
    await (await grid_slot(pg, 0)).click()
    s = await state(pg); check('mouse: click places item', s['adventure']['grid'][0] == 'oak_log' and s['adventure']['inv']['oak_log'] == 7)
    await pg.locator('#outputSlot').dblclick()  # double click must not duplicate
    await dismiss(pg)
    s = await state(pg); check('mouse: collect gives 4 planks once (double-click safe)', s['adventure']['inv'].get('oak_planks') == 4, str(s['adventure']['inv'].get('oak_planks')))
    check('discovery recorded', 'oak_planks' in s['discoveredItems'] and s['quests'].get('t1_planks'))
    # remove item by clicking a filled grid slot with nothing held
    await pg.keyboard.press('Escape')
    await (await bag_item(pg, 'coal')).click(); await (await grid_slot(pg, 3)).click(); await pg.keyboard.press('Escape')
    await (await grid_slot(pg, 3)).click()
    s = await state(pg); check('mouse: clicking a filled slot returns item', s['adventure']['grid'][3] is None and s['adventure']['inv']['coal'] == 4)
    # real mouse drag: planks into slots 0 and 2 -> sticks (2x2, vertical)
    for slot in (0, 2):
        src = await (await bag_item(pg, 'oak_planks')).bounding_box(); dst = await (await grid_slot(pg, slot)).bounding_box()
        await pg.mouse.move(src['x'] + 20, src['y'] + 20); await pg.mouse.down()
        await pg.mouse.move(src['x'] + 40, src['y'] + 40, steps=3)
        await pg.mouse.move(dst['x'] + dst['width'] / 2, dst['y'] + dst['height'] / 2, steps=8); await pg.mouse.up()
        await pg.wait_for_timeout(50)
    s = await state(pg); check('mouse: drag and drop places items', s['adventure']['grid'][0] == 'oak_planks' and s['adventure']['grid'][2] == 'oak_planks', str(s['adventure']['grid']))
    out = await pg.locator('.outname').inner_text(); check('recipe recognized in output slot', 'Stick' in out, out)
    await pg.locator('#outputSlot').click(); await dismiss(pg)
    s = await state(pg); check('sticks crafted', s['adventure']['inv'].get('stick') == 4)
    # drag from grid back out to the bag
    await (await bag_item(pg, 'dirt')).click(); await (await grid_slot(pg, 1)).click(); await pg.keyboard.press('Escape')
    src = await (await grid_slot(pg, 1)).bounding_box(); dst = await pg.locator('#items').bounding_box()
    await pg.mouse.move(src['x'] + 20, src['y'] + 20); await pg.mouse.down(); await pg.mouse.move(dst['x'] + 30, dst['y'] + 30, steps=8); await pg.mouse.up()
    s = await state(pg); check('mouse: drag grid item back to bag', s['adventure']['grid'][1] is None and s['adventure']['inv']['dirt'] == 4)
    # invalid combo keeps items, friendly feedback
    await (await bag_item(pg, 'dirt')).click(); await (await grid_slot(pg, 0)).click(); await pg.keyboard.press('Escape')
    await (await bag_item(pg, 'coal')).click(); await (await grid_slot(pg, 3)).click(); await pg.keyboard.press('Escape')
    fbt = await pg.locator('#feedback').inner_text()
    check('failed experiment shows friendly feedback', 'Interesting' in fbt or 'experiment' in fbt.lower() or 'nothing' in fbt.lower() or 'Maybe' in fbt, fbt)
    await pg.locator('#outputSlot').click()
    await pg.click('.benchbtns >> text=Clear')
    s = await state(pg); check('invalid combo then clear returns everything', s['adventure']['inv']['dirt'] == 4 and s['adventure']['inv']['coal'] == 4)
    # crafting table via book "Put on the table" -> 3x3 unlock
    await pg.evaluate("WOW.UI.state().adventure.inv.oak_planks = 8")
    await pg.click('#btnBook'); await pg.fill('.dialog input[type=search]', 'oak planks')
    await pg.locator('.entry', has_text='Oak Planks').first.click()
    check('book detail opens', await pg.locator('.detail h3', has_text='Oak Planks').count() == 1)
    await pg.click('text=Back')
    await pg.fill('.dialog input[type=search]', '')
    await pg.click('.filters >> text=Mysteries only')
    n_myst = await pg.locator('.entry.mystery').count(); check('book shows mystery silhouettes', n_myst > 3, str(n_myst))
    await pg.locator('.entry.mystery').first.click()
    await pg.click('text=Show a small hint'); await pg.click('text=Show a bigger hint')
    hints = await pg.locator('.hintbox li').count(); check('progressive hints reveal step by step', hints == 2)
    await pg.keyboard.press('Escape')
    await (await bag_item(pg, 'oak_planks')).click()
    for i in range(4): await (await grid_slot(pg, i)).click()
    await pg.keyboard.press('Escape')
    await pg.locator('#outputSlot').click(); await dismiss(pg)
    s = await state(pg); check('crafting table unlocks 3x3 grid', s['grid3'] and await pg.locator('.grid.s3').count() >= 1)
    # keyboard: tab to bag item, enter, tab to grid slot, enter
    await pg.locator('#items [data-id="oak_planks"]').focus(); await pg.keyboard.press('Enter')
    await (await grid_slot(pg, 4)).focus(); await pg.keyboard.press('Enter')
    s = await state(pg); check('keyboard: Enter selects and places', s['adventure']['grid'][4] == 'oak_planks')
    await pg.click('.benchbtns >> text=Clear')
    # supply crate replenish
    await pg.click('#bagTabs >> text=Supply Crate'); await pg.click('.amount >> text=x64')
    before = (await state(pg))['adventure']['inv']['oak_log']
    await pg.locator('#items .crate[aria-label="Take 64 Oak Log"]').click()
    s = await state(pg); check('supply crate adds x64', s['adventure']['inv']['oak_log'] == before + 64)
    await pg.click('#bagTabs >> text=My Bag')
    # reload persistence
    inv_before = (await state(pg))['adventure']['inv']
    await pg.evaluate('WOW.UI.saveNow()'); await pg.reload(); await pg.wait_for_timeout(200)
    s = await state(pg); check('progress survives reload', s['adventure']['inv'] == inv_before and s['grid3'] and s['settings']['tutorialDone'])
    # furnace: craft + smelt via station tab
    await pg.evaluate("(()=>{const s=WOW.UI.state(); s.adventure.inv.cobblestone=20; WOW.UI.render();})()")
    await (await bag_item(pg, 'cobblestone')).click()
    for i in [0,1,2,3,5,6,7,8]: await (await grid_slot(pg, i)).click()
    await pg.keyboard.press('Escape')
    await pg.locator('#outputSlot').click(); await dismiss(pg)
    await pg.click('#benchTabs >> text=Furnace')
    await (await bag_item(pg, 'sand')).click(); await pg.locator('[data-key="input"]').click()
    await (await bag_item(pg, 'coal')).click(); await pg.locator('[data-key="fuel"]').click()
    await pg.click('text=Smelt Glass'); await dismiss(pg)
    s = await state(pg); check('furnace smelts sand into glass', s['adventure']['inv'].get('glass') == 1)
    # settings toggles + reset confirm cancel
    await pg.click('#btnSettings'); await pg.click('[aria-label="Hints"]')
    s = await state(pg); check('hints toggle works', s['settings']['hints'] is False)
    await pg.click('text=Reset progress'); await pg.click('text=No, go back')
    s = await state(pg); check('reset cancel keeps progress', s['grid3'])
    await pg.click('#btnSettings'); await pg.click('text=Reset progress'); await pg.click('text=Yes, erase my game')
    s = await state(pg); check('reset with confirmation starts over', not s['grid3'] and s['adventure']['inv']['oak_log'] == 8)
    # import invalid -> rejected
    await pg.click('#btnSettings'); await pg.click('text=Import save')
    await pg.fill('textarea', '{"schema": 2, "nope": true}'); await pg.click('text=Load pasted code')
    msg = await pg.locator('[role=alert]').inner_text(); check('invalid import rejected with friendly message', 'not changed' in msg, msg)
    await pg.keyboard.press('Escape')
    check('desktop: no console errors', not errs, str(errs[:3]))
    await pg.screenshot(path='/tmp/after_desktop.png')
    await ctx.close()

async def phone(b):
    ctx = await b.new_context(viewport={'width': 375, 'height': 740}, has_touch=True, is_mobile=True)
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.tap('text=Just play')
    sw = await pg.evaluate('document.documentElement.scrollWidth'); check('phone: no horizontal scroll', sw <= 375, str(sw))
    await (await bag_item(pg, 'oak_log')).tap(); await (await grid_slot(pg, 1)).tap()
    await pg.locator('#outputSlot').tap(); await dismiss(pg)
    s = await state(pg); check('touch: tap to place and collect', s['adventure']['inv'].get('oak_planks') == 4)
    # touch hold-and-drag using CDP touch events (table and bag are on screen together)
    cdp = await ctx.new_cdp_session(pg)
    await pg.evaluate('window.scrollTo(0,0)')
    bb = await (await bag_item(pg, 'oak_planks')).bounding_box(); check('phone: bag is visible with the table', bb['y'] + 40 < 740, str(bb['y']))
    src = await (await bag_item(pg, 'oak_planks')).bounding_box(); dst = await (await grid_slot(pg, 0)).bounding_box()
    check('phone: newly made item is scrolled into view in the hotbar', 0 <= src['x'] and src['x'] + src['width'] <= 375, str(src['x']))
    sx, sy = src['x'] + 30, src['y'] + 30; dx, dy = dst['x'] + 30, dst['y'] + 30
    await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': sx, 'y': sy}]})
    await pg.wait_for_timeout(400)
    for i in range(1, 11):
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': sx + (dx - sx) * i / 10, 'y': sy + (dy - sy) * i / 10}]})
        await pg.wait_for_timeout(16)
    await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    await pg.wait_for_timeout(100)
    s = await state(pg); check('touch: hold then drag places item', s['adventure']['grid'][0] == 'oak_planks', str(s['adventure']['grid']))
    # quick swipe on bag should not drag
    src = await (await bag_item(pg, 'dirt')).bounding_box()
    await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': src['x'] + 20, 'y': src['y'] + 40}]})
    for i in range(1, 6):
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': src['x'] + 20, 'y': src['y'] + 40 - i * 12}]}); await pg.wait_for_timeout(10)
    await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    s2 = await state(pg); check('touch: quick swipe does not start a drag', s2['adventure']['inv']['dirt'] == 4 and await pg.locator('.ghost').count() == 0)
    # grid + output + collect button visible together in first screen
    g = await pg.locator('.bench').bounding_box(); check('phone: crafting bench starts near the top', g['y'] < 260, str(g['y']))
    # overlays fit on phone
    for btn in ['#btnBook', '#btnMap', '#btnQuests', '#btnHelp', '#btnSettings']:
        await pg.tap(btn)
        bb = await pg.locator('.dialog').bounding_box(timeout=3000)
        check('phone: ' + btn + ' dialog fits', bb and bb['width'] <= 375 and bb['height'] <= 740, str(bb))
        if btn == '#btnBook': await pg.screenshot(path='/tmp/phone_book.png')
        await pg.tap('.dialog header >> text=Close')
    await pg.screenshot(path='/tmp/phone_play.png')
    check('phone: no page errors', not errs, str(errs[:3]))
    await ctx.close()

async def offline(b):
    ctx = await b.new_context(viewport={'width': 1000, 'height': 800}); pg = await ctx.new_page(); reqs = []
    await ctx.add_init_script("if(!sessionStorage.getItem('t')){sessionStorage.setItem('t','1');localStorage.setItem('workshop-of-wonders','{bad json');}")
    pg.on('request', lambda r: reqs.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
    await pg.goto(URL); await pg.wait_for_timeout(300)
    check('no network requests at runtime', not reqs, str(reqs[:3]))
    # corrupt save recovery path
    st_ok = await pg.evaluate("WOW.UI.state().adventure.inv.oak_log === 8")
    check('corrupt save starts a usable new game', st_ok)
    check('corrupt data preserved for inspection', await pg.evaluate("localStorage.getItem('workshop-of-wonders-corrupt') === '{bad json'"))
    t = await pg.locator('#toast').inner_text() if await pg.locator('#toast').count() else ''
    check('corrupt save shows friendly recovery message', 'save' in t.lower(), t)
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        await desktop(b); await phone(b); await offline(b)
        await b.close()
    bad = [r for r in results if not r[1]]
    for n, ok, extra in results: print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else '  -> ' + extra))
    print(f'\n{len(results) - len(bad)} passed, {len(bad)} failed')
    sys.exit(1 if bad else 0)
asyncio.run(main())
