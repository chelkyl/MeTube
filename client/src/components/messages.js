import React, {useState, useEffect, useRef} from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  ClickAwayListener,
  Grow,
  Paper,
  Popper,
  MenuItem,
  MenuList,
  List,
  ListItem,
  FormControl,
  ListItemSecondaryAction,
  IconButton,
  ListSubheader,
  ListItemText,
  ListItemIcon,
  Button,
  TextField,
  Dialog,
  DialogActions,
  InputLabel,
  DialogContent,
  Divider,
  Select
} from '@material-ui/core';
import {
  Reply,
  Forum,
  AccountCircle,
  Send,
  Message
} from '@material-ui/icons';
import {
  Link
} from 'react-router-dom';
import axios from 'axios';
import Api from '../apiclient';
import {useAuthCtx} from '../authentication';
import {getAuthenticatedUsername, getAuthenticatedUserID, getAccessToken} from '../authutils';

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
  },
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 160,
  }
}));

export default function Messages(props) {
  const classes = useStyles();
  const [openMessagesMenu, setOpenMessagesMenu] = useState(false);
  const [openMessageDialog, setOpenMessageDialog] = useState(false);
  const anchorEl = useRef(null);
  const [isLoggedIn] = useAuthCtx();
  let [contacts, setContacts] = useState([]);
  let [contactNameIDs, setContactNameIDs] = useState(new Map());
  let [menuConversations, setMenuConversations] = useState([]);
  let [dialogConversations, setDialogConversations] = useState(new Map());
  let [currentDialog, setCurrentDialog] = useState([]);
  const [newMessage, setNewMessage] = useState({
    message: '',
  })
  const [dialogContactInfo, setDialogContactInfo] = useState({
    id: '',
    name: '',
    labelWidth: 0,
  });

  const handleChange = prop => event => {
    setNewMessage({ ...newMessage, [prop]: event.target.value });
  };

  function getConversations(messageInfo){
    let newMenuConversations = [];
    var newMenuConversationsMap = new Map();
    var newDialogConversationsMap = new Map();
    let newestMessageIndex = messageInfo.length - 1;
    let latestMessageIndex = 1;
    if(messageInfo.length===0){
      setDialogConversations(new Map());
      return [];
    }
    if(messageInfo[0].contact_username !== getAuthenticatedUsername()){
      newestMessageIndex--;
      latestMessageIndex--;
    }
    for(let j = latestMessageIndex; j <= newestMessageIndex; j+=2){
      //if(contactNameIDs.get(messageInfo[j].contact_username) !== undefined) {
        if(messageInfo[j].contacted_id === parseInt(getAuthenticatedUserID())){
          newMenuConversationsMap.delete(messageInfo[j].contact_username);
          if(messageInfo[j].contact_username !== getAuthenticatedUsername()){
            newMenuConversationsMap.set(messageInfo[j].contact_username, [messageInfo[j].message, messageInfo[j].contacting_id.toString()]);
          }
          else if(messageInfo[j].contact_username === getAuthenticatedUsername() && j%2===0){
            newMenuConversationsMap.set(messageInfo[j+1].contact_username, [messageInfo[j].message, messageInfo[j].contacting_id.toString()]);
          }
          else {
            newMenuConversationsMap.set(messageInfo[j-1].contact_username, [messageInfo[j].message, messageInfo[j].contacting_id.toString()]);
          }
        }
        else {
          newMenuConversationsMap.delete(messageInfo[j].contact_username);
          if(messageInfo[j].contact_username !== getAuthenticatedUsername()){
            newMenuConversationsMap.set(messageInfo[j].contact_username, [messageInfo[j].message, messageInfo[j].contacted_id.toString()]);
          }
          else if(messageInfo[j].contact_username === getAuthenticatedUsername() && j%2===0){
            newMenuConversationsMap.set(messageInfo[j+1].contact_username, [messageInfo[j].message, messageInfo[j].contacted_id.toString()]);
          }
          else {
            newMenuConversationsMap.set(messageInfo[j-1].contact_username, [messageInfo[j].message, messageInfo[j].contacted_id.toString()]);
          }
        }
      //}
    }
    for(let i = newestMessageIndex; i >= latestMessageIndex; i-=2){
      //if(contactNameIDs.get(messageInfo[i].contact_username) !== undefined) {
        if(newDialogConversationsMap.has(messageInfo[i].contact_username)){
          newDialogConversationsMap.set(messageInfo[i].contact_username, newDialogConversationsMap.get(messageInfo[i].contact_username).concat([messageInfo[i]]));
        }
        else {
          newDialogConversationsMap.set(messageInfo[i].contact_username, [messageInfo[i]]);
        }
      //}
    }
    setDialogConversations(newDialogConversationsMap);
    for (var [key, value] of newMenuConversationsMap) {
      newMenuConversations.push([key, value]);
    }
    return newMenuConversations.reverse();
  }

  function getContacts(contactsInfo){
    let newContacts = [];
    let newContactNameIDs = new Map();
    for(let i=0; i<contactsInfo.length; i++){
      if(contactsInfo[i].contacting_id === parseInt(getAuthenticatedUserID())){
        newContactNameIDs.set(contactsInfo[i].username, contactsInfo[i].contacted_id)
      }
      else {
        newContactNameIDs.set(contactsInfo[i].username, contactsInfo[i].contacting_id)
      }
      newContacts.push(contactsInfo[i].username);
    }
    setContactNameIDs(newContactNameIDs);
    return newContacts;
  }

  let cancel = false;


  useEffect(() => {
    if(openMessagesMenu && isLoggedIn){
      let requests = [];
      let reqRoute = [];
      requests.push(Api.request('get',`/users/${getAuthenticatedUserID()}/contacts`));
      reqRoute.push('contacts');
      requests.push(Api.request('get',`/messages/${getAuthenticatedUserID()}`));
      reqRoute.push('messages');
      axios.all(requests)
        .then(responses => {
          if(cancel) return;
          responses.forEach((res,i) => {
            let route = reqRoute[i];
            if(route === 'contacts') {
              console.log('contacts: ',res.data.response);
              setContacts(getContacts(res.data.response));
            }
            else if(route === 'messages') {
              console.log('messages: ',res.data.response);
              setMenuConversations(getConversations(res.data.response));
            }
          })
        })
        .catch(err => {
          console.log(err);
          if(cancel) return;
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
          //TODO: set error status message in global app status or in the messages panel
        });

      }

      return () => {
        cancel = true;
      }
  }, [openMessagesMenu]);

  function toggleMessagesMenu() {
    setOpenMessagesMenu(!openMessagesMenu);
  }

  async function sendMessage() {
    newMessage.contacting_id = parseInt(getAuthenticatedUserID());
    newMessage.contacted_id = contactNameIDs.get(dialogContactInfo.name);
    console.log('messages sending',newMessage,getAccessToken());
    try {
      const response = await Api.request('post','/messages/upload',newMessage,{},true);
      console.log('messages send',response);
      const res = response.data;
      handleCloseMessageDialog();
      return res;
    }
    catch(err) {
      console.log('messages send',err);
      throw err;
    }
  }

  function handleMessagesMenuClose(event) {
    if (anchorEl.current.contains(event.target)) {
      return;
    }
    setOpenMessagesMenu(false);
  }

  function handleMessageDialogOpenOld(menuConversation) {
    setOpenMessageDialog(true);
    setCurrentDialog(dialogConversations.get(menuConversation[0]).reverse());
    setDialogContactInfo({
      id: menuConversation[1][1],
      name: menuConversation[0],
      labelWidth: 0,
    })
  }

  function handleMessageDialogOpenNew() {
    setDialogContactInfo({
      id: '',
      name: '',
      labelWidth: 0,
    });
    setCurrentDialog([]);
    setOpenMessageDialog(true);
  }

  function handleCloseMessageDialog() {
    setOpenMessageDialog(false);
    setNewMessage("");
  }

  function handleDialogContactChange(event) {
    setDialogContactInfo({
      ...dialogContactInfo,
      [event.target.name]: event.target.value,
    });
    if(dialogConversations.get(event.target.value) === undefined){
      setCurrentDialog([]);
    }
    else {
      setCurrentDialog(dialogConversations.get(event.target.value).reverse());
    }
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
          <Forum/>
        </IconButton>
        <Popper open={openMessagesMenu} anchorEl={anchorEl.current} placement='bottom-end' transition disablePortal>
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
                        <ListItem>
                          <ListItemText
                            primary={'New message. . .'}
                          />
                          <ListItemSecondaryAction>
                            <IconButton onClick={() => handleMessageDialogOpenNew()}>
                              <Message/>
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {menuConversations.map(menuConversation => (
                          <ListItem key={menuConversation}>
                            <ListItemText
                              primary={menuConversation[0]}
                              secondary={
                                <>
                                  {menuConversation[1][0]}
                                </>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton onClick={() => handleMessageDialogOpenOld(menuConversation)}>
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
          <FormControl className={classes.formControl}>
            <InputLabel>Choose contact. . .</InputLabel>
            <Select
              value={dialogContactInfo.name}
              onChange={handleDialogContactChange}
              name = "name"
              renderValue={value => `${value}`}
            >
              {contacts.map(contact => (
                <MenuItem key={contact} value={contact}>
                  {contact}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
