// Report generation module
function initReports() {
    console.log('Initialize report generation');
    initReportsEventListeners();
    loadReportTypes();
}

function initReportsEventListeners() {
    // Report type selection event
    const reportTypeSelect = document.getElementById('reportType');
    if (reportTypeSelect) {
        reportTypeSelect.addEventListener('change', updateReportParams);
    }
    
    // Generate report button event
    const generateBtn = document.getElementById('generateReportBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateReport);
    }
    
    // Download report button event
    const downloadBtn = document.getElementById('downloadReportBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadReport);
    }
}

function loadReportTypes() {
    const reportTypes = {
        'daily': window.i18n.t('reports.daily'),
        'weekly': window.i18n.t('reports.weekly'), 
        'monthly': window.i18n.t('reports.monthly'),
        'yearly': window.i18n.t('reports.yearly'),
        'technical': window.i18n.t('reports.tech')
    };
    
    const reportTypeSelect = document.getElementById('reportType');
    if (!reportTypeSelect) return;
    
    reportTypeSelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = window.i18n.t('reports.selectReportType');
    reportTypeSelect.appendChild(defaultOption);
    
    Object.entries(reportTypes).forEach(([value, text]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        reportTypeSelect.appendChild(option);
    });
    
    updateReportParams();
}

function updateReportParams() {
    const reportType = document.getElementById('reportType').value;
    const paramsContainer = document.getElementById('reportParams');
    
    if (!paramsContainer) return;
    
    let paramsHTML = '';
    
    switch (reportType) {
        case 'daily':
            paramsHTML = `
                <div class="form-group">
                    <label for="reportDate">${window.i18n.t('reports.reportDate')}</label>
                    <input type="date" id="reportDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>
            `;
            break;
        case 'weekly':
            const monday = getMonday(new Date());
            paramsHTML = `
                <div class="form-group">
                    <label for="reportStartDate">${window.i18n.t('reports.weekStartDate')}</label>
                    <input type="date" id="reportStartDate" class="form-control" value="${monday}">
                </div>
            `;
            break;
        case 'monthly':
            const currentMonth = new Date().getMonth() + 1;
            paramsHTML = `
                <div class="form-group">
                    <label for="reportMonth">${window.i18n.t('reports.month')}</label>
                    <input type="number" id="reportMonth" class="form-control" min="1" max="12" value="${currentMonth}">
                </div>
            `;
            break;
        case 'yearly':
            const currentYear = new Date().getFullYear();
            paramsHTML = `
                <div class="form-group">
                    <label for="reportYear">${window.i18n.t('reports.year')}</label>
                    <input type="number" id="reportYear" class="form-control" min="2020" max="2030" value="${currentYear}">
                </div>
            `;
            break;
        case 'technical':
            paramsHTML = `<p>${window.i18n.t('reports.techReportNoParams')}</p>`;
            break;
    }
    
    paramsContainer.innerHTML = paramsHTML;
}

function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    let params = {};
    
    try {
        switch (reportType) {
            case 'daily':
                params.date = document.getElementById('reportDate').value;
                break;
            case 'weekly':
                params.startDate = document.getElementById('reportStartDate').value;
                break;
            case 'monthly':
                params.month = parseInt(document.getElementById('reportMonth').value);
                break;
            case 'yearly':
                params.year = parseInt(document.getElementById('reportYear').value);
                break;
            case 'technical':
                // No parameters needed
                break;
        }
        
        let reportContent = '';
        if (window.electronAPI) {
            params.language = window.i18n.currentLang;
            reportContent = await window.electronAPI.generateReport(reportType, params);
        } else {
            reportContent = await mockGenerateReport(reportType, params);
        }
        
        // Show report preview
        const previewCard = document.getElementById('reportPreviewCard');
        const preview = document.getElementById('reportPreview');
        if (previewCard && preview) {
            preview.innerHTML = reportContent.replace(/\n/g, '<br>');
            previewCard.style.display = 'block';
        }
        
        // Show download button
        const downloadBtn = document.getElementById('downloadReportBtn');
        if (downloadBtn) {
            downloadBtn.style.display = 'inline-block';
            downloadBtn.dataset.content = reportContent;
            downloadBtn.dataset.filename = getReportFileName(reportType, params);
        }
        
        app.showAlert(window.i18n.t('reports.generateSuccess'), 'success');
        
    } catch (error) {
        console.error('Generate report failed:', error);
        app.showAlert(window.i18n.t('reports.generateFailed') + error.message, 'error');
    }
}

