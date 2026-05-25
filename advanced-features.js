// ============================================
// 고급 기능 구현 모듈
// 1. 파일 업로드 (Supabase Storage)
// 2. PDF 생성 (jsPDF)
// 3. 실시간 알림 (Supabase Realtime)
// 4. 권한 관리 (Role-based Access Control)
// ============================================

// ============================================
// 1. 파일 업로드 - Supabase Storage 통합
// ============================================

const FileUploadManager = {
    // Storage 버킷 이름
    BUCKETS: {
        WORK_PHOTOS: 'work-photos',      // 작업 사진
        DOCUMENTS: 'documents',           // 서류
        PROFILE_IMAGES: 'profile-images'  // 프로필 사진
    },

    /**
     * Storage 버킷 초기화 (최초 1회 실행)
     */
    async initializeBuckets() {
        const sb = unifiedApp.sb;
        
        try {
            // 버킷 목록 조회
            const { data: buckets, error: listError } = await sb.storage.listBuckets();
            
            if (listError) throw listError;
            
            const existingBuckets = buckets.map(b => b.name);
            
            // 필요한 버킷 생성
            for (const [key, bucketName] of Object.entries(this.BUCKETS)) {
                if (!existingBuckets.includes(bucketName)) {
                    const { error } = await sb.storage.createBucket(bucketName, {
                        public: true,
                        fileSizeLimit: 52428800 // 50MB
                    });
                    
                    if (error) {
                        console.error(`버킷 생성 실패 (${bucketName}):`, error);
                    } else {
                        console.log(`✅ 버킷 생성 완료: ${bucketName}`);
                    }
                }
            }
        } catch (error) {
            console.error('버킷 초기화 오류:', error);
        }
    },

    /**
     * 파일 업로드
     * @param {File} file - 업로드할 파일
     * @param {string} bucket - 버킷 이름
     * @param {string} folder - 폴더 경로 (선택)
     * @returns {Promise<{url: string, path: string}>}
     */
    async uploadFile(file, bucket, folder = '') {
        const sb = unifiedApp.sb;
        
        try {
            // 파일명 생성 (타임스탬프 + 랜덤 + 원본파일명)
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 9);
            const ext = file.name.split('.').pop();
            const fileName = `${timestamp}_${random}.${ext}`;
            const filePath = folder ? `${folder}/${fileName}` : fileName;
            
            // 파일 업로드
            const { data, error } = await sb.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) throw error;
            
            // Public URL 생성
            const { data: urlData } = sb.storage
                .from(bucket)
                .getPublicUrl(filePath);
            
            return {
                url: urlData.publicUrl,
                path: filePath,
                size: file.size,
                type: file.type
            };
        } catch (error) {
            console.error('파일 업로드 오류:', error);
            throw error;
        }
    },

    /**
     * 파일 삭제
     * @param {string} bucket - 버킷 이름
     * @param {string} path - 파일 경로
     */
    async deleteFile(bucket, path) {
        const sb = unifiedApp.sb;
        
        try {
            const { error } = await sb.storage
                .from(bucket)
                .remove([path]);
            
            if (error) throw error;
            
            console.log('✅ 파일 삭제 완료:', path);
        } catch (error) {
            console.error('파일 삭제 오류:', error);
            throw error;
        }
    },

    /**
     * 이미지 미리보기 생성
     * @param {File} file - 이미지 파일
     * @returns {Promise<string>} - Data URL
     */
    async createImagePreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * 파일 크기 포맷
     * @param {number} bytes - 바이트
     * @returns {string} - 포맷된 크기
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * 이미지 미리보기 생성 (input onchange에서 호출)
     * @param {HTMLInputElement} input - 파일 input 요소
     * @param {string} previewId - 미리보기 div ID
     */
    previewImage(input, previewId) {
        const previewDiv = document.getElementById(previewId);
        if (!previewDiv) return;
        
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // 이미지 타입 확인
            if (!file.type.startsWith('image/')) {
                previewDiv.innerHTML = `<p class="text-sm text-gray-600">선택된 파일: ${file.name} (${this.formatFileSize(file.size)})</p>`;
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                previewDiv.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <img src="${e.target.result}" class="w-20 h-20 object-cover rounded-lg">
                        <div class="text-sm text-gray-600">
                            <p class="font-medium">${file.name}</p>
                            <p class="text-xs text-gray-500">${this.formatFileSize(file.size)}</p>
                        </div>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        }
    },

    /**
     * 일반 파일 선택 핸들러 (input onchange에서 호출)
     * @param {HTMLInputElement} input - 파일 input 요소
     * @param {string} infoId - 정보 표시 div ID
     */
    handleFileSelect(input, infoId) {
        const infoDiv = document.getElementById(infoId);
        if (!infoDiv) return;
        
        if (input.files && input.files[0]) {
            const file = input.files[0];
            infoDiv.innerHTML = `
                <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-file text-blue-600"></i>
                    <span class="font-medium">${file.name}</span>
                    <span class="text-gray-500">(${this.formatFileSize(file.size)})</span>
                </div>
            `;
        } else {
            infoDiv.innerHTML = '';
        }
    }
};

