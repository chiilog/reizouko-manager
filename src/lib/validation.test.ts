/**
 * バリデーション関数のテスト
 */
import { describe, it, expect } from 'vitest';
import { validateFoodName, validateExpiryDate } from './validation';

describe('validateFoodName', () => {
  it('空文字列の場合はエラーを返す', () => {
    expect(validateFoodName('')).toBe('食品名を入力してください。空白文字のみは無効です。');
  });

  it('空白文字のみの場合はエラーを返す', () => {
    expect(validateFoodName('   ')).toBe('食品名を入力してください。空白文字のみは無効です。');
  });

  it('文字数制限を超える場合はエラーを返す', () => {
    const longName = 'あ'.repeat(51);
    expect(validateFoodName(longName)).toBe('食品名は50文字以内で入力してください。');
  });

  it('有効な食品名の場合はnullを返す', () => {
    expect(validateFoodName('きゅうり')).toBeNull();
  });
});

describe('validateExpiryDate', () => {
  it('nullの場合はエラーを返す', () => {
    expect(validateExpiryDate(null)).toBe('賞味期限を選択してください。');
  });

  it('過去の日付の場合はエラーを返す', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(validateExpiryDate(yesterday)).toBe('賞味期限は今日以降の日付を選択してください。');
  });

  it('今日の日付の場合はnullを返す', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(validateExpiryDate(today)).toBeNull();
  });

  it('未来の日付の場合はnullを返す', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(validateExpiryDate(tomorrow)).toBeNull();
  });
}); 