# 🚀 빠른 시작 가이드

## 📦 필요한 파일

✅ 이미 준비 완료:
- `supabase-complete-setup.sql` - 데이터베이스 설정 SQL
- `index.html` - 웹 애플리케이션
- `unified-complete.js` - JavaScript 코드
- `shared-config.js` - Supabase 설정

---

## ⚡ 3단계로 시작하기

### 1️⃣ Supabase 데이터베이스 설정 (5분)

```bash
1. https://app.supabase.com 접속
2. 프로젝트 선택
3. SQL Editor 열기
4. supabase-complete-setup.sql 파일 내용 복사
5. 붙여넣고 Run 클릭
6. 완료 메시지 확인
```

**실행하면 자동으로:**
- ✅ 6개 테이블 생성
- ✅ RLS 정책 설정 (24개 정책)
- ✅ 인덱스 생성
- ✅ 샘플 데이터 삽입
- ✅ 통계 뷰 생성

---

### 2️⃣ 웹 서버 배포 (3분)

**옵션 A: Vercel (권장)**
```bash
1. https://vercel.com 접속
2. Import Git Repository
3. GitHub 연동 후 저장소 선택
4. Deploy 클릭
5. 완료!
```

**옵션 B: Netlify**
```bash
1. https://netlify.com 접속
2. Sites → Add new site → Import from Git
3. GitHub 선택
4. 저장소 선택 후 Deploy
5. 완료!
```

**옵션 C: GitHub Pages**
```bash
1. 저장소 Settings
2. Pages 메뉴
3. Source: Deploy from a branch
4. Branch: main 선택
5. Save
```

---

### 3️⃣ 애플리케이션 접속 (1분)

```bash
1. 배포된 URL 열기
2. PIN 입력: admin2026 또는 bdxi2026
3. 17개 메뉴 확인
4. 샘플 데이터로 테스트
```

---

## 🎯 테이블 구조 확인

```sql
-- Supabase SQL Editor에서 실행
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'areas', 
    'work_gallery', 
    'work_logs', 
    'documents', 
    'settlements', 
    'payslips'
);
```

**결과:** 6개 테이블 목록 확인

---

## 📋 17개 기능 목록

### ERP/CRM 기본 (11개)
1. 대시보드
2. 직원 관리 (QR 자동 생성)
3. 회원 관리
4. 구매 관리 (승인 워크플로우)
5. 휴가 관리 (승인 워크플로우)
6. 강사 관리
7. 프로그램 관리
8. 문의/민원
9. 공지사항
10. 출퇴근/출석 현황
11. QR 스캔

### 신규 기능 (6개)
12. 구역 관리 (QR 자동 생성)
13. 작업 갤러리
14. 업무 일지
15. 서류 보관함
16. 정산서 관리
17. 급여명세서 관리

---

## 🔐 로그인 정보

```
PIN 1: admin2026
PIN 2: bdxi2026
```

---

## 🗄️ 샘플 데이터

설정 완료 후 자동으로 생성되는 샘플:

**구역 (3개)**
- 1동 로비
- 2동 복도
- 피트니스 메인홀

**업무 일지 (3개)**
- 김청소 - 청소 작업
- 이점검 - 점검 작업
- 박정비 - 수리 작업

**정산서 (3개)**
- 급여 정산 (미지급)
- 관리비 정산 (미지급)
- 수리비 정산 (지급완료)

---

## ✅ 체크리스트

설정 완료 후 확인:

- [ ] Supabase에 6개 테이블 생성됨
- [ ] RLS 정책 24개 활성화됨
- [ ] 샘플 데이터 9개 삽입됨
- [ ] 웹 애플리케이션 배포됨
- [ ] PIN으로 로그인 가능
- [ ] 17개 메뉴 모두 표시됨
- [ ] 샘플 데이터 조회 가능

---

## 🆘 문제 해결

### SQL 실행 오류
```sql
-- UUID 확장 먼저 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 그 후 다시 전체 SQL 실행
```

### 테이블이 안 보임
- Table Editor 새로고침
- 또는 SQL로 직접 확인:
```sql
SELECT * FROM areas LIMIT 5;
```

### 웹에서 데이터가 안 보임
1. 브라우저 콘솔(F12) 에러 확인
2. shared-config.js의 Supabase URL/키 확인
3. RLS 정책 활성화 확인

---

## 📚 상세 문서

- **SUPABASE_SETUP_GUIDE.md** - 데이터베이스 상세 설정
- **DEPLOYMENT_GUIDE.md** - 배포 상세 가이드
- **COMPLETION_REPORT.md** - 전체 기능 설명

---

## 🎉 완료!

모든 단계를 완료하면:
- ✅ 17개 기능 사용 가능
- ✅ 실무 투입 준비 완료
- ✅ 샘플 데이터로 즉시 테스트 가능

**배포 URL 예시:**
- Vercel: `https://your-project.vercel.app`
- Netlify: `https://your-project.netlify.app`
- GitHub Pages: `https://username.github.io/unified-facility-system`

---

**작성일**: 2026-05-25
**버전**: v1.0
**GitHub**: https://github.com/acerogym45-netizen/unified-facility-system
