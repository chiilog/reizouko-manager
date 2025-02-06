import { FoodItem } from '@/lib/types';
import { calculateDaysLeft, formatDate } from '@/lib/date-utils';
import { Card, CardContent, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface FoodCardProps {
  food: FoodItem;
  onDelete: (id: string) => void;
}

export const FoodCard = ({ food, onDelete }: FoodCardProps) => {
  const daysLeft = calculateDaysLeft(food.expiryDate);

  const getStatusColor = (days: number) => {
    if (days < 0) return '#424242';  // 期限切れ - 黒っぽい色
    if (days <= 1) return '#ffebee';  // 1日以内 - 薄い赤
    if (days <= 3) return '#fff3e0';  // 3日以内 - 薄いオレンジ
    return '#e8f5e9';  // 6日以上 - 薄い緑
  };

  return (
    <Card sx={{ 
      bgcolor: getStatusColor(daysLeft),
      position: 'relative',
      transition: 'background-color 0.2s'
    }}>
      <CardContent>
        <Typography variant="h6" component="h3">
          {food.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          消費期限: {formatDate(food.expiryDate)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          残り {daysLeft < 0 ? '期限切れ' : `${daysLeft}日`}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onDelete(food.id)}
          sx={{ 
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'text.secondary',
            '&:hover': {
              color: 'error.main'
            }
          }}
        >
          <DeleteIcon />
        </IconButton>
      </CardContent>
    </Card>
  );
};