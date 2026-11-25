/**
 * Seed : comptes de l'équipe, paramètres, contenus et données de démonstration.
 * Lancer avec : npm run seed
 * - comptes : créés s'ils manquent ; en mode démo, mots de passe remis aux valeurs de démo
 * - contenus de démo : insérés seulement si la carte est vide (base neuve)
 */
import config from '@payload-config'
import { randomBytes, randomInt } from 'crypto'
import { getPayload, type Payload } from 'payload'

import type { Event } from '@/payload-types'

import { DEMO_ACCOUNTS, isDemo } from '@/lib/demo'
import { addDays, parisToUtc, todayParis } from '@/lib/time'

import { MENU } from './menu'

const payload = await getPayload({ config })
const log = (m: string) => payload.logger.info(m)
const quiet = { skipNotify: true }

// ---------------------------------------------------------------- comptes
async function seedStaff() {
  const staff = [
    { name: 'Gérant [À REMPLACER]', role: 'gerant' as const, env: process.env.SEED_GERANT_PASSWORD, demo: DEMO_ACCOUNTS[0] },
    { name: 'Serveur [À REMPLACER]', role: 'serveur' as const, env: process.env.SEED_SERVEUR_PASSWORD, demo: DEMO_ACCOUNTS[1] },
  ]
  for (const m of staff) {
    const email = m.demo.email
    const password = isDemo() ? m.demo.password : m.env || randomBytes(9).toString('base64url')
    const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
    if (existing.docs[0]) {
      if (isDemo()) await payload.update({ collection: 'users', id: existing.docs[0].id, data: { password } })
      log(`Compte présent : ${email}${isDemo() ? ' (mot de passe de démo remis)' : ''}`)
      continue
    }
    await payload.create({ collection: 'users', data: { name: m.name, email, role: m.role, password } })
    log(`Compte créé : ${email} (${m.role})${m.env && !isDemo() ? '' : ` mot de passe : ${password}`}`)
  }
}

// ---------------------------------------------------------------- paramètres
async function seedSettings() {
  await payload.updateGlobal({
    slug: 'settings',
    data: {
      name: 'Le Carré',
      address: { street: '[À REMPLACER] Adresse exacte', postalCode: '95350', city: 'Saint-Brice-sous-Forêt' },
      phone: '+33100000000',
      email: 'contact@lecarre.example',
      geo: { lat: 48.9986, lng: 2.3582 },
      socials: [
        { network: 'instagram', url: 'https://www.instagram.com/lecarrestbrice' },
        { network: 'snapchat', url: 'https://www.snapchat.com/add/lecarrestbrice' },
        { network: 'tiktok', url: 'https://urlr.me/FfkrT' },
      ],
      // d'après le Linktree : 7j/7, 18h à 2h
      openingHours: (['1', '2', '3', '4', '5', '6', '0'] as const).map((day) => ({ day, open: '18:00', close: '02:00' })),
      slotIntervalMin: 30,
      defaultDurationMin: 120,
      maxPartySizeOnline: 10,
      bookingCutoffMin: 60,
      orderingEnabled: true,
      loyalty: { pointsPerEuro: 1, birthdayBonus: 50, pointsValidityMonths: 12 },
    },
  })
  log('Paramètres enregistrés (horaires 7j/7, 18h à 2h).')
}

