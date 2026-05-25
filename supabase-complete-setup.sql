-- ============================================
-- 통합 시설 관리 시스템 - Supabase 완전 설정
-- 작성일: 2026-05-25
-- 설명: 6개 신규 테이블 생성 + RLS 정책 설정
-- ============================================

-- UUID 확장 활성화 (이미 활성화되어 있을 수 있음)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 구역 관리 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    qr_code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_areas_facility ON areas(facility_id);
CREATE INDEX IF NOT EXISTS idx_areas_qr_code ON areas(qr_code);
CREATE INDEX IF NOT EXISTS idx_areas_active ON areas(is_active);

-- RLS 활성화
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "areas_select_policy" ON areas
    FOR SELECT USING (true);

CREATE POLICY "areas_insert_policy" ON areas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "areas_update_policy" ON areas
    FOR UPDATE USING (true);

CREATE POLICY "areas_delete_policy" ON areas
    FOR DELETE USING (true);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. 작업 갤러리 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS work_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL,
    area_name TEXT NOT NULL,
    work_date DATE NOT NULL,
    photo_url TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_work_gallery_facility ON work_gallery(facility_id);
CREATE INDEX IF NOT EXISTS idx_work_gallery_date ON work_gallery(work_date DESC);
CREATE INDEX IF NOT EXISTS idx_work_gallery_area ON work_gallery(area_name);

-- RLS 활성화
ALTER TABLE work_gallery ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "work_gallery_select_policy" ON work_gallery
    FOR SELECT USING (true);

CREATE POLICY "work_gallery_insert_policy" ON work_gallery
    FOR INSERT WITH CHECK (true);

CREATE POLICY "work_gallery_update_policy" ON work_gallery
    FOR UPDATE USING (true);

CREATE POLICY "work_gallery_delete_policy" ON work_gallery
    FOR DELETE USING (true);

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_work_gallery_updated_at BEFORE UPDATE ON work_gallery
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. 업무 일지 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS work_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL,
    log_date DATE NOT NULL,
    worker_name TEXT NOT NULL,
    work_type TEXT NOT NULL CHECK (work_type IN ('청소', '점검', '수리', '기타')),
    description TEXT NOT NULL,
    special_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_work_logs_facility ON work_logs(facility_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_date ON work_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_work_logs_worker ON work_logs(worker_name);
CREATE INDEX IF NOT EXISTS idx_work_logs_type ON work_logs(work_type);

-- RLS 활성화
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "work_logs_select_policy" ON work_logs
    FOR SELECT USING (true);

CREATE POLICY "work_logs_insert_policy" ON work_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "work_logs_update_policy" ON work_logs
    FOR UPDATE USING (true);

CREATE POLICY "work_logs_delete_policy" ON work_logs
    FOR DELETE USING (true);

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_work_logs_updated_at BEFORE UPDATE ON work_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. 서류 관리 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('계약서', '견적서', '청구서', '보고서', '기타')),
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    notes TEXT,
    uploader TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_documents_facility ON documents(facility_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_uploader ON documents(uploader);

-- RLS 활성화
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "documents_select_policy" ON documents
    FOR SELECT USING (true);

CREATE POLICY "documents_insert_policy" ON documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "documents_update_policy" ON documents
    FOR UPDATE USING (true);

CREATE POLICY "documents_delete_policy" ON documents
    FOR DELETE USING (true);

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. 정산서 관리 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL,
    month TEXT NOT NULL, -- YYYY-MM 형식
    category TEXT NOT NULL CHECK (category IN ('급여', '관리비', '수리비', '기타')),
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_settlements_facility ON settlements(facility_id);
CREATE INDEX IF NOT EXISTS idx_settlements_month ON settlements(month DESC);
CREATE INDEX IF NOT EXISTS idx_settlements_category ON settlements(category);
CREATE INDEX IF NOT EXISTS idx_settlements_paid ON settlements(is_paid);

-- RLS 활성화
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "settlements_select_policy" ON settlements
    FOR SELECT USING (true);

CREATE POLICY "settlements_insert_policy" ON settlements
    FOR INSERT WITH CHECK (true);

CREATE POLICY "settlements_update_policy" ON settlements
    FOR UPDATE USING (true);

CREATE POLICY "settlements_delete_policy" ON settlements
    FOR DELETE USING (true);

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_settlements_updated_at BEFORE UPDATE ON settlements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. 급여명세서 관리 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL,
    pay_month TEXT NOT NULL, -- YYYY-MM 형식
    employee_name TEXT NOT NULL,
    base_salary DECIMAL(15,2) NOT NULL CHECK (base_salary >= 0),
    allowance DECIMAL(15,2) DEFAULT 0 CHECK (allowance >= 0),
    deduction DECIMAL(15,2) DEFAULT 0 CHECK (deduction >= 0),
    net_salary DECIMAL(15,2) NOT NULL CHECK (net_salary >= 0),
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_payslips_facility ON payslips(facility_id);
CREATE INDEX IF NOT EXISTS idx_payslips_month ON payslips(pay_month DESC);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON payslips(employee_name);
CREATE INDEX IF NOT EXISTS idx_payslips_paid ON payslips(is_paid);

-- RLS 활성화
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "payslips_select_policy" ON payslips
    FOR SELECT USING (true);

CREATE POLICY "payslips_insert_policy" ON payslips
    FOR INSERT WITH CHECK (true);

CREATE POLICY "payslips_update_policy" ON payslips
    FOR UPDATE USING (true);

CREATE POLICY "payslips_delete_policy" ON payslips
    FOR DELETE USING (true);

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_payslips_updated_at BEFORE UPDATE ON payslips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. 샘플 데이터 삽입 (선택 사항)
-- ============================================

-- 샘플 구역 데이터
INSERT INTO areas (facility_id, name, description, qr_code, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '1동 로비', '메인 로비 구역', 'AREA-QR-1LOBBY-SAMPLE', true),
    ('00000000-0000-0000-0000-000000000001', '2동 복도', '2동 복도 구역', 'AREA-QR-2CORRIDOR-SAMPLE', true),
    ('00000000-0000-0000-0000-000000000002', '피트니스 메인홀', '운동 기구 구역', 'AREA-QR-FITNESS-MAIN-SAMPLE', true)
ON CONFLICT (qr_code) DO NOTHING;

-- 샘플 업무 일지
INSERT INTO work_logs (facility_id, log_date, worker_name, work_type, description, special_notes)
VALUES 
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE, '김청소', '청소', '1동 로비 바닥 청소 및 유리창 닦기', '특이사항 없음'),
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', '이점검', '점검', '엘리베이터 정기 점검', '정상 작동 확인'),
    ('00000000-0000-0000-0000-000000000002', CURRENT_DATE, '박정비', '수리', '런닝머신 벨트 교체', '예비 부품 재고 확인 필요')
