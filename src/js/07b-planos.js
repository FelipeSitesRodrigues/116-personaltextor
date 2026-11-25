// planos: chave 6 / 12 meses troca o data-periodo da seção (o CSS mostra o que é de cada um)
;(() => {
  const s = document.querySelector('[data-planos]')
  if (!s) return
  const ops = s.querySelectorAll('[data-periodo-op]')
  ops.forEach((b) =>
    b.addEventListener('click', () => {
      const p = b.dataset.periodoOp
      if (s.dataset.periodo === p) return
      s.dataset.periodo = p
      ops.forEach((o) => o.setAttribute('aria-pressed', String(o === b)))
      s.classList.remove('trocou')
      requestAnimationFrame(() => s.classList.add('trocou'))
    })
  )
})()
