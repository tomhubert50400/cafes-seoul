import type { District } from '@/types';

// All 25 districts (gu/구) of Seoul
export const SEOUL_DISTRICTS: District[] = [
  { id: 1, name: { ko: '강남구', en: 'Gangnam-gu', fr: 'Gangnam', zh: '江南区', vi: 'Gangnam' }, slug: 'gangnam' },
  { id: 2, name: { ko: '강동구', en: 'Gangdong-gu', fr: 'Gangdong', zh: '江东区', vi: 'Gangdong' }, slug: 'gangdong' },
  { id: 3, name: { ko: '강북구', en: 'Gangbuk-gu', fr: 'Gangbuk', zh: '江北区', vi: 'Gangbuk' }, slug: 'gangbuk' },
  { id: 4, name: { ko: '강서구', en: 'Gangseo-gu', fr: 'Gangseo', zh: '江西区', vi: 'Gangseo' }, slug: 'gangseo' },
  { id: 5, name: { ko: '관악구', en: 'Gwanak-gu', fr: 'Gwanak', zh: '冠岳区', vi: 'Gwanak' }, slug: 'gwanak' },
  { id: 6, name: { ko: '광진구', en: 'Gwangjin-gu', fr: 'Gwangjin', zh: '广津区', vi: 'Gwangjin' }, slug: 'gwangjin' },
  { id: 7, name: { ko: '구로구', en: 'Guro-gu', fr: 'Guro', zh: '九老区', vi: 'Guro' }, slug: 'guro' },
  { id: 8, name: { ko: '금천구', en: 'Geumcheon-gu', fr: 'Geumcheon', zh: '衿川区', vi: 'Geumcheon' }, slug: 'geumcheon' },
  { id: 9, name: { ko: '노원구', en: 'Nowon-gu', fr: 'Nowon', zh: '芦原区', vi: 'Nowon' }, slug: 'nowon' },
  { id: 10, name: { ko: '도봉구', en: 'Dobong-gu', fr: 'Dobong', zh: '道峰区', vi: 'Dobong' }, slug: 'dobong' },
  { id: 11, name: { ko: '동대문구', en: 'Dongdaemun-gu', fr: 'Dongdaemun', zh: '东大门区', vi: 'Dongdaemun' }, slug: 'dongdaemun' },
  { id: 12, name: { ko: '동작구', en: 'Dongjak-gu', fr: 'Dongjak', zh: '铜雀区', vi: 'Dongjak' }, slug: 'dongjak' },
  { id: 13, name: { ko: '마포구', en: 'Mapo-gu', fr: 'Mapo', zh: '麻浦区', vi: 'Mapo' }, slug: 'mapo' },
  { id: 14, name: { ko: '서대문구', en: 'Seodaemun-gu', fr: 'Seodaemun', zh: '西大门区', vi: 'Seodaemun' }, slug: 'seodaemun' },
  { id: 15, name: { ko: '서초구', en: 'Seocho-gu', fr: 'Seocho', zh: '瑞草区', vi: 'Seocho' }, slug: 'seocho' },
  { id: 16, name: { ko: '성동구', en: 'Seongdong-gu', fr: 'Seongdong', zh: '城东区', vi: 'Seongdong' }, slug: 'seongdong' },
  { id: 17, name: { ko: '성북구', en: 'Seongbuk-gu', fr: 'Seongbuk', zh: '城北区', vi: 'Seongbuk' }, slug: 'seongbuk' },
  { id: 18, name: { ko: '송파구', en: 'Songpa-gu', fr: 'Songpa', zh: '松坡区', vi: 'Songpa' }, slug: 'songpa' },
  { id: 19, name: { ko: '양천구', en: 'Yangcheon-gu', fr: 'Yangcheon', zh: '阳川区', vi: 'Yangcheon' }, slug: 'yangcheon' },
  { id: 20, name: { ko: '영등포구', en: 'Yeongdeungpo-gu', fr: 'Yeongdeungpo', zh: '永登浦区', vi: 'Yeongdeungpo' }, slug: 'yeongdeungpo' },
  { id: 21, name: { ko: '용산구', en: 'Yongsan-gu', fr: 'Yongsan', zh: '龙山区', vi: 'Yongsan' }, slug: 'yongsan' },
  { id: 22, name: { ko: '은평구', en: 'Eunpyeong-gu', fr: 'Eunpyeong', zh: '恩平区', vi: 'Eunpyeong' }, slug: 'eunpyeong' },
  { id: 23, name: { ko: '종로구', en: 'Jongno-gu', fr: 'Jongno', zh: '钟路区', vi: 'Jongno' }, slug: 'jongno' },
  { id: 24, name: { ko: '중구', en: 'Jung-gu', fr: 'Jung', zh: '中区', vi: 'Jung' }, slug: 'jung' },
  { id: 25, name: { ko: '중랑구', en: 'Jungnang-gu', fr: 'Jungnang', zh: '中浪区', vi: 'Jungnang' }, slug: 'jungnang' },
];

// Popular neighborhoods for quick access
export const POPULAR_NEIGHBORHOODS = [
  { districtSlug: 'gangnam', name: { ko: '신사동', en: 'Sinsa-dong' }, slug: 'sinsa' },
  { districtSlug: 'gangnam', name: { ko: '압구정동', en: 'Apgujeong-dong' }, slug: 'apgujeong' },
  { districtSlug: 'gangnam', name: { ko: '청담동', en: 'Cheongdam-dong' }, slug: 'cheongdam' },
  { districtSlug: 'mapo', name: { ko: '홍대', en: 'Hongdae' }, slug: 'hongdae' },
  { districtSlug: 'mapo', name: { ko: '연남동', en: 'Yeonnam-dong' }, slug: 'yeonnam' },
  { districtSlug: 'mapo', name: { ko: '합정동', en: 'Hapjeong-dong' }, slug: 'hapjeong' },
  { districtSlug: 'yongsan', name: { ko: '이태원', en: 'Itaewon' }, slug: 'itaewon' },
  { districtSlug: 'yongsan', name: { ko: '한남동', en: 'Hannam-dong' }, slug: 'hannam' },
  { districtSlug: 'seongdong', name: { ko: '성수동', en: 'Seongsu-dong' }, slug: 'seongsu' },
  { districtSlug: 'jongno', name: { ko: '삼청동', en: 'Samcheong-dong' }, slug: 'samcheong' },
  { districtSlug: 'jongno', name: { ko: '익선동', en: 'Ikseon-dong' }, slug: 'ikseon' },
  { districtSlug: 'jung', name: { ko: '을지로', en: 'Euljiro' }, slug: 'euljiro' },
];

// Helper to get district by slug
export function getDistrictBySlug(slug: string): District | undefined {
  return SEOUL_DISTRICTS.find((d) => d.slug === slug);
}

// Helper to get district by ID
export function getDistrictById(id: number): District | undefined {
  return SEOUL_DISTRICTS.find((d) => d.id === id);
}
