import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../../styles/Navigation.module.css';
import { LogOut, ChevronDown, ChevronRight, Menu, Home, Settings, Users, FileText, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { dispatch, useSelector } from 'store';
import { setSelectedApp } from 'store/reducers/customReducer/slice.menuSelectionSlice';
import { getPathNameList } from 'utils/functions';
import useScreenSize from 'hooks/useScreenSize';
import { attendanceMenuTree } from 'menu-items/attendanceMenu';

interface MenuItem {
  id?: string;
  title: string;
  type: 'collapse' | 'group' | 'item';
  icon?: keyof typeof LucideIcons;
  url_path?: string;
  children?: MenuItem[];
}

const LucideIcons = {
  Home,
  Settings,
  Users,
  FileText,
  ClipboardCheck,
  ShieldCheck,
  Menu,
  LogOut,
  ChevronDown,
  ChevronRight
} as const;

const formatTitle = (title: string) => {
  return title
    .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const MenuItemComponent: React.FC<{
  item: MenuItem;
  isCollapsed: boolean;
  activeItemId: string | null;
  setActiveItemId: (id: string | null) => void;
  setIsCollapsed: (value: boolean) => void;
}> = ({ item, isCollapsed, activeItemId, setActiveItemId, setIsCollapsed }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  const isActive = item.id === activeItemId;

  useEffect(() => {
    // Set active state based on current URL when component mounts
    if (item.url_path && location.pathname === item.url_path) {
      setActiveItemId(item.id || null);
    }
  }, [location.pathname]);

  const renderIcon = (icon: keyof typeof LucideIcons | string) => {
    const IconComponent = LucideIcons[icon as keyof typeof LucideIcons];
    return IconComponent ? (
      <div className={`${styles.iconWrapper} ${isActive ? styles.activeIcon : ''}`} aria-hidden="true">
        <IconComponent size={19} strokeWidth={1.8} />
      </div>
    ) : null;
  };

  if (item.type === 'collapse' && item.children) {
    return (
      <li className={`${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}>
        <div
          className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
          onClick={() => {
            setIsExpanded(!isExpanded);
            setActiveItemId(item.id || null);
          }}
          title={formatTitle(item.title)} // Add tooltip
          style={{ position: 'relative' }}
        >
          {isActive && <div className={styles.activeIndicator} />}
          {/* items icon */}
          {/* {item.icon && <ChevronRight size={24} strokeWidth={2} color={isActive ? '#082a89' : '#fff'} />} */}
          {!isCollapsed && (
            <span className={isActive ? styles.activeText : ''}>
              {formatTitle(item.title)}
            </span>
          )}
          {isCollapsed ? (
            <ChevronRight size={16} color={isActive ? '#5DCAA5' : '#9a9a96'} />
          ) : isExpanded ? (
            <ChevronDown size={16} color={isActive ? '#5DCAA5' : '#9a9a96'} />
          ) : (
            <ChevronRight size={16} color={isActive ? '#5DCAA5' : '#9a9a96'} />
          )}
        </div>
        {isExpanded && !isCollapsed && (
          <ul className={styles.subMenu}>
            {item.children.map((child, idx) => (
              <MenuItemComponent
                key={child.id || idx}
                item={child}
                isCollapsed={isCollapsed}
                activeItemId={activeItemId}
                setActiveItemId={setActiveItemId}
                setIsCollapsed={setIsCollapsed}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  if (item.type === 'item') {
    const hasSelectedChild = item.children?.some((child) => {
      const childPath = child.url_path;
      return childPath && location.pathname.startsWith(childPath);
    });

    return (
      <li className={`${styles.navItem} ${isActive || hasSelectedChild ? styles.activeNavItem : ''}`}>
        <Link
          to={item.url_path || '#'}
          className={`${styles.menuItem} ${isActive || hasSelectedChild ? styles.active : ''}`}
          onClick={() => {
            setActiveItemId(item.id || null);
            // setIsCollapsed(true);
          }}
          title={formatTitle(item.title)}
        >
          {(isActive || hasSelectedChild) && <div className={styles.activeIndicator} />}
          {item.icon && <span className={styles.icon}>{renderIcon(item.icon)}</span>}

          {!isCollapsed && (
            <span className={`${styles.menuText} ${isActive || hasSelectedChild ? styles.activeText : ''}`}>
              {formatTitle(item.title)}
            </span>
          )}
          {/* sub small items arrow */}
          {/* {!isCollapsed && <ChevronRight size={16} className={styles.chevron} />} */}
        </Link>
      </li>
    );
  }

  if (item.type === 'group' && item.children) {
    return (
      <>
        {!isCollapsed && <div className={styles.groupTitle}>{item.title}</div>}
        {item.children.map((child, idx) => (
          <MenuItemComponent
            key={child.id || idx}
            item={child}
            isCollapsed={isCollapsed}
            activeItemId={activeItemId}
            setActiveItemId={setActiveItemId}
            setIsCollapsed={setIsCollapsed}
          />
        ))}
      </>
    );
  }

  return null;
};

interface NavigationProps {
  isMobile?: boolean;
  onClose?: () => void;
  setIsCollapsed?: (value: boolean) => void;
  isCollapsed?: boolean;
}

const Navigation = ({ onClose, isCollapsed, setIsCollapsed }: NavigationProps) => {
  const location = useLocation();
  const { app } = useSelector((state) => state.menuSelectionSlice);
  // const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [, setWindowWidth] = useState(window.innerWidth);
  const { isMobile } = useScreenSize();

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    if (selectAppIndex === -1) return;

    const { children = [] } = attendanceMenuTree[selectAppIndex];

    const itemsData = children.map((child) => ({
      ...child,
      title: typeof child.title === 'string' ? child.title : 'Untitled'
    }));

    setMenuItems(itemsData as MenuItem[]);
  };

  return (
    <div
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
      style={{
        fontFamily: 'Inter, sans-serif',
        zIndex: 1000,
        backgroundColor: '#111a2e',
        color: '#dce4f2',
        marginTop: isMobile ? '64px' : '0',
        position: isMobile ? 'static' : 'fixed',
        top: isMobile ? 'unset' : '64px',
        left: isMobile ? 'unset' : '0',
        height: isMobile ? '100%' : 'calc(100vh - 64px)',
        paddingLeft: 8,
        paddingRight: 8
      }}
    >
      <div
        style={{
          height: isMobile ? 'auto' : 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <ul
            className={styles.navList}
            style={{
              height: '100%',
              overflowY: 'scroll',
              marginRight: '-17px', // Hides scrollbar in most browsers
              paddingRight: '17px' // Compensates for the negative margin
            }}
          >
            {menuItems.map((item, index) => (
              <MenuItemComponent
                key={item.id || index}
                item={{
                  ...item,
                  icon:
                    item.icon ||
                    ({
                      attendance_dashboard: 'Home',
                      attendance_approvals: 'ClipboardCheck',
                      attendance_employee_register: 'Users',
                      attendance_page: 'FileText',
                      attendance_proxy_logs: 'ShieldCheck'
                    }[item.id || ''] as keyof typeof LucideIcons | undefined),
                  title: item.title.replace(/\s+/g, ' ').trim() // Normalize whitespace
                }}
                isCollapsed={isCollapsed ?? true}
                activeItemId={activeItemId}
                setActiveItemId={setActiveItemId}
                setIsCollapsed={setIsCollapsed ?? (() => {})}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
