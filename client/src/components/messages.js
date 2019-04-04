import React, {useState, useEffect} from 'react';
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
import {useAuthCtx, getAuthenticatedUserID} from '../authentication';

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
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(0);
  const anchorEl = React.useRef(null);
  const [isLoggedIn] = useAuthCtx();
  let [previousConversations, setPreviousConversations] = useState([]);

  const [state, setState] = useState({
    bottom: false
  });

  const toggleChatBar = (side, open) => () => {
    setState({ ...state, [side]: open });
  };

  function getUserName(userId){
    Api.request('get',`/users/${userId}`)
      .then(res => {
        console.log('username: ',res.data.response.username);
      })
      .catch(err => {
        let msg = '';
        // got response from server
        if(err.response) {
          console.log(err.response);
          const { status } = err.response;
          if (status >= 500 && status < 600) {
            msg = `Server error ${status}, please contact the admins`;
          }
          else if (status === 404) {
            msg = "User not found";
          }
          else if (status === 403) {
            msg = "User permission blocked";
          }
          else {
            msg = `Sorry, unknown error ${status}`;
          }
        }
        // request sent but no response
        else if(err.request) {
          console.log(err.request);
          msg = 'Could not connect to the server';
        }
        // catch all
        else {
          console.log(err);
          msg = 'Sorry, unknown error';
        }
        console.log(msg, err);
      });
  }

  function getNewPreviousConversations(messageInfo){
    let newPreviousConversations = [];
    var newestMessagesMap = new Map();
    for(let i = 0; i < messageInfo.length; i++){
      if(messageInfo[i].contacting_id !== parseInt(getAuthenticatedUserID())) {
        newestMessagesMap.set(messageInfo[i].contacting_id, messageInfo[i].message);
      }
      if(messageInfo[i].contacted_id !== parseInt(getAuthenticatedUserID())) {
        newestMessagesMap.set(messageInfo[i].contacted_id, messageInfo[i].message);
      }
    }
    for (var [key, value] of newestMessagesMap) {
      getUserName(key)
      newPreviousConversations.push(key + ": " + value);
    }
    return newPreviousConversations;
  }

  let cancel = false;

  useEffect(() => {
    Api.request('get',`/messages/${getAuthenticatedUserID()}`)
      .then(res => {
        console.log('messages: ',res.data.response);
        if(!cancel) setPreviousConversations(getNewPreviousConversations(res.data.response));
      })
      .catch(err => {
        let msg = '';
        // got response from server
        if(err.response) {
          console.log(err.response);
          const { status } = err.response;
          if (status >= 500 && status < 600) {
            msg = `Server error ${status}, please contact the admins`;
          }
          else if (status === 404) {
            msg = "Messages not found";
          }
          else if (status === 403) {
            msg = "Messages permission blocked";
          }
          else {
            msg = `Sorry, unknown error ${status}`;
          }
        }
        // request sent but no response
        else if(err.request) {
          console.log(err.request);
          msg = 'Could not connect to the server';
        }
        // catch all
        else {
          console.log(err);
          msg = 'Sorry, unknown error';
        }
        console.log(msg, err);
        if(cancel) return;
      });

      return () => {
        cancel = true;
      }
  }, [props]);

  function messageChange(event, newValue) {
    setValue(newValue);
  }

  function toggleMessages() {
    setOpen(!open);
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
                      {previousConversations.map(previousConversation => (
                        <MenuItem key={previousConversation} onClick={toggleChatBar('bottom', true)} >
                          {previousConversation}
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