ON CONFLICT DO NOTHING;

-- 샘플 정산서
INSERT INTO settlements (facility_id, month, category, amount, description, is_paid)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '2026-05', '급여', 3500000, '5월 직원 급여', false),
    ('00000000-0000-0000-0000-000000000001', '2026-05', '관리비', 1200000, '5월 관리비 (전기/수도/가스)', false),
    ('00000000-0000-0000-0000-000000000002', '2026-05', '수리비', 450000, '운동기구 수리비', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. 통계 뷰 (선택 사항)
-- ============================================

-- 월별 정산 통계 뷰
CREATE OR REPLACE VIEW settlement_monthly_summary AS
SELECT 
    facility_id,
    month,
    category,
    COUNT(*) as item_count,
    SUM(amount) as total_amount,
    COUNT(CASE WHEN is_paid THEN 1 END) as paid_count,
    SUM(CASE WHEN is_paid THEN amount ELSE 0 END) as paid_amount
FROM settlements
GROUP BY facility_id, month, category
ORDER BY month DESC, category;

-- 직원별 급여 통계 뷰
CREATE OR REPLACE VIEW payslip_employee_summary AS
SELECT 
    facility_id,
    employee_name,
    pay_month,
    base_salary,
    allowance,
    deduction,
    net_salary,
    is_paid,
    created_at
FROM payslips
ORDER BY pay_month DESC, employee_name;

-- 작업 일지 통계 뷰
CREATE OR REPLACE VIEW work_logs_summary AS
SELECT 
    facility_id,
    work_type,
    DATE_TRUNC('month', log_date) as work_month,
    COUNT(*) as log_count,
    COUNT(DISTINCT worker_name) as worker_count
FROM work_logs
GROUP BY facility_id, work_type, DATE_TRUNC('month', log_date)
ORDER BY work_month DESC, work_type;

-- ============================================
-- 9. 완료 메시지
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '통합 시설 관리 시스템 DB 설정 완료!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '생성된 테이블:';
    RAISE NOTICE '1. areas (구역 관리)';
    RAISE NOTICE '2. work_gallery (작업 갤러리)';
    RAISE NOTICE '3. work_logs (업무 일지)';
    RAISE NOTICE '4. documents (서류 관리)';
    RAISE NOTICE '5. settlements (정산서 관리)';
    RAISE NOTICE '6. payslips (급여명세서 관리)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS 정책: 모든 테이블 활성화 완료';
    RAISE NOTICE '샘플 데이터: 삽입 완료';
    RAISE NOTICE '통계 뷰: 3개 생성 완료';
    RAISE NOTICE '========================================';
    RAISE NOTICE '이제 애플리케이션을 시작할 수 있습니다!';
    RAISE NOTICE '========================================';
END $$;
