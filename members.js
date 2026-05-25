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
