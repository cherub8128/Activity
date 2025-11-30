/**
 * UI Renderer
 * Handles DOM manipulation and rendering.
 */

class UIRenderer {
    constructor() {
        this.studentListEl = document.getElementById('studentList');
        this.contentAreaEl = document.getElementById('contentArea');
        this.searchInput = document.getElementById('searchInput');
        this.template = document.getElementById('student-detail-template');
        
        this.currentStudentId = null;
        
        this.bindEvents();
    }

    bindEvents() {
        this.searchInput.addEventListener('input', () => this.triggerFilter());
        document.getElementById('gradeFilter').addEventListener('change', () => this.triggerFilter());
        document.getElementById('classFilter').addEventListener('change', () => this.triggerFilter());
    }

    triggerFilter() {
        const grade = document.getElementById('gradeFilter').value;
        const cls = document.getElementById('classFilter').value;
        const search = this.searchInput.value;
        this.renderStudentList(window.dataManager.getAllStudents(), { grade, cls, search });
    }

    renderStudentList(students, filters = {}) {
        this.studentListEl.innerHTML = '';
        
        const filtered = students.filter(s => {
            const parts = s.id.split('-'); // [Grade, Class, Number]
            const sGrade = parts[0];
            const sClass = parts[1];
            
            if (filters.grade && sGrade !== filters.grade) return false;
            if (filters.cls && sClass !== filters.cls) return false;
            
            if (filters.search) {
                const searchStr = `${s.id} ${s.name}`.toLowerCase();
                if (!searchStr.includes(filters.search.toLowerCase())) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            this.studentListEl.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
            return;
        }

        // Create table
        const table = document.createElement('table');
        table.className = 'student-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>학년</th>
                    <th>반</th>
                    <th>이름</th>
                    <th>활동</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');

        filtered.forEach(s => {
            const parts = s.id.split('-');
            const tr = document.createElement('tr');
            tr.className = this.currentStudentId === s.id ? 'active' : '';
            tr.innerHTML = `
                <td>${parts[0]}</td>
                <td>${parts[1]}</td>
                <td>${s.name}</td>
                <td>${s.activities.length}건</td>
            `;
            tr.onclick = () => this.selectStudent(s.id);
            tbody.appendChild(tr);
        });

        this.studentListEl.appendChild(table);
    }

    selectStudent(id) {
        this.currentStudentId = id;
        
        // Update active state in list (table rows)
        const rows = this.studentListEl.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
                // Extract number from 4th column (e.g., "3건" -> extract the row to get exact match)
                // Actually, let's reconstruct the ID from Grade-Class-Name and match against our stored student
                const grade = cells[0].textContent.trim();
                const cls = cells[1].textContent.trim();
                const name = cells[2].textContent.trim();
                
                // Find student in data that matches
                const student = window.dataManager.getAllStudents().find(s => 
                    s.id === id
                );
                
                if (student && student.id.split('-')[0] === grade && 
                    student.id.split('-')[1] === cls && 
                    student.name === name) {
                    row.classList.add('active');
                } else {
                    row.classList.remove('active');
                }
            }
        });

