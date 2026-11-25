// Dor: o "Pra depois." desce mais devagar que a cena ao rolar (parece mais fundo que o homem).
// Só transform, num rAF, e só com a seção na tela. Sem isso no celular e com movimento reduzido.
;(() => {
  const palco = document.querySelector('[data-dor]')
  const gigante = document.querySelector('[data-dor-gigante]')
  if (!palco || !gigante || matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(min-width: 48em)').matches) return
  let raf = 0
  let visivel = false
  const quadro = () => {
    raf = 0
    const r = palco.getBoundingClientRect()
    // -1 quando a seção entra por baixo, 1 quando sai por cima
    const t = Math.max(-1, Math.min(1, (innerHeight / 2 - (r.top + r.height / 2)) / innerHeight))
    gigante.style.transform = `translate3d(0, ${(t * 70).toFixed(1)}px, 0)`
  }
  addEventListener('scroll', () => visivel && !raf && (raf = requestAnimationFrame(quadro)), { passive: true })
  new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting
    if (visivel) quadro()
  }).observe(palco)
})()
