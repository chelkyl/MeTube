import React, { useState, useContext } from 'react';
import { makeStyles } from '@material-ui/styles';
import { useThemeMode } from '../theming';
import { DrawerOpenDispatch } from '../pages/layout';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  InputBase,
  Divider,
  Menu,
  MenuList,
  MenuItem,
  Switch
} from '@material-ui/core';
import { fade } from '@material-ui/core/styles/colorManipulator';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import AccountCircle from '@material-ui/icons/AccountCircle';
import PreviousConversations from './previousConversations';
import MoreVert from '@material-ui/icons/MoreVert';
import {
  Link,
  withRouter
} from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  root: {
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
  title: {
    display: 'block',
    width: '7em',
    textDecoration: 'none'
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25)
    },
    marginLeft: 0,
    marginRight: theme.spacing.unit * 2,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing.unit,
      width: 'auto',
    },
  },
  searchIcon: {
    width: theme.spacing.unit * 6,
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inputRoot: {
    color: 'inherit',
    width: '100%'
  },
  inputInput: {
    paddingTop: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddinBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit * 6,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 120,
      '&:focus': {
        width: 200,
      },
    }
  }
}));

function Masthead({isLoggedIn,...props}) {
  const classes = useStyles();
  const [themeMode, setThemeMode] = useThemeMode();
  const setDrawerState = useContext(DrawerOpenDispatch);

  const [menuAnchor, setMenuAnchor] = useState(null);

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
        closeMenu();
        break;
      case 'options':
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

  const miscMenuItems = (
    <MenuList>
      <MenuItem>Dark Mode
        <Switch checked={themeMode==='dark'} onChange={() => setThemeMode('toggle')} aria-label="Toggle dark mode"/>
      </MenuItem>
    </MenuList>
  );

  const profileMenuItems = (
    <MenuList>
      <MenuItem onClick={handleMenu('account')}>Account</MenuItem>
      <MenuItem onClick={handleMenu('options')}>Options</MenuItem>
    </MenuList>
  );

  const menu = (
    <Menu anchorEl={menuAnchor} open={isMenuOpen} onClose={closeMenu}>
      {
        isLoggedIn ? (
          <>
            {profileMenuItems}
            <Divider/>
          </>
        ) : null
      }
      {miscMenuItems}
    </Menu>
  );

  return (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static">
        <Toolbar>
          <IconButton className={classes.menuButton} color="inherit" aria-label="Menu" onClick={() => setDrawerState('toggle')}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component={Link} to="/" color="inherit" className={classes.title} noWrap>
            MeTube
          </Typography>
          <div className={classes.search}>
            <IconButton className={classes.searchIcon} color="inherit" aria-label="Search" onClick={submitSearch}>
              <SearchIcon />
            </IconButton>
            <InputBase placeholder="Search..." classes={{
                root: classes.inputRoot,
                input: classes.inputInput
              }}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={catchSearchEnter}/>
          </div>
          <div className={classes.grow} />
          <PreviousConversations/>
          <div>
            {
              isLoggedIn ? (
                <IconButton color="inherit" aria-haspopup="true" onClick={openMenu}>
                  <AccountCircle />
                </IconButton>
              ) : (
                <>
                  <IconButton color="inherit" aria-haspopup="true" onClick={openMenu}>
                    <MoreVert />
                  </IconButton>
                  <Button component={Link} to='/login' color="inherit">Login</Button>
                </>
              )
            }
          </div>
        </Toolbar>
      </AppBar>
      {menu}
    </div>
  );
}

export default withRouter(Masthead);

// export default withStyles(styles)(withRouter(Masthead));

/**
 * extending a pure component
 * componentDidMount
 *    setting the input value and state to the query string
 *
 * input handler
 *    update state with search query
 *
 * form handle
 *    submit search
 *    aka conditionally render redirect or this.history.push()
 */
