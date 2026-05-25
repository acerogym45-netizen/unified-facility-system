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
