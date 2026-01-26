-- Seed Seoul districts (25 gu)
INSERT INTO public.districts (id, name_ko, name_en, slug) VALUES
(1, '강남구', 'Gangnam-gu', 'gangnam'),
(2, '강동구', 'Gangdong-gu', 'gangdong'),
(3, '강북구', 'Gangbuk-gu', 'gangbuk'),
(4, '강서구', 'Gangseo-gu', 'gangseo'),
(5, '관악구', 'Gwanak-gu', 'gwanak'),
(6, '광진구', 'Gwangjin-gu', 'gwangjin'),
(7, '구로구', 'Guro-gu', 'guro'),
(8, '금천구', 'Geumcheon-gu', 'geumcheon'),
(9, '노원구', 'Nowon-gu', 'nowon'),
(10, '도봉구', 'Dobong-gu', 'dobong'),
(11, '동대문구', 'Dongdaemun-gu', 'dongdaemun'),
(12, '동작구', 'Dongjak-gu', 'dongjak'),
(13, '마포구', 'Mapo-gu', 'mapo'),
(14, '서대문구', 'Seodaemun-gu', 'seodaemun'),
(15, '서초구', 'Seocho-gu', 'seocho'),
(16, '성동구', 'Seongdong-gu', 'seongdong'),
(17, '성북구', 'Seongbuk-gu', 'seongbuk'),
(18, '송파구', 'Songpa-gu', 'songpa'),
(19, '양천구', 'Yangcheon-gu', 'yangcheon'),
(20, '영등포구', 'Yeongdeungpo-gu', 'yeongdeungpo'),
(21, '용산구', 'Yongsan-gu', 'yongsan'),
(22, '은평구', 'Eunpyeong-gu', 'eunpyeong'),
(23, '종로구', 'Jongno-gu', 'jongno'),
(24, '중구', 'Jung-gu', 'jung'),
(25, '중랑구', 'Jungnang-gu', 'jungnang')
ON CONFLICT (id) DO NOTHING;

-- Seed popular neighborhoods
INSERT INTO public.neighborhoods (district_id, name_ko, name_en, slug) VALUES
-- Gangnam
(1, '신사동', 'Sinsa-dong', 'sinsa'),
(1, '압구정동', 'Apgujeong-dong', 'apgujeong'),
(1, '청담동', 'Cheongdam-dong', 'cheongdam'),
(1, '역삼동', 'Yeoksam-dong', 'yeoksam'),
(1, '삼성동', 'Samseong-dong', 'samseong'),
(1, '논현동', 'Nonhyeon-dong', 'nonhyeon'),
-- Mapo
(13, '서교동', 'Seogyo-dong', 'seogyo'),
(13, '연남동', 'Yeonnam-dong', 'yeonnam'),
(13, '합정동', 'Hapjeong-dong', 'hapjeong'),
(13, '망원동', 'Mangwon-dong', 'mangwon'),
(13, '상수동', 'Sangsu-dong', 'sangsu'),
-- Yongsan
(21, '이태원동', 'Itaewon-dong', 'itaewon'),
(21, '한남동', 'Hannam-dong', 'hannam'),
(21, '경리단길', 'Gyeongridan-gil', 'gyeongridan'),
(21, '해방촌', 'Haebangchon', 'haebangchon'),
-- Seongdong
(16, '성수동', 'Seongsu-dong', 'seongsu'),
(16, '서울숲', 'Seoul Forest', 'seoul-forest'),
-- Jongno
(23, '삼청동', 'Samcheong-dong', 'samcheong'),
(23, '익선동', 'Ikseon-dong', 'ikseon'),
(23, '북촌', 'Bukchon', 'bukchon'),
(23, '서촌', 'Seochon', 'seochon'),
(23, '인사동', 'Insadong', 'insadong'),
-- Jung
(24, '을지로', 'Euljiro', 'euljiro'),
(24, '명동', 'Myeongdong', 'myeongdong'),
(24, '충무로', 'Chungmuro', 'chungmuro'),
-- Seocho
(15, '서래마을', 'Seorae Village', 'seorae'),
(15, '반포동', 'Banpo-dong', 'banpo'),
(15, '방배동', 'Bangbae-dong', 'bangbae'),
-- Songpa
(18, '잠실동', 'Jamsil-dong', 'jamsil'),
(18, '문정동', 'Munjeong-dong', 'munjeong'),
-- Gwangjin
(6, '건대입구', 'Konkuk University', 'konkuk'),
(6, '자양동', 'Jayang-dong', 'jayang')
ON CONFLICT (slug) DO NOTHING;

-- Reset sequence for districts
SELECT setval('public.districts_id_seq', (SELECT MAX(id) FROM public.districts));
