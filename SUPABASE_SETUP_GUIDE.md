# 📘 Supabase 데이터베이스 설정 가이드

## 🎯 목적
통합 시설 관리 시스템의 6개 신규 테이블을 Supabase에 생성하고 RLS 정책을 설정합니다.

---

## 📋 설정할 테이블 목록

1. **areas** - 구역 관리 (QR 코드 포함)
2. **work_gallery** - 작업 갤러리 (사진 저장)
3. **work_logs** - 업무 일지
4. **documents** - 서류 보관함
5. **settlements** - 정산서 관리
6. **payslips** - 급여명세서 관리

---

## 🚀 설정 방법

### 방법 1: 한 번에 전체 설정 (권장)

1. **Supabase 대시보드 접속**
   - https://app.supabase.com 로그인
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 `SQL Editor` 클릭
   - `New query` 클릭

3. **SQL 코드 복사 및 실행**
   - `supabase-complete-setup.sql` 파일 내용 전체 복사
   - SQL Editor에 붙여넣기
   - 하단의 `Run` 버튼 클릭 (또는 Ctrl/Cmd + Enter)

4. **실행 결과 확인**
   ```
   ========================================
   통합 시설 관리 시스템 DB 설정 완료!
   ========================================
   생성된 테이블:
   1. areas (구역 관리)
   2. work_gallery (작업 갤러리)
   3. work_logs (업무 일지)
   4. documents (서류 관리)
   5. settlements (정산서 관리)
   6. payslips (급여명세서 관리)
   ========================================
   RLS 정책: 모든 테이블 활성화 완료
   샘플 데이터: 삽입 완료
   통계 뷰: 3개 생성 완료
   ========================================
   ```

5. **테이블 생성 확인**
   - 왼쪽 메뉴에서 `Table Editor` 클릭
   - 6개 테이블이 생성되었는지 확인

---

## 📊 생성되는 구조

### 1. 구역 관리 (areas)
```sql
- id: UUID (Primary Key)
- facility_id: UUID (멀티테넌시)
- name: TEXT (구역명)
- description: TEXT (설명)
- qr_code: TEXT UNIQUE (QR 코드)
- is_active: BOOLEAN (활성 상태)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 2. 작업 갤러리 (work_gallery)
```sql
- id: UUID (Primary Key)
- facility_id: UUID
- area_name: TEXT (구역명)
- work_date: DATE (작업일)
- photo_url: TEXT (사진 URL)
- notes: TEXT (비고)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 3. 업무 일지 (work_logs)
```sql
- id: UUID (Primary Key)
- facility_id: UUID
- log_date: DATE (작업일)
- worker_name: TEXT (작업자)
- work_type: TEXT (청소/점검/수리/기타)
- description: TEXT (내용)
- special_notes: TEXT (특이사항)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 4. 서류 관리 (documents)
```sql
- id: UUID (Primary Key)
- facility_id: UUID
- title: TEXT (제목)
- category: TEXT (계약서/견적서/청구서/보고서/기타)
- file_url: TEXT (파일 URL)
- file_type: TEXT (파일 타입)
- file_size: INTEGER (파일 크기)
- notes: TEXT (비고)
- uploader: TEXT (업로더)
- uploaded_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 5. 정산서 관리 (settlements)
```sql
- id: UUID (Primary Key)
- facility_id: UUID
- month: TEXT (YYYY-MM)
- category: TEXT (급여/관리비/수리비/기타)
- amount: DECIMAL(15,2) (금액)
- description: TEXT (설명)
- is_paid: BOOLEAN (지급 여부)
- paid_at: TIMESTAMPTZ (지급일)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 6. 급여명세서 관리 (payslips)
```sql
- id: UUID (Primary Key)
- facility_id: UUID
- pay_month: TEXT (YYYY-MM)
- employee_name: TEXT (직원명)
- base_salary: DECIMAL(15,2) (기본급)
- allowance: DECIMAL(15,2) (수당)
- deduction: DECIMAL(15,2) (공제액)
- net_salary: DECIMAL(15,2) (실수령액)
- is_paid: BOOLEAN (지급 여부)
- paid_at: TIMESTAMPTZ (지급일)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

---

## 🔐 RLS (Row Level Security) 정책

### 자동 설정되는 정책

모든 테이블에 대해 다음 4가지 정책이 자동 설정됩니다:

```sql
1. SELECT (조회): 모든 사용자 허용
2. INSERT (추가): 모든 사용자 허용
3. UPDATE (수정): 모든 사용자 허용
4. DELETE (삭제): 모든 사용자 허용
```

### 정책 확인 방법

1. Supabase 대시보드 → `Authentication` → `Policies`
2. 각 테이블별로 4개의 정책이 활성화되어 있는지 확인

### 보안 강화 (선택 사항)

현재는 모든 사용자에게 모든 권한이 열려있습니다. 
프로덕션 환경에서는 다음과 같이 정책을 수정할 수 있습니다:

