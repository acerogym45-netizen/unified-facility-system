-- 구역 관리 테이블
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    qr_code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 작업 갤러리 테이블
CREATE TABLE IF NOT EXISTS work_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL,
    area_name TEXT NOT NULL,
    work_date DATE NOT NULL,
    photo_url TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 업무 일지 테이블
CREATE TABLE IF NOT EXISTS work_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL,
    log_date DATE NOT NULL,
    worker_name TEXT NOT NULL,
    work_type TEXT NOT NULL, -- 청소/점검/수리/기타
    description TEXT NOT NULL,
    special_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 서류 관리 테이블
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 계약서/견적서/청구서/보고서/기타
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    notes TEXT,
    uploader TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 정산서 관리 테이블
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL,
    month TEXT NOT NULL, -- YYYY-MM 형식
    category TEXT NOT NULL, -- 급여/관리비/수리비/기타
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 급여명세서 관리 테이블
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL,
    pay_month TEXT NOT NULL, -- YYYY-MM 형식
    employee_name TEXT NOT NULL,
    base_salary DECIMAL(15,2) NOT NULL,
    allowance DECIMAL(15,2) DEFAULT 0,
    deduction DECIMAL(15,2) DEFAULT 0,
    net_salary DECIMAL(15,2) NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_areas_facility ON areas(facility_id);
CREATE INDEX IF NOT EXISTS idx_work_gallery_facility ON work_gallery(facility_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_facility ON work_logs(facility_id);
CREATE INDEX IF NOT EXISTS idx_documents_facility ON documents(facility_id);
CREATE INDEX IF NOT EXISTS idx_settlements_facility ON settlements(facility_id);
CREATE INDEX IF NOT EXISTS idx_payslips_facility ON payslips(facility_id);
