// ════════════════════════════════════════════════
// COOP TAFERNOUT — Sync Manager
// Handles offline queue and automatic synchronization
// ════════════════════════════════════════════════

class SyncManager {
  constructor(database, authService) {
    this.database = database;
    this.authService = authService;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.init();
  }

  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Periodic sync check (every 5 minutes when online)
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.processQueue();
      }
    }, 5 * 60 * 1000);
  }

  async addToQueue(operation, data) {
    // Store in local database
    this.database.addToSyncQueue(operation, data);

    // Try immediate sync if online
    if (this.isOnline) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (!this.isOnline || this.syncInProgress || !this.authService.isAuthenticated()) {
      return;
    }

    this.syncInProgress = true;

    try {
      const queue = this.database.getSyncQueue();

      for (const item of queue) {
        try {
          await this.syncOperation(item);
          this.database.markSynced(item.id);
        } catch (error) {
          console.error('Sync failed for operation:', item.operation, error);

          // Increment retry count
          const stmt = this.database.db.prepare('UPDATE sync_queue SET retries = retries + 1 WHERE id = ?');
          stmt.run(item.id);

          // Remove after 3 failed attempts
          if (item.retries >= 3) {
            const deleteStmt = this.database.db.prepare('DELETE FROM sync_queue WHERE id = ?');
            deleteStmt.run(item.id);
          }
        }
      }
    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncOperation(item) {
    const response = await fetch(`${process.env.BACKEND_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authService.getSessionToken()}`
      },
      body: JSON.stringify({
        operation: item.operation,
        data: JSON.parse(item.data),
        timestamp: item.timestamp
      })
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    return response.json();
  }

  // Sync specific data types
  async syncData(dataType, data) {
    if (!this.isOnline) {
      this.addToQueue(`sync_${dataType}`, data);
      return;
    }

    try {
      const response = await fetch(`${process.env.BACKEND_URL}/sync/${dataType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authService.getSessionToken()}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Fallback to queue
      this.addToQueue(`sync_${dataType}`, data);
      throw error;
    }
  }

  // Pull latest data from server
  async pullData() {
    if (!this.isOnline || !this.authService.isAuthenticated()) {
      return;
    }

    try {
      const response = await fetch(`${process.env.BACKEND_URL}/sync/pull`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authService.getSessionToken()}`
        }
      });

      if (response.ok) {
        const serverData = await response.json();

        // Merge with local data
        for (const [key, value] of Object.entries(serverData)) {
          this.database.setData(key, value);
        }

        return serverData;
      }
    } catch (error) {
      console.error('Pull sync failed:', error);
    }
  }

  // Force sync now
  async forceSync() {
    if (!this.isOnline) {
      throw new Error('No internet connection');
    }

    await this.pullData();
    await this.processQueue();
  }

  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      queueLength: this.database.getSyncQueue().length
    };
  }
}

module.exports = SyncManager;