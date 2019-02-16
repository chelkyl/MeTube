import React from 'react';
import PropTypes from 'prop-types';
import {
  Drawer,
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

const styles = {
  list: {
    width: 250
  },
  header: {
    display: 'flex',
    position: 'relative',
    alignItems: 'center',
    minHeight: 64,
    paddingLeft: 24,
    paddingRight: 24,
    textAlign: 'center'
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 12
  },
  title: {
    display: 'block',
    width: '7em'
  }
};

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.toggleDrawer = this.toggleDrawer.bind(this);
  }

  toggleDrawer = (open) => () => {
    this.props.onToggleDrawer(open);
  };

  render() {
    const {open, loggedIn} = this.props;
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
          <ListItem button key='Home'>
            <ListItemIcon><Home/></ListItemIcon>
            <ListItemText primary='Home'/>
          </ListItem>
          {loggedIn ? (
            <>
              <ListItem button key='History'>
                <ListItemIcon><History/></ListItemIcon>
                <ListItemText primary='History'/>
              </ListItem>
              <ListItem button key='Subscriptions'>
                <ListItemIcon><Subscriptions/></ListItemIcon>
                <ListItemText primary='Subscriptions'/>
              </ListItem>
            </>
            ) : null
          }
          <Divider/>
          <ListItem button key='Images'>
            <ListItemIcon><PhotoLibrary/></ListItemIcon>
            <ListItemText primary='Images'/>
          </ListItem>
          <ListItem button key='Videos'>
            <ListItemIcon><VideoLibrary/></ListItemIcon>
            <ListItemText primary='Videos'/>
          </ListItem>
          <ListItem button key='Music'>
            <ListItemIcon><LibraryMusic/></ListItemIcon>
            <ListItemText primary='Music'/>
          </ListItem>
        </List>
      </div>
    )

    return (
      <div>
        <Drawer open={open} onClose={this.toggleDrawer(false)}>
          <div tabIndex={0} role="button" onClick={this.toggleDrawer(false)} onKeyDown={this.toggleDrawer(false)}>
            {navList}
          </div>
        </Drawer>
      </div>
    );
  }
};

Sidebar.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Sidebar);