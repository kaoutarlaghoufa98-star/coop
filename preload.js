const { contextBridge, ipcRenderer } = require('electron');

// Secure IPC channels whitelist
const allowedChannels = [
  'data:load',
  'data:save',
  'run-python',
  'open-file',
  'activate-license',
  'check-activation',
  'auth:login',
  'auth:register',
  'auth:logout',
  'auth:check',
  'sync:status',
  'sync:force'
];

// Expose secure API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Generic invoke method with channel validation
  invoke: (channel, data) => {
    if (allowedChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    throw new Error(`Unauthorized IPC channel: ${channel}`);
  },

  // Secure listeners (if needed)
  on: (channel, callback) => {
    if (allowedChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
      // Return cleanup function
      return () => ipcRenderer.removeListener(channel, callback);
    }
    throw new Error(`Unauthorized IPC channel: ${channel}`);
  },

  // Remove listeners
  removeListener: (channel, callback) => {
    if (allowedChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  }
});

// Legacy support (will be removed in future versions)
contextBridge.exposeInMainWorld('electronStore', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.invoke('data:save', data),
});