        this.renderStudentDetail(id);
    }

    renderStudentDetail(id) {
        const student = window.dataManager.getStudent(id);
        if (!student) return;

        const clone = this.template.content.cloneNode(true);
        
        // Header
        clone.querySelector('.student-name').textContent = student.name;
        clone.querySelector('.student-id').textContent = student.id;

        // Tabs Logic
        const tabs = clone.querySelectorAll('.tab-btn');
        const contents = clone.querySelectorAll('.tab-content');
        
        tabs.forEach(btn => {
            btn.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                // We need to find the content in the LIVE DOM after append, 
                // BUT since we are setting up onclick before append, we need a way to reference the live element.
                // The easiest way is to re-query inside the click handler relative to contentAreaEl.
                const targetId = `tab-${btn.dataset.tab}`;
                this.contentAreaEl.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                this.contentAreaEl.querySelector(`#${targetId}`).classList.add('active');
            };
        });

        // --- Autonomy/Career Tab ---
        const autonomyList = clone.getElementById('autonomyList');
        const activities = student.activities.filter(a => ['autonomy', 'career', 'unknown'].includes(a.type));
        
        // Sort activities: Autonomy first, then Career
        activities.sort((a, b) => {
            if (a.type === b.type) return 0;
            return a.type === 'autonomy' ? -1 : 1;
        });

        activities.forEach(act => {
            const card = this.createActivityCard(act, true); 
            autonomyList.appendChild(card);
        });

        // Editors (Autonomy & Career)
        const editorSection = clone.querySelector('.editor-section');
        editorSection.innerHTML = ''; // Clear default

        // 1. Autonomy Editor
        editorSection.appendChild(this.createEditorModule('자율활동 특기사항', student.autonomy_summary, 'autonomy', id));
        
        // 2. Career Editor
        editorSection.appendChild(this.createEditorModule('진로활동 특기사항', student.career_summary, 'career', id));


        // --- Volunteer Tab (Table View) ---
        const volunteerList = clone.getElementById('volunteerList');
        volunteerList.innerHTML = ''; // Clear default list container
        
        const volActivities = student.activities.filter(a => a.type === 'volunteer');
        
        if (volActivities.length > 0) {
            const table = document.createElement('table');
            table.className = 'volunteer-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th width="10%">시작일</th>
                        <th width="10%">종료일</th>
                        <th width="5%">시간</th>
                        <th width="30%">내용</th>
                        <th width="10%">영역</th>
                        <th width="10%">구분</th>
                        <th width="15%">장소/기관</th>
                        <th width="5%">복사</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');
            
            volActivities.forEach(act => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${act.startDate || '-'}</td>
                    <td>${act.endDate || '-'}</td>
                    <td>${act.time ? act.time : '-'}</td>
                    <td class="content-cell">${act.content || '-'}</td>
                    <td>${act.area || '-'}</td>
                    <td>${act.schoolType || '-'}</td>
                    <td>${act.place || '-'}</td>
                    <td>
                        <button class="icon-only-btn copy-vol-btn" title="내용 복사">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                    </td>
                `;
                tr.querySelector('.copy-vol-btn').onclick = () => {
                    navigator.clipboard.writeText(act.content || '').then(() => alert('내용이 복사되었습니다.'));
                };
                tbody.appendChild(tr);
            });
            volunteerList.appendChild(table);
        } else {
            volunteerList.innerHTML = '<div class="empty-state">봉사활동 기록이 없습니다.</div>';
        }

        this.contentAreaEl.innerHTML = '';
        this.contentAreaEl.appendChild(clone);
        
        // Re-attach Tab Events for live elements
        const liveTabs = this.contentAreaEl.querySelectorAll('.tab-btn');
        liveTabs.forEach(btn => {
            btn.onclick = () => {
                liveTabs.forEach(t => t.classList.remove('active'));
                this.contentAreaEl.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                this.contentAreaEl.querySelector(`#tab-${btn.dataset.tab}`).classList.add('active');
            };
        });
    }

    createActivityCard(activity, allowAddToSummary) {
        const div = document.createElement('div');
        div.className = 'activity-card';
        
        const typeLabel = activity.type === 'autonomy' ? '자율' : activity.type === 'career' ? '진로' : '기타';
        const typeColor = activity.type === 'autonomy' ? '#10b981' : activity.type === 'career' ? '#f59e0b' : '#6b7280';
        
        // Use source file name as Activity Name if no specific title
        // Remove extension and common prefixes for cleaner look if possible, but full name is safer.
        const activityName = activity.source.replace(/\.xlsx?$/, '');

        div.innerHTML = `
            <div class="activity-header" style="color: ${typeColor}">
                <span>[${typeLabel}] ${activityName}</span>
                <span>${activity.time ? activity.time + '시간' : ''}</span>
            </div>
            <div class="activity-content">${activity.content}</div>
            <div class="activity-actions">
                <button class="sm-btn add-to-autonomy">
                    <i class="fa-solid fa-plus"></i> 자율에 추가
                </button>
                <button class="sm-btn add-to-career">
                    <i class="fa-solid fa-plus"></i> 진로에 추가
                </button>
            </div>
        `;

        // Events
        div.querySelector('.add-to-autonomy').onclick = () => {
            const editor = document.querySelector(`#editor-autonomy`);
            if (editor) {
                editor.value += (editor.value ? '\n' : '') + activity.content;
                editor.dispatchEvent(new Event('input'));
            }
        };
        div.querySelector('.add-to-career').onclick = () => {
            const editor = document.querySelector(`#editor-career`);
            if (editor) {
                editor.value += (editor.value ? '\n' : '') + activity.content;
                editor.dispatchEvent(new Event('input'));
            }
        };

        return div;
    }

    createEditorModule(title, initialValue, type, studentId) {
        const container = document.createElement('div');
        container.className = 'editor-module';
        container.style.marginBottom = '20px';

        const header = document.createElement('h3');
        header.textContent = title;
        container.appendChild(header);

        const toolbar = document.createElement('div');
        toolbar.className = 'editor-toolbar';
        
        const counter = document.createElement('span');
        counter.className = 'byte-counter';
        counter.textContent = '0 bytes';
        
        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.gap = '5px';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn';
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> 복사';
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'action-btn primary';
        saveBtn.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> 저장';

        btnGroup.appendChild(copyBtn);
        btnGroup.appendChild(saveBtn);
        
        toolbar.appendChild(counter);
        toolbar.appendChild(btnGroup);
        container.appendChild(toolbar);

        const textarea = document.createElement('textarea');
        textarea.className = 'summary-editor';
        textarea.id = `editor-${type}`; // editor-autonomy or editor-career
        textarea.value = initialValue || '';
        textarea.style.height = '150px';
        container.appendChild(textarea);

        // Logic
        const updateCounter = () => {
            const bytes = this.countBytes(textarea.value);
            counter.textContent = `${bytes} bytes`;
        };

        textarea.addEventListener('input', updateCounter);
        
        // Initial count
        updateCounter();

        copyBtn.onclick = () => {
            navigator.clipboard.writeText(textarea.value);
            alert('복사되었습니다.');
        };

        saveBtn.onclick = () => {
            window.dataManager.updateSummary(studentId, type, textarea.value);
            alert('저장되었습니다.');
        };

        return container;
    }

    countBytes(s) {
        let b = 0;
        for (let i = 0; i < s.length; i++) {
            const c = s.charCodeAt(i);
            // Korean (Hangul Syllables, Jamo, Compatibility Jamo) -> 3 bytes
            // Range: AC00-D7A3, 1100-11FF, 3130-318F
            if ((c >= 0xAC00 && c <= 0xD7A3) || 
                (c >= 0x1100 && c <= 0x11FF) || 
                (c >= 0x3130 && c <= 0x318F)) {
                b += 3;
            } else {
                b += 1;
            }
        }
        return b;
    }
}

window.uiRenderer = new UIRenderer();
