// Data management module
function initData() {
    console.log('Initialize data management');
    initDataEventListeners();
    loadDataManagement();
}

function initDataEventListeners() {
    // Export data button event
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    // Import data button event
    const importBtn = document.getElementById('importDataBtn');
    if (importBtn) {
        importBtn.addEventListener('click', importData);
    }
    
    // Clear data button event
    const clearBtn = document.getElementById('clearDataBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearData);
    }
}

async function loadDataManagement() {
    try {
        let workItems = [];
        if (window.electronAPI) {
            workItems = await window.electronAPI.getWorkItems();
        } else {
            workItems = await app.mockGetWorkItems();
        }
        
        displayDataStats(workItems);
        displayAllWorkItems(workItems);
        displayProjectManagement(workItems);
        
    } catch (error) {
        console.error('Failed to load data management:', error);
        app.showAlert(window.i18n.t('error.loadDataManagement'), 'error');
    }
}

function displayDataStats(workItems) {
    const statsContainer = document.getElementById('dataStats');
    if (!statsContainer) return;
    
    const totalItems = workItems.length;
    const totalProjects = new Set(workItems.map(item => item.project)).size;
    const totalTechnologies = new Set(workItems.map(item => item.technology)).size;
    const totalDays = new Set(workItems.map(item => item.date)).size;
    
    // Get R&D Estimation stats
    const estimationData = localStorage.getItem('rd_estimation_manager');
    const estimation = estimationData ? JSON.parse(estimationData) : { projects: [], tasks: [], boms: [], labor: [] };
    const estProjects = estimation.projects.length;
    const estTasks = estimation.tasks.length;
    const estLabor = estimation.labor.length;
    
    statsContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                <div style="font-size: 1.5em; font-weight: bold;">${totalItems}</div>
                <div>${window.i18n.t('data.totalWorkItems')}</div>
            </div>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                <div style="font-size: 1.5em; font-weight: bold;">${totalProjects}</div>
                <div>${window.i18n.t('data.totalProjects')}</div>
            </div>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                <div style="font-size: 1.5em; font-weight: bold;">${totalTechnologies}</div>
                <div>${window.i18n.t('data.totalTechnologies')}</div>
            </div>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                <div style="font-size: 1.5em; font-weight: bold;">${totalDays}</div>
                <div>${window.i18n.t('data.totalWorkDays')}</div>
            </div>
            <div style="background: #e7f1ff; padding: 10px; border-radius: 5px;">
                <div style="font-size: 1.5em; font-weight: bold;">${estProjects}</div>
                <div>${window.i18n.t('data.estimationProjects') || '评估项目'}</div>
            </div>
            <div style="background: #e7f1ff; padding: 10px; border-radius: 5px;">
                <div style="font-size: 1.5em; font-weight: bold;">${estTasks + estLabor}</div>
                <div>${window.i18n.t('data.estimationTasks') || '评估任务/人力'}</div>
            </div>
        </div>
    `;
}


async function exportData() {
    try {
        let data;
        if (window.electronAPI) {
            // Use Electron API for export
            data = await window.electronAPI.exportData();
        } else {
            // Browser environment: get data from localStorage
            const workItems = await app.mockGetWorkItems();
            
            // Get R&D Estimation data
            const estimationData = localStorage.getItem('rd_estimation_manager');
            const estimation = estimationData ? JSON.parse(estimationData) : { projects: [], tasks: [], boms: [], labor: [] };
            
            data = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                workItems: workItems,
                estimation: estimation
            };
        }
        
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `work-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        app.showAlert(window.i18n.t('msg.exportSuccess'), 'success');
    } catch (error) {
        console.error('Export data failed:', error);
        app.showAlert(`${window.i18n.t('error.exportFailed')}: ${error.message}`, 'error');
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            let success = false;
            if (window.electronAPI) {
                // Electron environment: use importData API
                const workItems = data.workItems || data;
                success = await window.electronAPI.importData(workItems);
                
                // Import R&D Estimation data if exists
                if (data.estimation) {
                    localStorage.setItem('rd_estimation_manager', JSON.stringify(data.estimation));
                }
                
                if (success) {
                    app.showAlert(window.i18n.t('msg.importSuccess'), 'success');
                    loadDataManagement();
                }
            } else {
                // Browser environment: save to localStorage
                const workItems = data.workItems || data;
                localStorage.setItem('workData', JSON.stringify(workItems));
                
                // Import R&D Estimation data if exists
                if (data.estimation) {
                    localStorage.setItem('rd_estimation_manager', JSON.stringify(data.estimation));
                    app.showAlert(window.i18n.t('msg.importSuccess') + ' ' + window.i18n.t('msg.importEstimationSuccess'), 'success');
                } else {
                    app.showAlert(window.i18n.t('msg.importSuccess'), 'success');
                }
                
                loadDataManagement();
            }
        } catch (error) {
            console.error('Import data failed:', error);
            app.showAlert(window.i18n.t('error.importFailed'), 'error');
        }
    };
    
    input.click();
}