function getReportFileName(type, params) {
    const names = {
        'daily': `${window.i18n.t('reports.dailyReport')}_${params.date}.md`,
        'weekly': `${window.i18n.t('reports.weeklyReport')}_${params.startDate}.md`,
        'monthly': `${window.i18n.t('reports.monthlyReport')}_${params.month}.md`,
        'yearly': `${params.year}${window.i18n.t('reports.yearlySummary')}.md`,
        'technical': `${window.i18n.t('reports.techReport')}_${new Date().toISOString().split('T')[0]}.md`
    };
    return names[type] || 'report.md';
}

function downloadReport() {
    const btn = document.getElementById('downloadReportBtn');
    if (!btn || !btn.dataset.content) {
        app.showAlert(window.i18n.t('reports.generateFirst'), 'warning');
        return;
    }
    
    const content = btn.dataset.content;
    const filename = btn.dataset.filename;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    app.showAlert(window.i18n.t('reports.downloadSuccess'), 'success');
}

// Mock report generation function
async function mockGenerateReport(type, params) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const data = JSON.parse(localStorage.getItem('workData') || '[]');
            let reportContent = '';
            
            switch (type) {
                case 'daily':
                    reportContent = mockGenerateDailyReport(data, params.date);
                    break;
                case 'weekly':
                    reportContent = mockGenerateWeeklyReport(data, params.startDate);
                    break;
                case 'monthly':
                    reportContent = mockGenerateMonthlyReport(data, params.month);
                    break;
                case 'yearly':
                    reportContent = mockGenerateYearlyReport(data, params.year);
                    break;
                case 'technical':
                    reportContent = mockGenerateTechnicalReport(data);
                    break;
            }
            
            resolve(reportContent);
        }, 1000);
    });
}

function mockGenerateDailyReport(data, date) {
    // Fix date matching logic to support full time format
    const dailyData = data.filter(item => {
        const itemDate = item.date.split('T')[0]; // Only compare date part
        return itemDate === date;
    });
    
    return `# ${window.i18n.t('reports.daily')} - ${date}

## ${window.i18n.t('reports.dailyOverview')}
- ${window.i18n.t('reports.totalWorkItems')}: ${dailyData.length}
- ${window.i18n.t('reports.projectsInvolved')}: ${new Set(dailyData.map(item => item.project)).size}
- ${window.i18n.t('reports.totalWorkHours')}: ${dailyData.length * 2} ${window.i18n.t('reports.hoursEstimate')}

## ${window.i18n.t('reports.detailedWorkContent')}
${dailyData.length > 0 ? dailyData.map((item, index) => `
### ${index + 1}. ${item.project}
**${window.i18n.t('reports.time')}**: ${formatDateTime(item.date)}
**${window.i18n.t('reports.technologyStack')}**: ${item.technology || window.i18n.t('reports.notFilled')}
**${window.i18n.t('reports.workContent')}**: ${item.achievement || window.i18n.t('reports.noDescription')}
**${window.i18n.t('reports.projectProgress')}**: ${item.projectProgress || 0}%
**${window.i18n.t('reports.difficultiesSolutions')}**: ${item.difficulty || window.i18n.t('reports.none')}
**${window.i18n.t('reports.tags')}**: ${item.tags ? item.tags.join(', ') : window.i18n.t('reports.none')}
`).join('\n') : window.i18n.t('reports.noWorkToday')}

## ${window.i18n.t('reports.techUsageToday')}
${Array.from(new Set(dailyData.map(item => item.technology).filter(Boolean))).map(tech => 
    `- ${tech}: ${dailyData.filter(item => item.technology === tech).length} ${window.i18n.t('reports.timesUsed')}`
).join('\n')}

---
*${window.i18n.t('reports.generatedAt')}: ${new Date().toLocaleString('zh-CN')}*`;
}

