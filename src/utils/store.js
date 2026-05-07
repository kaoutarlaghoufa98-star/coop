// ════════════════════════════════════════════════
// COOP TAFERNOUT — Store global
// Persistance offline : Electron (fichier JSON) + localStorage
//
// Ce hook fournit l'état global des données de l'application.
// Il charge une version initiale depuis localStorage côté client,
// puis essaie de synchroniser avec Electron si l'API est disponible.
// À chaque mise à jour des données, il écrit dans le stockage local
// et dans le backend Electron via window.electronStore.
// ════════════════════════════════════════════════

const { useState, useCallback } = React;

const STORAGE_KEY = 'tafernout_v6';

async function saveData(data) {
  // Electron desktop
  if (window.electronStore) {
    await window.electronStore.save(data);
  }
  // Toujours aussi sauvegarder en localStorage (offline fallback)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch(e) {
    console.warn('localStorage plein :', e);
  }
}

function useStore() {
  const [data, setData] = useState(() => {
    // Init synchrone depuis localStorage
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      const parsed = s ? JSON.parse(s) : null;
      return parsed ? { ...INIT, ...parsed } : { ...INIT };
    } catch {
      return { ...INIT };
    }
  });

  // Charge depuis Electron au montage si disponible
  React.useEffect(() => {
    if (window.electronStore) {
      window.electronStore.load().then(res => {
        if (res && res.ok && res.data) {
          const merged = { ...INIT, ...res.data };
          setData(merged);
          // Sync vers localStorage pour le offline
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
        }
      });
    }
  }, []);

  const update = useCallback((key, val) => {
    setData(prev => {
      const next = { ...prev, [key]: typeof val === 'function' ? val(prev[key]) : val };
      saveData(next);
      return next;
    });
  }, []);

  return [data, update];
}
