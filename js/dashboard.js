// Dashboard module
let weeklyTarget = 21; // Configurable weekly target

function initDashboard() {
    console.log('Initialize dashboard');
    loadDashboard();
    
    // Use setTimeout to ensure page content is fully loaded before binding event listeners
    setTimeout(() => {
        initDashboardEventListeners();
    }, 100);
}

function initDashboardEventListeners() {
    // Weekly target setting button has been removed
}

// Load weekly target settings
function loadWeeklyTarget() {
    // Fixed weekly target to 21, no longer read from localStorage
    weeklyTarget = 21;
}

// Modified loadDashboard function to ensure completed plans are displayed in recent work records
async function loadDashboard() {
    try {
        loadWeeklyTarget(); // Load weekly target settings
        
        // Get this week's data
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
        const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
        
        let workItems = [];
        let stats = { totalItems: 0, projects: 0, technologies: 0, achievements: 0 };
        
        if (window.electronAPI) {
            workItems = await window.electronAPI.getWorkItems({ startDate: startOfWeekStr });
            stats = await window.electronAPI.getStatistics('week');
        } else {
            workItems = await app.mockGetWorkItems({ startDate: startOfWeekStr });
            stats = await app.mockGetStatistics('week');
        }
        
        // Filter to get only this week's completed items (excluding pending plans)
        const thisWeekCompletedItems = workItems.filter(item => 
            !item.isPlan || item.planStatus === 'completed'
        );
        
        // Calculate average project progress (including completed plans)
        const todayWorkItems = workItems.filter(item => !item.isPlan || item.planStatus === 'completed');
        const averageProgress = todayWorkItems.length > 0 ? 
            Math.round(todayWorkItems.reduce((sum, item) => sum + (item.projectProgress || 0), 0) / todayWorkItems.length) : 0;
        
        // Update statistics (including completed plans)
        updateDashboardStats(todayWorkItems.length, stats.projects, stats.technologies, stats.achievements, averageProgress);
        
        // Update progress bar with this week's completed items (using configurable target)
        updateProgressBar(thisWeekCompletedItems.length, weeklyTarget);
        
        // Display recent work records (including completed plans)
        displayRecentWork(todayWorkItems);
        
        // Display pending plans (only show incomplete plans)
        const pendingPlanItems = workItems.filter(item => item.isPlan && (!item.planStatus || item.planStatus === 'pending'));
        displayPendingPlans(pendingPlanItems);
        
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        app.showAlert(window.i18n.t('error.loadDashboard'), 'error');
    }
}

function updateDashboardStats(todayItems, totalProjects, totalTechnologies, totalAchievements, averageProgress) {
    const elements = {
        'todayItems': todayItems,
        'totalProjects': totalProjects,
        'totalTechnologies': totalTechnologies,
        'totalAchievements': totalAchievements,
        'averageProgress': averageProgress + '%'
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function updateProgressBar(completedItems, target) {
    const progress = Math.min((completedItems / target) * 100, 100);
    const progressFill = document.getElementById('weekProgress');
    const completedSpan = document.getElementById('completedItems');
    const targetSpan = document.getElementById('weeklyTarget');
    const percentSpan = document.getElementById('progressPercent');
    
    if (progressFill) progressFill.style.width = progress + '%';
    if (completedSpan) completedSpan.textContent = completedItems;
    if (targetSpan) targetSpan.textContent = target;
    if (percentSpan) percentSpan.textContent = Math.round(progress) + '%';
}

function displayRecentWork(workItems) {
    const recentWorkList = document.getElementById('recentWorkList');
    if (!recentWorkList) return;
    
    // Sort by date descending (newest first)
    const sortedItems = workItems.sort((a, b) => {
        try {
            return new Date(b.date) - new Date(a.date);
        } catch (e) {
            return 0;
        }
    });
    const recentItems = sortedItems.slice(0, 5);
    
    if (recentItems.length === 0) {
        recentWorkList.innerHTML = `<div style="text-align: center; padding: 20px; color: #6c757d;">${window.i18n.t('dashboard.noRecords')}</div>`;
        return;
    }
    
    recentWorkList.innerHTML = recentItems.map(item => `
        <div class="work-item">
            <div class="project">${item.project}</div>
            <div class="date">${item.date} ${item.isPlan ? window.i18n.t('record.plan') : ''}</div>
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
    `).join('');
}

// Load pending plans
async function loadPendingPlans() {
    try {
        let allItems = [];
        if (window.electronAPI) {
            allItems = await window.electronAPI.getWorkItems();
        } else {
            allItems = await app.mockGetWorkItems();
        }
        
        // Get pending plans
        const pendingPlans = allItems.filter(item => 
            item && item.isPlan && item.planStatus === 'pending'
        ).sort((a, b) => {
            try {
                return new Date(a.date) - new Date(b.date);
            } catch (e) {
                return 0;
            }
        }); // Sort by date ascending (soonest expiring first)
        
        displayPendingPlans(pendingPlans);
        
    } catch (error) {        
        console.error(window.i18n.t('error.loadPendingPlans'), error);
    }
}

function displayPendingPlans(plans) {
    const planPreview = document.getElementById('planPreview');
    const pendingPlansList = document.getElementById('pendingPlansList');
    
    if (!planPreview || !pendingPlansList) return;
    
    if (plans.length === 0) {
        planPreview.style.display = 'none';
        return;
    }
    
    planPreview.style.display = 'block';
    pendingPlansList.innerHTML = plans.slice(0, 3).map(plan => `
        <div class="work-item" style="border-left: 4px solid #ffc107; margin-bottom: 10px;">
            <div class="project">${plan.project}</div>
            <div class="date">${window.i18n.t('record.planDate')}: ${plan.date}</div>
            <div style="margin-top: 5px;">
                <span class="technology">${plan.technology || window.i18n.t('common.notFilled')}</span>
            </div>
            <div style="margin-top: 5px; font-size: 14px; color: #666;">
                ${plan.achievement || window.i18n.t('common.noDescription')}
            </div>
            <div style="margin-top: 5px;">
                <button onclick="window.goToPlan('${plan.id}')" class="btn" style="background: #17a2b8; color: white; padding: 3px 8px; font-size: 11px;">${window.i18n.t('viewDetails')}</button>
            </div>
        </div>
    `).join('');
    
    if (plans.length > 3) {
        pendingPlansList.innerHTML += `
            <div style="text-align: center; margin-top: 10px;">
                <button onclick="window.viewAllPlans()" class="btn" style="background: #6c757d; color: white; padding: 5px 10px; font-size: 12px;">
                    ${window.i18n.t('dashboard.viewAllPlans', { count: plans.length })}
                </button>
            </div>
        `;
    }
}

// today work: go to plan details
function goToPlan(planId) {
    app.switchTab('record');
    setTimeout(() => {
        window.setWorkType('plan');
        window.editPlan(planId);
    }, 100);
}

// today work: view all plans
function viewAllPlans() {
    app.switchTab('record');
    setTimeout(() => {
        window.setWorkType('plan');
    }, 100);
}

// today work: export all functions to global scope
window.initDashboard = initDashboard;
window.goToPlan = goToPlan;
window.viewAllPlans = viewAllPlans;