// New weekly report generation function
function mockGenerateWeeklyReport(data, startDate) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const weeklyData = data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
    });
    
    const endDateStr = end.toISOString().split('T')[0];
    
    return `# ${window.i18n.t('reports.weekly')} - ${startDate} ${window.i18n.t('reports.to')} ${endDateStr}

## ${window.i18n.t('reports.weeklyOverview')}
- ${window.i18n.t('reports.totalWorkItems')}: ${weeklyData.length}
- ${window.i18n.t('reports.projectsInvolved')}: ${new Set(weeklyData.map(item => item.project)).size}
- ${window.i18n.t('reports.totalWorkHours')}: ${weeklyData.length * 2} ${window.i18n.t('reports.hoursEstimate')}

## ${window.i18n.t('reports.detailedWorkContent')}
${weeklyData.length > 0 ? weeklyData.map((item, index) => `
### ${index + 1}. ${item.project}
**${window.i18n.t('reports.date')}**: ${item.date.split('T')[0]}
**${window.i18n.t('reports.technologyStack')}**: ${item.technology || window.i18n.t('notFilled')}
**${window.i18n.t('reports.workContent')}**: ${item.achievement || window.i18n.t('noDescription')}
**${window.i18n.t('reports.projectProgress')}**: ${item.projectProgress || 0}%
**${window.i18n.t('reports.difficultiesSolutions')}**: ${item.difficulty || window.i18n.t('reports.none')}
**${window.i18n.t('reports.tags')}**: ${item.tags ? item.tags.join(', ') : window.i18n.t('reports.none')}
`).join('\n') : window.i18n.t('reports.noWorkThisWeek')}

## ${window.i18n.t('reports.techUsageThisWeek')}
${Array.from(new Set(weeklyData.map(item => item.technology).filter(Boolean))).map(tech => 
    `- ${tech}: ${weeklyData.filter(item => item.technology === tech).length} ${window.i18n.t('reports.timesUsed')}`
).join('\n')}

## ${window.i18n.t('reports.projectProgressThisWeek')}
${Array.from(new Set(weeklyData.map(item => item.project))).map(project => {
    const projectData = weeklyData.filter(item => item.project === project);
    const latestProgress = projectData.reduce((max, item) => Math.max(max, item.projectProgress || 0), 0);
    return `- ${project}: ${projectData.length} ${window.i18n.t('reports.workItems')}，${window.i18n.t('reports.currentProgress')} ${latestProgress}%`;
}).join('\n')}

---
*${window.i18n.t('reports.generatedAt')}: ${new Date().toLocaleString('zh-CN')}*`;
}

// New yearly report generation function
function mockGenerateYearlyReport(data, year) {
    const yearlyData = data.filter(item => item.date.startsWith(year));
    
    return `# ${year} ${window.i18n.t('reports.yearlySummary')}

## ${window.i18n.t('reports.yearlyOverview')}
- ${window.i18n.t('reports.totalWorkItems')}: ${yearlyData.length} ${window.i18n.t('reports.items')}
- ${window.i18n.t('reports.projectsInvolved')}: ${new Set(yearlyData.map(item => item.project)).size} ${window.i18n.t('reports.items')}
- ${window.i18n.t('reports.totalWorkHours')}: ${yearlyData.length * 2} ${window.i18n.t('reports.hoursEstimate')}

## ${window.i18n.t('reports.monthlyWorkDistribution')}
${Array.from({length: 12}, (_, i) => {
    const month = i + 1;
    const monthStr = month.toString().padStart(2, '0');
    const monthData = yearlyData.filter(item => item.date.startsWith(`${year}-${monthStr}`));
    return `- ${month}${window.i18n.t('reports.month')}: ${monthData.length} ${window.i18n.t('reports.workItems')}`;
}).join('\n')}

## ${window.i18n.t('reports.projectContributionStats')}
${Array.from(new Set(yearlyData.map(item => item.project))).map(project => {
    const projectData = yearlyData.filter(item => item.project === project);
    const latestProgress = projectData.reduce((max, item) => Math.max(max, item.projectProgress || 0), 0);
    return `- ${project}: ${projectData.length} ${window.i18n.t('reports.records')}，${window.i18n.t('reports.finalProgress')} ${latestProgress}%`;
}).join('\n')}

## ${window.i18n.t('reports.techCapabilitySummary')}
${Array.from(new Set(yearlyData.map(item => item.technology).filter(Boolean))).map(tech => {
    const techData = yearlyData.filter(item => item.technology === tech);
    return `- ${tech}: ${techData.length} ${window.i18n.t('reports.timesApplied')}，${window.i18n.t('reports.involving')} ${new Set(techData.map(item => item.project)).size} ${window.i18n.t('reports.projects')}`;
}).join('\n')}

## ${window.i18n.t('reports.yearlyHighlights')}
${yearlyData.filter(item => item.projectProgress >= 80).map(item => 
    `- ${item.project}: ${window.i18n.t('reports.completion')} ${item.projectProgress}%，${item.achievement || window.i18n.t('reports.significantProgress')}`
).join('\n') || window.i18n.t('reports.noHighCompletionProjects')}

---
*${window.i18n.t('reports.generatedAt')}: ${new Date().toLocaleString('zh-CN')}*`;
}

