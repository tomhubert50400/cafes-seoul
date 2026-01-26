-- ============================================
-- SEED: Seoul Districts (25 구)
-- ============================================

INSERT INTO public.districts (id, name, slug) VALUES
    (1, '{"ko": "강남구", "en": "Gangnam-gu", "fr": "Gangnam", "zh": "江南区", "vi": "Gangnam-gu"}', 'gangnam'),
    (2, '{"ko": "강동구", "en": "Gangdong-gu", "fr": "Gangdong", "zh": "江东区", "vi": "Gangdong-gu"}', 'gangdong'),
    (3, '{"ko": "강북구", "en": "Gangbuk-gu", "fr": "Gangbuk", "zh": "江北区", "vi": "Gangbuk-gu"}', 'gangbuk'),
    (4, '{"ko": "강서구", "en": "Gangseo-gu", "fr": "Gangseo", "zh": "江西区", "vi": "Gangseo-gu"}', 'gangseo'),
    (5, '{"ko": "관악구", "en": "Gwanak-gu", "fr": "Gwanak", "zh": "冠岳区", "vi": "Gwanak-gu"}', 'gwanak'),
    (6, '{"ko": "광진구", "en": "Gwangjin-gu", "fr": "Gwangjin", "zh": "广津区", "vi": "Gwangjin-gu"}', 'gwangjin'),
    (7, '{"ko": "구로구", "en": "Guro-gu", "fr": "Guro", "zh": "九老区", "vi": "Guro-gu"}', 'guro'),
    (8, '{"ko": "금천구", "en": "Geumcheon-gu", "fr": "Geumcheon", "zh": "衿川区", "vi": "Geumcheon-gu"}', 'geumcheon'),
    (9, '{"ko": "노원구", "en": "Nowon-gu", "fr": "Nowon", "zh": "芦原区", "vi": "Nowon-gu"}', 'nowon'),
    (10, '{"ko": "도봉구", "en": "Dobong-gu", "fr": "Dobong", "zh": "道峰区", "vi": "Dobong-gu"}', 'dobong'),
    (11, '{"ko": "동대문구", "en": "Dongdaemun-gu", "fr": "Dongdaemun", "zh": "东大门区", "vi": "Dongdaemun-gu"}', 'dongdaemun'),
    (12, '{"ko": "동작구", "en": "Dongjak-gu", "fr": "Dongjak", "zh": "铜雀区", "vi": "Dongjak-gu"}', 'dongjak'),
    (13, '{"ko": "마포구", "en": "Mapo-gu", "fr": "Mapo", "zh": "麻浦区", "vi": "Mapo-gu"}', 'mapo'),
    (14, '{"ko": "서대문구", "en": "Seodaemun-gu", "fr": "Seodaemun", "zh": "西大门区", "vi": "Seodaemun-gu"}', 'seodaemun'),
    (15, '{"ko": "서초구", "en": "Seocho-gu", "fr": "Seocho", "zh": "瑞草区", "vi": "Seocho-gu"}', 'seocho'),
    (16, '{"ko": "성동구", "en": "Seongdong-gu", "fr": "Seongdong", "zh": "城东区", "vi": "Seongdong-gu"}', 'seongdong'),
    (17, '{"ko": "성북구", "en": "Seongbuk-gu", "fr": "Seongbuk", "zh": "城北区", "vi": "Seongbuk-gu"}', 'seongbuk'),
    (18, '{"ko": "송파구", "en": "Songpa-gu", "fr": "Songpa", "zh": "松坡区", "vi": "Songpa-gu"}', 'songpa'),
    (19, '{"ko": "양천구", "en": "Yangcheon-gu", "fr": "Yangcheon", "zh": "阳川区", "vi": "Yangcheon-gu"}', 'yangcheon'),
    (20, '{"ko": "영등포구", "en": "Yeongdeungpo-gu", "fr": "Yeongdeungpo", "zh": "永登浦区", "vi": "Yeongdeungpo-gu"}', 'yeongdeungpo'),
    (21, '{"ko": "용산구", "en": "Yongsan-gu", "fr": "Yongsan", "zh": "龙山区", "vi": "Yongsan-gu"}', 'yongsan'),
    (22, '{"ko": "은평구", "en": "Eunpyeong-gu", "fr": "Eunpyeong", "zh": "恩平区", "vi": "Eunpyeong-gu"}', 'eunpyeong'),
    (23, '{"ko": "종로구", "en": "Jongno-gu", "fr": "Jongno", "zh": "钟路区", "vi": "Jongno-gu"}', 'jongno'),
    (24, '{"ko": "중구", "en": "Jung-gu", "fr": "Jung", "zh": "中区", "vi": "Jung-gu"}', 'jung'),
    (25, '{"ko": "중랑구", "en": "Jungnang-gu", "fr": "Jungnang", "zh": "中浪区", "vi": "Jungnang-gu"}', 'jungnang')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug;

-- Reset sequence to avoid conflicts
SELECT setval('districts_id_seq', 25, true);
