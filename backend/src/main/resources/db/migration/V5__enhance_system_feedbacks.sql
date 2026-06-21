ALTER TABLE system_feedbacks
    ADD COLUMN IF NOT EXISTS admin_note TEXT;

UPDATE system_feedbacks
SET status = 'OPEN'
WHERE status IS NULL
   OR status = 'PENDING';

ALTER TABLE system_feedbacks
    ALTER COLUMN status SET DEFAULT 'OPEN';
