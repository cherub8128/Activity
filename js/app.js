/**
 * Main Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    const folderInput = document.getElementById('folderInput');
    const resetBtn = document.getElementById('resetBtn');
    const themeToggle = document.getElementById('themeToggle');

    // Theme Logic
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateThemeIcon(next);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fa-solid fa-sun';
        } else {
            icon.className = 'fa-solid fa-moon';
        }
    }

    // File Input Logic
    folderInput.addEventListener('change', async (e) => {
        if (e.target.files.length === 0) return;

        // Show loading state (simple alert or UI change)
        const btnLabel = document.querySelector('.file-upload-btn');
        const originalText = btnLabel.innerHTML;
        btnLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 처리 중...';

        try {
            console.log('Parsing files...');
            const parsedData = await window.excelParser.parseFiles(e.target.files);
            
            console.log('Merging data...');
            const count = window.dataManager.mergeData(parsedData);
            
            alert(`${parsedData.length}명의 학생 데이터가 처리되었습니다.\n(${count}건의 활동 업데이트)`);
            
            // Refresh List
            window.uiRenderer.renderStudentList(window.dataManager.getAllStudents());
            
            // Clear welcome screen if students exist
            if (parsedData.length > 0) {
                // Select first student automatically? Or let user choose.
                // Let's just show the list.
            }

        } catch (err) {
            console.error(err);
            alert('파일 처리 중 오류가 발생했습니다.');
        } finally {
            btnLabel.innerHTML = originalText;
            // Reset input so same folder can be selected again if needed
            folderInput.value = ''; 
        }
    });

    // Reset Data
    resetBtn.addEventListener('click', () => {
        if (confirm('모든 데이터를 초기화하시겠습니까? 저장된 요약 내용도 삭제됩니다.')) {
            window.dataManager.clearData();
            window.uiRenderer.renderStudentList([]);
            document.getElementById('contentArea').innerHTML = `
                <div class="welcome-screen">
                    <i class="fa-solid fa-folder-tree"></i>
                    <h2>활동 기록을 불러오세요</h2>
                    <p>데이터가 초기화되었습니다.</p>
                </div>
            `;
        }
    });

    // Initial Load
    const students = window.dataManager.getAllStudents();
    if (students.length > 0) {
        window.uiRenderer.renderStudentList(students);
    }
});
