import type { District } from '@/types';

// All 25 districts (gu/구) of Seoul
export const SEOUL_DISTRICTS: District[] = [
  { id: 1, name: { ko: '강남구', en: 'Gangnam-gu' }, slug: 'gangnam' },
  { id: 2, name: { ko: '강동구', en: 'Gangdong-gu' }, slug: 'gangdong' },
  { id: 3, name: { ko: '강북구', en: 'Gangbuk-gu' }, slug: 'gangbuk' },
  { id: 4, name: { ko: '강서구', en: 'Gangseo-gu' }, slug: 'gangseo' },
  { id: 5, name: { ko: '관악구', en: 'Gwanak-gu' }, slug: 'gwanak' },
  { id: 6, name: { ko: '광진구', en: 'Gwangjin-gu' }, slug: 'gwangjin' },
  { id: 7, name: { ko: '구로구', en: 'Guro-gu' }, slug: 'guro' },
  { id: 8, name: { ko: '금천구', en: 'Geumcheon-gu' }, slug: 'geumcheon' },
  { id: 9, name: { ko: '노원구', en: 'Nowon-gu' }, slug: 'nowon' },
  { id: 10, name: { ko: '도봉구', en: 'Dobong-gu' }, slug: 'dobong' },
  { id: 11, name: { ko: '동대문구', en: 'Dongdaemun-gu' }, slug: 'dongdaemun' },
  { id: 12, name: { ko: '동작구', en: 'Dongjak-gu' }, slug: 'dongjak' },
  { id: 13, name: { ko: '마포구', en: 'Mapo-gu' }, slug: 'mapo' },
  { id: 14, name: { ko: '서대문구', en: 'Seodaemun-gu' }, slug: 'seodaemun' },
  { id: 15, name: { ko: '서초구', en: 'Seocho-gu' }, slug: 'seocho' },
  { id: 16, name: { ko: '성동구', en: 'Seongdong-gu' }, slug: 'seongdong' },
  { id: 17, name: { ko: '성북구', en: 'Seongbuk-gu' }, slug: 'seongbuk' },
  { id: 18, name: { ko: '송파구', en: 'Songpa-gu' }, slug: 'songpa' },
  { id: 19, name: { ko: '양천구', en: 'Yangcheon-gu' }, slug: 'yangcheon' },
  { id: 20, name: { ko: '영등포구', en: 'Yeongdeungpo-gu' }, slug: 'yeongdeungpo' },
  { id: 21, name: { ko: '용산구', en: 'Yongsan-gu' }, slug: 'yongsan' },
  { id: 22, name: { ko: '은평구', en: 'Eunpyeong-gu' }, slug: 'eunpyeong' },
  { id: 23, name: { ko: '종로구', en: 'Jongno-gu' }, slug: 'jongno' },
  { id: 24, name: { ko: '중구', en: 'Jung-gu' }, slug: 'jung' },
  { id: 25, name: { ko: '중랑구', en: 'Jungnang-gu' }, slug: 'jungnang' },
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