async function clearData() {
    if (confirm(window.i18n.t('msg.clearConfirm'))) {
        if (confirm(window.i18n.t('msg.clearConfirmAgain'))) {
            try {
                // Get all items and delete them one by one
                if (window.electronAPI) {
                    const allItems = await window.electronAPI.getWorkItems();
                    for (const item of allItems) {
                        await window.electronAPI.deleteWorkItem(item.id);
                    }
                    // Also clear R&D Estimation data
                    localStorage.removeItem('rd_estimation_manager');
                    app.showAlert(window.i18n.t('msg.clearSuccess'), 'success');
                    loadDataManagement();
                } else {
                    localStorage.removeItem('workData');
                    // Also clear R&D Estimation data
                    localStorage.removeItem('rd_estimation_manager');
                    app.showAlert(window.i18n.t('msg.clearSuccess'), 'success');
                    loadDataManagement();
                }
            } catch (error) {
                app.showAlert(`${window.i18n.t('error.clearFailed')}: ${error.message}`, 'error');
            }
        }
    }
}

function editProject(projectName) {
    app.switchTab('record');
    setTimeout(() => {
        const projectInput = document.getElementById('project');
        if (projectInput) {
            projectInput.value = projectName;
            loadProjectInfo(projectName);
        }
    }, 100);
}

async function loadProjectInfo(projectName) {
    try {
        let projectItems = [];
        if (window.electronAPI) {
            projectItems = await window.electronAPI.getWorkItems({ project: projectName });
        } else {
            projectItems = await app.mockGetWorkItems({ project: projectName });
        }
        
        if (projectItems.length > 0) {
            const latestItem = projectItems[0];
            const technologyInput = document.getElementById('technology');
            const progressInput = document.getElementById('projectProgress');
            const progressSlider = document.getElementById('progressSlider');
            const progressValue = document.getElementById('progressValue');
            const tagsInput = document.getElementById('tags');
            
            if (technologyInput) technologyInput.value = latestItem.technology || '';
            if (progressInput) progressInput.value = latestItem.projectProgress || 0;
            if (progressSlider) progressSlider.value = latestItem.projectProgress || 0;
            if (progressValue) progressValue.textContent = (latestItem.projectProgress || 0) + '%';
            if (tagsInput) tagsInput.value = latestItem.tags ? latestItem.tags.join(', ') : '';
        }
    } catch (error) {        
        app.showAlert(`${window.i18n.t('error.loadProjectInfo')}: ${error.message}`, 'error');
    }
}

