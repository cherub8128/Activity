/**
 * Excel Parser
 * Reads Excel files and normalizes data.
 */

class ExcelParser {
    constructor() {
        // Standard headers to look for
        this.headerMap = {
            grade: ['학년'],
            class: ['반'],
            number: ['번호'],
            name: ['이름', '성명', '학생이름', '학생 성명'],
            content: ['내용', '특기사항', '봉사활동내용', '활동내용', '활동 내용', '특기 사항'],
            time: ['시간', '봉사시간', '봉사 시간', '인정시간'],
            date: ['일자', '기간', '일시', '날짜', '활동일자'],
            startDate: ['시작일자', '시작일', '봉사시작일'],
            endDate: ['종료일자', '종료일', '봉사종료일'],
            area: ['활동영역', '영역', '봉사영역', '장소'],
            schoolType: ['학교/개인', '구분', '봉사구분'],
            place: ['장소', '주관기관', '봉사장소']
        };
    }

    async parseFiles(files) {
        const results = [];
        let processedCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.name.match(/\.xlsx?$|\.xls?$/i)) continue;
            if (file.name.startsWith('~$')) continue; // Skip temp files

            try {
                const fileData = await this.readFile(file);
                const workbook = XLSX.read(fileData, { type: 'array' });
                
                // Determine activity type from filename
                const activityType = this.guessActivityType(file.name);

                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays
                    
                    if (jsonData.length < 2) return;

                    // Find header row
                    const { headerRowIndex, colMap } = this.findHeaderRow(jsonData);
                    
                    if (headerRowIndex === -1) {
                        console.warn(`Could not find headers in ${file.name} - ${sheetName}`);
                        return;
                    }

                    // State for fill-down logic
                    let lastGrade = null;
                    let lastClass = null;

                    // Parse rows
                    for (let r = headerRowIndex + 1; r < jsonData.length; r++) {
                        const row = jsonData[r];
                        
                        // Extract with context
                        const extraction = this.extractStudentData(row, colMap, lastGrade, lastClass);
                        
                        if (extraction) {
                            const { studentData, currentGrade, currentClass } = extraction;
                            
                            // Update state if we found new valid grade/class
                            if (currentGrade) lastGrade = currentGrade;
                            if (currentClass) lastClass = currentClass;

                            if (studentData && studentData.id) {
                                results.push({
                                    ...studentData,
                                    activity: {
                                        type: activityType, 
                                        source: file.name,
                                        sheet: sheetName,
                                        content: studentData.content,
                                        time: studentData.time,
                                        date: studentData.date,
                                        // Volunteer specific
                                        startDate: studentData.startDate,
                                        endDate: studentData.endDate,
                                        area: studentData.area,
                                        schoolType: studentData.schoolType,
                                        place: studentData.place
                                    }
                                });
                            }
                        }
                    }
                });
                processedCount++;
            } catch (e) {
                console.error(`Error parsing ${file.name}:`, e);
            }
        }
        
        return this.groupResults(results);
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        });
    }

    guessActivityType(filename) {
        if (filename.includes('자율')) return 'autonomy';
        if (filename.includes('진로')) return 'career';
        if (filename.includes('봉사')) return 'volunteer';
        return 'unknown';
    }

    findHeaderRow(data) {
        // Scan first 20 rows to find the header
        for (let i = 0; i < Math.min(data.length, 20); i++) { 
            const row = data[i];
            const colMap = {};
            
            row.forEach((cell, colIndex) => {
                if (!cell || typeof cell !== 'string') return;
                const val = cell.trim().replace(/\s+/g, '').toLowerCase(); // Normalize
                
                // More flexible matching
                if (val.includes('학년') || val === '학년') colMap.grade = colIndex;
                else if (val.includes('반') && !val.includes('번') || val === '반') colMap.class = colIndex;
                else if (val.includes('번호') || val === '번호' || val === '번') colMap.number = colIndex;
                else if (val.includes('이름') || val.includes('성명') || val === '이름') colMap.name = colIndex;
                else if (val.includes('봉사활동내용') || val.includes('활동내용') || val.includes('내용')) {
                    if (!colMap.content) colMap.content = colIndex;
                }
                else if (val.includes('시간') || val.includes('봉사시간') || val.includes('인정시간')) {
                    if (!colMap.time) colMap.time = colIndex;
                }
                else if (val.includes('시작일') || val.includes('봉사시작') || val.includes('시작')) {
                    if (!colMap.startDate) colMap.startDate = colIndex;
                }
                else if (val.includes('종료일') || val.includes('봉사종료') || val.includes('종료')) {
                    if (!colMap.endDate) colMap.endDate = colIndex;
                }
                else if (val.includes('활동영역') || val.includes('영역') || val.includes('봉사영역')) {
                    if (!colMap.area) colMap.area = colIndex;
                }
                else if (val.includes('학교') && val.includes('개인') || val.includes('구분')) {
                    if (!colMap.schoolType) colMap.schoolType = colIndex;
                }
                else if (val.includes('장소') || val.includes('주관기관') || val.includes('기관')) {
                    if (!colMap.place) colMap.place = colIndex;
                }
                else if (val.includes('일자') || val.includes('기간') || val.includes('날짜')) {
                    if (!colMap.date) colMap.date = colIndex;
                }
            });

            // Relaxed check: Name is essential, or at least some identifying info
            if (colMap.name !== undefined || (colMap.grade !== undefined && colMap.class !== undefined)) {
                return { headerRowIndex: i, colMap };
            }
        }
        return { headerRowIndex: -1, colMap: {} };
    }

    extractStudentData(row, colMap, lastGrade, lastClass) {
        let grade = colMap.grade !== undefined ? row[colMap.grade] : null;
        let cls = colMap.class !== undefined ? row[colMap.class] : null;
        const num = colMap.number !== undefined ? row[colMap.number] : null;
        const name = colMap.name !== undefined ? row[colMap.name] : null;

        // Skip completely empty rows
        const hasAnyData = grade || cls || num || name || 
            (colMap.content !== undefined && row[colMap.content]);
        if (!hasAnyData) return null;

        // Use last known values if current are missing
        if (!grade && lastGrade) grade = lastGrade;
        if (!cls && lastClass) cls = lastClass;

        // If we have content but no name, it might be a continuation row
        // But we still need at least grade/class to identify the student
        if (!grade || !cls) {
            // Can't identify student without grade/class
            return { studentData: null, currentGrade: grade, currentClass: cls };
        }

        // If no number but we have name, try to find the student by name within the same grade/class
        if (!num && name) {
            // We'll need to handle this differently - for now, skip if no number
            return { studentData: null, currentGrade: grade, currentClass: cls };
        }

        if (!num) {
            return { studentData: null, currentGrade: grade, currentClass: cls };
        }

        // Sanitize Grade/Class/Number to numbers
        const cleanGrade = grade.toString().replace(/[^0-9]/g, '');
        const cleanClass = cls.toString().replace(/[^0-9]/g, '');
        const cleanNum = num.toString().replace(/[^0-9]/g, '');

        if (!cleanGrade || !cleanClass || !cleanNum) {
            return { studentData: null, currentGrade: grade, currentClass: cls };
        }

        // Format ID: G-C-NN
        const fmtNum = cleanNum.padStart(2, '0');
        const id = `${cleanGrade}-${cleanClass}-${fmtNum}`;
        
        const studentData = {
            id: id,
            name: name || '',
            content: colMap.content !== undefined ? row[colMap.content] : '',
            time: colMap.time !== undefined ? row[colMap.time] : '',
            date: colMap.date !== undefined ? row[colMap.date] : '',
            startDate: colMap.startDate !== undefined ? row[colMap.startDate] : '',
            endDate: colMap.endDate !== undefined ? row[colMap.endDate] : '',
            area: colMap.area !== undefined ? row[colMap.area] : '',
            schoolType: colMap.schoolType !== undefined ? row[colMap.schoolType] : '',
            place: colMap.place !== undefined ? row[colMap.place] : ''
        };

        return { studentData, currentGrade: grade, currentClass: cls };
    }

    groupResults(flatResults) {
        const students = {};
        
        flatResults.forEach(item => {
            if (!students[item.id]) {
                students[item.id] = {
                    id: item.id,
                    name: item.name,
                    activities: []
                };
            }
            if (item.name && !students[item.id].name) {
                students[item.id].name = item.name;
            }
            
            // Push activity even if content is empty? No, usually content is key.
            // But for volunteer, maybe content is empty but area is there?
            // Let's be permissive.
            students[item.id].activities.push(item.activity);
        });

        return Object.values(students);
    }
}

window.excelParser = new ExcelParser();
