/**
 * 食材データの型定義
 */

/**
 * 食材データのインターフェース
 */
export interface FoodItem {
  /**
   * 食材の一意のID
   */
  id: string;
  
  /**
   * 食材名
   */
  name: string;
  
  /**
   * 賞味期限
   */
  expiryDate: string;
} 