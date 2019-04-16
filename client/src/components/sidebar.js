import React, { useContext, useEffect } from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import { DrawerOpenDispatch } from '../pages/layout';
import {
  Drawer,
  Hidden,
  IconButton,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@material-ui/core';
import {
  unstable_useMediaQuery as useMediaQuery
} from '@material-ui/core/useMediaQuery';
import {
  Home,
  // History,
  PhotoLibrary,
  VideoLibrary,
  LibraryMusic,
  // LibraryBooks,
  // Subscriptions
} from '@material-ui/icons';
import MenuIcon from '@material-ui/icons/Menu';
import { Link } from 'react-router-dom';
import {useAuthCtx} from '../authentication';
// import {getAuthenticatedUserID} from '../authutils';

const useStyles = makeStyles(theme => ({
  drawerWrap: {
    [theme.breakpoints.up('md')]: {
      width: theme.drawerWidth,
      flexShrink: 0
    }
  },
  drawer: {
    overflowX: 'hidden'
  },
  list: {
    width: theme.drawerWidth
  },
  header: {
    display: 'flex',
    position: 'relative',
    alignItems: 'center',
    minHeight: 64,
    paddingLeft: 24,
    paddingRight: 24,
    color: theme.secondary
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 12
  },
  titleWrap: {
    width: '7em'
  },
  title: {
    textDecoration: 'none'
  }
}));

export default function Sidebar() {
  const classes = useStyles();
  const [isOpen, setDrawerState] = useContext(DrawerOpenDispatch);
  const [isLoggedIn] = useAuthCtx();
  const theme = useTheme();
  const isMobileWidth = useMediaQuery(theme.breakpoints.down('sm')) || document.body.clientWidth < theme.breakpoints.values.md;

  useEffect(() => {
    if(isMobileWidth) {
      setDrawerState(false);
    }
    else {
      setTimeout(() => {
        if(document.body.clientWidth >= theme.breakpoints.values.md) setDrawerState(true)
      }, 330);
    }
  }, [isMobileWidth]);

  let toggleDrawer = (open) => () => {
    setDrawerState(open);
  };

  const navList = (
    <div className={classes.list}>
      <div className={classes.header}>
        <IconButton className={classes.menuButton} color="inherit" aria-label="Menu" onClick={toggleDrawer(false)}>
          <MenuIcon />
        </IconButton>
        <div className={classes.titleWrap}>
          <Typography variant="h6" component={Link} to="/" color="inherit" className={classes.title} noWrap>
            MeTube
          </Typography>
        </div>
      </div>
      <List>
        <ListItem button component={Link} to='/' key='Home'>
          <ListItemIcon><Home/></ListItemIcon>
          <ListItemText primary='Home'/>
        </ListItem>
        {isLoggedIn ? (
          <>
            {/* <ListItem button component={Link} to='/history' key='History'>
              <ListItemIcon><History/></ListItemIcon>
              <ListItemText primary='History'/>
            </ListItem>
            <ListItem button component={Link} to={`/channel/${getAuthenticatedUserID()}/subscriptions`} key='Subscriptions'>
              <ListItemIcon><Subscriptions/></ListItemIcon>
              <ListItemText primary='Subscriptions'/>
            </ListItem> */}
          </>
          ) : null
        }
        <Divider/>
        <ListItem button component={Link} to={{pathname:'/browse',search:'?type=image'}} key='Images'>
          <ListItemIcon><PhotoLibrary/></ListItemIcon>
          <ListItemText primary='Images'/>
        </ListItem>
        <ListItem button component={Link} to={{pathname:'/browse',search:'?type=video'}} key='Videos'>
          <ListItemIcon><VideoLibrary/></ListItemIcon>
          <ListItemText primary='Videos'/>
        </ListItem>
        <ListItem button component={Link} to={{pathname:'/browse',search:'?type=audio'}} key='Music'>
          <ListItemIcon><LibraryMusic/></ListItemIcon>
          <ListItemText primary='Music'/>
        </ListItem>
      </List>
    </div>
  );

  return (
    <nav className={classes.drawerWrap}>
      <Hidden mdUp implementation="js">
        <Drawer variant="temporary" open={isOpen} onClose={toggleDrawer(false)}>
          <div tabIndex={0} role="button" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)} className={classes.drawer}>
            {navList}
          </div>
        </Drawer>
      </Hidden>
      <Hidden smDown implementation="js">
        <Drawer variant="persistent" open={isOpen} onClose={toggleDrawer(false)}>
          <div tabIndex={0} role="button" className={classes.drawer}>
            {navList}
          </div>
        </Drawer>
      </Hidden>
    </nav>
  );
};
