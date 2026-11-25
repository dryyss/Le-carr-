/**
 * Carte réelle du Carré (d'après le PDF fourni), prix en centimes.
 * Loi Evin : les pages chicha du PDF ne sont volontairement PAS reprises.
 */
export type SeedItem = {
  title: string
  price: number
  description?: string
  tags?: ('nouveau' | 'signature' | 'sans_alcool' | 'vegetarien' | 'alcool')[]
  options?: { name: string; supplement?: number }[]
}

export type SeedCategory = { title: string; slug: string; note?: string; items: SeedItem[] }

const BOISSON_COMPRISE = 'Servis avec une boisson comprise.'

export const MENU: SeedCategory[] = [
  {
    title: 'Starters',
    slug: 'starters',
    items: [
      { title: 'Nems poulet x5', price: 600 },
      { title: 'Sticks mozza x5', price: 500, tags: ['vegetarien'] },
      { title: 'Tempura crevettes', price: 700 },
      { title: 'Samoussas x5', price: 600 },
    ],
  },
  {
    title: 'Pâtes',
    slug: 'pates',
    note: BOISSON_COMPRISE,
    items: [
      {
        title: 'Pâtes carbonara',
        price: 1100,
        description: 'Crème onctueuse, lardons fumés, jaune d’œuf et parmesan fondant. Un grand classique réconfortant.',
      },
      {
        title: 'Pâtes forestière',
        price: 1200,
        description: 'Poulet tendre et champignons frais, nappés de crème parfumée et de parmesan.',
      },
      { title: 'Pâtes bolognaise', price: 1100 },
    ],
  },
  {
    title: 'Burgers',
    slug: 'burgers',
    note: BOISSON_COMPRISE,
    items: [
      { title: 'Burger 300 g', price: 1350, description: '2 steaks hachés de 150 g, cheddar.' },
      { title: 'Burger steak', price: 1200, description: 'Steak haché 150 g, cheddar.' },
      { title: 'Chicken burger', price: 1200, description: 'Escalope de poulet panée 120 g.' },
      { title: 'Burger fish', price: 1200, description: 'Poisson pané, sauce fish.' },
      { title: 'Burger mix', price: 1450, description: 'Steak haché 150 g et escalope de poulet 120 g.', tags: ['signature'] },
    ],
  },
  {
    title: 'Plats',
    slug: 'plats',
    note: BOISSON_COMPRISE,
    items: [
      {
        title: 'Escalope forestière',
        price: 1450,
        description: 'Sauce crème de champignons et aux 3 poivres, servie avec du riz blanc.',
        tags: ['signature'],
      },
      { title: 'Fish and chips', price: 1100, description: 'Filet de cabillaud pané, sauce tartare et frites maison.' },
      {
        title: 'Steak à cheval',
        price: 1350,
        description: 'Steak haché 150 g, bacon de bœuf grillé, œuf, sauce poivre, cheddar poivré.',
        tags: ['signature'],
      },
    ],
  },
  {
    title: 'Salades',
    slug: 'salades',
    note: 'Servies avec une boisson comprise, sauf mention contraire.',
    items: [
      { title: 'Salade César', price: 1150 },
      { title: 'Salade burrata', price: 1300, tags: ['vegetarien'] },
      { title: 'Burrata et cerises', price: 700, description: 'Sans boisson.', tags: ['vegetarien'] },
    ],
  },
  {
    title: 'Mocktails',
    slug: 'mocktails',
    note: 'Cocktails sans alcool.',
    items: [
      {
        title: 'Virgin mojito',
        price: 700,
        description: 'Eau pétillante, citron vert pressé, menthe fraîche et sucre.',
        tags: ['sans_alcool'],
        options: [{ name: 'Classique' }, { name: 'Fraise' }, { name: 'Passion' }],
      },
      {
        title: 'Ocean Blue',
        price: 850,
        description: 'Jus d’ananas crémeux aux saveurs mangue, noix de coco, gingembre, citron et orange.',
        tags: ['sans_alcool', 'signature'],
      },
      {
        title: 'Amazonia',
        price: 850,
        description: 'Jus d’orange et d’ananas, saveurs mangue, fruit de la passion, banane et kiwi.',
        tags: ['sans_alcool'],
      },
      {
        title: 'Bahamas Sun',
        price: 850,
        description: 'Jus d’orange aux parfums mangue, passion, kiwi et pêche blanche.',
        tags: ['sans_alcool'],
      },
      {
        title: 'Ipanema',
        price: 850,
        description: 'Émulsion de jus d’ananas aux saveurs framboise, fraise et cassis.',
        tags: ['sans_alcool', 'nouveau'],
      },
    ],
  },
  {
    title: 'Cocktails',
    slug: 'cocktails',
    note: 'Avec alcool. Servis aux majeurs uniquement.',
    items: [
      { title: 'Sex on the beach', price: 1100, tags: ['alcool'] },
      { title: 'Mojito', price: 1000, tags: ['alcool'], options: [{ name: 'Classique' }, { name: 'Fraise' }] },
      { title: 'Piña colada', price: 1100, tags: ['alcool'] },
      { title: 'Vodka Red Bull', price: 950, tags: ['alcool'] },
      { title: 'Jack Coca', price: 950, tags: ['alcool'] },
    ],
  },
  {
    title: 'Boissons',
    slug: 'boissons',
    items: [
      {
        title: 'Soft',
        price: 500,
        description: 'Au choix.',
        tags: ['sans_alcool'],
        options: [
          'Coca-Cola',
          'Coca-Cola zéro',
          'Coca-Cola cherry',
          'Oasis tropical',
          'Ice tea',
          '7up',
          'Oasis pomme cassis framboise',
          'Oasis fraise framboise',
          'Orangina',
          'Hawaï',
          'Perrier',
        ].map((name) => ({ name })),
      },
      { title: 'Thé à la menthe', price: 500, tags: ['sans_alcool'] },
      { title: 'Petite théière (2 personnes)', price: 800, tags: ['sans_alcool'] },
      { title: 'Grande théière (4 personnes)', price: 1000, tags: ['sans_alcool'] },
      { title: 'Red Bull', price: 800, tags: ['sans_alcool'] },
      { title: 'Heineken', price: 1000, tags: ['alcool'] },
    ],
  },
  {
    title: 'Milkshakes',
    slug: 'milkshakes',
    items: [
      {
        title: 'Milkshake',
        price: 600,
        tags: ['sans_alcool'],
        options: [{ name: 'Vanille' }, { name: 'Fraise' }, { name: 'Chocolat' }, { name: 'Banane' }],
      },
      {
        title: 'Milkshake à composer',
        price: 750,
        description: 'Une base au choix et votre gourmandise. 2e ingrédient : +2 €.',
        tags: ['sans_alcool', 'signature'],
        options: [
          { name: 'Base vanille' },
          { name: 'Base fraise' },
          { name: 'Base chocolat' },
          { name: 'Base banane' },
          { name: 'Kinder Bueno' },
          { name: 'Bueno White' },
          { name: 'M&M’s' },
          { name: 'Spéculoos' },
          { name: 'Nutella' },
          { name: 'Oreo' },
          { name: '2e ingrédient', supplement: 200 },
        ],
      },
    ],
  },
  {
    title: 'Desserts',
    slug: 'desserts',
    items: [
      {
        title: 'Fondant au chocolat',
        price: 500,
        description: 'Crème anglaise, glace vanille et chantilly.',
        tags: ['signature', 'vegetarien'],
      },
      {
        title: 'Crêpe sucrée',
        price: 700,
        tags: ['vegetarien'],
        options: [{ name: 'Nutella' }, { name: 'Pistache' }, { name: 'Spéculoos' }, { name: 'Bueno White' }, { name: 'Nutella banane' }],
      },
      { title: 'Gaufre', price: 700, tags: ['vegetarien'], options: [{ name: 'Nutella' }, { name: 'Pistache' }] },
      { title: 'Tiramisu', price: 500, tags: ['vegetarien'] },
      { title: 'Tarte au daim', price: 500, tags: ['vegetarien'] },
    ],
  },
]
