import { createContext, useContext } from 'react';
import { createMuiTheme } from '@material-ui/core/styles';

const lightTheme = {
  primary:    '#C4C3C4',
  secondary:  '#656774',
  error:      '#AA2121',
  background: '#F4F3F4'
};

const darkTheme = {
  primary:    '#241C2B',
  secondary:  '#A1A4AD',
  error:      '#AA2121',
  background: '#241C2B'
};

const themes = {
  'light': lightTheme,
  'dark': darkTheme
};

let getThemePalette = (themeName) => {
  const palette = themes[themeName];
  if (!palette) return {};
  return {
    primary: {
      main: palette.primary
    },
    secondary: {
      main: palette.secondary
    },
    error: {
      main: palette.error
    },
    background: {
      default: palette.background
    }
  };
};

export let getTheme = (themeName,themeMode) => {
  return createMuiTheme({
    palette: {
      type: themeMode !== undefined ? themeMode : themeName,
      ...getThemePalette(themeName)
    },
    typography: {
      useNextVariants: true
    },
    ...themes[themeName]
  });
};

export const ThemeMode = createContext(null);

export const useThemeMode = () => useContext(ThemeMode);
