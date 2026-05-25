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