// New monthly report function
function mockGenerateMonthlyReport(data, month) {
    const year = new Date().getFullYear();
    const monthStr = month.toString().padStart(2, '0');
    const monthlyData = data.filter(item => item.date.startsWith(`${year}-${monthStr}`));
    
    return `# ${year}${window.i18n.t('reports.year')}${month} ${window.i18n.t('reports.monthlySummary')}

## ${window.i18n.t('reports.monthlyOverview')}
- ${window.i18n.t('reports.totalWorkItems')}: ${monthlyData.length} ${window.i18n.t('reports.items')}
- ${window.i18n.t('reports.projectsInvolved')}: ${new Set(monthlyData.map(item => item.project)).size} ${window.i18n.t('reports.items')}
- ${window.i18n.t('reports.totalWorkHours')}: ${monthlyData.length * 2} ${window.i18n.t('reports.hoursEstimate')}

## ${window.i18n.t('reports.detailedWorkContent')}
${monthlyData.length > 0 ? monthlyData.map((item, index) => `
### ${index + 1}. ${item.project}
**${window.i18n.t('reports.date')}**: ${item.date.split('T')[0]}
**${window.i18n.t('reports.technologyStack')}**: ${item.technology || window.i18n.t('reports.notFilled')}
**${window.i18n.t('reports.workContent')}**: ${item.achievement || window.i18n.t('reports.noDescription')}
**${window.i18n.t('reports.projectProgress')}**: ${item.projectProgress || 0}%
**${window.i18n.t('reports.difficultiesSolutions')}**: ${item.difficulty || window.i18n.t('reports.none')}
**${window.i18n.t('reports.tags')}**: ${item.tags ? item.tags.join(', ') : window.i18n.t('reports.none')}
`).join('\n') : window.i18n.t('reports.noWorkThisMonth')}

## ${window.i18n.t('reports.monthlyProjectProgress')}
${Array.from(new Set(monthlyData.map(item => item.project))).map(project => {
    const projectData = monthlyData.filter(item => item.project === project);
    const latestProgress = projectData.reduce((max, item) => Math.max(max, item.projectProgress || 0), 0);
    const progressChange = projectData.length > 1 ? 
        ` (${window.i18n.t('reports.thisMonthImprovement')} ${latestProgress - projectData[0].projectProgress}%)` : '';
    return `- ${project}: ${projectData.length} ${window.i18n.t('reports.workItems')}，${window.i18n.t('reports.currentProgress')} ${latestProgress}%${progressChange}`;
}).join('\n')}

## ${window.i18n.t('reports.monthlyTechUsage')}
${Array.from(new Set(monthlyData.map(item => item.technology).filter(Boolean))).map(tech => 
    `- ${tech}: ${monthlyData.filter(item => item.technology === tech).length} ${window.i18n.t('reports.timesUsed')}`
).join('\n')}

## ${window.i18n.t('reports.monthlyHighlights')}
${monthlyData.filter(item => item.projectProgress >= 80).map(item => 
    `- ${item.project}: ${window.i18n.t('reports.completion')} ${item.projectProgress}%，${item.achievement || window.i18n.t('reports.significantProgress')}`
).join('\n') || window.i18n.t('reports.noHighCompletionProjectsThisMonth')}

---
*${window.i18n.t('reports.generatedAt')}: ${new Date().toLocaleString('zh-CN')}*`;
}

