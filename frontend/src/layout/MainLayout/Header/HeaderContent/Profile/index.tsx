import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, ButtonBase, CardContent, ClickAwayListener, Paper, Popper, Stack, Tooltip, Typography } from '@mui/material';

// project import
// import ProfileTab from './ProfileTab';
// import SettingTab from './SettingTab';
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';
import IconButton from 'components/@extended/IconButton';
import useAuth from 'hooks/useAuth';
import { CircleUserRound } from 'lucide-react';
// import VendorProfile from '../../../../../pages/VendorSystem/VendorProfile';

// assets
import avatar1 from 'assets/images/users/avatar-1.png';
import { LogoutOutlined } from '@ant-design/icons';

// types
//import { ThemeMode } from 'types/config';

// ==============================|| HEADER CONTENT - PROFILE ||============================== //

interface ProfileProps {
  variant?: 'mobile' | 'desktop';
}

const Profile = ({ variant = 'desktop' }: ProfileProps) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const { logout, user } = useAuth();

  // Debug: Check if user data is loaded
  console.log('Profile user data:', user);
  console.log('User username:', user?.username);
  console.log('User tenantId:', user?.tenantId);

  const handleLogout = async () => {
    try {
      await logout();
      navigate(`/login`, {
        state: {
          from: ''
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const anchorRef = useRef<any>(null);
  const [open, setOpen] = useState(false);
  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };
  const [isHovered, setIsHovered] = useState(false);

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <ButtonBase
        sx={{
          p: 0.25,
          borderRadius: 1,
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: 'common.white',
            '& .username-text': {
              color: variant === 'mobile' ? 'common.black' : 'common.black'
            }
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.secondary.dark}`,
            outlineOffset: 2
          }
        }}
        aria-label="open profile"
        ref={anchorRef}
        aria-controls={open ? 'profile-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 0.5 }}>
          <CircleUserRound color={variant === 'mobile' ? 'black' : isHovered ? 'black' : 'white'} />
          <Typography

            variant="subtitle1"
            className="username-text"
            sx={{
              color: variant === 'mobile' ? 'common.black' : 'common.white',
              transition: 'color 0.3s ease',
              cursor: 'pointer'
            }}
          >
            {user?.username || user?.loginid || 'Profile'}
          </Typography>
        </Stack>
      </ButtonBase>

      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 9]
              }
            }
          ]
        }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position="top-right" in={open} {...TransitionProps}>
            <Paper
              sx={{
                boxShadow: theme.customShadows.z1,
                width: 290,
                minWidth: 240,
                maxWidth: 290,
                [theme.breakpoints.down('md')]: {
                  maxWidth: 250
                }
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard elevation={0} border={false} content={false}>
                  <CardContent sx={{ px: 2.5, pt: 3, pb: 2 }}>
                    {user ? (
                      <Stack direction="column" spacing={2}>
                        <Stack direction="row" spacing={1.25} alignItems="flex-start">
                          <Avatar alt="profile user" src={avatar1} sx={{ width: 40, height: 40 }} />
                          <Stack sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {user.username || user.loginid || 'User'}
                            </Typography>
                            {user.tenantId && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                Tenant: {user.tenantId}
                              </Typography>
                            )}
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                              Company: {user.company_code || 'N/A'}
                            </Typography>
                          </Stack>
                          <Tooltip title="Logout">
                            <IconButton size="small" sx={{ color: 'text.primary' }} onClick={handleLogout}>
                              <LogoutOutlined />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Loading user data...
                      </Typography>
                    )}
                  </CardContent>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
};

export default Profile;
