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
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    },

    login: function() {
        const pin = document.getElementById('loginPin').value;
        if (pin === 'admin2026' || pin === 'bdxi2026') {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('mainDashboard').style.display = 'block';
            this.loadDashboard();
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
        const { data, error } = await this.sb
            .from('employees')
            .select('*')
            .order('name');
        
        if (error) throw error;
        this.employees = data || [];
        this.renderEmployees();
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
            facility_id: FACILITY_IDS.APARTMENT
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
        const { data, error } = await this.sb
            .from('members')
            .select('*')
            .order('name');
        
        if (error) throw error;
        this.members = data || [];
        this.renderMembers();
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
            facility_id: FACILITY_IDS.FITNESS
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
            facility_id: FACILITY_IDS.APARTMENT
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
