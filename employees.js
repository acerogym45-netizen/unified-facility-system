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
            
            <!-- 주말 근무시간 섹션 -->
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <div class="flex items-center mb-2">
                    <i class="fas fa-calendar-week text-amber-600 mr-2"></i>
                    <label class="text-sm font-medium text-gray-700">주말 근무시간 (토·일)</label>
                    <span class="ml-2 text-xs text-gray-500">(선택사항)</span>
                </div>
                <p class="text-xs text-gray-600 mb-3">
                    <i class="fas fa-info-circle mr-1"></i>
                    주말 근무시간이 평일과 다른 경우에만 입력하세요. 미입력시 평일 근무시간이 적용됩니다.
                </p>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">시작 시간</label>
                        <input type="time" id="emp_weekend_start" value="${employee?.weekend_start_time || ''}"
                               placeholder="예: 09:00"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">종료 시간</label>
                        <input type="time" id="emp_weekend_end" value="${employee?.weekend_end_time || ''}"
                               placeholder="예: 18:00"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                    </div>
                </div>
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
            weekend_start_time: document.getElementById('emp_weekend_start').value || null,
            weekend_end_time: document.getElementById('emp_weekend_end').value || null,
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
            
            ${employee.weekend_start_time && employee.weekend_end_time ? `
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p class="text-sm text-gray-500 mb-2">
                    <i class="fas fa-calendar-week text-amber-600 mr-2"></i>주말 근무시간 (토·일)
                </p>
                <p class="font-medium text-lg">
                    ${employee.weekend_start_time} ~ ${employee.weekend_end_time}
                </p>
                <p class="text-xs text-gray-600 mt-2">
                    <i class="fas fa-info-circle mr-1"></i>
                    평일과 다른 주말 근무시간이 설정되어 있습니다.
                </p>
            </div>
            ` : ''}
            
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

// 직원의 근무시간 가져오기 (평일/주말 자동 구분)
unifiedApp.getEmployeeWorkTime = function(employee, date = new Date()) {
    const dayOfWeek = date.getDay(); // 0=일요일, 6=토요일
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    
    // 주말이고 주말 근무시간이 설정되어 있으면 주말 근무시간 사용
    if (isWeekend && employee.weekend_start_time && employee.weekend_end_time) {
        return {
            start_time: employee.weekend_start_time,
            end_time: employee.weekend_end_time,
            is_weekend: true
        };
    }
    
    // 그 외의 경우 평일 근무시간 사용 (또는 기본값)
    return {
        start_time: employee.work_start_time || '09:00',
        end_time: employee.work_end_time || '18:00',
        is_weekend: false
    };
};

// 근무시간 체크 예시 (근태관리 등에서 활용)
unifiedApp.checkAttendanceTime = function(employee, checkTime = new Date()) {
    const workTime = this.getEmployeeWorkTime(employee, checkTime);
    const currentTimeStr = checkTime.toTimeString().substring(0, 5); // HH:MM 형식
    
    const isLate = currentTimeStr > workTime.start_time;
    const isEarly = currentTimeStr < workTime.end_time;
    
    return {
        work_start: workTime.start_time,
        work_end: workTime.end_time,
        current_time: currentTimeStr,
        is_weekend: workTime.is_weekend,
        is_late: isLate,
        status: isLate ? '지각' : '정상'
    };
};
