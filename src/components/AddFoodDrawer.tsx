import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface AddFoodDrawerProps {
  onAdd: (name: string, expiryDate: string) => void;
}

export const AddFoodDrawer = ({ onAdd }: AddFoodDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !expiryDate) {
      toast({
        title: "エラー",
        description: "食品名と消費期限を入力してください",
        variant: "destructive"
      });
      return;
    }
    onAdd(name, expiryDate);
    setName('');
    setExpiryDate('');
    setOpen(false);
    toast({
      title: "登録完了",
      description: "食品を登録しました",
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-[400px]">
        <SheetHeader>
          <SheetTitle>新しい食品を登録</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name">食品名</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 牛乳"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryDate">消費期限</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            登録する
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};