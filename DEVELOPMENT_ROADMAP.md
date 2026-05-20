# 🚀 통합 시설 관리 시스템 - 개발 로드맵

> **작성일**: 2026-05-20  
> **버전**: v1.0.0  
> **목적**: 기존 ERP + CRM 기능 분석 및 개선/확장 계획

---

## 📊 1. 기존 시스템 기능 분석

### 🏢 **ERP 시스템 (KINDWON Admin Dashboard v2.1)**

**위치**: `/home/user/webapp/`

#### ✅ 구현된 핵심 기능

##### 1️⃣ **직원 관리**
- ✅ 직원 등록/수정/삭제
- ✅ 직원 정보 (이름, 직책, 연락처, 계약일, 계약만료일)
- ✅ 재직/퇴사 상태 관리
- ✅ QR 코드 발급 (직원별 고유 QR)
- ✅ 직원 검색 기능
- ✅ 직원 목록 필터링

##### 2️⃣ **출퇴근 관리**
- ✅ QR 스캔 출근/퇴근 기록
- ✅ 실시간 출근 현황 대시보드
- ✅ 출퇴근 기록 조회 (직원별, 날짜별)
- ✅ 월간 근태표 생성 (PDF)
- ✅ **퇴근 미기록 차단 시스템**
  - 퇴근 기록 없으면 다음날 출근 차단
  - 차단된 직원 목록 조회
  - 관리자가 퇴근 시간 수동 입력하여 차단 해제
- ✅ 오늘 퇴근 미기록 알림 (30초마다 자동 갱신)

##### 3️⃣ **구매 관리**
- ✅ 구매 요청 등록 (여러 물품 동시 요청)
- ✅ 구매 요청 상태 (대기/승인/거부)
- ✅ 구매 검수 기능
  - 물품별 검수 체크
  - 검수 완료 처리
  - 검수 로그 기록
- ✅ 구매 내역 조회
- ✅ 구매 요청 수정/삭제

##### 4️⃣ **휴가 관리**
- ✅ 휴가 신청 (시작일, 종료일, 사유)
- ✅ 휴가 승인/거부
- ✅ 휴가 현황 조회
- ✅ 휴가 일정 캘린더 뷰
- ✅ 휴가 내역 CSV 다운로드

##### 5️⃣ **민원 관리**
- ✅ 민원 등록 (제목, 내용, 우선순위)
- ✅ 민원 상태 (대기/처리중/완료)
- ✅ 민원 담당자 배정
- ✅ 민원 답변 등록
- ✅ 민원 조회 및 필터링

##### 6️⃣ **아파트 관리**
- ✅ 아파트(시설) 등록/수정
- ✅ 아파트별 데이터 분리 (Multi-tenancy)
- ✅ 아파트 선택 시스템
- ✅ 브랜드 설정 (로고, 회사명)

##### 7️⃣ **대시보드 & 분석**
- ✅ 실시간 통계 카드 (직원 수, 출근자, 구매 요청, 민원)
- ✅ 주간 출석 현황 차트 (Chart.js)
- ✅ 월간 출석 추이 그래프
- ✅ 시설별 비교 차트

##### 8️⃣ **PDF 생성**
- ✅ **Paperlogy 한글 폰트 지원**
- ✅ 월간 근태표 단일 페이지 레이아웃
- ✅ 직원별 근태 요약
- ✅ QR 코드 포함 PDF

##### 9️⃣ **기술 특징**
- ✅ Supabase PostgreSQL 연동
- ✅ Realtime 구독 (cleaning_tasks 테이블)
- ✅ Row Level Security (RLS)
- ✅ Tailwind CSS 스타일링
- ✅ 반응형 디자인

---

### 💪 **CRM 시스템 (Pilates Webapp)**

**위치**: `/home/user/webapp-crm/`

#### ✅ 구현된 핵심 기능

##### 1️⃣ **회원 관리**
- ✅ 레슨 신청 등록 (입주자용)
  - 이름, 동/호수, 전화번호, 생년월일
  - 프로그램 선택 (그룹/듀엣/개인)
  - 서명 패드 (Signature Pad)
  - 개인정보 동의서
