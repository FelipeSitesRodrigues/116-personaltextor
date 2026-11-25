// Depoimentos: um por vez no cartão de vidro, troca sozinho a cada 7 s (a barra cobre mostra o
// tempo) e pelas setas. Para quando sai da tela, quando o mouse está em cima e com movimento
// reduzido. A parede de fotos só anima com a seção na tela (.feedbacks--visivel).
;(() => {
  const secao = document.querySelector('.feedbacks')
  const depo = document.querySelector('[data-depo]')
  if (!secao || !depo) return
  const itens = [...depo.querySelectorAll('[data-dep]')]
  const atual = depo.querySelector('[data-depo-atual]')
  const barra = depo.querySelector('[data-depo-barra]')
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches
  let i = 0
  let timer = 0
  let visivel = false
  let parado = false
  const ir = (n) => {
    itens[i].classList.remove('dep--ativo')
    itens[i].setAttribute('aria-hidden', 'true')
    i = (n + itens.length) % itens.length
    itens[i].classList.add('dep--ativo')
    itens[i].removeAttribute('aria-hidden')
    atual.textContent = String(i + 1).padStart(2, '0')
    agendar()
  }
  const agendar = () => {
    clearTimeout(timer)
    if (reduzir || itens.length < 2) return
    barra.classList.remove('depo__barra--anda')
    if (!visivel || parado) return
    void barra.offsetWidth
    barra.classList.add('depo__barra--anda')
    timer = setTimeout(() => ir(i + 1), 7000)
  }
  depo.querySelector('[data-depo-ant]').addEventListener('click', () => ir(i - 1))
  depo.querySelector('[data-depo-prox]').addEventListener('click', () => ir(i + 1))
  depo.addEventListener('pointerenter', () => ((parado = true), agendar()))
  depo.addEventListener('pointerleave', () => ((parado = false), agendar()))
  new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting
    secao.classList.toggle('feedbacks--visivel', visivel)
    agendar()
  }).observe(secao)
})()
