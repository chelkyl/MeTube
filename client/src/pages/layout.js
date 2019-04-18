import React, { createContext, useReducer } from 'react';
import classNames from 'classnames';
import { makeStyles, useTheme } from '@material-ui/styles';
import Masthead from '../components/masthead';
import Sidebar from '../components/sidebar';
import HomePage from './home';
import LoginPage from './login';
import RegisterPage from './register';
import BrowsePage from './browse';
import ViewPage from './view';
import PlaylistPage from './playlist';
import UserPage from './channel';
import UploadPage from './upload';
import OptionsPage from './options';
import Error404Page from './pageNotFound';
import {
  Route,
  Switch
} from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  layoutRoot: {
    display: 'block',
    backgroundColor: theme.background,
    height: '100%',
    width: '100%',
    overflow: 'auto'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    // padding: theme.spacing.unit * 3,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    textAlign: 'center',
    marginTop: 56,
    padding: theme.spacing.unit * 3,
    [theme.breakpoints.up(0)+' and (orientation: landscape)']: {
      marginTop: 48
    },
    [theme.breakpoints.up('md')]: {
      marginTop: 64
    }
  },
  contentShift: {
    [theme.breakpoints.up('md')]: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen
      }),
      marginLeft: theme.drawerWidth
    }
  }
}));

export const DrawerOpenDispatch = createContext(null);

export default function Layout({children}) {
  const classes = useStyles();
  const theme = useTheme();

  const drawerOpenReducer = (state, action) => {
    switch (action) {
      case true:
      case false:
        return action;
      case 'toggle':
        return !state;
      default:
        return state;
    }
  };
  const [drawerOpen, drawerOpenDispatch] = useReducer(drawerOpenReducer, document.body.clientWidth < theme.breakpoints.values.md ? false : true);

  return (
    <div className={classes.layoutRoot}>
      <DrawerOpenDispatch.Provider value={[drawerOpen, drawerOpenDispatch]}>
        <Masthead/>
        <Sidebar/>
      </DrawerOpenDispatch.Provider>
      <main className={classNames(classes.content, {
          [classes.contentShift]: drawerOpen
        })}>
        {children}
        <Switch>
          <Route path='/' exact component={HomePage}/>
          <Route path='/login' component={LoginPage}/>
          <Route path='/register' component={RegisterPage}/>
          <Route path='/browse' component={BrowsePage}/>
          <Route path='/upload' component={UploadPage}/>
          <Route path='/view/:id' component={ViewPage}/>
          <Route path='/playlist/:id' component={PlaylistPage}/>
          <Route path='/channel/:id' component={UserPage}/>
          <Route path='/options' component={OptionsPage}/>
          <Route component={Error404Page}/>
        </Switch>
      </main>
    </div>
  );
}

// Layout.whyDidYouRender = {
//   logOnDifferentValues: true
// };