async function editWorkItem(itemId) {
    try {
        let allItems = [];
        if (window.electronAPI) {
            allItems = await window.electronAPI.getWorkItems();
        } else {
            allItems = await app.mockGetWorkItems();
        }
        
        const item = allItems.find(i => i.id === itemId);
        if (!item) {
            app.showAlert(window.i18n.t('error.workItemNotFound'), 'error');
        return;
    }
    
    // Jump to record page and fill data
    app.switchTab('record');
    setTimeout(() => {
        // Set work plan mode
        if (item.isPlan) {
            document.getElementById('planWorkBtn').click();
        } else {
            document.getElementById('todayWorkBtn').click();
        }
        
        // Fill form data
        document.getElementById('project').value = item.project;
        document.getElementById('technology').value = item.technology || '';
        document.getElementById('workContent').value = item.achievement || '';
        document.getElementById('difficulty').value = item.difficulty || '';
        document.getElementById('projectProgress').value = item.projectProgress || 0;
        document.getElementById('progressSlider').value = item.projectProgress || 0;
        document.getElementById('progressValue').textContent = (item.projectProgress || 0) + '%';
        document.getElementById('tags').value = item.tags ? item.tags.join(', ') : '';
        
        if (item.isPlan) {
            document.getElementById('workDate').value = item.date;
        }
        
        // Set edit mode
        window.editingItemId = itemId;
        
        app.showAlert(window.i18n.t('msg.editLoaded'), 'success');
    }, 100);
    
} catch (error) {
    console.error('Edit work item failed:', error);
    app.showAlert(`${window.i18n.t('error.editFailed')}: ${error.message}`, 'error');
}
}

// Delete work item
async function deleteWorkItem(itemId) {
    if (confirm(window.i18n.t('msg.deleteConfirm'))) {
        try {
            let success = false;
            
            if (window.electronAPI) {
                // Electron environment: use deleteWorkItem API
                success = await window.electronAPI.deleteWorkItem(itemId);
            } else {
                // Browser environment: get data from localStorage, delete specified item
                let allItems = await app.mockGetWorkItems();
                const filteredItems = allItems.filter(item => item.id !== itemId);
                localStorage.setItem('workData', JSON.stringify(filteredItems));
                success = true;
            }
            
            if (success) {
                app.showAlert(window.i18n.t('msg.deleteSuccess'), 'success');
                loadDataManagement();
            } else {
                app.showAlert(window.i18n.t('error.deleteFailed'), 'error');
            }
            
        } catch (error) {
            console.error('Delete work item failed:', error);
            app.showAlert(`${window.i18n.t('error.deleteFailed')}: ${error.message}`, 'error');
        }
    }
}

function displayProjectManagement(workItems) {
    const projectContainer = document.getElementById('projectManagement');
    if (!projectContainer) return;
    
    // Group work items by project (show only non-plan tasks and completed plans)
    const projects = {};
    workItems.forEach(item => {
        if (!item.isPlan || item.planStatus === 'completed') {
            if (!projects[item.project]) {
                projects[item.project] = [];
            }
            projects[item.project].push(item);
        }
    });
    
    projectContainer.innerHTML = Object.entries(projects).map(([projectName, items]) => {
        // Sort items by date descending (newest first)
        const sortedItems = [...items].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        });
        
        const latestItem = sortedItems[0];
        const progress = latestItem.projectProgress || 0;
        const itemCount = items.length;
        
        // Display full time information (year-month-day hour:minute)
        const lastUpdateTime = formatDateTime(latestItem.date);
        
        return `
            <div class="work-item">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div class="project">${projectName}</div>
                        <div style="margin-top: 5px;">
                            <span class="technology">${latestItem.technology || window.i18n.t('common.notFilled')}</span>
                        <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 5px;">
                            ${window.i18n.t('progress')}: ${progress}%
                        </span>
                        <span style="background: #6c757d; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 5px;">
                            ${window.i18n.t('data.records')}: ${itemCount}
                        </span>
                    </div>
                    <div style="margin-top: 5px; font-size: 12px; color: #666;">
                        ${window.i18n.t('data.lastUpdate')}: ${lastUpdateTime}
                    </div>
                </div>
                <div style="display: flex; gap: 5px; flex-direction: column;">
                    <button onclick="showProjectDetails('${projectName}')" class="btn" style="background: #6f42c1; color: white; padding: 5px 10px; font-size: 12px;">${window.i18n.t('data.details')}</button>
                    <button onclick="editProject('${projectName}')" class="btn" style="background: #17a2b8; color: white; padding: 5px 10px; font-size: 12px;">${window.i18n.t('edit')}</button>
                    <button onclick="deleteProject('${projectName}')" class="btn" style="background: #dc3545; color: white; padding: 5px 10px; font-size: 12px;">${window.i18n.t('delete')}</button>
                </div>
                </div>
            </div>
        `;
    }).join('');

    // Add a plan work hint
    const planItems = workItems.filter(item => item.isPlan);
    if (planItems.length > 0) {
        const planHint = document.createElement('div');
        planHint.style.cssText = 'background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin-top: 10px;';
        planHint.innerHTML = `💡 ${window.i18n.t('data.planHint')}: ${planItems.length} ${window.i18n.t('data.planTasks')}, ${window.i18n.t('data.planHint2')}`;
        projectContainer.appendChild(planHint);
    }
}

