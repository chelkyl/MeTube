import React, { useState, createContext, useReducer } from 'react';
import classNames from 'classnames';
import { makeStyles } from '@material-ui/styles';
import { useThemeMode } from '../theming';
import Masthead from '../components/masthead';
import Sidebar from '../components/sidebar';
import HomePage from './home';
import LoginPage from './login';
import RegisterPage from './register';
import BrowsePage from './browse';
import ViewPage from './view';
import Error404Page from './pageNotFound';
import {
  Route,
  Switch
} from 'react-router-dom';

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  root: {
    display: 'block',
    backgroundColor: theme.background,
    color: theme.primary, //FIXME: temporary, remove
    height: '100%',
    width: '100%'
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0
    }
  },
  content: {
    flexGrow: 1,
    flexShrink: 0,
    padding: theme.spacing.unit * 3,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginLeft: 0,
    textAlign: 'center'
  },
  contentShift: {
    [theme.breakpoints.up('sm')]: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen
      }),
      marginLeft: drawerWidth
    }
  },
  toolbar: theme.mixins.toolbar
}));

// TODO: better authentication, see https://stackoverflow.com/questions/49819183/react-what-is-the-best-way-to-handle-authenticated-logged-in-state

export const DrawerOpenDispatch = createContext(null);

export default function Layout({children}) {
  const classes = useStyles();
  const [themeMode, setThemeMode] = useThemeMode();

  const drawerOpenReducer = (state, action) => {
    switch (action) {
      case true:
      case false:
        return action;
      case 'toggle':
        return state === true ? false : true;
      default:
        return state;
    }
  };
  const [drawerOpen, drawerOpenDispatch] = useReducer(drawerOpenReducer, true);
  
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <div className={classes.root}>
      <DrawerOpenDispatch.Provider value={drawerOpenDispatch}>
        <Masthead isLoggedIn={loggedIn}/>
        <Sidebar className={classes.drawer} isOpen={drawerOpen}
          isLoggedIn={loggedIn}/>
      </DrawerOpenDispatch.Provider>
      <main className={classNames(classes.content, {
          [classes.contentShift]: drawerOpen
        })}>
        {children}
        <h1>Hello</h1>
        <button onClick={() => setThemeMode('toggle')}>Toggle {themeMode} theme</button>
        <button onClick={() => setLoggedIn(!loggedIn)}>Log In</button>
        <Switch>
          <Route path='/' exact component={HomePage}/>
          <Route path='/login' component={LoginPage}/>
          <Route path='/register' component={RegisterPage}/>
          <Route path='/browse' component={BrowsePage}/>
          <Route path='/view/:id' component={ViewPage}/>
          <Route component={Error404Page}/>
        </Switch>
      </main>
    </div>
  );
}
