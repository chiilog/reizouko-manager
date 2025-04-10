/**
 * 冷蔵庫管理アプリのメインコンポーネント
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FoodCard } from '@/components/FoodCard';
import { FoodForm } from '@/components/FoodForm';
import { FoodItem } from '@/lib/types';
import { getAllFoodItems } from '@/lib/storage';

function App() {
  // 食材リスト
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  // 食材登録フォームの表示状態
  const [isFormOpen, setIsFormOpen] = useState(false);

  /**
   * 食材リストの読み込み
   */
  const loadFoodItems = () => {
    setFoodItems(getAllFoodItems());
  };

  // 初回読み込み時に食材リストを取得
  useEffect(() => {
    loadFoodItems();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4">冷蔵庫管理アプリ</h1>
        <p className="text-gray-600 mb-6">
          購入した食材の賞味期限を入力して一覧で管理できます。賞味期限が近づくにつれて色が変化します。
        </p>

        <div className="flex justify-end">
          <Button
            onClick={() => setIsFormOpen(true)}
            className="fixed bottom-8 right-8 md:static md:bottom-auto md:right-auto z-10"
          >
            食材を登録
          </Button>
        </div>
      </header>

      <main>
        {foodItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              登録された食材はありません。新しい食材を登録してください。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {foodItems.map((item) => (
              <FoodCard key={item.id} food={item} onDelete={loadFoodItems} />
            ))}
          </div>
        )}
      </main>

      <FoodForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onFoodAdded={loadFoodItems}
      />
    </div>
  );
}

export default App;