async function seedHomepage() {
  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      heroKicker: 'Restaurant lounge · Saint-Brice-sous-Forêt',
      heroTitle: 'Le Carré',
      heroSubtitle: 'Burgers, pâtes, mocktails et desserts gourmands dans une ambiance feutrée. Ouvert 7j/7 de 18h à 2h.',
      ambiance: [
        {
          title: 'Le lounge',
          text: 'Banquettes profondes, lumière tamisée et musique à bon volume : on vient pour une heure, on reste la soirée. [À REMPLACER par le texte du client]',
        },
        {
          title: 'La cuisine',
          text: 'Burgers généreux, pâtes crémeuses, plats du soir et desserts maison. Tous nos plats sont servis avec une boisson comprise.',
        },
        {
          title: 'Les soirées',
          text: 'Matchs sur grand écran, soirées à thème et anniversaires : suivez l’agenda ou privatisez le lieu pour votre événement.',
        },
      ],
      reviews: [
        { author: 'Exemple d’avis (démo)', text: 'Super ambiance, le burger mix est une tuerie et le service est rapide même un samedi soir.', rating: 5 },
        { author: 'Exemple d’avis (démo)', text: 'Les mocktails sont excellents, mention spéciale à l’Ocean Blue. On reviendra pour le prochain match.', rating: 5 },
        { author: 'Exemple d’avis (démo)', text: 'Réservation en ligne très pratique, table prête à l’heure. Le fondant au chocolat vaut le détour.', rating: 4 },
      ],
      ctaTitle: 'Votre table vous attend',
      ctaText: 'Réservez en quelques secondes, confirmation immédiate par SMS. Précommande et paiement en ligne possibles.',
    },
  })
  log('Page d’accueil remplie.')
}

// ---------------------------------------------------------------- carte
async function seedMenu() {
  const ids: Record<string, number> = {}
  for (const [ci, cat] of MENU.entries()) {
    const c = await payload.create({ collection: 'menu-categories', data: { title: cat.title, slug: cat.slug, note: cat.note, order: ci, active: true } })
    for (const [ii, item] of cat.items.entries()) {
      const doc = await payload.create({
        collection: 'menu-items',
        data: {
          title: item.title,
          description: item.description,
          price: item.price,
          category: c.id,
          tags: item.tags,
          options: item.options?.map((o) => ({ name: o.name, supplement: o.supplement ?? 0 })),
          order: ii,
          available: true,
        },
      })
      ids[item.title] = doc.id
    }
  }
  log(`Carte : ${MENU.length} catégories, ${Object.keys(ids).length} produits.`)
  return ids
}

async function seedTables() {
  const tables = [
    ['T01', 'Table 1', 'salle', 1, 2],
    ['T02', 'Table 2', 'salle', 1, 2],
    ['T03', 'Table 3', 'salle', 2, 4],
    ['T04', 'Table 4', 'salle', 2, 4],
    ['T05', 'Table 5', 'salle', 2, 4],
    ['T06', 'Table 6', 'salle', 4, 6],
    ['T07', 'Terrasse 7', 'terrasse', 1, 2],
    ['T08', 'Terrasse 8', 'terrasse', 2, 4],
    ['T09', 'Terrasse 9', 'terrasse', 2, 4],
    ['V01', 'Carré VIP 1', 'vip', 4, 6],
    ['V02', 'Carré VIP 2', 'vip', 6, 8],
    ['E01', 'Étage 1', 'etage', 2, 4],
  ] as const
  const docs = []
  for (const [code, label, zone, capacityMin, capacityMax] of tables) {
    docs.push(await payload.create({ collection: 'tables', data: { code, label, zone, capacityMin, capacityMax, active: true } }))
  }
  log(`${docs.length} tables créées.`)
  return docs
}

async function seedRewards() {
  const rewards = [
    ['Thé à la menthe offert', 50],
    ['Dessert offert', 60],
    ['Milkshake offert', 70],
    ['Mocktail offert', 90],
    ['Plat offert', 150],
  ] as const
  for (const [title, pointsCost] of rewards) await payload.create({ collection: 'rewards', data: { title, pointsCost, active: true } })
  log(`${rewards.length} récompenses.`)
}

// ---------------------------------------------------------------- événements
function richText(...paragraphs: string[]): Event['description'] {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
      })),
    },
  }
}

/** prochaine date (Paris) dont le jour de semaine vaut `weekday`, au moins `minDays` jours plus tard */
function nextWeekday(weekday: number, minDays = 1): string {
  const today = todayParis()
  for (let i = minDays; i < minDays + 7; i++) {
    const d = addDays(today, i)
    if (new Date(`${d}T12:00:00Z`).getUTCDay() === weekday) return d
  }
  return addDays(today, minDays)
}

