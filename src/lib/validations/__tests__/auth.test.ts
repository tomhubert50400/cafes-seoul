import { describe, it, expect } from 'vitest';
import { signupSchema, loginSchema } from '../auth';

describe('signupSchema', () => {
  it('validates a valid signup', () => {
    const result = signupSchema.safeParse({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short username', () => {
    const result = signupSchema.safeParse({
      username: 'ab',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects long username', () => {
    const result = signupSchema.safeParse({
      username: 'a'.repeat(31),
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid username characters', () => {
    const result = signupSchema.safeParse({
      username: 'test user!',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('allows underscores and hyphens in username', () => {
    const result = signupSchema.safeParse({
      username: 'test_user-123',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = signupSchema.safeParse({
      username: 'testuser',
      email: 'notanemail',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty email', () => {
    const result = signupSchema.safeParse({
      username: 'testuser',
      email: '',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = signupSchema.safeParse({
      username: 'testuser',
      email: 'test@example.com',
      password: '1234567',
    });
    expect(result.success).toBe(false);
  });

  it('accepts exactly 8 char password', () => {
    const result = signupSchema.safeParse({
      username: 'testuser',
      email: 'test@example.com',
      password: '12345678',
    });
    expect(result.success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('validates a valid login', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'password',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});
