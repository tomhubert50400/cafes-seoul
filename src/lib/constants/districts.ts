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

// Popular neighborhoods for quick access — each with a center point for proximity filtering
export const POPULAR_NEIGHBORHOODS = [
  { districtSlug: 'gangnam', districtId: 1, name: { ko: '신사동', en: 'Sinsa', fr: 'Sinsa', zh: '新沙', vi: 'Sinsa' }, slug: 'sinsa', lat: 37.5167, lng: 127.0203 },
  { districtSlug: 'gangnam', districtId: 1, name: { ko: '압구정동', en: 'Apgujeong', fr: 'Apgujeong', zh: '狎鸥亭', vi: 'Apgujeong' }, slug: 'apgujeong', lat: 37.5270, lng: 127.0285 },
  { districtSlug: 'gangnam', districtId: 1, name: { ko: '청담동', en: 'Cheongdam', fr: 'Cheongdam', zh: '清潭', vi: 'Cheongdam' }, slug: 'cheongdam', lat: 37.5244, lng: 127.0476 },
  { districtSlug: 'mapo', districtId: 13, name: { ko: '홍대', en: 'Hongdae', fr: 'Hongdae', zh: '弘大', vi: 'Hongdae' }, slug: 'hongdae', lat: 37.5563, lng: 126.9237 },
  { districtSlug: 'mapo', districtId: 13, name: { ko: '연남동', en: 'Yeonnam-dong', fr: 'Yeonnam', zh: '延南洞', vi: 'Yeonnam' }, slug: 'yeonnam', lat: 37.5660, lng: 126.9251 },
  { districtSlug: 'mapo', districtId: 13, name: { ko: '합정동', en: 'Hapjeong', fr: 'Hapjeong', zh: '合井', vi: 'Hapjeong' }, slug: 'hapjeong', lat: 37.5495, lng: 126.9137 },
  { districtSlug: 'mapo', districtId: 13, name: { ko: '망원동', en: 'Mangwon', fr: 'Mangwon', zh: '望远', vi: 'Mangwon' }, slug: 'mangwon', lat: 37.5564, lng: 126.9093 },
  { districtSlug: 'yongsan', districtId: 21, name: { ko: '이태원', en: 'Itaewon', fr: 'Itaewon', zh: '梨泰院', vi: 'Itaewon' }, slug: 'itaewon', lat: 37.5345, lng: 126.9946 },
  { districtSlug: 'yongsan', districtId: 21, name: { ko: '한남동', en: 'Hannam-dong', fr: 'Hannam', zh: '汉南洞', vi: 'Hannam' }, slug: 'hannam', lat: 37.5340, lng: 127.0025 },
  { districtSlug: 'yongsan', districtId: 21, name: { ko: '경리단길', en: 'Gyeongnidan-gil', fr: 'Gyeongnidan', zh: '经理团路', vi: 'Gyeongnidan' }, slug: 'gyeongnidan', lat: 37.5389, lng: 126.9883 },
  { districtSlug: 'seongdong', districtId: 16, name: { ko: '성수동', en: 'Seongsu', fr: 'Seongsu', zh: '圣水', vi: 'Seongsu' }, slug: 'seongsu', lat: 37.5445, lng: 127.0565 },
  { districtSlug: 'jongno', districtId: 23, name: { ko: '삼청동', en: 'Samcheong-dong', fr: 'Samcheong', zh: '三清洞', vi: 'Samcheong' }, slug: 'samcheong', lat: 37.5812, lng: 126.9822 },
  { districtSlug: 'jongno', districtId: 23, name: { ko: '익선동', en: 'Ikseon-dong', fr: 'Ikseon', zh: '益善洞', vi: 'Ikseon' }, slug: 'ikseon', lat: 37.5745, lng: 126.9881 },
  { districtSlug: 'jongno', districtId: 23, name: { ko: '북촌', en: 'Bukchon', fr: 'Bukchon', zh: '北村', vi: 'Bukchon' }, slug: 'bukchon', lat: 37.5826, lng: 126.9836 },
  { districtSlug: 'jung', districtId: 24, name: { ko: '을지로', en: 'Euljiro', fr: 'Euljiro', zh: '乙支路', vi: 'Euljiro' }, slug: 'euljiro', lat: 37.5665, lng: 126.9913 },
  { districtSlug: 'jung', districtId: 24, name: { ko: '명동', en: 'Myeongdong', fr: 'Myeongdong', zh: '明洞', vi: 'Myeongdong' }, slug: 'myeongdong', lat: 37.5636, lng: 126.9828 },
  { districtSlug: 'seocho', districtId: 15, name: { ko: '가로수길', en: 'Garosugil', fr: 'Garosugil', zh: '林荫道', vi: 'Garosugil' }, slug: 'garosugil', lat: 37.5188, lng: 127.0228 },
  { districtSlug: 'songpa', districtId: 18, name: { ko: '잠실', en: 'Jamsil', fr: 'Jamsil', zh: '蚕室', vi: 'Jamsil' }, slug: 'jamsil', lat: 37.5133, lng: 127.1001 },
  { districtSlug: 'gwangjin', districtId: 6, name: { ko: '건대', en: 'Konkuk (Kondae)', fr: 'Kondae', zh: '建大', vi: 'Kondae' }, slug: 'kondae', lat: 37.5404, lng: 127.0687 },
  { districtSlug: 'seodaemun', districtId: 14, name: { ko: '연희동', en: 'Yeonhui-dong', fr: 'Yeonhui', zh: '延禧洞', vi: 'Yeonhui' }, slug: 'yeonhui', lat: 37.5690, lng: 126.9310 },
];

// Radius in meters for neighborhood proximity filtering
export const NEIGHBORHOOD_RADIUS_M = 800;

// Haversine distance between two lat/lng points in meters
export function getDistanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helper to get district by slug
export function getDistrictBySlug(slug: string): District | undefined {
  return SEOUL_DISTRICTS.find((d) => d.slug === slug);
}

// Helper to get district by ID
export function getDistrictById(id: number): District | undefined {
  return SEOUL_DISTRICTS.find((d) => d.id === id);
}
