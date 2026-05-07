// ════════════════════════════════════════════════
// COOP TAFERNOUT — Fonctions utilitaires
//
// Ces helpers sont partagés par le frontend.
// Ils formatent les montants en dirhams, prennent des arrondis propres
// et génèrent la date du jour conforme au format utilisé dans les données.
// ════════════════════════════════════════════════

// Formatage monétaire MAD
const fmt  = n => (n || 0).toLocaleString('fr-MA', { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' MAD';
const fmtN = n => (n || 0).toLocaleString('fr-MA', { minimumFractionDigits:0, maximumFractionDigits:0 });

// Date du jour au format YYYY-MM-DD
const td = () => new Date().toISOString().split('T')[0];

// Rendre les fonctions disponibles globalement
window.fmt = fmt;
window.fmtN = fmtN;
window.td = td;
