import { FoodItem } from '@/lib/types';
import { calculateDaysLeft, getStatusColor, formatDate } from '@/lib/date-utils';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FoodCardProps {
  food: FoodItem;
  onDelete: (id: string) => void;
}

export const FoodCard = ({ food, onDelete }: FoodCardProps) => {
  const daysLeft = calculateDaysLeft(food.expiryDate);
  const statusColor = getStatusColor(daysLeft);

  return (
    <div className={`p-4 rounded-lg border ${statusColor} transition-colors duration-200`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{food.name}</h3>
          <p className="text-sm mt-1">
            消費期限: {formatDate(food.expiryDate)}
          </p>
          <p className="text-sm mt-1">
            残り {daysLeft < 0 ? '期限切れ' : `${daysLeft}日`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(food.id)}
          className="text-gray-500 hover:text-red-500"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};