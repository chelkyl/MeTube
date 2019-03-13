import React from 'react';
import PropTypes from 'prop-types';
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
  Home,
  History,
  PhotoLibrary,
  VideoLibrary,
  LibraryMusic,
  // LibraryBooks,
  Subscriptions
} from '@material-ui/icons';
import MenuIcon from '@material-ui/icons/Menu';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';

const drawerWidth = 240;

const styles = theme => ({
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0
    }
  },
  list: {
    width: drawerWidth
  },
  header: {
    display: 'flex',
    position: 'relative',
    alignItems: 'center',
    minHeight: 64,
    paddingLeft: 24,
    paddingRight: 24,
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 12
  },
  title: {
    display: 'block',
  }
});

class Sidebar extends React.Component {
  toggleDrawer = (open) => () => {
    this.props.onToggleDrawer(open);
  };

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.isOpen !== nextProps.isOpen || this.props.isLoggedIn !== nextProps.isLoggedIn;
  }

  render() {
    const {isOpen, isLoggedIn} = this.props;
    const { classes } = this.props;

    const navList = (
      <div className={classes.list}>
        <div className={classes.header}>
          <IconButton className={classes.menuButton} color="inherit" aria-label="Menu" onClick={this.toggleDrawer(false)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" color="inherit" className={classes.title} noWrap>
            MeTube
          </Typography>
        </div>
        <List>
          <ListItem button component={Link} to='/' key='Home'>
            <ListItemIcon><Home/></ListItemIcon>
            <ListItemText primary='Home'/>
          </ListItem>
          {isLoggedIn ? (
            <>
              <ListItem button component={Link} to='/history' key='History'>
                <ListItemIcon><History/></ListItemIcon>
                <ListItemText primary='History'/>
              </ListItem>
              <ListItem button component={Link} to='/subscriptions' key='Subscriptions'>
                <ListItemIcon><Subscriptions/></ListItemIcon>
                <ListItemText primary='Subscriptions'/>
              </ListItem>
            </>
            ) : null
          }
          <Divider/>
          <ListItem button component={Link} to={{pathname:'/browse',search:'?type=images'}} key='Images'>
            <ListItemIcon><PhotoLibrary/></ListItemIcon>
            <ListItemText primary='Images'/>
          </ListItem>
          <ListItem button component={Link} to={{pathname:'/browse',search:'?type=videos'}} key='Videos'>
            <ListItemIcon><VideoLibrary/></ListItemIcon>
            <ListItemText primary='Videos'/>
          </ListItem>
          <ListItem button component={Link} to={{pathname:'/browse',search:'?type=music'}} key='Music'>
            <ListItemIcon><LibraryMusic/></ListItemIcon>
            <ListItemText primary='Music'/>
          </ListItem>
        </List>
      </div>
    )

    return (
      <nav className={classes.drawer}>
        <Hidden smUp implementation="js">
          <Drawer variant="temporary" open={isOpen} onClose={this.toggleDrawer(false)}>
            <div tabIndex={0} role="button" onClick={this.toggleDrawer(false)} onKeyDown={this.toggleDrawer(false)}>
              {navList}
            </div>
          </Drawer>
        </Hidden>
        <Hidden xsDown implementation="js">
          <Drawer variant="persistent" open={isOpen} onClose={this.toggleDrawer(false)}>
            <div tabIndex={0} role="button">
              {navList}
            </div>
          </Drawer>
        </Hidden>
      {/* <Drawer open={open} onClose={this.toggleDrawer(false)}>
        <div tabIndex={0} role="button" onClick={this.toggleDrawer(false)} onKeyDown={this.toggleDrawer(false)}>
          {navList}
        </div>
      </Drawer> */}
      </nav>
    );
  }
};

Sidebar.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired
};

export default withStyles(styles,{withTheme: true})(Sidebar);
