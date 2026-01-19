-- Add font selection to Resume
alter table "Resume"
add column if not exists "fontFamily" text default 'jakarta';