- ✅ 신청 조회/취소/변경 기능
- ✅ 회원 상태 (대기중/승인/거부)
- ✅ 중복 신청 체크 (이름 + 전화번호)

##### 2️⃣ **관리자 기능**
- ✅ 신청 승인/거부 처리
- ✅ 신청자 상세 정보 조회
- ✅ 신청 내역 CSV 다운로드
- ✅ 필터링 (상태별, 프로그램별)
- ✅ 검색 (이름, 동/호수)

##### 3️⃣ **강사 관리** (`admin-instructors.html`)
- ✅ 강사 등록/수정/삭제
- ✅ 강사 프로필 (이름, 소개, 자격증, 사진)
- ✅ 강사 공개/비공개 설정
- ✅ 강사 목록 조회

##### 4️⃣ **프로그램 관리** (`admin-programs.html`)
- ✅ 프로그램 등록/수정/삭제
- ✅ 프로그램 정보 (이름, 설명, 가격, 기간)
- ✅ 커리큘럼 관리
- ✅ 프로그램별 통계

##### 5️⃣ **문의 관리** (`admin-inquiry.html`)
- ✅ 입주자 문의 등록
- ✅ 관리자 답변 등록
- ✅ 문의 상태 (대기/답변완료)
- ✅ 문의 내역 조회
- ✅ 내 문의 조회 (입주자용)

##### 6️⃣ **공지사항 관리** (`admin-notices.html`)
- ✅ 공지사항 등록/수정/삭제
- ✅ 공지 상태 (활성/비활성)
- ✅ 공지 우선순위
- ✅ 공지 목록 조회

##### 7️⃣ **해지 관리** (`admin-cancellation.html`)
- ✅ 회원 해지 신청
- ✅ 해지 사유 관리
- ✅ 해지 승인/거부
- ✅ 해지 내역 조회

##### 8️⃣ **단지(Complex) 관리** (`admin-complex.html`)
- ✅ 단지별 데이터 분리
- ✅ 단지 선택 시스템
- ✅ 단지별 통계

##### 9️⃣ **접수 기간 관리**
- ✅ 월별 접수 기간 설정 (20~27일)
- ✅ 기간 외 접수 차단
- ✅ 취소/변경 가능 기간 설정
- ✅ 기간 안내 배너 표시

##### 🔟 **Master Admin** (`master-admin.html`)
- ✅ 전체 단지 통합 관리
- ✅ 단지별 통계 대시보드
- ✅ 단지 등록/수정
- ✅ CSV 일괄 가져오기

##### 1️⃣1️⃣ **UI/UX 특징**
- ✅ 모바일 최적화 (user-scalable=no)
- ✅ 퀵 액션 버튼 (커리큘럼, 강사소개, 공지사항, 문의)
- ✅ 프로그레스 스텝 인디케이터
- ✅ 서명 패드 통합
- ✅ 로딩 화면

---

## 🎯 2. 개선 및 추가 기능 제안

### 🔴 **긴급 개선 사항 (High Priority)**

#### 1️⃣ **통합 대시보드 강화**
**현재 문제**: 
- 통합 시스템에 기본 통계만 표시됨
- 실시간 데이터 연동 없음

**개선 방안**:
```javascript
// 실시간 통계 업데이트
- 직원/회원 통합 카운트
- 오늘 출근/출석 현황
- 금일 구매 요청/문의 건수
- 월간 매출/비용 분석
- 주간 출석률 추이 (ERP + CRM 통합)
```

**예상 작업 시간**: 4-6시간

---

#### 2️⃣ **통합 출석 시스템**
**현재 문제**:
- ERP: 직원 출퇴근만 관리
- CRM: 회원 출석 기능 없음

**추가 기능**:
```
✅ 회원 출석 체크인/아웃 (QR 코드)
✅ 프로그램별 출석 현황
✅ 강사별 수업 출석 관리
✅ 출석률 통계 (회원별, 프로그램별)
✅ 출석 알림 (SMS/Push)
```

