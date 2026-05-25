# 🏢 통합 시설 관리 시스템 (Unified Facility System)

**ERP + CRM 완전 통합 플랫폼**

## 🎯 프로젝트 개요

하나의 대시보드에서 ERP(직원 관리)와 CRM(회원 관리) 기능을 모두 사용할 수 있는 통합 관리 시스템입니다.

## ✨ 주요 기능

### 📊 통합 대시보드
- 실시간 통계 (직원/회원/출석/문의)
- Chart.js 시각화
- 주간 출석 현황 차트
- 시설별 비교 차트
- 4개 통계 카드 (ERP/CRM/출석/문의)

### 👥 인원 관리
- **직원 관리 (ERP)** ✅ 완전 구현
  - 직원 등록/수정/삭제
  - 직책 및 연락처 관리
  - QR 코드 발급
  - 재직/퇴사 상태 관리
  - Supabase 실시간 동기화

- **회원 관리 (CRM)** ✅ 완전 구현
  - 회원 등록/수정/삭제
  - 회원권 관리
  - 기간 관리
  - 활동/만료 상태 관리
  - Supabase 실시간 동기화

### ⏰ 출석 관리
- 직원 출퇴근 기록 (ERP)
- 회원 출석 기록 (CRM)
- QR 체크인/아웃 ✅ 구현됨
- 탭 기반 분리 UI

### 📋 ERP 기능 (완전 구현)
- **구매 관리** ✅
  - 구매 요청 등록
  - 승인/거절 워크플로우
  - 상태 추적 (대기/승인/거절/완료)
  - 검수 관리
  
- **휴가 관리** ✅
  - 휴가 신청
  - 승인/거절 시스템
  - 휴가 유형 분류
  - 기간 관리

### 💪 CRM 기능 (완전 구현)
- **강사 관리** ✅
  - 강사 프로필 관리
  - 전문분야 설정
  - 연락처/이메일 관리
  - 활동 상태 추적
  
- **프로그램 관리** ✅
  - 프로그램 생성/수정
  - 강사 배정
  - 스케줄 관리
  - 정원 설정
  - 운영 상태 관리

### 🔔 공통 기능 (완전 구현)
- **문의/민원 시스템** ✅
  - 문의 등록 및 추적
  - 카테고리 분류
  - 상태 관리 (대기/진행중/완료)
  - 상세보기 기능
  
- **공지사항 관리** ✅
  - 공지 작성/수정/삭제
  - 중요 공지 표시
  - 날짜별 정렬

- **QR 스캔** ✅
  - 실시간 체크인/아웃
  - QR 코드 입력 처리
  - 결과 즉시 표시

## 🚀 기술 스택

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Tailwind CSS
- Font Awesome Icons
- Chart.js

### Backend
- Supabase (PostgreSQL)
- Real-time subscriptions
- Row Level Security (RLS)

### 배포
- Vercel (자동 배포)
- GitHub Actions (CI/CD)

## 🗂️ 프로젝트 구조

```
unified-facility-system/
├── index.html              # 통합 대시보드 메인
├── shared-config.js        # Supabase 공통 설정
└── README.md              # 프로젝트 문서
```

## 🔧 로컬 실행

```bash
# 정적 서버 실행
python -m http.server 8000

# 또는
npx http-server -p 8000
```

브라우저에서 `http://localhost:8000` 접속

## 🔐 로그인 정보

```
PIN: admin2026
또는
PIN: bdxi2026
```

## 🌐 배포 URL

- **GitHub Repository**: https://github.com/acerogym45-netizen/unified-facility-system
- **Production**: https://unified-facility-system.vercel.app (배포 예정)
- **Supabase**: https://awqatgkfrzusbidzosrx.supabase.co

## 🚀 Vercel 배포 방법

### 1. GitHub 연동 배포 (권장)

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. "Add New" → "Project" 클릭
3. `acerogym45-netizen/unified-facility-system` 저장소 선택
4. "Deploy" 클릭 (설정 변경 불필요)
5. 배포 완료 후 URL 확인

### 2. CLI 배포 (선택)

```bash
# 1. Vercel 로그인
npx vercel login

# 2. 프로젝트 배포
cd /home/user/unified-facility-system
npx vercel --prod

# 3. 배포 URL 확인
```

## 📊 데이터베이스 구조

### 핵심 테이블

- `facilities` - 시설 정보
- `employees` - 직원 정보 (ERP)
- `members` - 회원 정보 (CRM)
- `attendance_records` - 출퇴근/출석 기록
- `purchases` - 구매 요청 (ERP)
- `vacations` - 휴가 관리 (ERP)
- `instructors` - 강사 정보 (CRM)
- `programs` - 프로그램 관리 (CRM)
- `inquiries` - 문의/민원 (공통)
- `notices` - 공지사항 (공통)

## 🎨 UI/UX 특징

- 💎 모던한 그라데이션 디자인
- 📱 반응형 레이아웃
- 🎯 직관적인 사이드바 네비게이션
- 🌈 시각적 통계 대시보드
- ⚡ 빠른 페이지 전환

## 🔄 기존 시스템과의 차이

### 기존 (facility-management-hub)
```
시설 선택 페이지 → ERP / CRM 분리
```

### 통합 시스템 (unified-facility-system)
```
단일 대시보드 → 모든 기능 통합
```

## 📝 개발 로그

### v1.1.0 (2026-05-25) - 전체 기능 완성 ✨
- ✅ **구매 관리 (ERP)** - 구매 요청/승인/검수 완전 구현
- ✅ **휴가 관리 (ERP)** - 휴가 신청/승인 워크플로우 구현
- ✅ **강사 관리 (CRM)** - 강사 프로필 및 전문분야 관리
- ✅ **프로그램 관리 (CRM)** - 프로그램 스케줄 및 정원 관리
- ✅ **문의/민원 관리** - 상태 추적 시스템 구현
- ✅ **공지사항 관리** - 중요 공지 하이라이트 기능
- ✅ **QR 스캔** - 체크인/아웃 실시간 처리
- ✅ 모달 시스템 추가 (데이터 입력용)
- ✅ 상태 배지 색상 시스템 구현
- ✅ 모든 테이블 Supabase 실시간 연동
- ✅ Noto Sans KR 한글 폰트 적용

### v1.0.0 (2026-05-19) - 초기 출시
- ✅ 통합 대시보드 UI 구현
- ✅ 직원/회원 관리 통합
- ✅ 실시간 통계 대시보드
- ✅ Chart.js 차트 통합
- ✅ 사이드바 네비게이션 (12개 메뉴)
- ✅ Supabase 연동
- ✅ GitHub + Vercel 배포

## 🤝 기여

이 프로젝트는 기존 ERP(BDXI-QR-attendance) + CRM(pilates-webapp)의 기능을 통합한 것입니다.

## 📄 라이센스

Copyright © 2026 Unified Facility System. All rights reserved.

---

**Powered by Supabase + Tailwind CSS + Chart.js**
