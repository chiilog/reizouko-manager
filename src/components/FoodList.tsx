import { FoodItem } from '@/lib/types';
import { FoodCard } from './FoodCard';
import { Grid } from '@mui/material';

interface FoodListProps {
  items: FoodItem[];
  onDelete: (id: string) => void;
}

export const FoodList = ({ items, onDelete }: FoodListProps) => {
  return (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item.id}>
          <FoodCard food={item} onDelete={onDelete} />
        </Grid>
      ))}
    </Grid>
  );
};