async function seedEvents() {
  const events = [
    {
      title: 'Soirée R&B Classics',
      type: 'soiree_theme' as const,
      date: nextWeekday(6),
      start: 21 * 60,
      end: 26 * 60,
      excerpt: 'Les classiques R&B des années 2000 toute la soirée, mocktails signature à l’honneur.',
      bookable: true,
      capacity: 60,
      text: ['Toute la soirée, notre DJ ressort les classiques R&B des années 2000.', 'Réservation conseillée, places limitées. [Démo, à adapter]'],
    },
    {
      title: 'Soirée Ligue des champions',
      type: 'match' as const,
      date: nextWeekday(2),
      start: 21 * 60,
      end: 23 * 60,
      excerpt: 'Le match sur grand écran, ambiance stade et formule burger + boisson.',
      bookable: true,
      capacity: 50,
      text: ['Coup d’envoi à 21 h sur grand écran.', 'Réservez votre table pour être bien placé. [Démo, à adapter]'],
    },
    {
      title: 'Blind test du jeudi',
      type: 'autre' as const,
      date: nextWeekday(4),
      start: 20 * 60 + 30,
      end: 23 * 60,
      excerpt: 'Venez en équipe, des desserts à gagner.',
      bookable: false,
      capacity: undefined,
      text: ['Équipes de 2 à 6 personnes, inscription sur place.', 'Les gagnants repartent avec des desserts offerts. [Démo, à adapter]'],
    },
  ]
  for (const e of events) {
    await payload.create({
      collection: 'events',
      data: {
        title: e.title,
        type: e.type,
        startsAt: parisToUtc(e.date, e.start).toISOString(),
        endsAt: parisToUtc(e.date, e.end).toISOString(),
        excerpt: e.excerpt,
        description: richText(...e.text),
        bookable: e.bookable,
        capacity: e.capacity,
        published: true,
      },
    })
  }
  log(`${events.length} événements à venir.`)
}

// ---------------------------------------------------------------- clients, résas, commandes
const FIRST = ['Inès', 'Yanis', 'Sarah', 'Mehdi', 'Léa', 'Karim', 'Nora', 'Samy']
const LAST = ['B.', 'K.', 'M.', 'D.', 'L.', 'R.', 'T.', 'A.']
// 06 39 98 xx xx : plage réservée par l'ARCEP aux œuvres de fiction
const demoPhone = (i: number) => `+3363998${String(1000 + i).slice(-4)}`

async function seedCustomers() {
  const docs = []
  for (let i = 0; i < FIRST.length; i++) {
    docs.push(
      await payload.create({
        collection: 'customers',
        data: {
          firstName: FIRST[i],
          lastName: LAST[i],
          phone: demoPhone(i),
          email: `client${i + 1}@exemple.test`,
          birthdayDay: ((i * 7) % 28) + 1,
          birthdayMonth: ((i * 5) % 12) + 1,
          optInSms: i % 2 === 0,
          optInEmail: i % 3 === 0,
          visits: 0,
        },
      }),
    )
  }
  log(`${docs.length} clients fidélité (numéros fictifs).`)
  return docs
}

function pick<T>(arr: readonly T[]): T {
  return arr[randomInt(arr.length)]
}

