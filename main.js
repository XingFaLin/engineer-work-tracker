const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const TRANSLATIONS = require('./js/translations.js');

// data storage path
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'work-data.json');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Internationalization helper for main process (Node.js environment)
function getTranslation(key, language = 'zh-CN') {
    const lang = language || 'zh-CN';
    const translation = TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
    return translation;
}

class WorkTracker {
    constructor() {
        this.mainWindow = null;
        this.setupApp();
        this.setupIpcHandlers();
    }

    setupApp() {
        app.whenReady().then(() => {
            this.createWindow();
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });
    }

    createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },         
            title: 'Engineer Work Tracker',
            icon: path.join(__dirname, 'icon.png')
        });

        this.mainWindow.loadFile('index.html');
        
        if (process.argv.includes('--dev')) {
            this.mainWindow.webContents.openDevTools();
        }
    }

    setupIpcHandlers() {
        ipcMain.handle('save-work-item', async (event, workItem) => {
            const validation = this.validateWorkItem(workItem);
            if (!validation.valid) {
                throw new Error(validation.error);
            }
            return this.saveWorkItem(workItem);
        });

        ipcMain.handle('update-work-item', async (event, workItemId, updatedData) => {
            if (!workItemId || typeof workItemId !== 'string') {
                throw new Error('Invalid work item ID');
            }
            if (!updatedData || typeof updatedData !== 'object') {
                throw new Error('Invalid update data');
            }
            return this.updateWorkItem(workItemId, updatedData);
        });

        ipcMain.handle('delete-work-item', async (event, workItemId) => {
            if (!workItemId || typeof workItemId !== 'string') {
                throw new Error('Invalid work item ID');
            }
            return this.deleteWorkItem(workItemId);
        });

        ipcMain.handle('get-work-items', async (event, filters = {}) => {
            if (!filters || typeof filters !== 'object') {
                return this.getWorkItems({});
            }
            return this.getWorkItems(filters);
        });

        ipcMain.handle('generate-report', async (event, type, params) => {
            const validTypes = ['daily', 'weekly', 'monthly', 'yearly', 'technical'];
            if (!type || !validTypes.includes(type)) {
                throw new Error('Invalid report type');
            }
            if (!params || typeof params !== 'object') {
                throw new Error('Invalid report parameters');
            }
            return this.generateReport(type, params);
        });

        ipcMain.handle('get-statistics', async (event, period) => {
            const validPeriods = ['week', 'month', 'year'];
            if (!period || !validPeriods.includes(period)) {
                return this.getStatistics('month');
            }
            return this.getStatistics(period);
        });

        ipcMain.handle('get-language', async (event) => {
            return this.getCurrentLanguage();
        });

        ipcMain.handle('export-data', async (event) => {
            return this.exportData();
        });

        ipcMain.handle('import-data', async (event, data) => {
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format');
            }
            return this.importData(data);
        });
    }

    // Validate work item data
    validateWorkItem(workItem) {
        if (!workItem || typeof workItem !== 'object') {
            return { valid: false, error: 'Work item must be an object' };
        }
        if (!workItem.project || typeof workItem.project !== 'string') {
            return { valid: false, error: 'Project name is required' };
        }
        if (workItem.project.length > 200) {
            return { valid: false, error: 'Project name is too long' };
        }
        if (workItem.technology && typeof workItem.technology !== 'string') {
            return { valid: false, error: 'Technology must be a string' };
        }
        if (workItem.achievement && typeof workItem.achievement !== 'string') {
            return { valid: false, error: 'Achievement must be a string' };
        }
        if (workItem.difficulty && typeof workItem.difficulty !== 'string') {
            return { valid: false, error: 'Difficulty must be a string' };
        }
        if (workItem.projectProgress !== undefined) {
            const progress = Number(workItem.projectProgress);
            if (isNaN(progress) || progress < 0 || progress > 100) {
                return { valid: false, error: 'Progress must be between 0 and 100' };
            }
        }
        if (workItem.tags && !Array.isArray(workItem.tags)) {
            return { valid: false, error: 'Tags must be an array' };
        }
        return { valid: true };
    }

    // Export all data
    exportData() {
        try {
            const data = this.readData();
            const exportData = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                workItems: data
            };
            return exportData;
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    }

    // Import data
    importData(data) {
        try {
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format');
            }
            const currentData = this.readData();
            const mergedData = [...currentData, ...data];
            return this.writeData(mergedData);
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }

    readData() {
        try {
            if (fs.existsSync(dataFile)) {
                const data = fs.readFileSync(dataFile, 'utf-8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error(this.safeI18n('error.readData'), error);
        }
        return [];
    }

    writeData(data) {
        try {
            fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
            return true;
        } catch (error) {
            console.error(this.safeI18n('error.writeData'), error);
            return false;
        }
    }

    saveWorkItem(workItem) {
        const data = this.readData();
        
        workItem.id = Date.now().toString();
        workItem.createdAt = new Date().toISOString();
        if (!workItem.date) {
            workItem.date = new Date().toISOString(); 
        }
        
        data.push(workItem);
        return this.writeData(data);
    }

    updateWorkItem(workItemId, updatedData) {
        const data = this.readData();
        const index = data.findIndex(item => item.id === workItemId);
        
        if (index !== -1) {
            updatedData.updatedAt = new Date().toISOString();
            data[index] = { ...data[index], ...updatedData };
            return this.writeData(data);
        }
        return false;
    }

    deleteWorkItem(workItemId) {
        const data = this.readData();
        const filteredData = data.filter(item => item.id !== workItemId);
        
        if (filteredData.length < data.length) {
            return this.writeData(filteredData);
        }
        return false;
    }

    getWorkItems(filters = {}) {
        let data = this.readData();
        
        if (filters.startDate) {
            data = data.filter(item => item.date >= filters.startDate);
        }
        if (filters.endDate) {
            data = data.filter(item => item.date <= filters.endDate);
        }
        if (filters.project) {
            data = data.filter(item => 
                item.project.toLowerCase().includes(filters.project.toLowerCase())
            );
        }

        return data.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getStatistics(period = 'month') {
        const data = this.readData();
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

        const filteredData = data.filter(item => 
            new Date(item.date) >= startDate
        );

        return {
            totalItems: filteredData.length,
            projects: new Set(filteredData.map(item => item.project)).size,
            technologies: new Set(filteredData.map(item => item.technology)).size,
            achievements: filteredData.filter(item => item.achievement).length
        };
    }

    // internationalization helper for main process
    safeI18n(key, fallback = null, language = null) {
        try {
            const lang = language || this.getCurrentLanguage();
            return getTranslation(key, lang);
        } catch (error) {
            console.warn(`i18n error for key "${key}":`, error);
            return fallback || key;
        }
    }

   async getCurrentLanguage() {
        // get language from renderer process
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            try {
                const userLanguage = await this.mainWindow.webContents.executeJavaScript(`
                    (function() {
                        try {
                            return localStorage.getItem('app-language') || '';
                        } catch (e) {
                            return '';
                        }
                    })()
                `);
                
                if (userLanguage && (userLanguage === 'zh-CN' || userLanguage === 'en')) {
                    return userLanguage;
                }
            } catch (error) {
                console.warn('Failed to get language from renderer process:', error);
            }
        }
        
        // get language from environment variables
        const envLang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL;
        if (envLang) {
            if (envLang.startsWith('zh')) {
                return 'zh-CN';
            }
            return 'en';
        }
        
        // default to zh-CN if no language found
        return 'zh-CN';
    }

    generateReport(type, params) {
        const data = this.readData();
        let reportContent = '';
        let fileName = '';

        switch (type) {
            case 'daily':
                reportContent = this.generateDailyReport(data, params.date, params.language);
                fileName = `${this.safeI18n('reports.dailyReport', null, params.language)}_${params.date}.md`;
                break;
            case 'weekly':
                reportContent = this.generateWeeklyReport(data, params.startDate, params.language);
                fileName = `${this.safeI18n('reports.weeklyReport', null, params.language)}_${params.startDate}.md`;
                break;
            case 'monthly':
                reportContent = this.generateMonthlyReport(data, params.month, params.language);
                fileName = `${this.safeI18n('reports.monthlyReport', null, params.language)}_${params.month}.md`;
                break;
            case 'yearly':
                reportContent = this.generateYearlyReport(data, params.year, params.language);
                fileName = `${this.safeI18n('reports.yearlyReport', null, params.language)}_${params.year}.md`;
                break;
            case 'technical':
                reportContent = this.generateTechnicalReport(data, params.language);
                fileName = `${this.safeI18n('reports.technicalReport', null, params.language)}_${new Date().toISOString().split('T')[0]}.md`;
                break;
        }
        if (!fileName || fileName.trim() === '') {
            fileName = `report_${type}_${new Date().toISOString().split('T')[0]}.md`;
        }
        const reportPath = path.join(dataDir, fileName);
        fs.writeFileSync(reportPath, reportContent, 'utf-8');
        
        return reportContent;
    }

    generateDailyReport(data, date, language = null) {
        const dailyData = data.filter(item => item.date === date);
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const tomorrowPlan = data.filter(item => item.date === tomorrowStr && item.isPlan);
        
        return `# ${this.safeI18n('reports.dailyReport', null, language)} - ${date}

## ${this.safeI18n('reports.dailyOverview', null, language)}
- ${this.safeI18n('reports.totalWorkItems', null, language)}: ${dailyData.length} ${this.safeI18n('reports.items', null, language)}
- ${this.safeI18n('reports.involvedProjects', null, language)}: ${new Set(dailyData.map(item => item.project)).size} ${this.safeI18n('reports.projects', null, language)}
- ${this.safeI18n('reports.usedTechnologies', null, language)}: ${new Set(dailyData.map(item => item.technology)).size} ${this.safeI18n('reports.technologies', null, language)}
- ${this.safeI18n('reports.averageProjectProgress', null, language)}: ${this.calculateAverageProgress(dailyData)}%

## ${this.safeI18n('reports.dailyWorkContent', null, language)}
${dailyData.map((item, index) => `
### ${index + 1}. ${item.project}

**${this.safeI18n('reports.technologyStack', null, language)}**: ${item.technology || this.safeI18n('reports.notFilled', null, language)}

**${this.safeI18n('reports.difficulties', null, language)}**: ${item.difficulty || this.safeI18n('reports.none', null, language)}

**${this.safeI18n('reports.achievements', null, language)}**: ${item.achievement || this.safeI18n('reports.none', null, language)}

**${this.safeI18n('reports.projectProgress', null, language)}**: ${item.projectProgress || 0}%

**${this.safeI18n('reports.tags', null, language)}**: ${item.tags ? item.tags.join(', ') : this.safeI18n('reports.none', null, language)}
`).join('\n')}

## ${this.safeI18n('reports.tomorrowPlan', null, language)}
${tomorrowPlan.length > 0 ? tomorrowPlan.map(item => `
### ${item.project}
**${this.safeI18n('reports.planContent', null, language)}**: ${item.achievement || this.safeI18n('reports.none', null, language)}
**${this.safeI18n('reports.expectedDifficulties', null, language)}**: ${item.difficulty || this.safeI18n('reports.none', null, language)}
**${this.safeI18n('reports.targetProgress', null, language)}**: ${item.projectProgress || 0}%
`).join('\n') : this.safeI18n('reports.noTomorrowPlan', null, language)}

---
*${this.safeI18n('reports.generatedAt', null, language)}**: ${new Date().toLocaleString('zh-CN')}*`;
    }

    generateMonthlyReport(data, month, language = null) {
        const year = new Date().getFullYear();
        const monthStr = month.toString().padStart(2, '0');
        const monthlyData = data.filter(item => item.date.startsWith(`${year}-${monthStr}`));
        const stats = this.getStatistics('month');

        return `# ${year}${this.safeI18n('reports.year', null, language)}${month}${this.safeI18n('reports.month', null, language)}${this.safeI18n('reports.monthlySummary', null, language)}

## ${this.safeI18n('reports.monthlyOverview', null, language)}
- ${this.safeI18n('reports.totalWorkItems', null, language)}: ${stats.totalItems} ${this.safeI18n('reports.items', null, language)}
- ${this.safeI18n('reports.projectsInvolved', null, language)}: ${stats.projects} ${this.safeI18n('reports.items', null, language)}
- ${this.safeI18n('reports.usedTechnologies', null, language)}: ${stats.technologies} ${this.safeI18n('reports.technologies', null, language)}
- ${this.safeI18n('reports.importantAchievements', null, language)}: ${stats.achievements} ${this.safeI18n('reports.items', null, language)}
- ${this.safeI18n('reports.averageProjectProgress', null, language)}: ${this.calculateAverageProgress(monthlyData)}%

## ${this.safeI18n('reports.projectProgressStats', null, language)}
${this.getTopProjects(monthlyData, 10).map(proj => 
    `- ${proj.name}: ${proj.count} ${this.safeI18n('reports.workItems', null, language)}，${this.safeI18n('reports.progress', null, language)} ${this.getProjectProgress(monthlyData, proj.name)}%`
).join('\n')}

## ${this.safeI18n('reports.monthlyImportantAchievements')}
${monthlyData.filter(item => item.achievement).slice(0, 15).map((item, index) => 
    `${index + 1}. **${item.project}**: ${item.achievement} (${this.safeI18n('reports.progress', null, language)}: ${item.projectProgress || 0}%)`
).join('\n')}

---
*${this.safeI18n('reports.generatedAt', null, language)}: ${new Date().toLocaleString('zh-CN')}*`;
    }

    generateWeeklyReport(data, startDate, language = null) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        const endDateStr = endDate.toISOString().split('T')[0];
        
        const weeklyData = data.filter(item => 
            item.date >= startDate && item.date <= endDateStr
        );

        const stats = this.getStatistics('week');

        return `# ${this.safeI18n('reports.weeklyReport', null, language)} (${startDate} - ${endDateStr})

## ${this.safeI18n('reports.weeklyStats', null, language)}
- ${this.safeI18n('reports.totalWorkItems', null, language)}: ${stats.totalItems} ${this.safeI18n('reports.items', null, language)}
- ${this.safeI18n('reports.projectsInvolved', null, language)}: ${stats.projects} ${this.safeI18n('reports.items', null, language)}
- ${this.safeI18n('reports.usedTechnologies', null, language)}: ${stats.technologies} ${this.safeI18n('reports.technologies', null, language)}
- ${this.safeI18n('reports.achievements', null, language)}: ${stats.achievements} ${this.safeI18n('reports.items', null, language)}
- ${this.safeI18n('reports.averageProjectProgress', null, language)}: ${this.calculateAverageProgress(weeklyData)}%

## ${this.safeI18n('reports.projectDistribution', null, language)}
${Array.from(new Set(weeklyData.map(item => item.project))).map(project => 
    `- ${project}: ${weeklyData.filter(item => item.project === project).length} ${this.safeI18n('reports.items', null, language)}，${this.safeI18n('reports.progress', null, language)} ${this.getProjectProgress(weeklyData, project)}%`
).join('\n')}

---
*${this.safeI18n('reports.generatedAt', null, language)}: ${new Date().toLocaleString('zh-CN')}*`;
    }

    generateYearlyReport(data, year, language = null) {
        const yearlyData = data.filter(item => item.date.startsWith(year));
        const stats = this.getStatistics('year');

        return `# ${year}${this.safeI18n('reports.yearlySummary', null, language)}

## ${this.safeI18n('reports.yearlyOverview', null, language)}
- ${this.safeI18n('reports.totalWorkItems', null, language)}: ${stats.totalItems} ${this.safeI18n('reports.items', null, language)}
- ${this.safeI18n('reports.projectsInvolved', null, language)}: ${stats.projects} ${this.safeI18n('reports.items', null, language)}
- ${this.safeI18n('reports.masteredTechnologies', null, language)}: ${stats.technologies} ${this.safeI18n('reports.technologies', null, language)}
- ${this.safeI18n('reports.importantAchievements', null, language)}: ${stats.achievements} ${this.safeI18n('reports.items', null, language)}
- ${this.safeI18n('reports.averageProjectProgress', null, language)}: ${this.calculateAverageProgress(yearlyData)}%

## ${this.safeI18n('reports.projectContributionStats', null, language)}
${this.getTopProjects(yearlyData, 10).map(proj => 
    `- ${proj.name}: ${proj.count} ${this.safeI18n('reports.contributions', null, language)}，${this.safeI18n('reports.finalProgress', null, language)} ${this.getProjectProgress(yearlyData, proj.name)}%`
).join('\n')}

## ${this.safeI18n('reports.yearlyMajorAchievements', null, language)}
${yearlyData.filter(item => item.achievement).slice(0, 10).map((item, index) => 
    `${index + 1}. **${item.project}**: ${item.achievement} (${this.safeI18n('reports.progress')}: ${item.projectProgress || 0}%)`
).join('\n')}

---
*${this.safeI18n('reports.generatedAt', null, language)}: ${new Date().toLocaleString('zh-CN')}*`;
    }

    generateTechnicalReport(data, language = null) {
        const technologies = this.getTopTechnologies(data, 20);
        
        return `# ${this.safeI18n('reports.techCapabilityReport', null, language)}

## ${this.safeI18n('reports.techStackMastery', null, language)}
${technologies.map(tech => 
    `- **${tech.name}**: ${this.safeI18n('reports.applied', null, language)} ${tech.count} ${this.safeI18n('reports.times', null, language)}`
).join('\n')}

## ${this.safeI18n('reports.techPracticeCases', null, language)}
${data.filter(item => item.technology && item.achievement).slice(0, 15).map(item => `
### ${item.project} - ${item.technology}
**${this.safeI18n('reports.applicationScenarios', null, language)}**: ${item.achievement}

**${this.safeI18n('reports.technicalDifficulties', null, language)}**: ${item.difficulty || this.safeI18n('reports.notRecorded', null, language)}

**${this.safeI18n('reports.projectProgress', null, language)}**: ${item.projectProgress || 0}%
`).join('\n')}

---
*${this.safeI18n('reports.generatedAt', null, language)}: ${new Date().toLocaleString('zh-CN')}*`;
    }

    // tool methods
    calculateAverageProgress(data) {
        if (data.length === 0) return 0;
        const totalProgress = data.reduce((sum, item) => sum + (item.projectProgress || 0), 0);
        return Math.round(totalProgress / data.length);
    }

    getProjectProgress(data, projectName) {
        const projectItems = data.filter(item => item.project === projectName);
        if (projectItems.length === 0) return 0;
        return this.calculateAverageProgress(projectItems);
    }

    getTopProjects(data, limit) {
        const counts = {};
        data.forEach(item => {
            counts[item.project] = (counts[item.project] || 0) + 1;
        });
        return Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([name, count]) => ({ name, count }));
    }

    getTopTechnologies(data, limit) {
        const counts = {};
        data.forEach(item => {
            if (item.technology) {
                counts[item.technology] = (counts[item.technology] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([name, count]) => ({ name, count }));
    }
}

// start the application
new WorkTracker();