# 🏢 마스터 관리자 시스템 - 멀티테넌트 SaaS 플랫폼

## 🎯 개요

통합 시설 관리 플랫폼의 **마스터 관리자 시스템**입니다. 
여러 아파트/시설을 카드 형태로 관리하고, 클릭 한 번으로 각 시설의 전용 관리 시스템에 진입할 수 있습니다.

---

## 🚀 핵심 기능

### 1. 멀티테넌트 구조
- **하나의 플랫폼**에서 **무제한 시설** 관리
- 각 시설은 **독립적인 데이터베이스 공간** 보유
- **시설 추가** 버튼으로 신규 고객 즉시 생성

### 2. 시설 타입 지원
- 🏢 **아파트 (ERP)** - 직원, 구매, 휴가, 정산 관리
- 💪 **헬스장/필라테스 (CRM)** - 회원, 강사, 프로그램, 출석 관리
- 🏢 **오피스텔** - 확장 가능
- 🏪 **상가** - 확장 가능

### 3. 카드 기반 UI
- 시설별 **시각적 카드** 표시
- 실시간 **통계 정보** (직원 수, 회원 수, 미승인 요청 등)
- **원클릭 시스템 진입**

### 4. 자동 시스템 생성
- 시설 추가 시 **자동으로 전용 관리 시스템 생성**
- **독립적인 Storage 폴더** 자동 생성
- **facility_id 기반 데이터 격리**

---

## 📂 파일 구조

```
/home/user/unified-facility-system/
├── master-admin.html              # 마스터 관리자 화면 (신규)
├── master-admin.js                # 마스터 관리자 로직 (신규)
├── master-facilities-setup.sql    # facilities 테이블 생성 SQL (신규)
│
├── index.html                     # 개별 시설 관리 시스템
├── unified-complete.js            # 통합 JavaScript (2,454줄)
├── advanced-features.js           # 4가지 고급 기능
│
├── app.js                         # ✅ 수정: currentFacilityId 지원
├── employees.js                   # ✅ 수정: facility_id 필터 추가
├── members.js                     # ✅ 수정: facility_id 필터 추가
├── purchases.js                   # 수정 필요
├── additional-modules.js          # 수정 필요
├── new-features.js                # 수정 완료
│
└── shared-config.js               # Supabase 공통 설정
```

---

## 🎬 시작하기

### 1단계: Supabase에 facilities 테이블 생성

```bash
# Supabase 대시보드 → SQL Editor에서 실행
/home/user/unified-facility-system/master-facilities-setup.sql
```

이 SQL은 다음을 생성합니다:
- ✅ `facilities` 마스터 테이블
- ✅ RLS 정책 (보안)
- ✅ 통계 뷰 (`facilities_stats`)
- ✅ 샘플 데이터 2개 (e편한세상당정, 헬스장)

### 2단계: 마스터 관리자 접속

```
http://localhost:8000/master-admin.html
```

**마스터 PIN**: `master2026` 또는 `bdximaster`

### 3단계: 시설 추가

1. **"시설 추가"** 버튼 클릭
2. 시설 정보 입력:
   - 시설명: "힐스테이트 강남"
   - 시설 타입: "아파트 (ERP)"
   - 주소, 연락처, 담당자 등
3. **"시설 추가"** 클릭
4. 자동으로 카드 생성 완료 ✅

### 4단계: 시설 시스템 진입

1. 시설 카드에서 **"시스템 진입"** 버튼 클릭
2. 해당 시설 전용 관리 시스템으로 자동 진입
3. PIN 입력: `admin2026` 또는 `bdxi2026`

---

## 🎨 마스터 관리자 화면

### 상단 통계 (4개 카드)
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 전체 시설   │ │ 전체 직원   │ │ 전체 회원   │ │ 미승인 요청 │
│     3       │ │    45       │ │    280      │ │     12      │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### 시설 카드 그리드
```
┌──────────────────────────┐ ┌──────────────────────────┐
│ e편한세상당정퍼스트드림  │ │ 힐스테이트 강남          │
│ 아파트 (ERP)             │ │ 아파트 (ERP)             │
│ ━━━━━━━━━━━━━━━━━━━━━━  │ │ ━━━━━━━━━━━━━━━━━━━━━━  │
│ 📍 충청남도 아산시       │ │ 📍 서울 강남구           │
│ 👤 김관리                │ │ 👤 이관리                │
│ ━━━━━━━━━━━━━━━━━━━━━━  │ │ ━━━━━━━━━━━━━━━━━━━━━━  │
│ [시스템 진입] [수정] [X] │ │ [시스템 진입] [수정] [X] │
└──────────────────────────┘ └──────────────────────────┘
```

---

## 🔧 작동 원리

### 멀티테넌시 구조

```
┌─────────────────────────────────────┐
│     마스터 관리자 (master-admin)     │
│  - facilities 테이블 관리             │
│  - 전체 통계 확인                     │
│  - 시설 추가/수정/삭제               │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┬──────────────┐
    │                     │              │
┌───▼────────┐   ┌───────▼─────┐  ┌────▼─────┐
│ Facility 1 │   │ Facility 2  │  │Facility 3│
│ (아파트A)  │   │ (헬스장B)   │  │(아파트C) │
│            │   │             │  │          │
│ - 독립 DB  │   │ - 독립 DB   │  │- 독립 DB │
│ - 직원 20  │   │ - 회원 150  │  │- 직원 15 │
│ - 구매 30  │   │ - 강사 5    │  │- 구매 10 │
└────────────┘   └─────────────┘  └──────────┘
```