async function seedHistory(p: Payload, tables: { id: number }[], customers: { id: number }[]) {
  const popular = ['Burger mix', 'Burger 300 g', 'Chicken burger', 'Pâtes carbonara', 'Ocean Blue', 'Virgin mojito', 'Soft', 'Thé à la menthe', 'Fondant au chocolat', 'Milkshake à composer', 'Crêpe sucrée', 'Steak à cheval', 'Nems poulet x5', 'Petite théière (2 personnes)']
  const { docs: products } = await p.find({ collection: 'menu-items', limit: 200, depth: 0, pagination: false })
  const byTitle = new Map(products.map((d) => [d.title, d]))
  const today = todayParis()
  let count = 0
  // 30 jours d'historique : commandes servies, réparties sur la soirée
  for (let day = 30; day >= 1; day--) {
    const date = addDays(today, -day)
    const perDay = 3 + randomInt(4)
    for (let n = 0; n < perDay; n++) {
      const minute = 18 * 60 + randomInt(7 * 60) // 18h à 1h
      const at = parisToUtc(date, minute)
      const lines = Array.from({ length: 1 + randomInt(4) }, () => {
        const prod = byTitle.get(pick(popular))!
        const opt = prod.options?.[0]?.name
        return { menuItem: prod.id, title: prod.title, qty: 1 + randomInt(2), unitPrice: prod.price, options: opt }
      })
      await p.create({
        collection: 'orders',
        data: {
          number: n + 1,
          type: 'table',
          serviceDate: date,
          status: 'servie',
          table: pick(tables).id,
          customer: randomInt(3) === 0 ? undefined : pick(customers).id,
          items: lines,
          paymentMethod: randomInt(3) === 0 ? 'en_ligne' : 'caisse',
          paymentStatus: 'payee',
          createdAt: at.toISOString(),
        },
      })
      count++
    }
  }
  log(`${count} commandes servies sur 30 jours (points crédités par les hooks).`)
}

async function seedTonight(p: Payload, tables: { id: number; code: string }[], customers: { id: number; firstName?: string | null; phone: string }[]) {
  const today = todayParis()
  const tomorrow = addDays(today, 1)
  const res = [
    { date: today, startTime: '19:30', partySize: 2, table: 'T01', status: 'confirmee' as const, c: 0 },
    { date: today, startTime: '20:00', partySize: 4, table: 'T03', status: 'confirmee' as const, c: 1 },
    { date: today, startTime: '20:30', partySize: 6, table: 'V01', status: 'confirmee' as const, c: 2 },
    { date: today, startTime: '21:00', partySize: 3, table: 'T08', status: 'confirmee' as const, c: undefined },
    { date: today, startTime: '22:00', partySize: 2, table: 'T02', status: 'confirmee' as const, c: 3 },
    { date: tomorrow, startTime: '20:00', partySize: 4, table: 'T04', status: 'confirmee' as const, c: 4 },
    { date: tomorrow, startTime: '21:30', partySize: 8, table: 'V02', status: 'confirmee' as const, c: 5 },
  ]
  const byCode = new Map(tables.map((t) => [t.code, t.id]))
  const created = []
  for (const r of res) {
    const c = r.c === undefined ? undefined : customers[r.c]
    created.push(
      await p.create({
        collection: 'reservations',
        data: {
          date: r.date,
          startTime: r.startTime,
          durationMin: 120,
          partySize: r.partySize,
          name: c ? `${c.firstName} (démo)` : 'Client de passage (démo)',
          phone: c?.phone ?? demoPhone(42),
          tables: [byCode.get(r.table)!],
          customer: c?.id,
          status: r.status,
          source: r.c === undefined ? 'telephone' : 'web',
        },
        context: quiet,
      }),
    )
  }
  // historique de réservations passées pour le tableau de bord
  for (let d = 1; d <= 14; d++) {
    await p.create({
      collection: 'reservations',
      data: {
        date: addDays(today, -d),
        startTime: pick(['19:00', '20:00', '20:30', '21:00', '22:00']),
        durationMin: 120,
        partySize: 2 + randomInt(5),
        name: 'Réservation passée (démo)',
        phone: demoPhone(50 + d),
        tables: [pick(tables).id],
        status: d % 6 === 0 ? 'no_show' : 'terminee',
        source: 'web',
      },
      context: quiet,
    })
  }
  log(`${res.length} réservations ce soir et demain, 14 passées.`)
  return created
}

