/**
 * 食材表示用のカードコンポーネント
 */
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FoodItem } from '@/lib/types';
import { deleteFoodItem } from '@/lib/storage';
import {
  getDaysUntilExpiry,
  formatDateToJapanese,
  getExpiryColorClass,
} from '@/lib/date-utils';

interface FoodCardProps {
  /**
   * 食材データ
   */
  food: FoodItem;

  /**
   * 食材削除後の処理
   */
  onDelete: () => void;
}

/**
 * 食材表示用のカードコンポーネント
 */
export function FoodCard({ food, onDelete }: FoodCardProps) {
  /**
   * 食材データの削除処理
   */
  const handleDelete = () => {
    if (confirm('本当に削除しますか？')) {
      deleteFoodItem(food.id);
      onDelete();
    }
  };

  // 賞味期限までの残り日数
  const daysRemaining = getDaysUntilExpiry(food.expiryDate);

  // 残り日数に応じた表示文言
  const getDaysText = () => {
    if (daysRemaining < 0) return `${Math.abs(daysRemaining)}日過ぎています`;
    if (daysRemaining === 0) return '本日までです';
    return `あと${daysRemaining}日`;
  };

  // 背景色のクラス
  const colorClass = getExpiryColorClass(daysRemaining);

  return (
    <Card
      className={`w-full transition-all ${colorClass}`}
      role="article"
      aria-label={`${food.name}の食材カード`}
    >
      <CardHeader>
        <CardTitle as="h2">{food.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div>
            <span className="text-sm font-medium">賞味期限：</span>
            <span>{formatDateToJapanese(food.expiryDate)}</span>
          </div>
          <div>
            <span className="text-sm font-medium">期限：</span>
            <span className="font-bold">{getDaysText()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          aria-label={`${food.name}の削除ボタン`}
        >
          削除
        </Button>
      </CardFooter>
    </Card>
  );
}