**DB 테이블 추가**:
```sql
-- 회원 출석 기록
CREATE TABLE member_attendance (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  program_id UUID REFERENCES programs(id),
  instructor_id UUID REFERENCES instructors(id),
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  attendance_type TEXT, -- 'group', 'duet', 'private'
  created_at TIMESTAMP DEFAULT NOW()
);
```

**예상 작업 시간**: 8-10시간

---

#### 3️⃣ **급여 관리 시스템**
**현재 상태**: ERP에 `employee_payroll_dashboard.html` 파일 존재하지만 통합 안 됨

**추가 기능**:
```
✅ 직원 급여 정보 등록
✅ 근무시간 기반 급여 자동 계산
✅ 수당/공제 항목 관리
✅ 월별 급여 명세서 생성 (PDF)
✅ 급여 지급 내역 관리
✅ 연말정산 자료 생성
```

**DB 테이블 추가**:
```sql
-- 급여 정보
CREATE TABLE payroll (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  base_salary DECIMAL(10,2),
  overtime_pay DECIMAL(10,2),
  deductions DECIMAL(10,2),
  net_salary DECIMAL(10,2),
  payment_date DATE,
  year_month TEXT, -- 'YYYY-MM'
  created_at TIMESTAMP DEFAULT NOW()
);
```

**예상 작업 시간**: 12-15시간

---

#### 4️⃣ **회원권 관리 시스템**
**현재 문제**: CRM에 회원권 만료 추적 기능 없음

**추가 기능**:
```
✅ 회원권 등록 (시작일, 종료일, 횟수)
✅ 회원권 사용 내역 추적
✅ 남은 횟수/기간 자동 계산
✅ 만료 임박 알림 (D-7, D-3, D-1)
✅ 회원권 연장/갱신 관리
✅ 회원권 통계 (판매액, 만료율)
```

**DB 테이블 추가**:
```sql
-- 회원권
CREATE TABLE memberships (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  program_id UUID REFERENCES programs(id),
  start_date DATE,
  end_date DATE,
  total_sessions INT,
  used_sessions INT DEFAULT 0,
  status TEXT, -- 'active', 'expired', 'suspended'
  created_at TIMESTAMP DEFAULT NOW()
);

-- 회원권 사용 기록
CREATE TABLE membership_usage (
  id UUID PRIMARY KEY,
  membership_id UUID REFERENCES memberships(id),
  used_date DATE,
  instructor_id UUID REFERENCES instructors(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**예상 작업 시간**: 10-12시간

---

#### 5️⃣ **수업 스케줄링 시스템**
**현재 상태**: 프로그램 정보만 있고 실제 스케줄 관리 없음

**추가 기능**:
```
✅ 주간 수업 스케줄 등록
✅ 강사별 타임테이블
✅ 수업 예약 시스템
✅ 수업 정원 관리
✅ 대기자 명단 관리
✅ 수업 캔슬/변경 알림
✅ 캘린더 뷰 (일/주/월)
```

**DB 테이블 추가**:
```sql
-- 수업 스케줄
CREATE TABLE class_schedules (
  id UUID PRIMARY KEY,
  program_id UUID REFERENCES programs(id),
  instructor_id UUID REFERENCES instructors(id),
  day_of_week TEXT, -- 'Mon', 'Tue', 'Wed', etc.
  start_time TIME,
  end_time TIME,
  max_capacity INT,
  current_capacity INT DEFAULT 0,
  status TEXT, -- 'active', 'cancelled', 'full'
  created_at TIMESTAMP DEFAULT NOW()
);

