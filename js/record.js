// Record work module
let currentWorkType = 'today';
let currentPlanFilter = 'pending';
let editingPlanId = null;

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

// format plan date function
function formatPlanDate(dateValue) {
    if (!dateValue) return window.i18n.t('common.notFilled');
    
    // If it's already a string, return it directly
    if (typeof dateValue === 'string') {
        return dateValue;
    }
    
    // If it's a Date object, format it as ISO string
    if (dateValue instanceof Date) {
        return dateValue.toISOString();
    }
    
    // If it's an object, try to extract the date string
    if (typeof dateValue === 'object') {
        // Check if it's an object containing an ISO date string
        if (dateValue.date && typeof dateValue.date === 'string') {
            return dateValue.date; // Return the full ISO string
        }
        
        // Check if the object has a value that looks like an ISO date
        for (let key in dateValue) {
            if (typeof dateValue[key] === 'string' && dateValue[key].includes('T') && dateValue[key].length > 10) {
                return dateValue[key];
            }
        }
        
        // Fallback: convert to string
        return String(dateValue);
    }
    
    // Default fallback
    return String(dateValue);
}

function initRecord() {
    console.log('Initialize record work page');
    initRecordEventListeners();
    updateProgressDisplay();
    setWorkType('today');
}

function initRecordEventListeners() {
    console.log('Initialize event listeners');
    
    // Work type button events
    document.getElementById('todayWorkBtn').addEventListener('click', () => setWorkType('today'));
    document.getElementById('planWorkBtn').addEventListener('click', () => setWorkType('plan'));
    
    // Quick action button events
    document.getElementById('selectProjectBtn').addEventListener('click', showProjectSelector);
    document.getElementById('templateBtn').addEventListener('click', showProjectTemplates);
    document.getElementById('clearFormBtn').addEventListener('click', clearForm);
    
    // Plan management button events
    document.getElementById('showPendingPlans').addEventListener('click', () => loadPlans('pending'));
    document.getElementById('showCompletedPlans').addEventListener('click', () => loadPlans('completed'));
    document.getElementById('showAllPlans').addEventListener('click', () => loadPlans('all'));
    
    // Save button event
    document.getElementById('saveWorkBtn').addEventListener('click', saveWork);
    
    console.log('All event listeners bound');
}

function setWorkType(type) {
    console.log(window.i18n.t('record.setWorkType'), type);
    
    // Update button active state
    updateButtonActiveState(type);
    
    currentWorkType = type;
    const formTitle = document.getElementById('formTitle');
    const datePickerGroup = document.getElementById('datePickerGroup');
    const workContentLabel = document.getElementById('workContentLabel');
    const difficultyLabel = document.getElementById('difficultyLabel');
    const planManagement = document.getElementById('planManagement');
    const workForm = document.getElementById('workForm');
    const quickActions = document.getElementById('quickActions');
    
    if (type === 'plan') {
        // Work plan mode
        formTitle.textContent = window.i18n.t('record.planManagement');
        datePickerGroup.style.display = 'block';
        workContentLabel.textContent = window.i18n.t('record.planContent');
        difficultyLabel.textContent = window.i18n.t('record.expectedDifficulty');
        planManagement.style.display = 'block';
        workForm.style.display = 'block';
        quickActions.style.display = 'block';
        
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('workDate').value = tomorrow.toISOString().split('T')[0];
        
        // Update placeholder text
        document.getElementById('workContent').placeholder = window.i18n.t('record.placeholder.planContent');
        document.getElementById('difficulty').placeholder = window.i18n.t('record.placeholder.expectedDifficulty');
        
        // Load plan list
        loadPlans(currentPlanFilter);
        
    } else {
        // Today's work mode
        formTitle.textContent = window.i18n.t('record.todayWorkRecord');
        datePickerGroup.style.display = 'none';
        workContentLabel.textContent = window.i18n.t('record.workContent');
        difficultyLabel.textContent = window.i18n.t('record.workDifficulty');
        planManagement.style.display = 'none';
        workForm.style.display = 'block';
        quickActions.style.display = 'block';
        
        // Update placeholder text
        document.getElementById('workContent').placeholder = window.i18n.t('record.placeholder.workContent');
        document.getElementById('difficulty').placeholder = window.i18n.t('record.placeholder.workDifficulty');
        
        editingPlanId = null;
    }
    
    app.showAlert(`${window.i18n.t('record.switchedTo')} ${type === 'today' ? window.i18n.t('record.todayWork') : window.i18n.t('record.planWork')} ${window.i18n.t('record.mode')}`, 'success');
}

