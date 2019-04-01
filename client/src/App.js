import React, { useReducer } from 'react';
import { ThemeProvider } from '@material-ui/styles';
import Layout from './pages/layout';
import { getTheme, ThemeMode } from './theming';

export default function App() {
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
  const [themeMode, themeModeDispatch] = useReducer(themeModeReducer, 'light');
  return (
    <ThemeProvider theme={getTheme(themeMode)}>
      <ThemeMode.Provider value={[themeMode, themeModeDispatch]}>
        <Layout/>
      </ThemeMode.Provider>
    </ThemeProvider>
  );
}
