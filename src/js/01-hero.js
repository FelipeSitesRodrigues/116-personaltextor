// Hero: no computador o Ricardo e o fundo andam de leve com o mouse (profundidade) e, ao
// rolar, o texto sobe um pouco mais rápido que a foto. Só transform, num rAF, e só com o hero
// na tela. Nada disso roda no celular nem com movimento reduzido.
;(() => {
  const hero = document.querySelector('[data-hero]')
  if (!hero || matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover) and (pointer: fine) and (min-width: 64em)').matches) return
  const ricardo = hero.querySelector('[data-hero-ricardo]')
  const fundo = hero.querySelector('.hero__fundo')
  const texto = hero.querySelector('[data-hero-texto]')
  let mx = 0
  let my = 0
  let x = 0
  let y = 0
  let raf = 0
  let visivel = true
  const quadro = () => {
    raf = 0
    x += (mx - x) * 0.08
    y += (my - y) * 0.08
    const r = Math.min(scrollY, innerHeight)
    ricardo.style.transform = `translate3d(${(x * -14).toFixed(2)}px, ${(r * 0.12 + y * -6).toFixed(2)}px, 0)`
    fundo.style.transform = `translate3d(${(x * 18).toFixed(2)}px, ${(r * 0.3 + y * 10).toFixed(2)}px, 0)`
    texto.style.transform = `translate3d(0, ${(r * -0.08).toFixed(2)}px, 0)`
    if (Math.abs(mx - x) > 0.002 || Math.abs(my - y) > 0.002) pedir()
  }
  const pedir = () => visivel && !raf && (raf = requestAnimationFrame(quadro))
  hero.addEventListener('pointermove', (e) => {
    mx = e.clientX / innerWidth - 0.5
    my = e.clientY / innerHeight - 0.5
    pedir()
  })
  addEventListener('scroll', pedir, { passive: true })
  new IntersectionObserver(([e]) => (visivel = e.isIntersecting)).observe(hero)
})()