-- 수업 예약
CREATE TABLE class_bookings (
  id UUID PRIMARY KEY,
  schedule_id UUID REFERENCES class_schedules(id),
  member_id UUID REFERENCES members(id),
  booking_date DATE,
  status TEXT, -- 'confirmed', 'cancelled', 'waiting'
  created_at TIMESTAMP DEFAULT NOW()
);
```

**예상 작업 시간**: 15-18시간

---

### 🟡 **중요 개선 사항 (Medium Priority)**

#### 6️⃣ **재고 관리 시스템**
**현재 상태**: 구매 요청만 있고 재고 추적 없음

**추가 기능**:
```
✅ 물품 카테고리 관리
✅ 재고 수량 실시간 추적
✅ 입고/출고 기록
✅ 재고 부족 알림
✅ 재고 회전율 분석
✅ 발주 제안 시스템
```

**예상 작업 시간**: 8-10시간

---

#### 7️⃣ **매출 관리 시스템**
**현재 상태**: 매출 데이터 수집 안 됨

**추가 기능**:
```
✅ 회원권 판매 기록
✅ 일일/월별 매출 통계
✅ 결제 수단별 분석
✅ 매출 추이 그래프
✅ 손익 분석 (매출 - 비용)
✅ 매출 목표 설정 및 추적
```

**예상 작업 시간**: 10-12시간

---

#### 8️⃣ **알림 시스템 통합**
**현재 상태**: 각 시스템에서 개별 알림만 존재

**통합 알림 센터**:
```
✅ 통합 알림 벨 아이콘 (헤더)
✅ 읽음/안 읽음 표시
✅ 알림 유형별 필터링
✅ 알림 설정 (ON/OFF)
✅ 실시간 푸시 알림 (Supabase Realtime)
✅ 이메일/SMS 알림 연동
```

**알림 유형**:
- 출퇴근 이상 (퇴근 미기록)
- 구매 요청 승인/거부
- 휴가 신청 승인/거부
- 회원권 만료 임박
- 신규 문의 등록
- 수업 예약 확인

**예상 작업 시간**: 12-15시간

---

#### 9️⃣ **모바일 앱 최적화**
**현재 상태**: 웹 반응형만 지원

**개선 사항**:
```
✅ PWA 지원 (Progressive Web App)
✅ 홈 화면 추가 가능
✅ 오프라인 모드 (Service Worker)
✅ 푸시 알림 (Web Push API)
✅ 카메라 접근 (QR 스캔)
✅ 위치 기반 체크인
```

**예상 작업 시간**: 15-20시간

---

#### 🔟 **권한 관리 시스템**
**현재 상태**: 단순 PIN 로그인

**개선 사항**:
```
✅ 역할 기반 접근 제어 (RBAC)
  - Super Admin (모든 권한)
  - Facility Manager (시설별 관리)
  - HR Manager (인사 관리)
  - Instructor (강사 전용)
  - Member (회원 전용)
