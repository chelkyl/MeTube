import React from 'react';
import PropTypes from 'prop-types';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  InputBase,
  Menu,
  MenuItem
} from '@material-ui/core';
import { fade } from '@material-ui/core/styles/colorManipulator';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import AccountCircle from '@material-ui/icons/AccountCircle';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';

const styles = theme => ({
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
});

class Masthead extends React.Component {
  constructor(props) {
    super(props);
    this.toggleDrawer = this.toggleDrawer.bind(this);
    this.state = {
      anchorEl: null
    };
  }

  toggleDrawer = (open) => () => {
    this.props.onToggleDrawer(open);
  };

  handleProfileMenuOpen = evt => {
    this.setState({anchorEl: evt.currentTarget});
  };
  handleProfileMenuClose = () => {
    this.setState({anchorEl: null});
  };

  handleNav = (selectedNav) => () => {
    this.handleProfileMenuClose();
  }

  shouldComponentUpdate(nextProps,nextState) {
    return this.props.isLoggedIn !== nextProps.isLoggedIn;
  }

  render() {
    const { anchorEl } = this.state;
    const { 
      classes,
      isLoggedIn
    } = this.props;

    const isProfileMenuOpen = Boolean(anchorEl);

    const renderProfileMenu = (
      <Menu anchorEl={anchorEl} open={isProfileMenuOpen} onClose={this.handleProfileMenuClose}>
        <MenuItem onClick={this.handleNav}>Account</MenuItem>
        <MenuItem onClick={this.handleNav}>Options</MenuItem>
      </Menu>
    );

    return (
      <div className={classes.root}>
        <AppBar className={classes.appBar} position="static">
          <Toolbar>
            <IconButton className={classes.menuButton} color="inherit" aria-label="Menu" onClick={this.props.onToggleDrawer}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component={Link} to="/" color="inherit" className={classes.title} noWrap>
              MeTube
            </Typography>
            <div className={classes.search}>
              <div className={classes.searchIcon}>
                <SearchIcon />
              </div>
              <InputBase placeholder="Search..." classes={{
                  root: classes.inputRoot,
                  input: classes.inputInput
                }}/>
            </div>
            <div className={classes.grow} />
            <div>
              {
                isLoggedIn ? (
                  <IconButton color="inherit" aria-haspopup="true" onClick={this.handleProfileMenuOpen}>
                    <AccountCircle />
                  </IconButton>
                ) : (
                  <>
                    <Button component={Link} to='/login' color="inherit">Login</Button>
                    <Button component={Link} to='/register' color="inherit">Register</Button>
                  </>
                )
              }
            </div>
          </Toolbar>
        </AppBar>
        {renderProfileMenu}
      </div>
    );
  }
}

Masthead.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Masthead);