// Display all work items (non-plan tasks and completed plans)
function displayAllWorkItems(workItems) {
    const workListContainer = document.getElementById('allWorkList');
    if (!workListContainer) return;
    
    // Filter out non-plan tasks and completed plans
    const displayItems = workItems.filter(item => !item.isPlan || item.planStatus === 'completed');
    const sortedItems = [...displayItems].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
    });
    
    workListContainer.innerHTML = sortedItems.map(item => {
        // Display full time information (year-month-day hour:minute)
        const dateTime = formatDateTime(item.date);
        
        // Add plan completion marker
        const planMarker = item.planStatus === 'completed' ? window.i18n.t('data.planCompleted') : 
                          item.isPlan ? window.i18n.t('common.plan') : '';
        
        return `
        <div class="work-item">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div class="project">${item.project}</div>
                    <div class="date">${dateTime} ${planMarker}</div>
                    <div style="margin-top: 5px;">
                        <span class="technology">${item.technology || window.i18n.t('common.notFilled')}</span>
                        <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 5px;">
                            ${window.i18n.t('progress')}: ${item.projectProgress || 0}%
                        </span>
                    </div>
                    <div style="margin-top: 5px; font-size: 14px; color: #666;">
                        ${item.achievement || window.i18n.t('common.noDescription')}
                    </div>
                </div>
                <div style="display: flex; gap: 5px; flex-direction: column;">
                    <button onclick="editWorkItem('${item.id}')" class="btn" style="background: #17a2b8; color: white; padding: 5px 10px; font-size: 12px;">${window.i18n.t('edit')}</button>
                    <button onclick="modifyWorkItem('${item.id}')" class="btn" style="background: #ffc107; color: black; padding: 5px 10px; font-size: 12px;">${window.i18n.t('data.modify')}</button>
                    <button onclick="deleteWorkItem('${item.id}')" class="btn" style="background: #dc3545; color: white; padding: 5px 10px; font-size: 12px;">${window.i18n.t('delete')}</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Display project details (non-plan tasks and completed plans)
async function showProjectDetails(projectName) {
    try {
        let allItems = [];
        if (window.electronAPI) {
            allItems = await window.electronAPI.getWorkItems();
        } else {
            allItems = await app.mockGetWorkItems();
        }
        
        const projectItems = allItems.filter(item => item.project === projectName);
        const sortedItems = [...projectItems].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        });
        
        // Display project details in a modal window
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        
        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>${window.i18n.t('data.projectDetails')}: ${projectName}</h3>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">关闭</button>
            </div>
            <div style="margin-bottom: 15px;">
                <strong>${window.i18n.t('data.totalWorkItems')}:</strong> ${sortedItems.length} ${window.i18n.t('data.items')}
            </div>
            <div>
                ${sortedItems.map((item, index) => `
                    <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                        <div style="display: flex; justify-content: space-between;">
                            <strong>${window.i18n.t('data.record')} ${index + 1}</strong>
                            <span style="color: #666;">${formatDateTime(item.date)}</span>
                        </div>
                        <div style="margin-top: 5px;">
                            <strong>${window.i18n.t('data.technology')}:</strong> ${item.technology || window.i18n.t('data.notFilled')}
                        </div>
                        <div style="margin-top: 5px;">
                            <strong>${window.i18n.t('data.progress')}:</strong> ${item.projectProgress || 0}%
                        </div>
                        <div style="margin-top: 5px;">
                            <strong>${window.i18n.t('data.achievement')}:</strong> ${item.achievement || window.i18n.t('data.noDescription')}
                        </div>
                        ${item.difficulty ? `<div style="margin-top: 5px;"><strong>${window.i18n.t('data.difficulty')}:</strong> ${item.difficulty}</div>` : ''}
                        ${item.tags && item.tags.length > 0 ? `<div style="margin-top: 5px;"><strong>${window.i18n.t('data.tags')}:</strong> ${item.tags.join(', ')}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // close modal when click background
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
    } catch (error) {
        console.error(window.i18n.t('error.showProjectDetails'), error);               
        app.showAlert(window.i18n.t('error.showProjectDetails') + error.message, 'error');
    }
}
// format date time function
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// modify work item function (modify content directly, not jump to page)
async function modifyWorkItem(itemId) {
    try {
        let allItems = [];
        if (window.electronAPI) {
            allItems = await window.electronAPI.getWorkItems();
        } else {
            allItems = await app.mockGetWorkItems();
        }
        
        const item = allItems.find(i => i.id === itemId);
        if (!item) {
            app.showAlert(window.i18n.t('error.workItemNotFound'), 'error');
            return;
        }
        
        //Show a prompt dialog to modify the work item
        const newAchievement = prompt(window.i18n.t('data.newAchievementPrompt'), item.achievement || '');
        if (newAchievement === null) return; 
        
        const newTechnology = prompt(window.i18n.t('data.newTechnologyPrompt'), item.technology || '');
        if (newTechnology === null) return;
        
        const newProgress = prompt(window.i18n.t('data.newProgressPrompt'), item.projectProgress || 0);
        if (newProgress === null) return;
        
        // Update the work item with new values
        const updatedItems = allItems.map(i => {
            if (i.id === itemId) {
                return {
                    ...i,
                    achievement: newAchievement,
                    technology: newTechnology,
                    projectProgress: parseInt(newProgress) || 0
                };
            }
            return i;
        });
        
        // Save the updated data
        if (window.electronAPI) {
            app.showAlert(window.i18n.t('data.modifyInfo'), 'info');
        } else {
            localStorage.setItem('workData', JSON.stringify(updatedItems));
            app.showAlert(window.i18n.t('data.modifySuccess'), 'success');
            loadDataManagement();
        }
        
    } catch (error) {
        console.error(window.i18n.t('error.modifyWorkItem'), error);
        app.showAlert(window.i18n.t('error.modifyWorkItem') + error.message, 'error');
    }
}

// delete project function (delete all records of the project)
async function deleteProject(projectName) {
    if (confirm(window.i18n.t('data.confirmDeleteProject', projectName))) {
        try {
            let allItems = [];
            if (window.electronAPI) {
                allItems = await window.electronAPI.getWorkItems();
            } else {
                allItems = await app.mockGetWorkItems();
            }
            
            const filteredItems = allItems.filter(item => item.project !== projectName);
            
            // Save the updated data
            if (window.electronAPI) {
                // For Electron, we need to delete each item individually
                const itemsToDelete = allItems.filter(item => item.project === projectName);
                for (const item of itemsToDelete) {
                    await window.electronAPI.deleteWorkItem(item.id);
                }
                app.showAlert(window.i18n.t('data.projectDeleted', projectName), 'success');
                loadDataManagement();
            } else {
                localStorage.setItem('workData', JSON.stringify(filteredItems));
                app.showAlert(window.i18n.t('data.projectDeleted', projectName), 'success');
                loadDataManagement();
            }
            
        } catch (error) {
            console.error(window.i18n.t('error.deleteProject'), error);
            app.showAlert(window.i18n.t('error.deleteProject') + error.message, 'error');
        }
    }
}

//export global functions
window.editWorkItem = editWorkItem;
window.deleteWorkItem = deleteWorkItem;
window.deleteProject = deleteProject;
window.modifyWorkItem = modifyWorkItem;
window.showProjectDetails = showProjectDetails;