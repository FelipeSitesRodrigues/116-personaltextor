// Formulário da aplicação: entra pelo <template> depois do load (ou antes, se a pessoa clicar
// num botão que leva pra cá) e, ao enviar, abre o WhatsApp do Ricardo com tudo escrito.
;(() => {
  const lugar = document.querySelector('[data-form-lugar]')
  const molde = document.querySelector('[data-form-molde]')
  if (!lugar || !molde) return
  const numero = lugar.closest('section').dataset.zap || ''
  let montado = false
  const montar = () => {
    if (montado) return
    montado = true
    lugar.append(molde.content.cloneNode(true))
    const form = lugar.querySelector('[data-form]')
    const erro = form.querySelector('[data-form-erro]')
    const idade = form.elements.idade
    idade.addEventListener('input', () => (idade.value = idade.value.replace(/\D/g, '').slice(0, 3)))
    form.addEventListener('change', (e) => e.target.closest('.grupo')?.classList.remove('grupo--erro'))
    // o brilho do botão de enviar precisa do observador do kit, que já rodou: liga aqui
    const botao = form.querySelector('[data-brilho]')
    if (botao && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) new IntersectionObserver((es) => es.forEach((e) => botao.classList.toggle('brilho-vivo', e.isIntersecting))).observe(botao)
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const f = form.elements
      const nome = f.nome.value.trim()
      const faltam = []
      if (!nome) faltam.push('seu nome')
      for (const g of ['objetivo', 'dias', 'local', 'experiencia']) {
        const vazio = !f[g].value
        form.querySelector(`[data-grupo="${g}"]`).classList.toggle('grupo--erro', vazio)
        if (vazio) faltam.push({ objetivo: 'o objetivo', dias: 'os dias por semana', local: 'onde vai treinar', experiencia: 'se já treinou' }[g])
      }
      if (faltam.length) {
        erro.textContent = `Falta só ${faltam.join(', ').replace(/, ([^,]*)$/, ' e $1')}.`
        if (!nome) f.nome.focus()
        return
      }
      erro.textContent = ''
      const linhas = [
        'Olá, Ricardo! Vim pelo site e quero entrar na consultoria.',
        `Nome: ${nome}`,
        f.idade.value && `Idade: ${f.idade.value}`,
        `Objetivo: ${f.objetivo.value}`,
        `Dias por semana: ${f.dias.value}`,
        `Onde vou treinar: ${f.local.value}`,
        `Experiência: ${f.experiencia.value}`,
        f.plano.value && `Plano de interesse: ${f.plano.value}`,
      ].filter(Boolean)
      const url = `https://wa.me/${numero}?text=${encodeURIComponent(linhas.join('\n'))}`
      const aba = window.open(url, '_blank', 'noopener')
      if (!aba) location.href = url
    })
  }
  if (document.readyState === 'complete') setTimeout(montar, 300)
  else addEventListener('load', () => setTimeout(montar, 300), { once: true })
  // clique num link pra #aplicar antes do load: monta na hora, pra a âncora parar no lugar certo
  document.addEventListener('click', (e) => e.target.closest('a[href="#aplicar"]') && montar(), true)
})()
