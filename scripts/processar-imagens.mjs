/**
 * Imagens do site em src/assets/img (AVIF e WebP em várias larguras, com manifesto.json pro
 * width/height do <img>), ícones em src/raiz e as fontes em src/assets/fonts. Base da 0115 F3.
 *
 * Origem (../0116 - Ricardo Consultoria/Recursos Site):
 *  - limpas/: as 5 imagens sem texto do ChatGPT (hero, dor, ganhos 1 a 3 e 4 a 6, como funciona)
 *  - hero-vertical-rosto-real.png: o Ricardo de braços cruzados, editado da foto real (hero)
 *  - FOTOS RICARDO/: posts e fotos que ele mandou (antes e depois, sobre, parede dos feedbacks)
 *  - logo-nova-branca.png: logo branca no preto, vira transparente e ganha o cobre aqui
 * insumos/ricardo-recorte.png e insumos/dor-pessoa.png: recortes por BiRefNet lite (o homem
 * da dor fica do tamanho da cena, pra casar por cima dela com o mesmo object-fit).
 * Uso: node scripts/processar-imagens.mjs   (depois: node build.mjs)
 */
import sharp from 'sharp'
import { mkdirSync, writeFileSync, rmSync, readdirSync, copyFileSync } from 'node:fs'
import path from 'node:path'

sharp.cache(false)
const REC = '../0116 - Ricardo Consultoria/Recursos Site'
const LIMPAS = `${REC}/limpas`
const FOTOS = `${REC}/FOTOS RICARDO`
const foto = (hora) => `${FOTOS}/WhatsApp Image 2026-11-19 at ${hora}.jpeg`
const OUT = 'src/assets/img'
const RAIZ = 'src/raiz'
const so = process.argv.slice(2)
mkdirSync(OUT, { recursive: true })
mkdirSync(RAIZ, { recursive: true })
if (!so.length) for (const f of readdirSync(OUT)) rmSync(path.join(OUT, f), { recursive: true, force: true })
const manifesto = so.length ? JSON.parse((await import('node:fs')).readFileSync(path.join(OUT, 'manifesto.json'), 'utf8')) : {}
const quer = (n) => !so.length || so.includes(n)

async function gravar(pipeline, nome) {
  const info = await pipeline.toFile(path.join(OUT, nome))
  manifesto[nome] = { w: info.width, h: info.height, kb: Math.round(info.size / 1024) }
}

// recorte em pixels {left, top, width, height}
const corte = (arq, r) => sharp(arq).rotate().extract(r).toBuffer()
// recorta na proporção (w/h) em volta de um ponto {x, y} em fração da imagem
async function proporcao(arq, prop, foco = { x: 0.5, y: 0.5 }) {
  const buf = await sharp(arq).rotate().toBuffer()
  const m = await sharp(buf).metadata()
  const w = Math.min(m.width, Math.round(m.height * prop))
  const h = Math.min(m.height, Math.round(w / prop))
  const left = Math.max(0, Math.min(m.width - w, Math.round(foco.x * m.width - w / 2)))
  const top = Math.max(0, Math.min(m.height - h, Math.round(foco.y * m.height - h / 2)))
  return sharp(buf).extract({ left, top, width: w, height: h }).toBuffer()
}

async function variantes(nome, buf, larguras, { q = 52, alfa = false } = {}) {
  const { width } = await sharp(buf).metadata()
  for (const w of larguras) {
    const lw = Math.min(w, width)
    if (manifesto[`${nome}-${lw}.webp`] && !so.length) continue
    for (const f of ['avif', 'webp']) {
      let p = sharp(buf).resize({ width: lw, kernel: 'lanczos3' })
      if (!alfa) p = p.removeAlpha()
      p = f === 'avif' ? p.avif({ quality: q, effort: 7 }) : p.webp({ quality: alfa ? 82 : 74, alphaQuality: 90, effort: 6, smartSubsample: true })
      await gravar(p, `${nome}-${lw}.${f}`)
    }
  }
  console.log(nome.padEnd(26), larguras.join(', '))
}

