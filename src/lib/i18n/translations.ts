import { LanguageCode } from './languages';

/**
 * Get a translation string for a given language and key
 * Falls back to English if the translation is not found
 */
export function getTranslation(lang: LanguageCode, key: string): string {
  return translations[lang]?.[key] || translations['en']?.[key] || key;
}

export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Header & Navigation
    'nav.cafes': 'Cafes',
    'nav.map': 'Map',
    'nav.districts': 'Districts',
    'nav.login': 'Login',
    'nav.signup': 'Sign up',
    'nav.profile': 'Profile',
    'nav.myReviews': 'My Reviews',
    'nav.settings': 'Settings',
    'site.name': 'Seoul Cafe',

    // Homepage - Hero
    'home.hero.title1': 'Discover the',
    'home.hero.title2': 'Best Cafes',
    'home.hero.title3': 'in Seoul',
    'home.hero.subtitle': 'Find your perfect cafe with detailed info on WiFi, outlets, ambiance and more.',
    'home.hero.searchPlaceholder': 'Search by cafe name or area...',
    'home.hero.search': 'Search',
    'home.hero.popular': 'Popular:',

    // Homepage - Featured
    'home.featured.title': 'Featured Cafes',
    'home.featured.subtitle': 'Top rated cafes',
    'home.featured.viewAll': 'View all',

    // Homepage - Districts
    'home.districts.title': 'Browse by District',
    'home.districts.subtitle': 'Explore cafes across all 25 districts of Seoul',

    // Homepage - Features
    'home.features.title': 'Find Cafes Smarter',
    'home.features.subtitle': 'All the info you need at a glance',
    'home.features.facilities.title': 'Detailed Facilities',
    'home.features.facilities.desc': 'Check WiFi speed, outlet locations, and seating comfort in detail',
    'home.features.ratings.title': 'Multi-dimensional Ratings',
    'home.features.ratings.desc': 'Compare accurately with 9 category ratings: drinks, ambiance, value and more',
    'home.features.location.title': 'Location-based Search',
    'home.features.location.desc': 'Easily find cafes near you or in your preferred area',

    // Homepage - CTA
    'home.cta.title': 'Share your favorite cafes',
    'home.cta.subtitle': 'Write reviews and help others discover great cafes',
    'home.cta.button': 'Get Started',

    // Footer
    'footer.rights': '© 2025 Seoul Cafe Guide. All rights reserved.',

    // Cafes list page
    'cafes.title': 'Find Cafes',
    'cafes.subtitle': 'Discover cafes in Seoul with filters and search',
    'cafes.total': 'cafes',
    'cafes.noResults': 'No cafes match your criteria',
    'cafes.tryAgain': 'Try different search terms or filters',
    'cafes.prev': 'Previous',
    'cafes.next': 'Next',

    // Search & Filters
    'filter.searchPlaceholder': 'Search by cafe name or address...',
    'filter.district': 'District',
    'filter.cafeType': 'Cafe type',
    'filter.sort': 'Sort',
    'filter.clearAll': 'Clear filters',
    'filter.wifi': 'WiFi',
    'filter.outlets': 'Outlets',
    'filter.pet': 'Pet friendly',
    'filter.laptop': 'Laptop friendly',
    'filter.parking': 'Parking',
    'filter.outdoor': 'Outdoor',
    'sort.rating': 'Top rated',
    'sort.reviews': 'Most reviews',
    'sort.newest': 'Newest',

    // Cafe detail page
    'cafe.breadcrumb': 'Cafes',
    'cafe.reviews': 'reviews',
    'cafe.tabs.info': 'Info',
    'cafe.tabs.reviews': 'Reviews',
    'cafe.intro': 'About',
    'cafe.facilities': 'Facilities & Services',
    'cafe.detailedRatings': 'Detailed Ratings',
    'cafe.hours': 'Opening Hours',
    'cafe.closed': 'Closed',
    'cafe.location': 'Location & Contact',
    'cafe.naverMap': 'Naver Map',
    'cafe.kakaoMap': 'Kakao Map',
    'cafe.map': 'Map',
    'cafe.priceInfo': 'Price Info',
    'cafe.avgDrink': 'Average drink price:',
    'cafe.noReviews': 'No reviews yet',
    'cafe.writeFirst': 'Write the first review',
    'cafe.helpful': 'Helpful',

    // Features/Facilities
    'feature.wifi': 'WiFi',
    'feature.outlets': 'Outlets',
    'feature.laptop': 'Laptop friendly',
    'feature.pet': 'Pet friendly',
    'feature.parking': 'Parking',
    'feature.outdoor': 'Outdoor seating',
    'feature.reservation': 'Reservations',
    'feature.meeting': 'Meeting rooms',

    // Rating categories
    'rating.drinks': 'Drinks',
    'rating.food': 'Food',
    'rating.ambiance': 'Ambiance',
    'rating.seating': 'Seating',
    'rating.wifi': 'WiFi',
    'rating.outlets': 'Outlets',
    'rating.noise': 'Noise level',
    'rating.value': 'Value',
    'rating.temperature': 'Temperature',

    // Days of week
    'day.mon': 'Mon',
    'day.tue': 'Tue',
    'day.wed': 'Wed',
    'day.thu': 'Thu',
    'day.fri': 'Fri',
    'day.sat': 'Sat',
    'day.sun': 'Sun',

    // Not found page
    'notFound.title': 'Cafe not found',
    'notFound.message': 'The cafe you requested does not exist or has been removed.',
    'notFound.cafeList': 'Browse Cafes',
    'notFound.home': 'Go Home',

    // Map Filters
    'map.filters.title': 'Filters',
    'map.filters.clearAll': 'Clear all',
    'map.filters.active': 'active',
    'map.filters.ratings': 'Ratings',
    'map.filters.features': 'Features',
    'map.filters.any': 'Any',
    'map.filters.seating': 'Seating',
    'map.filters.wifi': 'WiFi',
    'map.filters.food': 'Food',
    'map.filters.drinks': 'Drinks',
    'map.filters.ambiance': 'Ambiance',
    'map.filters.outlets': 'Outlets',
    'map.filters.noise': 'Noise Level',
    'map.filters.value': 'Value',
    'map.filters.temperature': 'Temperature',
    'map.filters.hasWifi': 'Has WiFi',
    'map.filters.hasPowerOutlets': 'Power Outlets',
    'map.filters.isLaptopFriendly': 'Laptop Friendly',
    'map.filters.isPetFriendly': 'Pet Friendly',
    'map.filters.hasParking': 'Parking',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',

    // Auth pages
    'auth.login.title': 'Log in',
    'auth.login.submit': 'Log in',
    'auth.login.submitting': 'Logging in...',
    'auth.login.loading': 'Signing in...',
    'auth.login.rememberMe': 'Remember me',
    'auth.login.noAccount': "Don't have an account?",
    'auth.login.signupLink': 'Sign up',
    'auth.login.error.invalid': 'Invalid email or password',
    'auth.login.error.unverified': 'Please verify your email first',
    'auth.login.resend': 'Resend verification email',
    'auth.login.resendSuccess': 'Verification email sent! Check your inbox.',

    'auth.signup.title': 'Create account',
    'auth.signup.submit': 'Create account',
    'auth.signup.submitting': 'Creating account...',
    'auth.signup.loading': 'Creating account...',
    'auth.signup.hasAccount': 'Already have an account?',
    'auth.signup.loginLink': 'Log in',
    'auth.signup.checkEmail': 'Check your email to confirm your account',

    'auth.logout': 'Log out',

    'auth.loading.cancel': 'Cancel',

    'auth.form.email': 'Email',
    'auth.form.password': 'Password',
    'auth.form.showPassword': 'Show password',
    'auth.form.hidePassword': 'Hide password',
    'auth.form.emailPlaceholder': 'you@example.com',
    'auth.form.passwordPlaceholder': 'Enter your password',
    'auth.form.passwordCreatePlaceholder': 'Create a password',

    'auth.password.weak': 'Weak',
    'auth.password.fair': 'Fair',
    'auth.password.good': 'Good',
    'auth.password.strong': 'Strong',

    'auth.password.strength.weak': 'Weak',
    'auth.password.strength.fair': 'Fair',
    'auth.password.strength.good': 'Good',
    'auth.password.strength.strong': 'Strong',
    'auth.password.criteria.length': 'At least 8 characters',
    'auth.password.criteria.uppercase': 'Contains uppercase letter',
    'auth.password.criteria.lowercase': 'Contains lowercase letter',
    'auth.password.criteria.number': 'Contains number',
    'auth.password.criteria.special': 'Contains special character',
    'auth.password.label': 'Password strength',
    'auth.password.hint': 'Make it strong',

    'auth.error.emailRequired': 'Email is required',
    'auth.error.emailInvalid': 'Invalid email address',
    'auth.error.passwordRequired': 'Password is required',
    'auth.error.passwordMin': 'Password must be at least 8 characters',
    'auth.error.verifyFailed': 'Unable to verify email',
    'auth.error.verification_failed': 'Email verification failed. The link may have expired or already been used.',
    'auth.error.missing_verification_params': 'Invalid verification link. Please request a new verification email.',
    'auth.error.user_not_found': 'User not found. Please check your email or sign up again.',

    // OAuth
    'auth.oauth.divider': 'or',
    'auth.oauth.kakao': 'Continue with Kakao',
    'auth.oauth.google': 'Continue with Google',
    'auth.oauth.loading': 'Loading...',
    'auth.oauth.cancelled': 'Login cancelled',
    'auth.oauth.unavailable.google': 'Google login is temporarily unavailable',
    'auth.oauth.unavailable.kakao': 'Kakao login is temporarily unavailable',
    'auth.oauth.error.expired': 'Login took too long. Please try again.',
    'auth.oauth.error.default': 'OAuth authentication failed',

    // Profile Page
    'profile.title': 'Profile',
    'profile.overview': 'Overview',
    'profile.reviews': 'My Reviews',
    'profile.favorites': 'Favorites',
    'profile.settings': 'Settings',
    'profile.accountInfo': 'Account Information',
    'profile.activity': 'Activity',
    'profile.memberSince': 'Member since',
    'profile.editProfile': 'Edit Profile',
    'profile.comingSoon': 'Coming Soon',
    'profile.featureSoon': 'This feature will be available soon',

    // Toast Notifications
    'auth.toast.error.title': 'Error',
    'auth.toast.error.multiple': '{count} errors found',
    'auth.toast.success.login': 'Welcome back!',
    'auth.toast.success.signup': 'Account created!',
    'auth.toast.success.logout': 'Logged out successfully',
    'auth.toast.success.resend': 'Verification email sent',

    // Verify Email Page
    'auth.verify.title': 'Check your email',
    'auth.verify.message': 'We sent a verification link to:',
    'auth.verify.instructions': 'Click the link in your email to activate your account',
    'auth.verify.resend': 'Resend email',
    'auth.verify.back': 'Back to sign up',
    'auth.verify.already': 'Your email may already be verified. Try logging in.',
    'auth.verify.verified_login': 'Email verified! Please log in.',
  },

  ko: {
    // Header & Navigation
    'nav.cafes': '카페 찾기',
    'nav.map': '지도',
    'nav.districts': '지역별',
    'nav.login': '로그인',
    'nav.signup': '회원가입',
    'nav.profile': '프로필',
    'nav.myReviews': '내 리뷰',
    'nav.settings': '설정',
    'site.name': '서울 카페',

    // Homepage - Hero
    'home.hero.title1': '서울의',
    'home.hero.title2': '베스트 카페',
    'home.hero.title3': '를 찾아보세요',
    'home.hero.subtitle': '와이파이, 콘센트, 분위기 등 상세한 정보로 당신에게 딱 맞는 카페를 발견하세요.',
    'home.hero.searchPlaceholder': '카페 이름, 지역으로 검색...',
    'home.hero.search': '검색',
    'home.hero.popular': '인기:',

    // Homepage - Featured
    'home.featured.title': '인기 카페',
    'home.featured.subtitle': '가장 높은 평점의 카페들',
    'home.featured.viewAll': '전체 보기',

    // Homepage - Districts
    'home.districts.title': '지역별 카페',
    'home.districts.subtitle': '서울 25개 구별로 카페를 탐색하세요',

    // Homepage - Features
    'home.features.title': '더 똑똑하게 카페 찾기',
    'home.features.subtitle': '당신이 필요한 정보를 한눈에',
    'home.features.facilities.title': '상세한 시설 정보',
    'home.features.facilities.desc': '와이파이 속도, 콘센트 위치, 좌석 편안함까지 상세하게 확인하세요',
    'home.features.ratings.title': '다차원 평점',
    'home.features.ratings.desc': '음료, 분위기, 가성비 등 9가지 카테고리별 평점으로 정확한 비교',
    'home.features.location.title': '위치 기반 검색',
    'home.features.location.desc': '현재 위치 주변 또는 원하는 지역의 카페를 쉽게 찾아보세요',

    // Homepage - CTA
    'home.cta.title': '좋아하는 카페를 공유해주세요',
    'home.cta.subtitle': '리뷰를 작성하고 다른 사람들이 좋은 카페를 발견할 수 있도록 도와주세요',
    'home.cta.button': '시작하기',

    // Footer
    'footer.rights': '© 2025 Seoul Cafe Guide. All rights reserved.',

    // Cafes list page
    'cafes.title': '카페 찾기',
    'cafes.subtitle': '서울의 다양한 카페를 필터와 검색으로 찾아보세요',
    'cafes.total': '개의 카페',
    'cafes.noResults': '조건에 맞는 카페가 없습니다',
    'cafes.tryAgain': '다른 검색어나 필터를 시도해보세요',
    'cafes.prev': '이전',
    'cafes.next': '다음',

    // Search & Filters
    'filter.searchPlaceholder': '카페 이름, 주소로 검색...',
    'filter.district': '지역',
    'filter.cafeType': '카페 유형',
    'filter.sort': '정렬',
    'filter.clearAll': '필터 초기화',
    'filter.wifi': '와이파이',
    'filter.outlets': '콘센트',
    'filter.pet': '반려동물',
    'filter.laptop': '노트북',
    'filter.parking': '주차',
    'filter.outdoor': '야외석',
    'sort.rating': '평점순',
    'sort.reviews': '리뷰 많은순',
    'sort.newest': '최신순',

    // Cafe detail page
    'cafe.breadcrumb': '카페',
    'cafe.reviews': '개의 리뷰',
    'cafe.tabs.info': '정보',
    'cafe.tabs.reviews': '리뷰',
    'cafe.intro': '소개',
    'cafe.facilities': '시설 & 서비스',
    'cafe.detailedRatings': '세부 평점',
    'cafe.hours': '영업 시간',
    'cafe.closed': '휴무',
    'cafe.location': '위치 & 연락처',
    'cafe.naverMap': '네이버 지도',
    'cafe.kakaoMap': '카카오 지도',
    'cafe.map': '지도',
    'cafe.priceInfo': '가격 정보',
    'cafe.avgDrink': '평균 음료 가격:',
    'cafe.noReviews': '아직 리뷰가 없습니다',
    'cafe.writeFirst': '첫 리뷰 작성하기',
    'cafe.helpful': '도움이 됐어요',

    // Features/Facilities
    'feature.wifi': '와이파이',
    'feature.outlets': '콘센트',
    'feature.laptop': '노트북 친화',
    'feature.pet': '반려동물',
    'feature.parking': '주차',
    'feature.outdoor': '야외석',
    'feature.reservation': '예약',
    'feature.meeting': '미팅룸',

    // Rating categories
    'rating.drinks': '음료',
    'rating.food': '음식',
    'rating.ambiance': '분위기',
    'rating.seating': '좌석',
    'rating.wifi': '와이파이',
    'rating.outlets': '콘센트',
    'rating.noise': '소음',
    'rating.value': '가성비',
    'rating.temperature': '온도',

    // Days of week
    'day.mon': '월',
    'day.tue': '화',
    'day.wed': '수',
    'day.thu': '목',
    'day.fri': '금',
    'day.sat': '토',
    'day.sun': '일',

    // Not found page
    'notFound.title': '카페를 찾을 수 없습니다',
    'notFound.message': '요청하신 카페가 존재하지 않거나 삭제되었을 수 있습니다.',
    'notFound.cafeList': '카페 목록으로',
    'notFound.home': '홈으로',

    // Map Filters
    'map.filters.title': '필터',
    'map.filters.clearAll': '모두 지우기',
    'map.filters.active': '활성',
    'map.filters.ratings': '평점',
    'map.filters.features': '특징',
    'map.filters.any': '무관',
    'map.filters.seating': '좌석',
    'map.filters.wifi': '와이파이',
    'map.filters.food': '음식',
    'map.filters.drinks': '음료',
    'map.filters.ambiance': '분위기',
    'map.filters.outlets': '콘센트',
    'map.filters.noise': '소음 수준',
    'map.filters.value': '가성비',
    'map.filters.temperature': '온도',
    'map.filters.hasWifi': '와이파이 있음',
    'map.filters.hasPowerOutlets': '콘센트 있음',
    'map.filters.isLaptopFriendly': '노트북 가능',
    'map.filters.isPetFriendly': '반려동물 가능',
    'map.filters.hasParking': '주차',

    // Common
    'common.loading': '로딩 중...',
    'common.error': '오류가 발생했습니다',

    // Auth pages
    'auth.login.title': '로그인',
    'auth.login.submit': '로그인',
    'auth.login.submitting': '로그인 중...',
    'auth.login.loading': '로그인 중...',
    'auth.login.rememberMe': '로그인 상태 유지',
    'auth.login.noAccount': '계정이 없으신가요?',
    'auth.login.signupLink': '회원가입',
    'auth.login.error.invalid': '이메일 또는 비밀번호가 올바르지 않습니다',
    'auth.login.error.unverified': '먼저 이메일을 인증해주세요',
    'auth.login.resend': '인증 이메일 다시 보내기',
    'auth.login.resendSuccess': '인증 이메일을 보냈습니다! 이메일을 확인해주세요.',

    'auth.signup.title': '회원가입',
    'auth.signup.submit': '계정 만들기',
    'auth.signup.submitting': '계정 생성 중...',
    'auth.signup.loading': '계정 생성 중...',
    'auth.signup.hasAccount': '이미 계정이 있으신가요?',
    'auth.signup.loginLink': '로그인',
    'auth.signup.checkEmail': '이메일을 확인하여 계정을 인증해주세요',

    'auth.logout': '로그아웃',

    'auth.loading.cancel': '취소',

    'auth.form.email': '이메일',
    'auth.form.password': '비밀번호',
    'auth.form.showPassword': '비밀번호 표시',
    'auth.form.hidePassword': '비밀번호 숨기기',
    'auth.form.emailPlaceholder': 'you@example.com',
    'auth.form.passwordPlaceholder': '비밀번호를 입력하세요',
    'auth.form.passwordCreatePlaceholder': '비밀번호를 생성하세요',

    'auth.password.weak': '약함',
    'auth.password.fair': '보통',
    'auth.password.good': '좋음',
    'auth.password.strong': '강함',

    'auth.password.strength.weak': '약함',
    'auth.password.strength.fair': '보통',
    'auth.password.strength.good': '좋음',
    'auth.password.strength.strong': '강함',
    'auth.password.criteria.length': '8자 이상',
    'auth.password.criteria.uppercase': '대문자 포함',
    'auth.password.criteria.lowercase': '소문자 포함',
    'auth.password.criteria.number': '숫자 포함',
    'auth.password.criteria.special': '특수문자 포함',
    'auth.password.label': '비밀번호 강도',
    'auth.password.hint': '강하게 만드세요',

    'auth.error.emailRequired': '이메일을 입력해주세요',
    'auth.error.emailInvalid': '올바른 이메일 형식이 아닙니다',
    'auth.error.passwordRequired': '비밀번호를 입력해주세요',
    'auth.error.passwordMin': '비밀번호는 8자 이상이어야 합니다',
    'auth.error.verifyFailed': '이메일 인증에 실패했습니다',
    'auth.error.verification_failed': '이메일 인증에 실패했습니다. 링크가 만료되었거나 이미 사용되었을 수 있습니다.',
    'auth.error.missing_verification_params': '잘못된 인증 링크입니다. 새 인증 이메일을 요청해주세요.',
    'auth.error.user_not_found': '사용자를 찾을 수 없습니다. 이메일을 확인하거나 다시 가입해주세요.',

    // OAuth
    'auth.oauth.divider': '또는',
    'auth.oauth.kakao': '카카오로 계속하기',
    'auth.oauth.google': 'Google로 계속하기',
    'auth.oauth.loading': '로딩 중...',
    'auth.oauth.cancelled': '로그인이 취소되었습니다',
    'auth.oauth.unavailable.google': 'Google 로그인이 일시적으로 사용 불가합니다',
    'auth.oauth.unavailable.kakao': '카카오 로그인이 일시적으로 사용 불가합니다',
    'auth.oauth.error.expired': '로그인 시간이 초과되었습니다. 다시 시도해주세요.',
    'auth.oauth.error.default': 'OAuth 인증에 실패했습니다',

    // Profile Page
    'profile.title': '프로필',
    'profile.overview': '개요',
    'profile.reviews': '내 리뷰',
    'profile.favorites': '즐겨찾기',
    'profile.settings': '설정',
    'profile.accountInfo': '계정 정보',
    'profile.activity': '활동',
    'profile.memberSince': '가입일',
    'profile.editProfile': '프로필 수정',
    'profile.comingSoon': '준비 중',
    'profile.featureSoon': '이 기능은 곧 제공될 예정입니다',

    // Toast Notifications
    'auth.toast.error.title': '오류',
    'auth.toast.error.multiple': '오류 {count}개 발견',
    'auth.toast.success.login': '다시 오신 것을 환영합니다!',
    'auth.toast.success.signup': '계정이 생성되었습니다!',
    'auth.toast.success.logout': '로그아웃되었습니다',
    'auth.toast.success.resend': '인증 이메일이 발송되었습니다',

    // Verify Email Page
    'auth.verify.title': '이메일을 확인해주세요',
    'auth.verify.message': '다음 주소로 인증 링크를 본냈습니다:',
    'auth.verify.instructions': '이메일의 링크를 클릭하여 계정을 활성화하세요',
    'auth.verify.resend': '이메일 다시 본내기',
    'auth.verify.back': '회원가입으로 돌아가기',
    'auth.verify.already': '이메일이 이미 인증되었을 수 있습니다. 로그인을 시도핳세요.',
    'auth.verify.verified_login': '이메일이 인증되었습니다! 로그인해주세요.',
  },

  fr: {
    // Header & Navigation
    'nav.cafes': 'Cafés',
    'nav.map': 'Carte',
    'nav.districts': 'Quartiers',
    'nav.login': 'Connexion',
    'nav.signup': 'Inscription',
    'nav.profile': 'Profil',
    'nav.myReviews': 'Mes avis',
    'nav.settings': 'Paramètres',
    'site.name': 'Cafés Séoul',

    // Homepage - Hero
    'home.hero.title1': 'Découvrez les',
    'home.hero.title2': 'Meilleurs Cafés',
    'home.hero.title3': 'de Séoul',
    'home.hero.subtitle': 'Trouvez le café parfait avec des infos détaillées sur le WiFi, les prises, l\'ambiance et plus.',
    'home.hero.searchPlaceholder': 'Rechercher par nom ou quartier...',
    'home.hero.search': 'Rechercher',
    'home.hero.popular': 'Populaires :',

    // Homepage - Featured
    'home.featured.title': 'Cafés en vedette',
    'home.featured.subtitle': 'Les cafés les mieux notés',
    'home.featured.viewAll': 'Voir tout',

    // Homepage - Districts
    'home.districts.title': 'Par quartier',
    'home.districts.subtitle': 'Explorez les cafés dans les 25 districts de Séoul',

    // Homepage - Features
    'home.features.title': 'Trouvez plus intelligemment',
    'home.features.subtitle': 'Toutes les infos en un coup d\'œil',
    'home.features.facilities.title': 'Équipements détaillés',
    'home.features.facilities.desc': 'Vérifiez la vitesse WiFi, l\'emplacement des prises et le confort des sièges',
    'home.features.ratings.title': 'Notes multidimensionnelles',
    'home.features.ratings.desc': 'Comparez avec précision grâce aux notes dans 9 catégories',
    'home.features.location.title': 'Recherche par localisation',
    'home.features.location.desc': 'Trouvez facilement des cafés près de vous ou dans votre quartier préféré',

    // Homepage - CTA
    'home.cta.title': 'Partagez vos cafés préférés',
    'home.cta.subtitle': 'Écrivez des avis et aidez les autres à découvrir de super cafés',
    'home.cta.button': 'Commencer',

    // Footer
    'footer.rights': '© 2025 Seoul Cafe Guide. Tous droits réservés.',

    // Cafes list page
    'cafes.title': 'Trouver un café',
    'cafes.subtitle': 'Découvrez les cafés de Séoul avec filtres et recherche',
    'cafes.total': 'cafés',
    'cafes.noResults': 'Aucun café ne correspond à vos critères',
    'cafes.tryAgain': 'Essayez d\'autres termes ou filtres',
    'cafes.prev': 'Précédent',
    'cafes.next': 'Suivant',

    // Search & Filters
    'filter.searchPlaceholder': 'Rechercher par nom ou adresse...',
    'filter.district': 'Quartier',
    'filter.cafeType': 'Type de café',
    'filter.sort': 'Trier',
    'filter.clearAll': 'Effacer les filtres',
    'filter.wifi': 'WiFi',
    'filter.outlets': 'Prises',
    'filter.pet': 'Animaux',
    'filter.laptop': 'Laptop',
    'filter.parking': 'Parking',
    'filter.outdoor': 'Terrasse',
    'sort.rating': 'Mieux notés',
    'sort.reviews': 'Plus d\'avis',
    'sort.newest': 'Plus récents',

    // Cafe detail page
    'cafe.breadcrumb': 'Cafés',
    'cafe.reviews': 'avis',
    'cafe.tabs.info': 'Infos',
    'cafe.tabs.reviews': 'Avis',
    'cafe.intro': 'À propos',
    'cafe.facilities': 'Équipements & Services',
    'cafe.detailedRatings': 'Notes détaillées',
    'cafe.hours': 'Horaires d\'ouverture',
    'cafe.closed': 'Fermé',
    'cafe.location': 'Localisation & Contact',
    'cafe.naverMap': 'Naver Map',
    'cafe.kakaoMap': 'Kakao Map',
    'cafe.map': 'Carte',
    'cafe.priceInfo': 'Prix',
    'cafe.avgDrink': 'Prix moyen d\'une boisson :',
    'cafe.noReviews': 'Pas encore d\'avis',
    'cafe.writeFirst': 'Écrire le premier avis',
    'cafe.helpful': 'Utile',

    // Features/Facilities
    'feature.wifi': 'WiFi',
    'feature.outlets': 'Prises',
    'feature.laptop': 'Laptop friendly',
    'feature.pet': 'Animaux acceptés',
    'feature.parking': 'Parking',
    'feature.outdoor': 'Terrasse',
    'feature.reservation': 'Réservation',
    'feature.meeting': 'Salles de réunion',

    // Rating categories
    'rating.drinks': 'Boissons',
    'rating.food': 'Nourriture',
    'rating.ambiance': 'Ambiance',
    'rating.seating': 'Places assises',
    'rating.wifi': 'WiFi',
    'rating.outlets': 'Prises',
    'rating.noise': 'Niveau sonore',
    'rating.value': 'Rapport qualité-prix',
    'rating.temperature': 'Température',

    // Days of week
    'day.mon': 'Lun',
    'day.tue': 'Mar',
    'day.wed': 'Mer',
    'day.thu': 'Jeu',
    'day.fri': 'Ven',
    'day.sat': 'Sam',
    'day.sun': 'Dim',

    // Not found page
    'notFound.title': 'Café introuvable',
    'notFound.message': 'Le café demandé n\'existe pas ou a été supprimé.',
    'notFound.cafeList': 'Liste des cafés',
    'notFound.home': 'Accueil',

    // Map Filters
    'map.filters.title': 'Filtres',
    'map.filters.clearAll': 'Tout effacer',
    'map.filters.active': 'actif',
    'map.filters.ratings': 'Notes',
    'map.filters.features': 'Caractéristiques',
    'map.filters.any': 'Tout',
    'map.filters.seating': 'Sièges',
    'map.filters.wifi': 'WiFi',
    'map.filters.food': 'Nourriture',
    'map.filters.drinks': 'Boissons',
    'map.filters.ambiance': 'Ambiance',
    'map.filters.outlets': 'Prises',
    'map.filters.noise': 'Niveau de bruit',
    'map.filters.value': 'Rapport qualité-prix',
    'map.filters.temperature': 'Température',
    'map.filters.hasWifi': 'WiFi disponible',
    'map.filters.hasPowerOutlets': 'Prises électriques',
    'map.filters.isLaptopFriendly': 'Laptop friendly',
    'map.filters.isPetFriendly': 'Animaux acceptés',
    'map.filters.hasParking': 'Parking',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Une erreur est survenue',

    // Auth pages
    'auth.login.title': 'Connexion',
    'auth.login.submit': 'Se connecter',
    'auth.login.submitting': 'Connexion en cours...',
    'auth.login.loading': 'Connexion en cours...',
    'auth.login.rememberMe': 'Se souvenir de moi',
    'auth.login.noAccount': "Pas encore de compte ?",
    'auth.login.signupLink': "S'inscrire",
    'auth.login.error.invalid': 'Email ou mot de passe invalide',
    'auth.login.error.unverified': 'Veuillez d\'abord vérifier votre email',
    'auth.login.resend': 'Renvoyer l\'email de vérification',
    'auth.login.resendSuccess': 'Email de vérification envoyé ! Consultez votre boîte mail.',

    'auth.signup.title': 'Créer un compte',
    'auth.signup.submit': 'Créer un compte',
    'auth.signup.submitting': 'Création du compte...',
    'auth.signup.loading': 'Création du compte...',
    'auth.signup.hasAccount': 'Vous avez déjà un compte ?',
    'auth.signup.loginLink': 'Se connecter',
    'auth.signup.checkEmail': 'Consultez votre email pour confirmer votre compte',

    'auth.logout': 'Se déconnecter',

    'auth.loading.cancel': 'Annuler',

    'auth.form.email': 'Email',
    'auth.form.password': 'Mot de passe',
    'auth.form.showPassword': 'Afficher le mot de passe',
    'auth.form.hidePassword': 'Masquer le mot de passe',
    'auth.form.emailPlaceholder': 'vous@exemple.com',
    'auth.form.passwordPlaceholder': 'Entrez votre mot de passe',
    'auth.form.passwordCreatePlaceholder': 'Créez un mot de passe',

    'auth.password.weak': 'Faible',
    'auth.password.fair': 'Moyen',
    'auth.password.good': 'Bon',
    'auth.password.strong': 'Fort',

    'auth.password.strength.weak': 'Faible',
    'auth.password.strength.fair': 'Moyen',
    'auth.password.strength.good': 'Bon',
    'auth.password.strength.strong': 'Fort',
    'auth.password.criteria.length': 'Au moins 8 caractères',
    'auth.password.criteria.uppercase': 'Contient une majuscule',
    'auth.password.criteria.lowercase': 'Contient une minuscule',
    'auth.password.criteria.number': 'Contient un chiffre',
    'auth.password.criteria.special': 'Contient un caractère spécial',
    'auth.password.label': 'Force du mot de passe',
    'auth.password.hint': 'Rendez-le fort',

    'auth.error.emailRequired': 'L\'email est requis',
    'auth.error.emailInvalid': 'Adresse email invalide',
    'auth.error.passwordRequired': 'Le mot de passe est requis',
    'auth.error.passwordMin': 'Le mot de passe doit contenir au moins 8 caractères',
    'auth.error.verifyFailed': 'Impossible de vérifier l\'email',
    'auth.error.verification_failed': 'La vérification de l\'email a échoué. Le lien peut avoir expiré ou déjà été utilisé.',
    'auth.error.missing_verification_params': 'Lien de vérification invalide. Veuillez demander un nouvel email de vérification.',
    'auth.error.user_not_found': 'Utilisateur non trouvé. Veuillez vérifier votre email ou vous réinscrire.',

    // OAuth
    'auth.oauth.divider': 'ou',
    'auth.oauth.kakao': 'Continuer avec Kakao',
    'auth.oauth.google': 'Continuer avec Google',
    'auth.oauth.loading': 'Chargement...',
    'auth.oauth.cancelled': 'Connexion annulée',
    'auth.oauth.unavailable.google': 'La connexion Google est temporairement indisponible',
    'auth.oauth.unavailable.kakao': 'La connexion Kakao est temporairement indisponible',
    'auth.oauth.error.expired': 'La connexion a pris trop de temps. Veuillez réessayer.',
    'auth.oauth.error.default': 'L\'authentification OAuth a échoué',

    // Profile Page
    'profile.title': 'Profil',
    'profile.overview': 'Aperçu',
    'profile.reviews': 'Mes avis',
    'profile.favorites': 'Favoris',
    'profile.settings': 'Paramètres',
    'profile.accountInfo': 'Informations du compte',
    'profile.activity': 'Activité',
    'profile.memberSince': 'Membre depuis',
    'profile.editProfile': 'Modifier le profil',
    'profile.comingSoon': 'Bientôt disponible',
    'profile.featureSoon': 'Cette fonctionnalité sera bientôt disponible',

    // Toast Notifications
    'auth.toast.error.title': 'Erreur',
    'auth.toast.error.multiple': '{count} erreurs trouvées',
    'auth.toast.success.login': 'Bon retour !',
    'auth.toast.success.signup': 'Compte créé !',
    'auth.toast.success.logout': 'Déconnexion réussie',
    'auth.toast.success.resend': 'Email de vérification envoyé',

    // Verify Email Page
    'auth.verify.title': 'Vérifiez votre email',
    'auth.verify.message': 'Nous avons envoyé un lien de vérification à :',
    'auth.verify.instructions': 'Cliquez sur le lien dans votre email pour activer votre compte',
    'auth.verify.resend': 'Renvoyer l\'email',
    'auth.verify.back': 'Retour à l\'inscription',
    'auth.verify.already': 'Votre email est peut-être déjà vérifié. Essayez de vous connecter.',
    'auth.verify.verified_login': 'Email vérifié ! Veuillez vous connecter.',
  },

  zh: {
    // Header & Navigation
    'nav.cafes': '咖啡馆',
    'nav.map': '地图',
    'nav.districts': '地区',
    'nav.login': '登录',
    'nav.signup': '注册',
    'nav.profile': '个人资料',
    'nav.myReviews': '我的评论',
    'nav.settings': '设置',
    'site.name': '首尔咖啡',

    // Homepage - Hero
    'home.hero.title1': '发现首尔',
    'home.hero.title2': '最佳咖啡馆',
    'home.hero.title3': '',
    'home.hero.subtitle': '通过WiFi、插座、氛围等详细信息，找到最适合您的咖啡馆。',
    'home.hero.searchPlaceholder': '按咖啡馆名称或地区搜索...',
    'home.hero.search': '搜索',
    'home.hero.popular': '热门：',

    // Homepage - Featured
    'home.featured.title': '精选咖啡馆',
    'home.featured.subtitle': '评分最高的咖啡馆',
    'home.featured.viewAll': '查看全部',

    // Homepage - Districts
    'home.districts.title': '按地区浏览',
    'home.districts.subtitle': '探索首尔25个区的咖啡馆',

    // Homepage - Features
    'home.features.title': '更智能地找咖啡馆',
    'home.features.subtitle': '一目了然所有信息',
    'home.features.facilities.title': '详细设施信息',
    'home.features.facilities.desc': '详细查看WiFi速度、插座位置和座位舒适度',
    'home.features.ratings.title': '多维度评分',
    'home.features.ratings.desc': '通过9个类别的评分进行准确比较：饮品、氛围、性价比等',
    'home.features.location.title': '位置搜索',
    'home.features.location.desc': '轻松找到您附近或首选地区的咖啡馆',

    // Homepage - CTA
    'home.cta.title': '分享您喜欢的咖啡馆',
    'home.cta.subtitle': '写评论，帮助他人发现好咖啡馆',
    'home.cta.button': '开始',

    // Footer
    'footer.rights': '© 2025 Seoul Cafe Guide. 保留所有权利。',

    // Cafes list page
    'cafes.title': '查找咖啡馆',
    'cafes.subtitle': '使用筛选和搜索发现首尔的咖啡馆',
    'cafes.total': '家咖啡馆',
    'cafes.noResults': '没有符合条件的咖啡馆',
    'cafes.tryAgain': '尝试不同的搜索词或筛选条件',
    'cafes.prev': '上一页',
    'cafes.next': '下一页',

    // Search & Filters
    'filter.searchPlaceholder': '按名称或地址搜索...',
    'filter.district': '地区',
    'filter.cafeType': '咖啡馆类型',
    'filter.sort': '排序',
    'filter.clearAll': '清除筛选',
    'filter.wifi': 'WiFi',
    'filter.outlets': '插座',
    'filter.pet': '宠物友好',
    'filter.laptop': '适合办公',
    'filter.parking': '停车场',
    'filter.outdoor': '户外座位',
    'sort.rating': '评分最高',
    'sort.reviews': '评论最多',
    'sort.newest': '最新',

    // Cafe detail page
    'cafe.breadcrumb': '咖啡馆',
    'cafe.reviews': '条评论',
    'cafe.tabs.info': '信息',
    'cafe.tabs.reviews': '评论',
    'cafe.intro': '简介',
    'cafe.facilities': '设施与服务',
    'cafe.detailedRatings': '详细评分',
    'cafe.hours': '营业时间',
    'cafe.closed': '休息',
    'cafe.location': '位置与联系',
    'cafe.naverMap': 'Naver地图',
    'cafe.kakaoMap': 'Kakao地图',
    'cafe.map': '地图',
    'cafe.priceInfo': '价格信息',
    'cafe.avgDrink': '平均饮品价格：',
    'cafe.noReviews': '暂无评论',
    'cafe.writeFirst': '写第一条评论',
    'cafe.helpful': '有帮助',

    // Features/Facilities
    'feature.wifi': 'WiFi',
    'feature.outlets': '插座',
    'feature.laptop': '适合办公',
    'feature.pet': '宠物友好',
    'feature.parking': '停车场',
    'feature.outdoor': '户外座位',
    'feature.reservation': '可预约',
    'feature.meeting': '会议室',

    // Rating categories
    'rating.drinks': '饮品',
    'rating.food': '食物',
    'rating.ambiance': '氛围',
    'rating.seating': '座位',
    'rating.wifi': 'WiFi',
    'rating.outlets': '插座',
    'rating.noise': '噪音',
    'rating.value': '性价比',
    'rating.temperature': '温度',

    // Days of week
    'day.mon': '周一',
    'day.tue': '周二',
    'day.wed': '周三',
    'day.thu': '周四',
    'day.fri': '周五',
    'day.sat': '周六',
    'day.sun': '周日',

    // Not found page
    'notFound.title': '找不到咖啡馆',
    'notFound.message': '您请求的咖啡馆不存在或已被删除。',
    'notFound.cafeList': '浏览咖啡馆',
    'notFound.home': '返回首页',

    // Map Filters
    'map.filters.title': '筛选',
    'map.filters.clearAll': '清除全部',
    'map.filters.active': '活跃',
    'map.filters.ratings': '评分',
    'map.filters.features': '特点',
    'map.filters.any': '任何',
    'map.filters.seating': '座位',
    'map.filters.wifi': '无线网络',
    'map.filters.food': '食物',
    'map.filters.drinks': '饮料',
    'map.filters.ambiance': '氛围',
    'map.filters.outlets': '插座',
    'map.filters.noise': '噪音水平',
    'map.filters.value': '性价比',
    'map.filters.temperature': '温度',
    'map.filters.hasWifi': '有无线网络',
    'map.filters.hasPowerOutlets': '有插座',
    'map.filters.isLaptopFriendly': '适合笔记本',
    'map.filters.isPetFriendly': '宠物友好',
    'map.filters.hasParking': '停车',

    // Common
    'common.loading': '加载中...',
    'common.error': '发生错误',

    // Auth pages
    'auth.login.title': '登录',
    'auth.login.submit': '登录',
    'auth.login.submitting': '登录中...',
    'auth.login.loading': '登录中...',
    'auth.login.rememberMe': '记住我',
    'auth.login.noAccount': '还没有账户？',
    'auth.login.signupLink': '注册',
    'auth.login.error.invalid': '邮箱或密码无效',
    'auth.login.error.unverified': '请先验证您的邮箱',
    'auth.login.resend': '重新发送验证邮件',
    'auth.login.resendSuccess': '验证邮件已发送！请查看您的邮箱。',

    'auth.signup.title': '创建账户',
    'auth.signup.submit': '创建账户',
    'auth.signup.submitting': '创建账户中...',
    'auth.signup.loading': '创建账户中...',
    'auth.signup.hasAccount': '已有账户？',
    'auth.signup.loginLink': '登录',
    'auth.signup.checkEmail': '请查看您的邮箱以确认账户',

    'auth.logout': '登出',

    'auth.loading.cancel': '取消',

    'auth.form.email': '邮箱',
    'auth.form.password': '密码',
    'auth.form.showPassword': '显示密码',
    'auth.form.hidePassword': '隐藏密码',
    'auth.form.emailPlaceholder': 'you@example.com',
    'auth.form.passwordPlaceholder': '请输入密码',
    'auth.form.passwordCreatePlaceholder': '创建密码',

    'auth.password.weak': '弱',
    'auth.password.fair': '一般',
    'auth.password.good': '好',
    'auth.password.strong': '强',

    'auth.password.strength.weak': '弱',
    'auth.password.strength.fair': '一般',
    'auth.password.strength.good': '良好',
    'auth.password.strength.strong': '强',
    'auth.password.criteria.length': '至少8个字符',
    'auth.password.criteria.uppercase': '包含大写字母',
    'auth.password.criteria.lowercase': '包含小写字母',
    'auth.password.criteria.number': '包含数字',
    'auth.password.criteria.special': '包含特殊字符',
    'auth.password.label': '密码强度',
    'auth.password.hint': '让它更强',

    'auth.error.emailRequired': '邮箱为必填项',
    'auth.error.emailInvalid': '邮箱地址无效',
    'auth.error.passwordRequired': '密码为必填项',
    'auth.error.passwordMin': '密码必须至少8个字符',
    'auth.error.verifyFailed': '无法验证邮箱',
    'auth.error.verification_failed': '邮箱验证失败。链接可能已过期或已被使用。',
    'auth.error.missing_verification_params': '无效的验证链接。请请求新的验证邮件。',
    'auth.error.user_not_found': '未找到用户。请检查您的邮箱或重新注册。',

    // OAuth
    'auth.oauth.divider': '或',
    'auth.oauth.kakao': '使用 Kakao 继续',
    'auth.oauth.google': '使用 Google 继续',
    'auth.oauth.loading': '加载中...',
    'auth.oauth.cancelled': '登录已取消',
    'auth.oauth.unavailable.google': 'Google 登录暂时不可用',
    'auth.oauth.unavailable.kakao': 'Kakao 登录暂时不可用',
    'auth.oauth.error.expired': '登录时间过长，请重试。',
    'auth.oauth.error.default': 'OAuth 认证失败',

    // Profile Page
    'profile.title': '个人资料',
    'profile.overview': '概览',
    'profile.reviews': '我的评论',
    'profile.favorites': '收藏',
    'profile.settings': '设置',
    'profile.accountInfo': '账户信息',
    'profile.activity': '活动',
    'profile.memberSince': '加入时间',
    'profile.editProfile': '编辑资料',
    'profile.comingSoon': '即将推出',
    'profile.featureSoon': '此功能即将推出',

    // Toast Notifications
    'auth.toast.error.title': '错误',
    'auth.toast.error.multiple': '发现 {count} 个错误',
    'auth.toast.success.login': '欢迎回来！',
    'auth.toast.success.signup': '账户已创建！',
    'auth.toast.success.logout': '登出成功',
    'auth.toast.success.resend': '验证邮件已发送',

    // Verify Email Page
    'auth.verify.title': '查看您的邮箱',
    'auth.verify.message': '我们向以下地址发送了验证链接：',
    'auth.verify.instructions': '点击邮件中的链接以激活您的账户',
    'auth.verify.resend': '重新发送邮件',
    'auth.verify.back': '返回注册',
    'auth.verify.already': '您的邮箱可能已验证。请尝试登录。',
    'auth.verify.verified_login': '邮箱已验证！请登录。',
  },

  vi: {
    // Header & Navigation
    'nav.cafes': 'Quán cà phê',
    'nav.map': 'Bản đồ',
    'nav.districts': 'Khu vực',
    'nav.login': 'Đăng nhập',
    'nav.signup': 'Đăng ký',
    'nav.profile': 'Hồ sơ',
    'nav.myReviews': 'Đánh giá của tôi',
    'nav.settings': 'Cài đặt',
    'site.name': 'Cà phê Seoul',

    // Homepage - Hero
    'home.hero.title1': 'Khám phá',
    'home.hero.title2': 'Quán cà phê tuyệt nhất',
    'home.hero.title3': 'tại Seoul',
    'home.hero.subtitle': 'Tìm quán cà phê hoàn hảo với thông tin chi tiết về WiFi, ổ cắm, không gian và hơn thế nữa.',
    'home.hero.searchPlaceholder': 'Tìm theo tên hoặc khu vực...',
    'home.hero.search': 'Tìm kiếm',
    'home.hero.popular': 'Phổ biến:',

    // Homepage - Featured
    'home.featured.title': 'Quán nổi bật',
    'home.featured.subtitle': 'Những quán được đánh giá cao nhất',
    'home.featured.viewAll': 'Xem tất cả',

    // Homepage - Districts
    'home.districts.title': 'Theo khu vực',
    'home.districts.subtitle': 'Khám phá quán cà phê tại 25 quận của Seoul',

    // Homepage - Features
    'home.features.title': 'Tìm kiếm thông minh hơn',
    'home.features.subtitle': 'Tất cả thông tin bạn cần trong tầm mắt',
    'home.features.facilities.title': 'Tiện nghi chi tiết',
    'home.features.facilities.desc': 'Kiểm tra tốc độ WiFi, vị trí ổ cắm và độ thoải mái của chỗ ngồi',
    'home.features.ratings.title': 'Đánh giá đa chiều',
    'home.features.ratings.desc': 'So sánh chính xác với đánh giá theo 9 danh mục: đồ uống, không gian, giá trị và hơn nữa',
    'home.features.location.title': 'Tìm theo vị trí',
    'home.features.location.desc': 'Dễ dàng tìm quán cà phê gần bạn hoặc trong khu vực yêu thích',

    // Homepage - CTA
    'home.cta.title': 'Chia sẻ quán cà phê yêu thích của bạn',
    'home.cta.subtitle': 'Viết đánh giá và giúp người khác khám phá những quán tuyệt vời',
    'home.cta.button': 'Bắt đầu',

    // Footer
    'footer.rights': '© 2025 Seoul Cafe Guide. Đã đăng ký bản quyền.',

    // Cafes list page
    'cafes.title': 'Tìm quán cà phê',
    'cafes.subtitle': 'Khám phá quán cà phê ở Seoul với bộ lọc và tìm kiếm',
    'cafes.total': 'quán cà phê',
    'cafes.noResults': 'Không có quán cà phê phù hợp với tiêu chí của bạn',
    'cafes.tryAgain': 'Thử từ khóa hoặc bộ lọc khác',
    'cafes.prev': 'Trước',
    'cafes.next': 'Tiếp',

    // Search & Filters
    'filter.searchPlaceholder': 'Tìm theo tên hoặc địa chỉ...',
    'filter.district': 'Khu vực',
    'filter.cafeType': 'Loại quán',
    'filter.sort': 'Sắp xếp',
    'filter.clearAll': 'Xóa bộ lọc',
    'filter.wifi': 'WiFi',
    'filter.outlets': 'Ổ cắm',
    'filter.pet': 'Thú cưng',
    'filter.laptop': 'Laptop',
    'filter.parking': 'Đậu xe',
    'filter.outdoor': 'Ngoài trời',
    'sort.rating': 'Đánh giá cao',
    'sort.reviews': 'Nhiều đánh giá',
    'sort.newest': 'Mới nhất',

    // Cafe detail page
    'cafe.breadcrumb': 'Quán cà phê',
    'cafe.reviews': 'đánh giá',
    'cafe.tabs.info': 'Thông tin',
    'cafe.tabs.reviews': 'Đánh giá',
    'cafe.intro': 'Giới thiệu',
    'cafe.facilities': 'Tiện nghi & Dịch vụ',
    'cafe.detailedRatings': 'Đánh giá chi tiết',
    'cafe.hours': 'Giờ mở cửa',
    'cafe.closed': 'Đóng cửa',
    'cafe.location': 'Vị trí & Liên hệ',
    'cafe.naverMap': 'Naver Map',
    'cafe.kakaoMap': 'Kakao Map',
    'cafe.map': 'Bản đồ',
    'cafe.priceInfo': 'Thông tin giá',
    'cafe.avgDrink': 'Giá đồ uống trung bình:',
    'cafe.noReviews': 'Chưa có đánh giá',
    'cafe.writeFirst': 'Viết đánh giá đầu tiên',
    'cafe.helpful': 'Hữu ích',

    // Features/Facilities
    'feature.wifi': 'WiFi',
    'feature.outlets': 'Ổ cắm',
    'feature.laptop': 'Thân thiện laptop',
    'feature.pet': 'Cho phép thú cưng',
    'feature.parking': 'Bãi đỗ xe',
    'feature.outdoor': 'Chỗ ngồi ngoài trời',
    'feature.reservation': 'Đặt chỗ',
    'feature.meeting': 'Phòng họp',

    // Rating categories
    'rating.drinks': 'Đồ uống',
    'rating.food': 'Đồ ăn',
    'rating.ambiance': 'Không gian',
    'rating.seating': 'Chỗ ngồi',
    'rating.wifi': 'WiFi',
    'rating.outlets': 'Ổ cắm',
    'rating.noise': 'Tiếng ồn',
    'rating.value': 'Giá trị',
    'rating.temperature': 'Nhiệt độ',

    // Days of week
    'day.mon': 'T2',
    'day.tue': 'T3',
    'day.wed': 'T4',
    'day.thu': 'T5',
    'day.fri': 'T6',
    'day.sat': 'T7',
    'day.sun': 'CN',

    // Not found page
    'notFound.title': 'Không tìm thấy quán cà phê',
    'notFound.message': 'Quán cà phê bạn yêu cầu không tồn tại hoặc đã bị xóa.',
    'notFound.cafeList': 'Danh sách quán',
    'notFound.home': 'Về trang chủ',

    // Map Filters
    'map.filters.title': 'Bộ lọc',
    'map.filters.clearAll': 'Xóa tất cả',
    'map.filters.active': 'đang hoạt động',
    'map.filters.ratings': 'Đánh giá',
    'map.filters.features': 'Tính năng',
    'map.filters.any': 'Bất kỳ',
    'map.filters.seating': 'Chỗ ngồi',
    'map.filters.wifi': 'WiFi',
    'map.filters.food': 'Đồ ăn',
    'map.filters.drinks': 'Đồ uống',
    'map.filters.ambiance': 'Không khí',
    'map.filters.outlets': 'Ổ cắm',
    'map.filters.noise': 'Mức độ ồn',
    'map.filters.value': 'Giá trị',
    'map.filters.temperature': 'Nhiệt độ',
    'map.filters.hasWifi': 'Có WiFi',
    'map.filters.hasPowerOutlets': 'Có ổ cắm điện',
    'map.filters.isLaptopFriendly': 'Thân thiện với laptop',
    'map.filters.isPetFriendly': 'Thân thiện với thú cưng',
    'map.filters.hasParking': 'Đỗ xe',

    // Common
    'common.loading': 'Đang tải...',
    'common.error': 'Đã xảy ra lỗi',

    // Auth pages
    'auth.login.title': 'Đăng nhập',
    'auth.login.submit': 'Đăng nhập',
    'auth.login.submitting': 'Đang đăng nhập...',
    'auth.login.loading': 'Đang đăng nhập...',
    'auth.login.rememberMe': 'Ghi nhớ đăng nhập',
    'auth.login.noAccount': 'Chưa có tài khoản?',
    'auth.login.signupLink': 'Đăng ký',
    'auth.login.error.invalid': 'Email hoặc mật khẩu không hợp lệ',
    'auth.login.error.unverified': 'Vui lòng xác minh email của bạn trước',
    'auth.login.resend': 'Gửi lại email xác minh',
    'auth.login.resendSuccess': 'Email xác minh đã được gửi! Kiểm tra hộp thư của bạn.',

    'auth.signup.title': 'Tạo tài khoản',
    'auth.signup.submit': 'Tạo tài khoản',
    'auth.signup.submitting': 'Đang tạo tài khoản...',
    'auth.signup.loading': 'Đang tạo tài khoản...',
    'auth.signup.hasAccount': 'Đã có tài khoản?',
    'auth.signup.loginLink': 'Đăng nhập',
    'auth.signup.checkEmail': 'Kiểm tra email của bạn để xác nhận tài khoản',

    'auth.logout': 'Đăng xuất',

    'auth.loading.cancel': 'Hủy',

    'auth.form.email': 'Email',
    'auth.form.password': 'Mật khẩu',
    'auth.form.showPassword': 'Hiện mật khẩu',
    'auth.form.hidePassword': 'Ẩn mật khẩu',
    'auth.form.emailPlaceholder': 'you@example.com',
    'auth.form.passwordPlaceholder': 'Nhập mật khẩu của bạn',
    'auth.form.passwordCreatePlaceholder': 'Tạo mật khẩu',

    'auth.password.weak': 'Yếu',
    'auth.password.fair': 'Trung bình',
    'auth.password.good': 'Tốt',
    'auth.password.strong': 'Mạnh',

    'auth.password.strength.weak': 'Yếu',
    'auth.password.strength.fair': 'Trung bình',
    'auth.password.strength.good': 'Tốt',
    'auth.password.strength.strong': 'Mạnh',
    'auth.password.criteria.length': 'Ít nhất 8 ký tự',
    'auth.password.criteria.uppercase': 'Có chữ hoa',
    'auth.password.criteria.lowercase': 'Có chữ thường',
    'auth.password.criteria.number': 'Có số',
    'auth.password.criteria.special': 'Có ký tự đặc biệt',
    'auth.password.label': 'Độ mạnh mật khẩu',
    'auth.password.hint': 'Làm cho mạnh hơn',

    'auth.error.emailRequired': 'Email là bắt buộc',
    'auth.error.emailInvalid': 'Địa chỉ email không hợp lệ',
    'auth.error.passwordRequired': 'Mật khẩu là bắt buộc',
    'auth.error.passwordMin': 'Mật khẩu phải có ít nhất 8 ký tự',
    'auth.error.verifyFailed': 'Không thể xác minh email',
    'auth.error.verification_failed': 'Xác minh email thất bại. Liên kết có thể đã hết hạn hoặc đã được sử dụng.',
    'auth.error.missing_verification_params': 'Liên kết xác minh không hợp lệ. Vui lòng yêu cầu email xác minh mới.',
    'auth.error.user_not_found': 'Không tìm thấy ngườii dùng. Vui lòng kiểm tra email của bạn hoặc đăng ký lại.',

    // OAuth
    'auth.oauth.divider': 'hoặc',
    'auth.oauth.kakao': 'Tiếp tục với Kakao',
    'auth.oauth.google': 'Tiếp tục với Google',
    'auth.oauth.loading': 'Đang tải...',
    'auth.oauth.cancelled': 'Đăng nhập đã bị hủy',
    'auth.oauth.unavailable.google': 'Đăng nhập Google tạm thờị không khả dụng',
    'auth.oauth.unavailable.kakao': 'Đăng nhập Kakao tạm thờị không khả dụng',
    'auth.oauth.error.expired': 'Đăng nhập mất quá lâu. Vui lòng thử lại.',
    'auth.oauth.error.default': 'Xác thực OAuth thất bại',

    // Profile Page
    'profile.title': 'Hồ sơ',
    'profile.overview': 'Tổng quan',
    'profile.reviews': 'Đánh giá',
    'profile.favorites': 'Yêu thích',
    'profile.settings': 'Cài đặt',
    'profile.accountInfo': 'Thông tin tài khoản',
    'profile.activity': 'Hoạt động',
    'profile.memberSince': 'Thành viên từ',
    'profile.editProfile': 'Chỉnh sửa',
    'profile.comingSoon': 'Sắp ra mắt',
    'profile.featureSoon': 'Tính năng này sẽ sớm ra mắt',

    // Toast Notifications
    'auth.toast.error.title': 'Lỗi',
    'auth.toast.error.multiple': 'Phát hiện {count} lỗi',
    'auth.toast.success.login': 'Chào mừng trở lại!',
    'auth.toast.success.signup': 'Tài khoản đã được tạo!',
    'auth.toast.success.logout': 'Đăng xuất thành công',
    'auth.toast.success.resend': 'Email xác minh đã được gửi',

    // Verify Email Page
    'auth.verify.title': 'Kiểm tra email của bạn',
    'auth.verify.message': 'Chúng tôi đã gửi liên kết xác minh đến:',
    'auth.verify.instructions': 'Nhấp vào liên kết trong email để kích hoạt tài khoản',
    'auth.verify.resend': 'Gửi lại email',
    'auth.verify.back': 'Quay lại đăng ký',
    'auth.verify.already': 'Email của bạn có thể đã được xác minh. Hãy thử đăng nhập.',
    'auth.verify.verified_login': 'Email đã được xác minh! Vui lòng đăng nhập.',
  },
};
