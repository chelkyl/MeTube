import React, { createContext, useContext, useReducer } from 'react';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles';

const baseTheme = {
  drawerWidth: 240
};

const lightTheme = {
  primary:    '#C4C3C4',
  secondary:  '#656774',
  error:      '#AA2121',
  background: '#F4F3F4',
  accent:     '#000',
  accentAlt:  '#fff'
};

const darkTheme = {
  primary:    '#949C9B',
  secondary:  '#A1A4AD',
  error:      '#ff4181',
  background: '#241C2B',
  accent:     '#fff',
  accentAlt:  '#000'
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
    ...baseTheme,
    ...themes[themeName]
  });
};

export const ThemeMode = createContext(null);

export const useThemeMode = () => useContext(ThemeMode);

export default function Theming({children, initialTheme}) {
  const themeModeReducer = (state, action) => {
    switch (action) {
      case 'light':
      case 'dark':
        return action;
      case 'toggle':
        return state === 'light' ? 'dark' : 'light';
      default:
        return state;
    }
  };
  const [themeMode, themeModeDispatch] = useReducer(themeModeReducer, initialTheme);
  return (
    <ThemeProvider theme={getTheme(themeMode)}>
      <ThemeMode.Provider value={[themeMode, themeModeDispatch]}>
        {children}
      </ThemeMode.Provider>
    </ThemeProvider>
  );
}
