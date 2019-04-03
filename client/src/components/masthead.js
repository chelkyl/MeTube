import React, { useState, useContext } from 'react';
import { makeStyles } from '@material-ui/styles';
import { useThemeMode } from '../theming';
import { DrawerOpenDispatch } from '../pages/layout';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  InputBase,
  Divider,
  Menu,
  MenuItem,
  Switch
} from '@material-ui/core';
import { fade } from '@material-ui/core/styles/colorManipulator';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import AccountCircle from '@material-ui/icons/AccountCircle';
import Messages from './messages';
import {
  Link,
  withRouter
} from 'react-router-dom';
import {useAuthCtx, getAuthenticatedUserID} from '../authentication';

const useStyles = makeStyles(theme => ({
  masthead: {
    display: 'flex'
  },
  appBar: {
    [theme.breakpoints.up('sm')]: {
      zIndex: theme.zIndex.drawer + 1
    }
  },
  grow: {
    flexGrow: 1
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 12
  },
  titleWrap: {
    width: '7em',
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  title: {
    textDecoration: 'none'
  },
  search: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25)
    },
    marginRight: theme.spacing.unit,
    maxWidth: '50%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing.unit,
      width: 'auto',
    },
  },
  searchIconWrap: {
    width: theme.spacing.unit * 5,
    height: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  searchIcon: {
    width: theme.spacing.unit * 4,
    height: theme.spacing.unit * 4
  },
  inputRoot: {
    color: 'inherit',
    width: '100%'
  },
  inputInput: {
    padding: theme.spacing.unit,
    paddingRight: 0,
    transition: theme.transitions.create('width'),
    maxWidth: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 160,
      '&:focus': {
        width: 260,
      },
    }
  }
}));

function Masthead(props) {
  const classes = useStyles();
  const [themeMode, setThemeMode] = useThemeMode();
  const [,setDrawerState] = useContext(DrawerOpenDispatch);

  const [menuAnchor, setMenuAnchor] = useState(null);

  const [isLoggedIn, authActionDispatch] = useAuthCtx();

  const params = new URLSearchParams(props.location.search);
  const [searchQuery, setSearchQuery] = useState(params.get('q') || '');

  let openMenu = (e) => {
    setMenuAnchor(e.currentTarget);
  };

  let closeMenu = () => {
    setMenuAnchor(null);
  };
  let handleMenu = label => (e) => {
    switch(label) {
      case 'account':
      props.history.push(`/channel/${getAuthenticatedUserID()}`)
        closeMenu();
        break;
      case 'options':
        closeMenu();
        break;
      case 'login':
        props.history.push('/login');
        closeMenu();
        break;
      case 'logout':
        authActionDispatch({type:'logout'});
        closeMenu();
        break;
      case 'toggle theme':
        setThemeMode('toggle');
        break;
      default:
        break;
    }
  }

  let handleSearchChange = (e) => {
    setSearchQuery(e.currentTarget.value);
  }
  let submitSearch = () => {
    props.history.push(`/browse?q=${searchQuery}`)
  }
  let catchSearchEnter = (e) => {
    if(e.key === 'Enter') {
      e.preventDefault();
      submitSearch();
    }
  }

  const isMenuOpen = Boolean(menuAnchor);

  const miscMenuItems = [
    <MenuItem key='toggledarkmode'>Dark Mode
      <Switch checked={themeMode==='dark'} onChange={() => setThemeMode('toggle')} aria-label="Toggle dark mode"/>
    </MenuItem>
  ];

  const profileMenuItems = [
    <MenuItem key='account' onClick={handleMenu('account')}>Account</MenuItem>,
    <MenuItem key='options' onClick={handleMenu('options')}>Options</MenuItem>,
    <MenuItem key='logout' onClick={handleMenu('logout')}>Log Out</MenuItem>
  ];

  const menu = (
    <Menu anchorEl={menuAnchor} open={isMenuOpen} onClose={closeMenu}>
      {
        isLoggedIn ? [
          ...profileMenuItems,
        ] : (
          <MenuItem key='login' onClick={handleMenu('login')}>Login</MenuItem>
        )
      }
      <Divider key='divider'/>
      {miscMenuItems}
    </Menu>
  );

  return (
    <div className={classes.masthead}>
      <AppBar className={classes.appBar} position="fixed">
        <Toolbar>
          <IconButton className={classes.menuButton} color="inherit" aria-label="Menu" onClick={() => setDrawerState('toggle')}>
            <MenuIcon />
          </IconButton>
          <div className={classes.titleWrap}>
            <Typography variant="h6" component={Link} to="/" color="inherit" className={classes.title} noWrap>
              MeTube
            </Typography>
          </div>
          <div className={classes.search}>
            <div className={classes.searchIconWrap}>
              <IconButton className={classes.searchIcon} color="inherit" aria-label="Search" onClick={submitSearch}>
                <SearchIcon />
              </IconButton>
            </div>
            <InputBase placeholder="Search..." classes={{
                root: classes.inputRoot,
                input: classes.inputInput
              }}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={catchSearchEnter}/>
          </div>
          <div className={classes.grow} />
          <Messages isLoggedIn={isLoggedIn}/>
          <div>
            <IconButton color="inherit" aria-haspopup="true" onClick={openMenu}>
              <AccountCircle />
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>
      {menu}
    </div>
  );
}

export default withRouter(Masthead);