// Enhanced yearly summary report
function mockGenerateYearlyReport(data, year) {
    const yearlyData = data.filter(item => item.date.startsWith(year));
    
    return `# ${year} ${window.i18n.t('reports.yearlySummary')}

## ${window.i18n.t('reports.yearlyOverview')}
- ${window.i18n.t('reports.totalWorkItems')}: ${yearlyData.length} ${window.i18n.t('reports.items')}
- ${window.i18n.t('reports.projectsInvolved')}: ${new Set(yearlyData.map(item => item.project)).size} ${window.i18n.t('reports.items')}
- ${window.i18n.t('reports.totalWorkHours')}: ${yearlyData.length * 2} ${window.i18n.t('reports.hoursEstimate')}
- ${window.i18n.t('reports.averageMonthlyWork')}: ${Math.round(yearlyData.length / 12)} ${window.i18n.t('reports.items')}

## ${window.i18n.t('reports.monthlyDistribution')}
${Array.from({length: 12}, (_, i) => {
    const month = i + 1;
    const monthStr = month.toString().padStart(2, '0');
    const monthData = yearlyData.filter(item => item.date.startsWith(`${year}-${monthStr}`));
    const progressSum = monthData.reduce((sum, item) => sum + (item.projectProgress || 0), 0);
    const avgProgress = monthData.length > 0 ? Math.round(progressSum / monthData.length) : 0;
    return `- ${month}${window.i18n.t('reports.month')}: ${monthData.length} ${window.i18n.t('reports.workItems')}，${window.i18n.t('reports.averageProgress')} ${avgProgress}%`;
}).join('\n')}

## ${window.i18n.t('reports.projectContributionStatistics')}
${Array.from(new Set(yearlyData.map(item => item.project))).map(project => {
    const projectData = yearlyData.filter(item => item.project === project);
    const latestProgress = projectData.reduce((max, item) => Math.max(max, item.projectProgress || 0), 0);
    const firstDate = projectData.reduce((min, item) => Math.min(min, new Date(item.date)), Infinity);
    const lastDate = projectData.reduce((max, item) => Math.max(max, new Date(item.date)), 0);
    return `- ${project}: ${projectData.length} ${window.i18n.t('reports.records')}，${window.i18n.t('reports.finalProgress')} ${latestProgress}%，${window.i18n.t('reports.timeSpan')} ${new Date(firstDate).toISOString().split('T')[0]} ${window.i18n.t('reports.to')} ${new Date(lastDate).toISOString().split('T')[0]}`;
}).join('\n')}

## ${window.i18n.t('reports.technicalCapabilitySummary')}
${Array.from(new Set(yearlyData.map(item => item.technology).filter(Boolean))).map(tech => {
    const techData = yearlyData.filter(item => item.technology === tech);
    const projects = new Set(techData.map(item => item.project));
    const months = new Set(techData.map(item => item.date.substring(0, 7)));
    return `- ${tech}: ${techData.length} ${window.i18n.t('reports.timesApplied')}，${window.i18n.t('reports.involving')} ${projects.size} ${window.i18n.t('reports.projects')}，${window.i18n.t('reports.activeIn')} ${months.size} ${window.i18n.t('reports.months')}`;
}).join('\n')}

## ${window.i18n.t('reports.yearlyHighlights')}
${yearlyData.filter(item => item.projectProgress >= 80).map(item => 
    `- ${item.project}: ${window.i18n.t('reports.completion')} ${item.projectProgress}%，${item.achievement || window.i18n.t('reports.significantProgress')}`
).slice(0, 10).join('\n') || window.i18n.t('reports.noHighCompletionProjectsThisYear')}

## ${window.i18n.t('reports.yearlyGrowthAnalysis')}
- ${window.i18n.t('reports.techStackExpansion')}: ${Array.from(new Set(yearlyData.map(item => item.technology).filter(Boolean))).length} ${window.i18n.t('reports.technologies')}
- ${window.i18n.t('reports.projectExperience')}: ${new Set(yearlyData.map(item => item.project)).size} ${window.i18n.t('reports.projects')}
- ${window.i18n.t('reports.workContinuity')}: ${new Set(yearlyData.map(item => item.date.substring(0, 7))).size} ${window.i18n.t('reports.activeMonths')}

---
*${window.i18n.t('reports.generatedAt')}: ${new Date().toLocaleString('zh-CN')}*`;
}

