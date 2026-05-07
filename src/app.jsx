import React, { useEffect, useState } from 'react';
import AppShell from './components/AppShell.jsx';
import LoginPage from './components/Login.jsx';
import { INIT } from './data/initialData.js';

// ════════════════════════════════════════════════
// COOP TAFERNOUT — Point d'entrée
// Mode hybride : Electron (desktop) + Web (Firebase)
//
// Ce fichier est le point d'entrée du renderer React.
// Il détecte automatiquement si c'est un environnement desktop (Electron)
// ou web, et charge les données en conséquence.
//
// Pour desktop : utilise les APIs Electron sécurisées
// Pour web : utilise Firebase Firestore avec offline persistence
// ════════════════════════════════════════════════

function App() {
  const [appData, setAppData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // Initialize authentication and data loading
    async function init() {
      try {
        // Check if we're in Electron (desktop) or web
        const isDesktop = !!window.electronAPI;

        if (isDesktop) {
          // Desktop: Check authentication status
          const authResult = await window.electronAPI.invoke('auth:check');
          setIsAuthenticated(authResult.authenticated);

          // Load data from secure database
          const dataResult = await window.electronAPI.invoke('data:load');
          if (dataResult && dataResult.ok) {
            const loaded = dataResult.data;
            const merged = {
              ...INIT,
              ...(loaded || {}),
              sales: (loaded?.sales) || INIT.sales,
              charges: (loaded?.charges) || INIT.charges,
              clients: (loaded?.clients) || INIT.clients,
              products: (loaded?.products) || INIT.products,
              employees: (loaded?.employees) || INIT.employees,
              users: (loaded?.users) || INIT.users,
              commandes: (loaded?.commandes) || INIT.commandes,
              rawMaterials: (loaded?.rawMaterials) || INIT.rawMaterials,
              stockMovements: (loaded?.stockMovements) || INIT.stockMovements,
              appSettings: (loaded?.appSettings) || INIT.appSettings,
            };
            setAppData(merged);
          }
        } else {
          // Web: Initialize Firebase and load data
          const { WebDataService } = await import('./services/webFirebase.js');
          const webDataService = new WebDataService();

          try {
            const loaded = await webDataService.loadData();
            const merged = {
              ...INIT,
              ...(loaded || {}),
              sales: (loaded?.sales) || INIT.sales,
              charges: (loaded?.charges) || INIT.charges,
              clients: (loaded?.clients) || INIT.clients,
              products: (loaded?.products) || INIT.products,
              employees: (loaded?.employees) || INIT.employees,
              users: (loaded?.users) || INIT.users,
              commandes: (loaded?.commandes) || INIT.commandes,
              rawMaterials: (loaded?.rawMaterials) || INIT.rawMaterials,
              stockMovements: (loaded?.stockMovements) || INIT.stockMovements,
              appSettings: (loaded?.appSettings) || INIT.appSettings,
            };
            setAppData(merged);
            setIsAuthenticated(true); // Web version assumes authenticated for now

            // Set up real-time sync
            webDataService.subscribeToData((newData) => {
              const merged = {
                ...INIT,
                ...newData,
                sales: newData.sales || INIT.sales,
                charges: newData.charges || INIT.charges,
                clients: newData.clients || INIT.clients,
                products: newData.products || INIT.products,
                employees: newData.employees || INIT.employees,
                users: newData.users || INIT.users,
                commandes: newData.commandes || INIT.commandes,
                rawMaterials: newData.rawMaterials || INIT.rawMaterials,
                stockMovements: newData.stockMovements || INIT.stockMovements,
                appSettings: newData.appSettings || INIT.appSettings,
              };
              setAppData(merged);
            });
          } catch (error) {
            console.error('Web data loading error:', error);
            setAppData(INIT);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('App initialization error:', error);
        setAppData(INIT);
        setIsAuthenticated(true); // Fallback
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  // Save data when appData changes (web version)
  React.useEffect(() => {
    if (appData && !isLoading) {
      const isDesktop = !!window.electronAPI;
      if (!isDesktop) {
        // Web version: save to Firebase and localStorage
        const saveWebData = async () => {
          try {
            const { WebDataService } = await import('./services/webFirebase.js');
            const webDataService = new WebDataService();
            await webDataService.saveData(appData);
          } catch (error) {
            console.error('Web data save error:', error);
          }
        };
        saveWebData();
      }
    }
  }, [appData, isLoading]);

  if (isLoading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
                    background:'linear-gradient(135deg,#2C1810,#5C3317)', flexDirection:'column', gap:16 }}>
        <div style={{ fontSize:56 }}>🥐</div>
        <div style={{ color:'#E8BF9A', fontFamily:'Georgia,serif', fontSize:'1.2rem', letterSpacing:2 }}>
          COOP TAFERNOUT
        </div>
        <div style={{ color:'#C9952A', fontSize:'0.9rem' }}>
          Chargement de l'application...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Show login screen for desktop, or assume authenticated for web
    const isDesktop = !!window.electronAPI;
    if (isDesktop) {
      return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
    }
  }

  if (!appData) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
                    background:'linear-gradient(135deg,#2C1810,#5C3317)', flexDirection:'column', gap:16 }}>
        <div style={{ fontSize:56 }}>🥐</div>
        <div style={{ color:'#E8BF9A', fontFamily:'Georgia,serif', fontSize:'1.2rem', letterSpacing:2 }}>
          COOP TAFERNOUT
        </div>
        <div style={{ color:'#C9952A', fontSize:'0.9rem' }}>
          Chargement des données...
        </div>
      </div>
    );
  }

  // Main application shell
  return <AppShell data={appData} setData={setAppData} />;
}

export default App;
