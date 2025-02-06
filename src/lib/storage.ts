import { FoodItem } from './types';

const STORAGE_KEY = 'reizouko_manager_items';

export const getFoodItems = (): FoodItem[] => {
  const items = localStorage.getItem(STORAGE_KEY);
  return items ? JSON.parse(items) : [];
};

export const saveFoodItems = (items: FoodItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const addFoodItem = (item: Omit<FoodItem, 'id' | 'createdAt'>) => {
  const items = getFoodItems();
  const newItem: FoodItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  items.push(newItem);
  saveFoodItems(items);
  return newItem;
};

export const deleteFoodItem = (id: string) => {
  const items = getFoodItems();
  const newItems = items.filter(item => item.id !== id);
  saveFoodItems(newItems);
};