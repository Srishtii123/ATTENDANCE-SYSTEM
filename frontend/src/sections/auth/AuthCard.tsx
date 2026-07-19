import { Box } from '@mui/material';
import MainCard, { MainCardProps } from 'components/MainCard';

// ==============================|| AUTHENTICATION - CARD WRAPPER ||============================== //

const AuthCard = ({ children, ...other }: MainCardProps) => (
  <MainCard
    sx={{
      maxWidth: { xs: 360, lg: 400 },
      margin: { xs: 2, md: 2 },
      '& > *': {
        flexGrow: 1,
        flexBasis: '50%'
      },
      boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15), 0px 16px 48px rgba(0, 0, 0, 0.1)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.2), 0px 20px 64px rgba(0, 0, 0, 0.15)',
        transform: 'translateY(-2px)'
      }
    }}
    content={false}
    {...other}
    border={false}
  >
    <Box sx={{ p: { xs: 2.5, sm: 3, md: 3.5, xl: 4 } }}>{children}</Box>
  </MainCard>
);

export default AuthCard;
