-- ============================================
-- 마스터 관리자 시스템 - Facilities 테이블
-- ============================================

-- facilities 마스터 테이블 생성
CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                    -- 시설명 (예: "e편한세상당정퍼스트드림")
    type TEXT NOT NULL,                    -- 시설 타입 (apartment, fitness, office 등)
    address TEXT,                          -- 주소
    contact_phone TEXT,                    -- 연락처
    contact_email TEXT,                    -- 이메일
    manager_name TEXT,                     -- 담당자명
    
    -- 계약 정보
    contract_start_date DATE,              -- 계약 시작일
    contract_end_date DATE,                -- 계약 종료일
    subscription_plan TEXT DEFAULT 'basic', -- 구독 플랜 (basic, pro, enterprise)
    monthly_fee DECIMAL(10,2),             -- 월 이용료
    
    -- 설정
    settings JSONB DEFAULT '{}'::jsonb,    -- 시설별 설정 (JSON)
    logo_url TEXT,                         -- 로고 이미지 URL
    theme_color TEXT DEFAULT '#667eea',    -- 테마 컬러
    
    -- 상태
    is_active BOOLEAN DEFAULT true,        -- 활성화 상태
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_facilities_type ON facilities(type);
CREATE INDEX idx_facilities_active ON facilities(is_active);
CREATE INDEX idx_facilities_name ON facilities(name);

-- RLS 정책 활성화
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- 마스터 관리자는 모든 facilities 조회 가능
CREATE POLICY "facilities_select_policy" ON facilities
    FOR SELECT USING (true);

-- 마스터 관리자만 facilities 생성 가능
CREATE POLICY "facilities_insert_policy" ON facilities
    FOR INSERT WITH CHECK (true);

-- 마스터 관리자만 facilities 수정 가능
CREATE POLICY "facilities_update_policy" ON facilities
    FOR UPDATE USING (true);

-- 마스터 관리자만 facilities 삭제 가능
CREATE POLICY "facilities_delete_policy" ON facilities
    FOR DELETE USING (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_facilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_facilities_updated_at
    BEFORE UPDATE ON facilities
    FOR EACH ROW
    EXECUTE FUNCTION update_facilities_updated_at();

-- ============================================
-- 샘플 데이터 삽입
-- ============================================

-- 기존 아파트 시설 등록
INSERT INTO facilities (id, name, type, address, contact_phone, manager_name, subscription_plan, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 
     'e편한세상당정퍼스트드림', 
     'apartment', 
     '충청남도 아산시 배방읍', 
     '041-123-4567', 
     '김관리',
     'pro',
     true),
    ('00000000-0000-0000-0000-000000000002', 
     'e편한세상당정 헬스장', 
     'fitness', 
     '충청남도 아산시 배방읍', 
     '041-123-4568', 
     '이트레이너',
     'basic',
     true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    contact_phone = EXCLUDED.contact_phone,
    manager_name = EXCLUDED.manager_name,
    subscription_plan = EXCLUDED.subscription_plan,
    is_active = EXCLUDED.is_active;

-- ============================================
-- 시설 통계 뷰
-- ============================================

CREATE OR REPLACE VIEW facilities_stats AS
SELECT 
    f.id,
    f.name,
    f.type,
    f.is_active,
    f.subscription_plan,
    -- 직원 수
    (SELECT COUNT(*) FROM employees WHERE facility_id = f.id) as employee_count,
    -- 회원 수 (fitness만)
    CASE 
        WHEN f.type = 'fitness' THEN (SELECT COUNT(*) FROM members WHERE facility_id = f.id)
        ELSE 0
    END as member_count,
    -- 구매 요청 수
    (SELECT COUNT(*) FROM purchases WHERE facility_id = f.id) as purchase_count,
    -- 미승인 구매 요청 수
    (SELECT COUNT(*) FROM purchases WHERE facility_id = f.id AND status = 'pending') as pending_purchase_count,
    -- 생성일
    f.created_at,
    f.updated_at
FROM facilities f;

COMMENT ON VIEW facilities_stats IS '시설별 통계 정보 (직원, 회원, 구매 요청 수 등)';

-- ============================================
-- 완료
-- ============================================

-- 확인 쿼리
SELECT 
    id,
    name,
    type,
    is_active,
    subscription_plan,
    created_at
FROM facilities
ORDER BY created_at DESC;
