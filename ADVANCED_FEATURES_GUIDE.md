# 고급 기능 사용 가이드

## 📋 개요

통합 시설 관리 시스템에 추가된 4가지 고급 기능의 사용법을 설명합니다.

- **파일 업로드**: Supabase Storage를 사용한 파일 관리
- **PDF 생성**: jsPDF를 사용한 급여명세서/정산서 다운로드
- **실시간 알림**: Supabase Realtime을 통한 즉각적인 변경 알림
- **권한 관리**: 역할 기반 접근 제어 (RBAC)

---

## 1. 파일 업로드 기능 (Supabase Storage)

### 사용 가능한 곳
- **작업 갤러리**: 작업 사진 업로드
- **서류 관리**: 문서 파일 업로드 (PDF, DOC, XLS 등)

### 작업 갤러리에서 사진 업로드
1. **작업 사진** 메뉴 클릭
2. **사진 추가** 버튼 클릭
3. 작업 구역과 날짜 입력
4. **작업 사진 업로드** 필드에서 파일 선택
   - 이미지 선택 시 즉시 미리보기 표시
   - 파일명과 크기 자동 표시
5. 메모 입력 (선택사항)
6. **등록** 버튼 클릭

**지원 형식**: JPG, JPEG, PNG, GIF  
**최대 크기**: 50MB

### 서류 관리에서 문서 업로드
1. **서류 관리** 메뉴 클릭
2. **서류 추가** 버튼 클릭
3. 서류 제목과 카테고리 선택
4. **파일 업로드** 필드에서 파일 선택
   - 파일명과 크기 자동 표시
5. 메모 입력 (선택사항)
6. **등록** 버튼 클릭

**지원 형식**: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG 등 모든 파일  
**최대 크기**: 50MB

### Storage 버킷 구조
```
work-photos/        # 작업 사진
├── apartment/      # 아파트 ERP 사진
└── fitness/        # 헬스장 CRM 사진

documents/          # 서류 파일
├── apartment/      # 아파트 ERP 서류
└── fitness/        # 헬스장 CRM 서류

profile-images/     # 프로필 사진 (향후 확장)
```

### 기술 세부사항
- **자동 파일명**: `{timestamp}-{random}.{ext}` 형식으로 자동 생성
- **Public URL**: 업로드 즉시 공개 URL 생성
- **자동 폴더 생성**: facility_id에 따라 apartment/fitness 폴더 자동 구분

---

## 2. PDF 생성 기능 (jsPDF)

### 급여명세서 PDF 다운로드
1. **급여명세서** 메뉴 클릭
2. 다운로드할 급여명세서의 **다운로드 아이콘** 클릭 (테이블에서)
   - 또는 상세보기 후 **PDF 다운로드** 버튼 클릭
3. PDF 파일 자동 생성 및 다운로드
   - 파일명: `급여명세서_{직원명}_{지급월}.pdf`

**PDF 포함 내용**:
- 제목 "급여명세서"
- 지급월, 직원명, 발행일
- 기본급, 수당, 공제액, 실수령액
- 지급 상태 (지급완료/대기중)

### 정산서 PDF 다운로드
1. **정산 내역** 메뉴 클릭
2. 정산서 상세보기 클릭
3. **PDF 다운로드** 버튼 클릭
4. PDF 파일 자동 생성 및 다운로드
   - 파일명: `정산서_{월}_{항목}.pdf`

**PDF 포함 내용**:
- 제목 "정산서"
- 정산 월, 항목 (급여/관리비/수리비/기타)
- 정산 금액 (큰 글씨로 강조)
- 상세 내역 (description)
- 지급 상태

### 한글 폰트 지원
- **폰트**: NanumGothic (나눔고딕)
- **CDN 자동 로드**: 첫 PDF 생성 시 한글 폰트 자동 다운로드
- **인터넷 연결 필요**: 폰트 CDN 접근을 위해 인터넷 필요

---

## 3. 실시간 알림 기능 (Supabase Realtime)

