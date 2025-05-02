/**
 * 入力値のバリデーションユーティリティ関数
 */

/**
 * 食品名の最大文字数
 */
export const MAX_NAME_LENGTH = 50;

/**
 * HTMLタグを削除する関数
 * @param input 入力文字列
 * @returns サニタイズされた文字列
 */
export const sanitizeHtmlTags = (input: string): string => {
  // <script> タグやその他のHTMLタグを削除
  const noScriptTags = input.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );
  // 残りの一般的なHTMLタグを削除
  return noScriptTags.replace(/<\/?[^>]+(>|$)/g, '');
};

/**
 * 食品名のバリデーションを行う関数
 * @param name 食品名
 * @returns エラーメッセージ（エラーがない場合はnull）
 */
export const validateFoodName = (name: string): string | null => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return '食品名を入力してください。空白文字のみは無効です。';
  }

  if (trimmedName.length > MAX_NAME_LENGTH) {
    return `食品名は${MAX_NAME_LENGTH}文字以内で入力してください。`;
  }

  return null;
};

/**
 * 賞味期限のバリデーションを行う関数
 * @param date 賞味期限の日付
 * @returns エラーメッセージ（エラーがない場合はnull）
 */
export const validateExpiryDate = (date: Date | null): string | null => {
  if (!date) {
    return '賞味期限を選択してください。';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (date < today) {
    return '賞味期限は今日以降の日付を選択してください。';
  }

  return null;
}; 