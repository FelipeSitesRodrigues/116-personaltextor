/**
 * Folha de revisão: prints da tela inteira rolando de cima a baixo, montados lado a lado.
 * Não usa fullPage (que estica as seções de 100svh e inventa outro layout).
 * Uso: node scripts/folha.mjs --largura 390 --altura 844 --saida revisao/folha-390.png [--movimento]
 */
import puppeteer from 'puppeteer-core'
import sharp from 'sharp'

const args = process.argv.slice(2)
const opt = (n, p) => {
  const i = args.indexOf(`--${n}`)
  return i === -1 ? p : args[i + 1] === undefined || args[i + 1].startsWith('--') ? true : args[i + 1]
}
const W = Number(opt('largura', 390))
const H = Number(opt('altura', 844))
const saida = opt('saida', `revisao/folha-${W}.png`)
const base = process.env.BASE_URL || 'http://localhost:3416'
const navegador = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new' })
const page = await navegador.newPage()
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1, isMobile: W < 600, hasTouch: W < 600 })
if (!opt('movimento', false)) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 90000 })
await new Promise((r) => setTimeout(r, 1200))
const total = await page.evaluate(() => document.documentElement.scrollHeight)
const quadros = []
for (let y = 0; y < total; y += H) {
  await page.evaluate((y) => window.scrollTo(0, y), y)
  await new Promise((r) => setTimeout(r, Number(opt("pausa", 900))))
  quadros.push(await page.screenshot({ type: 'png' }))
}
await navegador.close()
const porLinha = Math.min(quadros.length, W < 600 ? 6 : 3)
const linhas = Math.ceil(quadros.length / porLinha)
const comp = quadros.map((b, i) => ({ input: b, left: (i % porLinha) * (W + 10), top: Math.floor(i / porLinha) * (H + 10) }))
await sharp({ create: { width: porLinha * (W + 10), height: linhas * (H + 10), channels: 3, background: '#888' } }).composite(comp).png().toFile(saida)
console.log(`ok ${saida} · ${quadros.length} telas · página ${total}px`)
