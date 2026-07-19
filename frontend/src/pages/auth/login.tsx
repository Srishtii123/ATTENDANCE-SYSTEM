import React from 'react'; 

import { Link } from 'react-router-dom';
import { Grid, Stack, Typography, Checkbox, FormControlLabel, Divider, Box } from '@mui/material';
import useAuth from 'hooks/useAuth';
import AuthWrapper from 'sections/auth/AuthWrapper';
import AuthLogin from 'sections/auth/auth-forms/AuthLogin';
import Logo from 'components/logo'; 

const Login = () => {
  const { isLoggedIn } = useAuth();
  const [rememberMe, setRememberMe] = React.useState(false);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(event.target.checked);
  };

  return (
    <AuthWrapper>
      <Grid container spacing={1.5}>
        {/* Logo and Title Section */}
        <Grid item xs={12}>
          <Stack
            direction="column"
            justifyContent="center"
            alignItems="center"
            spacing={1}
            sx={{ mb: 0.5 }}
          >
            <Logo sx={{ mr: 1 }} />
            <Stack direction="column" alignItems="center" spacing={0.2}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Welcome Back
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                Sign in to your account to continue
              </Typography>
            </Stack>
          </Stack>
        </Grid>

        {/* Login Form */}
        <Grid item xs={12}>
          <AuthLogin />
        </Grid>

        {/* Remember Me Checkbox */}
        <Grid item xs={12} sx={{ mt: -1 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={rememberMe} 
                onChange={handleCheckboxChange} 
                name="rememberMe" 
                color="primary"
                size="small"
              />
            }
            label={
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Remember me
              </Typography>
            }
          />
        </Grid>

        {/* Divider */}
        <Grid item xs={12} sx={{ mt: 0 }}>
          <Divider />
        </Grid>

        {/* Sign Up Link */}
        <Grid item xs={12} sx={{ mt: 0 }}>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Don&apos;t have an account?
            </Typography>
            <Typography
              component={Link}
              to={isLoggedIn ? '/auth/register' : '/register'}
              variant="caption"
              sx={{ 
                textDecoration: 'none',
                color: 'primary.main',
                fontWeight: 600,
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Sign up
            </Typography>
          </Stack>
        </Grid>

        {/* Footer with Logo - Separate Row */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              mt: 2,
              pt: 1
            }}
          >
            <img 
              src="/logo.png" 
              alt="Bayanat" 
              style={{ width: 68, height: 68, objectFit: 'contain' }}
            />
          </Box>
        </Grid>
      </Grid>
    </AuthWrapper>
  );
};

export default Login;