// alfa zerado com cor zerada (memória png-recorte-cor-escondida) e recorte justo na pessoa
async function limparAlfa(arq, aparar = true) {
  const { data, info } = await sharp(arq).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] < 6) data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0
  const img = sharp(data, { raw: info }).png()
  return aparar ? sharp(await img.toBuffer()).trim({ threshold: 1 }).png().toBuffer() : img.toBuffer()
}

// ---------------------------------------------------------------- hero
if (quer('hero')) {
  await variantes('hero-fundo', await sharp(`${LIMPAS}/hero-fundo.png`).toBuffer(), [960, 1440, 1672], { q: 46 })
  // o Ricardo recortado: desce até o pé da imagem (a camiseta some no preto do degradê)
  await variantes('ricardo', await limparAlfa('insumos/ricardo-recorte.png'), [420, 640, 900], { q: 60, alfa: true })
  // celular: a foto vertical inteira de fundo da seção (memória hero-mobile-foto-de-fundo)
  // foto nova (11/2026, editada da foto real dele com o rosto fiel): a 1ª deu cara de IA. O
  // celular mostra 4:5 a partir do topo, então o corte começa um pouco acima da cabeça
  await variantes('hero-cel', await corte(`${REC}/hero-vertical-rosto-real.png`, { left: 0, top: 330, width: 941, height: 1176 }), [480, 720, 941], { q: 50 })
}

// ---------------------------------------------------------------- dor: cena e o homem por cima
if (quer('dor')) {
  await variantes('dor-fundo', await sharp(`${LIMPAS}/dor-sentado.png`).toBuffer(), [960, 1440, 1672], { q: 46 })
  await variantes('dor-pessoa', await limparAlfa('insumos/dor-pessoa.png', false), [960, 1440, 1672], { q: 58, alfa: true })
}

// ---------------------------------------------------------------- ganhos: 6 fotos de 2 tiras
if (quer('ganhos')) {
  const PAINEIS = [
    { left: 9, top: 8, width: 544, height: 925 },
    { left: 565, top: 8, width: 542, height: 925 },
    { left: 1120, top: 8, width: 543, height: 925 },
  ]
  const nomes = [['pai-filho', 'terra', 'praia'], ['filho-academia', 'corrida', 'trabalho']]
  for (const [t, tira] of ['ganhos-1a3', 'ganhos-4a6'].entries())
    for (const [i, r] of PAINEIS.entries()) await variantes(`ganho-${nomes[t][i]}`, await corte(`${LIMPAS}/${tira}.png`, r), [400, 544], { q: 50 })
}

// ---------------------------------------------------------------- como funciona (fundo apagado)
if (quer('processo')) await variantes('processo-fundo', await sharp(`${LIMPAS}/como-funciona-fundo.png`).toBuffer(), [960, 1440], { q: 40 })