### 자동 구독 테이블
로그인하면 다음 테이블의 변경사항을 자동으로 감지합니다:
- **purchases** (구매 요청)
- **vacations** (휴가 신청)
- **inquiries** (문의 사항)

### 알림이 표시되는 경우
1. **새 구매 요청 등록**: "새 구매 요청: {품목명} - {수량}개"
2. **새 휴가 신청**: "새 휴가 신청: {직원명} ({시작일} ~ {종료일})"
3. **새 문의 등록**: "새 문의: {제목}"

### 알림 표시 방식
#### 브라우저 알림 (Desktop Notification)
- 화면 우측 상단에 시스템 알림 표시
- **첫 로그인 시**: 브라우저가 알림 권한 요청
- **권한 허용** 권장: 실시간 알림을 받으려면 필수

#### 화면 내 토스트 알림
- 우측 상단에 컬러 카드 형태로 표시
- **10초 후 자동 사라짐**
- **색상**:
  - 파란색: 정보 (구매, 휴가)
  - 노란색: 경고
  - 초록색: 성공
  - 빨간색: 오류

### 알림 테스트 방법
1. 브라우저 탭 2개 열기
2. 둘 다 시스템에 로그인
3. **탭 1**: 구매 요청 또는 휴가 신청 등록
4. **탭 2**: 즉시 실시간 알림 수신 확인
5. 대시보드 통계도 자동 갱신됨

### 자동 새로고침
- 알림 수신 시 **대시보드 통계 자동 갱신**
- 해당 섹션 열려있으면 **테이블 자동 새로고침**

---

## 4. 권한 관리 기능 (RBAC)

### 4가지 역할

#### 👤 관리자 (Admin)
- **모든 권한 보유**
- 직원/회원 추가, 수정, 삭제
- 구매 요청 승인/거부
- 급여명세서 생성
- 정산서 관리
- 모든 데이터 조회

#### 📊 매니저 (Manager)
- **승인 권한 보유**
- 구매 요청 승인/거부
- 휴가 신청 승인/거부
- 직원/회원 조회 및 추가
- 급여명세서 조회
- 정산서 조회

#### 💼 직원 (Employee)
- **기본 업무 권한**
- 자신의 휴가 신청
- 구매 요청 등록
- 작업 갤러리 조회 및 등록
- 업무 일지 작성
- 회원 정보 조회

#### 👁️ 조회자 (Viewer)
- **읽기 전용**
- 모든 데이터 조회만 가능
- 등록/수정/삭제 불가
- 승인 권한 없음

### 역할 변경 방법
1. 화면 우측 상단의 **역할 버튼** 클릭 (현재 역할 표시됨)
2. 역할 선택 모달에서 원하는 역할 선택
3. **적용** 버튼 클릭
4. UI 즉시 변경 (권한 없는 버튼들은 자동 숨김)

### 권한별 UI 변경
역할 변경 시 버튼들이 자동으로 표시/숨김됩니다:

```
data-permission="create"    → 등록 버튼 (Admin, Manager만)
data-permission="delete"    → 삭제 버튼 (Admin만)
data-permission="approve"   → 승인 버튼 (Admin, Manager만)
data-permission="edit"      → 수정 버튼 (역할별 다름)
```

### 권한 매트릭스

| 기능 | Admin | Manager | Employee | Viewer |
|-----|-------|---------|----------|--------|
| 직원 조회 | ✅ | ✅ | ✅ | ✅ |
| 직원 추가 | ✅ | ✅ | ❌ | ❌ |
| 직원 삭제 | ✅ | ❌ | ❌ | ❌ |
| 회원 조회 | ✅ | ✅ | ✅ | ✅ |
| 회원 추가 | ✅ | ✅ | ❌ | ❌ |
| 구매 승인 | ✅ | ✅ | ❌ | ❌ |
| 휴가 승인 | ✅ | ✅ | ❌ | ❌ |
| 급여명세서 생성 | ✅ | ❌ | ❌ | ❌ |
| 급여명세서 조회 | ✅ | ✅ | ❌ | ❌ |
| 정산서 관리 | ✅ | ✅ | ❌ | ❌ |
| 작업 갤러리 등록 | ✅ | ✅ | ✅ | ❌ |
| 업무 일지 작성 | ✅ | ✅ | ✅ | ❌ |

