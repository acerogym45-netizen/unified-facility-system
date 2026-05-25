// 통합 애플리케이션 메인 로직
const unifiedApp = {
    sb: null,
    currentUser: null,
    employees: [],
    members: [],
    purchases: [],
    vacations: [],
    instructors: [],
    programs: [],
    inquiries: [],
    notices: [],
    areas: [],
    workGallery: [],
    attendance: [],
    workLogs: [],
    documents: [],
    settlements: [],
    payslips: [],
    charts: {},

    init: async function() {
        console.log('🚀 통합 시스템 초기화');
        this.sb = createSharedSupabaseClient();
        
        // URL 파라미터에서 facility_id 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const facilityId = urlParams.get('facility');
        
        if (facilityId) {
            console.log('📍 URL 파라미터에서 facility_id 감지:', facilityId);
            
            // Supabase에서 facility 정보 가져오기
            try {
                const { data: facility, error } = await this.sb
                    .from('facilities')
                    .select('*')
                    .eq('id', facilityId)
                    .single();
                
                if (error) throw error;
                
                if (facility) {
                    this.currentFacilityId = facility.id;
                    this.currentFacilityName = facility.name;
                    this.currentFacility = facility;  // 전체 정보 저장
                    
                    console.log('✅ 시설 정보 로드:', facility.name);
                    
                    // 시설 정보를 세션에도 저장 (새로고침 대비)
                    sessionStorage.setItem('current_facility_id', facility.id);
                    sessionStorage.setItem('current_facility_name', facility.name);
                    sessionStorage.setItem('current_facility_system_name', facility.system_name || facility.name);
                    
                    // 헤더에 시스템명 표시
                    this.updateFacilityHeader(facility.system_name || facility.name);
                } else {
                    console.warn('⚠️ 시설 정보를 찾을 수 없습니다');
                    alert('시설 정보를 찾을 수 없습니다. URL을 확인해주세요.');
                }
            } catch (err) {
                console.error('❌ 시설 정보 로드 실패:', err);
                alert('시설 정보를 불러올 수 없습니다: ' + err.message);
            }
        } else {
            // URL 파라미터 없으면 세션에서 확인
            const sessionFacilityId = sessionStorage.getItem('current_facility_id');
            const sessionSystemName = sessionStorage.getItem('current_facility_system_name');
            
            if (sessionFacilityId) {
                console.log('📍 세션에서 facility_id 복원:', sessionFacilityId);
                this.currentFacilityId = sessionFacilityId;
                this.currentFacilityName = sessionStorage.getItem('current_facility_name');
                this.updateFacilityHeader(sessionSystemName || this.currentFacilityName);
            } else {
                console.log('⚠️ 시설 정보 없음 - 기본 모드로 실행');
                // 기본 facility_id 사용 (기존 방식)
                this.currentFacilityId = FACILITY_IDS.APARTMENT;
                this.currentFacilityName = 'e편한세상당정퍼스트드림';
            }
        }
        
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        
        // 고급 기능 초기화
        console.log('⚡ 고급 기능 초기화 중...');
        
        // 1. Supabase Storage 버킷 초기화
        try {
            await FileUploadManager.initializeBuckets();
            console.log('✅ Storage 버킷 초기화 완료');
        } catch (err) {
            console.warn('⚠️ Storage 초기화 실패:', err.message);
        }
        
        // 2. 실시간 알림 구독 초기화 (로그인 후 활성화)
        // RealtimeNotificationManager.initializeSubscriptions() - login 함수에서 호출
        
        // 3. 권한 관리자 초기화
        RoleManager.init();
        console.log('✅ 권한 관리 초기화 완료');
        
        console.log('✨ 모든 고급 기능 초기화 완료');
    },
    
    // 시설명 헤더 업데이트
    updateFacilityHeader: function(systemName) {
        const header = document.querySelector('header .text-xl');
        if (header && systemName) {
            header.textContent = systemName;
        }
    },
    
    // 마스터 관리자로 돌아가기
    returnToMaster: function() {
        if (confirm('마스터 관리자 화면으로 돌아가시겠습니까?')) {
            // Vercel 배포된 마스터 관리자로 이동
            window.location.href = 'https://unified-facility-master.vercel.app/';
        }
    },

    login: function() {
        const pin = document.getElementById('loginPin').value;
        if (pin === 'admin2026' || pin === 'bdxi2026') {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('mainDashboard').style.display = 'block';
            this.loadDashboard();
            
            // 실시간 알림 구독 시작
            RealtimeNotificationManager.initializeSubscriptions();
            console.log('✅ 실시간 알림 구독 시작');
        } else {
            alert('❌ 잘못된 PIN입니다.');
        }
    },

    logout: function() {
        if (confirm('로그아웃 하시겠습니까?')) {
            document.getElementById('mainDashboard').style.display = 'none';
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('loginPin').value = '';
        }
    },

    showSection: function(sectionName) {
        document.querySelectorAll('.section-content').forEach(el => el.style.display = 'none');
        const section = document.getElementById('section-' + sectionName);
        if (section) section.style.display = 'block';
        
        document.querySelectorAll('.sidebar-item').forEach(el => {
            el.classList.remove('sidebar-active');
        });
        const btn = document.querySelector(`[data-section="${sectionName}"]`);
        if (btn) btn.classList.add('sidebar-active');

        // 섹션별 데이터 로드
        const loaders = {
            'employees': () => this.loadEmployees(),
            'members': () => this.loadMembers(),
            'attendance': () => this.loadAttendance(),
            'purchases': () => this.loadPurchases(),
            'vacations': () => this.loadVacations(),
            'instructors': () => this.loadInstructors(),
            'programs': () => this.loadPrograms(),
            'inquiries': () => this.loadInquiries(),
            'notices': () => this.loadNotices(),
            'areas': () => this.loadAreas(),
            'work-gallery': () => this.loadWorkGallery(),
            'work-logs': () => this.loadWorkLogs(),
            'documents': () => this.loadDocuments(),
            'settlements': () => this.loadSettlements(),
            'payslips': () => this.loadPayslips()
        };
        
        if (loaders[sectionName]) loaders[sectionName]();
    },

    updateClock: function() {
        const now = new Date();
        const timeStr = now.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const clockEl = document.getElementById('clock');
        if (clockEl) clockEl.textContent = timeStr;
    },

    loadDashboard: async function() {
        console.log('📊 대시보드 로드');
        await this.loadStats();
        this.loadCharts();
    },

    loadStats: async function() {
        try {
            const { count: empCount } = await this.sb
                .from('employees')
                .select('*', { count: 'exact', head: true });
            document.getElementById('stat-employees').textContent = empCount || 0;

            const { count: memCount } = await this.sb
                .from('members')
                .select('*', { count: 'exact', head: true });
            document.getElementById('stat-members').textContent = memCount || 0;

            const today = new Date().toISOString().split('T')[0];
            const { count: attCount } = await this.sb
                .from('attendance_records')
                .select('*', { count: 'exact', head: true })
                .eq('date', today);
            document.getElementById('stat-attendance').textContent = attCount || 0;

            const { count: inqCount } = await this.sb
                .from('inquiries')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
            document.getElementById('stat-inquiries').textContent = inqCount || 0;
        } catch (err) {
            console.error('통계 로드 실패:', err);
        }
    },

    loadCharts: function() {
        const weeklyCtx = document.getElementById('weeklyChart');
        if (weeklyCtx && !this.charts.weekly) {
            this.charts.weekly = new Chart(weeklyCtx, {
                type: 'line',
                data: {
                    labels: ['월', '화', '수', '목', '금', '토', '일'],
                    datasets: [{
                        label: '출석 인원',
                        data: [12, 19, 15, 17, 14, 21, 18],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        }

        const facilityCtx = document.getElementById('facilityChart');
        if (facilityCtx && !this.charts.facility) {
            this.charts.facility = new Chart(facilityCtx, {
                type: 'doughnut',
                data: {
                    labels: ['직원 (ERP)', '회원 (CRM)'],
                    datasets: [{
                        data: [12, 45],
                        backgroundColor: ['#667eea', '#764ba2']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    },

    // 모달 관리
    showModal: function(title, bodyHtml) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = bodyHtml;
        document.getElementById('genericModal').style.display = 'block';
    },

    closeModal: function() {
        document.getElementById('genericModal').style.display = 'none';
    },

    // QR 코드 생성
    generateQRCode: function() {
        return 'QR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },

    // 날짜 포맷
    formatDate: function(dateStr) {
        if (!dateStr) return '-';
        return dateStr.split('T')[0];
    },

    // 알림 표시
    showNotification: function(message, type = 'success') {
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    unifiedApp.init();
});

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('genericModal');
    if (event.target === modal) {
        unifiedApp.closeModal();
    }
};
