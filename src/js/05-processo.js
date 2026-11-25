// Conversa do WhatsApp no celular: quando o celular aparece, as mensagens entram uma a uma, e
// antes de cada resposta do Ricardo aparece o "digitando" e o status muda pra "digitando...".
// Roda uma vez. Sem JS ou com movimento reduzido, tudo já está lá.
;(() => {
  const conversa = document.querySelector('[data-zap]')
  if (!conversa) return
  const msgs = [...conversa.querySelectorAll('[data-msg]')]
  const digitando = conversa.querySelector('[data-digitando]')
  const status = document.querySelector('[data-zap-status]')
  const mostrarTudo = () => msgs.forEach((m) => m.classList.add('msg--entrou'))
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return mostrarTudo()
  // espaço das mensagens reservado: a conversa cresce de baixo pra cima sem pular o layout
  msgs.forEach((m) => (m.style.display = 'none'))
  const espera = (ms) => new Promise((r) => setTimeout(r, ms))
  const tocar = async () => {
    await espera(500)
    for (const m of msgs) {
      const doRicardo = !m.classList.contains('msg--eu')
      if (doRicardo) {
        digitando.classList.add('msg--ativo')
        if (status) status.textContent = 'digitando...'
        await espera(1300)
        digitando.classList.remove('msg--ativo')
        if (status) status.textContent = 'online'
      }
      m.style.display = ''
      requestAnimationFrame(() => requestAnimationFrame(() => m.classList.add('msg--entrou')))
      await espera(doRicardo ? 900 : 1100)
    }
  }
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return
    io.disconnect()
    tocar()
  }, { threshold: 0.45 })
  io.observe(conversa)
})()
