import type { District } from '@/types';

// All 25 districts (gu/구) of Seoul
export const SEOUL_DISTRICTS: District[] = [
  { id: 1, nameKo: '강남구', nameEn: 'Gangnam-gu', slug: 'gangnam' },
  { id: 2, nameKo: '강동구', nameEn: 'Gangdong-gu', slug: 'gangdong' },
  { id: 3, nameKo: '강북구', nameEn: 'Gangbuk-gu', slug: 'gangbuk' },
  { id: 4, nameKo: '강서구', nameEn: 'Gangseo-gu', slug: 'gangseo' },
  { id: 5, nameKo: '관악구', nameEn: 'Gwanak-gu', slug: 'gwanak' },
  { id: 6, nameKo: '광진구', nameEn: 'Gwangjin-gu', slug: 'gwangjin' },
  { id: 7, nameKo: '구로구', nameEn: 'Guro-gu', slug: 'guro' },
  { id: 8, nameKo: '금천구', nameEn: 'Geumcheon-gu', slug: 'geumcheon' },
  { id: 9, nameKo: '노원구', nameEn: 'Nowon-gu', slug: 'nowon' },
  { id: 10, nameKo: '도봉구', nameEn: 'Dobong-gu', slug: 'dobong' },
  { id: 11, nameKo: '동대문구', nameEn: 'Dongdaemun-gu', slug: 'dongdaemun' },
  { id: 12, nameKo: '동작구', nameEn: 'Dongjak-gu', slug: 'dongjak' },
  { id: 13, nameKo: '마포구', nameEn: 'Mapo-gu', slug: 'mapo' },
  { id: 14, nameKo: '서대문구', nameEn: 'Seodaemun-gu', slug: 'seodaemun' },
  { id: 15, nameKo: '서초구', nameEn: 'Seocho-gu', slug: 'seocho' },
  { id: 16, nameKo: '성동구', nameEn: 'Seongdong-gu', slug: 'seongdong' },
  { id: 17, nameKo: '성북구', nameEn: 'Seongbuk-gu', slug: 'seongbuk' },
  { id: 18, nameKo: '송파구', nameEn: 'Songpa-gu', slug: 'songpa' },
  { id: 19, nameKo: '양천구', nameEn: 'Yangcheon-gu', slug: 'yangcheon' },
  { id: 20, nameKo: '영등포구', nameEn: 'Yeongdeungpo-gu', slug: 'yeongdeungpo' },
  { id: 21, nameKo: '용산구', nameEn: 'Yongsan-gu', slug: 'yongsan' },
  { id: 22, nameKo: '은평구', nameEn: 'Eunpyeong-gu', slug: 'eunpyeong' },
  { id: 23, nameKo: '종로구', nameEn: 'Jongno-gu', slug: 'jongno' },
  { id: 24, nameKo: '중구', nameEn: 'Jung-gu', slug: 'jung' },
  { id: 25, nameKo: '중랑구', nameEn: 'Jungnang-gu', slug: 'jungnang' },
];

// Popular neighborhoods for quick access
export const POPULAR_NEIGHBORHOODS = [
  { districtSlug: 'gangnam', nameKo: '신사동', nameEn: 'Sinsa-dong', slug: 'sinsa' },
  { districtSlug: 'gangnam', nameKo: '압구정동', nameEn: 'Apgujeong-dong', slug: 'apgujeong' },
  { districtSlug: 'gangnam', nameKo: '청담동', nameEn: 'Cheongdam-dong', slug: 'cheongdam' },
  { districtSlug: 'mapo', nameKo: '홍대', nameEn: 'Hongdae', slug: 'hongdae' },
  { districtSlug: 'mapo', nameKo: '연남동', nameEn: 'Yeonnam-dong', slug: 'yeonnam' },
  { districtSlug: 'mapo', nameKo: '합정동', nameEn: 'Hapjeong-dong', slug: 'hapjeong' },
  { districtSlug: 'yongsan', nameKo: '이태원', nameEn: 'Itaewon', slug: 'itaewon' },
  { districtSlug: 'yongsan', nameKo: '한남동', nameEn: 'Hannam-dong', slug: 'hannam' },
  { districtSlug: 'seongdong', nameKo: '성수동', nameEn: 'Seongsu-dong', slug: 'seongsu' },
  { districtSlug: 'jongno', nameKo: '삼청동', nameEn: 'Samcheong-dong', slug: 'samcheong' },
  { districtSlug: 'jongno', nameKo: '익선동', nameEn: 'Ikseon-dong', slug: 'ikseon' },
  { districtSlug: 'jung', nameKo: '을지로', nameEn: 'Euljiro', slug: 'euljiro' },
];

// Helper to get district by slug
export function getDistrictBySlug(slug: string): District | undefined {
  return SEOUL_DISTRICTS.find((d) => d.slug === slug);
}

// Helper to get district by ID
export function getDistrictById(id: number): District | undefined {
  return SEOUL_DISTRICTS.find((d) => d.id === id);
}
