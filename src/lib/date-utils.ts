/**
 * 日付操作用のユーティリティ関数
 */
import { addDays, differenceInDays, format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 現在の日付から指定した日数後の日付を取得する
 * @param {number} days - 加算する日数
 * @returns {Date} 計算後の日付
 */
export const getDateAfterDays = (days: number): Date => {
  return addDays(new Date(), days);
};

/**
 * 賞味期限までの残り日数を計算する
 * @param {string} expiryDate - 賞味期限の日付文字列（ISO形式）
 * @returns {number} 残り日数
 */
export const getDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = parseISO(expiryDate);
  return differenceInDays(expiry, today);
};

/**
 * 日付をYYYY-MM-DD形式の文字列に変換する
 * @param {Date} date - 変換する日付
 * @returns {string} 変換後の文字列
 */
export const formatDateToISOString = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * 日付を年月日形式（例：2023年4月1日）の文字列に変換する
 * @param {Date | string} date - 変換する日付またはISO形式の日付文字列
 * @returns {string} 変換後の文字列
 */
export const formatDateToJapanese = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy年M月d日', { locale: ja });
};

/**
 * 残り日数に基づいて背景色のクラス名を取得する
 * @param {number} daysRemaining - 残り日数
 * @returns {string} CSSクラス名
 */
export const getExpiryColorClass = (daysRemaining: number): string => {
  if (daysRemaining < 0) return 'bg-black text-white';
  if (daysRemaining === 0) return 'bg-red-500 text-white';
  if (daysRemaining <= 3) return 'bg-red-200';
  if (daysRemaining <= 5) return 'bg-yellow-200';
  return 'bg-green-200';
}; 