import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve('.')
const entryUrl = pathToFileURL(resolve('dist/index.html')).href

try {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--disable-web-security'],
  })
  const results = []
  const consoleErrors = []
  const remoteRequests = []
  for (const [width, height] of [[1440, 900], [1024, 768], [768, 1024], [375, 812]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
    page.on('request', (request) => { if (/^https?:/i.test(request.url())) remoteRequests.push(request.url()) })
    await page.goto(entryUrl, { waitUntil: 'networkidle' })
    const metrics = await page.evaluate(() => {
      const viewportWidth = window.innerWidth
      const offenders = Array.from(document.querySelectorAll('*')).map((element) => {
        const box = element.getBoundingClientRect()
        return { tag: element.tagName, id: element.id, className: typeof element.className === 'string' ? element.className : '', left: Math.round(box.left), right: Math.round(box.right), width: Math.round(box.width) }
      }).filter((box) => box.left < -1 || box.right > viewportWidth + 1).slice(0, 12)
      const ids = Array.from(document.querySelectorAll('[id]'), (element) => element.id)
      return {
        title: document.title,
        viewportWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        idCount: ids.length,
        uniqueIdCount: new Set(ids).size,
        offenders,
      }
    })
    const path = resolve(`work/real-${width}x${height}.png`)
    await page.screenshot({ path, fullPage: true })
    results.push({ width, height, path, ...metrics })
    await page.close()
  }
  const interactionChecks = []
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  desktop.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  desktop.on('request', (request) => { if (/^https?:/i.test(request.url())) remoteRequests.push(request.url()) })
  await desktop.goto(entryUrl, { waitUntil: 'networkidle' })
  await desktop.locator('#hud-open-inventory').click()
  await desktop.waitForTimeout(350)
  const inventoryBox = await desktop.locator('#modal-inventory').boundingBox()
  await desktop.screenshot({ path: resolve('work/real-inventory-modal.png'), fullPage: false })
  interactionChecks.push({ name: 'desktop inventory modal', box: inventoryBox })
  await desktop.keyboard.press('Escape')
  const mapTransformBefore = await desktop.locator('.village-map-world').evaluate((element) => getComputedStyle(element).transform)
  const viewportBox = await desktop.locator('#village-map-viewport').boundingBox()
  if (viewportBox) {
    await desktop.mouse.move(viewportBox.x + viewportBox.width * .55, viewportBox.y + viewportBox.height * .55)
    await desktop.mouse.down()
    await desktop.mouse.move(viewportBox.x + viewportBox.width * .32, viewportBox.y + viewportBox.height * .35, { steps: 6 })
    await desktop.mouse.up()
  }
  const mapTransformAfter = await desktop.locator('.village-map-world').evaluate((element) => getComputedStyle(element).transform)
  interactionChecks.push({ name: 'draggable map transform', before: mapTransformBefore, after: mapTransformAfter, changed: mapTransformBefore !== mapTransformAfter })
  await desktop.locator('#map-reset-view').click()
  await desktop.locator('#hud-open-tavern').click()
  await desktop.waitForSelector('#tavern-tab-api')
  await desktop.waitForTimeout(350)
  const tavernBox = await desktop.locator('.tavern-hub').boundingBox()
  await desktop.screenshot({ path: resolve('work/real-tavern-hub.png'), fullPage: false })
  const tabLabels = await desktop.locator('[role="tab"]').evaluateAll((tabs) => tabs.map((tab) => tab.getAttribute('aria-label')))
  await desktop.locator('#tavern-tab-characters').click()
  await desktop.waitForSelector('[aria-label^="编辑角色卡"]')
  await desktop.waitForTimeout(500)
  const characterCount = await desktop.locator('[aria-label^="编辑角色卡"]').count()
  await desktop.screenshot({ path: resolve('work/real-tavern-characters.png'), fullPage: false })
  interactionChecks.push({ name: 'desktop tavern hub', box: tavernBox, tabLabels, characterCount })
  await desktop.locator('#tavern-hub-close').click()
  await desktop.close()

  const mobile = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 })
  mobile.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  mobile.on('request', (request) => { if (/^https?:/i.test(request.url())) remoteRequests.push(request.url()) })
  await mobile.goto(entryUrl, { waitUntil: 'networkidle' })
  await mobile.locator('#hud-open-inventory').click()
  await mobile.waitForTimeout(350)
  const mobileModalBox = await mobile.locator('#modal-inventory').boundingBox()
  await mobile.screenshot({ path: resolve('work/real-mobile-modal.png'), fullPage: false })
  interactionChecks.push({ name: 'mobile inventory modal', box: mobileModalBox })
  await mobile.keyboard.press('Escape')
  await mobile.locator('#hud-open-tavern').click()
  await mobile.waitForSelector('#tavern-tab-api')
  await mobile.waitForTimeout(400)
  const mobileTavernBox = await mobile.locator('.tavern-hub').boundingBox()
  await mobile.screenshot({ path: resolve('work/real-mobile-tavern.png'), fullPage: false })
  interactionChecks.push({ name: 'mobile tavern hub', box: mobileTavernBox })
  await mobile.close()
  await browser.close()
  process.stdout.write(JSON.stringify({ results, interactionChecks, consoleErrors, remoteRequests }, null, 2))
} finally {
}
