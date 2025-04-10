/**
 * ローカルストレージ操作用のヘルパー関数
 */
import { FoodItem } from './types';

const STORAGE_KEY = 'food-items';

/**
 * ローカルストレージから食材データを全て取得する
 * @returns {FoodItem[]} 食材データの配列
 */
export const getAllFoodItems = (): FoodItem[] => {
  const items = localStorage.getItem(STORAGE_KEY);
  return items ? JSON.parse(items) : [];
};

/**
 * 食材データをローカルストレージに保存する
 * @param {FoodItem[]} items - 保存する食材データの配列
 */
export const saveFoodItems = (items: FoodItem[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

/**
 * 新しい食材データを追加する
 * @param {Omit<FoodItem, 'id'>} item - 追加する食材データ（IDなし）
 * @returns {FoodItem} 追加された食材データ（ID付き）
 */
export const addFoodItem = (item: Omit<FoodItem, 'id'>): FoodItem => {
  const items = getAllFoodItems();
  const newItem = {
    ...item,
    id: crypto.randomUUID(),
  };
  
  saveFoodItems([...items, newItem]);
  return newItem;
};

/**
 * 食材データを削除する
 * @param {string} id - 削除する食材データのID
 */
export const deleteFoodItem = (id: string): void => {
  const items = getAllFoodItems();
  const filteredItems = items.filter((item) => item.id !== id);
  saveFoodItems(filteredItems);
}; 