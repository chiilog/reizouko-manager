export const calculateDaysLeft = (expiryDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getStatusColor = (daysLeft: number): string => {
  if (daysLeft < 0) return 'bg-red-100 border-red-300 text-red-800';
  if (daysLeft <= 3) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
  return 'bg-green-100 border-green-300 text-green-800';
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};