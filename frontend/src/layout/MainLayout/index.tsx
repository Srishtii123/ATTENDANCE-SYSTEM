import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Box, Container, Toolbar, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import useConfig from 'hooks/useConfig';
import navigation from 'menu-items';
import { dispatch } from 'store';
import { openDrawer } from 'store/reducers/menu';
import Header from './Header';
import Navigation from './Navigation';

const MainLayout = () => {
  const theme = useTheme();
  const matchDownXL = useMediaQuery(theme.breakpoints.down('xl'));
  const { container, miniDrawer } = useConfig();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (!miniDrawer) {
      dispatch(openDrawer(!matchDownXL));
    }
  }, [matchDownXL, miniDrawer]);

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100dvh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Navigation isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <Header isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <Box
        component="main"
        sx={{
          marginLeft: { xs: 0, sm: 0, md: isCollapsed ? '80px' : '180px' },
          width: { xs: '100%', sm: '100%', md: isCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 180px)' },
          flexGrow: 1,
          p: { xs: 1, sm: 1 },
          bgcolor: 'background.default',
          color: 'text.primary',
          transition: 'margin-left 0.2s ease'
        }}
      >
        <Toolbar />
        <Container
          maxWidth={container ? 'xl' : false}
          sx={{
            ...(container && { px: { xs: 0, sm: 1 } }),
            position: 'relative',
            minHeight: 'calc(100vh - 110px)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Breadcrumbs navigation={navigation} title titleBottom card={false} divider={false} />
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
