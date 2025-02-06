import { useState, useEffect } from 'react';
import { Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import { FoodList } from '@/components/FoodList';
import { AddFoodDrawer } from '@/components/AddFoodDrawer';
import { getFoodItems, addFoodItem, deleteFoodItem } from '@/lib/storage';
import { FoodItem } from '@/lib/types';

const Index = () => {
  const [items, setItems] = useState<FoodItem[]>([]);

  useEffect(() => {
    setItems(getFoodItems());
  }, []);

  const handleAdd = (name: string, expiryDate: string) => {
    const newItem = addFoodItem({ name, expiryDate });
    setItems([...items, newItem]);
  };

  const handleDelete = (id: string) => {
    deleteFoodItem(id);
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="h1">
            Reizouko Manager
          </Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 4 }}>
        <FoodList items={items} onDelete={handleDelete} />
        <AddFoodDrawer onAdd={handleAdd} />
      </Container>
    </Box>
  );
};

export default Index;