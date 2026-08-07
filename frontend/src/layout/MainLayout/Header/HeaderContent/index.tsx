import { useEffect, useMemo, useState } from 'react';
import { Box, useMediaQuery, Typography, Drawer, IconButton } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, ChevronRight, Menu, Home, Settings, Users, FileText, Moon, Sun } from 'lucide-react';
import styles from '../../../../styles/Navigation.module.css';
import MegaMenuSection from './MegaMenuSection';
import MobileSection from './MobileSection';
import Profile from './Profile';
import Localization from './Localization';
import Notification from './Notification';
import useConfig from 'hooks/useConfig';
import { MenuOrientation, ThemeDirection, ThemeMode } from 'types/config';
import logo from 'assets/images/logo.png';
import { dispatch, useSelector } from 'store';
import useAuth from 'hooks/useAuth';
import { setSelectedApp } from 'store/reducers/customReducer/slice.menuSelectionSlice';
import { getPathNameList } from 'utils/functions';
import { IoMenuOutline } from 'react-icons/io5';
import { Button } from 'antd';
import Help from './Help';
import { attendanceMenuTree } from 'menu-items/attendanceMenu';


const LucideIcons = {
  Home,
  Settings,
  Users,
  FileText,
  Menu,
  LogOut,
  ChevronDown,
  ChevronRight
} as const;

interface MenuItem {
  id?: string;
  title: string;
  type: 'collapse' | 'group' | 'item';
  icon?: keyof typeof LucideIcons;
  url_path?: string;
  children?: MenuItem[];
}

const MenuItemComponent: React.FC<{
  item: MenuItem;
  isCollapsed: boolean;
  activeItemId: string | null;
  setActiveItemId: (id: string | null) => void;
  setIsCollapsed: (value: boolean) => void;
  expandedItems?: string[];
  setExpandedItems?: (items: string[]) => void;
  onDrawerClose?: () => void;
}> = ({ item, isCollapsed, activeItemId, setActiveItemId, setIsCollapsed, expandedItems = [], setExpandedItems, onDrawerClose }) => {
  const location = useLocation();
  const isActive = item.id === activeItemId;
  const isExpanded = item.id ? expandedItems.includes(item.id) : false;

  useEffect(() => {
    if (item.url_path && location.pathname === item.url_path) {
      setActiveItemId(item.id || null);
      // Expand parent items when child is active
      if (item.id && setExpandedItems) {
        setExpandedItems([...expandedItems, item.id]);
      }
    }
  }, [location.pathname]);

  const renderIcon = (icon: keyof typeof LucideIcons | string) => {
    const iconName = (icon.charAt(0).toUpperCase() + icon.slice(1).toLowerCase()) as keyof typeof LucideIcons;
    const IconComponent = LucideIcons[iconName];
    return IconComponent ? (
      <div className={`${styles.iconWrapper} ${isActive ? styles.activeIcon : ''}`}>
        <IconComponent color={isActive ? '#5DCAA5' : '#9a9a96'} size={24} />
      </div>
    ) : null;
  };

  const handleCollapse = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!item.id || !setExpandedItems) return;

    const newExpanded = isExpanded ? expandedItems.filter((id) => id !== item.id) : [...expandedItems, item.id];
    setExpandedItems(newExpanded);
    setActiveItemId(item.id);
  };

  if (item.type === 'collapse' && item.children) {
    return (
      <li className={`${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}>
        <div
          className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
          onClick={handleCollapse}
          style={{
            position: 'relative',
            ...(isActive
              ? {
                  backgroundColor: '#1c1f24',
                  borderRadius: '8px',
                  boxShadow: 'inset 0 0 0 1px #2c2f35'
                }
              : {})
          }}
        >
          {isActive && <div className={styles.activeIndicator} />}
          {item.icon && renderIcon(item.icon)}
          <span className={isActive ? styles.activeText : ''}>{item.title}</span>
          {isExpanded ? (
            <ChevronDown size={16} color={isActive ? '#5DCAA5' : '#9a9a96'} />
          ) : (
            <ChevronRight size={16} color={isActive ? '#5DCAA5' : '#9a9a96'} />
          )}
        </div>
        {isExpanded && (
          <ul className={styles.subMenu}>
            {item.children.map((child, idx) => (
              <MenuItemComponent
                key={child.id || idx}
                item={child}
                isCollapsed={isCollapsed}
                activeItemId={activeItemId}
                setActiveItemId={setActiveItemId}
                setIsCollapsed={setIsCollapsed}
                expandedItems={expandedItems}
                setExpandedItems={setExpandedItems}
                onDrawerClose={onDrawerClose}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  if (item.type === 'item') {
    return (
      <li className={`${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}>
        <Link
          to={item.url_path || '#'}
          className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
          onClick={() => {
            setActiveItemId(item.id || null);
            onDrawerClose?.();
          }}
        >
          {isActive && <div className={styles.activeIndicator} />}
          {item.icon && renderIcon(item.icon)}
          <span className={`${styles.menuText} ${isActive ? styles.activeText : ''}`}>{item.title}</span>
        </Link>
      </li>
    );
  }

  if (item.type === 'group' && item.children) {
    return (
      <>
        <div className={styles.groupTitle}>{item.title}</div>
        {item.children.map((child, idx) => (
          <MenuItemComponent
            key={child.id || idx}
            item={child}
            isCollapsed={isCollapsed}
            activeItemId={activeItemId}
            setActiveItemId={setActiveItemId}
            setIsCollapsed={setIsCollapsed}
            expandedItems={expandedItems}
            setExpandedItems={setExpandedItems}
            onDrawerClose={onDrawerClose}
          />
        ))}
      </>
    );
  }

  return null;
};

