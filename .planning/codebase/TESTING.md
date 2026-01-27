# Testing Patterns

**Analysis Date:** 2026-01-27

## Test Framework

**Current Status:**
- No testing framework currently configured
- No test files detected in codebase
- No test configuration files (jest.config.*, vitest.config.*, etc.) present

**Run Commands:**
- No test commands available in `package.json` scripts
- Testing not yet implemented in this project

## Test File Organization

**Recommended Location:**
- Co-located testing should follow the pattern once implemented
- For future test files, use:
  - Suffix: `.test.ts` or `.test.tsx` for unit tests
  - Suffix: `.spec.ts` or `.spec.tsx` for integration/spec tests
  - Location: Same directory as the code being tested

**Suggested Directory Structure (for future implementation):**
```
src/
├── components/
│   ├── header.tsx
│   └── header.test.tsx
├── lib/
│   ├── utils.ts
│   └── utils.test.ts
├── app/
│   └── api/
│       └── cafes/
│           ├── route.ts
│           └── route.test.ts
└── types/
    ├── cafe.ts
    └── cafe.test.ts
```

## Test Structure

**Not Yet Implemented**

Once testing is added, recommended structure based on codebase patterns:

```typescript
// Example pattern (not in current codebase)
describe('CafeCard', () => {
  it('should render cafe name and rating', () => {
    // test implementation
  });

  it('should display distance when provided', () => {
    // test implementation
  });

  describe('image rendering', () => {
    it('should show placeholder when image URL is missing', () => {
      // test implementation
    });
  });
});
```

**Setup/Teardown Pattern:**
- Not established yet
- When implemented, should use standard testing library patterns:
  ```typescript
  beforeEach(() => {
    // setup before each test
  });

  afterEach(() => {
    // cleanup after each test
  });
  ```

## Mocking

**Current Status:**
- No mocking library configured
- No mock data factories or fixtures in place

**Recommended Framework:**
- For Next.js API routes: `jest.mock()` or Vitest mocking
- For React components: `jest-mock-extended` or `vitest` mocking
- For Supabase: Mock with `@testing-library/react`

**What to Mock (based on codebase structure):**
- Supabase client calls (`createClient()`)
- Next.js hooks (`useRouter()`, `useSearchParams()`, `usePathname()`)
- API route responses
- i18n context and translations
- Environment variables

**What NOT to Mock:**
- Utility functions like `cn()` (should test real behavior)
- Type transformations and validation logic
- Component rendering logic (test actual output)
- Constants and static data

## Fixtures and Factories

**Not Yet Implemented**

**Recommended Location:**
- `src/__fixtures__/` or `src/__mocks__/` directory
- Organized by domain: `__fixtures__/cafes.ts`, `__fixtures__/users.ts`

**Suggested Factory Pattern (based on types in codebase):**
```typescript
// Example: src/__fixtures__/cafes.ts
export const mockCafeSummary = (overrides?: Partial<CafeSummary>): CafeSummary => ({
  id: 'test-cafe-1',
  name: { en: 'Test Cafe', ko: '테스트 카페' },
  slug: 'test-cafe',
  address: { en: 'Test Address', ko: '테스트 주소' },
  districtId: 1,
  latitude: 37.5665,
  longitude: 126.9780,
  overallRating: 4.5,
  totalRatings: 42,
  priceRange: 2,
  cafeType: 'specialty_coffee',
  hasWifi: true,
  hasPowerOutlets: true,
  isPetFriendly: false,
  isLaptopFriendly: true,
  primaryImageUrl: null,
  ...overrides,
});

export const mockCafe = (overrides?: Partial<Cafe>): Cafe => ({
  ...mockCafeSummary(overrides),
  description: { en: 'Great coffee', ko: '훌륭한 커피' },
  phone: '02-123-4567',
  website: 'https://example.com',
  // ... other fields
});
```

## Coverage

**Requirements:**
- No coverage requirements currently enforced
- No coverage configuration in place

**View Coverage (once testing is implemented):**
```bash
npm run test -- --coverage
# or
vitest --coverage
```

## Test Types

**Unit Tests (to implement):**
- Scope: Individual functions, utilities, components in isolation
- Approach: Test with mocked dependencies
- Examples to add:
  - `cn()` utility function with various Tailwind class combinations
  - `transformCafe()` and other transform functions with various input types
  - `getLocalizedText()` with different language preferences and fallbacks
  - API route parameter parsing and validation

**Integration Tests (to implement):**
- Scope: API routes with Supabase interactions
- Approach: Mock Supabase client, test full route handler flow
- Examples:
  - `/api/cafes` route with filters and pagination
  - `/api/cafes/nearby` route with location validation
  - `/api/cafes/[id]` route with error handling

**Component Tests (to implement):**
- Scope: React components with mocked hooks and data
- Approach: Use React Testing Library for user interaction testing
- Examples:
  - `CafeCard` renders with provided data
  - `Header` navigation links reflect current path
  - `SearchFilters` updates query parameters on interaction
  - `RatingStars` displays correct number of filled/partial/empty stars

**E2E Tests (not currently used):**
- Not implemented
- Could use Playwright or Cypress for future end-to-end testing
- Would test complete user flows across pages

## Common Patterns

**Async Testing (to implement when needed):**

For API route testing:
```typescript
// Example pattern
describe('GET /api/cafes', () => {
  it('should return paginated cafe list', async () => {
    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(20);
    expect(data.meta.total).toBeGreaterThan(0);
  });

  it('should handle database errors gracefully', async () => {
    // mock error response
    const response = await GET(mockRequest);

    expect(response.status).toBe(500);
    expect(response.json()).toMatchObject({ error: expect.any(String) });
  });
});
```

For component testing with hooks:
```typescript
describe('SearchFilters', () => {
  it('should update URL params when filter changes', async () => {
    render(<SearchFilters />);
    const districtSelect = screen.getByRole('combobox', { name: /district/i });

    await user.click(districtSelect);
    await user.click(screen.getByText('Gangnam'));

    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('district=gangnam'));
  });
});
```

**Error Testing (to implement):**

For validation:
```typescript
describe('/api/cafes/nearby validation', () => {
  it('should return 400 when lat is missing', async () => {
    const request = mockNextRequest({
      searchParams: { lng: '126.978' },
    });

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'lat and lng parameters are required',
    });
  });

  it('should return 400 when coordinates are invalid', async () => {
    const request = mockNextRequest({
      searchParams: { lat: 'invalid', lng: '126.978' },
    });

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid lat or lng values',
    });
  });
});
```

For hook errors:
```typescript
describe('useI18n', () => {
  it('should throw error when used outside provider', () => {
    const { result } = renderHook(() => useI18n());

    expect(result.error).toEqual(
      new Error('useI18n must be used within an I18nProvider')
    );
  });
});
```

---

*Testing analysis: 2026-01-27*

## Setup Plan

When implementing testing, follow this order:
1. Choose framework: **Vitest** (recommended for Next.js) or Jest
2. Set up `vitest.config.ts` with Next.js configuration
3. Create mock utilities in `src/__mocks__/` and `src/__fixtures__/`
4. Add test script to `package.json`
5. Start with utilities and helper functions (no dependencies)
6. Move to component unit tests (mocked hooks)
7. Add API route integration tests (mocked Supabase)
8. Consider E2E tests for critical user flows