// ============================================
// 2. PDF 생성 - jsPDF 라이브러리
// ============================================

const PDFGenerator = {
    /**
     * jsPDF 라이브러리 로드 확인
     */
    isLoaded() {
        return typeof window.jspdf !== 'undefined';
    },

    /**
     * 급여명세서 PDF 생성
     * @param {object} payslip - 급여명세서 데이터
     */
    async generatePayslipPDF(payslip) {
        if (!this.isLoaded()) {
            unifiedApp.showNotification('PDF 라이브러리를 로드하는 중입니다...', 'info');
            await this.loadLibrary();
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // 한글 폰트 설정 (NanumGothic)
        doc.addFont('https://cdn.jsdelivr.net/npm/nanumfont@1.0.0/fonts/NanumGothic.ttf', 'NanumGothic', 'normal');
        doc.setFont('NanumGothic');

        // 제목
        doc.setFontSize(20);
        doc.text('급여명세서', 105, 20, { align: 'center' });

        // 구분선
        doc.setLineWidth(0.5);
        doc.line(20, 25, 190, 25);

        // 기본 정보
        doc.setFontSize(12);
        doc.text(`지급월: ${payslip.pay_month}`, 20, 35);
        doc.text(`직원명: ${payslip.employee_name}`, 20, 45);
        doc.text(`발행일: ${new Date().toLocaleDateString('ko-KR')}`, 20, 55);

        // 급여 내역
        doc.setFontSize(14);
        doc.text('급여 내역', 20, 70);
        doc.setLineWidth(0.3);
        doc.line(20, 72, 190, 72);

        doc.setFontSize(11);
        const y = 80;
        doc.text('기본급:', 30, y);
        doc.text(`${this.formatCurrency(payslip.base_salary)}`, 150, y, { align: 'right' });
        
        doc.text('수당:', 30, y + 10);
        doc.text(`${this.formatCurrency(payslip.allowance)}`, 150, y + 10, { align: 'right' });
        
        doc.text('공제액:', 30, y + 20);
        doc.text(`-${this.formatCurrency(payslip.deduction)}`, 150, y + 20, { align: 'right' });

        // 합계 구분선
        doc.setLineWidth(0.5);
        doc.line(30, y + 25, 150, y + 25);

        // 실수령액
        doc.setFontSize(14);
        doc.setFont('NanumGothic', 'bold');
        doc.text('실수령액:', 30, y + 35);
        doc.text(`${this.formatCurrency(payslip.net_salary)}`, 150, y + 35, { align: 'right' });

        // 지급 상태
        doc.setFontSize(10);
        doc.setFont('NanumGothic', 'normal');
        const status = payslip.is_paid ? '지급완료' : '미지급';
        doc.text(`지급 상태: ${status}`, 20, y + 50);

        // 하단 서명란
        doc.setFontSize(9);
        doc.text('위 금액을 지급하였음을 확인합니다.', 20, 250);
        doc.text('발행자: ___________________', 20, 260);
        doc.text('수령자: ___________________', 20, 270);

        // PDF 저장
        const fileName = `급여명세서_${payslip.employee_name}_${payslip.pay_month}.pdf`;
        doc.save(fileName);

        unifiedApp.showNotification('PDF 다운로드 완료!', 'success');
    },

    /**
     * 정산서 PDF 생성
     * @param {object} settlement - 정산서 데이터
     */
    async generateSettlementPDF(settlement) {
        if (!this.isLoaded()) {
            await this.loadLibrary();
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.addFont('https://cdn.jsdelivr.net/npm/nanumfont@1.0.0/fonts/NanumGothic.ttf', 'NanumGothic', 'normal');
        doc.setFont('NanumGothic');

        // 제목
        doc.setFontSize(20);
        doc.text('정산서', 105, 20, { align: 'center' });

        doc.setLineWidth(0.5);
        doc.line(20, 25, 190, 25);

        // 정산 정보
        doc.setFontSize(12);
        doc.text(`정산월: ${settlement.month}`, 20, 35);
        doc.text(`분류: ${settlement.category}`, 20, 45);
        doc.text(`발행일: ${new Date().toLocaleDateString('ko-KR')}`, 20, 55);

        // 금액
        doc.setFontSize(16);
        doc.text('정산 금액', 20, 70);
        doc.setLineWidth(0.3);
        doc.line(20, 72, 190, 72);

        doc.setFontSize(20);
        doc.setFont('NanumGothic', 'bold');
        doc.text(`${this.formatCurrency(settlement.amount)}`, 105, 90, { align: 'center' });

        // 내용
        doc.setFontSize(12);
        doc.setFont('NanumGothic', 'normal');
        doc.text('내용:', 20, 110);
        
        // 긴 텍스트 줄바꿈
        const splitDescription = doc.splitTextToSize(settlement.description || '없음', 170);
        doc.text(splitDescription, 20, 120);

        // 지급 상태
        const status = settlement.is_paid ? '지급완료' : '미지급';
        const statusColor = settlement.is_paid ? [0, 128, 0] : [255, 0, 0];
        doc.setTextColor(...statusColor);
        doc.setFontSize(14);
        doc.text(`상태: ${status}`, 20, 160);

        // PDF 저장
        const fileName = `정산서_${settlement.month}_${settlement.category}.pdf`;
        doc.save(fileName);

        unifiedApp.showNotification('PDF 다운로드 완료!', 'success');
    },

    /**
     * jsPDF 라이브러리 동적 로드
     */
    async loadLibrary() {
        return new Promise((resolve, reject) => {
            if (this.isLoaded()) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * 금액 포맷팅
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    }
};

// ============================================
// 3. 실시간 알림 - Supabase Realtime
// ============================================

const RealtimeNotificationManager = {
    channels: {},

    /**
     * 실시간 구독 초기화
     */
    async initializeSubscriptions() {
        const sb = unifiedApp.sb;

        // 구매 요청 실시간 알림
        this.subscribeToPurchases();

        // 휴가 신청 실시간 알림
        this.subscribeToVacations();

        // 문의 실시간 알림
        this.subscribeToInquiries();

        console.log('✅ 실시간 알림 구독 시작');
    },

    /**
     * 구매 요청 실시간 구독
     */
    subscribeToPurchases() {
        const sb = unifiedApp.sb;
        
        const channel = sb
            .channel('purchases-changes')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'purchases' 
                }, 
                (payload) => {
                    this.showRealtimeNotification(
                        '새 구매 요청',
                        `${payload.new.item_name} - ${payload.new.requester}`,
                        'purchase'
                    );
                    
                    // 대시보드 갱신
                    if (unifiedApp.loadDashboard) {
                        unifiedApp.loadDashboard();
                    }
                }
            )
            .subscribe();

        this.channels.purchases = channel;
    },

    /**
     * 휴가 신청 실시간 구독
     */
    subscribeToVacations() {
        const sb = unifiedApp.sb;
        
        const channel = sb
            .channel('vacations-changes')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'vacations' 
                }, 
                (payload) => {
                    this.showRealtimeNotification(
                        '새 휴가 신청',
                        `${payload.new.employee_name} - ${payload.new.vacation_type}`,
                        'vacation'
                    );
                    
                    if (unifiedApp.loadDashboard) {
                        unifiedApp.loadDashboard();
                    }
                }
            )
            .subscribe();

        this.channels.vacations = channel;
    },

    /**
     * 문의 실시간 구독
     */
    subscribeToInquiries() {
        const sb = unifiedApp.sb;
        
        const channel = sb
            .channel('inquiries-changes')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'inquiries' 
                }, 
                (payload) => {
                    this.showRealtimeNotification(
                        '새 문의 등록',
                        `${payload.new.title} - ${payload.new.author}`,
                        'inquiry'
                    );
                }
            )
            .subscribe();

        this.channels.inquiries = channel;
    },

    /**
     * 실시간 알림 표시
     */
    showRealtimeNotification(title, message, type) {
        // 브라우저 알림 권한 확인
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                badge: '/favicon.ico'
            });
        }

        // 화면 알림
        const typeColors = {
            purchase: 'bg-blue-500',
            vacation: 'bg-purple-500',
            inquiry: 'bg-green-500'
        };

        const typeIcons = {
            purchase: 'fa-shopping-cart',
            vacation: 'fa-umbrella-beach',
            inquiry: 'fa-comment-dots'
        };

        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 ${typeColors[type]} text-white px-6 py-4 rounded-lg shadow-2xl z-50 max-w-sm animate-slide-in`;
        notification.innerHTML = `
            <div class="flex items-start space-x-3">
                <i class="fas ${typeIcons[type]} text-2xl"></i>
                <div class="flex-1">
                    <h4 class="font-bold text-lg">${title}</h4>
                    <p class="text-sm opacity-90">${message}</p>
                    <p class="text-xs opacity-75 mt-1">${new Date().toLocaleTimeString('ko-KR')}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // 알림음 재생 (선택)
        this.playNotificationSound();

        // 10초 후 자동 제거
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 10000);
    },

    /**
     * 알림음 재생
     */
    playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ4PV6zt56JaGAg+ltryxnMpBSh+zPLaizsIGGS57OihUhELTKXh8bllHAU2jdXzzn0vBSN0xO/blkELElyx6+mmWBUIQ5zd8sFsJAUuhM/z1YU2Bhxqvu7mnFIOD1Kn6+ukWRYIPpPY88p2KwUme8rx3I4+CBlitOvopVQTC0mi4PK8aB8GM4nU88qAMQYga7/v45ZPDRBXruzpqVkXCECY3PLEcSYEKoHN8tiKOQcZZ7zs6KFRDw1MpOLxtmQcBTaM1fPPgDEFI3PD7+OZUQ0PVq3s6KdaFwhBmNzyxnMoBSh9y/HajDsIF2W77Oihk...');
            audio.volume = 0.3;
            audio.play().catch(() => {}); // 자동 재생 실패 무시
        } catch (error) {
            // 알림음 실패는 무시
        }
    },

    /**
     * 브라우저 알림 권한 요청
     */
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                unifiedApp.showNotification('브라우저 알림이 활성화되었습니다!', 'success');
            }
        }
    },

    /**
     * 모든 구독 해제
     */
    unsubscribeAll() {
        Object.values(this.channels).forEach(channel => {
            channel.unsubscribe();
        });
        this.channels = {};
        console.log('✅ 모든 실시간 구독 해제');
    }
};

