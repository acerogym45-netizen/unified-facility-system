// ============================================
// 마스터 관리자 시스템
// ============================================

const masterApp = {
    sb: null,
    facilities: [],
    stats: null,

    // 초기화
    init: async function() {
        console.log('🚀 마스터 관리자 시스템 초기화');
        this.sb = createSharedSupabaseClient();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    },

    // 시계 업데이트
    updateClock: function() {
        const now = new Date();
        const timeString = now.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const clockEl = document.getElementById('clock');
        if (clockEl) {
            clockEl.textContent = timeString;
        }
    },

    // 로그인
    login: function() {
        const pin = document.getElementById('masterPin').value;
        // 마스터 관리자 PIN
        if (pin === 'master2026' || pin === 'bdximaster') {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('mainDashboard').style.display = 'block';
            this.loadDashboard();
        } else {
            alert('❌ 잘못된 마스터 PIN입니다.');
        }
    },

    // 로그아웃
    logout: function() {
        if (confirm('로그아웃 하시겠습니까?')) {
            document.getElementById('mainDashboard').style.display = 'none';
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('masterPin').value = '';
        }
    },

    // 대시보드 로드
    loadDashboard: async function() {
        await this.loadFacilities();
        await this.loadStats();
    },

    // 시설 목록 로드
    loadFacilities: async function() {
        try {
            const { data, error } = await this.sb
                .from('facilities')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.facilities = data || [];
            this.renderFacilities();
            console.log('✅ 시설 목록 로드:', this.facilities.length);
        } catch (err) {
            console.error('시설 로드 실패:', err);
            alert('시설 목록을 불러올 수 없습니다: ' + err.message);
        }
    },

    // 시설 카드 렌더링
    renderFacilities: function() {
        const grid = document.getElementById('facilitiesGrid');
        if (!grid) return;

        if (this.facilities.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <i class="fas fa-building text-6xl text-white opacity-50 mb-4"></i>
                    <p class="text-white text-xl">등록된 시설이 없습니다</p>
                    <p class="text-white opacity-75 mt-2">상단의 "시설 추가" 버튼을 눌러 새 시설을 등록하세요</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.facilities.map(facility => `
            <div class="facility-card bg-white rounded-2xl shadow-lg overflow-hidden" 
                 onclick="masterApp.openFacilityDetail('${facility.id}')">
                <!-- 헤더 -->
                <div class="h-32 bg-gradient-to-br ${this.getFacilityGradient(facility.type)} relative">
                    <div class="absolute top-4 right-4">
                        ${facility.is_active ? 
                            '<span class="badge-active">활성화</span>' : 
                            '<span class="badge-inactive">비활성</span>'}
                    </div>
                    <div class="absolute bottom-4 left-4">
                        <i class="fas ${this.getFacilityIcon(facility.type)} text-white text-4xl"></i>
                    </div>
                </div>
                
                <!-- 내용 -->
                <div class="p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${facility.name}</h3>
                    <p class="text-sm text-gray-500 mb-4">
                        <i class="fas fa-tag mr-1"></i>${this.getFacilityTypeName(facility.type)}
                    </p>
                    
                    ${facility.address ? `
                        <p class="text-sm text-gray-600 mb-2">
                            <i class="fas fa-map-marker-alt mr-2"></i>${facility.address}
                        </p>
                    ` : ''}
                    
                    ${facility.manager_name ? `
                        <p class="text-sm text-gray-600 mb-2">
                            <i class="fas fa-user mr-2"></i>${facility.manager_name}
                        </p>
                    ` : ''}
                    
                    <div class="flex items-center justify-between mt-4 pt-4 border-t">
                        <span class="text-xs text-gray-500">
                            ${new Date(facility.created_at).toLocaleDateString('ko-KR')}
                        </span>
                        <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                            ${facility.subscription_plan?.toUpperCase() || 'BASIC'}
                        </span>
                    </div>
                    
                    <!-- 액션 버튼 -->
                    <div class="flex space-x-2 mt-4">
                        <button onclick="event.stopPropagation(); masterApp.enterFacilitySystem('${facility.id}')" 
                                class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold">
                            <i class="fas fa-arrow-right mr-1"></i>시스템 진입
                        </button>
                        <button onclick="event.stopPropagation(); masterApp.editFacility('${facility.id}')" 
                                class="px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="event.stopPropagation(); masterApp.deleteFacility('${facility.id}')" 
                                class="px-4 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // 시설 타입별 아이콘
    getFacilityIcon: function(type) {
        const icons = {
            'apartment': 'fa-building',
            'fitness': 'fa-dumbbell',
            'office': 'fa-briefcase',
            'commercial': 'fa-store'
        };
        return icons[type] || 'fa-building';
    },

    // 시설 타입별 그라디언트
    getFacilityGradient: function(type) {
        const gradients = {
            'apartment': 'from-blue-500 to-blue-700',
            'fitness': 'from-green-500 to-green-700',
            'office': 'from-purple-500 to-purple-700',
            'commercial': 'from-orange-500 to-orange-700'
        };
        return gradients[type] || 'from-gray-500 to-gray-700';
    },

    // 시설 타입명
    getFacilityTypeName: function(type) {
        const names = {
            'apartment': '아파트 (ERP)',
            'fitness': '헬스장/필라테스 (CRM)',
            'office': '오피스텔',
            'commercial': '상가'
        };
        return names[type] || type;
    },

    // 통계 로드
    loadStats: async function() {
        try {
            const { data, error } = await this.sb
                .from('facilities_stats')
                .select('*');
            
            if (error) throw error;
            
            this.stats = data || [];
            this.renderStats();
            console.log('✅ 통계 로드 완료');
        } catch (err) {
            console.error('통계 로드 실패:', err);
            // 통계 뷰가 없을 경우 기본 통계 계산
            await this.calculateBasicStats();
        }
    },

    // 기본 통계 계산
    calculateBasicStats: async function() {
        try {
            // 전체 시설 수
            document.getElementById('totalFacilities').textContent = this.facilities.length;

            // 전체 직원 수
            const { count: employeeCount } = await this.sb
                .from('employees')
                .select('*', { count: 'exact', head: true });
            document.getElementById('totalEmployees').textContent = employeeCount || 0;

            // 전체 회원 수
            const { count: memberCount } = await this.sb
                .from('members')
                .select('*', { count: 'exact', head: true });
            document.getElementById('totalMembers').textContent = memberCount || 0;

            // 미승인 구매 요청
            const { count: pendingCount } = await this.sb
                .from('purchases')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
            document.getElementById('pendingRequests').textContent = pendingCount || 0;

        } catch (err) {
            console.error('기본 통계 계산 실패:', err);
        }
    },

    // 통계 렌더링
    renderStats: function() {
        const totalFacilities = this.stats.length;
        const totalEmployees = this.stats.reduce((sum, s) => sum + (s.employee_count || 0), 0);
        const totalMembers = this.stats.reduce((sum, s) => sum + (s.member_count || 0), 0);
        const pendingRequests = this.stats.reduce((sum, s) => sum + (s.pending_purchase_count || 0), 0);

        document.getElementById('totalFacilities').textContent = totalFacilities;
        document.getElementById('totalEmployees').textContent = totalEmployees;
        document.getElementById('totalMembers').textContent = totalMembers;
        document.getElementById('pendingRequests').textContent = pendingRequests;
    },

    // 시설 추가 모달 열기
    openAddFacilityModal: function() {
        document.getElementById('addFacilityModal').style.display = 'block';
        document.getElementById('addFacilityForm').reset();
    },

    // 모달 닫기
    closeModal: function() {
        document.getElementById('addFacilityModal').style.display = 'none';
    },

    // 시설 추가
    addFacility: async function(facilityData) {
        try {
            const { data, error } = await this.sb
                .from('facilities')
                .insert([facilityData])
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('✅ 시설 추가 완료:', data);
            alert('✅ 시설이 성공적으로 추가되었습니다!');
            this.closeModal();
            this.loadDashboard();
            
            return data;
        } catch (err) {
            console.error('시설 추가 실패:', err);
            alert('시설 추가 실패: ' + err.message);
            throw err;
        }
    },

    // 시설 시스템 진입
    enterFacilitySystem: function(facilityId) {
        const facility = this.facilities.find(f => f.id === facilityId);
        if (!facility) {
            alert('시설 정보를 찾을 수 없습니다.');
            return;
        }

        // URL 파라미터 방식으로 이동
        const baseUrl = 'https://unified-facility-system.vercel.app/';
        const url = `${baseUrl}?facility=${facilityId}`;
        
        // 새 탭에서 열기 (또는 window.location.href = url로 현재 탭에서 이동)
        window.open(url, '_blank');
    },

    // 시설 상세 보기
    openFacilityDetail: function(facilityId) {
        const facility = this.facilities.find(f => f.id === facilityId);
        if (!facility) return;

        const stats = this.stats?.find(s => s.id === facilityId);
        
        alert(`
시설명: ${facility.name}
타입: ${this.getFacilityTypeName(facility.type)}
주소: ${facility.address || '미등록'}
담당자: ${facility.manager_name || '미등록'}
직원 수: ${stats?.employee_count || 0}명
회원 수: ${stats?.member_count || 0}명
구매 요청: ${stats?.purchase_count || 0}건
        `);
    },

    // 시설 수정
    editFacility: function(facilityId) {
        const facility = this.facilities.find(f => f.id === facilityId);
        if (!facility) return;

        // TODO: 수정 모달 구현
        alert('시설 수정 기능은 곧 구현됩니다.');
    },

    // 시설 삭제
    deleteFacility: async function(facilityId) {
        const facility = this.facilities.find(f => f.id === facilityId);
        if (!facility) return;

        if (!confirm(`정말 "${facility.name}" 시설을 삭제하시겠습니까?\n\n⚠️ 경고: 해당 시설의 모든 데이터(직원, 회원, 구매 등)가 함께 삭제됩니다!`)) {
            return;
        }

        if (!confirm('정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        try {
            const { error } = await this.sb
                .from('facilities')
                .delete()
                .eq('id', facilityId);
            
            if (error) throw error;
            
            alert('✅ 시설이 삭제되었습니다.');
            this.loadDashboard();
        } catch (err) {
            console.error('시설 삭제 실패:', err);
            alert('시설 삭제 실패: ' + err.message);
        }
    }
};

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', () => {
    masterApp.init();
});

// 시설 추가 폼 제출
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addFacilityForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('facility_name').value;
            const systemName = document.getElementById('facility_system_name').value;
            
            const facilityData = {
                name: name,
                system_name: systemName || name,  // 비어있으면 시설명 사용
                type: document.getElementById('facility_type').value,
                address: document.getElementById('facility_address').value,
                contact_phone: document.getElementById('facility_phone').value,
                manager_name: document.getElementById('facility_manager').value,
                subscription_plan: document.getElementById('facility_plan').value,
                is_active: true
            };

            await masterApp.addFacility(facilityData);
        };
    }
});
