import React from 'react';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import IconButton from '@material-ui/core/IconButton';
import Message from '@material-ui/icons/Message';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import AccountCircle from '@material-ui/icons/AccountCircle';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Api from '../apiclient';
import Typography from '@material-ui/core/Typography';
import {
  Link
} from 'react-router-dom';
import { makeStyles } from '@material-ui/styles';
import {useAuthCtx} from '../authentication';

function TabContainer(props) {
  return (
    <Typography component="div" style={{ padding: 8 * 3 }}>
      {props.children}
    </Typography>
  );
}

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex'
  },
  paper: {
    marginRight: theme.spacing.unit * 2,
  },
  chatBar: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  }
}));

function Messages(props) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(0);
  const anchorEl = React.useRef(null);
  const [isLoggedIn] = useAuthCtx();

  const options = [
    'Example Message',
    'Another Example Message',
    'Last Example Message'
  ];

  const [state, setState] = React.useState({
    bottom: false
  });

  const toggleChatBar = (side, open) => () => {
    setState({ ...state, [side]: open });
  };

  function messageChange(event, newValue) {
    setValue(newValue);
  }

  function toggleMessages() {
    setOpen(!open);
    if(!open) {
      Api.request('get',`/messages/${2}/g`,{},{responseType: 'blob'})
    }
  }

  function handleMessagesClose(event) {
    if (anchorEl.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  }

  return (
    <div className={classes.root}>
      <div>
        <IconButton
          buttonRef={anchorEl}
          aria-owns={open ? 'menu-list-grow' : undefined}
          aria-haspopup="true"
          onClick={toggleMessages}
        >
          <Message/>
        </IconButton>
        <Popper open={open} anchorEl={anchorEl.current} transition disablePortal>
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              id="menu-list-grow"
              style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleMessagesClose}>
                {
                  isLoggedIn ? (
                    <MenuList subheader={<ListSubheader component="li">Messages</ListSubheader>}>
                      {options.map(option => (
                        <MenuItem key={option} onClick={toggleChatBar('bottom', true)} >
                          {option}
                          </MenuItem>
                        ))}
                    </MenuList>
                  ) :
                  <MenuList subheader={<ListSubheader component="li">Messages</ListSubheader>}>
                    <MenuItem component={Link} to='/login'>
                      <ListItemText inset primary="Please login to chat." />
                      <ListItemIcon>
                        <AccountCircle/>
                      </ListItemIcon>
                    </MenuItem>
                  </MenuList>
                }
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
      <SwipeableDrawer
        anchor="bottom"
        open={state.bottom}
        onClose={toggleChatBar('bottom', false)}
        onOpen={toggleChatBar('bottom', true)}
      >
        <div className={classes.chatBar}>
          <AppBar position="static">
            <Tabs value={value} onChange={messageChange}>
              <Tab label="Message One" />
              <Tab label="Message Two" />
              <Tab label="Message Three" />
            </Tabs>
          </AppBar>
          {value === 0 && <TabContainer>Message One</TabContainer>}
          {value === 1 && <TabContainer>Message Two</TabContainer>}
          {value === 2 && <TabContainer>Message Three</TabContainer>}
        </div>
      </SwipeableDrawer>
    </div>
  );
}

export default Messages;
