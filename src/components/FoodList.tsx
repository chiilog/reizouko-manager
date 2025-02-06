import { FoodItem } from '@/lib/types';
import { FoodCard } from './FoodCard';

interface FoodListProps {
  items: FoodItem[];
  onDelete: (id: string) => void;
}

export const FoodList = ({ items, onDelete }: FoodListProps) => {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <FoodCard key={item.id} food={item} onDelete={onDelete} />
      ))}
    </div>
  );
};