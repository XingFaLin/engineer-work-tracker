// Main application logic
class WorkTrackerApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.init();
    }

    init() {
        this.initEventListeners();
        this.loadTab(this.currentTab);
    }

    // Initialize event listeners
    initEventListeners() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-tab')) {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            }
        });

        // Global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showAlert(window.i18n.t('error.retry'), 'error');
        });
    }

    // Switch tabs
    switchTab(tabName) {
        // Update navigation tab status
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Load corresponding tab content
        this.loadTab(tabName);
    }

    // Modified loadTab function to ensure page is fully loaded before initialization
    async loadTab(tabName) {       
        try {
            const content = document.getElementById('content');
            
            // Clear previous content to avoid duplication
            content.innerHTML = `<div style="text-align: center; padding: 50px;">${window.i18n.t('loading')}</div>`;

            // Use inline HTML content consistently (ensuring internationalization works)
            // This avoids issues with external HTML files not being translated
            const html = this.getInlineHTML(tabName);
            
            content.innerHTML = html;

            // Delay calling the corresponding module's initialization function to ensure DOM is fully loaded
            setTimeout(() => {
                if (window[`init${this.capitalize(tabName)}`]) {
                    window[`init${this.capitalize(tabName)}`]();
                }
            }, 50);

            this.currentTab = tabName;
        } catch (error) {
            console.error(`Failed to load ${tabName} page:`, error);
            this.showAlert(`${window.i18n.t('error.loadPage')} ${tabName}, ${window.i18n.t('error.useDefault')}`, 'warning');
            
            // Use inline content as fallback when loading fails
            const content = document.getElementById('content');
            content.innerHTML = this.getInlineHTML(tabName);
            
            setTimeout(() => {
                if (window[`init${this.capitalize(tabName)}`]) {
                    window[`init${this.capitalize(tabName)}`]();
                }
            }, 50);
        }
    }
    
    // Get inline HTML content (for browser environment)
    getInlineHTML(tabName) {
        const htmlTemplates = {
            'dashboard': `<!-- Dashboard Page -->
<h2>${window.i18n.t('dashboard.title')}</h2>

<div class="stat-grid">
    <div class="stat-card">
        <div class="number" id="todayItems">0</div>
        <div class="label">${window.i18n.t('dashboard.todayItems')}</div>
    </div>
    <div class="stat-card">
        <div class="number" id="totalProjects">0</div>
        <div class="label">${window.i18n.t('dashboard.totalProjects')}</div>
    </div>
    <div class="stat-card">
        <div class="number" id="totalTechnologies">0</div>
        <div class="label">${window.i18n.t('dashboard.totalTechnologies')}</div>
    </div>
    <div class="stat-card">
        <div class="number" id="totalAchievements">0</div>
        <div class="label">${window.i18n.t('dashboard.totalAchievements')}</div>
    </div>
    <div class="stat-card">
        <div class="number" id="averageProgress">0%</div>
        <div class="label">${window.i18n.t('dashboard.averageProgress')}</div>
    </div>
</div>

<div class="card">
    <h3 style="margin-bottom: 15px;">${window.i18n.t('dashboard.weekProgress')}</h3>
    <div class="progress-bar">
        <div class="progress-fill" id="weekProgress"></div>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6c757d;">
        <span>${window.i18n.t('dashboard.completedItems')}: <span id="completedItems">0</span></span>
        <span>${window.i18n.t('dashboard.weeklyTarget')}: <span id="weeklyTarget">21</span></span>
        <span>${window.i18n.t('dashboard.progressPercent')}: <span id="progressPercent">0%</span></span>
    </div>
</div>

<div class="card">
    <h3>${window.i18n.t('dashboard.recentWork')}</h3>
    <div id="recentWorkList">
        <div style="text-align: center; padding: 20px; color: #6c757d;">
            ${window.i18n.t('dashboard.noRecords')}
        </div>
    </div>
</div>

<!-- Work Plan Preview -->
<div class="card" id="planPreview" style="display: none;">
    <h3>${window.i18n.t('dashboard.pendingPlans')}</h3>
    <div id="pendingPlansList">
        <!-- Pending plans will be displayed here -->
    </div>
</div>`,
            
            'record': `<!-- Record Work Page -->
<h2>${window.i18n.t('record.title')}</h2>

<!-- Work Type Selection -->
<div class="card">
    <h3>${window.i18n.t('record.workType')}</h3>
    <div class="work-type-buttons">
        <button class="work-type-btn btn-primary active" id="todayWorkBtn">${window.i18n.t('record.todayWork')}</button>
        <button class="work-type-btn btn-info" id="planWorkBtn">${window.i18n.t('record.planWork')}</button>
    </div>
</div>

<!-- Quick Actions Area -->
<div class="card" id="quickActions">
    <h3>${window.i18n.t('record.quickActions')}</h3>
    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn" id="selectProjectBtn" style="background: #6c757d; color: white;">${window.i18n.t('record.selectProject')}</button>
        <button class="btn" id="templateBtn" style="background: #17a2b8; color: white;">${window.i18n.t('record.template')}</button>
        <button class="btn" id="clearFormBtn" style="background: #dc3545; color: white;">${window.i18n.t('record.clear')}</button>
    </div>
</div>

<!-- ${window.i18n.t('record.workForm')} -->
<div class="card" id="workForm">
    <h3 id="formTitle">${window.i18n.t('record.formTitle')}</h3>
    
    <!-- ${window.i18n.t('record.planDate')} -->
    <div class="form-group" id="datePickerGroup" style="display: none;">
        <label for="workDate">${window.i18n.t('record.planDate')}</label>
        <input type="date" id="workDate" class="form-control">
    </div>
    
    <div class="form-group">
        <label for="project">${window.i18n.t('record.project')}</label>
        <input type="text" id="project" class="form-control" placeholder="${window.i18n.t('record.placeholder.project')}">
    </div>
    
    <div class="form-group">
        <label for="technology">${window.i18n.t('record.technology')}</label>
        <input type="text" id="technology" class="form-control" placeholder="${window.i18n.t('record.placeholder.technology')}">
    </div>
    
    <div class="form-group">
        <label for="workContent" id="workContentLabel">${window.i18n.t('record.workContent')}</label>
        <textarea id="workContent" class="form-control" rows="3" placeholder="${window.i18n.t('record.placeholder.workContent')}"></textarea>
    </div>
    
    <div class="form-group">
        <label for="difficulty" id="difficultyLabel">${window.i18n.t('record.difficulty')}</label>
        <textarea id="difficulty" class="form-control" rows="2" placeholder="${window.i18n.t('record.placeholder.difficulty')}"></textarea>
    </div>
    
    <div class="form-group">
        <label for="projectProgress">${window.i18n.t('record.progress')}</label>
        <div style="display: flex; align-items: center; gap: 10px;">
            <input type="range" id="progressSlider" min="0" max="100" value="0" style="flex: 1;">
            <span id="progressValue">0%</span>
            <input type="number" id="projectProgress" min="0" max="100" value="0" style="width: 80px;">
        </div>
    </div>
    
    <div class="form-group">
        <label for="tags">${window.i18n.t('record.tags')}</label>
        <input type="text" id="tags" class="form-control" placeholder="${window.i18n.t('record.placeholder.tags')}">
    </div>
    
    <div style="display: flex; gap: 10px;">
        <button class="btn btn-primary" id="saveWorkBtn">${window.i18n.t('save')}</button>
    </div>
</div>

<!-- Plan Management Area (only shown in plan work mode) -->
<div class="card" id="planManagement" style="display: none;">
    <h3>${window.i18n.t('record.planManagement')}</h3>
    
    <!-- Plan Filter -->
    <div style="margin-bottom: 15px;">
        <button class="btn btn-info active" id="showPendingPlans">${window.i18n.t('record.pendingPlans')}</button>
        <button class="btn btn-success" id="showCompletedPlans">${window.i18n.t('record.completedPlans')}</button>
        <button class="btn" id="showAllPlans" style="background: #6c757d; color: white;">${window.i18n.t('record.allPlans')}</button>
    </div>
    
    <!-- Plan List -->
    <div id="planList">
        <div style="text-align: center; padding: 20px; color: #6c757d;">
            ${window.i18n.t('record.noPlans')}
        </div>
    </div>
</div>`,
            
            'reports': `<!-- Generate Reports Page -->
<h2>${window.i18n.t('reports.title')}</h2>

<div class="card">
    <h3>${window.i18n.t('reports.selectType')}</h3>
    <div class="form-group">
        <label for="reportType">${window.i18n.t('reports.reportType')}</label>
        <select id="reportType" class="form-control">
            <option value="">${window.i18n.t('reports.selectReportType')}</option>
            <option value="daily">${window.i18n.t('reports.daily')}</option>
            <option value="weekly">${window.i18n.t('reports.weekly')}</option>
            <option value="monthly">${window.i18n.t('reports.monthly')}</option>
            <option value="yearly">${window.i18n.t('reports.yearly')}</option>
            <option value="technical">${window.i18n.t('reports.tech')}</option>
        </select>
    </div>
    
    <div id="reportParams">
        <!-- Dynamic parameters area -->
    </div>
    
    <button class="btn btn-primary" id="generateReportBtn">${window.i18n.t('reports.generate')}</button>
</div>

<div class="card" id="reportPreviewCard" style="display: none;">
    <h3>${window.i18n.t('reports.preview')}</h3>
    <div class="report-preview" id="reportPreview"></div>
    <div style="margin-top: 15px;">
        <button class="btn btn-info" id="downloadReportBtn" style="display: none;">${window.i18n.t('reports.download')}</button>
    </div>
</div>`,
            
            'data': `<!-- Data Management Page -->
<h2>${window.i18n.t('data.title')}</h2>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
    <div class="card">
        <h3>${window.i18n.t('data.stats')}</h3>
        <div id="dataStats"></div>
    </div>
    
    <div class="card">
        <h3>${window.i18n.t('data.operations')}</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="btn btn-info" id="exportDataBtn">${window.i18n.t('data.export')}</button>
            <button class="btn btn-info" id="importDataBtn">${window.i18n.t('data.import')}</button>
            <button class="btn" id="clearDataBtn" style="background: #dc3545; color: white;">${window.i18n.t('data.clear')}</button>
        </div>
    </div>
</div>

<div class="card">
    <h3>${window.i18n.t('data.projectManagement')}</h3>
    <div id="projectManagement">
        <!-- Project list will be dynamically generated here -->
    </div>
</div>

<div class="card">
    <h3>${window.i18n.t('data.allWorkRecords')}</h3>
    <div id="allWorkList">
        <!-- Work records list will be dynamically generated here -->
    </div>
</div>
</div>`,
            
            'estimation': `<!-- R&D Estimation Page -->
<h2>${window.i18n.t('estimation.title') || 'R&D Estimation'}</h2>
<div id="estimationContent"></div>
</div>`
        };
        
        return htmlTemplates[tabName] || '<div style="text-align: center; padding: 50px; color: #6c757d;">' + window.i18n.t('error.loadPage') + window.i18n.t('error.useDefault') + '</div>';
    }

    // Utility function: capitalize first letter
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Show alert message
    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) existingAlert.remove();

        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        // Automatically disappear after 3 seconds
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }

    // Mock function to save work item to localStorage
    async mockSaveWorkItem(workItem) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock save logic: add to localStorage
                const existingData = JSON.parse(localStorage.getItem('workData') || '[]');
                workItem.id = Date.now().toString();
                workItem.createdAt = new Date().toISOString();
                if (!workItem.date) {
                    workItem.date = new Date().toISOString(); 
                }
                existingData.push(workItem);
                localStorage.setItem('workData', JSON.stringify(existingData));
                resolve(true);
            }, 500);
        });
    }

    async mockGetWorkItems(filters = {}) {
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    let data = [];
                    const storedData = localStorage.getItem('workData');
                    if (storedData) {
                        data = JSON.parse(storedData);
                        // safe check
                        if (!Array.isArray(data)) {
                            data = [];
                        }
                    }
                    
                    if (filters.startDate) {
                        data = data.filter(item => {
                            try {
                                return item && item.date && item.date >= filters.startDate;
                            } catch (e) {
                                return false;
                            }
                        });
                    }
                    if (filters.endDate) {
                        data = data.filter(item => {
                            try {
                                return item && item.date && item.date <= filters.endDate;
                            } catch (e) {
                                return false;
                            }
                        });
                    }
                    if (filters.project) {
                        data = data.filter(item => {
                            try {
                                return item && item.project && 
                                    item.project.toLowerCase().includes(filters.project.toLowerCase());
                            } catch (e) {
                                return false;
                            }
                        });
                    }

                    // safe sort
                    data.sort((a, b) => {
                        try {
                            return new Date(b.date) - new Date(a.date);
                        } catch (e) {
                            return 0;
                        }
                    });

                    resolve(data);
                } catch (error) {
                    console.error(window.i18n.t('error.errorFetchingRecords'), error);
                    resolve([]);
                }
            }, 300);
        });
    }

    async mockGetStatistics(period = 'month') {
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    let data = [];
                    const storedData = localStorage.getItem('workData');
                    if (storedData) {
                        data = JSON.parse(storedData);
                        // safe check
                        if (!Array.isArray(data)) {
                            data = [];
                        }
                    }
                    
                    const now = new Date();
                    let startDate;
                    
                    switch (period) {
                        case 'week':
                            startDate = new Date(now.setDate(now.getDate() - 7));
                            break;
                        case 'month':
                            startDate = new Date(now.setMonth(now.getMonth() - 1));
                            break;
                        case 'year':
                            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                            break;
                        default:
                            startDate = new Date(now.setDate(now.getDate() - 30));
                    }

                    const filteredData = data.filter(item => {
                        try {
                            return item && item.date && new Date(item.date) >= startDate;
                        } catch (e) {
                            return false;
                        }
                    });

                    resolve({
                        totalItems: filteredData.length,
                        projects: new Set(filteredData.map(item => item.project).filter(Boolean)).size,
                        technologies: new Set(filteredData.map(item => item.technology).filter(Boolean)).size,
                        achievements: filteredData.filter(item => item.achievement).length
                    });
                } catch (error) {
                    console.error(window.i18n.t('error.errorFetchingStatistics'), error);
                    // return default statistics
                    resolve({
                        totalItems: 0,
                        projects: 0,
                        technologies: 0,
                        achievements: 0
                    });
                }
            }, 300);
        });
    }
}

// Global application instance
let app;

// Initialize application after page loads
document.addEventListener('DOMContentLoaded', function() {
    app = new WorkTrackerApp();
    console.log(window.i18n.t('systemStarted'));
});

// Export application instance globally
window.app = app;