function updateButtonActiveState(activeType) {
    // Remove active class from all work type buttons
    document.querySelectorAll('.work-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to currently active button
    const activeBtn = document.getElementById(activeType + 'WorkBtn');
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Update plan filter button status
    if (activeType === 'plan') {
        updatePlanFilterButtons();
    }
}

function updatePlanFilterButtons() {
    const buttons = ['showPendingPlans', 'showCompletedPlans', 'showAllPlans'];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.classList.remove('active');
        }
    });
    
    const activeBtn = document.getElementById('show' + currentPlanFilter.charAt(0).toUpperCase() + currentPlanFilter.slice(1) + 'Plans');
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Show project selector
async function showProjectSelector() {
    console.log('Show project selector');
    try {
        let allItems = [];
        if (window.electronAPI) {
            allItems = await window.electronAPI.getWorkItems();
        } else {
            allItems = await app.mockGetWorkItems();
        }
        
        // Get unique project list (sorted by recent usage)
        const projects = [...new Set(allItems.map(item => item.project))].filter(p => p);
        
        if (projects.length === 0) {
            app.showAlert(window.i18n.t('record.noProjectRecords'), 'info');
            return;
        }
        
        // Create project selection dialog
        const projectList = projects.map((project, index) => 
            `<div style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;" 
                  onclick="window.selectProject('${project.replace(/'/g, "\\'")}')">
                <strong>${project}</strong>
                <div style="font-size: 12px; color: #666;">${window.i18n.t('record.clickSelect')}</div>
             </div>`
        ).join('');
        
        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 20px; border-radius: 10px; width: 400px; max-height: 80vh; overflow-y: auto;">
                    <h3>${window.i18n.t('record.selectProject')}</h3>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${projectList}
                    </div>
                    <div style="margin-top: 15px; text-align: right;">
                        <button onclick="window.closeDialog()" style="padding: 8px 15px; background: #6c757d; color: white; border: none; border-radius: 5px;">取消</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
    } catch (error) {
        console.error(window.i18n.t('error.loadProjectList'), error);
        app.showAlert(window.i18n.t('error.loadProjectList') + error.message, 'error');
    }
}

// selectProject 
function selectProject(projectName) {
    console.log(window.i18n.t('record.selectedProject'), projectName);
    const projectInput = document.getElementById('project');
    if (projectInput) {
        projectInput.value = projectName;
    }
    closeDialog();
    
    //Automatically load the latest information of the selected project
    loadProjectInfo(projectName);
}

// show project templates
function showProjectTemplates() {
    console.log(window.i18n.t('record.showProjectTemplates'));
    const templates = [
        {
            name: window.i18n.t('record.frontendDev'),
            project: window.i18n.t('record.frontendProject'),
            technology: 'React + TypeScript + Ant Design',
            tags: window.i18n.t('record.frontendTags'),
            content: window.i18n.t('record.frontendContent')
        },
        {
            name: window.i18n.t('record.backendDev'),
            project: window.i18n.t('record.backendProject'), 
            technology: 'Node.js + Express + MongoDB',
            tags: window.i18n.t('record.backendTags'),
            content: window.i18n.t('record.backendContent')
        },
        {
            name: window.i18n.t('record.systemDesign'),
            project: window.i18n.t('record.systemProject'),
            technology: window.i18n.t('record.systemTech'),
            tags: window.i18n.t('record.systemTags'),
            content: window.i18n.t('record.systemContent')
        }
    ];
    
    const templateList = templates.map((template, index) => 
        `<div style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px; cursor: pointer;" 
              onclick="window.applyTemplate(${index})">
            <strong>${template.name}</strong>
            <div style="font-size: 12px; color: #666;">${template.technology}</div>
         </div>`
    ).join('');
    
    const dialog = document.createElement('div');
    dialog.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 20px; border-radius: 10px; width: 500px; max-height: 80vh; overflow-y: auto;">
                <h3>${window.i18n.t('record.selectProjectTemplate')}</h3>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${templateList}
                </div>
                <div style="margin-top: 15px; text-align: right;">
                    <button onclick="window.closeDialog()" style="padding: 8px 15px; background: #6c757d; color: white; border: none; border-radius: 5px;">取消</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
}