interface HeaderProps {
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isCollapsed?: boolean;
}
const HeaderContent = ({ isCollapsed, setIsCollapsed }: HeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const downLG = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const { i18n, menuOrientation, mode, onChangeDirection, onChangeMode } = useConfig();
  const location = useLocation();
  const { app } = useSelector((state) => state.menuSelectionSlice);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  // const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const megaMenu = useMemo(() => <MegaMenuSection />, []);
  const localization = useMemo(() => <Localization />, [i18n]);

  const { logout } = useAuth();

  const navigate = useNavigate();
  const handleHomeClick = () => {
    if (app === 'attendance') {
      navigate('/attendance/mark');
      return;
    }

    if (app) {
      navigate(`/${app}/dashboard`);
    } else {
      navigate('/dashboard');
    }
  };

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

  const isDarkMode = mode === ThemeMode.DARK;
  const handleThemeToggle = () => {
    onChangeMode(isDarkMode ? ThemeMode.LIGHT : ThemeMode.DARK);
  };

  useEffect(() => {
    if (i18n === 'ar') {
      onChangeDirection(ThemeDirection.RTL);
      return;
    }
    onChangeDirection(ThemeDirection.LTR);
  }, [i18n]);

  useEffect(() => {
    const pathNameList = getPathNameList(location.pathname);
    dispatch(setSelectedApp(pathNameList[0]));
  }, [location.pathname]);

  useEffect(() => {
    handlerMenuItem();
  }, [app]);

  const handlerMenuItem = () => {
    if (app !== 'attendance') {
      setMenuItems([]);
      return;
    }

    const selectAppIndex = attendanceMenuTree.findIndex((eachApp) => eachApp?.url_path === app);

    if (selectAppIndex === -1) {
      setMenuItems([]);
      return;
    }

    const { children = [] } = attendanceMenuTree[selectAppIndex];

    if (!children.length) {
      setMenuItems([]);
      return;
    }

    try {
      const removeUnderscores = (text: string) => {
        return text.replace(/_/g, ' ');
      };

      const processMenuItems = (items: any[]): MenuItem[] => {
        return items.map((item) => {
          if (!item) {
            return {
              id: String(Math.random()),
              title: 'Invalid Item',
              type: 'item'
            };
          }

          return {
            id: item.id || String(Math.random()),
            title: typeof item.title === 'string' ? removeUnderscores(item.title) : 'Untitled',
            type: item.type || (item.children?.length ? 'collapse' : 'item'),
            url_path: item.url_path,
            icon: item.icon,
            children: item.children ? processMenuItems(item.children) : undefined
          };
        });
      };

      const itemsData = processMenuItems(children);
      setMenuItems(itemsData);
    } catch (error) {
      setMenuItems([]);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#f2f2f0' }}>
        {downLG && <Button size="middle" onClick={handleDrawerToggle} shape="circle" icon={<Menu style={{ color: '#5DCAA5' }} />} />}
        {/* <img className="w-20 h-10" src={bayanatLogo} alt="logo" /> */}
        {downLG ? (
          <IconButton onClick={handleHomeClick} sx={{ color: '#f2f2f0' }}>
            <Home size={24} />
          </IconButton>
        ) : (
          // <Button size="middle" onClick={handleHomeClick} shape="circle" icon={<Home style={{ color: '#082a89' }} />} />
          // Main text on home screen
          <>
            <div className="flex cursor-pointer bg-[#111318] p-2 w-[180px]" onClick={handleHomeClick}>
              <Typography
                variant="h4"
                sx={{
                  color: '#f2f2f0',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  lineHeight: 1,
                  fontFamily: '"Segoe UI", "Helvetica", "Arial", sans-serif',
                  whiteSpace: 'nowrap',
                  fontSize: '1rem'
                }}
              >
                Bayanat Technology
              </Typography>
            </div>
            <div className="pl-1 cursor-pointer">
              <IoMenuOutline
                size={35}
                color="white"
                onClick={() => {
                  console.log('clicked');
                  setIsCollapsed?.((prev: boolean) => !prev);
                }}
              />
            </div>
          </>
        )}
      </Box>

      {menuOrientation === MenuOrientation.HORIZONTAL && !downLG && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}></Box>
      )}

      {downLG && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true
          }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': {
              width: 280,
              background: '#111318',
              color: '#f2f2f0',
              borderRight: '1px solid #2c2f35',
              height: '100%',
              '& > div': {
                height: '100%',
                overflow: 'auto'
              }
            }
          }}
        >
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Drawer Header */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid #2c2f35' }}>
              <img className="w-20 h-10" src={logo} alt="logo" />
              <Typography
                variant="h4"
                sx={{
                  color: '#f2f2f0',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  lineHeight: 1,
                  fontFamily: '"Segoe UI", "Helvetica", "Arial", sans-serif',
                  whiteSpace: 'nowrap',
                  fontSize: '1rem'
                }}
              >
                Bayanat Technology
              </Typography>
            </Box>

            {/* Drawer Content */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                padding: '14px',
                '& ul': {
                  margin: 0,
                  padding: '16px 0',
                  listStyle: 'none'
                }
              }}
            >
              {menuItems.map((item, index) => (
                <MenuItemComponent
                  key={item.id || index}
                  item={item}
                  isCollapsed={isCollapsed ?? true}
                  activeItemId={activeItemId}
                  setActiveItemId={setActiveItemId}
                  setIsCollapsed={setIsCollapsed ?? (() => {})}
                  expandedItems={expandedItems}
                  setExpandedItems={setExpandedItems}
                  onDrawerClose={handleDrawerToggle}
                />
              ))}
            </Box>

            <Box
              sx={{
                borderTop: '1px solid #2c2f35',
                p: 2,
                mt: 'auto'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  gap: 1,
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
                onClick={handleLogout}
              >
                <LogOut size={20} color="#9a9a96" />
                <Typography color="#9a9a96">Logout</Typography>
              </Box>
            </Box>
          </Box>
        </Drawer>
      )}

      {downLG && <Box sx={{ width: '100%', ml: 1 }} />}

      <div className="flex justify-end items-center w-full">
        {megaMenu}
        {!downLG && localization}
        <IconButton
          sx={{
            color: isDarkMode ? '#FAC775' : '#0F6E56',
            backgroundColor: isDarkMode ? 'rgba(250,199,117,0.12)' : 'rgba(93,202,165,0.12)',
            ':hover': {
              backgroundColor: isDarkMode ? 'rgba(250,199,117,0.2)' : 'rgba(93,202,165,0.2)'
            }
          }}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={handleThemeToggle}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </IconButton>
        {!downLG && (
          <IconButton
            sx={{
              backgroundColor: isHovered ? 'rgba(93,202,165,0.14)' : 'transparent',
              ':hover': {
                backgroundColor: 'rgba(93,202,165,0.14)'
              }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label="open profile"
            onClick={handleHomeClick}
          >
            <Home size={'20px'} color={isHovered ? '#5DCAA5' : '#f2f2f0'} />
          </IconButton>
        )}
        <Notification />
        <Help />
        {!downLG && <Profile />}
        {downLG && <MobileSection />}
      </div>
    </>
  );
};

export default HeaderContent;
