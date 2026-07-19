import { ReactNode } from 'react';

// material-ui
import { Box, Grid } from '@mui/material';

// project import
import AuthFooter from 'components/cards/AuthFooter';
import AuthCard from './AuthCard';

interface Props {
  children: ReactNode;
}

// ==============================|| AUTHENTICATION - WRAPPER ||============================== //

const AuthWrapper = ({ children }: Props) => {
  const BoxDecoration = () => (
    <Box
      sx={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        top: 0,
        left: 0,
        zIndex: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
      }}
    >
      {/* 3D Isometric Boxes - Cleaner Background */}
      <svg
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.65,
          pointerEvents: 'none'
        }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ===== TOP LEFT AREA ===== */}
        {/* Small Pink Box - Top Left */}
        <g transform="translate(130, 50)">
          <polygon points="0,50 35,70 70,50 35,30" fill="none" stroke="#ff006e" strokeWidth="2.5" opacity="0.9" />
          <polygon points="35,30 70,50 70,110 35,90" fill="none" stroke="#ff006e" strokeWidth="2.5" opacity="0.7" />
          <polygon points="0,50 35,90 35,150 0,110" fill="none" stroke="#ff006e" strokeWidth="2.5" opacity="0.5" />
        </g>

        {/* Large Pink Box - Left Side */}
        <g transform="translate(90, 160)">
          <polygon points="0,85 58,120 116,85 58,50" fill="none" stroke="#ff1b9c" strokeWidth="3" opacity="0.95" />
          <polygon points="58,50 116,85 116,180 58,145" fill="none" stroke="#ff1b9c" strokeWidth="3" opacity="0.75" />
          <polygon points="0,85 58,145 58,240 0,180" fill="none" stroke="#ff1b9c" strokeWidth="3" opacity="0.55" />
        </g>

        {/* ===== CENTER TOP AREA ===== */}
        {/* Medium Purple Box */}
        <g transform="translate(360, 80)">
          <polygon points="0,70 48,98 96,70 48,42" fill="none" stroke="#b833ff" strokeWidth="2.8" opacity="0.92" />
          <polygon points="48,42 96,70 96,150 48,122" fill="none" stroke="#b833ff" strokeWidth="2.8" opacity="0.72" />
          <polygon points="0,70 48,122 48,202 0,150" fill="none" stroke="#b833ff" strokeWidth="2.8" opacity="0.52" />
        </g>

        {/* Small Purple Box */}
        <g transform="translate(530, 170)">
          <polygon points="0,40 28,55 56,40 28,25" fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.8" />
          <polygon points="28,25 56,40 56,90 28,75" fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.6" />
          <polygon points="0,40 28,75 28,115 0,90" fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.4" />
        </g>

        {/* Medium Purple Box - Center */}
        <g transform="translate(450, 260)">
          <polygon points="0,65 45,90 90,65 45,40" fill="none" stroke="#9d4edd" strokeWidth="2.5" opacity="0.85" />
          <polygon points="45,40 90,65 90,140 45,115" fill="none" stroke="#9d4edd" strokeWidth="2.5" opacity="0.65" />
          <polygon points="0,65 45,115 45,190 0,140" fill="none" stroke="#9d4edd" strokeWidth="2.5" opacity="0.45" />
        </g>

        {/* ===== CENTER RIGHT AREA ===== */}
        {/* Medium Blue Box */}
        <g transform="translate(600, 120)">
          <polygon points="0,65 45,90 90,65 45,40" fill="none" stroke="#0096ff" strokeWidth="2.5" opacity="0.88" />
          <polygon points="45,40 90,65 90,140 45,115" fill="none" stroke="#0096ff" strokeWidth="2.5" opacity="0.68" />
          <polygon points="0,65 45,115 45,190 0,140" fill="none" stroke="#0096ff" strokeWidth="2.5" opacity="0.48" />
        </g>

        {/* Small Blue Box */}
        <g transform="translate(720, 200)">
          <polygon points="0,40 28,55 56,40 28,25" fill="none" stroke="#0284c7" strokeWidth="1.8" opacity="0.75" />
          <polygon points="28,25 56,40 56,90 28,75" fill="none" stroke="#0284c7" strokeWidth="1.8" opacity="0.55" />
          <polygon points="0,40 28,75 28,115 0,90" fill="none" stroke="#0284c7" strokeWidth="1.8" opacity="0.35" />
        </g>

        {/* Large Blue Box - Center */}
        <g transform="translate(720, 340)">
          <polygon points="0,90 62,128 124,90 62,52" fill="none" stroke="#00b4d8" strokeWidth="3.2" opacity="0.92" />
          <polygon points="62,52 124,90 124,190 62,152" fill="none" stroke="#00b4d8" strokeWidth="3.2" opacity="0.72" />
          <polygon points="0,90 62,152 62,252 0,190" fill="none" stroke="#00b4d8" strokeWidth="3.2" opacity="0.52" />
        </g>

        {/* Small Box Inside Blue Area */}
        <g transform="translate(760, 400)">
          <polygon points="0,35 25,50 50,35 25,20" fill="none" stroke="#00e5ff" strokeWidth="1.5" opacity="0.7" />
          <polygon points="25,20 50,35 50,70 25,55" fill="none" stroke="#00e5ff" strokeWidth="1.5" opacity="0.5" />
          <polygon points="0,35 25,55 25,90 0,70" fill="none" stroke="#00e5ff" strokeWidth="1.5" opacity="0.3" />
        </g>

        {/* ===== RIGHT SIDE AREA ===== */}
        {/* Large Cyan Box - Right Top */}
        <g transform="translate(950, 100)">
          <polygon points="0,95 65,132 130,95 65,58" fill="none" stroke="#06b6d4" strokeWidth="3.2" opacity="0.92" />
          <polygon points="65,58 130,95 130,190 65,153" fill="none" stroke="#06b6d4" strokeWidth="3.2" opacity="0.72" />
          <polygon points="0,95 65,153 65,248 0,190" fill="none" stroke="#06b6d4" strokeWidth="3.2" opacity="0.52" />
        </g>

        {/* Small Cyan Box - Right */}
        <g transform="translate(1080, 160)">
          <polygon points="0,40 28,55 56,40 28,25" fill="none" stroke="#00d9ff" strokeWidth="2" opacity="0.8" />
          <polygon points="28,25 56,40 56,90 28,75" fill="none" stroke="#00d9ff" strokeWidth="2" opacity="0.6" />
          <polygon points="0,40 28,75 28,115 0,90" fill="none" stroke="#00d9ff" strokeWidth="2" opacity="0.4" />
        </g>

        {/* Medium Green Box - Right Center */}
        <g transform="translate(980, 380)">
          <polygon points="0,75 52,105 104,75 52,45" fill="none" stroke="#06d6a0" strokeWidth="2.8" opacity="0.88" />
          <polygon points="52,45 104,75 104,160 52,130" fill="none" stroke="#06d6a0" strokeWidth="2.8" opacity="0.68" />
          <polygon points="0,75 52,130 52,215 0,160" fill="none" stroke="#06d6a0" strokeWidth="2.8" opacity="0.48" />
        </g>

        {/* Small Green Box */}
        <g transform="translate(1100, 320)">
          <polygon points="0,35 25,50 50,35 25,20" fill="none" stroke="#1dd1a1" strokeWidth="1.8" opacity="0.75" />
          <polygon points="25,20 50,35 50,70 25,55" fill="none" stroke="#1dd1a1" strokeWidth="1.8" opacity="0.55" />
          <polygon points="0,35 25,55 25,90 0,70" fill="none" stroke="#1dd1a1" strokeWidth="1.8" opacity="0.35" />
        </g>

        {/* Large Green Box - Bottom Right */}
        <g transform="translate(1000, 520)">
          <polygon points="0,80 55,112 110,80 55,48" fill="none" stroke="#14f195" strokeWidth="3" opacity="0.88" />
          <polygon points="55,48 110,80 110,168 55,136" fill="none" stroke="#14f195" strokeWidth="3" opacity="0.68" />
          <polygon points="0,80 55,136 55,224 0,168" fill="none" stroke="#14f195" strokeWidth="3" opacity="0.48" />
        </g>

        {/* ===== BOTTOM RIGHT AREA ===== */}
        {/* Yellow-Green Box */}
        <g transform="translate(1150, 520)">
          <polygon points="0,60 42,85 84,60 42,35" fill="none" stroke="#ecff12" strokeWidth="2.5" opacity="0.8" />
          <polygon points="42,35 84,60 84,135 42,110" fill="none" stroke="#ecff12" strokeWidth="2.5" opacity="0.6" />
          <polygon points="0,60 42,110 42,185 0,135" fill="none" stroke="#ecff12" strokeWidth="2.5" opacity="0.4" />
        </g>

        {/* Additional Small Purple Box - Bottom Center */}
        <g transform="translate(570, 480)">
          <polygon points="0,50 35,70 70,50 35,30" fill="none" stroke="#7c3aed" strokeWidth="2" opacity="0.7" />
          <polygon points="35,30 70,50 70,110 35,90" fill="none" stroke="#7c3aed" strokeWidth="2" opacity="0.5" />
          <polygon points="0,50 35,90 35,150 0,110" fill="none" stroke="#7c3aed" strokeWidth="2" opacity="0.3" />
        </g>

        {/* Additional Cyan Box - Bottom Center */}
        <g transform="translate(800, 520)">
          <polygon points="0,55 38,77 76,55 38,33" fill="none" stroke="#22d3ee" strokeWidth="2.2" opacity="0.75" />
          <polygon points="38,33 76,55 76,122 38,100" fill="none" stroke="#22d3ee" strokeWidth="2.2" opacity="0.55" />
          <polygon points="0,55 38,100 38,167 0,122" fill="none" stroke="#22d3ee" strokeWidth="2.2" opacity="0.35" />
        </g>
      </svg>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a3e 0%, #16213e 20%, #0f3460 45%, #1a2845 70%, #0f2847 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 40%), radial-gradient(circle at 70% 70%, rgba(168, 85, 247, 0.05) 0%, transparent 40%)',
          pointerEvents: 'none',
          zIndex: 1
        }
      }}
    >
      <BoxDecoration />

      <Grid
        container
        direction="column"
        justifyContent={{ xs: 'center', sm: 'center', md: 'center' }}
        sx={{
          minHeight: '100vh',
          position: 'relative',
          zIndex: 2
        }}
      >
        <Grid item xs={12}>
          <Grid
            item
            xs={12}
            container
            justifyContent="flex-start"
            alignItems="center"
            sx={{
              minHeight: {
                xs: 'auto',
                sm: 'auto',
                md: 'auto'
              },
              pl: { xs: 2, sm: 3, md: 6 },
              py: { xs: 6, sm: 8, md: 12 },
              mt: { xs: 8, sm: 12, md: 16 }
            }}
          >
            <Grid item>
              <AuthCard>{children}</AuthCard>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sx={{ mt: 'auto', m: 3 }}>
          <AuthFooter />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuthWrapper;
