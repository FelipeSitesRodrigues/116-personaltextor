// JSON-LD do Personal Textor (ProfessionalService + Person) e das dúvidas (FAQPage), puxado pelo build.
import * as cheerio from 'cheerio'

export function schemaEmpresa(html, cfg) {
  const base = (cfg.dominio || '').replace(/\/$/, '')
  const ricardo = {
    '@type': 'Person',
    '@id': `${base}/#ricardo`,
    name: 'Ricardo Textor',
    jobTitle: 'Personal trainer',
    description: 'Personal trainer com mais de 27 anos de treino e mais de 20 ajudando pessoas a evoluir. Policial, pai de dois meninos e adestrador de cães.',
    sameAs: Object.values(cfg.redes || {}).filter(Boolean),
  }
  const empresa = {
    '@type': 'ProfessionalService',
    '@id': `${base}/#consultoria`,
    name: 'Personal Textor',
    alternateName: 'Personal Textor Consultoria Online',
    slogan: 'Faz o básico. Confia no processo.',
    description: cfg.descricao,
    image: `${base}/assets/img/og.jpg`,
    logo: `${base}/icon-512.png`,
    areaServed: { '@type': 'Country', name: 'Brasil' },
    serviceType: 'Consultoria online integrada de treino, nutrição e acompanhamento médico',
    audience: { '@type': 'PeopleAudience', suggestedGender: 'male', suggestedMinAge: 35 },
    knowsAbout: ['Consultoria online de treino', 'Consultoria multidisciplinar', 'Nutrição esportiva', 'Acompanhamento médico', 'Personal trainer online', 'Musculação', 'Emagrecimento', 'Hipertrofia', 'Treino para homens acima de 40'],
    founder: { '@id': `${base}/#ricardo` },
    sameAs: Object.values(cfg.redes || {}).filter(Boolean),
  }
  if (cfg.whatsapp && !/^5500/.test(cfg.whatsapp)) empresa.telephone = `+${cfg.whatsapp}`
  if (base) empresa.url = `${base}/`
  const $ = cheerio.load(html)
  const perguntas = $('#duvidas .duvida')
    .map((_, d) => ({
      '@type': 'Question',
      name: $(d).find('.duvida__q').text().replace(/\s+/g, ' ').trim(),
      acceptedAnswer: { '@type': 'Answer', text: $(d).find('.duvida__r').text().replace(/\s+/g, ' ').trim() },
    }))
    .get()
    .filter((q) => q.name && q.acceptedAnswer.text)
  const grafo = [empresa, ricardo]
  if (perguntas.length) grafo.push({ '@type': 'FAQPage', '@id': `${base}/#duvidas`, mainEntity: perguntas })
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': grafo })}</script>`
}