// Apply Project Template
function applyTemplate(templateIndex) {
    console.log(window.i18n.t('record.applyTemplate'), templateIndex);
    const templates = [
        {
            project: window.i18n.t('record.frontendProject'),
            technology: window.i18n.t('record.frontendTech'),
            tags: window.i18n.t('record.frontendTags'),
            content: window.i18n.t('record.frontendContent')
        },
        {
            project: window.i18n.t('record.backendProject'), 
            technology: window.i18n.t('record.backendTech'),
            tags: window.i18n.t('record.backendTags'),
            content: window.i18n.t('record.backendContent')
        },
        {
            project: window.i18n.t('record.systemProject'),
            technology: window.i18n.t('record.systemTech'),
            tags: window.i18n.t('record.systemTags'),
            content: window.i18n.t('record.systemContent')
        }
    ];
    
    if (templateIndex >= 0 && templateIndex < templates.length) {
        const template = templates[templateIndex];
        document.getElementById('project').value = template.project;
        document.getElementById('technology').value = template.technology;
        document.getElementById('workContent').value = template.content;
        document.getElementById('tags').value = template.tags;
        document.getElementById('projectProgress').value = '0';
        document.getElementById('progressSlider').value = '0';
        document.getElementById('progressValue').textContent = '0%';
        
        closeDialog();
        app.showAlert(window.i18n.t('record.applyTemplateSuccess'), 'success');
    }
}

// close dialog
function closeDialog() {
    console.log(window.i18n.t('record.closeDialog'));
    const dialogs = document.querySelectorAll('div[style*="position: fixed"]');
    dialogs.forEach(dialog => dialog.remove());
}

// load project info
async function loadProjectInfo(projectName) {
    console.log(window.i18n.t('record.loadProjectInfo'), projectName);
    try {
        let projectItems = [];
        if (window.electronAPI) {
            projectItems = await window.electronAPI.getWorkItems({ project: projectName });
        } else {
            projectItems = await app.mockGetWorkItems({ project: projectName });
        }
        
        if (projectItems.length > 0) {
            const latestItem = projectItems[0];
            document.getElementById('technology').value = latestItem.technology || '';
            document.getElementById('projectProgress').value = latestItem.projectProgress || 0;
            document.getElementById('progressSlider').value = latestItem.projectProgress || 0;
            document.getElementById('progressValue').textContent = (latestItem.projectProgress || 0) + '%';
            document.getElementById('tags').value = latestItem.tags ? latestItem.tags.join(', ') : '';
            
            app.showAlert(window.i18n.t('record.loadProjectInfoSuccess', projectName), 'success');
        }
    } catch (error) {
        console.error(window.i18n.t('record.loadProjectInfoError', projectName), error);
    }
}

