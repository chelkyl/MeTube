import React, {useState, useEffect} from 'react';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import Reply from '@material-ui/icons/Reply';
import ForumOutlined from '@material-ui/icons/ForumOutlined';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import AccountCircle from '@material-ui/icons/AccountCircle';
import Api from '../apiclient';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Divider from '@material-ui/core/Divider';
import Send from '@material-ui/icons/Send';
import {
  Link
} from 'react-router-dom';
import { makeStyles } from '@material-ui/styles';
import {useAuthCtx, getAuthenticatedUserID} from '../authentication';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex'
  },
  paper: {
    marginRight: theme.spacing.unit * 2,
  },
  rightIcon: {
    marginLeft: theme.spacing.unit,
  },
  button: {
    margin: theme.spacing.unit,
  }
}));

function Messages(props) {
  const classes = useStyles();
  const [openMessagesMenu, setOpenMessagesMenu] = useState(false);
  const [openMessageDialog, setOpenMessageDialog] = React.useState(false);
  const anchorEl = React.useRef(null);
  const [isLoggedIn] = useAuthCtx();
  let [menuConversations, setMenuConversations] = useState([]);
  let [dialogConversations, setDialogConversations] = useState(new Map());
  let [currentDialog, setCurrentDialog] = React.useState([]);
  let [dialogContactUsername, setDialogContactUserName] = React.useState("");
  let [dialogContactUserId, setDialogContactUserId] = React.useState();

  const [newMessage, setNewMessage] = React.useState({
    message: '',
  })

  const handleChange = prop => event => {
    setNewMessage({ ...newMessage, [prop]: event.target.value });
  };

  function getConversations(messageInfo){
    let newMenuConversations = [];
    var newMenuConversationsMap = new Map();
    var newDialogConversationsMap = new Map();
    for(let i = messageInfo.length-1; i >= 1; i-=2){
      if(messageInfo[i].contacted_id === parseInt(getAuthenticatedUserID())){
        newMenuConversationsMap.set(messageInfo[i].contact_username, [messageInfo[i].message, messageInfo[i].contacting_id.toString()]);
      }
      else {
        newMenuConversationsMap.set(messageInfo[i].contact_username, [messageInfo[i].message, messageInfo[i].contacted_id.toString()]);
      }
      if(newDialogConversationsMap.has(messageInfo[i].contact_username)){
        newDialogConversationsMap.set(messageInfo[i].contact_username, newDialogConversationsMap.get(messageInfo[i].contact_username).concat([messageInfo[i]]));
      }
      else {
        newDialogConversationsMap.set(messageInfo[i].contact_username, [messageInfo[i]]);
      }
    }
    setDialogConversations(newDialogConversationsMap);
    for (var [key, value] of newMenuConversationsMap) {
      newMenuConversations.push([key, value]);
    }
    return newMenuConversations;
  }

  let cancel = false;

  useEffect(() => {
    if(! isLoggedIn){
      return () => {
        cancel = true;
      }
    }
    Api.request('get',`/messages/${getAuthenticatedUserID()}`)
      .then(res => {
        console.log('messages: ',res.data.response);
        if(!cancel) setMenuConversations(getConversations(res.data.response));
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
  }, [openMessagesMenu]);

  function toggleMessagesMenu() {
    setOpenMessagesMenu(!openMessagesMenu);
  }

  async function sendMessage() {
    newMessage.contacting_id = parseInt(getAuthenticatedUserID());
    newMessage.contacted_id = dialogContactUserId;
    try {
      const response = await Api.request('post','/messages/upload',newMessage);
      const res = response.data;
      return res;
    }
    catch(err) {
      throw err;
    }
  }

  function handleMessagesMenuClose(event) {
    if (anchorEl.current.contains(event.target)) {
      return;
    }
    setOpenMessagesMenu(false);
  }

  function handleMessageDialogOpen(menuConversation) {
    setOpenMessageDialog(true);
    setCurrentDialog(dialogConversations.get(menuConversation[0]).reverse());
    setDialogContactUserId(menuConversation[1][1]);
    setDialogContactUserName(menuConversation[0]);
  }

  function handleCloseMessageDialog() {
    setOpenMessageDialog(false);
  }

  return (
    <div className={classes.root}>
      <div>
        <IconButton
          buttonRef={anchorEl}
          aria-owns={openMessagesMenu ? 'menu-list-grow' : undefined}
          aria-haspopup="true"
          onClick={toggleMessagesMenu}
        >
          <ForumOutlined/>
        </IconButton>
        <Popper open={openMessagesMenu} anchorEl={anchorEl.current} transition disablePortal>
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              id="menu-list-grow"
              style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleMessagesMenuClose}>
                {
                  isLoggedIn ? (
                    <div className={classes.root}>
                      <List subheader={<ListSubheader component="div">Messages</ListSubheader>}>
                        <Divider />
                        {menuConversations.map(menuConversation => (
                          <ListItem key={menuConversation}>
                            <ListItemText
                              primary={menuConversation[0]}
                              secondary={
                                <React.Fragment>
                                  {menuConversation[1][0]}
                                </React.Fragment>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton onClick={() => handleMessageDialogOpen(menuConversation)}>
                                <Reply/>
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </div>
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
      <Dialog open={openMessageDialog} onClose={handleCloseMessageDialog} aria-labelledby="form-dialog-title" >
        <DialogContent>
          <IconButton className={classes.button} aria-label="Contact">
            <AccountCircle />
            {dialogContactUsername}
          </IconButton>
          <Divider />
          <List>
            {currentDialog.map((dialogConversation) => (
              <ListItem key={dialogConversation.message_id}>
                <ListItemText
                  style={dialogConversation.contacting_id === parseInt(getAuthenticatedUserID()) ? {textAlign: "right"} : {textAlign: "left"}}
                  primary={dialogConversation.contacting_id === parseInt(getAuthenticatedUserID()) ? dialogConversation.message + " -"  :  "- " + dialogConversation.message}
                />
              </ListItem>
            ))}
          </List>
          <TextField
            id="standard-multiline-flexible"
            label="Your message. . ."
            value={newMessage.message}
            onChange={handleChange('message')}
            multiline
            rowsMax="4"
            className={classes.textField}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMessageDialog} color="primary">
            Cancel
          </Button>
          <Button variant="contained" color="primary" className={classes.button} onClick={sendMessage}>
            Send
            <Send className={classes.rightIcon}>send</Send>
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Messages;
