# Student Activity Viewer - 개발 및 수정 로그

> **작성일**: 2025-11-30  
> **목적**: 학생 활동 기록 뷰어 웹 애플리케이션의 모든 개발/수정 사항을 기록하여 향후 재작업 시 불필요한 작업 번복 및 실수 방지

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [전체 기능 목록](#전체-기능-목록)
3. [상세 수정 로그](#상세-수정-로그)
4. [디자인 시스템](#디자인-시스템)
5. [기술 스택](#기술-스택)
6. [파일 구조](#파일-구조)
7. [중요 구현 사항](#중요-구현-사항)

---

## 프로젝트 개요

학생 활동 기록을 Excel 파일에서 가져와 관리하고 조회할 수 있는 웹 애플리케이션입니다.

### 핵심 기능
- Excel 파일(.xlsx, .xls) 파싱 및 데이터 추출
- 학생별 자율/진로 활동 및 봉사활동 기록 관리
- 활동 내용 요약 편집 및 바이트 카운팅 (한글 3바이트, 영문/숫자 1바이트)
- LocalStorage를 통한 데이터 영속성
- 라이트/다크 모드 지원

---

## 전체 기능 목록

### ✅ 완료된 기능

#### 1. Excel 파싱 기능
- [x] SheetJS 라이브러리를 통한 Excel 파일 읽기
- [x] 다양한 헤더 이름 지원 (이름/성명/학생이름/학생 성명 등)
- [x] 헤더 자동 감지 (여러 행 스캔, 공백 무시, 대소문자 무시, 부분 매칭)
- [x] 누락된 학년/반/번호 정보 자동 보완 (fill-down 로직)
- [x] 봉사활동 상세 정보 파싱: 시작일, 종료일, 지역, 학교/개인, 장소/기관

#### 2. 데이터 관리
- [x] LocalStorage를 통한 클라이언트 사이드 데이터 저장
- [x] DataManager 클래스: 저장, 로드, 병합 기능
- [x] 사용자 편집 요약 보존
- [x] 중복 활동 방지
- [x] 학년-반-이름 기준 정렬
- [x] 데이터 초기화 기능 (`clearData`)

#### 3. 사용자 인터페이스
- [x] 클린하고 현대적인 UI 디자인
- [x] 흰색 배경에 진한 네이비 블루 액센트 (눈의 피로 감소)
- [x] 사이드바: 학년/반 필터링, 학생 검색, 학생 목록 (테이블 형식)
- [x] 학생 상세 정보: 헤더, 탭 (자율/진로, 봉사활동)
- [x] 자율/진로 활동 탭:
  - 개별 활동 목록
  - "자율활동에 추가" / "진로활동에 추가" 버튼
  - 요약 편집기 (실시간 바이트 카운팅)
  - 저장 및 복사 기능
- [x] 봉사활동 탭: 테이블 형식 (시작일, 종료일, 시간, 내용, 지역, 학교/개인, 장소/기관)
- [x] 라이트/다크 모드 토글
- [x] 로고 이미지 (헤더 및 파비콘)
- [x] 푸터 저작권 표시 (© 2025 차형준. All rights reserved.)
- [x] 학생 선택 시 행 전체 하이라이트

#### 4. 색상 테마
- [x] **라이트 모드**: 순백색 배경 + 진한 네이비 블루 (#1e3a8a)
- [x] **다크 모드**: 깊은 네이비 배경 (#0a1929) + 밝은 블루 액센트 (#60a5fa)
- [x] 양쪽 모드 간 조화로운 색상 팔레트
- [x] 네이비 블루 톤의 섀도우

---

## 상세 수정 로그

### 2025-11-30: 초기 개발 및 색상 테마 적용

#### 1단계: 프로젝트 스캐폴딩
**작업 내용:**
- 기본 HTML 구조 생성 (`index.html`)
- CSS 파일 구조화 (`css/style.css`)
- JavaScript 모듈 분리:
  - `js/app.js`: 메인 애플리케이션 로직
  - `js/data-manager.js`: 데이터 관리
  - `js/excel-parser.js`: Excel 파싱
  - `js/ui-renderer.js`: UI 렌더링

**주요 결정사항:**
- SheetJS 라이브러리 사용 (CDN)
- LocalStorage 사용 (Cookie 대신)
- Noto Sans KR 폰트 적용
- Font Awesome 아이콘 사용

#### 2단계: Excel 파싱 기능 개선
**파일**: `js/excel-parser.js`

**수정 사항:**
1. **헤더 감지 개선** (`findHeaderRow` 함수)
   ```javascript
   // 다양한 헤더 이름 지원
   - "이름", "성명", "학생이름", "학생 성명"
   - "봉사활동내용", "활동내용", "내용"
   - "시작일", "봉사시작일"
   - "종료일", "봉사종료일"
   - "지역", "봉사지역"
   - "장소", "기관", "장소/기관"
   ```

2. **Fill-down 로직 구현** (`extractStudentData` 함수)
   ```javascript
   // 학년/반 정보가 누락된 경우 이전 행의 값 사용
   if (!grade && lastGrade) grade = lastGrade;
   if (!cls && lastClass) cls = lastClass;
   ```

3. **새 필드 추가**
   - `startDate`: 봉사활동 시작일
   - `endDate`: 봉사활동 종료일
   - `area`: 봉사활동 지역
   - `schoolType`: 학교/개인 구분
   - `place`: 장소/기관

#### 3단계: UI 개선 - 학생 목록 테이블화
**파일**: `js/ui-renderer.js`, `css/style.css`

**수정 사항:**
1. **학생 목록을 테이블 형식으로 변경** (`renderStudentList` 함수)
   ```html
   <table>
     <thead>
       <tr><th>학년</th><th>반</th><th>이름</th><th>활동 수</th></tr>
     </thead>
     <tbody>
       <!-- 학생 행들 -->
     </tbody>
   </table>
   ```

2. **학생 선택 하이라이트 버그 수정** (`selectStudent` 함수)
   - 문제: 여러 학생이 동시에 하이라이트됨
   - 해결: 학생 ID를 정확히 매칭하여 해당 행만 `active` 클래스 추가

3. **테이블 스타일 추가** (`css/style.css`)
   ```css
   .student-table {
     width: 100%;
     border-collapse: collapse;
   }
   .student-table tbody tr:hover {
     background-color: var(--bg-color);
   }
   .student-table tbody tr.active {
     background-color: var(--primary-color);
     color: white;
   }
   ```

#### 4단계: 데이터 정렬 개선
**파일**: `js/data-manager.js`

**수정 사항:**
```javascript
// 학년 -> 반 -> 번호 순으로 정렬
students.sort((a, b) => {
  const [gradeA, classA, numA] = a.id.split('-').map(Number);
  const [gradeB, classB, numB] = b.id.split('-').map(Number);
  
  if (gradeA !== gradeB) return gradeA - gradeB;
  if (classA !== classB) return classA - classB;
  return numA - numB;
});
```

#### 5단계: 로고 및 푸터 추가
**파일**: `index.html`, `css/style.css`

**수정 사항:**
1. **로고 이미지 추가**
   ```html
   <link rel="icon" type="image/png" href="images/logo.png">
   <img src="images/logo.png" alt="Logo" class="logo">
   ```

2. **푸터 저작권 표시**
   ```html
   <footer class="footer">
     <p>© 2025 차형준. All rights reserved.</p>
   </footer>
   ```

3. **스타일 적용**
   ```css
   .logo {
     height: 40px;
     margin-right: 12px;
   }
   .footer {
     text-align: center;
     padding: 16px;
     font-size: 0.875rem;
     color: var(--text-sub);
   }
   ```

#### 6단계: 색상 테마 적용 (최종)
**파일**: `css/style.css`

**라이트 모드 색상 변경:**
| 변수 | 이전 | 변경 후 | 이유 |
|------|------|---------|------|
| `--primary-color` | #4f46e5 | **#1e3a8a** | 진한 네이비 블루로 눈의 피로 감소 |
| `--bg-color` | #f3f4f6 | **#ffffff** | 순백색으로 깔끔한 배경 |
| `--sidebar-bg` | #ffffff | **#f8fafc** | 미묘한 대비로 구역 구분 |
| `--text-main` | #111827 | **#1e293b** | 네이비 톤과 조화 |
| `--border-color` | #e5e7eb | **#e2e8f0** | 부드러운 경계선 |
| `--shadow-sm/md` | 검은색 기반 | **네이비 틴트** | 테마 일관성 |

**다크 모드 색상 변경:**
| 변수 | 이전 | 변경 후 | 이유 |
|------|------|---------|------|
| `--primary-color` | #6366f1 | **#60a5fa** | 더 밝은 블루로 가독성 향상 |
| `--primary-hover` | #818cf8 | **#93c5fd** | 호버 시 명확한 변화 |
| `--bg-color` | #111827 | **#0a1929** | 더 깊은 네이비 배경 |
| `--text-main` | #f9fafb | **#f8fafc** | 순백색에 가까운 텍스트 |
| `--shadow-sm/md` | 검은색 기반 | **블루 틴트** | 테마 일관성 |
| `--glass-bg` | rgba(31, 41, 55, 0.85) | **rgba(30, 41, 59, 0.9)** | 더 불투명하게 |

---

## 디자인 시스템

### 색상 팔레트

#### 🌞 라이트 모드
```css
--primary-color: #1e3a8a;      /* 진한 네이비 블루 - 주요 액션 */
--primary-hover: #1e40af;      /* 네이비 호버 */
--bg-color: #ffffff;           /* 순백색 배경 */
--sidebar-bg: #f8fafc;         /* 밝은 슬레이트 */
--card-bg: #ffffff;            /* 카드 배경 */
--text-main: #1e293b;          /* 다크 슬레이트 - 본문 텍스트 */
--text-sub: #64748b;           /* 슬레이트 - 보조 텍스트 */
--border-color: #e2e8f0;       /* 라이트 슬레이트 - 경계선 */
```

#### 🌙 다크 모드
```css
--primary-color: #60a5fa;      /* 밝은 블루 - 주요 액션 */
--primary-hover: #93c5fd;      /* 더 밝은 블루 */
--bg-color: #0a1929;           /* 깊은 네이비 배경 */
--sidebar-bg: #1e293b;         /* 슬레이트 */
--card-bg: #1e293b;            /* 카드 배경 */
--text-main: #f8fafc;          /* 밝은 슬레이트 - 본문 텍스트 */
--text-sub: #94a3b8;           /* 그레이 슬레이트 - 보조 텍스트 */
--border-color: #334155;       /* 다크 슬레이트 - 경계선 */
```

### 타이포그래피
- **폰트**: Noto Sans KR (Google Fonts)
- **본문 크기**: 14px (0.875rem)
- **제목 크기**: 18px - 24px

### 간격 시스템
- 기본 패딩: 12px, 16px, 20px, 24px
- 마진: 8px, 12px, 16px

---

## 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: CSS Variables, Flexbox, Grid
- **Vanilla JavaScript**: ES6+ 문법

### 외부 라이브러리
- **SheetJS (xlsx.full.min.js)**: Excel 파일 파싱
  - CDN: `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js`
- **Font Awesome**: 아이콘
  - CDN: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`
- **Google Fonts**: Noto Sans KR

### 개발 도구
- **Python HTTP Server**: 로컬 개발 서버 (`py -m http.server`)
- **openpyxl**: Excel 파일 구조 분석 (Python)

---

## 파일 구조

```
Activity/
├── index.html                  # 메인 HTML 파일
├── css/
│   └── style.css              # 전체 스타일시트
├── js/
│   ├── app.js                 # 메인 애플리케이션 로직
│   ├── data-manager.js        # 데이터 관리 클래스
│   ├── excel-parser.js        # Excel 파싱 클래스
│   └── ui-renderer.js         # UI 렌더링 클래스
├── images/
│   └── logo.png               # 로고 이미지
├── inspect_excel.py           # Excel 구조 분석 스크립트
├── inspect_volunteer.py       # 봉사활동 Excel 분석 스크립트 (v1)
├── inspect_volunteer2.py      # 봉사활동 Excel 분석 스크립트 (v2, openpyxl)
└── CHANGELOG.md               # 이 파일
```

---

## 중요 구현 사항

### 1. Excel 파싱 로직 (`excel-parser.js`)

#### 핵심 함수: `findHeaderRow(data)`
**목적**: Excel 시트에서 헤더 행을 자동으로 찾고 컬럼 매핑 생성

**구현 세부사항:**
- 처음 20행을 스캔
- 공백 제거 및 소문자 변환으로 정규화
- 부분 문자열 매칭으로 유연한 헤더 인식
- 필수 컬럼: `name` 또는 `grade + class` 조합

```javascript
findHeaderRow(data) {
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    const row = data[i];
    const colMap = {};
    
    row.forEach((cell, colIndex) => {
      if (!cell || typeof cell !== 'string') return;
      const val = cell.trim().replace(/\s+/g, '').toLowerCase();
      
      // 헤더 매칭 로직
      if (val.includes('학년') || val === '학년') colMap.grade = colIndex;
      // ... 기타 컬럼들
    });
    
    if (colMap.name !== undefined || 
        (colMap.grade !== undefined && colMap.class !== undefined)) {
      return { headerRowIndex: i, colMap };
    }
  }
  return { headerRowIndex: -1, colMap: {} };
}
```

#### 핵심 함수: `extractStudentData(row, colMap, lastGrade, lastClass)`
**목적**: 행에서 학생 데이터 추출 및 누락 정보 보완

**구현 세부사항:**
- Fill-down 로직으로 누락된 학년/반 정보 채우기
- 학생 ID 생성: `G-C-NN` 형식 (예: `1-5-03`)
- 숫자 정규화 및 패딩

```javascript
extractStudentData(row, colMap, lastGrade, lastClass) {
  let grade = colMap.grade !== undefined ? row[colMap.grade] : null;
  let cls = colMap.class !== undefined ? row[colMap.class] : null;
  
  // Fill-down 로직
  if (!grade && lastGrade) grade = lastGrade;
  if (!cls && lastClass) cls = lastClass;
  
  // 데이터 검증 및 ID 생성
  if (!grade || !cls || !num) {
    return { studentData: null, currentGrade: grade, currentClass: cls };
  }
  
  const cleanGrade = grade.toString().replace(/[^0-9]/g, '');
  const cleanClass = cls.toString().replace(/[^0-9]/g, '');
  const cleanNum = num.toString().replace(/[^0-9]/g, '');
  const fmtNum = cleanNum.padStart(2, '0');
  const id = `${cleanGrade}-${cleanClass}-${fmtNum}`;
  
  return { studentData: { id, name, content, ... }, currentGrade, currentClass };
}
```

### 2. 데이터 관리 (`data-manager.js`)

#### 핵심 함수: `mergeStudentData(newStudents)`
**목적**: 새 데이터와 기존 데이터 병합 (중복 제거, 요약 보존)

**구현 세부사항:**
- 기존 학생의 사용자 편집 요약 보존
- 활동 내용 기반 중복 제거
- 자동 정렬 (학년 -> 반 -> 번호)

```javascript
mergeStudentData(newStudents) {
  const existing = this.getAllStudents();
  const merged = new Map();
  
  // 기존 학생 데이터 로드
  existing.forEach(student => {
    merged.set(student.id, student);
  });
  
  // 새 데이터 병합
  newStudents.forEach(newStudent => {
    if (merged.has(newStudent.id)) {
      const existingStudent = merged.get(newStudent.id);
      
      // 요약 보존
      newStudent.autonomySummary = existingStudent.autonomySummary || '';
      newStudent.careerSummary = existingStudent.careerSummary || '';
      
      // 활동 병합 (중복 제거)
      const existingContents = new Set(
        existingStudent.activities.map(act => act.content)
      );
      newStudent.activities.forEach(act => {
        if (!existingContents.has(act.content)) {
          existingStudent.activities.push(act);
        }
      });
      
      merged.set(newStudent.id, existingStudent);
    } else {
      merged.set(newStudent.id, newStudent);
    }
  });
  
  // 정렬 및 저장
  const sortedStudents = Array.from(merged.values()).sort((a, b) => {
    const [gradeA, classA, numA] = a.id.split('-').map(Number);
    const [gradeB, classB, numB] = b.id.split('-').map(Number);
    
    if (gradeA !== gradeB) return gradeA - gradeB;
    if (classA !== classB) return classA - classB;
    return numA - numB;
  });
  
  this.saveStudents(sortedStudents);
}
```

### 3. UI 렌더링 (`ui-renderer.js`)

#### 핵심 함수: `selectStudent(id)`
**목적**: 학생 선택 시 시각적 피드백 및 상세 정보 표시

**구현 세부사항:**
- 정확한 학생 매칭으로 하이라이트 버그 수정
- 행 전체 active 클래스 토글

```javascript
selectStudent(id) {
  this.currentStudentId = id;
  
  // 테이블 행 업데이트
  const rows = this.studentListEl.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 4) {
      const grade = cells[0].textContent.trim();
      const cls = cells[1].textContent.trim();
      const name = cells[2].textContent.trim();
      
      // 학생 데이터에서 정확히 매칭
      const student = window.dataManager.getAllStudents().find(s => s.id === id);
      
      if (student && 
          student.id.split('-')[0] === grade && 
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
```

### 4. 바이트 카운팅 (`ui-renderer.js`)

**규칙:**
- 한글: 3바이트
- 영문/숫자/공백: 1바이트
- 기타 문자: 2바이트

```javascript
function countBytes(str) {
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charAt(i);
    if (char.match(/[가-힣]/)) {
      bytes += 3;  // 한글
    } else if (char.match(/[a-zA-Z0-9\s]/)) {
      bytes += 1;  // 영문, 숫자, 공백
    } else {
      bytes += 2;  // 기타
    }
  }
  return bytes;
}
```

---

## 🚨 중요 주의사항 (재작업 시 필독)

### ⚠️ 절대 변경하지 말 것

1. **색상 테마**
   - 라이트 모드 주색상: `#1e3a8a` (진한 네이비 블루) - 눈의 피로 감소를 위해 선택됨
   - 다크 모드 주색상: `#60a5fa` (밝은 블루) - 어두운 배경에서 가독성 최적화
   - 배경색: 라이트 `#ffffff`, 다크 `#0a1929` - 대비 최적화

2. **Excel 파싱 로직**
   - Fill-down 로직 제거 금지 - 누락된 학년/반 정보 처리를 위해 필수
   - 헤더 감지 로직의 유연성 유지 - 다양한 Excel 형식 지원

3. **데이터 병합 로직**
   - 사용자 편집 요약 보존 코드 - 데이터 재업로드 시 작성한 요약 손실 방지
   - 중복 활동 제거 로직 - 같은 파일 여러 번 로드 시 데이터 중복 방지

4. **학생 선택 하이라이트**
   - `selectStudent` 함수의 정확한 매칭 로직 - 여러 학생 하이라이트 버그 수정됨

### ✅ 추가 개선 가능 사항

1. **성능 최적화**
   - LocalStorage 용량 초과 시 IndexedDB 전환 고려
   - 대용량 Excel 파일 처리 시 Web Worker 사용

2. **기능 확장**
   - 활동 기록 검색 기능
   - 엑셀 내보내기 기능
   - 활동 카테고리별 통계
   - 다중 학생 선택 및 일괄 편집

3. **UX 개선**
   - 드래그 앤 드롭 파일 업로드
   - 활동 추가/삭제/편집 UI
   - 실행 취소/다시 실행 기능
   - 자동 저장 기능

### 🐛 알려진 제한사항

1. **LocalStorage 용량 제한**
   - 브라우저별로 5-10MB 제한
   - 대량 데이터 시 용량 초과 가능

2. **Excel 파일 형식**
   - 병합된 셀 처리 제한적
   - 복잡한 수식이 포함된 셀은 값만 추출

3. **브라우저 호환성**
   - 최신 Chrome, Firefox, Edge에서 테스트됨
   - IE11 미지원 (ES6 문법 사용)

---

## 📝 변경 이력 요약

| 날짜 | 버전 | 주요 변경사항 |
|------|------|---------------|
| 2025-11-30 | v1.0 | 초기 개발 완료 - Excel 파싱, UI 구현, 데이터 관리 |
| 2025-11-30 | v1.1 | 색상 테마 적용 (네이비 블루 팔레트) |
| 2025-11-30 | v1.2 | 다크 모드 개선 및 변경 로그 작성 |

---

## 📧 문의 및 지원

**개발자**: 차형준  
**저작권**: © 2025 차형준. All rights reserved.

---

> **마지막 업데이트**: 2025-11-30 14:26 KST  
> **문서 버전**: 1.0  
> **목적**: 재작업 시 불필요한 작업 번복 방지 및 실수 최소화
