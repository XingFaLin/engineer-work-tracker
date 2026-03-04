const { contextBridge, ipcRenderer } = require('electron');

// expose safe API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // save work item
    saveWorkItem: (workItem) => ipcRenderer.invoke('save-work-item', workItem),
    
    // update work item
    updateWorkItem: (workItemId, updatedData) => ipcRenderer.invoke('update-work-item', workItemId, updatedData),
    
    // delete work item
    deleteWorkItem: (workItemId) => ipcRenderer.invoke('delete-work-item', workItemId),
    
    // get work items
    getWorkItems: (filters) => ipcRenderer.invoke('get-work-items', filters),
    
    // generate report
    generateReport: (type, params) => ipcRenderer.invoke('generate-report', type, params),
    
    // get statistics
    getStatistics: (period) => ipcRenderer.invoke('get-statistics', period),
});