// ---------------------------------------------------------------- antes e depois (posts dele)
// Leonardo do post vertical de 588 px (único que tem ele); Luiz e Lucas do quadrado de 1254
if (quer('resultados')) {
  // casos da apresentação do Ricardo (11/2026). Leonardo, Luciano e o marido do casal saem dos
  // posts originais; Lucas, Jefferson e a esposa só existem na apresentação (512 px, em
  // Recursos Site/apresentacao). Ricardo: antes e depois do post "Sua esposa merece" (DEXA).
  const AP = (n) => `${REC}/apresentacao/${n}.jpg`
  const AD = {
    'leonardo-antes': [foto('12.40.19 (1)'), { left: 40, top: 492, width: 216, height: 376 }],
    'leonardo-depois': [foto('12.40.19 (1)'), { left: 320, top: 492, width: 224, height: 376 }],
    'luciano-antes': [foto('12.32.15'), { left: 643, top: 444, width: 252, height: 548 }],
    'luciano-depois': [foto('12.32.15'), { left: 954, top: 444, width: 262, height: 548 }],
    'lucas-antes': [AP('caso-lucas'), { left: 0, top: 0, width: 218, height: 399 }],
    'lucas-depois': [AP('caso-lucas'), { left: 280, top: 0, width: 210, height: 399 }],
    'jefferson-antes': [AP('caso-jefferson-antes'), { left: 0, top: 0, width: 246, height: 512 }],
    'jefferson-depois': [AP('caso-jefferson-depois'), { left: 0, top: 0, width: 246, height: 512 }],
    'ele-antes': [foto('12.32.15'), { left: 38, top: 444, width: 250, height: 548 }],
    'ele-depois': [foto('12.32.15'), { left: 348, top: 444, width: 264, height: 548 }],
    'ela-antes': [AP('casal-ela'), { left: 42, top: 0, width: 166, height: 450 }],
    'ela-depois': [AP('casal-ela'), { left: 212, top: 0, width: 164, height: 450 }],
    'ricardo-antes': [foto('12.31.44'), { left: 60, top: 410, width: 560, height: 985 }],
    'ricardo-depois': [foto('12.31.44'), { left: 648, top: 410, width: 572, height: 985 }],
  }
  for (const [nome, [arq, r]] of Object.entries(AD)) {
    // tudo em 3:4 pelo topo (cabeça), do mesmo tamanho dentro do cartão
    const buf = await corte(arq, r)
    const m = await sharp(buf).metadata()
    const h = Math.min(m.height, Math.round(m.width * 4 / 3))
    const larg = nome.startsWith('ricardo') ? [280, 420] : [216, 280]
    await variantes(`ad-${nome}`, await sharp(buf).extract({ left: 0, top: 0, width: m.width, height: h }).toBuffer(), larg, { q: 60 })
    // inteira (sem o corte 3:4) pra tela cheia, no tamanho original
    if (!nome.startsWith('ricardo')) await variantes(`adc-${nome}`, buf, [m.width], { q: 72 })
  }
}

// ---------------------------------------------------------------- sobre (3 retratos do post)
if (quer('sobre')) {
  const S = foto('12.32.11')
  await variantes('sobre-policial', await corte(S, { left: 0, top: 512, width: 334, height: 742 }), [334], { q: 60 })
  await variantes('sobre-familia', await corte(S, { left: 346, top: 512, width: 564, height: 672 }), [420, 564], { q: 60 })
  await variantes('sobre-adestrador', await corte(S, { left: 922, top: 512, width: 332, height: 742 }), [332], { q: 60 })
}

// ---------------------------------------------------------------- parede dos feedbacks (fotos reais dele)
if (quer('parede')) {
  const PAREDE = [
    ['treino-banco', '12.31.37', { x: 0.5, y: 0.45 }],
    ['maquina', '12.31.38', { x: 0.5, y: 0.5 }],
    ['notebook', '12.31.40', { x: 0.5, y: 0.45 }],
    ['halter', '12.40.19 (3)', { x: 0.5, y: 0.45 }],
    ['cabo', '12.40.20 (1)', { x: 0.5, y: 0.45 }],
    ['regata', '12.40.20', { x: 0.5, y: 0.35 }],
    ['remada', '12.40.22 (1)', { x: 0.5, y: 0.5 }],
    ['sentado', '12.40.23', { x: 0.5, y: 0.45 }],
    ['oculos', '12.40.25', { x: 0.62, y: 0.4 }],
  ]
  for (const [nome, hora, foco] of PAREDE) await variantes(`parede-${nome}`, await proporcao(foto(hora), 3 / 4, foco), [240, 360], { q: 48 })
}

