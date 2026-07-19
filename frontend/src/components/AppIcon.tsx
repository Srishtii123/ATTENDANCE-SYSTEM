import { SunOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { dispatch } from 'store';
import { setSelectedApp } from 'store/reducers/customReducer/slice.menuSelectionSlice';
import { NavItemType } from 'types/menu';
import AccountBoxOutlinedIcon from '@mui/icons-material/AccountBoxOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import SellIcon from '@mui/icons-material/Sell';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { Dispatch, SetStateAction } from 'react';
import { FormattedMessage } from 'react-intl';
import { activeID, activeItem } from 'store/reducers/menu';

interface AppIconProps {
  item: NavItemType;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  variant?: 'default' | 'card';
}

const AppIcon = ({ item, setOpen, variant = 'default' }: AppIconProps) => {
  const navigate = useNavigate();

  const isCardVariant = variant === 'card';
  const iconSize = isCardVariant ? 32 : 28;
  
  // For default variant (MegaMenu), icons should be white on dark blue bg
  // For card variant (AppSelectionPage), icons should be dark on light/glass cards
  const iconColor = isCardVariant ? 'currentColor' : 'white';
  const iconProps = { style: { fontSize: iconSize, color: iconColor } };

  const renderIcon = () => {
    switch (item.title) {
      case 'FINANCE': return <AttachMoneyIcon {...iconProps} />;
      case 'WMS': return <WarehouseOutlinedIcon {...iconProps} />;
      case 'SECURITY': return <SecurityOutlinedIcon {...iconProps} />;
      case 'PF': return <SavingsOutlinedIcon {...iconProps} />;
      case 'HR': return <PeopleOutlineOutlinedIcon {...iconProps} />;
      case 'ACCOUNTS': return <AccountBoxOutlinedIcon {...iconProps} />;
      case 'SMS': return <SellIcon {...iconProps} />;
      case 'VENDOR': return <StorefrontOutlinedIcon {...iconProps} />;
      case 'ATTENDANCE': return <CalendarMonthOutlinedIcon {...iconProps} />;
      case 'PAMS': return <EmojiEventsOutlinedIcon {...iconProps} />;
      default: return <SunOutlined style={{ fontSize: iconSize, color: iconColor }} />;
    }
  };

  const handleClick = () => {
    dispatch(setSelectedApp(item.url_path));
    dispatch(activeID(null));
    dispatch(activeItem({ openItem: [''] }));
    navigate(`${item.url_path}/dashboard`);
    if (setOpen) {
      setOpen(false);
    }
  };

  // Card variant - just icon, no text (for AppSelectionPage gradient cards)
  if (isCardVariant) {
    return (
      <div className="flex justify-center items-center pointer-events-none">{renderIcon()}</div>
    );
  }

  // Default variant - icon + text (for MegaMenu)
  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer p-4 rounded-xl transition-all duration-300 hover:bg-blue-50 hover:shadow-md group"
      onClick={handleClick}
    >
      <div className="w-14 h-14 rounded-2xl flex justify-center items-center transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: '#082A89' }}>
        {renderIcon()}
      </div>
      <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
        <FormattedMessage id={item.title as string} />
      </span>
    </div>
  );
};
export default AppIcon;
