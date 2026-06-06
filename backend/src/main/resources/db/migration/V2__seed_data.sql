-- ============================================================
-- V2__seed_data.sql
-- Owner: BE1 – Dữ liệu mẫu ban đầu
-- ============================================================

-- ==========================
-- ADMIN ACCOUNT
-- Password: Admin@123 (BCrypt $2a$10$...)
-- Thay hash bằng cách chạy: new BCryptPasswordEncoder(10).encode("Admin@123")
-- ==========================
INSERT INTO users (email, password_hash, full_name, role, reputation_points, is_active)
VALUES (
    'admin@aistudyhub.com',
    '$2a$10$N.zmdr9zkZkS8KJRqt1FEeUmxg6c8JDXYp2tVf6O5YnRt2D4Ry5Wq',
    'System Admin',
    'ADMIN',
    0,
    true
);

-- ==========================
-- SAMPLE SEMESTERS
-- ==========================
INSERT INTO semesters (code, name) VALUES
    ('SU2024', 'Summer 2024'),
    ('FA2024', 'Fall 2024'),
    ('SP2025', 'Spring 2025'),
    ('SU2025', 'Summer 2025'),
    ('FA2025', 'Fall 2025'),
    ('SP2026', 'Spring 2026'),
    ('SU2026', 'Summer 2026');

-- ==========================
-- SAMPLE SUBJECTS (FPT curriculum)
-- ==========================
INSERT INTO subjects (code, name, standard_semester_number) VALUES
    ('PRF192',  'Introduction to Programming',        1),
    ('MAE101',  'Mathematics for Engineering',        1),
    ('CEA201',  'Computer Organization and Architecture', 2),
    ('PRO192',  'Object-Oriented Programming',        2),
    ('DBI202',  'Introduction to Databases',          3),
    ('OSG202',  'Operating System',                   3),
    ('SWR302',  'Software Requirements',              4),
    ('SWD392',  'API Development and Integration',    4),
    ('SWP391',  'Application Development Project',    5),
    ('SWD391',  'UI/UX Design',                       5),
    ('SWT301',  'Software Testing',                   5),
    ('MLN111',  'Marxist-Leninist Philosophy',        1),
    ('VOV114',  'Ho Chi Minh Thoughts',               2),
    ('ENW492W', 'English for IT 1',                   1),
    ('ENW493W', 'English for IT 2',                   2);

-- ==========================
-- SAMPLE COMBOS
-- ==========================
INSERT INTO combos (code, name, description) VALUES
    ('SE',  'Software Engineering',   'Combo chuyên ngành Kỹ thuật phần mềm'),
    ('AI',  'Artificial Intelligence','Combo chuyên ngành Trí tuệ nhân tạo'),
    ('IOT', 'Internet of Things',     'Combo chuyên ngành IoT'),
    ('IB',  'Information Business',   'Combo chuyên ngành Kinh doanh thông tin');

-- ==========================
-- SYSTEM CONFIGS (defaults)
-- ==========================
INSERT INTO system_configs (config_key, config_value, description) VALUES
    ('MAX_UPLOAD_FILE_SIZE_BYTES',              '52428800',  'Max file upload size: 50MB'),
    ('ALLOWED_FILE_TYPES',                      'pdf,docx,pptx,txt', 'Allowed file types'),
    ('BASE_REPUTATION_PER_UPLOAD',              '10',        'Reputation points per approved upload'),
    ('MARKETPLACE_AUTO_APPROVE_MIN_REVIEWS',    '3',         'Min reviews needed for auto-approval'),
    ('MARKETPLACE_AUTO_APPROVE_ACCEPT_PCT',     '70',        'Min accept % for auto-approval'),
    ('FREE_DOWNLOAD_WAIT_SECONDS',              '30',        'Wait time for free tier download'),
    ('AI_CHAT_DAILY_LIMIT',                     '50',        'Daily AI chat message limit per user'),
    ('AI_SUMMARY_DAILY_LIMIT',                  '10',        'Daily AI summary limit per user'),
    ('RESET_TOKEN_EXPIRE_MINUTES',              '30',        'Password reset token expiry in minutes');

-- ==========================
-- SAMPLE DEMO USER (Student)
-- Password: Demo@123
-- ==========================
INSERT INTO users (email, password_hash, full_name, role, reputation_points, is_active, current_semester_id)
VALUES (
    'demo@fpt.edu.vn',
    '$2a$10$N.zmdr9zkZkS8KJRqt1FEeUmxg6c8JDXYp2tVf6O5YnRt2D4Ry5Wq',
    'Demo Student',
    'STUDENT',
    0,
    true,
    (SELECT id FROM semesters WHERE code = 'SU2026')
);
