// ════════════════════════════════════════════════
// COOP TAFERNOUT — Données initiales de l'application
// Modifiez ce fichier pour personnaliser les données par défaut.
//
// Structure des données :
// - appSettings : paramètres généraux de l'application
// - users : utilisateurs de l'application et permissions
// - products : catalogue des produits vendus
// - clients : liste de clients et créances
// - sales : factures / ventes enregistrées
// - charges : charges et pertes comptables
// - employees : personnel et salaire journalier
// - rawMaterials : stock des matières premières
// - stockMovements : historique des entrées/sorties de stock
// - commandes : commandes clients avant facturation
//
// Les données sont stockées en JSON et mises à jour via Electron + localStorage.
// ════════════════════════════════════════════════

const PIMGS = {
  'Mille-feuille':    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=200&fit=crop',
  'Tarte Citron':     'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=300&h=200&fit=crop',
  'Éclair Chocolat':  'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop',
  'Paris-Brest':      'https://images.unsplash.com/photo-1609803384069-19f3f5524f40?w=300&h=200&fit=crop',
  'Macaron Assortis': 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=300&h=200&fit=crop',
  'Baklava':          'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=300&h=200&fit=crop',
  'Chebakia':         'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop',
  'Sellou':           'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=300&h=200&fit=crop',
  'Cornes Gazelle':   'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop',
  'Brioche Dorée':    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=200&fit=crop',
  'Croissant':        'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop',
  'Entremet Rose':    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=200&fit=crop',
};

const DIMG = 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=200&fit=crop';

const getPImg = p => (p.image && p.image.length > 10) ? p.image : (PIMGS[p.name] || DIMG);

const EICONS = {
  dashboard: '📊', pos: '🛒', products: '🎂', clients: '👥',
  stock: '📦', charges: '💸', invoices: '🧾', personnel: '👤',
  commandes: '📋', users: '🔑', parametres: '⚙️'
};

const POSTES = [
  'Pâtissier chef','Vendeuse','Apprentie','Livreur',
  'Gérant','Comptable','Responsable Stock','Caissier','Autre'
];

const STATUTS = ['en_cours', 'confirmée', 'livrée', 'annulée'];

// ── Données initiales ──
const INIT = {
  appSettings: { logo: '', theme: '', name: 'Coop Tafernout ERP' },

  users: [
    {
      id: 1, name: 'Administrateur', username: 'admin', password: 'admin123', role: 'Administrateur',
      permissions: { dashboard:true, pos:true, products:true, clients:true, stock:true, charges:true, invoices:true, personnel:true, commandes:true, users:true, parametres:true }
    }
  ],

  products: [],
  clients: [],
  sales: [],
  charges: [],
  employees: [],
  rawMaterials: [],
  stockMovements: [],
  commandes: [],
};