// ---------------------------------------------------------------- prints reais dos feedbacks
// Recursos Site/DEPOIMENTOS RICARDO (11/2026): 4 posts de acompanhamento + 2 mensagens de aluno.
// Corta só a conversa (sem o título do post); a parede usa a altura natural de cada um.
if (quer('prints')) {
  const DEP = (h) => `${REC}/DEPOIMENTOS RICARDO/WhatsApp Image 2026-11-25 at ${h}.jpeg`
  const PRINTS = [
    ['constancia', '19.24.00 (1)', { left: 128, top: 12, width: 950, height: 1540 }],
    ['cotovelos', '19.23.59', { left: 282, top: 358, width: 506, height: 874 }],
    ['peso', '19.24.31', { left: 22, top: 22, width: 880, height: 1556 }],
    ['bulgaro', '19.24.00', { left: 150, top: 322, width: 642, height: 970 }],
    ['coluna', '19.23.59 (1)', { left: 130, top: 194, width: 684, height: 1108 }],
    ['audio', '19.23.59 (2)', { left: 130, top: 276, width: 672, height: 1002 }],
  ]
  for (const [nome, h, r] of PRINTS) await variantes(`print-${nome}`, await corte(DEP(h), r), [300, 480], { q: 66 })
}

// ---------------------------------------------------------------- avatares dos depoimentos
if (quer('avatares')) {
  await variantes('avatar-luiz', await corte(foto('12.32.15'), { left: 400, top: 460, width: 150, height: 150 }), [96], { q: 62 })
  await variantes('avatar-leonardo', await corte(foto('12.40.19 (1)'), { left: 370, top: 498, width: 96, height: 96 }), [96], { q: 62 })
}