```sql
-- 예시: 인증된 사용자만 접근 가능하도록 변경
DROP POLICY IF EXISTS "areas_select_policy" ON areas;
CREATE POLICY "areas_select_policy" ON areas
    FOR SELECT USING (auth.role() = 'authenticated');

-- 예시: facility_id 기반 접근 제어
DROP POLICY IF EXISTS "areas_select_policy" ON areas;
CREATE POLICY "areas_select_policy" ON areas
    FOR SELECT USING (
        facility_id IN (
            SELECT facility_id 
            FROM user_facilities 
            WHERE user_id = auth.uid()
        )
    );
```

---

## 🎁 샘플 데이터

SQL 스크립트 실행 시 다음 샘플 데이터가 자동으로 삽입됩니다:

### 샘플 구역 (3개)
- 1동 로비 (아파트)
- 2동 복도 (아파트)
- 피트니스 메인홀 (피트니스)

### 샘플 업무 일지 (3개)
- 김청소 - 청소 작업
- 이점검 - 점검 작업
- 박정비 - 수리 작업

### 샘플 정산서 (3개)
- 급여 정산 (미지급)
- 관리비 정산 (미지급)
- 수리비 정산 (지급완료)

---

## 📈 통계 뷰

자동으로 생성되는 3개의 통계 뷰:

### 1. settlement_monthly_summary
월별 정산 요약 통계
```sql
SELECT * FROM settlement_monthly_summary;
```

### 2. payslip_employee_summary
직원별 급여 요약
```sql
SELECT * FROM payslip_employee_summary;
```

### 3. work_logs_summary
작업 일지 월별 통계
```sql
SELECT * FROM work_logs_summary;
```

---

## 🔧 추가 기능

### 자동 업데이트 시간 트리거

모든 테이블에는 `updated_at` 컬럼이 자동으로 갱신됩니다:
- 레코드 수정 시 `updated_at`이 현재 시간으로 자동 업데이트
- 트리거 함수: `update_updated_at_column()`

### 인덱스 최적화

각 테이블에는 조회 성능 향상을 위한 인덱스가 설정되어 있습니다:
- `facility_id` - 멀티테넌시 필터링
- 날짜/월 컬럼 - 시간순 정렬
- 카테고리/타입 컬럼 - 분류별 필터링
- 상태 컬럼 - 상태별 필터링

---

## ✅ 설정 확인 체크리스트

설정 완료 후 다음 항목을 확인하세요:

- [ ] 6개 테이블 생성 확인 (Table Editor)
- [ ] 각 테이블에 4개의 RLS 정책 활성화 확인
- [ ] 샘플 데이터 삽입 확인
- [ ] 3개의 통계 뷰 생성 확인
- [ ] 인덱스 생성 확인
- [ ] 트리거 함수 생성 확인

### 테이블 확인 SQL
```sql
-- 테이블 목록 조회
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('areas', 'work_gallery', 'work_logs', 'documents', 'settlements', 'payslips');

-- 각 테이블의 레코드 수 확인
SELECT 'areas' as table_name, COUNT(*) as count FROM areas
UNION ALL
SELECT 'work_gallery', COUNT(*) FROM work_gallery
UNION ALL
SELECT 'work_logs', COUNT(*) FROM work_logs
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'settlements', COUNT(*) FROM settlements
UNION ALL
SELECT 'payslips', COUNT(*) FROM payslips;
```

---

## 🚨 문제 해결

### 오류: "extension uuid-ossp does not exist"
```sql
-- 다음 명령어를 먼저 실행
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 오류: "policy already exists"
```sql
-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "areas_select_policy" ON areas;
-- 그 후 정책 생성 코드 실행
```

### 오류: "table already exists"
```sql
-- 테이블 삭제 후 재생성
DROP TABLE IF EXISTS areas CASCADE;
-- 그 후 테이블 생성 코드 실행
```

### 샘플 데이터 중복 오류
- `ON CONFLICT DO NOTHING` 구문이 있어 중복 시 자동으로 무시됩니다.
- 문제 없으니 계속 진행하세요.

---

## 📞 추가 지원

문제가 발생하면:
1. Supabase 대시보드 → `SQL Editor` → `Logs` 확인
2. 에러 메시지 복사 후 문서 참조
3. 필요시 테이블 삭제 후 재생성

---

## 🎉 완료 후

데이터베이스 설정이 완료되면:
1. 애플리케이션 (`index.html`) 열기
2. PIN 입력 (`admin2026` 또는 `bdxi2026`)
3. 6개 신규 메뉴 확인:
   - 구역 관리
   - 작업 갤러리
   - 업무 일지
   - 서류 보관함
   - 정산서
   - 급여명세서

---

**설정 파일**: `supabase-complete-setup.sql`
**작성일**: 2026-05-25
**버전**: v1.0 (Complete)