// load plans
async function loadPlans(filter = 'pending') {
    try {
        const planList = document.getElementById('planList');
        if (!planList) return;
        
        // Load all work items
        let planItems = [];
        if (window.electronAPI) {
            const items = await window.electronAPI.getWorkItems();
            planItems = items.filter(item => item.isPlan);
        } else {
            const items = await app.mockGetWorkItems();
            planItems = items.filter(item => item.isPlan);
        }
        
        // Filter plans based on filter
        let filteredPlans = [];
        switch (filter) {
                case 'pending':
                    // Pending plans: planStatus is pending or not set
                    filteredPlans = planItems.filter(item => 
                        !item.planStatus || item.planStatus === 'pending'
                    );
                    break;
                case 'completed':
                    // Completed plans: planStatus is completed
                    filteredPlans = planItems.filter(item => 
                        item.planStatus === 'completed'
                    );
                    break;
                case 'all':
                    // All plans: include pending and completed
                    filteredPlans = planItems;
                    break;
            }
            
            // Sort plans by date: most recent first
            const sortedPlans = [...filteredPlans].sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            
            // Display filtered plans
        if (sortedPlans.length === 0) {
            planList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #6c757d;">
                    ${filter === 'pending' ? window.i18n.t('record.noPendingPlans') : 
                      filter === 'completed' ? window.i18n.t('record.noCompletedPlans') : window.i18n.t('record.noPlans')}
                </div>
            `;
        } else {
            // Debug: check the actual date values
            console.log('Displaying plans:', sortedPlans.length);
            sortedPlans.forEach((plan, index) => {
                console.log(`Plan ${index}:`, plan.project, 'Date:', plan.date, 'Type:', typeof plan.date);
            });
            
            planList.innerHTML = sortedPlans.map(item => `
                    <div class="work-item">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <div class="project">${item.project}</div>
                                <div class="date">${item.date.split('T')[0]} ${getPlanStatusText(item)}</div>
                                <div style="margin-top: 5px;">
                                    <span class="technology">${item.technology || window.i18n.t('record.noTechnology')}</span>
                                    <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 5px;">
                                        ${window.i18n.t('progress')}: ${item.projectProgress || 0}%
                                    </span>
                                </div>
                                <div style="margin-top: 5px; font-size: 14px; color: #666;">
                                    ${item.achievement || window.i18n.t('noDescription')}
                                </div>
                            </div>
                            <div style="display: flex; gap: 5px; flex-direction: column;">
                                ${item.planStatus === 'completed' ? 
                                    `<button onclick="reopenPlan('${item.id}')" class="btn" style="background: #17a2b8; color: white; padding: 5px 10px; font-size: 12px;">${window.i18n.t('record.reopen')}</button>` :
                                    `<button onclick="markPlanCompleted('${item.id}')" class="btn" style="background: #28a745; color: white; padding: 5px 10px; font-size: 12px;">${window.i18n.t('complete')}</button>
                                     <button onclick="editPlan('${item.id}')" class="btn" style="background: #ffc107; color: black; padding: 5px 10px; font-size: 12px;">${window.i18n.t('edit')}</button>`
                                }
                                <button onclick="deletePlan('${item.id}')" class="btn" style="background: #dc3545; color: white; padding: 5px 10px; font-size: 12px;">${window.i18n.t('delete')}</button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
            
            currentPlanFilter = filter;
            
            // refresh the filter buttons
            updatePlanFilterButtons(filter);
    } catch (error) {
        console.error(window.i18n.t('record.loadPlanListFailed'), error);
        app.showAlert(window.i18n.t('record.loadPlanListFailed'), 'error');
    }
}

// Reopen a work plan
async function reopenPlan(planId) {
    try {
        console.log(window.i18n.t('record.reopenPlan'), planId);
        
        let allItems = [];
        if (window.electronAPI) {
            allItems = await window.electronAPI.getWorkItems();
        } else {
            allItems = await app.mockGetWorkItems();
        }
        
        const updatedItems = allItems.map(item => {
            if (item.id === planId) {
                return {
                    ...item,
                    planStatus: 'pending', // Reopen the work plan
                    projectProgress: 0 // Reset progress to 0
                };
            }
            return item;
        });
        
        // Save the updated data
        if (window.electronAPI) {
            app.showAlert(window.i18n.t('record.reopenPlanInElectron'), 'info');
        } else {
            localStorage.setItem('workData', JSON.stringify(updatedItems));
            app.showAlert(window.i18n.t('record.reopenSuccess'), 'success');
            
            // Refresh the plan list after reopening
            setTimeout(() => {
                loadPlans(currentPlanFilter);
            }, 300);
        }
        
    } catch (error) {
        console.error(window.i18n.t('record.reopenPlanFailed'), error);
        app.showAlert(window.i18n.t('record.reopenPlanFailed') + ' ' + error.message, 'error');
    }
}

// Get the status text for a work plan item
function getPlanStatusText(item) {
    if (item.planStatus === 'completed') {
        return window.i18n.t('completed');
    } else if (item.planStatus === 'pending') {
        return window.i18n.t('pending');
    } else {
        return window.i18n.t('plan');
    }
}

// Display the work plan list
function displayPlans(plans) {
    console.log(window.i18n.t('record.displayPlanList'), plans.length);
    const planList = document.getElementById('planList');
    if (!planList) return;
    
    if (plans.length === 0) {
        planList.innerHTML = `<div style="text-align: center; padding: 20px; color: #6c757d;">${window.i18n.t('noPlan')}</div>`;
        return;
    }
    
    planList.innerHTML = plans.map(plan => `
        <div class="work-item" style="border-left: 4px solid ${getPlanStatusColor(plan.planStatus)}; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div class="project">${plan.project}</div>
                    <div class="date">${window.i18n.t('planDate')}: ${formatPlanDate(plan.date)} • ${getPlanStatusText(plan.planStatus)}</div>
                    <div class="project">${plan.project}</div>
                    <div class="date">${window.i18n.t('planDate')}: ${formatPlanDate(plan.date)} • ${getPlanStatusText(plan.planStatus)}</div>
                    <div style="margin-top: 5px;">
                        <span class="technology">${plan.technology || window.i18n.t('noTechnology')}</span>
                        <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 5px;">
                            ${window.i18n.t('targetProgress')}: ${plan.projectProgress || 0}%
                        </span>
                    </div>
                    <div style="margin-top: 5px; font-size: 14px; color: #666;">
                        <strong>${window.i18n.t('planContent')}:</strong> ${plan.achievement || window.i18n.t('noDescription')}
                    </div>
                </div>
                <div style="display: flex; gap: 5px; flex-direction: column;">
                    ${plan.planStatus === 'pending' ? `
                    <button onclick="window.editPlan('${plan.id}')" class="btn" style="background: #17a2b8; color: white; padding: 5px 10px; font-size: 12px;">${window.i18n.t('edit')}</button>
                    <button onclick="window.markPlanCompleted('${plan.id}')" class="btn" style="background: #28a745; color: white; padding: 5px 10px; font-size: 12px;">${window.i18n.t('complete')}</button>
                    ` : ''}
                    <button onclick="window.deletePlan('${plan.id}')" class="btn" style="background: #ffc107; color: black; padding: 5px 10px; font-size: 12px;">${window.i18n.t('delete')}</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Get the color for a work plan status
function getPlanStatusColor(status) {
    const colors = {
        'pending': '#ffc107',    // yellow
        'completed': '#28a745',  // green
        'cancelled': '#dc3545'   // red
    };
    return colors[status] || '#6c757d';
}

// Get the status text for a work plan item
function getPlanStatusText(status) {
    const texts = {
        'pending': window.i18n.t('pending'),
        'completed': window.i18n.t('completed'), 
        'cancelled': window.i18n.t('cancelled')
    };
    return texts[status] || status;
}

// Edit a work plan item
async function editPlan(planId) {
    try {
        console.log(window.i18n.t('record.editPlan'), planId);
        
        let allItems = [];
        if (window.electronAPI) {
            allItems = await window.electronAPI.getWorkItems();
        } else {
            allItems = await app.mockGetWorkItems();
        }
        
        const plan = allItems.find(item => item.id === planId);
        if (!plan) {
            app.showAlert(window.i18n.t('record.planNotFound'), 'error');
            return;
        }
        
        // add data to form
        document.getElementById('project').value = plan.project;
        document.getElementById('technology').value = plan.technology || '';
        document.getElementById('workContent').value = plan.achievement || '';
        document.getElementById('difficulty').value = plan.difficulty || '';
        document.getElementById('projectProgress').value = plan.projectProgress || 0;
        document.getElementById('progressSlider').value = plan.projectProgress || 0;
        document.getElementById('progressValue').textContent = (plan.projectProgress || 0) + '%';
        document.getElementById('tags').value = plan.tags ? plan.tags.join(', ') : '';
        document.getElementById('workDate').value = plan.date.split('T')[0]; 
        
        // set form to edit mode
        window.editingPlanId = planId;
        
        // switch to edit mode
        document.getElementById('planWorkBtn').click();
        
        app.showAlert(window.i18n.t('record.planLoaded'), 'success');
        
    } catch (error) {
        console.error(window.i18n.t('record.loadPlanFailed'), error);
        app.showAlert(window.i18n.t('record.loadPlanFailed') + error.message, 'error');
    }
}

// Mark a work plan item as completed
async function markPlanCompleted(planId) {
    try {
        console.log(window.i18n.t('record.completePlan'), planId);
        
        let allItems = [];
        if (window.electronAPI) {
            allItems = await window.electronAPI.getWorkItems();
        } else {
            allItems = await app.mockGetWorkItems();
        }
        
        const updatedItems = allItems.map(item => {
            if (item.id === planId) {
                return {
                    ...item,
                    projectProgress: 100, // progress set to 100%
                    date: new Date().toISOString(), // set to current system time
                    completedAt: new Date().toISOString(), // add completion time
                    planStatus: 'completed', // mark as completed
                    isPlan: false // remove plan marker, become normal work record
                };
            }
            return item;
        });
        
        // save updated data
        let success = false;
        if (window.electronAPI) {
            // update plan in Electron environment
            const planToUpdate = allItems.find(item => item.id === planId);
            if (planToUpdate) {
                const updatedPlan = {
                    ...planToUpdate,
                    projectProgress: 100,
                    date: new Date().toISOString(),
                    completedAt: new Date().toISOString(),
                    planStatus: 'completed',
                    isPlan: false
                };
                success = await window.electronAPI.updateWorkItem(planId, updatedPlan);
            }
        } else {
            localStorage.setItem('workData', JSON.stringify(updatedItems));
            success = true;
        }
        
        if (success) {
            app.showAlert(window.i18n.t('record.completeSuccess') + window.i18n.t('record.taskTransferred'), 'success');
            
            // Refresh the plan list after reopening
            setTimeout(() => {
                loadPlans(currentPlanFilter);
            }, 300);
        } else {
            app.showAlert(window.i18n.t('record.completePlanFailed') + window.i18n.t('record.retry'), 'error');
        }
        
    } catch (error) {
        console.error(window.i18n.t('record.completePlanFailed'), error);
        app.showAlert(window.i18n.t('record.completePlanFailed') + error.message, 'error');
    }
}

// Delete a work plan item
async function deletePlan(planId) {
    console.log(window.i18n.t('record.deletePlanStart'), planId);
    if (confirm(window.i18n.t('record.confirmDeletePlan'))) {
        try {
            console.log(window.i18n.t('record.userConfirmDelete'));
            
            let allItems = [];
            if (window.electronAPI) {
                allItems = await window.electronAPI.getWorkItems();
            } else {
                allItems = await app.mockGetWorkItems();
            }
            
            console.log(window.i18n.t('record.deletePlanBeforeCount'), allItems.length);
            console.log(window.i18n.t('record.deletePlanTargetId'), planId);
            
            const filteredItems = allItems.filter(item => {
                const shouldKeep = item.id !== planId;
                if (!shouldKeep) {
                    console.log(window.i18n.t('record.deletePlanFound'), item);
                }
                return shouldKeep;
            });
            console.log(window.i18n.t('record.deletePlanAfterCount'), filteredItems.length);
            
            // save updated data
            if (window.electronAPI) {
                // delete plan in Electron environment
                try {
                    const allItems = await window.electronAPI.getWorkItems();
                    const filteredItems = allItems.filter(item => item.id !== planId);
                    
                    // delete plan in Electron environment
                    app.showAlert(window.i18n.t('record.deletePlanSuccess'), 'info');
                } catch (error) {
                    console.error(window.i18n.t('record.deletePlanFailed'), error);
                    app.showAlert(window.i18n.t('record.deletePlanFailed') + error.message, 'error');
                }
            } else {
                console.log(window.i18n.t('record.saveDataToLocalStorage'));
                localStorage.setItem('workData', JSON.stringify(filteredItems));
                app.showAlert(window.i18n.t('record.deletePlanSuccess'), 'success');
                
                // reload plan list after deletion
                console.log(window.i18n.t('record.reloadPlanList'));
                setTimeout(() => {
                    console.log(window.i18n.t('record.startReloadPlanList'));
                    loadPlans(currentPlanFilter);
                }, 300);
            }
            
        } catch (error) {
            console.error(window.i18n.t('record.deletePlanFailed'), error);
            app.showAlert(window.i18n.t('record.deletePlanFailed') + error.message, 'error');
        }
    } else {
        console.log(window.i18n.t('record.userCancelDelete'));
    }
}

function updateProgressDisplay() {
    const slider = document.getElementById('progressSlider');
    const valueSpan = document.getElementById('progressValue');
    const numberInput = document.getElementById('projectProgress');
    
    if (!slider || !valueSpan || !numberInput) return;
    
    slider.addEventListener('input', function() {
        valueSpan.textContent = this.value + '%';
        numberInput.value = this.value;
    });
    
    numberInput.addEventListener('input', function() {
        const value = Math.min(100, Math.max(0, parseInt(this.value) || 0));
        slider.value = value;
        valueSpan.textContent = value + '%';
        this.value = value;
    });
}

async function saveWork() {
     console.log(window.i18n.t('record.saveWork'));
    const project = document.getElementById('project').value.trim();
    const technology = document.getElementById('technology').value.trim();
    const workContent = document.getElementById('workContent').value.trim();
    const difficulty = document.getElementById('difficulty').value.trim();
    const projectProgress = parseInt(document.getElementById('projectProgress').value) || 0;
    const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    if (!project || !workContent) {
        app.showAlert(window.i18n.t('record.fillProjectAndWorkContent'), 'error');
        return;
    }
    
    try {
        let workDate;
        if (currentWorkType === 'plan') {
            // plan work: use selected date but add current time
            const selectedDate = document.getElementById('workDate').value;
            if (!selectedDate) {
                app.showAlert(window.i18n.t('record.choosePlanDate'), 'error');
                return;
            }
            // plan work: use selected date but add current time
            const now = new Date();
            const timePart = now.toTimeString().split(' ')[0]; // HH:MM:SS
            workDate = `${selectedDate}T${timePart}`;
        } else {
            // today work: use current full time
            workDate = new Date().toISOString();
        }
        
        let workItem;
        let success = false;
        
        // today work: save today work
        if (window.editingPlanId) {
            // today work: update today work
            workItem = {
                project,
                technology,
                achievement: workContent,
                difficulty,
                projectProgress,
                tags,
                date: workDate,
                updatedAt: new Date().toISOString()
            };
            
            if (window.electronAPI) {
                // today work: update today work in electron
                success = await window.electronAPI.updateWorkItem(window.editingPlanId, workItem);
            } else {
                // today work: update today work in browser
                try {
                    let allItems = await app.mockGetWorkItems();
                    const planIndex = allItems.findIndex(item => item.id === window.editingPlanId);
                    if (planIndex !== -1) {
                        allItems[planIndex] = { ...allItems[planIndex], ...workItem };
                        localStorage.setItem('workData', JSON.stringify(allItems));
                        success = true;
                    }
                } catch (error) {
                    console.error(window.i18n.t('record.updateWorkFailed'), error);
                    app.showAlert(window.i18n.t('record.updateWorkFailed') + error.message, 'error');
                    return;
                }
            }
        } else {
            // today work: save today work
            workItem = {
                project,
                technology,
                achievement: workContent,
                difficulty,
                projectProgress,
                tags,
                date: workDate,
                isPlan: currentWorkType === 'plan',
                planStatus: currentWorkType === 'plan' ? 'pending' : undefined
            };
            
            if (window.electronAPI) {
                success = await window.electronAPI.saveWorkItem(workItem);
            } else {
                success = await app.mockSaveWorkItem(workItem);
            }
        }
        
        if (success) {
            const message = editingPlanId ? window.i18n.t('record.updateWorkSuccess') : (currentWorkType === 'plan' ? window.i18n.t('record.savePlanSuccess') : window.i18n.t('record.saveWorkSuccess'));
            app.showAlert(message, 'success');
            clearForm();
            
            // today work: reload today work list
            if (currentWorkType === 'plan') {
                setTimeout(() => {
                    loadPlans(currentPlanFilter);
                }, 100);
            }
            
            // today work: reset editing state
            editingPlanId = null;
        } else {
            app.showAlert(window.i18n.t('record.saveWorkFailed') + error.message, 'error');
        }

         // today work: reset editing state
        window.editingPlanId = null;
    } catch (error) {
        console.error(window.i18n.t('record.saveWorkFailed'), error);
        app.showAlert(window.i18n.t('record.saveWorkFailed') + error.message, 'error');
    }
}

function clearForm() {
    console.log(window.i18n.t('record.clearForm'));
    const elements = [
        'project', 'technology', 'workContent', 'difficulty', 
        'projectProgress', 'progressSlider', 'tags', 'workDate'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'range' || element.type === 'number') {
                element.value = '0';
            } else if (element.type === 'textarea') {
                element.value = '';
            } else {
                element.value = '';
            }
        }
    });
    
    const progressValue = document.getElementById('progressValue');
    if (progressValue) progressValue.textContent = '0%';
    
    editingPlanId = null;
}

// 
window.initRecord = initRecord;
window.selectProject = selectProject;
window.closeDialog = closeDialog;
window.applyTemplate = applyTemplate;
window.showProjectSelector = showProjectSelector;
window.showProjectTemplates = showProjectTemplates;
window.setWorkType = setWorkType;
window.saveWork = saveWork;
window.clearForm = clearForm;
window.loadProjectInfo = loadProjectInfo;
window.editPlan = editPlan;
window.markPlanCompleted = markPlanCompleted;
window.deletePlan = deletePlan;
window.loadPlans = loadPlans;
window.getPlanStatusColor = getPlanStatusColor;
window.getPlanStatusText = getPlanStatusText;
window.reopenPlan = reopenPlan;