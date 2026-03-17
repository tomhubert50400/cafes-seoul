-- Add is_pro flag for subscription/billing
alter table profiles add column if not exists is_pro boolean default false;
