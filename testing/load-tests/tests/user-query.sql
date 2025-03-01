SELECT u.id, u.created_at, u.profile_id, u.referral_campaign_id, u.referrer_id, u.roles, u.updated_at, u.virtual
FROM "user" AS u
LIMIT 1;