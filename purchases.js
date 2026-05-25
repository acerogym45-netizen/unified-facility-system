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