✅ 권한별 메뉴 표시/숨김
✅ API 레벨 권한 검증
✅ 활동 로그 기록 (감사 추적)
```

**DB 테이블 추가**:
```sql
-- 사용자 역할
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID,
  role TEXT, -- 'super_admin', 'manager', 'instructor', 'member'
  facility_id UUID REFERENCES facilities(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 활동 로그
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  action TEXT, -- 'create', 'update', 'delete', 'view'
  resource TEXT, -- 'employee', 'member', 'purchase', etc.
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**예상 작업 시간**: 10-12시간

---

### 🟢 **부가 기능 (Low Priority)**

#### 1️⃣1️⃣ **보고서 생성 시스템**
```
✅ 월간 운영 보고서 (PDF/Excel)
✅ 직원 근태 보고서
✅ 회원 출석 보고서
✅ 매출 분석 보고서
✅ 재고 현황 보고서
✅ 대시보드 스냅샷 저장
```

**예상 작업 시간**: 8-10시간

---

#### 1️⃣2️⃣ **통계 분석 대시보드**
```
✅ Google Analytics 연동
✅ 사용자 행동 분석
✅ 인기 프로그램 분석
✅ 피크 타임 분석
✅ 회원 이탈률 분석
✅ A/B 테스트 결과
```

**예상 작업 시간**: 12-15시간

---

#### 1️⃣3️⃣ **통합 검색 시스템**
```
✅ 전역 검색 바 (헤더)
✅ 직원/회원 통합 검색
✅ 검색 자동완성
✅ 최근 검색 기록
✅ 검색 결과 필터링
✅ 고급 검색 (다중 조건)
```

**예상 작업 시간**: 6-8시간

---

#### 1️⃣4️⃣ **데이터 백업 시스템**
```
✅ 자동 백업 스케줄
✅ 수동 백업 트리거
✅ 백업 복원 기능
✅ 백업 파일 다운로드
✅ 백업 상태 모니터링
```

**예상 작업 시간**: 8-10시간

---

#### 1️⃣5️⃣ **다국어 지원**
```
✅ 한국어/영어 전환
✅ i18n 라이브러리 통합
✅ 언어별 텍스트 관리
✅ 날짜/통화 로케일화
```

**예상 작업 시간**: 10-12시간

---

## 📋 3. 개발 워크플로우

### 🎯 Phase 1: 핵심 통합 (Week 1-2)

#### **Sprint 1.1: 대시보드 강화** (3일)
```bash
작업 목록:
□ 실시간 통계 API 구현
□ Chart.js 통합 차트 생성
□ Supabase Realtime 구독 설정
□ 대시보드 UI 개선
□ 반응형 레이아웃 최적화

Git Branch: feature/enhanced-dashboard
Commit Message: "feat(dashboard): Add real-time statistics and charts"
```

---

#### **Sprint 1.2: 통합 출석 시스템** (5일)
```bash
작업 목록:
□ DB 테이블 생성 (member_attendance)
□ 회원 QR 코드 생성
□ 출석 체크인/아웃 API
□ 출석 기록 UI 구현
□ 출석률 통계 페이지
□ PDF 출석 보고서

Git Branch: feature/member-attendance
Commit Message: "feat(attendance): Implement member attendance tracking system"
```

---

#### **Sprint 1.3: 회원권 관리** (4일)
```bash
작업 목록:
□ DB 테이블 생성 (memberships, membership_usage)
□ 회원권 등록 UI
□ 회원권 사용 추적
□ 만료 알림 시스템
□ 회원권 통계 대시보드
□ 회원권 연장 기능

Git Branch: feature/membership-management
Commit Message: "feat(membership): Add membership tracking and expiry alerts"
```

---

### 🎯 Phase 2: 핵심 업무 자동화 (Week 3-4)

#### **Sprint 2.1: 급여 관리 시스템** (6일)
```bash
작업 목록:
□ DB 테이블 생성 (payroll)
□ 급여 정보 등록 UI
□ 근무시간 자동 계산
□ 급여 명세서 PDF 생성
□ 급여 지급 내역 관리
□ 연말정산 자료 준비

Git Branch: feature/payroll-system
Commit Message: "feat(payroll): Implement automated payroll management"
```

---

#### **Sprint 2.2: 수업 스케줄링** (7일)
```bash
작업 목록:
□ DB 테이블 생성 (class_schedules, class_bookings)
□ 스케줄 등록 UI
□ 캘린더 뷰 구현 (FullCalendar.js)
□ 수업 예약 시스템
□ 정원 관리 및 대기자 명단
□ 예약 알림 시스템

Git Branch: feature/class-scheduling
Commit Message: "feat(scheduling): Add class scheduling and booking system"
```

---

### 🎯 Phase 3: 운영 효율화 (Week 5-6)

#### **Sprint 3.1: 재고 관리** (5일)
```bash
작업 목록:
□ DB 테이블 생성 (inventory)
□ 재고 등록/수정 UI
□ 입고/출고 기록
□ 재고 부족 알림
□ 재고 회전율 분석
□ 발주 제안 시스템

Git Branch: feature/inventory-management
Commit Message: "feat(inventory): Implement inventory tracking system"
```

---

#### **Sprint 3.2: 매출 관리** (5일)
```bash
작업 목록:
□ DB 테이블 생성 (sales)
□ 매출 기록 등록
□ 일일/월별 통계
□ 매출 추이 그래프
□ 손익 분석
□ 매출 목표 설정

Git Branch: feature/sales-management
Commit Message: "feat(sales): Add sales tracking and analytics"
```

---

#### **Sprint 3.3: 알림 시스템 통합** (6일)
```bash
작업 목록:
□ 알림 센터 UI 구현
□ Supabase Realtime 알림
□ 알림 유형별 처리
□ 읽음/안 읽음 관리
□ 알림 설정 페이지
□ 이메일/SMS 연동 (선택)

Git Branch: feature/notification-center
Commit Message: "feat(notification): Create unified notification system"
```

---

### 🎯 Phase 4: 사용자 경험 개선 (Week 7-8)

#### **Sprint 4.1: 모바일 최적화** (7일)
```bash
작업 목록:
□ PWA 설정 (manifest.json, service-worker.js)
□ 오프라인 모드 구현
□ 푸시 알림 설정
□ 카메라 QR 스캔
□ 터치 최적화
□ 로딩 성능 개선

Git Branch: feature/mobile-optimization
Commit Message: "feat(mobile): Add PWA support and mobile optimizations"
```

---

#### **Sprint 4.2: 권한 관리** (5일)
```bash
작업 목록:
□ DB 테이블 생성 (user_roles, activity_logs)
□ RBAC 미들웨어 구현
□ 역할별 메뉴 제어
□ 활동 로그 기록
□ 권한 설정 UI
□ 감사 추적 페이지

Git Branch: feature/rbac-system
Commit Message: "feat(auth): Implement role-based access control"
```

---

### 🎯 Phase 5: 분석 및 보고 (Week 9-10)

#### **Sprint 5.1: 보고서 시스템** (4일)
```bash
작업 목록:
□ 보고서 템플릿 생성
□ 월간 운영 보고서
□ 근태 보고서
□ 출석 보고서
□ 매출 보고서
□ 엑셀 다운로드 기능

Git Branch: feature/report-generator
Commit Message: "feat(reports): Add automated report generation"
```

---

#### **Sprint 5.2: 통계 분석** (6일)
```bash
작업 목록:
□ Google Analytics 연동
□ 사용자 행동 분석
□ 인기 프로그램 분석
□ 피크 타임 분석
□ 회원 이탈률 분석
□ 분석 대시보드 UI

Git Branch: feature/analytics-dashboard
Commit Message: "feat(analytics): Add advanced analytics and insights"
```

---

## 🛠️ 4. 기술 스택 권장사항

### **현재 사용 중**
```
✅ Frontend: HTML5, CSS3, JavaScript (ES6+)
✅ CSS Framework: Tailwind CSS
✅ Database: Supabase (PostgreSQL)
✅ Charts: Chart.js
✅ PDF: jsPDF + autoTable
✅ QR: QRCode.js
✅ Deployment: Vercel
```

### **추가 권장**
```
🔹 State Management: Zustand or Pinia
🔹 Calendar: FullCalendar.js
🔹 Date Handling: date-fns or Day.js
🔹 Form Validation: Yup or Zod
🔹 HTTP Client: Axios
🔹 Excel Export: SheetJS (XLSX)
🔹 Push Notifications: Firebase Cloud Messaging
🔹 SMS: Twilio or AWS SNS
🔹 Email: SendGrid or AWS SES
```

---

## 📊 5. 데이터베이스 스키마 확장

### **신규 테이블 목록**

```sql
-- 1. 회원 출석
member_attendance (id, member_id, program_id, instructor_id, check_in_time, check_out_time, attendance_type, created_at)

-- 2. 회원권
memberships (id, member_id, program_id, start_date, end_date, total_sessions, used_sessions, status, created_at)

-- 3. 회원권 사용 기록
membership_usage (id, membership_id, used_date, instructor_id, notes, created_at)

-- 4. 급여
payroll (id, employee_id, base_salary, overtime_pay, deductions, net_salary, payment_date, year_month, created_at)

-- 5. 수업 스케줄
class_schedules (id, program_id, instructor_id, day_of_week, start_time, end_time, max_capacity, current_capacity, status, created_at)

-- 6. 수업 예약
class_bookings (id, schedule_id, member_id, booking_date, status, created_at)

-- 7. 재고
inventory (id, facility_id, item_name, category, quantity, unit, min_quantity, supplier, last_updated)

-- 8. 재고 거래
inventory_transactions (id, inventory_id, transaction_type, quantity, unit_price, total_price, transaction_date, notes, created_at)

-- 9. 매출
sales (id, facility_id, member_id, sale_type, amount, payment_method, sale_date, description, created_at)

-- 10. 알림
notifications (id, user_id, type, title, message, read, action_url, created_at)

-- 11. 사용자 역할
user_roles (id, user_id, role, facility_id, created_at)

-- 12. 활동 로그
activity_logs (id, user_id, action, resource, resource_id, details, created_at)
```

---

## ⚡ 6. 개발 프로세스

### **Git Workflow**
```bash
main (production)
└── develop (integration)
    ├── feature/enhanced-dashboard
    ├── feature/member-attendance
    ├── feature/membership-management
    ├── feature/payroll-system
    └── ...

# 브랜치 생성
git checkout -b feature/[feature-name]

# 작업 완료 후
git add .
git commit -m "feat([scope]): [description]"
git push origin feature/[feature-name]

# Pull Request 생성
# Code Review 후 develop 머지
# 테스트 완료 후 main 머지
```

---

### **커밋 메시지 규칙**
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 변경
style: 코드 포맷팅 (기능 변경 없음)
refactor: 리팩토링
test: 테스트 추가/수정
chore: 빌드/설정 변경

예시:
feat(dashboard): Add real-time statistics
fix(attendance): Fix QR scan timeout issue
docs(readme): Update deployment guide
```

---

### **배포 전략**
```
1. Development (로컬 테스트)
   ↓
2. Staging (Vercel Preview)
   ↓
3. Production (Vercel Main)

# Vercel 자동 배포
- develop 브랜치 → Preview URL
- main 브랜치 → Production URL
```

---

## 🎯 7. 우선순위 요약

### **🔴 Phase 1 (필수, 즉시 시작)**
1. ✅ 통합 대시보드 강화
2. ✅ 통합 출석 시스템
3. ✅ 회원권 관리 시스템

**총 예상 시간**: 2주 (80-100시간)

---

### **🟡 Phase 2-3 (중요, 1-2개월 내)**
4. ✅ 급여 관리 시스템
5. ✅ 수업 스케줄링
6. ✅ 재고 관리
7. ✅ 매출 관리
8. ✅ 알림 시스템 통합

**총 예상 시간**: 4주 (160-200시간)

---

### **🟢 Phase 4-5 (부가, 3개월 이후)**
9. ✅ 모바일 최적화 (PWA)
10. ✅ 권한 관리 (RBAC)
11. ✅ 보고서 생성
12. ✅ 통계 분석

**총 예상 시간**: 4주 (160-200시간)

---

## 📝 8. 다음 단계 (Next Steps)

### **즉시 실행 가능한 작업**

```bash
# 1. Phase 1 시작 - 대시보드 강화
cd /home/user/unified-facility-system
git checkout -b feature/enhanced-dashboard

# 2. 실시간 통계 API 구현
# - 직원/회원 카운트
# - 오늘 출근/출석
# - 구매 요청/문의 카운트

# 3. Chart.js 통합 차트
# - 주간 출석 현황 (직원 + 회원)
# - 월간 추이 그래프
# - 시설별 비교

# 4. 테스트 및 커밋
git add .
git commit -m "feat(dashboard): Add real-time statistics and integrated charts"
git push origin feature/enhanced-dashboard

# 5. Pull Request 생성
# 6. 배포 테스트
```

---

## 🤔 질문 사항

개발을 시작하기 전에 확인이 필요한 사항:

1. **우선순위**: 어떤 기능부터 시작하시겠습니까?
   - Option A: 대시보드 강화
   - Option B: 출석 시스템
   - Option C: 회원권 관리
   - Option D: 급여 시스템

2. **개발 기간**: 몇 주 안에 완료하기를 원하십니까?

3. **추가 요구사항**: 위에 없는 특별한 기능이 있습니까?

4. **외부 연동**: SMS, 이메일, 결제 등 외부 API 연동이 필요합니까?

5. **데이터 마이그레이션**: 기존 ERP/CRM 데이터를 통합 시스템으로 이전해야 합니까?

---

**작성자**: Claude (AI Developer)  
**문서 버전**: 1.0.0  
**최종 수정일**: 2026-05-20