---

## 🔧 Supabase 설정 (관리자용)

### Storage 버킷 수동 생성
자동 생성이 실패한 경우, Supabase 대시보드에서 수동 생성:

1. Supabase 프로젝트 대시보드 접속
2. **Storage** 메뉴 클릭
3. **New bucket** 클릭
4. 3개의 버킷 생성:
   - `work-photos` (Public, 50MB limit)
   - `documents` (Public, 50MB limit)
   - `profile-images` (Public, 50MB limit)

### Realtime 활성화
1. Supabase 프로젝트 대시보드 접속
2. **Database** > **Replication** 메뉴
3. 다음 테이블에 Realtime 활성화:
   - `purchases`
   - `vacations`
   - `inquiries`

---

## 🚀 빠른 시작

### 1단계: 시스템 접속
```
http://localhost:8000
또는
https://your-deployed-url.com
```

### 2단계: 로그인
- PIN: `admin2026` 또는 `bdxi2026`

### 3단계: 브라우저 알림 권한 허용
- 브라우저 상단의 알림 권한 요청 허용

### 4단계: 역할 선택
- 우측 상단의 역할 버튼 클릭하여 원하는 역할 선택

### 5단계: 기능 테스트
1. **파일 업로드**: 작업 갤러리에 사진 업로드
2. **PDF 다운로드**: 급여명세서 PDF 생성
3. **실시간 알림**: 다른 탭에서 데이터 등록하여 알림 확인
4. **권한 변경**: 역할 변경하여 UI 변화 확인

---

## 📝 개발자 참고

### FileUploadManager API
```javascript
// 파일 업로드
const result = await FileUploadManager.uploadFile(file, bucket, folder);
// result = { url, path, size, type }

// 파일 삭제
await FileUploadManager.deleteFile(bucket, path);

// 이미지 미리보기
FileUploadManager.previewImage(inputElement, previewDivId);

// 파일 정보 표시
FileUploadManager.handleFileSelect(inputElement, infoDivId);
```

### PDFGenerator API
```javascript
// 급여명세서 PDF
await PDFGenerator.generatePayslipPDF(payslipObject);

// 정산서 PDF
await PDFGenerator.generateSettlementPDF(settlementObject);
```

### RealtimeNotificationManager API
```javascript
// 구독 초기화 (자동 호출됨)
RealtimeNotificationManager.initializeSubscriptions();

// 수동 알림 표시
RealtimeNotificationManager.showRealtimeNotification(title, message, type);
```

### RoleManager API
```javascript
// 역할 확인
const hasPermission = RoleManager.hasPermission('employees.delete');

// 역할 변경
RoleManager.setRole('manager');

// UI 업데이트
RoleManager.updateUIByRole();
```

---

## ❓ 문제 해결

### 파일 업로드가 안 됩니다
- Supabase Storage 버킷이 생성되었는지 확인
- 파일 크기가 50MB 이하인지 확인
- 브라우저 콘솔에서 오류 메시지 확인

### PDF 다운로드가 안 됩니다
- 인터넷 연결 확인 (폰트 CDN 필요)
- 브라우저 팝업 차단 해제
- jsPDF 라이브러리 로드 확인 (콘솔에서)

### 실시간 알림이 안 옵니다
- Supabase Realtime이 해당 테이블에 활성화되었는지 확인
- 브라우저 알림 권한이 허용되었는지 확인
- 여러 탭에서 테스트 (같은 탭에서는 알림 안 옴)

### 권한 변경이 안 됩니다
- 역할 선택 모달이 제대로 열리는지 확인
- 브라우저 콘솔에서 RoleManager 오류 확인
- 페이지 새로고침 후 재시도

---

## 📞 지원

문제가 계속되면 브라우저 콘솔 (F12)의 오류 메시지를 확인하세요.
