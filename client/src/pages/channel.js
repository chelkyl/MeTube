import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  AppBar,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Toolbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@material-ui/core';
import {
  AccountBox,
  AccountCircle
} from '@material-ui/icons';
import AboutPage from './about';
import ChannelPlaylistsPage from './channelplaylists';
import ChannelFavoritesPage from './channelfavorites';
import ChannelFilesPage from './channelfiles';
import ChannelContactsPage from './channelcontacts';
import Error404Page from './pageNotFound';
import {
  Route,
  Switch,
  Link
} from 'react-router-dom';
import axios from 'axios';
import Api from '../apiclient';
import {useAuthCtx} from '../authentication';
import {getAuthenticatedUserID, getAccessToken} from '../authutils';

const useStyles = makeStyles(theme => ({
  tabbedpage: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
  grow: {
    flexGrow: 1
  }
}));

function TabContainer(props) {
  return (
    <Typography component="div" style={{ padding: 8 * 3 }}>
      {props.children}
    </Typography>
  );
}

let getTabFromPath = (path) => {
  let pieces = path.split('/');
  if(pieces.length === 3) return 'about';
  return pieces[3];
};

export default function UserPage(props) {
  const classes = useStyles();
  const [tabIndex, setTabIndex] = useState(getTabFromPath(props.location.pathname));
  const [userID, setUserID] = useState(props.match.params.id);
  const [userInfo, setUserInfo] = useState({});
  const [contactMenuAnchor, setContactMenuAnchor] = useState(null);
  const [isLoggedIn] = useAuthCtx();
  const [contactPrompt, setContactPrompt] = useState('');
  const [subscribePrompt, setSubscriberPrompt] = useState('');
  const [isContact, setIsContact] = useState();
  const [isSubscriber, setIsSubscriber] = useState();
  const isContactMenuOpen = Boolean(contactMenuAnchor);
  let cancel = false;
  let curPath = props.match.url;

  useEffect(() => {
    //TODO: test is this is actually needed, maybe click on someone's channel?
    let id = props.match.params.id;
    setUserID(id);
  }, [props]);

  let addRequest = (reqMap, label, request) => {
    reqMap[label] = request;
    reqMap['labels'].push(label);
    reqMap['list'].push(request);
  };

  useEffect(() => {
    let requests = {list: [], labels: []};
    addRequest(requests, 'userInfo', Api.getData(`users/${userID}`));
    addRequest(requests, 'subscribers', Api.getData(`users/${userID}/subscribers`));

    axios.all(requests.list)
      .then(responses => {
        if(cancel) return;
        console.log('channel get',responses);
        let data = {};
        for(let i=0;i<responses.length;++i) {
          let res = responses[i];
          let label = requests.labels[i];
          if (label === 'userInfo') data = {...data, ...res.data.response};
          else if(label === 'subscribers') data = {...data, subscribers: res.data.response.subscribers};
        };
        setUserInfo(data);
      })
      .catch(err => {
        if(cancel) return;
        let msg = '';
        // got response from server
        if(err.response) {
          const { status } = err.response;
          if(status === 404) {
            props.history.push('/userNotFound');
          }
          else if (status >= 500 && status < 600) {
            msg = `Server error ${status}, please contact the admins`;
          }
          else {
            msg = `Sorry, unknown error ${status}`;
          }
        }
        // request sent but no response
        else if(err.request) {
          msg = err.message;
        }
        // catch all
        else {
          msg = 'Sorry, unknown error';
        }
        console.log('channel',msg);
      });

    return () => {
      cancel = true;
    }
  }, [userID, isSubscriber]);

  useEffect(() => {
    if(isLoggedIn){
      Api.request('get',`/users/${getAuthenticatedUserID()}/contacts`)
        .then(res => {
          if(!cancel) {
            if(getContacts(res.data.response).indexOf(username)===-1){
              setIsContact(false);
              setContactPrompt("Add contact.")
            }
            else {
              setIsContact(true);
              setContactPrompt("Remove contact.")
            }
          }
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
              msg = "Contacts not found";
            }
            else if (status === 403) {
              msg = "Contacts permission blocked";
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
          if(cancel) return; //TODO: set error status message in global app status or in the messages panel
        });
      }

      return () => {
        cancel = true;
      }
  }, [isContactMenuOpen]);

  useEffect(() => {
    if(isLoggedIn){
      Api.request('get',`/users/${getAuthenticatedUserID()}/subscribers_info`)
        .then(res => {
          if(!cancel) {
            if(getSubscribers(res.data.response).indexOf(username)===-1){
              setIsSubscriber(false);
              setSubscriberPrompt("Subscribe.")
            }
            else {
              setIsSubscriber(true);
              setSubscriberPrompt("Unsubscribe.")
            }
          }
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
              msg = "Subscribers not found";
            }
            else if (status === 403) {
              msg = "Subscribers permission blocked";
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
          if(cancel) return; //TODO: set error status message in global app status or in the messages panel
        });
      }

      return () => {
        cancel = true;
      }
  }, [isContactMenuOpen]);

  let handleTabChange = (e, newValue) => {
    setTabIndex(newValue);
    props.history.push(`${curPath}/${newValue}`);
  }

  let {username,subscribers} = userInfo;

  let openContactMenu = (e) => {
    if(userID!==getAuthenticatedUserID()){
      setContactMenuAnchor(e.currentTarget);
    }
  };

  let closeContactMenu = () => {
    setContactMenuAnchor(null);
  };

  function toggleIsContact(){
    if(isContact){
      removeContact();
    }
    else {
      addContact();
    }
    setIsContact(!isContact);
    closeContactMenu();
  }

  function toggleIsSubscriber(){
    if(isSubscriber){
      unsubscribe();
    }
    else {
      subscribe();
    }
    setIsSubscriber(!isSubscriber);
    closeContactMenu();
  }

  function getContacts(contactsInfo){
    let newContacts = [];
    for(let i=0; i<contactsInfo.length; i++){
      newContacts.push(contactsInfo[i].username);
    }
    return newContacts;
  }

  function getSubscribers(subscribersInfo){
    let newSubscribers = [];
    for(let i=0; i<subscribersInfo.length; i++){
      newSubscribers.push(subscribersInfo[i].username);
    }
    return newSubscribers;
  }

  async function addContact() {
    const newContact = {
      contacting_id: getAuthenticatedUserID(),
      contacted_id: userID
    }
    console.log('adding contact',newContact,getAccessToken());
    try {
      const response = await Api.request('link','/users/add_contact',newContact,{},true);
      console.log('contact add',response);
      const res = response.data;
      return res;
    }
    catch(err) {
      console.log('contact add',err);
      throw err;
    }
  }

  async function subscribe() {
    const newSubscriber = {
      subscribing_id: getAuthenticatedUserID(),
      subscribed_id: userID
    }
    console.log('adding subscriber',newSubscriber,getAccessToken());
    try {
      const response = await Api.request('link','/users/subscribe',newSubscriber,{},true);
      console.log('subscriber',response);
      const res = response.data;
      return res;
    }
    catch(err) {
      console.log('subscriber',err);
      throw err;
    }
  }

  async function removeContact() {
    const oldContact = {
      contact_removing_id: getAuthenticatedUserID(),
      contact_removed_id: userID
    }
    console.log('removing contact',oldContact,getAccessToken());
    try {
      const response = await Api.request('unlink','/users/remove_contact',oldContact,{},true);
      console.log('remove contact',response);
      const res = response.data;
      return res;
    }
    catch(err) {
      console.log('remove contact',err);
      throw err;
    }
  }

  async function unsubscribe() {
    const oldSubscriber = {
      unsubscribing_id: getAuthenticatedUserID(),
      unsubscribed_id: userID
    }
    console.log('removing subscriber',oldSubscriber,getAccessToken());
    try {
      const response = await Api.request('unlink','/users/unsubscribe',oldSubscriber,{},true);
      console.log('remove subscriber',response);
      const res = response.data;
      return res;
    }
    catch(err) {
      console.log('remove subscriber',err);
      throw err;
    }
  }

  const contactMenu = (
    <Menu anchorEl={contactMenuAnchor} open={isContactMenuOpen} onClose={closeContactMenu} >
      {
        isLoggedIn ? [
          <MenuItem key={'toggleContact'} onClick={() => toggleIsContact()}>{contactPrompt}</MenuItem>,
          <MenuItem key={'toggleSubscribe'} onClick={() => toggleIsSubscriber()}>{subscribePrompt}</MenuItem>
        ] : (
          <MenuItem component={Link} to='/login'>
            <ListItemText inset primary="Please login to contact." />
            <ListItemIcon>
              <AccountCircle/>
            </ListItemIcon>
          </MenuItem>
        )
      }
    </Menu>
  );

  return (
    <div>
      <div className={classes.header}>
        <Typography variant='h5'>{username}</Typography>
        {
          subscribers === 1 ? (
            <Typography variant='body1'>{subscribers} subscriber</Typography>
          ):
            <Typography variant='body1'>{subscribers} subscribers</Typography>
        }
      </div>
      <div className={classes.tabbedpage}>
        <AppBar position="static">
          <Toolbar>
            <Tabs value={tabIndex} onChange={handleTabChange}>
              <Tab label="About" value="about"/>
              <Tab label="Files" value="files"/>
              <Tab label="Playlists" value="playlists"/>
              <Tab label="Contacts" value="contacts"/>
            </Tabs>
            <div className={classes.grow} />
            <IconButton color="inherit" aria-haspopup="true" onClick={openContactMenu}>
              <AccountBox />
            </IconButton>
          </Toolbar>
        </AppBar>
        <TabContainer>
          <Switch>
            <Route path={`${props.match.path}/`} exact render={() => <AboutPage userID={userID} />}/>
            <Route path={`${props.match.path}/about`} render={() => <AboutPage userID={userID} />}/>
            <Route path={`${props.match.path}/files`} render={() => <ChannelFilesPage userID={userID} />}/>
            <Route path={`${props.match.path}/playlists/favorites`} render={() => <ChannelFavoritesPage userID={userID} />}/>
            <Route path={`${props.match.path}/playlists`} render={() => <ChannelPlaylistsPage userID={userID} />}/>
            <Route path={`${props.match.path}/contacts`} render={() => <ChannelContactsPage userID={userID} />}/>
            <Route component={Error404Page}/>
          </Switch>
        </TabContainer>
      </div>
      {contactMenu}
    </div>
  );
}
