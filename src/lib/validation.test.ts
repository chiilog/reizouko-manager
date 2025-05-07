/**
 * バリデーション関数のテスト
 */
import { describe, it, expect } from 'vitest';
import { validateFoodName, validateExpiryDate, MAX_NAME_LENGTH, sanitizeHtmlTags } from './validation';

describe('validateFoodName', () => {
  it('空文字列の場合はエラーを返す', () => {
    expect(validateFoodName('')).toBe('食品名を入力してください。空白文字のみは無効です。');
  });

  it('空白文字のみの場合はエラーを返す', () => {
    expect(validateFoodName('   ')).toBe('食品名を入力してください。空白文字のみは無効です。');
  });

  it('前後の空白を含む有効な食品名はトリムされて有効になる', () => {
    expect(validateFoodName('  きゅうり  ')).toBeNull();
  });

  it(`ちょうど${MAX_NAME_LENGTH}文字の食品名は有効である`, () => {
    const justLengthName = 'あ'.repeat(MAX_NAME_LENGTH);
    expect(validateFoodName(justLengthName)).toBeNull();
  });

  it(`ちょうど${MAX_NAME_LENGTH}文字で前後に空白があっても有効である`, () => {
    const justLengthNameWithSpaces = '  ' + 'い'.repeat(MAX_NAME_LENGTH) + '  ';
    expect(validateFoodName(justLengthNameWithSpaces)).toBeNull();
  });

  it(`サニタイズやトリム後に${MAX_NAME_LENGTH}文字を超える場合はエラーを返す`, () => {
    // validateFoodName自体はサニタイズを行わないが、呼び出し側でサニタイズ・トリムされたものが渡される想定のテスト
    // このテストは、validateFoodName が純粋に長さを見ていることの確認
    const longName = 'あ'.repeat(MAX_NAME_LENGTH + 1);
    expect(validateFoodName(longName)).toBe(`食品名は${MAX_NAME_LENGTH}文字以内で入力してください。`);
  });

  it('有効な食品名の場合はnullを返す', () => {
    expect(validateFoodName('きゅうり')).toBeNull();
  });

  // sanitizeHtmlTags のテストは別途行うべきだが、参考として validateFoodName に
  // サニタイズされていないHTMLが含まれる場合の挙動も確認しておく（現状の実装ではHTMLタグも文字数としてカウントされる）
  it('HTMLタグを含む場合、タグも文字数としてカウントされる (現状のvalidateFoodNameの仕様)', () => {
    const nameWithHtml = 'テスト<script>alert("XSS")</script>商品'; // この全体の長さで評価される
    // sanitizeHtmlTags('テスト<script>alert("XSS")</script>商品').length は 7
    // 'テスト<script>alert("XSS")</script>商品'.length は 38
    expect(validateFoodName(nameWithHtml)).toBeNull(); // 38文字なのでOK

    const longNameWithHtml = 'あ'.repeat(40) + '<p>very long paragraph that exceeds limit</p>';
    expect(validateFoodName(longNameWithHtml)).toBe(`食品名は${MAX_NAME_LENGTH}文字以内で入力してください。`);
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

// sanitizeHtmlTags 関数のテスト
describe('sanitizeHtmlTags', () => {
  it('基本的なHTMLタグを除去する', () => {
    expect(sanitizeHtmlTags('<div>test</div>')).toBe('test');
  });

  it('scriptタグとその内容を除去する', () => {
    expect(sanitizeHtmlTags('<script>alert("XSS")</script>content')).toBe('content');
  });

  it('複数のscriptタグを除去する', () => {
    expect(sanitizeHtmlTags('<script>1</script>a<script>2</script>b')).toBe('ab');
  });

  it('タグがない場合はそのまま返す', () => {
    expect(sanitizeHtmlTags('no tags here')).toBe('no tags here');
  });

  it('空文字の場合は空文字を返す', () => {
    expect(sanitizeHtmlTags('')).toBe('');
  });

  it('複雑なHTML構造も処理する', () => {
    expect(sanitizeHtmlTags('<p>Hello <b>world</b>!</p><script>danger()</script>')).toBe('Hello world!');
  });
}); 