// Enhanced technical capability report
function mockGenerateTechnicalReport(data) {
    const technologies = {};
    
    data.forEach(item => {
        if (item.technology) {
            const techList = item.technology.split(',').map(tech => tech.trim());
            techList.forEach(tech => {
                if (tech) {
                    if (!technologies[tech]) {
                        technologies[tech] = {
                            count: 0,
                            projects: new Set(),
                            items: [],
                            months: new Set()
                        };
                    }
                    technologies[tech].count++;
                    technologies[tech].projects.add(item.project);
                    technologies[tech].items.push(item);
                    technologies[tech].months.add(item.date.substring(0, 7));
                }
            });
        }
    });
    
    return `# ${window.i18n.t('reports.techCapabilityReport')}

## ${window.i18n.t('reports.techStackUsageStats')}
${Object.entries(technologies).sort((a, b) => b[1].count - a[1].count).map(([tech, info]) => `
### ${tech}
- ${window.i18n.t('reports.usageCount')}: ${info.count} ${window.i18n.t('reports.times')}
- ${window.i18n.t('reports.projectsInvolved')}: ${Array.from(info.projects).join(', ')}
- ${window.i18n.t('reports.activeMonths')}: ${info.months.size} ${window.i18n.t('reports.months')}
- ${window.i18n.t('reports.applicationScenarios')}:
${info.items.slice(0, 8).map(item => `  - ${item.date.split('T')[0]} ${item.project}: ${item.achievement || window.i18n.t('reports.noDescription')} (${window.i18n.t('reports.progress')}: ${item.projectProgress || 0}%)`).join('\n')}
${info.items.length > 8 ? `  - ... ${window.i18n.t('reports.moreScenarios')} ${info.items.length - 8} ${window.i18n.t('reports.applicationScenarios')}` : ''}
`).join('\n')}

## ${window.i18n.t('reports.techGrowthAnalysis')}
${Object.entries(technologies).map(([tech, info]) => {
    const dates = info.items.map(item => new Date(item.date));
    const firstUse = new Date(Math.min(...dates));
    const lastUse = new Date(Math.max(...dates));
    const monthsDiff = (lastUse.getFullYear() - firstUse.getFullYear()) * 12 + (lastUse.getMonth() - firstUse.getMonth());
    return `- ${tech}: ${window.i18n.t('reports.firstUse')} ${firstUse.toISOString().split('T')[0]}, ${window.i18n.t('reports.lastUse')} ${lastUse.toISOString().split('T')[0]}, ${window.i18n.t('reports.usageDuration')} ${monthsDiff + 1} ${window.i18n.t('reports.months')}`;
}).join('\n')}

## ${window.i18n.t('reports.techCapabilityAssessment')}
${Object.entries(technologies).map(([tech, info]) => {
    let proficiency;
    if (info.count >= 20) proficiency = window.i18n.t('reports.proficient');
    else if (info.count >= 10) proficiency = window.i18n.t('reports.proficient');
    else if (info.count >= 5) proficiency = window.i18n.t('reports.master');
    else proficiency = window.i18n.t('reports.understand');
    
    const projectCount = info.projects.size;
    const monthCount = info.months.size;
    
    return `- ${tech}: ${proficiency} (${window.i18n.t('reports.used')} ${info.count} ${window.i18n.t('reports.times')}，${projectCount} ${window.i18n.t('reports.projects')}，${monthCount} ${window.i18n.t('reports.months')})`;
}).join('\n')}

## ${window.i18n.t('reports.techActiveTrend')}
${Object.entries(technologies).sort((a, b) => b[1].months.size - a[1].months.size).map(([tech, info]) => {
    const recentMonths = Array.from(info.months).sort().slice(-3);
    return `- ${tech}: ${window.i18n.t('reports.recentlyActive')} ${recentMonths.join(', ')}`;
}).join('\n')}

---
*${window.i18n.t('reports.generatedAt')}: ${new Date().toLocaleString('zh-CN')}*`;
}