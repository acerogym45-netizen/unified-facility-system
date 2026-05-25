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
// 직원 관리 모듈
unifiedApp.loadEmployees = async function() {
    console.log('👥 직원 목록 로드');
    try {
        let query = this.sb
            .from('employees')
            .select('*');
        
        // 현재 시설 필터 적용
        if (this.currentFacilityId) {
            query = query.eq('facility_id', this.currentFacilityId);
        }
        
        const { data, error } = await query.order('name');
        
        if (error) throw error;
        this.employees = data || [];
        this.renderEmployees();
        console.log(`✅ 직원 ${this.employees.length}명 로드됨`);
    } catch (err) {
        console.error('직원 로드 실패:', err);
        this.employees = [];
        this.renderEmployees();
    }
};

unifiedApp.renderEmployees = function() {
    const tbody = document.getElementById('employeeTableBody');
    if (!tbody) return;

    if (this.employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">등록된 직원이 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = this.employees.map(emp => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium">${emp.name}</td>
            <td class="px-6 py-4">${emp.position || '-'}</td>
            <td class="px-6 py-4">${emp.phone || '-'}</td>
            <td class="px-6 py-4"><code class="text-xs bg-gray-100 px-2 py-1 rounded">${emp.qr_code || '-'}</code></td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full ${emp.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${emp.is_active ? '재직' : '퇴사'}
                </span>
            </td>
            <td class="px-6 py-4 space-x-2">
                <button onclick="unifiedApp.viewEmployee('${emp.id}')" class="text-blue-600 hover:text-blue-800" title="상세보기">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="unifiedApp.editEmployee('${emp.id}')" class="text-green-600 hover:text-green-800" title="수정">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="unifiedApp.deleteEmployee('${emp.id}')" class="text-red-600 hover:text-red-800" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
};

unifiedApp.openEmployeeModal = function(employeeId = null) {
    const isEdit = !!employeeId;
    const employee = isEdit ? this.employees.find(e => e.id === employeeId) : null;
    
    const formHtml = `
        <form id="employeeForm" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                <input type="text" id="emp_name" value="${employee?.name || ''}" required
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">직책</label>
                <input type="text" id="emp_position" value="${employee?.position || ''}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                <input type="tel" id="emp_phone" value="${employee?.phone || ''}" placeholder="010-0000-0000"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                <input type="email" id="emp_email" value="${employee?.email || ''}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">입사일</label>
                <input type="date" id="emp_hire_date" value="${employee?.hire_date || ''}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            
            ${isEdit ? '' : `
            <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-sm text-blue-800">
                    <i class="fas fa-info-circle mr-2"></i>
                    QR 코드는 자동으로 생성됩니다.
                </p>
            </div>
            `}
            
            <div class="flex items-center">
                <input type="checkbox" id="emp_is_active" ${employee?.is_active !== false ? 'checked' : ''}
                       class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                <label for="emp_is_active" class="ml-2 text-sm text-gray-700">재직중</label>
            </div>
            
            <div class="flex space-x-3 pt-4">
                <button type="submit" 
                        class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all">
                    <i class="fas fa-save mr-2"></i>${isEdit ? '수정' : '등록'}
                </button>
                <button type="button" onclick="unifiedApp.closeModal()"
                        class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-all">
                    <i class="fas fa-times mr-2"></i>취소
                </button>
            </div>
        </form>
    `;
    
    this.showModal(isEdit ? '직원 정보 수정' : '직원 추가', formHtml);
    
    document.getElementById('employeeForm').onsubmit = async (e) => {
        e.preventDefault();
        
        const employeeData = {
            name: document.getElementById('emp_name').value,
            position: document.getElementById('emp_position').value,
            phone: document.getElementById('emp_phone').value,
            email: document.getElementById('emp_email').value,
            hire_date: document.getElementById('emp_hire_date').value,
            is_active: document.getElementById('emp_is_active').checked,
            facility_id: this.currentFacilityId || FACILITY_IDS.APARTMENT
        };
        
        if (!isEdit) {
            employeeData.qr_code = this.generateQRCode();
        }
        
        try {
            if (isEdit) {
                const { error } = await this.sb
                    .from('employees')
                    .update(employeeData)
                    .eq('id', employeeId);
                
                if (error) throw error;
                this.showNotification('직원 정보가 수정되었습니다.');
            } else {
                const { error } = await this.sb
                    .from('employees')
                    .insert([employeeData]);
                
                if (error) throw error;
                this.showNotification('직원이 등록되었습니다.');
            }
            
            this.closeModal();
            this.loadEmployees();
        } catch (err) {
            console.error('직원 저장 실패:', err);
            alert('오류가 발생했습니다: ' + err.message);
        }
    };
};

unifiedApp.viewEmployee = function(employeeId) {
    const employee = this.employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    const detailHtml = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-gray-500">이름</p>
                    <p class="font-medium">${employee.name}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">직책</p>
                    <p class="font-medium">${employee.position || '-'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">연락처</p>
                    <p class="font-medium">${employee.phone || '-'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">이메일</p>
                    <p class="font-medium">${employee.email || '-'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">입사일</p>
                    <p class="font-medium">${employee.hire_date || '-'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">상태</p>
                    <span class="px-2 py-1 text-xs rounded-full ${employee.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${employee.is_active ? '재직' : '퇴사'}
                    </span>
                </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-sm text-gray-500 mb-2">QR 코드</p>
                <div class="flex items-center space-x-4">
                    <code class="bg-white px-4 py-2 rounded border text-sm">${employee.qr_code || '-'}</code>
                    <button onclick="navigator.clipboard.writeText('${employee.qr_code}')" 
                            class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        <i class="fas fa-copy mr-1"></i>복사
                    </button>
                </div>
            </div>
            
            <div class="flex space-x-3 pt-4">
                <button onclick="unifiedApp.editEmployee('${employee.id}')" 
                        class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700">
                    <i class="fas fa-edit mr-2"></i>수정
                </button>
                <button onclick="unifiedApp.closeModal()"
                        class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600">
                    <i class="fas fa-times mr-2"></i>닫기
                </button>
            </div>
        </div>
    `;
    
    this.showModal('직원 상세 정보', detailHtml);
};

unifiedApp.editEmployee = function(employeeId) {
    this.closeModal();
    setTimeout(() => {
        this.openEmployeeModal(employeeId);
    }, 100);
};

unifiedApp.deleteEmployee = async function(employeeId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
        const { error } = await this.sb
            .from('employees')
            .delete()
            .eq('id', employeeId);
        
        if (error) throw error;
        
        this.showNotification('직원이 삭제되었습니다.');
        this.loadEmployees();
    } catch (err) {
        console.error('직원 삭제 실패:', err);
        alert('오류가 발생했습니다: ' + err.message);
    }
};
// 회원 관리 모듈
unifiedApp.loadMembers = async function() {
    console.log('👥 회원 목록 로드');
    try {
        let query = this.sb
            .from('members')
            .select('*');
        
        // 현재 시설 필터 적용
        if (this.currentFacilityId) {
            query = query.eq('facility_id', this.currentFacilityId);
        }
        
        const { data, error } = await query.order('name');
        
        if (error) throw error;
        this.members = data || [];
        this.renderMembers();
        console.log(`✅ 회원 ${this.members.length}명 로드됨`);
    } catch (err) {
        console.error('회원 로드 실패:', err);
        this.members = [];
        this.renderMembers();
    }
};

unifiedApp.renderMembers = function() {
    const tbody = document.getElementById('memberTableBody');
    if (!tbody) return;

    if (this.members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">등록된 회원이 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = this.members.map(mem => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium">${mem.name}</td>
            <td class="px-6 py-4">${mem.phone || '-'}</td>
            <td class="px-6 py-4">${mem.membership_type || '-'}</td>
            <td class="px-6 py-4 text-sm">${this.formatDate(mem.start_date)} ~ ${this.formatDate(mem.end_date)}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full ${mem.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${mem.is_active ? '활동' : '만료'}
                </span>
            </td>
            <td class="px-6 py-4 space-x-2">
                <button onclick="unifiedApp.viewMember('${mem.id}')" class="text-blue-600 hover:text-blue-800" title="상세보기">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="unifiedApp.editMember('${mem.id}')" class="text-green-600 hover:text-green-800" title="수정">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="unifiedApp.deleteMember('${mem.id}')" class="text-red-600 hover:text-red-800" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
};

unifiedApp.openMemberModal = function(memberId = null) {
    const isEdit = !!memberId;
    const member = isEdit ? this.members.find(m => m.id === memberId) : null;
    
    const formHtml = `
        <form id="memberForm" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                <input type="text" id="mem_name" value="${member?.name || ''}" required
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">연락처 *</label>
                <input type="tel" id="mem_phone" value="${member?.phone || ''}" placeholder="010-0000-0000" required
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                <input type="email" id="mem_email" value="${member?.email || ''}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">회원권 유형 *</label>
                <select id="mem_membership_type" required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="">선택하세요</option>
                    <option value="1개월" ${member?.membership_type === '1개월' ? 'selected' : ''}>1개월</option>
                    <option value="3개월" ${member?.membership_type === '3개월' ? 'selected' : ''}>3개월</option>
                    <option value="6개월" ${member?.membership_type === '6개월' ? 'selected' : ''}>6개월</option>
                    <option value="12개월" ${member?.membership_type === '12개월' ? 'selected' : ''}>12개월</option>
                    <option value="자유이용권" ${member?.membership_type === '자유이용권' ? 'selected' : ''}>자유이용권</option>
                </select>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">시작일 *</label>
                    <input type="date" id="mem_start_date" value="${member?.start_date || ''}" required
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">종료일 *</label>
                    <input type="date" id="mem_end_date" value="${member?.end_date || ''}" required
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">비고</label>
                <textarea id="mem_notes" rows="3"
                          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${member?.notes || ''}</textarea>
            </div>
            
            <div class="flex items-center">
                <input type="checkbox" id="mem_is_active" ${member?.is_active !== false ? 'checked' : ''}
                       class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                <label for="mem_is_active" class="ml-2 text-sm text-gray-700">활동중</label>
            </div>
            
            <div class="flex space-x-3 pt-4">
                <button type="submit" 
                        class="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-all">
                    <i class="fas fa-save mr-2"></i>${isEdit ? '수정' : '등록'}
                </button>
                <button type="button" onclick="unifiedApp.closeModal()"
                        class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-all">
                    <i class="fas fa-times mr-2"></i>취소
                </button>
            </div>
        </form>
    `;
    
    this.showModal(isEdit ? '회원 정보 수정' : '회원 추가', formHtml);
    
    document.getElementById('memberForm').onsubmit = async (e) => {
        e.preventDefault();
        
        const memberData = {
            name: document.getElementById('mem_name').value,
            phone: document.getElementById('mem_phone').value,
            email: document.getElementById('mem_email').value,
            membership_type: document.getElementById('mem_membership_type').value,
            start_date: document.getElementById('mem_start_date').value,
            end_date: document.getElementById('mem_end_date').value,
            notes: document.getElementById('mem_notes').value,
            is_active: document.getElementById('mem_is_active').checked,
            facility_id: this.currentFacilityId || FACILITY_IDS.FITNESS
        };
        
        try {
            if (isEdit) {
                const { error } = await this.sb
                    .from('members')
                    .update(memberData)
                    .eq('id', memberId);
                
                if (error) throw error;
                this.showNotification('회원 정보가 수정되었습니다.');
            } else {
                const { error } = await this.sb
                    .from('members')
                    .insert([memberData]);
                
                if (error) throw error;
                this.showNotification('회원이 등록되었습니다.');
            }
            
            this.closeModal();
            this.loadMembers();
        } catch (err) {
            console.error('회원 저장 실패:', err);
            alert('오류가 발생했습니다: ' + err.message);
        }
    };
};

unifiedApp.viewMember = function(memberId) {
    const member = this.members.find(m => m.id === memberId);
    if (!member) return;
    
    const detailHtml = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-gray-500">이름</p>
                    <p class="font-medium">${member.name}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">연락처</p>
                    <p class="font-medium">${member.phone || '-'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">이메일</p>
                    <p class="font-medium">${member.email || '-'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">회원권</p>
                    <p class="font-medium">${member.membership_type || '-'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">시작일</p>
                    <p class="font-medium">${this.formatDate(member.start_date)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">종료일</p>
                    <p class="font-medium">${this.formatDate(member.end_date)}</p>
                </div>
                <div class="col-span-2">
                    <p class="text-sm text-gray-500">상태</p>
                    <span class="px-2 py-1 text-xs rounded-full ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${member.is_active ? '활동' : '만료'}
                    </span>
                </div>
            </div>
            
            ${member.notes ? `
            <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-sm text-gray-500 mb-2">비고</p>
                <p class="text-sm">${member.notes}</p>
            </div>
            ` : ''}
            
            <div class="flex space-x-3 pt-4">
                <button onclick="unifiedApp.editMember('${member.id}')" 
                        class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700">
                    <i class="fas fa-edit mr-2"></i>수정
                </button>
                <button onclick="unifiedApp.closeModal()"
                        class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600">
                    <i class="fas fa-times mr-2"></i>닫기
                </button>
            </div>
        </div>
    `;
    
    this.showModal('회원 상세 정보', detailHtml);
};

unifiedApp.editMember = function(memberId) {
    this.closeModal();
    setTimeout(() => {
        this.openMemberModal(memberId);
    }, 100);
};

unifiedApp.deleteMember = async function(memberId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
        const { error } = await this.sb
            .from('members')
            .delete()
            .eq('id', memberId);
        
        if (error) throw error;
        
        this.showNotification('회원이 삭제되었습니다.');
        this.loadMembers();
    } catch (err) {
        console.error('회원 삭제 실패:', err);
        alert('오류가 발생했습니다: ' + err.message);
    }
};
// 구매 관리 모듈
unifiedApp.loadPurchases = async function() {
    console.log('🛒 구매 목록 로드');
    try {
        const { data, error } = await this.sb
            .from('purchases')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        this.purchases = data || [];
        this.renderPurchases();
    } catch (err) {
        console.error('구매 로드 실패:', err);
        this.purchases = [];
        this.renderPurchases();
    }
};

unifiedApp.renderPurchases = function() {
    const tbody = document.getElementById('purchaseTableBody');
    if (!tbody) return;

    if (this.purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">구매 요청이 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = this.purchases.map(p => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium">${p.item_name}</td>
            <td class="px-6 py-4">${p.quantity}</td>
            <td class="px-6 py-4">${p.requester || '-'}</td>
            <td class="px-6 py-4">${this.formatDate(p.request_date)}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full status-${p.status}">
                    ${this.getStatusText(p.status)}
                </span>
            </td>
            <td class="px-6 py-4 space-x-2">
                <button onclick="unifiedApp.viewPurchase('${p.id}')" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-eye"></i>
                </button>
                ${p.status === 'pending' ? `
                <button onclick="unifiedApp.approvePurchase('${p.id}')" class="text-green-600 hover:text-green-800">
                    <i class="fas fa-check"></i>
                </button>
                <button onclick="unifiedApp.rejectPurchase('${p.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-times"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
};

unifiedApp.openPurchaseModal = function(purchaseId = null) {
    const isEdit = !!purchaseId;
    const purchase = isEdit ? this.purchases.find(p => p.id === purchaseId) : null;
    
    const formHtml = `
        <form id="purchaseForm" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">품목명 *</label>
                <input type="text" id="purch_item_name" value="${purchase?.item_name || ''}" required
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">수량 *</label>
                    <input type="number" id="purch_quantity" value="${purchase?.quantity || 1}" required min="1"
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">예상 금액</label>
                    <input type="number" id="purch_amount" value="${purchase?.estimated_amount || ''}" min="0"
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">요청자 *</label>
                <input type="text" id="purch_requester" value="${purchase?.requester || ''}" required
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">요청 사유</label>
                <textarea id="purch_reason" rows="3"
                          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">${purchase?.reason || ''}</textarea>
            </div>
            
            <div class="flex space-x-3 pt-4">
                <button type="submit" 
                        class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all">
                    <i class="fas fa-save mr-2"></i>${isEdit ? '수정' : '등록'}
                </button>
                <button type="button" onclick="unifiedApp.closeModal()"
                        class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-all">
                    <i class="fas fa-times mr-2"></i>취소
                </button>
            </div>
        </form>
    `;
    
    this.showModal(isEdit ? '구매 요청 수정' : '구매 요청', formHtml);
    
    document.getElementById('purchaseForm').onsubmit = async (e) => {
        e.preventDefault();
        
        const purchaseData = {
            item_name: document.getElementById('purch_item_name').value,
            quantity: parseInt(document.getElementById('purch_quantity').value),
            estimated_amount: parseFloat(document.getElementById('purch_amount').value) || 0,
            requester: document.getElementById('purch_requester').value,
            reason: document.getElementById('purch_reason').value,
            status: 'pending',
            request_date: new Date().toISOString().split('T')[0],
            facility_id: this.currentFacilityId || FACILITY_IDS.APARTMENT
        };
        
        try {
            if (isEdit) {
                const { error } = await this.sb
                    .from('purchases')
                    .update(purchaseData)
                    .eq('id', purchaseId);
                
                if (error) throw error;
                this.showNotification('구매 요청이 수정되었습니다.');
            } else {
                const { error } = await this.sb
                    .from('purchases')
                    .insert([purchaseData]);
                
                if (error) throw error;
                this.showNotification('구매 요청이 등록되었습니다.');
            }
            
            this.closeModal();
            this.loadPurchases();
        } catch (err) {
            console.error('구매 저장 실패:', err);
            alert('오류가 발생했습니다: ' + err.message);
        }
    };
};

unifiedApp.viewPurchase = function(purchaseId) {
    const purchase = this.purchases.find(p => p.id === purchaseId);
    if (!purchase) return;
    
    const detailHtml = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-gray-500">품목명</p>
                    <p class="font-medium">${purchase.item_name}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">수량</p>
                    <p class="font-medium">${purchase.quantity}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">예상 금액</p>
                    <p class="font-medium">${purchase.estimated_amount?.toLocaleString() || '-'}원</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">요청자</p>
                    <p class="font-medium">${purchase.requester || '-'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">요청일</p>
                    <p class="font-medium">${this.formatDate(purchase.request_date)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">상태</p>
                    <span class="px-2 py-1 text-xs rounded-full status-${purchase.status}">
                        ${this.getStatusText(purchase.status)}
                    </span>
                </div>
            </div>
            
            ${purchase.reason ? `
            <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-sm text-gray-500 mb-2">요청 사유</p>
                <p class="text-sm">${purchase.reason}</p>
            </div>
            ` : ''}
            
            <div class="flex space-x-3 pt-4">
                ${purchase.status === 'pending' ? `
                <button onclick="unifiedApp.approvePurchase('${purchase.id}')" 
                        class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700">
                    <i class="fas fa-check mr-2"></i>승인
                </button>
                <button onclick="unifiedApp.rejectPurchase('${purchase.id}')" 
                        class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700">
                    <i class="fas fa-times mr-2"></i>거절
                </button>
                ` : ''}
                <button onclick="unifiedApp.closeModal()"
                        class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600">
                    <i class="fas fa-arrow-left mr-2"></i>닫기
                </button>
            </div>
        </div>
    `;
    
    this.showModal('구매 요청 상세', detailHtml);
};

unifiedApp.approvePurchase = async function(purchaseId) {
    if (!confirm('구매를 승인하시겠습니까?')) return;
    
    try {
        const { error } = await this.sb
            .from('purchases')
            .update({ status: 'approved', approved_date: new Date().toISOString() })
            .eq('id', purchaseId);
        
        if (error) throw error;
        
        this.showNotification('구매가 승인되었습니다.');
        this.closeModal();
        this.loadPurchases();
    } catch (err) {
        console.error('구매 승인 실패:', err);
        alert('오류가 발생했습니다: ' + err.message);
    }
};

unifiedApp.rejectPurchase = async function(purchaseId) {
    if (!confirm('구매를 거절하시겠습니까?')) return;
    
    try {
        const { error } = await this.sb
            .from('purchases')
            .update({ status: 'rejected', rejected_date: new Date().toISOString() })
            .eq('id', purchaseId);
        
        if (error) throw error;
        
        this.showNotification('구매가 거절되었습니다.');
        this.closeModal();
        this.loadPurchases();
    } catch (err) {
        console.error('구매 거절 실패:', err);
        alert('오류가 발생했습니다: ' + err.message);
    }
};

unifiedApp.getStatusText = function(status) {
    const statusMap = {
        'pending': '대기',
        'approved': '승인',
        'rejected': '거절',
        'completed': '완료'
    };
    return statusMap[status] || status;
};
// 휴가 관리, 강사 관리, 프로그램 관리, 문의/공지 등 나머지 모든 모듈
// 이 파일은 추가 기능들을 포함합니다

// 휴가 관리
unifiedApp.loadVacations = async function() {
    try {
        const { data, error } = await this.sb.from('vacations').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        this.vacations = data || [];
        this.renderVacations();
    } catch (err) {
        console.error('휴가 로드 실패:', err);
        this.vacations = [];
        this.renderVacations();
    }
};

unifiedApp.renderVacations = function() {
    const tbody = document.getElementById('vacationTableBody');
    if (!tbody) return;
    if (this.vacations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">휴가 신청이 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = this.vacations.map(v => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">${v.employee_name || '-'}</td>
            <td class="px-6 py-4">${v.vacation_type || '-'}</td>
            <td class="px-6 py-4">${this.formatDate(v.start_date)}</td>
            <td class="px-6 py-4">${this.formatDate(v.end_date)}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full status-${v.status}">${this.getStatusText(v.status)}</span></td>
            <td class="px-6 py-4 space-x-2">
                ${v.status === 'pending' ? `<button onclick="unifiedApp.approveVacation('${v.id}')" class="text-green-600"><i class="fas fa-check"></i></button>
                <button onclick="unifiedApp.rejectVacation('${v.id}')" class="text-red-600"><i class="fas fa-times"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
};

unifiedApp.openVacationModal = function(vacationId = null) {
    const isEdit = !!vacationId;
    const vacation = isEdit ? this.vacations.find(v => v.id === vacationId) : null;
    const formHtml = `
        <form id="vacationForm" class="space-y-4">
            <div><label class="block text-sm font-medium text-gray-700 mb-2">직원명 *</label>
                <input type="text" id="vac_employee_name" value="${vacation?.employee_name || ''}" required class="w-full px-4 py-2 border rounded-lg"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">휴가 유형 *</label>
                <select id="vac_type" required class="w-full px-4 py-2 border rounded-lg">
                    <option value="">선택</option>
                    <option value="연차" ${vacation?.vacation_type === '연차' ? 'selected' : ''}>연차</option>
                    <option value="반차" ${vacation?.vacation_type === '반차' ? 'selected' : ''}>반차</option>
                    <option value="병가" ${vacation?.vacation_type === '병가' ? 'selected' : ''}>병가</option>
                    <option value="경조사" ${vacation?.vacation_type === '경조사' ? 'selected' : ''}>경조사</option>
                </select></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium text-gray-700 mb-2">시작일 *</label>
                    <input type="date" id="vac_start_date" value="${vacation?.start_date || ''}" required class="w-full px-4 py-2 border rounded-lg"></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-2">종료일 *</label>
                    <input type="date" id="vac_end_date" value="${vacation?.end_date || ''}" required class="w-full px-4 py-2 border rounded-lg"></div>
            </div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">사유</label>
                <textarea id="vac_reason" rows="3" class="w-full px-4 py-2 border rounded-lg">${vacation?.reason || ''}</textarea></div>
            <div class="flex space-x-3 pt-4">
                <button type="submit" class="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"><i class="fas fa-save mr-2"></i>${isEdit ? '수정' : '신청'}</button>
                <button type="button" onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>취소</button>
            </div>
        </form>
    `;
    this.showModal(isEdit ? '휴가 수정' : '휴가 신청', formHtml);
    document.getElementById('vacationForm').onsubmit = async (e) => {
        e.preventDefault();
        const vacationData = {
            employee_name: document.getElementById('vac_employee_name').value,
            vacation_type: document.getElementById('vac_type').value,
            start_date: document.getElementById('vac_start_date').value,
            end_date: document.getElementById('vac_end_date').value,
            reason: document.getElementById('vac_reason').value,
            status: 'pending',
            facility_id: this.currentFacilityId || FACILITY_IDS.APARTMENT
        };
        try {
            if (isEdit) {
                const { error } = await this.sb.from('vacations').update(vacationData).eq('id', vacationId);
                if (error) throw error;
                this.showNotification('휴가가 수정되었습니다.');
            } else {
                const { error } = await this.sb.from('vacations').insert([vacationData]);
                if (error) throw error;
                this.showNotification('휴가가 신청되었습니다.');
            }
            this.closeModal();
            this.loadVacations();
        } catch (err) {
            console.error('휴가 저장 실패:', err);
            alert('오류: ' + err.message);
        }
    };
};

unifiedApp.approveVacation = async function(vacationId) {
    if (!confirm('휴가를 승인하시겠습니까?')) return;
    try {
        const { error } = await this.sb.from('vacations').update({ status: 'approved' }).eq('id', vacationId);
        if (error) throw error;
        this.showNotification('휴가가 승인되었습니다.');
        this.loadVacations();
    } catch (err) {
        alert('오류: ' + err.message);
    }
};

unifiedApp.rejectVacation = async function(vacationId) {
    if (!confirm('휴가를 거절하시겠습니까?')) return;
    try {
        const { error } = await this.sb.from('vacations').update({ status: 'rejected' }).eq('id', vacationId);
        if (error) throw error;
        this.showNotification('휴가가 거절되었습니다.');
        this.loadVacations();
    } catch (err) {
        alert('오류: ' + err.message);
    }
};

// 강사 관리
unifiedApp.loadInstructors = async function() {
    try {
        const { data, error } = await this.sb.from('instructors').select('*').order('name');
        if (error) throw error;
        this.instructors = data || [];
        this.renderInstructors();
    } catch (err) {
        console.error('강사 로드 실패:', err);
        this.instructors = [];
        this.renderInstructors();
    }
};

unifiedApp.renderInstructors = function() {
    const tbody = document.getElementById('instructorTableBody');
    if (!tbody) return;
    if (this.instructors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">등록된 강사가 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = this.instructors.map(i => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">${i.name}</td>
            <td class="px-6 py-4">${i.specialty || '-'}</td>
            <td class="px-6 py-4">${i.phone || '-'}</td>
            <td class="px-6 py-4">${i.email || '-'}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full ${i.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">${i.is_active ? '활동' : '휴직'}</span></td>
            <td class="px-6 py-4 space-x-2">
                <button onclick="unifiedApp.editInstructor('${i.id}')" class="text-green-600"><i class="fas fa-edit"></i></button>
                <button onclick="unifiedApp.deleteInstructor('${i.id}')" class="text-red-600"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
};

unifiedApp.openInstructorModal = function(instructorId = null) {
    const isEdit = !!instructorId;
    const instructor = isEdit ? this.instructors.find(i => i.id === instructorId) : null;
    const formHtml = `
        <form id="instructorForm" class="space-y-4">
            <div><label class="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                <input type="text" id="inst_name" value="${instructor?.name || ''}" required class="w-full px-4 py-2 border rounded-lg"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">전문분야</label>
                <input type="text" id="inst_specialty" value="${instructor?.specialty || ''}" class="w-full px-4 py-2 border rounded-lg"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                <input type="tel" id="inst_phone" value="${instructor?.phone || ''}" class="w-full px-4 py-2 border rounded-lg"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                <input type="email" id="inst_email" value="${instructor?.email || ''}" class="w-full px-4 py-2 border rounded-lg"></div>
            <div class="flex items-center">
                <input type="checkbox" id="inst_is_active" ${instructor?.is_active !== false ? 'checked' : ''} class="w-4 h-4">
                <label for="inst_is_active" class="ml-2 text-sm">활동중</label>
            </div>
            <div class="flex space-x-3 pt-4">
                <button type="submit" class="flex-1 bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700"><i class="fas fa-save mr-2"></i>${isEdit ? '수정' : '등록'}</button>
                <button type="button" onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>취소</button>
            </div>
        </form>
    `;
    this.showModal(isEdit ? '강사 수정' : '강사 추가', formHtml);
    document.getElementById('instructorForm').onsubmit = async (e) => {
        e.preventDefault();
        const instructorData = {
            name: document.getElementById('inst_name').value,
            specialty: document.getElementById('inst_specialty').value,
            phone: document.getElementById('inst_phone').value,
            email: document.getElementById('inst_email').value,
            is_active: document.getElementById('inst_is_active').checked,
            facility_id: this.currentFacilityId || FACILITY_IDS.FITNESS
        };
        try {
            if (isEdit) {
                const { error } = await this.sb.from('instructors').update(instructorData).eq('id', instructorId);
                if (error) throw error;
                this.showNotification('강사 정보가 수정되었습니다.');
            } else {
                const { error } = await this.sb.from('instructors').insert([instructorData]);
                if (error) throw error;
                this.showNotification('강사가 등록되었습니다.');
            }
            this.closeModal();
            this.loadInstructors();
        } catch (err) {
            console.error('강사 저장 실패:', err);
            alert('오류: ' + err.message);
        }
    };
};

unifiedApp.editInstructor = function(instructorId) {
    this.openInstructorModal(instructorId);
};

unifiedApp.deleteInstructor = async function(instructorId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
        const { error } = await this.sb.from('instructors').delete().eq('id', instructorId);
        if (error) throw error;
        this.showNotification('강사가 삭제되었습니다.');
        this.loadInstructors();
    } catch (err) {
        alert('오류: ' + err.message);
    }
};

// 프로그램 관리
unifiedApp.loadPrograms = async function() {
    try {
        const { data, error } = await this.sb.from('programs').select('*').order('name');
        if (error) throw error;
        this.programs = data || [];
        this.renderPrograms();
    } catch (err) {
        console.error('프로그램 로드 실패:', err);
        this.programs = [];
        this.renderPrograms();
    }
};

unifiedApp.renderPrograms = function() {
    const tbody = document.getElementById('programTableBody');
    if (!tbody) return;
    if (this.programs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">등록된 프로그램이 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = this.programs.map(p => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">${p.name}</td>
            <td class="px-6 py-4">${p.instructor_name || '-'}</td>
            <td class="px-6 py-4">${p.schedule || '-'}</td>
            <td class="px-6 py-4">${p.max_participants || '-'}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">${p.is_active ? '운영중' : '종료'}</span></td>
            <td class="px-6 py-4 space-x-2">
                <button onclick="unifiedApp.editProgram('${p.id}')" class="text-green-600"><i class="fas fa-edit"></i></button>
                <button onclick="unifiedApp.deleteProgram('${p.id}')" class="text-red-600"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
};

unifiedApp.openProgramModal = function(programId = null) {
    const isEdit = !!programId;
    const program = isEdit ? this.programs.find(p => p.id === programId) : null;
    const formHtml = `
        <form id="programForm" class="space-y-4">
            <div><label class="block text-sm font-medium text-gray-700 mb-2">프로그램명 *</label>
                <input type="text" id="prog_name" value="${program?.name || ''}" required class="w-full px-4 py-2 border rounded-lg"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">담당 강사</label>
                <input type="text" id="prog_instructor" value="${program?.instructor_name || ''}" class="w-full px-4 py-2 border rounded-lg"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">스케줄</label>
                <input type="text" id="prog_schedule" value="${program?.schedule || ''}" placeholder="예: 월수금 19:00-20:00" class="w-full px-4 py-2 border rounded-lg"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">정원</label>
                <input type="number" id="prog_max_participants" value="${program?.max_participants || ''}" min="1" class="w-full px-4 py-2 border rounded-lg"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">설명</label>
                <textarea id="prog_description" rows="3" class="w-full px-4 py-2 border rounded-lg">${program?.description || ''}</textarea></div>
            <div class="flex items-center">
                <input type="checkbox" id="prog_is_active" ${program?.is_active !== false ? 'checked' : ''} class="w-4 h-4">
                <label for="prog_is_active" class="ml-2 text-sm">운영중</label>
            </div>
            <div class="flex space-x-3 pt-4">
                <button type="submit" class="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700"><i class="fas fa-save mr-2"></i>${isEdit ? '수정' : '등록'}</button>
                <button type="button" onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>취소</button>
            </div>
        </form>
    `;
    this.showModal(isEdit ? '프로그램 수정' : '프로그램 추가', formHtml);
    document.getElementById('programForm').onsubmit = async (e) => {
        e.preventDefault();
        const programData = {
            name: document.getElementById('prog_name').value,
            instructor_name: document.getElementById('prog_instructor').value,
            schedule: document.getElementById('prog_schedule').value,
            max_participants: parseInt(document.getElementById('prog_max_participants').value) || null,
            description: document.getElementById('prog_description').value,
            is_active: document.getElementById('prog_is_active').checked,
            facility_id: this.currentFacilityId || FACILITY_IDS.FITNESS
        };
        try {
            if (isEdit) {
                const { error } = await this.sb.from('programs').update(programData).eq('id', programId);
                if (error) throw error;
                this.showNotification('프로그램이 수정되었습니다.');
            } else {
                const { error } = await this.sb.from('programs').insert([programData]);
                if (error) throw error;
                this.showNotification('프로그램이 등록되었습니다.');
            }
            this.closeModal();
            this.loadPrograms();
        } catch (err) {
            console.error('프로그램 저장 실패:', err);
            alert('오류: ' + err.message);
        }
    };
};

unifiedApp.editProgram = function(programId) {
    this.openProgramModal(programId);
};

unifiedApp.deleteProgram = async function(programId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
        const { error } = await this.sb.from('programs').delete().eq('id', programId);
        if (error) throw error;
        this.showNotification('프로그램이 삭제되었습니다.');
        this.loadPrograms();
    } catch (err) {
        alert('오류: ' + err.message);
    }
};

// 문의/공지 관리
unifiedApp.loadInquiries = async function() {
    try {
        const { data, error } = await this.sb.from('inquiries').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        this.inquiries = data || [];
        this.renderInquiries();
    } catch (err) {
        console.error('문의 로드 실패:', err);
        this.inquiries = [];
        this.renderInquiries();
    }
};

unifiedApp.renderInquiries = function() {
    const tbody = document.getElementById('inquiryTableBody');
    if (!tbody) return;
    if (this.inquiries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">문의가 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = this.inquiries.map(i => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">${i.title}</td>
            <td class="px-6 py-4">${i.author || '-'}</td>
            <td class="px-6 py-4">${i.category || '-'}</td>
            <td class="px-6 py-4">${this.formatDate(i.created_at)}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full status-${i.status}">${this.getStatusText(i.status)}</span></td>
            <td class="px-6 py-4">
                <button onclick="unifiedApp.viewInquiry('${i.id}')" class="text-blue-600"><i class="fas fa-eye"></i></button>
            </td>
        </tr>
    `).join('');
};

unifiedApp.viewInquiry = function(inquiryId) {
    const inquiry = this.inquiries.find(i => i.id === inquiryId);
    if (!inquiry) return;
    const detailHtml = `
        <div class="space-y-4">
            <div><p class="text-sm text-gray-500">제목</p><p class="font-medium">${inquiry.title}</p></div>
            <div><p class="text-sm text-gray-500">작성자</p><p>${inquiry.author || '-'}</p></div>
            <div><p class="text-sm text-gray-500">카테고리</p><p>${inquiry.category || '-'}</p></div>
            <div><p class="text-sm text-gray-500">내용</p><p class="mt-2 p-4 bg-gray-50 rounded">${inquiry.content || '-'}</p></div>
            <div><p class="text-sm text-gray-500">상태</p><span class="px-2 py-1 text-xs rounded-full status-${inquiry.status}">${this.getStatusText(inquiry.status)}</span></div>
            <div class="flex space-x-3 pt-4">
                <button onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>닫기</button>
            </div>
        </div>
    `;
    this.showModal('문의 상세', detailHtml);
};

unifiedApp.loadNotices = async function() {
    try {
        const { data, error } = await this.sb.from('notices').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        this.notices = data || [];
        this.renderNotices();
    } catch (err) {
        console.error('공지 로드 실패:', err);
        this.notices = [];
        this.renderNotices();
    }
};

unifiedApp.renderNotices = function() {
    const tbody = document.getElementById('noticeTableBody');
    if (!tbody) return;
    if (this.notices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">공지사항이 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = this.notices.map(n => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">${n.title}</td>
            <td class="px-6 py-4">${n.author || '-'}</td>
            <td class="px-6 py-4">${this.formatDate(n.created_at)}</td>
            <td class="px-6 py-4">${n.is_important ? '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">중요</span>' : '-'}</td>
            <td class="px-6 py-4 space-x-2">
                <button onclick="unifiedApp.viewNotice('${n.id}')" class="text-blue-600"><i class="fas fa-eye"></i></button>
                <button onclick="unifiedApp.editNotice('${n.id}')" class="text-green-600"><i class="fas fa-edit"></i></button>
                <button onclick="unifiedApp.deleteNotice('${n.id}')" class="text-red-600"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
};

unifiedApp.openNoticeModal = function(noticeId = null) {
    const isEdit = !!noticeId;
    const notice = isEdit ? this.notices.find(n => n.id === noticeId) : null;
    const formHtml = `
        <form id="noticeForm" class="space-y-4">
            <div><label class="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
                <input type="text" id="notice_title" value="${notice?.title || ''}" required class="w-full px-4 py-2 border rounded-lg"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">내용 *</label>
                <textarea id="notice_content" rows="5" required class="w-full px-4 py-2 border rounded-lg">${notice?.content || ''}</textarea></div>
            <div class="flex items-center">
                <input type="checkbox" id="notice_important" ${notice?.is_important ? 'checked' : ''} class="w-4 h-4">
                <label for="notice_important" class="ml-2 text-sm">중요 공지</label>
            </div>
            <div class="flex space-x-3 pt-4">
                <button type="submit" class="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700"><i class="fas fa-save mr-2"></i>${isEdit ? '수정' : '등록'}</button>
                <button type="button" onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>취소</button>
            </div>
        </form>
    `;
    this.showModal(isEdit ? '공지 수정' : '공지 작성', formHtml);
    document.getElementById('noticeForm').onsubmit = async (e) => {
        e.preventDefault();
        const noticeData = {
            title: document.getElementById('notice_title').value,
            content: document.getElementById('notice_content').value,
            is_important: document.getElementById('notice_important').checked,
            author: 'admin',
            facility_id: this.currentFacilityId || FACILITY_IDS.APARTMENT
        };
        try {
            if (isEdit) {
                const { error } = await this.sb.from('notices').update(noticeData).eq('id', noticeId);
                if (error) throw error;
                this.showNotification('공지가 수정되었습니다.');
            } else {
                const { error } = await this.sb.from('notices').insert([noticeData]);
                if (error) throw error;
                this.showNotification('공지가 등록되었습니다.');
            }
            this.closeModal();
            this.loadNotices();
        } catch (err) {
            console.error('공지 저장 실패:', err);
            alert('오류: ' + err.message);
        }
    };
};

unifiedApp.viewNotice = function(noticeId) {
    const notice = this.notices.find(n => n.id === noticeId);
    if (!notice) return;
    const detailHtml = `
        <div class="space-y-4">
            <div><p class="text-sm text-gray-500">제목</p><p class="font-medium text-lg">${notice.title}</p></div>
            <div><p class="text-sm text-gray-500">작성자</p><p>${notice.author || '-'}</p></div>
            <div><p class="text-sm text-gray-500">작성일</p><p>${this.formatDate(notice.created_at)}</p></div>
            ${notice.is_important ? '<div><span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">중요 공지</span></div>' : ''}
            <div><p class="text-sm text-gray-500 mb-2">내용</p><p class="p-4 bg-gray-50 rounded whitespace-pre-wrap">${notice.content || '-'}</p></div>
            <div class="flex space-x-3 pt-4">
                <button onclick="unifiedApp.editNotice('${notice.id}')" class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"><i class="fas fa-edit mr-2"></i>수정</button>
                <button onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>닫기</button>
            </div>
        </div>
    `;
    this.showModal('공지사항 상세', detailHtml);
};

unifiedApp.editNotice = function(noticeId) {
    this.closeModal();
    setTimeout(() => this.openNoticeModal(noticeId), 100);
};

unifiedApp.deleteNotice = async function(noticeId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
        const { error } = await this.sb.from('notices').delete().eq('id', noticeId);
        if (error) throw error;
        this.showNotification('공지가 삭제되었습니다.');
        this.loadNotices();
    } catch (err) {
        alert('오류: ' + err.message);
    }
};

// 출석 관리
unifiedApp.loadAttendance = function() {
    this.switchAttendanceTab('employee');
};

unifiedApp.switchAttendanceTab = function(type) {
    document.getElementById('tab-employee').classList.remove('tab-active');
    document.getElementById('tab-employee').classList.add('tab-inactive');
    document.getElementById('tab-member').classList.remove('tab-active');
    document.getElementById('tab-member').classList.add('tab-inactive');
    
    if (type === 'employee') {
        document.getElementById('tab-employee').classList.add('tab-active');
        document.getElementById('tab-employee').classList.remove('tab-inactive');
        document.getElementById('attendance-content').innerHTML = '<p class="text-gray-600">직원 출퇴근 기록 조회 기능</p>';
    } else {
        document.getElementById('tab-member').classList.add('tab-active');
        document.getElementById('tab-member').classList.remove('tab-inactive');
        document.getElementById('attendance-content').innerHTML = '<p class="text-gray-600">회원 출석 기록 조회 기능</p>';
    }
};

// QR 스캔
unifiedApp.processQRCode = function() {
    const qrCode = document.getElementById('qrCodeInput').value;
    if (!qrCode) {
        alert('QR 코드를 입력하세요');
        return;
    }
    const resultDiv = document.getElementById('qrResult');
    resultDiv.innerHTML = `
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-green-800 font-semibold"><i class="fas fa-check-circle mr-2"></i>체크인 완료</p>
            <p class="text-sm text-green-600 mt-1">QR: ${qrCode}</p>
        </div>
    `;
    resultDiv.classList.remove('hidden');
    document.getElementById('qrCodeInput').value = '';
};
// 신규 기능 모듈: 구역, 작업 갤러리, 업무 일지, 서류, 정산서, 급여명세서

// ========== 구역 관리 ==========
unifiedApp.loadAreas = async function() {
    try {
        const { data, error } = await this.sb.from('areas').select('*').order('name');
        if (error) throw error;
        this.areas = data || [];
        this.renderAreas();
    } catch (err) {
        console.error('구역 로드 실패:', err);
        this.areas = [];
        this.renderAreas();
    }
};

unifiedApp.renderAreas = function() {
    const tbody = document.getElementById('areaTableBody');
    if (!tbody) return;
    if (this.areas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">등록된 구역이 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = this.areas.map(a => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium">${a.name}</td>
            <td class="px-6 py-4">${a.description || '-'}</td>
            <td class="px-6 py-4"><code class="text-xs bg-gray-100 px-2 py-1 rounded">${a.qr_code}</code></td>
            <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full ${a.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">${a.is_active ? '사용중' : '비활성'}</span></td>
            <td class="px-6 py-4 space-x-2">
                <button onclick="unifiedApp.viewAreaQR('${a.id}')" class="text-blue-600"><i class="fas fa-qrcode"></i></button>
                <button onclick="unifiedApp.editArea('${a.id}')" class="text-green-600"><i class="fas fa-edit"></i></button>
                <button onclick="unifiedApp.deleteArea('${a.id}')" class="text-red-600"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
};

unifiedApp.openAreaModal = function(areaId = null) {
    const isEdit = !!areaId;
    const area = isEdit ? this.areas.find(a => a.id === areaId) : null;
    const formHtml = `
        <form id="areaForm" class="space-y-4">
            <div><label class="block text-sm font-medium text-gray-700 mb-2">구역명 *</label>
                <input type="text" id="area_name" value="${area?.name || ''}" required class="w-full px-4 py-2 border rounded-lg" placeholder="예: 1층 로비"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">설명</label>
                <textarea id="area_description" rows="3" class="w-full px-4 py-2 border rounded-lg" placeholder="구역 설명">${area?.description || ''}</textarea></div>
            ${isEdit ? '' : '<div class="bg-blue-50 p-4 rounded-lg"><p class="text-sm text-blue-800"><i class="fas fa-info-circle mr-2"></i>QR 코드는 자동으로 생성됩니다.</p></div>'}
            <div class="flex items-center">
                <input type="checkbox" id="area_is_active" ${area?.is_active !== false ? 'checked' : ''} class="w-4 h-4">
                <label for="area_is_active" class="ml-2 text-sm">사용중</label>
            </div>
            <div class="flex space-x-3 pt-4">
                <button type="submit" class="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"><i class="fas fa-save mr-2"></i>${isEdit ? '수정' : '등록'}</button>
                <button type="button" onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>취소</button>
            </div>
        </form>
    `;
    this.showModal(isEdit ? '구역 수정' : '구역 추가', formHtml);
    document.getElementById('areaForm').onsubmit = async (e) => {
        e.preventDefault();
        const areaData = {
            name: document.getElementById('area_name').value,
            description: document.getElementById('area_description').value,
            is_active: document.getElementById('area_is_active').checked,
            facility_id: this.currentFacilityId || FACILITY_IDS.APARTMENT
        };
        if (!isEdit) {
            areaData.qr_code = 'AREA-' + this.generateQRCode();
        }
        try {
            if (isEdit) {
                const { error } = await this.sb.from('areas').update(areaData).eq('id', areaId);
                if (error) throw error;
                this.showNotification('구역이 수정되었습니다.');
            } else {
                const { error } = await this.sb.from('areas').insert([areaData]);
                if (error) throw error;
                this.showNotification('구역이 등록되었습니다.');
            }
            this.closeModal();
            this.loadAreas();
        } catch (err) {
            console.error('구역 저장 실패:', err);
            alert('오류: ' + err.message);
        }
    };
};

unifiedApp.viewAreaQR = function(areaId) {
    const area = this.areas.find(a => a.id === areaId);
    if (!area) return;
    const qrHtml = `
        <div class="text-center space-y-4">
            <div class="text-6xl"><i class="fas fa-qrcode text-purple-600"></i></div>
            <h3 class="text-xl font-bold">${area.name}</h3>
            <div class="bg-gray-50 p-6 rounded-lg">
                <code class="text-lg font-mono">${area.qr_code}</code>
            </div>
            <button onclick="navigator.clipboard.writeText('${area.qr_code}')" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <i class="fas fa-copy mr-2"></i>QR 코드 복사
            </button>
            <p class="text-sm text-gray-500">이 QR 코드를 스캔하여 체크인하세요</p>
        </div>
    `;
    this.showModal('구역 QR 코드', qrHtml);
};

unifiedApp.editArea = function(areaId) {
    this.openAreaModal(areaId);
};

unifiedApp.deleteArea = async function(areaId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
        const { error } = await this.sb.from('areas').delete().eq('id', areaId);
        if (error) throw error;
        this.showNotification('구역이 삭제되었습니다.');
        this.loadAreas();
    } catch (err) {
        alert('오류: ' + err.message);
    }
};

// ========== 작업 갤러리 ==========
unifiedApp.loadWorkGallery = async function() {
    try {
        const { data, error } = await this.sb.from('work_gallery').select('*').order('work_date', { ascending: false });
        if (error) throw error;
        this.workGallery = data || [];
        this.renderWorkGallery();
    } catch (err) {
        console.error('갤러리 로드 실패:', err);
        this.workGallery = [];
        this.renderWorkGallery();
    }
};

unifiedApp.renderWorkGallery = function() {
    const container = document.getElementById('workGalleryContainer');
    if (!container) return;
    if (this.workGallery.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">등록된 작업 사진이 없습니다.</div>';
        return;
    }
    container.innerHTML = this.workGallery.map(w => `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div class="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <i class="fas fa-image text-6xl text-gray-400"></i>
            </div>
            <div class="p-4">
                <h4 class="font-medium mb-1">${w.area_name || '작업구역'}</h4>
                <p class="text-sm text-gray-600 mb-2">${this.formatDate(w.work_date)}</p>
                <p class="text-xs text-gray-500">${w.notes || ''}</p>
                <button onclick="unifiedApp.viewWorkPhoto('${w.id}')" class="mt-3 text-sm text-blue-600 hover:text-blue-800">
                    <i class="fas fa-eye mr-1"></i>상세보기
                </button>
            </div>
        </div>
    `).join('');
};

unifiedApp.openWorkGalleryModal = function() {
    const formHtml = `
        <form id="workGalleryForm" class="space-y-4">
            <div><label class="block text-sm font-medium text-gray-700 mb-2">작업 구역 *</label>
                <input type="text" id="wg_area_name" required class="w-full px-4 py-2 border rounded-lg" placeholder="예: 1층 로비"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">작업 날짜 *</label>
                <input type="date" id="wg_work_date" value="${new Date().toISOString().split('T')[0]}" required class="w-full px-4 py-2 border rounded-lg"></div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">작업 사진 업로드</label>
                <input type="file" id="wg_photo_file" accept="image/*" class="w-full px-4 py-2 border rounded-lg" onchange="FileUploadManager.previewImage(this, 'wg_photo_preview')">
                <div id="wg_photo_preview" class="mt-2"></div>
            </div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">메모</label>
                <textarea id="wg_notes" rows="3" class="w-full px-4 py-2 border rounded-lg" placeholder="작업 내용"></textarea></div>
            <div class="flex space-x-3 pt-4">
                <button type="submit" class="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700"><i class="fas fa-save mr-2"></i>등록</button>
                <button type="button" onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>취소</button>
            </div>
        </form>
    `;
    this.showModal('작업 사진 등록', formHtml);
    document.getElementById('workGalleryForm').onsubmit = async (e) => {
        e.preventDefault();
        
        let photoUrl = '';
        const fileInput = document.getElementById('wg_photo_file');
        
        // 파일이 선택된 경우 업로드
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const uploadResult = await FileUploadManager.uploadFile(
                file, 
                FileUploadManager.BUCKETS.WORK_PHOTOS, 
                'apartment'
            );
            if (uploadResult) {
                photoUrl = uploadResult.url;
            }
        }
        
        const workData = {
            area_name: document.getElementById('wg_area_name').value,
            work_date: document.getElementById('wg_work_date').value,
            photo_url: photoUrl,
            notes: document.getElementById('wg_notes').value,
            facility_id: this.currentFacilityId || FACILITY_IDS.APARTMENT
        };
        try {
            const { error } = await this.sb.from('work_gallery').insert([workData]);
            if (error) throw error;
            this.showNotification('작업 사진이 등록되었습니다.');
            this.closeModal();
            this.loadWorkGallery();
        } catch (err) {
            console.error('갤러리 저장 실패:', err);
            alert('오류: ' + err.message);
        }
    };
};

unifiedApp.viewWorkPhoto = function(workId) {
    const work = this.workGallery.find(w => w.id === workId);
    if (!work) return;
    const detailHtml = `
        <div class="space-y-4">
            <div class="h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                ${work.photo_url ? 
                    `<img src="${work.photo_url}" alt="작업사진" class="w-full h-full object-cover">` : 
                    `<i class="fas fa-image text-8xl text-gray-400"></i>`
                }
            </div>
            <div><p class="text-sm text-gray-500">작업 구역</p><p class="font-medium">${work.area_name}</p></div>
            <div><p class="text-sm text-gray-500">작업 날짜</p><p>${this.formatDate(work.work_date)}</p></div>
            ${work.notes ? `<div><p class="text-sm text-gray-500">메모</p><p class="mt-2 p-4 bg-gray-50 rounded">${work.notes}</p></div>` : ''}
            <div class="flex space-x-3 pt-4">
                <button onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>닫기</button>
            </div>
        </div>
    `;
    this.showModal('작업 사진 상세', detailHtml);
};

// ========== 업무 일지 ==========
unifiedApp.loadWorkLogs = async function() {
    try {
        const { data, error } = await this.sb.from('work_logs').select('*').order('log_date', { ascending: false });
        if (error) throw error;
        this.workLogs = data || [];
        this.renderWorkLogs();
    } catch (err) {
        console.error('일지 로드 실패:', err);
        this.workLogs = [];
        this.renderWorkLogs();
    }
};

unifiedApp.renderWorkLogs = function() {
    const tbody = document.getElementById('workLogTableBody');
    if (!tbody) return;
    if (this.workLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">등록된 업무 일지가 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = this.workLogs.map(l => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">${this.formatDate(l.log_date)}</td>
            <td class="px-6 py-4">${l.worker_name || '-'}</td>
            <td class="px-6 py-4">${l.work_type || '-'}</td>
            <td class="px-6 py-4 max-w-xs truncate">${l.description || '-'}</td>
            <td class="px-6 py-4 space-x-2">
                <button onclick="unifiedApp.viewWorkLog('${l.id}')" class="text-blue-600"><i class="fas fa-eye"></i></button>
                <button onclick="unifiedApp.editWorkLog('${l.id}')" class="text-green-600"><i class="fas fa-edit"></i></button>
                <button onclick="unifiedApp.deleteWorkLog('${l.id}')" class="text-red-600"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
};

unifiedApp.openWorkLogModal = function(logId = null) {
    const isEdit = !!logId;
    const log = isEdit ? this.workLogs.find(l => l.id === logId) : null;
    const formHtml = `
        <form id="workLogForm" class="space-y-4">
            <div><label class="block text-sm font-medium text-gray-700 mb-2">작업 날짜 *</label>
                <input type="date" id="wl_date" value="${log?.log_date || new Date().toISOString().split('T')[0]}" required class="w-full px-4 py-2 border rounded-lg"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">작업자 *</label>
                <input type="text" id="wl_worker" value="${log?.worker_name || ''}" required class="w-full px-4 py-2 border rounded-lg"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">작업 유형 *</label>
                <select id="wl_type" required class="w-full px-4 py-2 border rounded-lg">
                    <option value="">선택</option>
                    <option value="청소" ${log?.work_type === '청소' ? 'selected' : ''}>청소</option>
                    <option value="점검" ${log?.work_type === '점검' ? 'selected' : ''}>점검</option>
                    <option value="수리" ${log?.work_type === '수리' ? 'selected' : ''}>수리</option>
                    <option value="기타" ${log?.work_type === '기타' ? 'selected' : ''}>기타</option>
                </select></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">작업 내용 *</label>
                <textarea id="wl_description" rows="4" required class="w-full px-4 py-2 border rounded-lg" placeholder="상세 작업 내용">${log?.description || ''}</textarea></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">특이사항</label>
                <textarea id="wl_notes" rows="2" class="w-full px-4 py-2 border rounded-lg" placeholder="특이사항">${log?.special_notes || ''}</textarea></div>
            <div class="flex space-x-3 pt-4">
                <button type="submit" class="flex-1 bg-cyan-600 text-white py-2 px-4 rounded-lg hover:bg-cyan-700"><i class="fas fa-save mr-2"></i>${isEdit ? '수정' : '등록'}</button>
                <button type="button" onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>취소</button>
            </div>
        </form>
    `;
    this.showModal(isEdit ? '업무 일지 수정' : '업무 일지 등록', formHtml);
    document.getElementById('workLogForm').onsubmit = async (e) => {
        e.preventDefault();
        const logData = {
            log_date: document.getElementById('wl_date').value,
            worker_name: document.getElementById('wl_worker').value,
            work_type: document.getElementById('wl_type').value,
            description: document.getElementById('wl_description').value,
            special_notes: document.getElementById('wl_notes').value,
            facility_id: this.currentFacilityId || FACILITY_IDS.APARTMENT
        };
        try {
            if (isEdit) {
                const { error } = await this.sb.from('work_logs').update(logData).eq('id', logId);
                if (error) throw error;
                this.showNotification('업무 일지가 수정되었습니다.');
            } else {
                const { error } = await this.sb.from('work_logs').insert([logData]);
                if (error) throw error;
                this.showNotification('업무 일지가 등록되었습니다.');
            }
            this.closeModal();
            this.loadWorkLogs();
        } catch (err) {
            console.error('일지 저장 실패:', err);
            alert('오류: ' + err.message);
        }
    };
};

unifiedApp.viewWorkLog = function(logId) {
    const log = this.workLogs.find(l => l.id === logId);
    if (!log) return;
    const detailHtml = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div><p class="text-sm text-gray-500">날짜</p><p class="font-medium">${this.formatDate(log.log_date)}</p></div>
                <div><p class="text-sm text-gray-500">작업자</p><p class="font-medium">${log.worker_name}</p></div>
                <div class="col-span-2"><p class="text-sm text-gray-500">작업 유형</p><p class="font-medium">${log.work_type}</p></div>
            </div>
            <div><p class="text-sm text-gray-500 mb-2">작업 내용</p><p class="p-4 bg-gray-50 rounded whitespace-pre-wrap">${log.description}</p></div>
            ${log.special_notes ? `<div><p class="text-sm text-gray-500 mb-2">특이사항</p><p class="p-4 bg-yellow-50 rounded whitespace-pre-wrap">${log.special_notes}</p></div>` : ''}
            <div class="flex space-x-3 pt-4">
                <button onclick="unifiedApp.editWorkLog('${log.id}')" class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"><i class="fas fa-edit mr-2"></i>수정</button>
                <button onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>닫기</button>
            </div>
        </div>
    `;
    this.showModal('업무 일지 상세', detailHtml);
};

unifiedApp.editWorkLog = function(logId) {
    this.closeModal();
    setTimeout(() => this.openWorkLogModal(logId), 100);
};

unifiedApp.deleteWorkLog = async function(logId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
        const { error } = await this.sb.from('work_logs').delete().eq('id', logId);
        if (error) throw error;
        this.showNotification('업무 일지가 삭제되었습니다.');
        this.loadWorkLogs();
    } catch (err) {
        alert('오류: ' + err.message);
    }
};

// ========== 서류 관리 ==========
unifiedApp.loadDocuments = async function() {
    try {
        const { data, error } = await this.sb.from('documents').select('*').order('uploaded_at', { ascending: false });
        if (error) throw error;
        this.documents = data || [];
        this.renderDocuments();
    } catch (err) {
        console.error('서류 로드 실패:', err);
        this.documents = [];
        this.renderDocuments();
    }
};

unifiedApp.renderDocuments = function() {
    const tbody = document.getElementById('documentTableBody');
    if (!tbody) return;
    if (this.documents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">등록된 서류가 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = this.documents.map(d => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4"><i class="fas fa-file-${this.getFileIcon(d.file_type)} mr-2 text-gray-400"></i>${d.title}</td>
            <td class="px-6 py-4">${d.category || '-'}</td>
            <td class="px-6 py-4">${this.formatDate(d.uploaded_at)}</td>
            <td class="px-6 py-4">${d.uploader || '-'}</td>
            <td class="px-6 py-4">${d.file_size ? (d.file_size / 1024).toFixed(1) + ' KB' : '-'}</td>
            <td class="px-6 py-4 space-x-2">
                <button onclick="unifiedApp.viewDocument('${d.id}')" class="text-blue-600"><i class="fas fa-eye"></i></button>
                <button onclick="unifiedApp.downloadDocument('${d.id}')" class="text-green-600"><i class="fas fa-download"></i></button>
                <button onclick="unifiedApp.deleteDocument('${d.id}')" class="text-red-600"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
};

unifiedApp.getFileIcon = function(fileType) {
    const icons = {
        'pdf': 'pdf',
        'doc': 'word',
        'docx': 'word',
        'xls': 'excel',
        'xlsx': 'excel',
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'zip': 'archive'
    };
    return icons[fileType] || 'alt';
};

unifiedApp.openDocumentModal = function() {
    const formHtml = `
        <form id="documentForm" class="space-y-4">
            <div><label class="block text-sm font-medium text-gray-700 mb-2">서류 제목 *</label>
                <input type="text" id="doc_title" required class="w-full px-4 py-2 border rounded-lg" placeholder="예: 계약서"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">카테고리 *</label>
                <select id="doc_category" required class="w-full px-4 py-2 border rounded-lg">
                    <option value="">선택</option>
                    <option value="계약서">계약서</option>
                    <option value="견적서">견적서</option>
                    <option value="청구서">청구서</option>
                    <option value="보고서">보고서</option>
                    <option value="기타">기타</option>
                </select></div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">파일 업로드</label>
                <input type="file" id="doc_file_upload" class="w-full px-4 py-2 border rounded-lg" onchange="FileUploadManager.handleFileSelect(this, 'doc_file_info')">
                <div id="doc_file_info" class="mt-2 text-sm text-gray-600"></div>
            </div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">메모</label>
                <textarea id="doc_notes" rows="3" class="w-full px-4 py-2 border rounded-lg" placeholder="서류 관련 메모"></textarea></div>
            <div class="flex space-x-3 pt-4">
                <button type="submit" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"><i class="fas fa-save mr-2"></i>등록</button>
                <button type="button" onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>취소</button>
            </div>
        </form>
    `;
    this.showModal('서류 등록', formHtml);
    document.getElementById('documentForm').onsubmit = async (e) => {
        e.preventDefault();
        
        let fileUrl = '';
        let fileType = 'pdf';
        let fileSize = 0;
        
        const fileInput = document.getElementById('doc_file_upload');
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const uploadResult = await FileUploadManager.uploadFile(
                file, 
                FileUploadManager.BUCKETS.DOCUMENTS, 
                'apartment'
            );
            if (uploadResult) {
                fileUrl = uploadResult.url;
                fileType = uploadResult.type;
                fileSize = uploadResult.size;
            }
        }
        
        const docData = {
            title: document.getElementById('doc_title').value,
            category: document.getElementById('doc_category').value,
            file_url: fileUrl,
            notes: document.getElementById('doc_notes').value,
            uploader: 'admin',
            file_type: fileType,
            file_size: fileSize,
            facility_id: this.currentFacilityId || FACILITY_IDS.APARTMENT
        };
        try {
            const { error } = await this.sb.from('documents').insert([docData]);
            if (error) throw error;
            this.showNotification('서류가 등록되었습니다.');
            this.closeModal();
            this.loadDocuments();
        } catch (err) {
            console.error('서류 저장 실패:', err);
            alert('오류: ' + err.message);
        }
    };
};

unifiedApp.viewDocument = function(docId) {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return;
    const detailHtml = `
        <div class="space-y-4">
            <div class="text-center text-6xl text-blue-600 mb-4"><i class="fas fa-file-${this.getFileIcon(doc.file_type)}"></i></div>
            <div><p class="text-sm text-gray-500">제목</p><p class="font-medium text-lg">${doc.title}</p></div>
            <div class="grid grid-cols-2 gap-4">
                <div><p class="text-sm text-gray-500">카테고리</p><p>${doc.category}</p></div>
                <div><p class="text-sm text-gray-500">업로드 날짜</p><p>${this.formatDate(doc.uploaded_at)}</p></div>
                <div><p class="text-sm text-gray-500">업로더</p><p>${doc.uploader}</p></div>
                <div><p class="text-sm text-gray-500">파일 크기</p><p>${doc.file_size ? (doc.file_size / 1024).toFixed(1) + ' KB' : '-'}</p></div>
            </div>
            ${doc.notes ? `<div><p class="text-sm text-gray-500 mb-2">메모</p><p class="p-4 bg-gray-50 rounded">${doc.notes}</p></div>` : ''}
            <div class="flex space-x-3 pt-4">
                <button onclick="unifiedApp.downloadDocument('${doc.id}')" class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"><i class="fas fa-download mr-2"></i>다운로드</button>
                <button onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>닫기</button>
            </div>
        </div>
    `;
    this.showModal('서류 상세', detailHtml);
};

unifiedApp.downloadDocument = function(docId) {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return;
    this.showNotification('다운로드 기능은 실제 파일 URL이 필요합니다.');
};

unifiedApp.deleteDocument = async function(docId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
        const { error } = await this.sb.from('documents').delete().eq('id', docId);
        if (error) throw error;
        this.showNotification('서류가 삭제되었습니다.');
        this.loadDocuments();
    } catch (err) {
        alert('오류: ' + err.message);
    }
};

// ========== 정산서 관리 ==========
unifiedApp.loadSettlements = async function() {
    try {
        const { data, error } = await this.sb.from('settlements').select('*').order('month', { ascending: false });
        if (error) throw error;
        this.settlements = data || [];
        this.renderSettlements();
    } catch (err) {
        console.error('정산서 로드 실패:', err);
        this.settlements = [];
        this.renderSettlements();
    }
};

unifiedApp.renderSettlements = function() {
    const tbody = document.getElementById('settlementTableBody');
    if (!tbody) return;
    if (this.settlements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">등록된 정산서가 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = this.settlements.map(s => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">${s.month}</td>
            <td class="px-6 py-4">${s.category || '-'}</td>
            <td class="px-6 py-4 text-right font-medium">${(s.amount || 0).toLocaleString()}원</td>
            <td class="px-6 py-4">${s.description || '-'}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full ${s.is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${s.is_paid ? '지급완료' : '대기중'}</span></td>
            <td class="px-6 py-4 space-x-2">
                <button onclick="unifiedApp.viewSettlement('${s.id}')" class="text-blue-600"><i class="fas fa-eye"></i></button>
                <button onclick="unifiedApp.editSettlement('${s.id}')" class="text-green-600"><i class="fas fa-edit"></i></button>
                <button onclick="unifiedApp.deleteSettlement('${s.id}')" class="text-red-600"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
};

unifiedApp.openSettlementModal = function(settlementId = null) {
    const isEdit = !!settlementId;
    const settlement = isEdit ? this.settlements.find(s => s.id === settlementId) : null;
    const formHtml = `
        <form id="settlementForm" class="space-y-4">
            <div><label class="block text-sm font-medium text-gray-700 mb-2">정산 월 *</label>
                <input type="month" id="sett_month" value="${settlement?.month || ''}" required class="w-full px-4 py-2 border rounded-lg"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">항목 *</label>
                <select id="sett_category" required class="w-full px-4 py-2 border rounded-lg">
                    <option value="">선택</option>
                    <option value="급여" ${settlement?.category === '급여' ? 'selected' : ''}>급여</option>
                    <option value="관리비" ${settlement?.category === '관리비' ? 'selected' : ''}>관리비</option>
                    <option value="수리비" ${settlement?.category === '수리비' ? 'selected' : ''}>수리비</option>
                    <option value="기타" ${settlement?.category === '기타' ? 'selected' : ''}>기타</option>
                </select></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">금액 *</label>
                <input type="number" id="sett_amount" value="${settlement?.amount || ''}" required min="0" class="w-full px-4 py-2 border rounded-lg" placeholder="원"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">설명</label>
                <textarea id="sett_description" rows="3" class="w-full px-4 py-2 border rounded-lg" placeholder="상세 내역">${settlement?.description || ''}</textarea></div>
            <div class="flex items-center">
                <input type="checkbox" id="sett_is_paid" ${settlement?.is_paid ? 'checked' : ''} class="w-4 h-4">
                <label for="sett_is_paid" class="ml-2 text-sm">지급 완료</label>
            </div>
            <div class="flex space-x-3 pt-4">
                <button type="submit" class="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700"><i class="fas fa-save mr-2"></i>${isEdit ? '수정' : '등록'}</button>
                <button type="button" onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>취소</button>
            </div>
        </form>
    `;
    this.showModal(isEdit ? '정산서 수정' : '정산서 등록', formHtml);
    document.getElementById('settlementForm').onsubmit = async (e) => {
        e.preventDefault();
        const settlementData = {
            month: document.getElementById('sett_month').value,
            category: document.getElementById('sett_category').value,
            amount: parseFloat(document.getElementById('sett_amount').value),
            description: document.getElementById('sett_description').value,
            is_paid: document.getElementById('sett_is_paid').checked,
            facility_id: this.currentFacilityId || FACILITY_IDS.APARTMENT
        };
        try {
            if (isEdit) {
                const { error } = await this.sb.from('settlements').update(settlementData).eq('id', settlementId);
                if (error) throw error;
                this.showNotification('정산서가 수정되었습니다.');
            } else {
                const { error } = await this.sb.from('settlements').insert([settlementData]);
                if (error) throw error;
                this.showNotification('정산서가 등록되었습니다.');
            }
            this.closeModal();
            this.loadSettlements();
        } catch (err) {
            console.error('정산서 저장 실패:', err);
            alert('오류: ' + err.message);
        }
    };
};

unifiedApp.viewSettlement = function(settlementId) {
    const settlement = this.settlements.find(s => s.id === settlementId);
    if (!settlement) return;
    const detailHtml = `
        <div class="space-y-4">
            <div class="text-center">
                <h3 class="text-2xl font-bold text-gray-800">${settlement.month} 정산서</h3>
                <p class="text-4xl font-bold text-emerald-600 mt-4">${(settlement.amount || 0).toLocaleString()}원</p>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-6">
                <div><p class="text-sm text-gray-500">항목</p><p class="font-medium">${settlement.category}</p></div>
                <div><p class="text-sm text-gray-500">상태</p><span class="px-2 py-1 text-xs rounded-full ${settlement.is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${settlement.is_paid ? '지급완료' : '대기중'}</span></div>
            </div>
            ${settlement.description ? `<div><p class="text-sm text-gray-500 mb-2">상세 내역</p><p class="p-4 bg-gray-50 rounded whitespace-pre-wrap">${settlement.description}</p></div>` : ''}
            <div class="flex space-x-3 pt-4">
                <button onclick="unifiedApp.downloadSettlementPDF('${settlement.id}')" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"><i class="fas fa-download mr-2"></i>PDF 다운로드</button>
                <button onclick="unifiedApp.editSettlement('${settlement.id}')" class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"><i class="fas fa-edit mr-2"></i>수정</button>
                <button onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>닫기</button>
            </div>
        </div>
    `;
    this.showModal('정산서 상세', detailHtml);
};

unifiedApp.editSettlement = function(settlementId) {
    this.closeModal();
    setTimeout(() => this.openSettlementModal(settlementId), 100);
};

unifiedApp.downloadSettlementPDF = async function(settlementId) {
    const settlement = this.settlements.find(s => s.id === settlementId);
    if (!settlement) {
        alert('정산서를 찾을 수 없습니다.');
        return;
    }
    await PDFGenerator.generateSettlementPDF(settlement);
};

unifiedApp.deleteSettlement = async function(settlementId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
        const { error } = await this.sb.from('settlements').delete().eq('id', settlementId);
        if (error) throw error;
        this.showNotification('정산서가 삭제되었습니다.');
        this.loadSettlements();
    } catch (err) {
        alert('오류: ' + err.message);
    }
};

// ========== 급여명세서 관리 ==========
unifiedApp.loadPayslips = async function() {
    try {
        const { data, error } = await this.sb.from('payslips').select('*').order('pay_month', { ascending: false });
        if (error) throw error;
        this.payslips = data || [];
        this.renderPayslips();
    } catch (err) {
        console.error('급여명세서 로드 실패:', err);
        this.payslips = [];
        this.renderPayslips();
    }
};

unifiedApp.renderPayslips = function() {
    const tbody = document.getElementById('payslipTableBody');
    if (!tbody) return;
    if (this.payslips.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">등록된 급여명세서가 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = this.payslips.map(p => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">${p.pay_month}</td>
            <td class="px-6 py-4">${p.employee_name || '-'}</td>
            <td class="px-6 py-4 text-right font-medium">${(p.base_salary || 0).toLocaleString()}원</td>
            <td class="px-6 py-4 text-right font-medium text-emerald-600">${(p.net_salary || 0).toLocaleString()}원</td>
            <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full ${p.is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${p.is_paid ? '지급완료' : '대기중'}</span></td>
            <td class="px-6 py-4 space-x-2">
                <button onclick="unifiedApp.viewPayslip('${p.id}')" class="text-blue-600"><i class="fas fa-eye"></i></button>
                <button onclick="unifiedApp.downloadPayslipPDF('${p.id}')" class="text-green-600"><i class="fas fa-download"></i></button>
                <button onclick="unifiedApp.deletePayslip('${p.id}')" class="text-red-600"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
};

unifiedApp.openPayslipModal = function(payslipId = null) {
    const isEdit = !!payslipId;
    const payslip = isEdit ? this.payslips.find(p => p.id === payslipId) : null;
    const formHtml = `
        <form id="payslipForm" class="space-y-4">
            <div><label class="block text-sm font-medium text-gray-700 mb-2">지급 월 *</label>
                <input type="month" id="pay_month" value="${payslip?.pay_month || ''}" required class="w-full px-4 py-2 border rounded-lg"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-2">직원명 *</label>
                <input type="text" id="pay_employee_name" value="${payslip?.employee_name || ''}" required class="w-full px-4 py-2 border rounded-lg"></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium text-gray-700 mb-2">기본급 *</label>
                    <input type="number" id="pay_base_salary" value="${payslip?.base_salary || ''}" required min="0" class="w-full px-4 py-2 border rounded-lg"></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-2">수당</label>
                    <input type="number" id="pay_allowance" value="${payslip?.allowance || 0}" min="0" class="w-full px-4 py-2 border rounded-lg"></div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium text-gray-700 mb-2">공제액</label>
                    <input type="number" id="pay_deduction" value="${payslip?.deduction || 0}" min="0" class="w-full px-4 py-2 border rounded-lg"></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-2">실수령액 *</label>
                    <input type="number" id="pay_net_salary" value="${payslip?.net_salary || ''}" required min="0" class="w-full px-4 py-2 border rounded-lg"></div>
            </div>
            <div class="flex items-center">
                <input type="checkbox" id="pay_is_paid" ${payslip?.is_paid ? 'checked' : ''} class="w-4 h-4">
                <label for="pay_is_paid" class="ml-2 text-sm">지급 완료</label>
            </div>
            <div class="flex space-x-3 pt-4">
                <button type="submit" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"><i class="fas fa-save mr-2"></i>${isEdit ? '수정' : '등록'}</button>
                <button type="button" onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>취소</button>
            </div>
        </form>
    `;
    this.showModal(isEdit ? '급여명세서 수정' : '급여명세서 등록', formHtml);
    document.getElementById('payslipForm').onsubmit = async (e) => {
        e.preventDefault();
        const payslipData = {
            pay_month: document.getElementById('pay_month').value,
            employee_name: document.getElementById('pay_employee_name').value,
            base_salary: parseFloat(document.getElementById('pay_base_salary').value),
            allowance: parseFloat(document.getElementById('pay_allowance').value) || 0,
            deduction: parseFloat(document.getElementById('pay_deduction').value) || 0,
            net_salary: parseFloat(document.getElementById('pay_net_salary').value),
            is_paid: document.getElementById('pay_is_paid').checked,
            facility_id: this.currentFacilityId || FACILITY_IDS.APARTMENT
        };
        try {
            if (isEdit) {
                const { error } = await this.sb.from('payslips').update(payslipData).eq('id', payslipId);
                if (error) throw error;
                this.showNotification('급여명세서가 수정되었습니다.');
            } else {
                const { error } = await this.sb.from('payslips').insert([payslipData]);
                if (error) throw error;
                this.showNotification('급여명세서가 등록되었습니다.');
            }
            this.closeModal();
            this.loadPayslips();
        } catch (err) {
            console.error('급여명세서 저장 실패:', err);
            alert('오류: ' + err.message);
        }
    };
};

unifiedApp.viewPayslip = function(payslipId) {
    const payslip = this.payslips.find(p => p.id === payslipId);
    if (!payslip) return;
    const detailHtml = `
        <div class="space-y-4">
            <div class="text-center border-b pb-4">
                <h3 class="text-2xl font-bold text-gray-800">급여명세서</h3>
                <p class="text-lg text-gray-600 mt-2">${payslip.pay_month}</p>
            </div>
            <div><p class="text-sm text-gray-500">직원명</p><p class="font-medium text-lg">${payslip.employee_name}</p></div>
            <div class="grid grid-cols-2 gap-4 border-t border-b py-4">
                <div><p class="text-sm text-gray-500">기본급</p><p class="font-medium">${(payslip.base_salary || 0).toLocaleString()}원</p></div>
                <div><p class="text-sm text-gray-500">수당</p><p class="font-medium">${(payslip.allowance || 0).toLocaleString()}원</p></div>
                <div><p class="text-sm text-gray-500">공제액</p><p class="font-medium text-red-600">-${(payslip.deduction || 0).toLocaleString()}원</p></div>
                <div><p class="text-sm text-gray-500">실수령액</p><p class="text-2xl font-bold text-emerald-600">${(payslip.net_salary || 0).toLocaleString()}원</p></div>
            </div>
            <div><span class="px-3 py-1 text-sm rounded-full ${payslip.is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${payslip.is_paid ? '지급완료' : '대기중'}</span></div>
            <div class="flex space-x-3 pt-4">
                <button onclick="unifiedApp.downloadPayslipPDF('${payslip.id}')" class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"><i class="fas fa-download mr-2"></i>PDF 다운로드</button>
                <button onclick="unifiedApp.closeModal()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"><i class="fas fa-times mr-2"></i>닫기</button>
            </div>
        </div>
    `;
    this.showModal('급여명세서', detailHtml);
};

unifiedApp.downloadPayslipPDF = async function(payslipId) {
    const payslip = this.payslips.find(p => p.id === payslipId);
    if (!payslip) {
        alert('급여명세서를 찾을 수 없습니다.');
        return;
    }
    await PDFGenerator.generatePayslipPDF(payslip);
};

unifiedApp.deletePayslip = async function(payslipId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
        const { error } = await this.sb.from('payslips').delete().eq('id', payslipId);
        if (error) throw error;
        this.showNotification('급여명세서가 삭제되었습니다.');
        this.loadPayslips();
    } catch (err) {
        alert('오류: ' + err.message);
    }
};