async function seedLiveOrders(p: Payload, tables: { id: number; code: string }[], reservations: { id: number; startsAt?: string | null; name: string; phone: string }[]) {
  const { docs: products } = await p.find({ collection: 'menu-items', limit: 200, depth: 0, pagination: false })
  const t = new Map(products.map((d) => [d.title, d]))
  const line = (title: string, qty = 1, options?: string) => {
    const prod = t.get(title)!
    return { menuItem: prod.id, title: prod.title, qty, unitPrice: prod.price, options }
  }
  const byCode = new Map(tables.map((x) => [x.code, x.id]))
  const today = todayParis()
  const orders = [
    { type: 'table' as const, status: 'recue' as const, table: 'T05', items: [line('Burger mix', 2), line('Soft', 2, 'Coca-Cola'), line('Fondant au chocolat')], note: 'Un burger sans cheddar' },
    { type: 'table' as const, status: 'recue' as const, table: 'T07', items: [line('Ocean Blue'), line('Virgin mojito', 1, 'Fraise')] },
    { type: 'table' as const, status: 'en_preparation' as const, table: 'T09', items: [line('Pâtes carbonara'), line('Thé à la menthe', 2)] },
    { type: 'table' as const, status: 'en_preparation' as const, table: 'E01', items: [line('Milkshake à composer', 1, 'Base vanille, Oreo'), line('Crêpe sucrée', 1, 'Nutella')] },
  ]
  let n = 1
  for (const o of orders) {
    await p.create({
      collection: 'orders',
      data: { number: n++, type: o.type, serviceDate: today, status: o.status, table: byCode.get(o.table), items: o.items, note: o.note, paymentMethod: 'caisse', paymentStatus: 'a_regler' },
    })
  }
  // précommande liée à la résa de 20:30, payée en ligne
  const vip = reservations[2]
  await p.create({
    collection: 'orders',
    data: {
      number: n++,
      type: 'precommande',
      serviceDate: today,
      status: 'programmee',
      reservation: vip.id,
      scheduledFor: vip.startsAt ?? undefined,
      contactName: vip.name,
      contactPhone: vip.phone,
      items: [line('Grande théière (4 personnes)'), line('Nems poulet x5', 2), line('Samoussas x5', 2)],
      paymentMethod: 'en_ligne',
      paymentStatus: 'payee',
      paymentProvider: 'demo',
      paidAt: new Date().toISOString(),
    },
  })
  // commande à emporter à retirer dans 1 h
  await p.create({
    collection: 'orders',
    data: {
      number: n++,
      type: 'emporter',
      serviceDate: today,
      status: 'programmee',
      scheduledFor: new Date(Date.now() + 3600_000).toISOString(),
      contactName: 'Yanis (démo)',
      contactPhone: demoPhone(1),
      items: [line('Burger 300 g'), line('Chicken burger'), line('Tiramisu', 2)],
      paymentMethod: 'caisse',
      paymentStatus: 'a_regler',
    },
  })
  log('Commandes en cours pour l’écran bar (dont une précommande et une à emporter).')
}

async function seedPrivatizations() {
  const reqs = [
    { name: 'Amina (démo)', phone: demoPhone(60), email: 'amina@exemple.test', date: addDays(todayParis(), 18), guests: 25, occasion: 'Anniversaire 30 ans', message: 'Espace VIP si possible, gâteau apporté par nos soins.', status: 'nouvelle' as const },
    { name: 'Société Exemple (démo)', phone: demoPhone(61), email: 'rh@exemple.test', date: addDays(todayParis(), 30), guests: 40, occasion: 'Afterwork d’entreprise', status: 'en_discussion' as const },
  ]
  for (const r of reqs) await payload.create({ collection: 'privatization-requests', data: r, context: quiet })
  log(`${reqs.length} demandes de privatisation.`)
}

// ---------------------------------------------------------------- exécution
await seedStaff()
await seedSettings()

const menuCount = await payload.count({ collection: 'menu-categories' })
if (menuCount.totalDocs === 0) {
  await seedHomepage()
  await seedMenu()
  const tables = await seedTables()
  await seedRewards()
  await seedEvents()
  const customers = await seedCustomers()
  await seedHistory(payload, tables, customers)
  const reservations = await seedTonight(payload, tables, customers)
  await seedLiveOrders(payload, tables, reservations)
  await seedPrivatizations()
  log('Données de démonstration prêtes.')
} else {
  log('La carte existe déjà : contenus de démo non réinsérés.')
}

process.exit(0)
