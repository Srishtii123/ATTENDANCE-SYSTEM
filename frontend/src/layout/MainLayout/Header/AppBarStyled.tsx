// material-ui
import { styled } from '@mui/material/styles';
import AppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';

// ==============================|| HEADER - APP BAR STYLED ||============================== //

interface Props extends MuiAppBarProps {
  open?: boolean;
}

const AppBarStyled = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })<Props>(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  left: 0,
  width: '100%',
  marginLeft: 0
}));

export default AppBarStyled;
