import { styled } from '@mui/material/styles';

const FooterWrapper = styled('div')(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  width: '100%',
  // backgroundColor: '#fff',
  zIndex: 1000,
  boxShadow: '0px -10px 30px rgba(0, 0, 0, 0.22)',
  borderTop: '1px solid #2c2f35',
  padding: '5px 0',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '13px',
  lineHeight: '15px',
  color: '#9a9a96',
  backgroundColor: '#111318',
  fontWeight: 'normal',
  [theme.breakpoints.down('sm')]: {
    fontSize: '12px'
  }
}));

const Footer = () => <FooterWrapper>{`© 2025 Bayanat Technology All rights Reserved. Version 1.0.0.0`}</FooterWrapper>;

export default Footer;
