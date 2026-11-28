// Antes e depois em tela cheia: o toque no par de fotos abre as duas grandes num <dialog>, com
// setas (e arrastar de lado no celular) pra passar de aluno. Fecha no X, no Esc, no toque fora
// das fotos e no "voltar" do celular: a abertura empurra uma entrada no histórico, então o
// voltar fecha o pop-up em vez de sair do site.
;(() => {
  const dlg = document.querySelector('[data-fc]')
  const pares = [...document.querySelectorAll('.antes-depois .ad__fotos')]
  if (!dlg || !pares.length || !dlg.showModal) return
  const $ = (s) => dlg.querySelector(s)
  const fotos = $('[data-fc-fotos]')
  const quem = $('[data-fc-quem]')
  const num = $('[data-fc-num]')
  const conta = $('[data-fc-conta]')
  const limpa = (t) => t.replace(/\s+/g, ' ').trim()
  let atual = 0

  // cada foto ocupa o espaço que tem sem passar de 2,4x o tamanho real (a foto original é de
  // celular, pequena: maior que isso só borra)
  const encaixar = () => {
    for (const q of fotos.querySelectorAll('.fc__quadro')) {
      const img = q.querySelector('img')
      const caixa = q.parentElement
      const larg = +img.getAttribute('width')
      const r = larg / +img.getAttribute('height')
      let h = Math.min(caixa.clientHeight, larg * 2.4 / r)
      let w = h * r
      if (w > caixa.clientWidth) (w = caixa.clientWidth), (h = w / r)
      q.style.width = `${Math.round(w)}px`
      q.style.height = `${Math.round(h)}px`
    }
  }

  const mostrar = (i) => {
    atual = (i + pares.length) % pares.length
    const par = pares[atual]
    const cartao = par.closest('.ad')
    quem.textContent = par.dataset.quem || limpa(cartao.querySelector('.ad__quem').textContent)
    const n = par.parentElement.querySelector(':scope > .ad__numeros')
    const selo = par.parentElement.querySelector(':scope > .ad__selo')
    num.replaceChildren(...[n, selo].filter(Boolean).map((el) => el.cloneNode(true)))
    fotos.replaceChildren(...[...par.querySelectorAll('figure')].map((fig) => {
      const f = document.createElement('figure')
      f.className = 'fc__foto'
      const q = document.createElement('div')
      q.className = 'fc__quadro'
      const pic = fig.querySelector('picture').cloneNode(true)
      const img = pic.querySelector('img')
      img.loading = 'eager'
      img.removeAttribute('class')
      pic.querySelectorAll('[sizes]').forEach((s) => (s.sizes = '50vw'))
      q.append(pic, fig.querySelector('figcaption').cloneNode(true))
      f.append(q)
      return f
    }))
    conta.textContent = `${atual + 1} / ${pares.length}`
    encaixar()
  }

  const abrir = (i) => {
    if (!dlg.open) {
      history.pushState({ fc: 1 }, '')
      dlg.showModal()
      document.documentElement.classList.add('fc-aberto')
      window.lenis?.stop()
    }
    mostrar(i)
  }
  const fechar = () => {
    if (!dlg.open) return
    dlg.close()
    document.documentElement.classList.remove('fc-aberto')
    window.lenis?.start()
  }
  // todo fechamento passa pelo histórico, pra não sobrar entrada que o voltar teria que gastar
  const pedirFechar = () => (history.state?.fc ? history.back() : fechar())
  addEventListener('popstate', fechar)

  pares.forEach((par, i) => {
    const nome = par.dataset.quem || limpa(par.closest('.ad').querySelector('.ad__quem').textContent)
    par.setAttribute('role', 'button')
    par.tabIndex = 0
    par.setAttribute('aria-label', `Ver antes e depois em tela cheia: ${nome}`)
    par.addEventListener('click', () => abrir(i))
    par.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') e.preventDefault(), abrir(i)
    })
  })

  $('[data-fc-fechar]').addEventListener('click', pedirFechar)
  $('[data-fc-ant]').addEventListener('click', () => mostrar(atual - 1))
  $('[data-fc-prox]').addEventListener('click', () => mostrar(atual + 1))
  dlg.addEventListener('cancel', (e) => (e.preventDefault(), pedirFechar()))
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') mostrar(atual - 1)
    if (e.key === 'ArrowRight') mostrar(atual + 1)
  })
  // toque fora das fotos (no fundo escuro) fecha
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target === fotos || e.target.classList.contains('fc__foto')) pedirFechar()
  })
  // arrastar de lado troca de aluno
  let x0 = null
  fotos.addEventListener('pointerdown', (e) => (x0 = e.clientX))
  fotos.addEventListener('pointerup', (e) => {
    if (x0 === null) return
    const dx = e.clientX - x0
    x0 = null
    if (Math.abs(dx) > 50) mostrar(atual + (dx < 0 ? 1 : -1))
  })
  addEventListener('resize', () => dlg.open && encaixar())
})()
