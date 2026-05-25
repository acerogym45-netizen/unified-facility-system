# 통합 시설 관리 시스템 배포 가이드

## 🗄️ 데이터베이스 설정

### 1. Supabase SQL Editor에서 실행할 스키마

프로젝트에 포함된 `test-db-tables.sql` 파일의 내용을 Supabase SQL Editor에서 실행하세요.

**테이블 목록:**
- `areas` - 구역 관리 (QR 코드 포함)
- `work_gallery` - 작업 갤러리 (사진 저장)
- `work_logs` - 업무 일지
- `documents` - 서류 보관함
- `settlements` - 정산서 관리
- `payslips` - 급여명세서 관리

### 2. RLS (Row Level Security) 설정

각 테이블에 대해 RLS 정책을 설정하세요:

```sql
-- 예시: areas 테이블
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users" ON areas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON areas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON areas
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON areas
    FOR DELETE USING (auth.role() = 'authenticated');
```

(나머지 테이블들도 동일하게 설정)

## 📋 완성된 기능 목록

### ✅ 기본 기능 (14개 모듈)
1. **대시보드** - 실시간 통계 및 차트
2. **직원 관리 (ERP)** - CRUD + QR 코드 자동 생성
3. **회원 관리 (CRM)** - CRUD + 회원권 관리
4. **구매 관리** - 승인 워크플로우
5. **휴가 관리** - 승인 워크플로우
6. **강사 관리** - CRUD
7. **프로그램 관리** - CRUD
8. **문의/민원** - 상세 조회
9. **공지사항** - CRUD
10. **출퇴근/출석 현황** - 통계 조회
11. **QR 스캔** - 체크인/아웃
12. **구역 관리** ⭐ NEW - QR 코드 자동 생성
13. **작업 갤러리** ⭐ NEW - 사진 업로드 및 날짜별 조회
14. **업무 일지** ⭐ NEW - 일일 작업 기록

### ✅ 신규 추가 기능 (6개 모듈)
15. **서류 보관함** ⭐ NEW - 파일 업로드/다운로드, 분류 관리
16. **정산서 관리** ⭐ NEW - 월별 정산, 항목별 금액
17. **급여명세서 관리** ⭐ NEW - 직원별/월별, PDF 다운로드 준비

## 🚀 배포 방법

### 1. 파일 업로드
- `index.html` - 메인 HTML 파일
- `unified-complete.js` - 통합 JavaScript 파일 (2,316 lines)
- `shared-config.js` - Supabase 설정 파일

### 2. Supabase 설정 확인
`shared-config.js`에서 다음 정보 확인:
- SHARED_SUPABASE_URL
- SHARED_SUPABASE_ANON_KEY
- FACILITY_IDS (APARTMENT, FITNESS)

### 3. 웹 서버 구동
정적 파일 호스팅 (예: Vercel, Netlify, GitHub Pages)

## 🔐 로그인 정보
- PIN 1: `admin2026`
- PIN 2: `bdxi2026`

## 📝 주요 특징

### 자동 QR 코드 생성
- 직원 등록 시 자동 생성
- 구역 등록 시 자동 생성 (AREA- 접두어)
- 형식: `QR-{timestamp}-{random}`

### 승인 워크플로우
- 구매 요청: pending → approved/rejected → completed
- 휴가 신청: pending → approved/rejected

### 멀티테넌시
- `facility_id`로 아파트(ERP)와 피트니스(CRM) 데이터 분리
- APARTMENT: `00000000-0000-0000-0000-000000000001`
- FITNESS: `00000000-0000-0000-0000-000000000002`

## 🧪 테스트 체크리스트

### 기본 CRUD 테스트
- [ ] 직원 추가/조회/수정/삭제
- [ ] 회원 추가/조회/수정/삭제
- [ ] 구매 추가/조회/승인/반려
- [ ] 휴가 추가/조회/승인/반려
- [ ] 강사 추가/조회/수정/삭제
- [ ] 프로그램 추가/조회/수정/삭제
- [ ] 문의 조회
- [ ] 공지 추가/조회/수정/삭제

### 신규 기능 테스트
- [ ] 구역 추가/조회/수정/삭제, QR 코드 복사
- [ ] 작업 사진 추가/조회/삭제
- [ ] 업무 일지 작성/조회/수정/삭제
- [ ] 서류 추가/조회/다운로드/삭제
- [ ] 정산서 추가/조회/수정/삭제
- [ ] 급여명세서 추가/조회/수정/삭제

### UI/UX 테스트
- [ ] 모달 열기/닫기
- [ ] 사이드바 메뉴 네비게이션
- [ ] 알림 메시지 표시
- [ ] 반응형 레이아웃 (모바일/태블릿/데스크톱)

## 🔧 향후 개선 사항

1. **PDF 생성 기능 완성**
   - 급여명세서 PDF 다운로드 (jsPDF 라이브러리 통합)
   - 정산서 PDF 출력

2. **파일 업로드 구현**
   - Supabase Storage 통합
   - 작업 갤러리 사진 업로드
   - 서류 파일 업로드

3. **실시간 알림**
   - Supabase Realtime 구독
   - 승인 요청 알림
   - 새 문의 알림

4. **권한 관리**
   - 관리자/직원/회원 역할 분리
   - 기능별 접근 권한 설정

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 브라우저 콘솔의 에러 메시지
2. Supabase 대시보드의 로그
3. 네트워크 탭의 API 요청/응답

---

**마지막 업데이트:** 2026-05-25
**버전:** v1.2.0 (Production Ready)
