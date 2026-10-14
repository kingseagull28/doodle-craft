import sys, asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name, vp, touch in [('desktop', {'width':1400,'height':900}, False), ('phone', {'width':390,'height':844}, True), ('tablet', {'width':820,'height':1180}, True)]:
            ctx = await b.new_context(viewport=vp, has_touch=touch, is_mobile=touch, device_scale_factor=1)
            pg = await ctx.new_page()
            errs = []
            pg.on('console', lambda m: errs.append(m.text) if m.type in ('error','warning') else None)
            pg.on('pageerror', lambda e: errs.append('PAGEERROR '+str(e)))
            await pg.goto('file:///home/claude/wow/docs/index.html')
            await pg.wait_for_timeout(400)
            await pg.screenshot(path=f'/tmp/{name}_welcome.png')
            await pg.click('text=Just play')
            await pg.wait_for_timeout(200)
            await pg.screenshot(path=f'/tmp/{name}.png', full_page=(name!='desktop'))
            print(name, 'errors:', errs)
            await ctx.close()
        await b.close()
asyncio.run(main())
