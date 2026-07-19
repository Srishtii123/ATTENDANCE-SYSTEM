// material-ui
import { alpha, createTheme } from '@mui/material/styles';

// third-party
import { presetDarkPalettes, presetPalettes, PalettesProps } from '@ant-design/colors';

// project import
import ThemeOption from './theme';

// types
import { PaletteThemeProps } from 'types/theme';
import { PresetColor, ThemeMode } from 'types/config';

// ==============================|| DEFAULT THEME - PALETTE  ||============================== //

const Palette = (mode: ThemeMode, presetColor: PresetColor) => {
  const colors: PalettesProps = mode === ThemeMode.DARK ? presetDarkPalettes : presetPalettes;

  let greyPrimary = [
    '#ffffff',
    '#fafafa',
    '#f5f5f5',
    '#f0f0f0',
    '#d9d9d9',
    '#bfbfbf',
    '#8c8c8c',
    '#595959',
    '#262626',
    '#141414',
    '#000000'
  ];
  let greyAscent = ['#fafafa', '#bfbfbf', '#434343', '#1f1f1f'];
  let greyConstant = ['#fafafb', '#e6ebf1'];

  if (mode === ThemeMode.DARK) {
    greyPrimary = ['#000000', '#141414', '#1e1e1e', '#595959', '#8c8c8c', '#bfbfbf', '#d9d9d9', '#f0f0f0', '#f5f5f5', '#fafafa', '#ffffff'];
    // greyPrimary.reverse();
    greyAscent = ['#fafafa', '#bfbfbf', '#434343', '#1f1f1f'];
    greyConstant = ['#121212', '#d3d8db'];
  }
  colors.grey = [...greyPrimary, ...greyAscent, ...greyConstant];

  const paletteColor: PaletteThemeProps = ThemeOption(colors, presetColor, mode);

  return createTheme({
    palette: {
      mode,
      common: {
        black: '#000',
        white: '#fff'
      },
      ...paletteColor,
      ...(mode === ThemeMode.DARK && {
        primary: {
          ...paletteColor.primary,
          lighter: 'rgba(93,202,165,0.14)',
          light: '#8BE6C8',
          main: '#5DCAA5',
          dark: '#1D9E75',
          darker: '#0F6E56',
          contrastText: '#07110f'
        },
        secondary: {
          ...paletteColor.secondary,
          lighter: '#1c1f24',
          light: '#2c2f35',
          main: '#9a9a96',
          dark: '#f2f2f0',
          darker: '#ffffff',
          contrastText: '#14161a'
        }
      }),
      text: {
        primary: mode === ThemeMode.DARK ? '#f2f2f0' : paletteColor.grey[700],
        secondary: mode === ThemeMode.DARK ? '#9a9a96' : paletteColor.grey[500],
        disabled: mode === ThemeMode.DARK ? alpha(paletteColor.grey[900]!, 0.1) : paletteColor.grey[400]
      },
      action: {
        disabled: paletteColor.grey[300]
      },
      divider: mode === ThemeMode.DARK ? '#2c2f35' : paletteColor.grey[200],
      background: {
        paper: mode === ThemeMode.DARK ? '#1c1f24' : paletteColor.grey[0],
        default: mode === ThemeMode.DARK ? '#14161a' : paletteColor.grey.A50
      }
    }
  });
};

export default Palette;