// ============================================
// 4. 권한 관리 - Role-based Access Control
// ============================================

const RoleManager = {
    // 역할 정의
    ROLES: {
        ADMIN: 'admin',           // 관리자 (모든 권한)
        MANAGER: 'manager',       // 매니저 (승인 권한)
        EMPLOYEE: 'employee',     // 직원 (기본 권한)
        VIEWER: 'viewer'          // 조회자 (읽기 전용)
    },

    // 현재 사용자 역할 (기본값)
    currentRole: 'admin',

    /**
     * 역할별 권한 매트릭스
     */
    PERMISSIONS: {
        // 대시보드
        'dashboard.view': ['admin', 'manager', 'employee', 'viewer'],
        
        // 직원 관리
        'employees.view': ['admin', 'manager', 'employee', 'viewer'],
        'employees.create': ['admin', 'manager'],
        'employees.edit': ['admin', 'manager'],
        'employees.delete': ['admin'],
        
        // 회원 관리
        'members.view': ['admin', 'manager', 'employee', 'viewer'],
        'members.create': ['admin', 'manager', 'employee'],
        'members.edit': ['admin', 'manager'],
        'members.delete': ['admin'],
        
        // 구매 관리
        'purchases.view': ['admin', 'manager', 'employee', 'viewer'],
        'purchases.create': ['admin', 'manager', 'employee'],
        'purchases.approve': ['admin', 'manager'],
        'purchases.delete': ['admin'],
        
        // 휴가 관리
        'vacations.view': ['admin', 'manager', 'employee', 'viewer'],
        'vacations.create': ['admin', 'manager', 'employee'],
        'vacations.approve': ['admin', 'manager'],
        'vacations.delete': ['admin'],
        
        // 정산서 & 급여
        'settlements.view': ['admin', 'manager'],
        'settlements.create': ['admin'],
        'settlements.edit': ['admin'],
        'settlements.delete': ['admin'],
        
        'payslips.view': ['admin', 'manager'],
        'payslips.create': ['admin'],
        'payslips.edit': ['admin'],
        'payslips.delete': ['admin'],
        
        // 서류 관리
        'documents.view': ['admin', 'manager', 'employee', 'viewer'],
        'documents.upload': ['admin', 'manager', 'employee'],
        'documents.delete': ['admin', 'manager']
    },

    /**
     * 권한 확인
     * @param {string} permission - 권한 키
     * @returns {boolean}
     */
    hasPermission(permission) {
        const allowedRoles = this.PERMISSIONS[permission] || [];
        return allowedRoles.includes(this.currentRole);
    },

    /**
     * 역할 설정
     * @param {string} role - 역할
     */
    setRole(role) {
        if (Object.values(this.ROLES).includes(role)) {
            this.currentRole = role;
            console.log(`✅ 역할 설정: ${role}`);
            this.updateUIByRole();
        }
    },

    /**
     * 역할에 따른 UI 업데이트
     */
    updateUIByRole() {
        // 승인 버튼 표시/숨김
        const approveButtons = document.querySelectorAll('[data-permission="approve"]');
        approveButtons.forEach(btn => {
            btn.style.display = this.hasPermission('purchases.approve') ? 'inline-block' : 'none';
        });

        // 삭제 버튼 표시/숨김
        const deleteButtons = document.querySelectorAll('[data-permission="delete"]');
        deleteButtons.forEach(btn => {
            btn.style.display = this.hasPermission('employees.delete') ? 'inline-block' : 'none';
        });

        // 추가 버튼 표시/숨김
        const addButtons = document.querySelectorAll('[data-permission="create"]');
        addButtons.forEach(btn => {
            btn.style.display = this.hasPermission('employees.create') ? 'inline-block' : 'none';
        });

        // 정산서/급여 메뉴 표시/숨김
        const financialMenus = document.querySelectorAll('[data-role="admin-only"]');
        financialMenus.forEach(menu => {
            menu.style.display = this.currentRole === 'admin' ? 'block' : 'none';
        });
    },

    /**
     * 권한 체크 데코레이터
     * @param {string} permission - 필요 권한
     * @param {Function} fn - 실행할 함수
     */
    checkPermission(permission, fn) {
        return (...args) => {
            if (this.hasPermission(permission)) {
                return fn(...args);
            } else {
                unifiedApp.showNotification('⛔ 권한이 없습니다.', 'error');
                return null;
            }
        };
    },

    /**
     * 역할 선택 UI 표시
     */
    showRoleSelector() {
        const html = `
            <div class="space-y-4">
                <h3 class="text-lg font-bold text-gray-800">사용자 역할 선택</h3>
                <p class="text-sm text-gray-600">테스트를 위해 역할을 선택하세요</p>
                
                <div class="space-y-2">
                    <button onclick="RoleManager.setRole('admin'); unifiedApp.closeModal();" 
                            class="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-left">
                        <i class="fas fa-crown mr-2"></i>
                        <strong>관리자 (Admin)</strong> - 모든 권한
                    </button>
                    
                    <button onclick="RoleManager.setRole('manager'); unifiedApp.closeModal();" 
                            class="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-left">
                        <i class="fas fa-user-tie mr-2"></i>
                        <strong>매니저 (Manager)</strong> - 승인 권한
                    </button>
                    
                    <button onclick="RoleManager.setRole('employee'); unifiedApp.closeModal();" 
                            class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-left">
                        <i class="fas fa-user mr-2"></i>
                        <strong>직원 (Employee)</strong> - 기본 권한
                    </button>
                    
                    <button onclick="RoleManager.setRole('viewer'); unifiedApp.closeModal();" 
                            class="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-left">
                        <i class="fas fa-eye mr-2"></i>
                        <strong>조회자 (Viewer)</strong> - 읽기 전용
                    </button>
                </div>
                
                <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p class="text-xs text-blue-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        현재 역할: <strong>${this.getRoleDisplayName(this.currentRole)}</strong>
                    </p>
                </div>
            </div>
        `;

        unifiedApp.openModal('역할 관리', html);
    },

    /**
     * 역할 표시 이름
     */
    getRoleDisplayName(role) {
        const names = {
            'admin': '관리자',
            'manager': '매니저',
            'employee': '직원',
            'viewer': '조회자'
        };
        return names[role] || role;
    }
};

// ============================================
// 통합 앱에 고급 기능 추가
// ============================================

// 앱 초기화 시 자동 실행
if (typeof unifiedApp !== 'undefined') {
    // 기존 init 함수 확장
    const originalInit = unifiedApp.init;
    unifiedApp.init = async function() {
        await originalInit.call(this);
        
        // 파일 업로드 버킷 초기화
        await FileUploadManager.initializeBuckets();
        
        // 실시간 알림 구독
        await RealtimeNotificationManager.initializeSubscriptions();
        
        // 브라우저 알림 권한 요청
        await RealtimeNotificationManager.requestNotificationPermission();
        
        console.log('✅ 고급 기능 초기화 완료');
    };
    
    // 고급 기능 객체를 전역으로 노출
    unifiedApp.fileUpload = FileUploadManager;
    unifiedApp.pdfGenerator = PDFGenerator;
    unifiedApp.realtime = RealtimeNotificationManager;
    unifiedApp.roleManager = RoleManager;
}

// 전역 노출 (디버깅용)
window.FileUploadManager = FileUploadManager;
window.PDFGenerator = PDFGenerator;
window.RealtimeNotificationManager = RealtimeNotificationManager;
window.RoleManager = RoleManager;
