import { useState } from 'react';
import { 
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface AddFoodDrawerProps {
  onAdd: (name: string, expiryDate: string) => void;
}

export const AddFoodDrawer = ({ onAdd }: AddFoodDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date.toISOString().split('T')[0];
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !expiryDate) {
      setShowError(true);
      return;
    }
    onAdd(name, expiryDate);
    setName('');
    setExpiryDate('');
    setOpen(false);
    setShowSuccess(true);
  };

  return (
    <>
      <IconButton
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          backgroundColor: 'primary.main',
          color: 'white',
          '&:hover': {
            backgroundColor: 'primary.dark',
          },
          boxShadow: 3,
        }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </IconButton>

      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
      >
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', width: '100%', position: 'relative' }}>
          <Typography
            onClick={() => setOpen(false)}
            sx={{
              cursor: 'pointer',
              color: 'text.secondary',
              marginBottom: 2,
              fontSize: '0.875rem', // 14px相当
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            キャンセル
          </Typography>
          <Typography variant="h6" component="h2" gutterBottom>
            新しい食品を登録
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="食品名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 牛乳"
                fullWidth
              />
              <TextField
                label="消費期限"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
              >
                登録する
              </Button>
            </Box>
          </form>
        </Box>
      </Drawer>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          食品を登録しました
        </Alert>
      </Snackbar>

      <Snackbar
        open={showError}
        autoHideDuration={3000}
        onClose={() => setShowError(false)}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          食品名と消費期限を入力してください
        </Alert>
      </Snackbar>
    </>
  );
};