### 데이터 격리

모든 테이블에 `facility_id` 컬럼이 있어 데이터가 자동으로 분리됩니다:

```sql
-- 직원 테이블
employees (id, name, facility_id, ...)

-- 회원 테이블
members (id, name, facility_id, ...)

-- 구매 요청 테이블
purchases (id, item, facility_id, ...)
```

### 세션 기반 진입

마스터에서 시설 시스템 진입 시:
1. `sessionStorage.setItem('current_facility_id', facilityId)`
2. `index.html`로 이동
3. `app.js`에서 세션 읽어서 해당 시설 데이터만 로드

---

## 🔐 보안

### 1. Row Level Security (RLS)
Supabase RLS 정책으로 **데이터 접근 제어**

### 2. PIN 인증
- **마스터 PIN**: `master2026` - 전체 시설 접근 가능
- **시설 PIN**: `admin2026` - 개별 시설만 접근 가능

### 3. 데이터 격리
- `facility_id` 기반 자동 필터링
- 다른 시설 데이터 접근 불가

---

## 📊 통계 뷰

Supabase에서 자동으로 생성되는 `facilities_stats` 뷰:

```sql
SELECT 
    f.id,
    f.name,
    f.type,
    (SELECT COUNT(*) FROM employees WHERE facility_id = f.id) as employee_count,
    (SELECT COUNT(*) FROM members WHERE facility_id = f.id) as member_count,
    (SELECT COUNT(*) FROM purchases WHERE facility_id = f.id AND status = 'pending') as pending_purchase_count
FROM facilities f;
```

---

## 🎯 사용 시나리오

### 시나리오 1: 신규 고객 추가 (30초)
1. 마스터 로그인
2. "시설 추가" 클릭
3. 정보 입력 → 등록
4. 카드 자동 생성 완료 ✅

### 시나리오 2: 고객사 관리
1. 시설 카드 클릭 → 시스템 진입
2. 직원/회원/구매 등 관리
3. "마스터로 돌아가기" 클릭
4. 다른 시설 관리

### 시나리오 3: 전체 통계 확인
1. 마스터 대시보드에서 실시간 통계 확인
2. 전체 시설 수, 직원 수, 회원 수
3. 미승인 구매 요청 수

---

## 🛠️ 개발자 가이드

### 새 시설 타입 추가

1. **facilities 테이블에 타입 추가**
```javascript
// master-admin.js
const types = {
    'apartment': '아파트',
    'fitness': '헬스장',
    'hotel': '호텔',  // 신규 추가
};
```

2. **아이콘 및 색상 추가**
```javascript
getFacilityIcon(type) {
    if (type === 'hotel') return 'fa-hotel';
}

getFacilityGradient(type) {
    if (type === 'hotel') return 'from-pink-500 to-pink-700';
}
```

### API 참조

#### masterApp.addFacility(facilityData)
새 시설 추가

```javascript
const facilityData = {
    name: '힐스테이트 강남',
    type: 'apartment',
    address: '서울 강남구',
    contact_phone: '02-1234-5678',
    manager_name: '홍길동',
    subscription_plan: 'pro',
    is_active: true
};

await masterApp.addFacility(facilityData);
```

#### masterApp.enterFacilitySystem(facilityId)
시설 시스템 진입

```javascript
masterApp.enterFacilitySystem('uuid-here');
// → sessionStorage 설정 후 index.html로 이동
```

---

## ✅ 완료 체크리스트

- [x] `facilities` 마스터 테이블 생성
- [x] `master-admin.html` 화면 구현
- [x] `master-admin.js` 로직 구현
- [x] 시설 추가/수정/삭제 기능
- [x] 카드 UI 렌더링
- [x] 시설 시스템 진입 기능
- [x] `app.js`에 facility_id 세션 처리
- [x] `employees.js` facility_id 필터 추가
- [x] `members.js` facility_id 필터 추가
- [ ] 나머지 모듈 facility_id 필터 추가 (purchases, additional-modules 등)
- [ ] 통계 뷰 자동 갱신
- [ ] 시설 수정 모달 구현

---

## 🚀 다음 단계

### 단기 (즉시 가능)
1. ✅ Supabase에 SQL 실행
2. ✅ 마스터 관리자 접속 테스트
3. ✅ 시설 추가 테스트
4. ✅ 시스템 진입 테스트

### 중기 (추가 개발)
1. 시설 수정 모달 구현
2. 시설별 상세 통계 페이지
3. 시설별 설정 커스터마이징
4. 구독 플랜별 기능 제한

### 장기 (확장)
1. 시설별 독립 도메인 (`apt1.yoursite.com`)
2. 시설별 브랜딩 (로고, 색상)
3. 자동 백업 및 복구
4. 멀티 관리자 권한

---

## 📞 문의

마스터 관리자 시스템 관련 문의는 개발팀으로 연락주세요.

**GitHub**: https://github.com/acerogym45-netizen/unified-facility-system
