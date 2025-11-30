/**
 * Data Manager
 * Handles LocalStorage operations and data merging.
 */

const STORAGE_KEY = 'activity_viewer_data';

class DataManager {
    constructor() {
        this.data = {
            students: {} // Key: "Grade-Class-Number" (e.g., "1-1-01")
        };
        this.loadData();
    }

    loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                this.data = JSON.parse(stored);
                console.log('Data loaded from LocalStorage', Object.keys(this.data.students).length, 'students');
            } catch (e) {
                console.error('Failed to parse stored data', e);
                this.data = { students: {} };
            }
        }
    }

    saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
            console.log('Data saved to LocalStorage');
        } catch (e) {
            console.error('Failed to save data (Quota exceeded?)', e);
            alert('저장 용량이 부족하여 데이터를 저장할 수 없습니다. (LocalStorage Full)');
        }
    }

    /**
     * Merges new data from Excel into the existing data.
     * Preserves user-edited summaries.
     * Avoids duplicate activities based on content.
     * @param {Array} newStudentsList - Array of student objects parsed from Excel
     */
    mergeData(newStudentsList) {
        let updateCount = 0;

        newStudentsList.forEach(newStudent => {
            const id = newStudent.id;
            
            if (!this.data.students[id]) {
                // New student
                this.data.students[id] = {
                    id: id,
                    name: newStudent.name,
                    activities: [],
                    autonomy_summary: "",
                    career_summary: ""
                };
            }

            // Update name if missing
            if (!this.data.students[id].name && newStudent.name) {
                this.data.students[id].name = newStudent.name;
            }

            // Merge activities
            const existingActivities = this.data.students[id].activities;
            
            newStudent.activities.forEach(newAct => {
                // Check for duplicates
                const isDuplicate = existingActivities.some(exAct => 
                    exAct.type === newAct.type && 
                    exAct.content === newAct.content &&
                    exAct.date === newAct.date // Optional: check date if available
                );

                if (!isDuplicate) {
                    existingActivities.push(newAct);
                    updateCount++;
                }
            });
        });

        this.saveData();
        return updateCount;
    }

    getStudent(id) {
        return this.data.students[id];
    }

    getAllStudents() {
        return Object.values(this.data.students).sort((a, b) => {
            // Sort by ID (Grade-Class-Number)
            const partsA = a.id.split('-').map(Number);
            const partsB = b.id.split('-').map(Number);
            
            for(let i=0; i<3; i++) {
                if (partsA[i] !== partsB[i]) return partsA[i] - partsB[i];
            }
            return 0;
        });
    }

    updateSummary(id, type, content) {
        if (this.data.students[id]) {
            if (type === 'autonomy') {
                this.data.students[id].autonomy_summary = content;
            } else if (type === 'career') {
                this.data.students[id].career_summary = content;
            } else if (type === 'volunteer') {
                 // Volunteer usually doesn't have a summary in this requirement, but just in case
            }
            this.saveData();
        }
    }

    clearData() {
        this.data = { students: {} };
        localStorage.removeItem(STORAGE_KEY);
        console.log('Data cleared');
    }
}

// Export instance
window.dataManager = new DataManager();
