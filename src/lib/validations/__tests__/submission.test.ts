import { describe, it, expect } from 'vitest';
import { submissionSchema, translatedTextSchema } from '../submission';

describe('translatedTextSchema', () => {
  it('accepts with English name only', () => {
    const result = translatedTextSchema.safeParse({ en: 'Test Cafe' });
    expect(result.success).toBe(true);
  });

  it('accepts with Korean name only', () => {
    const result = translatedTextSchema.safeParse({ ko: '테스트 카페' });
    expect(result.success).toBe(true);
  });

  it('accepts with both English and Korean', () => {
    const result = translatedTextSchema.safeParse({ en: 'Test Cafe', ko: '테스트 카페' });
    expect(result.success).toBe(true);
  });

  it('rejects with neither English nor Korean', () => {
    const result = translatedTextSchema.safeParse({ fr: 'Test Cafe' });
    expect(result.success).toBe(false);
  });

  it('rejects empty object', () => {
    const result = translatedTextSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects names shorter than 2 characters', () => {
    const result = translatedTextSchema.safeParse({ en: 'A' });
    expect(result.success).toBe(false);
  });

  it('accepts all five languages', () => {
    const result = translatedTextSchema.safeParse({
      en: 'Test Cafe',
      ko: '테스트 카페',
      fr: 'Cafe Test',
      zh: '测试咖啡馆',
      vi: 'Quan ca phe',
    });
    expect(result.success).toBe(true);
  });
});

describe('submissionSchema', () => {
  it('validates a minimal valid submission', () => {
    const result = submissionSchema.safeParse({
      name: { en: 'My Cafe' },
      address: { en: '123 Seoul Street' },
      photoUrls: ['https://example.com/photo.jpg'],
    });
    expect(result.success).toBe(true);
  });

  it('validates a full submission', () => {
    const result = submissionSchema.safeParse({
      name: { en: 'My Cafe', ko: '내 카페' },
      address: { en: '123 Seoul Street', ko: '서울시 123' },
      phone: '02-1234-5678',
      latitude: 37.5665,
      longitude: 126.978,
      districtId: 1,
      neighborhoodId: 5,
      photoUrls: ['https://example.com/photo.jpg'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid phone number', () => {
    const result = submissionSchema.safeParse({
      name: { en: 'My Cafe' },
      address: { en: '123 Seoul Street' },
      phone: 'not-a-phone',
    });
    expect(result.success).toBe(false);
  });

  it('accepts Korean phone formats', () => {
    const formats = ['02-1234-5678', '010-1234-5678', '+82-10-1234-5678'];
    for (const phone of formats) {
      const result = submissionSchema.safeParse({
        name: { en: 'My Cafe' },
        address: { en: '123 Seoul Street' },
        phone,
        photoUrls: ['https://example.com/photo.jpg'],
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts empty phone', () => {
    const result = submissionSchema.safeParse({
      name: { en: 'My Cafe' },
      address: { en: '123 Seoul Street' },
      phone: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid latitude', () => {
    const result = submissionSchema.safeParse({
      name: { en: 'My Cafe' },
      address: { en: '123 Seoul Street' },
      latitude: 91,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid longitude', () => {
    const result = submissionSchema.safeParse({
      name: { en: 'My Cafe' },
      address: { en: '123 Seoul Street' },
      longitude: 181,
    });
    expect(result.success).toBe(false);
  });
});