// ---------------------------------------------------------------- logo: alfa pelo brilho, cor pintada
// memória logo-chatgpt-branco-no-preto. Ícone (asas, halter e punho) em cobre; PERSONAL em
// creme e TEXTOR em cobre. Saem em PNG pra nitidez da borda e em WebP pro site.
const COBRE = [217, 130, 63]
const CREME = [244, 239, 232]
async function pintar(r, cor) {
  const { data, info } = await sharp(`${REC}/logo-nova-branca.png`).extract(r).greyscale().raw().toBuffer({ resolveWithObject: true })
  const o = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0; i < data.length; i++) {
    const a = Math.max(0, Math.min(255, Math.round(((data[i] - 24) / (230 - 24)) * 255)))
    if (!a) continue
    o[i * 4] = cor[0]
    o[i * 4 + 1] = cor[1]
    o[i * 4 + 2] = cor[2]
    o[i * 4 + 3] = a
  }
  return sharp(o, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer()
}
if (quer('logo')) {
  const icone = await sharp(await pintar({ left: 500, top: 215, width: 672, height: 232 }, COBRE)).trim({ threshold: 1 }).png().toBuffer()
  const personal = await sharp(await pintar({ left: 440, top: 470, width: 800, height: 56 }, CREME)).trim({ threshold: 1 }).png().toBuffer()
  const textor = await sharp(await pintar({ left: 360, top: 540, width: 950, height: 175 }, COBRE)).trim({ threshold: 1 }).png().toBuffer()
  // lockup empilhado (rodapé): ícone, PERSONAL e TEXTOR centrados, como na logo original
  const mi = await sharp(icone).metadata()
  const mp = await sharp(personal).metadata()
  const mt = await sharp(textor).metadata()
  const L = Math.max(mi.width, mp.width, mt.width)
  const gap = 28
  const H = mi.height + gap + mp.height + 30 + mt.height
  const pilha = await sharp({ create: { width: L, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: icone, left: Math.round((L - mi.width) / 2), top: 0 },
      { input: personal, left: Math.round((L - mp.width) / 2), top: mi.height + gap },
      { input: textor, left: Math.round((L - mt.width) / 2), top: mi.height + gap + mp.height + 30 },
    ])
    .png()
    .toBuffer()
  await variantes('logo-icone', icone, [160, 320], { q: 80, alfa: true })
  await variantes('logo-personal', personal, [320], { q: 80, alfa: true })
  await variantes('logo-textor', textor, [320, 640], { q: 80, alfa: true })
  await variantes('logo-pilha', pilha, [360, 540], { q: 80, alfa: true })

  // ícones do navegador: o ícone em cobre sobre preto
  const quadrado = async (lado, margem) => {
    const ic = await sharp(icone).resize({ width: Math.round(lado * (1 - margem * 2)) }).toBuffer()
    const m = await sharp(ic).metadata()
    return sharp({ create: { width: lado, height: lado, channels: 4, background: '#0B0B0B' } }).composite([{ input: ic, left: Math.round((lado - m.width) / 2), top: Math.round((lado - m.height) / 2) }]).png()
  }
  await (await quadrado(32, 0.04)).toFile(`${RAIZ}/favicon-32.png`)
  await (await quadrado(180, 0.14)).toFile(`${RAIZ}/apple-touch-icon.png`)
  await (await quadrado(192, 0.14)).toFile(`${RAIZ}/icon-192.png`)
  await (await quadrado(512, 0.14)).toFile(`${RAIZ}/icon-512.png`)

  // imagem de compartilhamento 1200x630: fundo do hero, Ricardo à direita e a logo à esquerda
  const fundo = await sharp(`${LIMPAS}/hero-fundo.png`).resize(1200, 630, { fit: 'cover' }).modulate({ brightness: 0.8 }).toBuffer()
  const ric = await sharp(await limparAlfa('insumos/ricardo-recorte.png')).resize({ height: 600 }).toBuffer()
  const mr = await sharp(ric).metadata()
  const lg = await sharp(pilha).resize({ width: 420 }).toBuffer()
  const ml = await sharp(lg).metadata()
  await sharp(fundo)
    .composite([
      { input: ric, left: 1200 - mr.width - 60, top: 630 - mr.height },
      { input: lg, left: 90, top: Math.round((630 - ml.height) / 2) },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(OUT, 'og.jpg'))

  // ------------------------------------------------------------ abertura: a logo em pedaços
  // Corta o lockup empilhado em peças (asas, anilhas, punho, PERSONAL e cada letra de TEXTOR)
  // pelas colunas vazias do alfa, grava cada peça em WebP e escreve o parcial 97-abertura.html
  // com a posição de cada uma em % do lockup. A coreografia fica no 97-abertura.css.
  // blocos separados por coluna vazia; se vierem menos que `quer`, o bloco mais largo é partido
  // na coluna mais fina do miolo (letras que se encostam, como no TEXTOR)
  const colunas = async (buf, quer) => {
    const { data, info } = await sharp(buf).extractChannel('alpha').raw().toBuffer({ resolveWithObject: true })
    const n = Array.from({ length: info.width }, (_, x) => { let c = 0; for (let y = 0; y < info.height; y++) if (data[y * info.width + x] > 40) c++; return c })
    const runs = []
    let ini = -1
    for (let x = 0; x <= info.width; x++) {
      const cheio = x < info.width && n[x] > 0
      if (cheio && ini < 0) ini = x
      if (!cheio && ini >= 0) { runs.push([ini, x]); ini = -1 }
    }
    while (runs.length < quer) {
      const i = runs.reduce((m, r, j) => (r[1] - r[0] > runs[m][1] - runs[m][0] ? j : m), 0)
      const [a, b] = runs[i]
      let corte = a + 1
      for (let x = Math.round(a + (b - a) * 0.3); x < a + (b - a) * 0.7; x++) if (n[x] < n[corte] || corte < a + (b - a) * 0.3) corte = x
      runs.splice(i, 1, [a, corte], [corte, b])
    }
    return runs
  }
  const ESC = 640 / L // peças gravadas pra um lockup de 640 px (2x do tamanho na tela)
  const topoP = mi.height + gap
  const topoT = topoP + mp.height + 30
  const xI = Math.round((L - mi.width) / 2)
  const xT = Math.round((L - mt.width) / 2)
  const ri = await colunas(icone, 7) // asa, anilha, anilhas+barra, punho, anilhas+barra, anilha, asa
  if (ri.length !== 7) throw new Error(`abertura: esperava 7 blocos no ícone, veio ${ri.length}`)
  const rt = await colunas(textor, 6)
  if (rt.length !== 6) throw new Error(`abertura: esperava 6 letras em TEXTOR, veio ${rt.length}`)
  const pecas = [
    ['asa-e', xI + ri[0][0], 0, ri[0][1] - ri[0][0], mi.height],
    ['anilha-e', xI + ri[1][0], 0, ri[2][1] - ri[1][0], mi.height],
    ['punho', xI + ri[3][0], 0, ri[3][1] - ri[3][0], mi.height],
    ['anilha-d', xI + ri[4][0], 0, ri[5][1] - ri[4][0], mi.height],
    ['asa-d', xI + ri[6][0], 0, ri[6][1] - ri[6][0], mi.height],
    ['personal', Math.round((L - mp.width) / 2), topoP, mp.width, mp.height],
    ...rt.map(([a, b], i) => [`letra-${i}`, xT + a, topoT, b - a, mt.height]),
  ]
  const pct = (v, t) => `${+((v / t) * 100).toFixed(3)}%`
  const imgs = []
  for (const [nome, left, top, width, height] of pecas) {
    const w = Math.max(1, Math.round(width * ESC))
    const h = Math.max(1, Math.round(height * ESC))
    await gravar(sharp(await sharp(pilha).extract({ left, top, width, height }).png().toBuffer()).resize(w, h).webp({ quality: 82, alphaQuality: 90 }), `abertura-${nome}.webp`)
    const letra = nome.startsWith('letra-') ? ` style="left:${pct(left, L)};top:${pct(top, H)};width:${pct(width, L)};--l:${nome.slice(6)}"` : ` style="left:${pct(left, L)};top:${pct(top, H)};width:${pct(width, L)}"`
    imgs.push(`        <img class="abertura__p" data-peca="${nome.startsWith('letra-') ? 'letra' : nome}" src="/assets/img/abertura-${nome}.webp" alt="" width="${w}" height="${h}"${letra}>`)
  }
  writeFileSync('src/partials/97-abertura.html', `<!-- abertura (gerado por scripts/processar-imagens.mjs, não editar à mão): a logo monta
     peça por peça e a tela sobe com a borda curva, revelando o hero. Coreografia no 97-abertura.css.
     O script segura todas as animações da página (abre-espera) até as peças decodificarem, no
     máximo 0,6 s: sem isso o punho e as asas animavam antes de a imagem chegar -->
<div class="abertura" aria-hidden="true" data-abertura>
  <div class="abertura__marca">
    <span class="abertura__luz"></span>
    <div class="abertura__logo" style="aspect-ratio:${L} / ${H}">
${imgs.join('\n')}
    </div>
  </div>
</div>
<script>(()=>{const h=document.documentElement;if(!h.classList.contains('js')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;h.classList.add('abre-espera');const solta=()=>h.classList.remove('abre-espera');Promise.race([Promise.all([...document.querySelectorAll('[data-abertura] img')].map((i)=>i.decode().catch(()=>{}))),new Promise((r)=>setTimeout(r,600))]).then(solta)})()</script>
`)
}

// ---------------------------------------------------------------- fontes (self-hosted, só latino)
mkdirSync('src/assets/fonts', { recursive: true })
copyFileSync('node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2', 'src/assets/fonts/archivo-var.woff2')
copyFileSync('node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2', 'src/assets/fonts/manrope-var.woff2')

writeFileSync(path.join(OUT, 'manifesto.json'), JSON.stringify(manifesto, null, 1))
const total = Object.values(manifesto).reduce((s, m) => s + m.kb, 0)
console.log(`\n${Object.keys(manifesto).length} arquivos, ${total} KB no total`)
