// R&D Estimation Module
(function() {
    const STORAGE_KEY = 'rd_estimation_manager';
    let currentProjectId = null;
    
    const i18n = {
        zh: {
            title: '研发评估', tabProjects: '项目管理', tabSchedule: '研发周期', tabBom: '硬件成本', tabLabor: '人力成本', tabArchive: '存档',
            projectListTitle: '项目列表', btnNewProject: '新建项目', btnExportProject: '导出Excel', btnImportProject: '导入Excel', noProjectText: '暂无项目', labelEstimationDate: '评估日期', totalManDays: '总人天',
            projectDetailTitle: '成本汇总', detailManDays: '总人天', detailScheduleCost: '周期成本', detailBomCost: '硬件成本', detailLaborCost: '人力成本', detailTotalCost: '总成本',
            scheduleTitle: '研发周期', btnAddTask: '添加任务', btnCalc: '计算排期', btnMoveUp: '上移', btnMoveDown: '下移', totalDays: '总周期(天)', totalManDays: '总人天',
            bomTitle: '硬件成本', btnAddBom: '添加物料', bomTotal: '物料成本', bomGrandTotal: '总成本',
            laborTitle: '人力成本', btnAddLabor: '添加人力', laborTotal: '人力总计', archiveTitle: '项目存档',
            projectModalTitle: '新建项目', editProjectModalTitle: '编辑项目', labelProjectName: '项目名称 *', labelCustomer: '客户', labelProjectType: '项目类型', labelStatus: '状态', labelRemark: '备注',
            statusEvaluating: '评估中', statusDeveloping: '开发中', statusCompleted: '完成', btnSaveProject: '保存', btnCancel: '取消', btnDelete: '删除', btnArchive: '归档',
            taskModalTitle: '添加任务', labelTaskName: '任务名称 *', labelTaskDesc: '需求说明', labelPreTask: '前置任务', labelPerson: '负责人', labelManDay: '人天', labelDuration: '持续天数', btnSaveTask: '保存',
            bomModalTitle: '添加物料', labelPartName: '物料名称 *', labelModel: '型号', labelPrice: '单价(¥)', labelQty: '数量', btnSaveBom: '保存',
            laborModalTitle: '添加人力', labelRole: '角色 *', labelLaborPerson: '负责人', labelLaborUsePerson: '使用研发周期负责人', labelLaborManDay: '人天', labelLaborPrice: '单价(¥/天)', labelLaborDefaultRate: '设为默认单价', btnSaveLabor: '保存',
            selectProject: '选择项目', taskId: 'ID', taskName: '任务名称', preTask: '前置', person: '负责人', manDay: '人天', duration: '天数', startDay: '开始', endDay: '结束',
            partName: '物料', model: '型号', price: '单价', qty: '数量', cost: '成本', role: '角色', laborManDay: '人天', laborPrice: '单价', laborCost: '成本',
            projectName: '项目', customer: '客户', type: '类型', status: '状态', action: '操作', edit: '编辑', delete: '删除', confirmDelete: '确定删除?',
            noTasks: '暂无任务', noBoms: '暂无物料', noLabor: '暂无人力', noArchive: '暂无存档', days: '天', msgImportSuccess: '导入成功'
        },
        en: {
            title: 'R&D Estimation', tabProjects: 'Projects', tabSchedule: 'Schedule', tabBom: 'Hardware', tabLabor: 'Labor', tabArchive: 'Archive',
            projectListTitle: 'Project List', btnNewProject: 'New Project', btnExportProject: 'Export Excel', btnImportProject: 'Import Excel', noProjectText: 'No projects', labelEstimationDate: 'Est. Date', totalManDays: 'Total Man-Days',
            projectDetailTitle: 'Cost Summary', detailManDays: 'Man-Days', detailScheduleCost: 'Schedule', detailBomCost: 'Hardware', detailLaborCost: 'Labor', detailTotalCost: 'Total',
            scheduleTitle: 'Schedule', btnAddTask: 'Add Task', btnCalc: 'Calculate', btnMoveUp: 'Up', btnMoveDown: 'Down', totalDays: 'Total Days', totalManDays: 'Man-Days',
            bomTitle: 'Hardware Cost', btnAddBom: 'Add Material', bomTotal: 'Material', bomGrandTotal: 'Total',
            laborTitle: 'Labor Cost', btnAddLabor: 'Add Labor', laborTotal: 'Labor Total', archiveTitle: 'Archive',
            projectModalTitle: 'New Project', editProjectModalTitle: 'Edit Project', labelProjectName: 'Name *', labelCustomer: 'Customer', labelProjectType: 'Type', labelStatus: 'Status', labelRemark: 'Remark',
            statusEvaluating: 'Evaluating', statusDeveloping: 'Developing', statusCompleted: 'Completed', btnSaveProject: 'Save', btnCancel: 'Cancel', btnDelete: 'Delete', btnArchive: 'Archive',
            taskModalTitle: 'Add Task', labelTaskName: 'Task Name *', labelTaskDesc: 'Requirements', labelPreTask: 'Predecessor', labelPerson: 'Person', labelManDay: 'Man-Days', labelDuration: 'Duration', btnSaveTask: 'Save',
            bomModalTitle: 'Add Material', labelPartName: 'Material Name *', labelModel: 'Model', labelPrice: 'Price(¥)', labelQty: 'Qty', btnSaveBom: 'Save',
            laborModalTitle: 'Add Labor', labelRole: 'Role *', labelLaborPerson: 'Person', labelLaborUsePerson: 'Use Schedule Person', labelLaborManDay: 'Man-Days', labelLaborPrice: 'Price(¥/Day)', labelLaborDefaultRate: 'Set as default rate', btnSaveLabor: 'Save',
            selectProject: 'Select Project', taskId: 'ID', taskName: 'Task Name', preTask: 'Pre', person: 'Person', manDay: 'Man-Days', duration: 'Days', startDay: 'Start', endDay: 'End',
            partName: 'Material', model: 'Model', price: 'Price', qty: 'Qty', cost: 'Cost', role: 'Role', laborManDay: 'Man-Days', laborPrice: 'Price', laborCost: 'Cost',
            projectName: 'Project', customer: 'Customer', type: 'Type', status: 'Status', action: 'Action', edit: 'Edit', delete: 'Delete', confirmDelete: 'Confirm delete?',
            noTasks: 'No tasks', noBoms: 'No materials', noLabor: 'No labor', noArchive: 'No archive', days: 'days', msgImportSuccess: 'Import successful'
        }
    };
    
    let t = i18n.zh;
    
    function getData() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : { projects: [], tasks: [], boms: [], labor: [] };
    }
    
    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    
    function init() {
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) {
            t = langSelect.value === 'en' ? i18n.en : i18n.zh;
        }
        renderEstimation();
    }
    
    function renderEstimation() {
        const container = document.getElementById('estimationContent');
        if (!container) return;
        
        container.innerHTML = '<style>' +
            '.est-tabs{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}' +
            '.est-tab{padding:10px 20px;background:#e9ecef;border:none;border-radius:5px;cursor:pointer}' +
            '.est-tab.active{background:#0d6efd;color:#fff}' +
            '.est-card{background:#fff;border-radius:8px;padding:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.1)}' +
            '.est-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;flex-wrap:wrap;gap:10px}' +
            '.est-title{font-size:18px;font-weight:600}' +
            '.est-btn{padding:8px 16px;border:none;border-radius:5px;cursor:pointer;font-size:14px}' +
            '.est-btn-primary{background:#0d6efd;color:#fff}' +
            '.est-btn-success{background:#198754;color:#fff}' +
            '.est-btn-danger{background:#dc3545;color:#fff}' +
            '.est-btn-secondary{background:#6c757d;color:#fff}' +
            '.est-form-group{margin-bottom:15px}' +
            '.est-form-group label{display:block;margin-bottom:5px;font-weight:500}' +
            '.est-form-group input,.est-form-group select,.est-form-group textarea{width:100%;padding:8px;border:1px solid #ddd;border-radius:5px}' +
            '.est-table{width:100%;border-collapse:collapse}' +
            '.est-table th,.est-table td{padding:10px;text-align:left;border-bottom:1px solid #eee}' +
            '.est-table th{background:#f8f9fa;font-weight:600}' +
            '.est-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:15px;margin-bottom:20px}' +
            '.est-stat{background:#fff;padding:15px;border-radius:8px;text-align:center;box-shadow:0 2px 5px rgba(0,0,0,0.08)}' +
            '.est-stat-value{font-size:20px;font-weight:700;color:#0d6efd}' +
            '.est-stat-label{font-size:12px;color:#666;margin-top:5px}' +
            '.est-project-item{display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #eee;border-radius:8px;margin-bottom:10px;cursor:pointer}' +
            '.est-project-item:hover{border-color:#0d6efd}' +
            '.est-project-item.active{border-color:#0d6efd;background:#f0f7ff}' +
            '.est-status{padding:4px 8px;border-radius:12px;font-size:12px}' +
            '.est-status-evaluating{background:#fff3cd;color:#856404}' +
            '.est-status-developing{background:#cfe2ff;color:#084298}' +
            '.est-status-completed{background:#d1e7dd;color:#0f5132}' +
            '.est-modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000}' +
            '.est-modal.active{display:flex;align-items:center;justify-content:center}' +
            '.est-modal-content{background:#fff;border-radius:10px;padding:20px;width:90%;max-width:450px;max-height:90vh;overflow-y:auto}' +
            '.est-modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}' +
            '.est-modal-close{background:0;border:none;font-size:24px;cursor:pointer}' +
            '.est-empty{text-align:center;padding:40px;color:#999}' +
            '.est-gantt{overflow-x:auto;padding:10px 0}' +
            '.est-gantt-row{display:flex;align-items:center;margin-bottom:8px}' +
            '.est-gantt-label{width:100px;font-size:12px;flex-shrink:0}' +
            '.est-gantt-bar-container{flex:1;height:20px;background:#f0f0f0;border-radius:4px;position:relative}' +
            '.est-gantt-bar{position:absolute;height:100%;background:#0d6efd;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px}' +
            '.est-actions{display:flex;gap:5px;flex-wrap:wrap}' +
            '.est-select{padding:8px;border:1px solid #ddd;border-radius:5px;margin-bottom:15px;width:100%;max-width:300px}' +
            '</style>' +
            
            '<div class="est-tabs">' +
            '<button class="est-tab active" data-section="projects" onclick="window.estimation.showSection(\'projects\')">' + t.tabProjects + '</button>' +
            '<button class="est-tab" data-section="schedule" onclick="window.estimation.showSection(\'schedule\')">' + t.tabSchedule + '</button>' +
            '<button class="est-tab" data-section="bom" onclick="window.estimation.showSection(\'bom\')">' + t.tabBom + '</button>' +
            '<button class="est-tab" data-section="labor" onclick="window.estimation.showSection(\'labor\')">' + t.tabLabor + '</button>' +
            '<button class="est-tab" data-section="archive" onclick="window.estimation.showSection(\'archive\')">' + t.tabArchive + '</button>' +
            '</div>' +
            
            '<div id="est-section-projects">' +
            '<div class="est-card"><div class="est-header"><span class="est-title">' + t.projectListTitle + '</span><div class="est-actions"><button class="est-btn est-btn-primary" onclick="window.estimation.openProjectModal()">' + t.btnNewProject + '</button><button class="est-btn est-btn-success" onclick="window.estimation.exportSelectedProject()">' + t.btnExportProject + '</button><button class="est-btn est-btn-secondary" onclick="window.estimation.importProjects()">' + t.btnImportProject + '</button></div></div>' +
            '<select id="est-project-select" class="est-select" onchange="currentProjectId=this.value;window.estimation.selectProject(this.value)"><option value="">' + t.selectProject + '</option></select>' +
            '<div id="est-project-list"></div></div>' +
            '<div class="est-card" id="est-project-detail" style="display:none"><div class="est-header"><span class="est-title">' + t.projectDetailTitle + '</span></div>' +
            '<div class="est-stats">' +
            '<div class="est-stat"><div class="est-stat-value" id="est-detail-man-days">0</div><div class="est-stat-label">' + t.detailManDays + '</div></div>' +
            '<div class="est-stat"><div class="est-stat-value" id="est-detail-schedule-cost">¥0</div><div class="est-stat-label">' + t.detailScheduleCost + '</div></div>' +
            '<div class="est-stat"><div class="est-stat-value" id="est-detail-bom-cost">¥0</div><div class="est-stat-label">' + t.detailBomCost + '</div></div>' +
            '<div class="est-stat"><div class="est-stat-value" id="est-detail-labor-cost">¥0</div><div class="est-stat-label">' + t.detailLaborCost + '</div></div>' +
            '<div class="est-stat" style="background:#0d6efd;color:#fff"><div class="est-stat-value" id="est-detail-total-cost" style="color:#fff">¥0</div><div class="est-stat-label" style="color:rgba(255,255,255,0.8)">' + t.detailTotalCost + '</div></div>' +
            '</div></div></div>' +
            
            '<div id="est-section-schedule" style="display:none">' +
            '<div class="est-card"><div class="est-header"><span class="est-title">' + t.scheduleTitle + '</span><div class="est-actions"><button class="est-btn est-btn-primary" onclick="window.estimation.openTaskModal()">' + t.btnAddTask + '</button><button class="est-btn est-btn-success" onclick="window.estimation.calculateSchedule()">' + t.btnCalc + '</button></div></div>' +
            '<select id="est-schedule-project" class="est-select" onchange="currentProjectId=this.value;window.estimation.renderSchedule()"><option value="">' + t.selectProject + '</option></select>' +
            '<div class="est-stats"><div class="est-stat"><div class="est-stat-value" id="est-total-days">0</div><div class="est-stat-label">' + t.totalDays + '</div></div><div class="est-stat"><div class="est-stat-value" id="est-total-man-days">0</div><div class="est-stat-label">' + t.totalManDays + '</div></div></div>' +
            '<div id="est-task-table"></div><div class="est-gantt" id="est-gantt-chart"></div></div></div>' +
            
            '<div id="est-section-bom" style="display:none">' +
            '<div class="est-card"><div class="est-header"><span class="est-title">' + t.bomTitle + '</span><div class="est-actions"><button class="est-btn est-btn-primary" onclick="window.estimation.openBomModal()">' + t.btnAddBom + '</button><button class="est-btn est-btn-secondary" onclick="window.estimation.importBom()">' + t.btnImportProject + '</button><button class="est-btn est-btn-success" onclick="window.estimation.exportBom()">' + t.btnExportProject + '</button></div></div>' +
            '<select id="est-bom-project" class="est-select" onchange="currentProjectId=this.value;window.estimation.renderBom()"><option value="">' + t.selectProject + '</option></select>' +
            '<div id="est-bom-table"></div><div class="est-stats"><div class="est-stat"><div class="est-stat-value" id="est-bom-total">¥0</div><div class="est-stat-label">' + t.bomTotal + '</div></div><div class="est-stat"><div class="est-stat-value" id="est-bom-grand-total">¥0</div><div class="est-stat-label">' + t.bomGrandTotal + '</div></div></div></div></div>' +
            
            '<div id="est-section-labor" style="display:none">' +
            '<div class="est-card"><div class="est-header"><span class="est-title">' + t.laborTitle + '</span><button class="est-btn est-btn-primary" onclick="window.estimation.openLaborModal()">' + t.btnAddLabor + '</button></div>' +
            '<select id="est-labor-project" class="est-select" onchange="currentProjectId=this.value;window.estimation.renderLabor()"><option value="">' + t.selectProject + '</option></select>' +
            '<div id="est-labor-table"></div><div class="est-stats"><div class="est-stat"><div class="est-stat-value" id="est-labor-total">¥0</div><div class="est-stat-label">' + t.laborTotal + '</div></div></div></div></div>' +
            
            '<div id="est-section-archive" style="display:none"><div class="est-card"><div class="est-header"><span class="est-title">' + t.archiveTitle + '</span></div><div id="est-archive-list"></div></div></div>' +
            
            // Project Modal
            '<div class="est-modal" id="est-project-modal"><div class="est-modal-content"><div class="est-modal-header"><h3 id="est-project-modal-title">' + t.projectModalTitle + '</h3><button class="est-modal-close" onclick="window.estimation.closeModal(\'est-project-modal\')">&times;</button></div>' +
            '<form onsubmit="window.estimation.saveProject(event)"><input type="hidden" id="est-project-id">' +
            '<div class="est-form-group"><label>' + t.labelProjectName + '</label><input type="text" id="est-project-name" required></div>' +
            '<div class="est-form-group"><label>' + t.labelCustomer + '</label><input type="text" id="est-project-customer"></div>' +
            '<div class="est-form-group"><label>' + t.labelProjectType + '</label><select id="est-project-type" onchange="window.estimation.toggleProjectTypeCustom()"><option value="MCU">MCU</option><option value="Linux">Linux</option><option value="Java">Java</option><option value="C#">C#</option><option value="Python">Python</option><option value="前端">前端</option><option value="硬件">硬件</option><option value="其他">其他</option><option value="custom">自定义...</option></select><input type="text" id="est-project-type-custom" placeholder="输入自定义类型" style="display:none;margin-top:5px"></div>' +
            '<div class="est-form-group"><label>' + t.labelStatus + '</label><select id="est-project-status"><option value="evaluating">' + t.statusEvaluating + '</option><option value="developing">' + t.statusDeveloping + '</option><option value="completed">' + t.statusCompleted + '</option></select></div>' +
            '<div class="est-form-group"><label>' + t.labelRemark + '</label><textarea id="est-project-remark"></textarea></div>' +
            '<div class="est-actions"><button type="submit" class="est-btn est-btn-primary">' + t.btnSaveProject + '</button><button type="button" class="est-btn est-btn-secondary" onclick="window.estimation.closeModal(\'est-project-modal\')">' + t.btnCancel + '</button><button type="button" class="est-btn est-btn-danger" onclick="window.estimation.deleteProject()" id="est-btn-delete" style="display:none">' + t.btnDelete + '</button></div></form></div></div>' +
            
            // Task Modal
            '<div class="est-modal" id="est-task-modal"><div class="est-modal-content"><div class="est-modal-header"><h3>' + t.taskModalTitle + '</h3><button class="est-modal-close" onclick="window.estimation.closeModal(\'est-task-modal\')">&times;</button></div>' +
            '<form onsubmit="window.estimation.saveTask(event)"><input type="hidden" id="est-task-id">' +
            '<div class="est-form-group"><label>' + t.labelTaskName + '</label><input type="text" id="est-task-name" required></div>' +
            '<div class="est-form-group"><label>' + t.labelTaskDesc + '</label><textarea id="est-task-desc" rows="2"></textarea></div>' +
            '<div class="est-form-group"><label>' + t.labelPreTask + '</label><input type="text" id="est-task-pretask" placeholder="T1,T2"></div>' +
            '<div class="est-form-group"><label>' + t.labelPerson + '</label><input type="text" id="est-task-person"></div>' +
            '<div class="est-form-group"><label>' + t.labelManDay + '</label><input type="number" id="est-task-manday" min="1" value="1"></div>' +
            '<div class="est-form-group"><label>' + t.labelDuration + '</label><input type="number" id="est-task-duration" min="1" value="1"></div>' +
            '<div class="est-actions"><button type="submit" class="est-btn est-btn-primary">' + t.btnSaveTask + '</button><button type="button" class="est-btn est-btn-secondary" onclick="window.estimation.closeModal(\'est-task-modal\')">' + t.btnCancel + '</button></div></form></div></div>' +
            
            // BOM Modal
            '<div class="est-modal" id="est-bom-modal"><div class="est-modal-content"><div class="est-modal-header"><h3>' + t.bomModalTitle + '</h3><button class="est-modal-close" onclick="window.estimation.closeModal(\'est-bom-modal\')">&times;</button></div>' +
            '<form onsubmit="window.estimation.saveBom(event)"><input type="hidden" id="est-bom-id">' +
            '<div class="est-form-group"><label>' + t.labelPartName + '</label><input type="text" id="est-bom-partname" required></div>' +
            '<div class="est-form-group"><label>' + t.labelModel + '</label><input type="text" id="est-bom-model"></div>' +
            '<div class="est-form-group"><label>' + t.labelPrice + '</label><input type="number" id="est-bom-price" min="0" step="0.01"></div>' +
            '<div class="est-form-group"><label>' + t.labelQty + '</label><input type="number" id="est-bom-qty" min="1" value="1"></div>' +
            '<div class="est-actions"><button type="submit" class="est-btn est-btn-primary">' + t.btnSaveBom + '</button><button type="button" class="est-btn est-btn-secondary" onclick="window.estimation.closeModal(\'est-bom-modal\')">' + t.btnCancel + '</button></div></form></div></div>' +
            
            // Labor Modal
            '<div class="est-modal" id="est-labor-modal"><div class="est-modal-content"><div class="est-modal-header"><h3>' + t.laborModalTitle + '</h3><button class="est-modal-close" onclick="window.estimation.closeModal(\'est-labor-modal\')">&times;</button></div>' +
            '<form onsubmit="window.estimation.saveLabor(event)"><input type="hidden" id="est-labor-id">' +
            '<div class="est-form-group"><label><input type="checkbox" id="est-labor-use-person" checked onchange="window.estimation.toggleLaborPersonField()"> ' + t.labelLaborUsePerson + '</label></div>' +
            '<div class="est-form-group"><label>' + t.labelRole + '</label><select id="est-labor-role"><option value="硬件">硬件</option><option value="MCU">MCU</option><option value="Linux">Linux</option><option value="Java">Java</option><option value="测试">测试</option><option value="其他">其他</option></select></div>' +
            '<div class="est-form-group" id="est-labor-person-group" style="display:none"><label>' + t.labelLaborPerson + '</label><select id="est-labor-person"></select></div>' +
            '<div class="est-form-group"><label>' + t.labelLaborManDay + '</label><input type="number" id="est-labor-manday" min="1" value="1"></div>' +
            '<div class="est-form-group"><label>' + t.labelLaborPrice + '</label><input type="number" id="est-labor-price" min="0" value="1200"></div>' +
            '<div class="est-form-group"><label><input type="checkbox" id="est-labor-default-rate"> ' + t.labelLaborDefaultRate + '</label></div>' +
            '<div class="est-actions"><button type="submit" class="est-btn est-btn-primary">' + t.btnSaveLabor + '</button><button type="button" class="est-btn est-btn-secondary" onclick="window.estimation.closeModal(\'est-labor-modal\')">' + t.btnCancel + '</button></div></form></div></div>';
        
        window.estimation.renderProjectList();
        window.estimation.renderProjectSelects();
    }
    
    window.estimation = {
        showSection: function(section) {
            document.querySelectorAll('.est-tab').forEach(function(tb) { tb.classList.remove('active'); });
            document.querySelector('.est-tab[data-section="' + section + '"]').classList.add('active');
            document.querySelectorAll('[id^="est-section-"]').forEach(function(s) { s.style.display = 'none'; });
            document.getElementById('est-section-' + section).style.display = 'block';
            if (section === 'schedule') this.renderSchedule();
            if (section === 'bom') this.renderBom();
            if (section === 'labor') this.renderLabor();
            if (section === 'archive') this.renderArchive();
        },
        
        renderProjectSelects: function() {
            var data = getData();
            var opts = '<option value="">' + t.selectProject + '</option>' + data.projects.map(function(p) { return '<option value="' + p.id + '">' + p.name + '</option>'; }).join('');
            var projectSelect = document.getElementById('est-project-select');
            if (projectSelect) {
                projectSelect.innerHTML = opts;
                projectSelect.value = currentProjectId || '';
                projectSelect.onchange = function() {
                    currentProjectId = this.value;
                    window.estimation.selectProject(this.value);
                };
            }
            var scheduleSelect = document.getElementById('est-schedule-project');
            if (scheduleSelect) {
                scheduleSelect.innerHTML = opts;
                scheduleSelect.value = currentProjectId || '';
                scheduleSelect.onchange = function() {
                    currentProjectId = this.value;
                    window.estimation.renderSchedule();
                };
            }
            var bomSelect = document.getElementById('est-bom-project');
            if (bomSelect) {
                bomSelect.innerHTML = opts;
                bomSelect.value = currentProjectId || '';
                bomSelect.onchange = function() {
                    currentProjectId = this.value;
                    window.estimation.renderBom();
                };
            }
            var laborSelect = document.getElementById('est-labor-project');
            if (laborSelect) {
                laborSelect.innerHTML = opts;
                laborSelect.value = currentProjectId || '';
                laborSelect.onchange = function() {
                    currentProjectId = this.value;
                    window.estimation.renderLabor();
                };
            }
        },
        
        renderProjectList: function() {
            var data = getData();
            var list = document.getElementById('est-project-list');
            if (!list) return;
            if (data.projects.length === 0) {
                list.innerHTML = '<div class="est-empty">' + t.noProjectText + '</div>';
                return;
            }
            list.innerHTML = data.projects.map(function(p) {
                var statusClass = p.status === 'evaluating' ? 'est-status-evaluating' : p.status === 'developing' ? 'est-status-developing' : 'est-status-completed';
                var statusText = p.status === 'evaluating' ? t.statusEvaluating : p.status === 'developing' ? t.statusDeveloping : t.statusCompleted;
                return '<div class="est-project-item ' + (currentProjectId === p.id ? 'active' : '') + '" onclick="window.estimation.selectProject(\'' + p.id + '\')">' +
                    '<div><strong>' + p.name + '</strong><div style="font-size:12px;color:#666">' + (p.customer || '') + ' | ' + p.type + '</div></div>' +
                    '<div class="est-actions">' +
                    '<span class="est-status ' + statusClass + '">' + statusText + '</span>' +
                    '<button class="est-btn est-btn-secondary" onclick="event.stopPropagation();window.estimation.openProjectModal(\'' + p.id + '\')">' + t.edit + '</button>' +
                    '<button class="est-btn est-btn-success" onclick="event.stopPropagation();window.estimation.archiveProject(\'' + p.id + '\')">' + t.btnArchive + '</button>' +
                    '<button class="est-btn est-btn-danger" onclick="event.stopPropagation();window.estimation.confirmDeleteProject(\'' + p.id + '\')">' + t.delete + '</button>' +
                    '</div></div>';
            }).join('');
            this.renderProjectCostSummary();
        },
        
        selectProject: function(id) {
            currentProjectId = id;
            // Update project select dropdown
            var select = document.getElementById('est-project-select');
            if (select) {
                select.value = id;
            }
            // Refresh UI
            this.renderProjectList();
            this.renderProjectSelects();
            // Calculate schedule first, then show cost
            this.calculateSchedule();
            // Small delay to ensure schedule is calculated before showing cost
            setTimeout(function() {
                window.estimation.renderProjectCostSummary();
            }, 50);
        },
        
        renderProjectCostSummary: function() {
            if (!currentProjectId) {
                document.getElementById('est-project-detail').style.display = 'none';
                return;
            }
            var data = getData();
            var tasks = data.tasks.filter(function(t) { return t.projectId === currentProjectId; });
            var boms = data.boms.filter(function(b) { return b.projectId === currentProjectId; });
            var labors = data.labor.filter(function(l) { return l.projectId === currentProjectId; });
            
            var bomMaterialCost = boms.reduce(function(sum, b) { return sum + (b.price * b.qty); }, 0);
            var bomCost = bomMaterialCost * 1.15;
            
            // Calculate labor cost: each person (人天 * 单价)
            // If person has labor rate defined, use it; otherwise use default rate
            var defaultRate = parseFloat(localStorage.getItem('rd_default_labor_rate')) || 1200;
            
            // Group tasks by person and sum their man-days
            var personManDays = {};
            tasks.forEach(function(t) {
                var person = t.person || '通用';
                if (!personManDays[person]) {
                    personManDays[person] = 0;
                }
                personManDays[person] += (t.manDay || 0);
            });
            
            // Calculate labor cost: person man-days * person rate
            var laborCost = 0;
            Object.keys(personManDays).forEach(function(person) {
                var manDays = personManDays[person];
                var rate = defaultRate;
                
                // Find if this person has a labor rate defined
                var laborEntry = labors.find(function(l) { 
                    return l.person && l.person.toLowerCase() === person.toLowerCase(); 
                });
                
                if (laborEntry) {
                    rate = laborEntry.price || defaultRate;
                } else {
                    // Check if there's a "通用" (generic) labor entry
                    var genericLabor = labors.find(function(l) { 
                        return !l.person || l.person === '通用' || l.person === '其他'; 
                    });
                    if (genericLabor) {
                        rate = genericLabor.price || defaultRate;
                    }
                }
                
                laborCost += manDays * rate;
            });
            
            // Total = labor cost + BOM cost
            var totalCost = laborCost + bomCost;
            
            var totalManDays = tasks.reduce(function(sum, t) { return sum + (t.manDay || 0); }, 0);
            
            document.getElementById('est-detail-man-days').textContent = totalManDays;
            document.getElementById('est-detail-schedule-cost').textContent = '¥' + laborCost.toFixed(0);
            document.getElementById('est-detail-bom-cost').textContent = '¥' + bomCost.toFixed(0);
            document.getElementById('est-detail-labor-cost').textContent = '-';
            document.getElementById('est-detail-total-cost').textContent = '¥' + totalCost.toFixed(0);
            document.getElementById('est-project-detail').style.display = 'block';
        },
        
        // Calculate project cost - triggers schedule calc first then shows cost
        calculateProjectCost: function() {
            // First calculate schedule
            this.calculateSchedule();
            // Then render cost summary
            this.renderProjectCostSummary();
        },
        
        // Toggle project type custom input
        toggleProjectTypeCustom: function() {
            var typeSelect = document.getElementById('est-project-type');
            var customInput = document.getElementById('est-project-type-custom');
            if (typeSelect.value === 'custom') {
                customInput.style.display = 'block';
                customInput.focus();
            } else {
                customInput.style.display = 'none';
            }
        },
        
        openProjectModal: function(projectId) {
            var data = getData();
            var project = projectId ? data.projects.find(function(p) { return p.id === projectId; }) : null;
            document.getElementById('est-project-modal-title').textContent = project ? t.editProjectModalTitle : t.projectModalTitle;
            document.getElementById('est-project-id').value = project ? project.id : '';
            document.getElementById('est-project-name').value = project ? project.name : '';
            document.getElementById('est-project-customer').value = project ? project.customer : '';
            
            // Handle project type - check if it's a known type or custom
            var typeValue = project ? project.type : 'MCU';
            var knownTypes = ['MCU', 'Linux', 'Java', 'C#', 'Python', '前端', '硬件', '其他'];
            if (knownTypes.indexOf(typeValue) === -1) {
                document.getElementById('est-project-type').value = 'custom';
                document.getElementById('est-project-type-custom').style.display = 'block';
                document.getElementById('est-project-type-custom').value = typeValue;
            } else {
                document.getElementById('est-project-type').value = typeValue;
                document.getElementById('est-project-type-custom').style.display = 'none';
            }
            
            document.getElementById('est-project-status').value = project ? project.status : 'evaluating';
            document.getElementById('est-project-remark').value = project ? project.remark : '';
            document.getElementById('est-btn-delete').style.display = project ? 'inline-block' : 'none';
            document.getElementById('est-project-modal').classList.add('active');
        },
        
        saveProject: function(e) {
            e.preventDefault();
            var data = getData();
            var id = document.getElementById('est-project-id').value;
            var existing = id ? data.projects.find(function(p) { return p.id === id; }) : null;
            
            // Handle project type - use custom value if custom is selected
            var typeSelect = document.getElementById('est-project-type');
            var customInput = document.getElementById('est-project-type-custom');
            var typeValue = typeSelect.value === 'custom' ? customInput.value : typeSelect.value;
            
            var project = {
                id: id || 'P' + Date.now(),
                name: document.getElementById('est-project-name').value,
                customer: document.getElementById('est-project-customer').value,
                type: typeValue,
                status: document.getElementById('est-project-status').value,
                remark: document.getElementById('est-project-remark').value,
                createTime: existing ? existing.createTime : new Date().toISOString()
            };
            if (id) {
                var idx = data.projects.findIndex(function(p) { return p.id === id; });
                data.projects[idx] = project;
            } else {
                data.projects.push(project);
            }
            saveData(data);
            this.closeModal('est-project-modal');
            currentProjectId = project.id;
            this.renderProjectList();
            this.renderProjectSelects();
        },
        
        deleteProject: function() {
            if (!confirm(t.confirmDelete)) return;
            var data = getData();
            var id = document.getElementById('est-project-id').value;
            data.projects = data.projects.filter(function(p) { return p.id !== id; });
            data.tasks = data.tasks.filter(function(t) { return t.projectId !== id; });
            data.boms = data.boms.filter(function(b) { return b.projectId !== id; });
            data.labor = data.labor.filter(function(l) { return l.projectId !== id; });
            saveData(data);
            this.closeModal('est-project-modal');
            currentProjectId = null;
            this.renderProjectList();
            this.renderProjectSelects();
        },
        
        confirmDeleteProject: function(id) {
            if (!confirm(t.confirmDelete)) return;
            var data = getData();
            data.projects = data.projects.filter(function(p) { return p.id !== id; });
            data.tasks = data.tasks.filter(function(t) { return t.projectId !== id; });
            data.boms = data.boms.filter(function(b) { return b.projectId !== id; });
            data.labor = data.labor.filter(function(l) { return l.projectId !== id; });
            saveData(data);
            if (currentProjectId === id) currentProjectId = null;
            this.renderProjectList();
            this.renderProjectSelects();
        },
        
        archiveProject: function(id) {
            var data = getData();
            var project = data.projects.find(function(p) { return p.id === id; });
            if (project) {
                project.status = 'completed';
                saveData(data);
                this.renderProjectList();
            }
        },
        
        closeModal: function(id) {
            document.getElementById(id).classList.remove('active');
        },
        
        // Schedule
        renderSchedule: function() {
            var data = getData();
            var pid = currentProjectId || (document.getElementById('est-schedule-project') || {}).value;
            var table = document.getElementById('est-task-table');
            if (!table) return;
            if (!pid) {
                table.innerHTML = '<div class="est-empty">' + t.selectProject + '</div>';
                document.getElementById('est-gantt-chart').innerHTML = '';
                return;
            }
            var tasks = data.tasks.filter(function(t) { return t.projectId === pid; });
            if (tasks.length === 0) {
                table.innerHTML = '<div class="est-empty">' + t.noTasks + '</div>';
                document.getElementById('est-gantt-chart').innerHTML = '';
                return;
            }
            table.innerHTML = '<table class="est-table"><thead><tr><th>' + t.taskId + '</th><th>' + t.taskName + '</th><th>' + t.labelTaskDesc + '</th><th>' + t.preTask + '</th><th>' + t.person + '</th><th>' + t.manDay + '</th><th>' + t.duration + '</th><th>' + t.startDay + '</th><th>' + t.endDay + '</th><th>' + t.action + '</th></tr></thead><tbody>' + 
                tasks.map(function(task, index) { return '<tr><td>' + task.id + '</td><td>' + task.name + '</td><td>' + (task.description || '-') + '</td><td>' + (task.preTask || '-') + '</td><td>' + (task.person || '-') + '</td><td>' + task.manDay + '</td><td>' + task.duration + '</td><td>' + (task.startDay === null || task.startDay === undefined ? '-' : task.startDay) + '</td><td>' + (task.endDay === null || task.endDay === undefined ? '-' : task.endDay) + '</td><td><button class="est-btn est-btn-secondary" style="padding:4px 8px;font-size:12px" onclick="window.estimation.moveTask(\'' + task.id + '\', -1)">' + t.btnMoveUp + '</button><button class="est-btn est-btn-secondary" style="padding:4px 8px;font-size:12px" onclick="window.estimation.moveTask(\'' + task.id + '\', 1)">' + t.btnMoveDown + '</button><button class="est-btn est-btn-secondary" style="padding:4px 8px;font-size:12px" onclick="window.estimation.openTaskModal(\'' + task.id + '\')">' + t.edit + '</button><button class="est-btn est-btn-danger" style="padding:4px 8px;font-size:12px" onclick="window.estimation.deleteTask(\'' + task.id + '\')">' + t.delete + '</button></td></tr>'; }).join('') + '</tbody></table>';
            
            var totalDays = tasks.reduce(function(sum, task) { return Math.max(sum, task.endDay || 0); }, 0);
            var totalManDays = tasks.reduce(function(sum, task) { return sum + (task.manDay || 0); }, 0);
            document.getElementById('est-total-days').textContent = totalDays;
            document.getElementById('est-total-man-days').textContent = totalManDays;
            
            this.renderGantt(tasks);
        },
        
        renderGantt: function(tasks) {
            var chart = document.getElementById('est-gantt-chart');
            if (!chart) return;
            var hasAnyStart = tasks.some(function(t) { return t.startDay !== null && t.startDay !== undefined; });
            var maxDay = Math.max.apply(null, tasks.map(function(t) { return t.endDay || 0; }));
            if (maxDay === 0) { chart.innerHTML = ''; return; }
            
            // Ensure minimum width for visibility
            var minWidth = 3; // minimum percentage
            
            var html = '';
            tasks.forEach(function(task) {
                if (!task.startDay || !task.endDay) return;
                var left = ((task.startDay - 1) / maxDay * 100);
                var width = ((task.endDay - task.startDay + 1) / maxDay * 100);
                // Apply minimum width
                if (width < minWidth) { width = minWidth; }
                html += '<div class="est-gantt-row"><div class="est-gantt-label" title="' + task.name + ' (' + task.person + ')">' + task.id + ' ' + task.name + '</div><div class="est-gantt-bar-container"><div class="est-gantt-bar" style="left:' + left + '%;width:' + width + '%">' + task.duration + t.days + '</div></div></div>';
            });
            chart.innerHTML = html;
        },
        
        calculateSchedule: function() {
            var pid = currentProjectId || (document.getElementById('est-schedule-project') || {}).value;
            if (!pid) return;
            var data = getData();
            var tasks = data.tasks.filter(function(t) { return t.projectId === pid; });
            if (tasks.length === 0) return;
            
            // Sort tasks by ID to ensure consistent order (T1, T2, T3...)
            tasks.sort(function(a, b) {
                var idA = a.id.replace(/\D/g, '');
                var idB = b.id.replace(/\D/g, '');
                return (parseInt(idA) || 0) - (parseInt(idB) || 0);
            });
            
            var taskMap = {};
            tasks.forEach(function(t) { t.startDay = null; t.endDay = null; taskMap[t.id.trim()] = t; });
            
            // Calculate start and end days based on predecessors
            tasks.forEach(function(task) {
                var trimmedId = task.id.trim();
                var predecessors = [];
                if (task.preTask) {
                    predecessors = task.preTask.split(',').map(function(p) { return p.trim(); }).filter(function(p) { return p; });
                }
                
                var startDay = 1;
                
                if (predecessors.length > 0) {
                    var maxPreEnd = 0;
                    var hasValidPredecessor = false;
                    
                    predecessors.forEach(function(preId) {
                        // If predecessor is self, skip it
                        if (preId.trim() === trimmedId) return;
                        
                        var preTask = taskMap[preId.trim()];
                        if (preTask && preTask.endDay) {
                            hasValidPredecessor = true;
                            maxPreEnd = Math.max(maxPreEnd, preTask.endDay);
                        }
                    });
                    
                    // If all predecessors are self or invalid, look at other tasks
                    if (!hasValidPredecessor || maxPreEnd === 0) {
                        tasks.forEach(function(t) {
                            if (t.id.trim() !== trimmedId && t.endDay) {
                                maxPreEnd = Math.max(maxPreEnd, t.endDay);
                            }
                        });
                    }
                    
                    startDay = maxPreEnd + 1;
                }
                
                var duration = parseInt(task.duration || task.manDay || 1);
                task.startDay = startDay;
                task.endDay = startDay + duration - 1;
            });
            
            var otherTasks = data.tasks.filter(function(t) { return t.projectId !== pid; });
            data.tasks = otherTasks.concat(tasks);
            saveData(data);
            this.renderSchedule();
        },
        
        openTaskModal: function(taskId) {
            var pid = currentProjectId || (document.getElementById('est-schedule-project') || {}).value;
            if (!pid && !taskId) { alert(t.selectProject); return; }
            
            // If editing existing task, load its data
            if (taskId) {
                var data = getData();
                var task = data.tasks.find(function(t) { return t.id === taskId; });
                if (task) {
                    document.getElementById('est-task-id').value = task.id || '';
                    document.getElementById('est-task-name').value = task.name || '';
                    document.getElementById('est-task-pretask').value = task.preTask || '';
                    document.getElementById('est-task-person').value = task.person || '';
                    document.getElementById('est-task-manday').value = task.manDay || 1;
                    document.getElementById('est-task-duration').value = task.duration || task.manDay || 1;
                    document.getElementById('est-task-desc').value = task.description || '';
                    document.getElementById('est-task-modal').classList.add('active');
                    return;
                }
            }
            
            // New task - reset form
            document.getElementById('est-task-id').value = '';
            document.getElementById('est-task-name').value = '';
            document.getElementById('est-task-pretask').value = '';
            document.getElementById('est-task-person').value = '';
            document.getElementById('est-task-manday').value = '1';
            document.getElementById('est-task-duration').value = '1';
            document.getElementById('est-task-desc').value = '';
            document.getElementById('est-task-modal').classList.add('active');
        },
        
        saveTask: function(e) {
            e.preventDefault();
            var data = getData();
            var pid = currentProjectId || (document.getElementById('est-schedule-project') || {}).value;
            var id = document.getElementById('est-task-id').value;
            var manDay = parseInt(document.getElementById('est-task-manday').value) || 1;
            var duration = parseInt(document.getElementById('est-task-duration').value) || manDay;
            var taskNum = id || 'T' + (data.tasks.filter(function(t) { return t.projectId === pid; }).length + 1);
            var task = {
                id: taskNum,
                projectId: pid,
                name: document.getElementById('est-task-name').value,
                preTask: document.getElementById('est-task-pretask').value,
                person: document.getElementById('est-task-person').value,
                manDay: manDay,
                duration: duration,
                description: document.getElementById('est-task-desc').value
            };
            if (id) {
                var idx = data.tasks.findIndex(function(t) { return t.id === id; });
                data.tasks[idx] = task;
            } else {
                data.tasks.push(task);
            }
            saveData(data);
            this.closeModal('est-task-modal');
            this.renderSchedule();
        },
        
        // Move task up or down
        moveTask: function(taskId, direction) {
            var pid = currentProjectId || (document.getElementById('est-schedule-project') || {}).value;
            if (!pid) return;
            var data = getData();
            var tasks = data.tasks.filter(function(t) { return t.projectId === pid; });
            var index = tasks.findIndex(function(t) { return t.id === taskId; });
            if (index === -1) return;
            
            var newIndex = index + direction;
            if (newIndex < 0 || newIndex >= tasks.length) return;
            
            // Swap tasks
            var temp = tasks[index];
            tasks[index] = tasks[newIndex];
            tasks[newIndex] = temp;
            
            // Rebuild task IDs
            tasks.forEach(function(t, i) {
                t.id = 'T' + (i + 1);
            });
            
            // Update data
            var otherTasks = data.tasks.filter(function(t) { return t.projectId !== pid; });
            data.tasks = otherTasks.concat(tasks);
            saveData(data);
            this.renderSchedule();
        },
        
        // Delete task
        deleteTask: function(taskId) {
            if (!confirm(t.confirmDelete)) return;
            var pid = currentProjectId || (document.getElementById('est-schedule-project') || {}).value;
            if (!pid) return;
            var data = getData();
            var tasks = data.tasks.filter(function(t) { return t.projectId === pid && t.id !== taskId; });
            
            // Rebuild task IDs
            tasks.forEach(function(t, i) {
                t.id = 'T' + (i + 1);
            });
            
            var otherTasks = data.tasks.filter(function(t) { return t.projectId !== pid; });
            data.tasks = otherTasks.concat(tasks);
            saveData(data);
            this.renderSchedule();
        },
        
        // Export selected project all data to CSV/Excel
        exportSelectedProject: function() {
            var pid = currentProjectId || (document.getElementById('est-project-select') || {}).value;
            if (!pid) {
                alert(t.selectProject);
                return;
            }
            
            var data = getData();
            var project = data.projects.find(function(p) { return p.id === pid });
            if (!project) {
                alert(t.noProjectText);
                return;
            }
            
            var tasks = data.tasks.filter(function(t) { return t.projectId === pid });
            var boms = data.boms.filter(function(b) { return b.projectId === pid });
            var labors = data.labor.filter(function(l) { return l.projectId === pid });
            
            // Calculate costs
            var totalManDays = tasks.reduce(function(sum, t) { return sum + (t.manDay || 0); }, 0);
            var scheduleCost = totalManDays * 1200;
            var bomMaterialCost = boms.reduce(function(sum, b) { return sum + (b.price * b.qty); }, 0);
            var bomCost = bomMaterialCost * 1.15;
            var laborCost = labors.reduce(function(sum, l) { return sum + (l.manDay * l.price); }, 0);
            var totalCost = scheduleCost + bomCost + laborCost;
            
            // Create CSV content
            var csv = '\uFEFF'; // BOM for UTF-8
            
            // Project Info Section
            csv += '==== PROJECT INFO ====\n';
            csv += t.projectName + ',' + t.customer + ',' + t.type + ',' + t.status + ',' + t.labelRemark + ',' + t.labelEstimationDate + '\n';
            csv += '"' + (project.name || '') + '","' + (project.customer || '') + '","' + (project.type || '') + '","' + (project.status || '') + '","' + (project.remark || '') + '","' + (project.createTime || '') + '"\n';
            csv += '\n';
            
            // Cost Summary Section
            csv += '==== COST SUMMARY ====\n';
            csv += t.detailManDays + ',' + t.detailScheduleCost + ',' + t.detailBomCost + ',' + t.detailLaborCost + ',' + t.detailTotalCost + '\n';
            csv += totalManDays + ',' + laborCost.toFixed(2) + ',' + bomCost.toFixed(2) + ',' + '0,' + totalCost.toFixed(2) + '\n';
            csv += '\n';
            
            // Tasks/Schedule Section
            if (tasks.length > 0) {
                csv += '==== ' + t.scheduleTitle + ' ====\n';
                csv += t.taskId + ',' + t.taskName + ',' + t.labelTaskDesc + ',' + t.preTask + ',' + t.person + ',' + t.manDay + ',' + t.duration + ',' + t.startDay + ',' + t.endDay + '\n';
                tasks.forEach(function(t) {
                    csv += '"' + (t.id || '') + '","' + (t.name || '') + '","' + (t.description || '') + '","' + (t.preTask || '') + '","' + (t.person || '') + '","' + (t.manDay || '') + '","' + (t.duration || '') + '","' + (t.startDay || '') + '","' + (t.endDay || '') + '"\n';
                });
                csv += '\n';
            }
            
            // BOM Section
            if (boms.length > 0) {
                csv += '==== ' + t.bomTitle + ' ====\n';
                csv += t.partName + ',' + t.model + ',' + t.price + ',' + t.qty + ',' + t.cost + '\n';
                boms.forEach(function(b) {
                    csv += '"' + (b.partName || '') + '","' + (b.model || '') + '","' + (b.price || 0) + '","' + (b.qty || 0) + '","' + ((b.price || 0) * (b.qty || 0)).toFixed(2) + '"\n';
                });
                csv += t.bomTotal + ',' + bomMaterialCost.toFixed(2) + '\n';
                csv += t.bomGrandTotal + ',' + bomCost.toFixed(2) + '\n';
                csv += '\n';
            }
            
            // Labor Section
            if (labors.length > 0) {
                csv += '==== ' + t.laborTitle + ' ====\n';
                csv += t.role + ',' + t.laborManDay + ',' + t.laborPrice + ',' + t.laborCost + '\n';
                labors.forEach(function(l) {
                    csv += '"' + (l.role || '') + '","' + (l.manDay || 0) + '","' + (l.price || 0) + '","' + ((l.manDay || 0) * (l.price || 0)).toFixed(2) + '"\n';
                });
                csv += t.laborTotal + ',' + laborCost.toFixed(2) + '\n';
            }
            
            var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = (project.name || 'project') + '-' + new Date().toISOString().split('T')[0] + '.csv';
            a.click();
            URL.revokeObjectURL(url);
        },
        
        // Import project data from CSV
        importProjects: function() {
            var self = this;
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv,.xlsx,.xls';
            
            input.onchange = function(e) {
                var file = e.target.files[0];
                if (!file) return;
                
                var reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        var text = event.target.result;
                        var lines = text.split('\n');
                        
                        if (lines.length < 2) {
                            alert('Invalid file format');
                            return;
                        }
                        
                        var data = getData();
                        var currentSection = '';
                        var importedProjectName = '';
                        
                        // Parse CSV line helper
                        var parseLine = function(line) {
                            var values = [];
                            var current = '';
                            var inQuotes = false;
                            for (var j = 0; j < line.length; j++) {
                                var char = line[j];
                                if (char === '"') {
                                    inQuotes = !inQuotes;
                                } else if (char === ',' && !inQuotes) {
                                    values.push(current.trim());
                                    current = '';
                                } else {
                                    current += char;
                                }
                            }
                            values.push(current.trim());
                            return values;
                        };
                        
                        // Find project info first - look for project name, customer, type
                        var importedProjectName = '';
                        var importedCustomer = '';
                        var importedType = '';
                        var importedStatus = '';
                        var importedRemark = '';
                        
                        // Simple pattern: find section with 项目 and 客户
                        for (var i = 0; i < lines.length; i++) {
                            var line = lines[i].trim();
                            if (!line) continue;
                            
                            // Check if this line has project data (项目,客户,类型)
                            if (line.indexOf('项目') !== -1 && line.indexOf('客户') !== -1) {
                                // Next line should be the data
                                if (i + 1 < lines.length) {
                                    var nextLine = lines[i + 1].trim();
                                    if (nextLine) {
                                        var values = parseLine(nextLine);
                                        if (values.length >= 1 && values[0]) {
                                            importedProjectName = values[0] || '';
                                            importedCustomer = values[1] || '';
                                            importedType = values[2] || 'MCU';
                                            importedStatus = values[3] || 'evaluating';
                                            importedRemark = values[4] || '';
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                        
                        // Check if project already exists
                        if (importedProjectName) {
                            var existingProject = data.projects.find(function(p) { 
                                return p.name && p.name.toLowerCase() === importedProjectName.toLowerCase(); 
                            });
                            if (existingProject) {
                                alert('项目名称 "' + importedProjectName + '" 已存在，无法导入。如需更新，请先删除现有项目。\n\nProject name already exists, cannot import. Please delete existing project first.');
                                return;
                            }
                        }
                        
                        // Create new project
                        var projectId = 'P' + Date.now() + Math.random().toString(36).substr(2, 9);
                        data.projects.push({
                            id: projectId,
                            name: importedProjectName || 'Imported Project',
                            customer: importedCustomer || '',
                            type: importedType || 'MCU',
                            status: importedStatus || 'evaluating',
                            remark: importedRemark || '',
                            createTime: new Date().toISOString()
                        });
                        
                        // Process each line - second pass
                        var inSchedule = false;
                        var inBoms = false;
                        var inLabor = false;
                        var isHeaderRow = false;
                        
                        for (var i = 0; i < lines.length; i++) {
                            var line = lines[i].trim();
                            if (!line) continue;
                            
                            // Check for section headers (both English and Chinese)
                            if (line.indexOf('====') !== -1) {
                                inSchedule = (line.indexOf('Schedule') !== -1 || line.indexOf('研发周期') !== -1);
                                inBoms = (line.indexOf('Hardware') !== -1 || line.indexOf('硬件成本') !== -1);
                                inLabor = (line.indexOf('Labor') !== -1 || line.indexOf('人力成本') !== -1);
                                isHeaderRow = false;
                                continue;
                            }
                            
                            // Skip header rows - check both Chinese and English
                            if (line.indexOf('ID') !== -1 || line.indexOf('任务名称') !== -1 ||
                                line.indexOf('物料') !== -1 || line.indexOf('型号') !== -1 ||
                                line.indexOf('角色') !== -1 || line.indexOf('人天') !== -1 ||
                                line.indexOf('总人天') !== -1 || line.indexOf('成本') !== -1 ||
                                line.indexOf('物料成本') !== -1 || line.indexOf('总成本') !== -1 ||
                                line.indexOf('人力总计') !== -1) {
                                isHeaderRow = true;
                                continue;
                            }
                            
                            var values = parseLine(line);
                            
                            // Skip empty or invalid rows
                            if (!values[0] || values[0].length < 1) continue;
                            
                            // Skip total/cost summary rows
                            if (values[0].indexOf('总计') !== -1 || values[0].indexOf('Total') !== -1 ||
                                values[0].indexOf('成本') !== -1 || values[0].indexOf('Cost') !== -1) {
                                continue;
                            }
                            
                            // Parse tasks - lines starting with T
                            if (inSchedule && values[0] && values[0].indexOf('T') === 0) {
                                data.tasks.push({
                                    id: values[0] || 'T' + (data.tasks.length + 1),
                                    projectId: projectId,
                                    name: values[1] || '',
                                    description: values[2] || '',
                                    preTask: values[3] || '',
                                    person: values[4] || '',
                                    manDay: parseInt(values[5]) || 1,
                                    duration: parseInt(values[6]) || parseInt(values[5]) || 1,
                                    startDay: values[7] ? parseInt(values[7]) : null,
                                    endDay: values[8] ? parseInt(values[8]) : null
                                });
                            }
                            
                            // Parse BOM - lines with material info (not cost totals)
                            if (inBoms && values[0] && values[0].indexOf('成本') === -1 && values[0].indexOf('Total') === -1 && 
                                values[0].indexOf('总') === -1 && values[1]) {
                                data.boms.push({
                                    id: 'B' + Date.now() + Math.random().toString(36).substr(2, 5),
                                    projectId: projectId,
                                    partName: values[0] || '',
                                    model: values[1] || '',
                                    price: parseFloat(values[2]) || 0,
                                    qty: parseInt(values[3]) || 1
                                });
                            }
                            
                            // Parse Labor
                            if (inLabor && values[0] && values[0].indexOf('总计') === -1 && 
                                values[0].indexOf('Total') === -1 && values[0].indexOf('成本') === -1) {
                                data.labor.push({
                                    id: 'L' + Date.now() + Math.random().toString(36).substr(2, 5),
                                    projectId: projectId,
                                    role: values[0] || '',
                                    manDay: parseInt(values[1]) || 1,
                                    price: parseFloat(values[2]) || 1200
                                });
                            }
                        }
                        
                        saveData(data);
                        currentProjectId = projectId;
                        self.renderProjectList();
                        self.renderProjectSelects();
                        
                        // Use setTimeout to ensure DOM is ready
                        setTimeout(function() {
                            // Use selectProject to properly handle selection
                            self.selectProject(projectId);
                        }, 100);
                        
                        alert(t.msgImportSuccess || 'Import successful');
                    } catch (error) {
                        console.error('Import failed:', error);
                        alert('Import failed: ' + error.message);
                    }
                };
                reader.readAsText(file, 'UTF-8');
            };
            
            input.click();
        },
        
        // BOM functions
        renderBom: function() {
            var data = getData();
            var pid = currentProjectId || (document.getElementById('est-bom-project') || {}).value;
            var table = document.getElementById('est-bom-table');
            if (!table) return;
            if (!pid) {
                table.innerHTML = '<div class="est-empty">' + t.selectProject + '</div>';
                return;
            }
            var boms = data.boms.filter(function(b) { return b.projectId === pid; });
            if (boms.length === 0) {
                table.innerHTML = '<div class="est-empty">' + t.noBoms + '</div>';
            } else {
                table.innerHTML = '<table class="est-table"><thead><tr><th>' + t.partName + '</th><th>' + t.model + '</th><th>' + t.price + '</th><th>' + t.qty + '</th><th>' + t.cost + '</th><th>' + t.action + '</th></tr></thead><tbody>' + 
                    boms.map(function(b) { return '<tr><td>' + b.partName + '</td><td>' + (b.model || '-') + '</td><td>¥' + b.price + '</td><td>' + b.qty + '</td><td>¥' + (b.price * b.qty).toFixed(2) + '</td><td><button class="est-btn est-btn-secondary" style="padding:4px 8px;font-size:12px" onclick="window.estimation.openBomModal(\'' + b.id + '\')">' + t.edit + '</button><button class="est-btn est-btn-danger" style="padding:4px 8px;font-size:12px" onclick="window.estimation.deleteBom(\'' + b.id + '\')">' + t.delete + '</button></td></tr>'; }).join('') + '</tbody></table>';
            }
            var bomTotal = boms.reduce(function(sum, b) { return sum + (b.price * b.qty); }, 0);
            document.getElementById('est-bom-total').textContent = '¥' + bomTotal.toFixed(0);
            document.getElementById('est-bom-grand-total').textContent = '¥' + (bomTotal * 1.15).toFixed(0);
        },
        
        openBomModal: function(bomId) {
            var pid = currentProjectId || (document.getElementById('est-bom-project') || {}).value;
            if (!pid && !bomId) { alert(t.selectProject); return; }
            
            // If editing existing BOM, load its data
            if (bomId) {
                var data = getData();
                var bom = data.boms.find(function(b) { return b.id === bomId; });
                if (bom) {
                    document.getElementById('est-bom-id').value = bom.id || '';
                    document.getElementById('est-bom-partname').value = bom.partName || '';
                    document.getElementById('est-bom-model').value = bom.model || '';
                    document.getElementById('est-bom-price').value = bom.price || 0;
                    document.getElementById('est-bom-qty').value = bom.qty || 1;
                    document.getElementById('est-bom-modal').classList.add('active');
                    return;
                }
            }
            
            // New BOM - reset form
            if (!pid) { alert(t.selectProject); return; }
            document.getElementById('est-bom-id').value = '';
            document.getElementById('est-bom-partname').value = '';
            document.getElementById('est-bom-model').value = '';
            document.getElementById('est-bom-price').value = '0';
            document.getElementById('est-bom-qty').value = '1';
            document.getElementById('est-bom-modal').classList.add('active');
        },
        
        // Delete BOM
        deleteBom: function(bomId) {
            if (!confirm(t.confirmDelete)) return;
            var data = getData();
            data.boms = data.boms.filter(function(b) { return b.id !== bomId; });
            saveData(data);
            this.renderBom();
            this.renderProjectCostSummary();
        },
        
        // Import BOM for selected project
        importBom: function() {
            var pid = currentProjectId || (document.getElementById('est-bom-project') || {}).value;
            if (!pid) { alert(t.selectProject); return; }
            
            var self = this;
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv,.xlsx,.xls';
            
            input.onchange = function(e) {
                var file = e.target.files[0];
                if (!file) return;
                
                var reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        var text = event.target.result;
                        var lines = text.split('\n');
                        var data = getData();
                        
                        for (var i = 0; i < lines.length; i++) {
                            var line = lines[i].trim();
                            if (!line) continue;
                            
                            // Skip header
                            if (line.indexOf(t.partName) !== -1 || line.indexOf('Material') !== -1) continue;
                            
                            // Parse CSV
                            var values = [];
                            var current = '';
                            var inQuotes = false;
                            for (var j = 0; j < line.length; j++) {
                                var char = line[j];
                                if (char === '"') {
                                    inQuotes = !inQuotes;
                                } else if (char === ',' && !inQuotes) {
                                    values.push(current.trim());
                                    current = '';
                                } else {
                                    current += char;
                                }
                            }
                            values.push(current.trim());
                            
                            if (values.length >= 2 && values[0]) {
                                data.boms.push({
                                    id: 'B' + Date.now() + Math.random().toString(36).substr(2, 5),
                                    projectId: pid,
                                    partName: values[0] || '',
                                    model: values[1] || '',
                                    price: parseFloat(values[2]) || 0,
                                    qty: parseInt(values[3]) || 1
                                });
                            }
                        }
                        
                        saveData(data);
                        self.renderBom();
                        self.renderProjectCostSummary();
                        alert(t.msgImportSuccess || 'Import successful');
                    } catch (error) {
                        console.error('Import failed:', error);
                        alert('Import failed: ' + error.message);
                    }
                };
                reader.readAsText(file, 'UTF-8');
            };
            
            input.click();
        },
        
        // Export BOM for selected project
        exportBom: function() {
            var pid = currentProjectId || (document.getElementById('est-bom-project') || {}).value;
            if (!pid) { alert(t.selectProject); return; }
            
            var data = getData();
            var boms = data.boms.filter(function(b) { return b.projectId === pid });
            
            if (boms.length === 0) {
                alert(t.noBoms);
                return;
            }
            
            var project = data.projects.find(function(p) { return p.id === pid });
            
            // Create CSV content
            var csv = '\uFEFF';
            csv += t.partName + ',' + t.model + ',' + t.price + ',' + t.qty + ',' + t.cost + '\n';
            
            var total = 0;
            boms.forEach(function(b) {
                var cost = (b.price || 0) * (b.qty || 0);
                total += cost;
                csv += '"' + (b.partName || '') + '","' + (b.model || '') + '","' + (b.price || 0) + '","' + (b.qty || 0) + '","' + cost.toFixed(2) + '"\n';
            });
            csv += t.bomTotal + ',,,' + total.toFixed(2) + '\n';
            
            var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = (project ? project.name : 'bom') + '-hardware.csv';
            a.click();
            URL.revokeObjectURL(url);
        },
        
        saveBom: function(e) {
            e.preventDefault();
            var data = getData();
            var pid = currentProjectId || (document.getElementById('est-bom-project') || {}).value;
            var id = document.getElementById('est-bom-id').value;
            var bom = {
                id: id || 'B' + Date.now(),
                projectId: pid,
                partName: document.getElementById('est-bom-partname').value,
                model: document.getElementById('est-bom-model').value,
                price: parseFloat(document.getElementById('est-bom-price').value) || 0,
                qty: parseInt(document.getElementById('est-bom-qty').value) || 1
            };
            if (id) {
                var idx = data.boms.findIndex(function(b) { return b.id === id; });
                data.boms[idx] = bom;
            } else {
                data.boms.push(bom);
            }
            saveData(data);
            this.closeModal('est-bom-modal');
            this.renderBom();
            this.renderProjectCostSummary();
        },
        
        // Labor functions
        renderLabor: function() {
            var data = getData();
            var pid = currentProjectId || (document.getElementById('est-labor-project') || {}).value;
            var table = document.getElementById('est-labor-table');
            if (!table) return;
            if (!pid) {
                table.innerHTML = '<div class="est-empty">' + t.selectProject + '</div>';
                return;
            }
            var labors = data.labor.filter(function(l) { return l.projectId === pid; });
            var defaultRate = parseFloat(localStorage.getItem('rd_default_labor_rate')) || 1200;
            if (labors.length === 0) {
                table.innerHTML = '<div class="est-empty">' + t.noLabor + '</div>';
            } else {
                table.innerHTML = '<table class="est-table"><thead><tr><th>' + t.role + '</th><th>' + t.person + '</th><th>' + t.laborManDay + '</th><th>' + t.laborPrice + '</th><th>' + t.laborCost + '</th><th>' + t.action + '</th></tr></thead><tbody>' + 
                    labors.map(function(l) { 
                        var isDefault = (l.price === defaultRate && (!l.person || l.person === '通用' || l.person === '其他'));
                        var defaultBadge = isDefault ? ' <span style="background:#ffc107;color:#000;padding:2px 5px;border-radius:3px;font-size:10px">默认</span>' : '';
                        return '<tr><td>' + l.role + '</td><td>' + (l.person || '-') + '</td><td>' + l.manDay + '</td><td>¥' + l.price + defaultBadge + '</td><td>¥' + (l.manDay * l.price).toFixed(2) + '</td><td><button class="est-btn est-btn-secondary" style="padding:4px 8px;font-size:12px" onclick="window.estimation.openLaborModal(\'' + l.id + '\')">' + t.edit + '</button><button class="est-btn est-btn-danger" style="padding:4px 8px;font-size:12px" onclick="window.estimation.deleteLabor(\'' + l.id + '\')">' + t.delete + '</button></td></tr>'; 
                    }).join('') + '</tbody></table>';
            }
            var laborTotal = labors.reduce(function(sum, l) { return sum + (l.manDay * l.price); }, 0);
            document.getElementById('est-labor-total').textContent = '¥' + laborTotal.toFixed(0);
        },
        
        // Toggle labor person field based on checkbox
        toggleLaborPersonField: function() {
            var usePerson = document.getElementById('est-labor-use-person').checked;
            var personGroup = document.getElementById('est-labor-person-group');
            var roleSelect = document.getElementById('est-labor-role');
            
            if (usePerson) {
                personGroup.style.display = 'block';
                roleSelect.value = '其他';
                // Populate person dropdown from schedule tasks
                var pid = currentProjectId || (document.getElementById('est-labor-project') || {}).value;
                var data = getData();
                var tasks = data.tasks.filter(function(t) { return t.projectId === pid; });
                var uniquePersons = [...new Set(tasks.map(function(t) { return t.person; }).filter(function(p) { return p; }))];
                document.getElementById('est-labor-person').innerHTML = uniquePersons.map(function(p) { return '<option value="' + p + '">' + p + '</option>'; }).join('');
            } else {
                personGroup.style.display = 'none';
            }
        },
        
        openLaborModal: function(laborId) {
            var pid = currentProjectId || (document.getElementById('est-labor-project') || {}).value;
            if (!pid && !laborId) { alert(t.selectProject); return; }
            
            // If editing existing labor, load its data
            if (laborId) {
                var data = getData();
                var labor = data.labor.find(function(l) { return l.id === laborId; });
                if (labor) {
                    document.getElementById('est-labor-id').value = labor.id || '';
                    document.getElementById('est-labor-role').value = labor.role || '其他';
                    document.getElementById('est-labor-manday').value = labor.manDay || 1;
                    document.getElementById('est-labor-price').value = labor.price || 1200;
                    
                    // Check if person field has value
                    if (labor.person) {
                        document.getElementById('est-labor-use-person').checked = true;
                        this.toggleLaborPersonField();
                        // Populate person dropdown
                        var tasks = data.tasks.filter(function(t) { return t.projectId === pid; });
                        var uniquePersons = [...new Set(tasks.map(function(t) { return t.person; }).filter(function(p) { return p; }))];
                        document.getElementById('est-labor-person').innerHTML = uniquePersons.map(function(p) { return '<option value="' + p + '" ' + (p === labor.person ? 'selected' : '') + '>' + p + '</option>'; }).join('');
                    } else {
                        document.getElementById('est-labor-use-person').checked = false;
                        document.getElementById('est-labor-person-group').style.display = 'none';
                    }
                    
                    document.getElementById('est-labor-modal').classList.add('active');
                    return;
                }
            }
            
            // New labor - reset form
            if (!pid) { alert(t.selectProject); return; }
            document.getElementById('est-labor-id').value = '';
            document.getElementById('est-labor-role').value = '其他';
            document.getElementById('est-labor-manday').value = '1';
            document.getElementById('est-labor-price').value = '1200';
            document.getElementById('est-labor-use-person').checked = false;
            document.getElementById('est-labor-person-group').style.display = 'none';
            document.getElementById('est-labor-modal').classList.add('active');
        },
        
        deleteLabor: function(laborId) {
            if (!confirm(t.confirmDelete)) return;
            var data = getData();
            data.labor = data.labor.filter(function(l) { return l.id !== laborId; });
            saveData(data);
            this.renderLabor();
            this.renderProjectCostSummary();
        },
        
        saveLabor: function(e) {
            e.preventDefault();
            var data = getData();
            var pid = currentProjectId || (document.getElementById('est-labor-project') || {}).value;
            var id = document.getElementById('est-labor-id').value;
            var usePerson = document.getElementById('est-labor-use-person').checked;
            var person = usePerson ? document.getElementById('est-labor-person').value : '';
            var setDefaultRate = document.getElementById('est-labor-default-rate').checked;
            
            var labor = {
                id: id || 'L' + Date.now(),
                projectId: pid,
                role: document.getElementById('est-labor-role').value,
                person: person,
                manDay: parseInt(document.getElementById('est-labor-manday').value) || 1,
                price: parseFloat(document.getElementById('est-labor-price').value) || 0
            };
            
            // Set as default labor rate if checked
            if (setDefaultRate) {
                localStorage.setItem('rd_default_labor_rate', labor.price);
            }
            
            if (id) {
                var idx = data.labor.findIndex(function(l) { return l.id === id; });
                data.labor[idx] = labor;
            } else {
                data.labor.push(labor);
            }
            saveData(data);
            this.closeModal('est-labor-modal');
            this.renderLabor();
            this.renderProjectCostSummary();
        },
        
        // Archive
        renderArchive: function() {
            var self = this;
            var data = getData();
            var list = document.getElementById('est-archive-list');
            if (!list) return;
            var archived = data.projects.filter(function(p) { return p.status === 'completed'; });
            if (archived.length === 0) {
                list.innerHTML = '<div class="est-empty">' + t.noArchive + '</div>';
            } else {
                list.innerHTML = archived.map(function(p) {
                    // Get related data
                    var tasks = data.tasks.filter(function(t) { return t.projectId === p.id; });
                    var boms = data.boms.filter(function(b) { return b.projectId === p.id; });
                    var labors = data.labor.filter(function(l) { return l.projectId === p.id; });
                    var totalManDays = tasks.reduce(function(sum, t) { return sum + (t.manDay || 0); }, 0);
                    var bomCost = boms.reduce(function(sum, b) { return sum + (b.price * b.qty); }, 0) * 1.15;
                    var laborCost = labors.reduce(function(sum, l) { return sum + (l.manDay * l.price); }, 0);
                    var totalCost = (totalManDays * 1200) + bomCost + laborCost;
                    var createDate = p.createTime ? new Date(p.createTime).toLocaleDateString() : '-';
                    
                    return '<div class="est-project-item"><div><strong>' + p.name + '</strong><div style="font-size:12px;color:#666">' + (p.customer || '') + ' | ' + p.type + ' | ' + createDate + '</div></div><div class="est-actions"><button class="est-btn est-btn-secondary" style="padding:4px 8px;font-size:12px" onclick="event.stopPropagation();window.estimation.showArchiveDetail(\'' + p.id + '\')">' + (t.edit + ' ' + t.labelRemark) + '</button><span class="est-status est-status-completed">' + t.statusCompleted + '</span></div></div>';
                }).join('');
            }
        },
        
        // Show archive detail
        showArchiveDetail: function(projectId) {
            var data = getData();
            var project = data.projects.find(function(p) { return p.id === projectId; });
            if (!project) return;
            
            var tasks = data.tasks.filter(function(t) { return t.projectId === projectId; });
            var boms = data.boms.filter(function(b) { return b.projectId === projectId; });
            var labors = data.labor.filter(function(l) { return l.projectId === projectId; });
            
            var totalManDays = tasks.reduce(function(sum, t) { return sum + (t.manDay || 0); }, 0);
            var totalDays = tasks.reduce(function(sum, t) { return Math.max(sum, t.endDay || 0); }, 0);
            var bomMaterialCost = boms.reduce(function(sum, b) { return sum + (b.price * b.qty); }, 0);
            var bomCost = bomMaterialCost * 1.15;
            
            // Calculate labor cost: labor cost * total days + BOM cost
            var laborCost = 0;
            var defaultRate = parseFloat(localStorage.getItem('rd_default_labor_rate')) || 1200;
            
            if (labors.length > 0) {
                var laborManDays = labors.reduce(function(sum, l) { return sum + ((l.manDay || 0) * (l.price || 0)); }, 0);
                laborCost = laborManDays * totalDays;
            } else if (tasks.length > 0) {
                laborCost = totalManDays * defaultRate * totalDays;
            }
            
            var totalCost = laborCost + bomCost;
            
            var createDate = project.createTime ? new Date(project.createTime).toLocaleString() : '-';
            
            var detailHtml = '<div id="est-archive-detail" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center" onclick="if(event.target.id === \'est-archive-detail\') { document.getElementById(\'est-archive-detail\').remove(); }">' +
                '<div class="est-modal-content" style="max-width:600px;background:#fff;border-radius:10px;padding:20px" onclick="event.stopPropagation()">' +
                '<div class="est-modal-header"><h3>' + project.name + '</h3><button class="est-modal-close" onclick="document.getElementById(\'est-archive-detail\').remove()">&times;</button></div>' +
                '<div style="padding:10px">' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px">' +
                '<div><strong>' + t.customer + ':</strong> ' + (project.customer || '-') + '</div>' +
                '<div><strong>' + t.type + ':</strong> ' + project.type + '</div>' +
                '<div><strong>' + t.status + ':</strong> ' + t.statusCompleted + '</div>' +
                '<div><strong>' + t.labelEstimationDate + ':</strong> ' + createDate + '</div>' +
                '</div>' +
                '<div><strong>' + t.labelRemark + ':</strong> ' + (project.remark || '-') + '</div>' +
                '<hr style="margin:15px 0">' +
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:center">' +
                '<div style="background:#f8f9fa;padding:10px;border-radius:5px"><div style="font-size:18px;font-weight:bold">' + totalManDays + '</div><div style="font-size:12px">' + t.totalManDays + '</div></div>' +
                '<div style="background:#f8f9fa;padding:10px;border-radius:5px"><div style="font-size:18px;font-weight:bold">¥' + bomCost.toFixed(0) + '</div><div style="font-size:12px">' + t.bomTitle + '</div></div>' +
                '<div style="background:#f8f9fa;padding:10px;border-radius:5px"><div style="font-size:18px;font-weight:bold">¥' + laborCost.toFixed(0) + '</div><div style="font-size:12px">' + t.laborTitle + '</div></div>' +
                '</div>' +
                '<div style="margin-top:15px;background:#0d6efd;color:#fff;padding:15px;border-radius:5px;text-align:center">' +
                '<div style="font-size:24px;font-weight:bold">¥' + totalCost.toFixed(0) + '</div><div>' + t.detailTotalCost + '</div>' +
                '</div>' +
                '</div></div></div>';
            
            // Add modal to page
            var existingModal = document.getElementById('est-archive-detail');
            if (existingModal) existingModal.remove();
            
            var modal = document.createElement('div');
            modal.innerHTML = detailHtml;
            document.body.appendChild(modal);
        },
        
        init: init
    };
    
    // Auto init when loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for main app
    window.initEstimation = init;
})();