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
