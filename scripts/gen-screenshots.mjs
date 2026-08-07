import { chromium } from 'playwright'

const URL = 'https://chat.oriz.in'
const args = ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
const browser = await chromium.launch({ headless: true, args })

const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await desktop.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
await desktop.waitForTimeout(1500)
await desktop.screenshot({ path: 'public/screenshots/desktop.png' })

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
await mobile.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
await mobile.waitForTimeout(1500)
await mobile.screenshot({ path: 'public/screenshots/mobile.png' })

await browser.close()
console.log('screenshots written: desktop.png, mobile.png')
