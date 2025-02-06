import { useState, useEffect } from 'react';
import { FoodList } from '@/components/FoodList';
import { AddFoodDrawer } from '@/components/AddFoodDrawer';
import { getFoodItems, addFoodItem, deleteFoodItem } from '@/lib/storage';
import { FoodItem } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [items, setItems] = useState<FoodItem[]>([]);
  const { toast } = useToast();

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
    toast({
      title: "削除完了",
      description: "食品を削除しました",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Reizouko Manager
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FoodList items={items} onDelete={handleDelete} />
        <AddFoodDrawer onAdd={handleAdd} />
      </main>
    </div>
  );
};

export default Index;