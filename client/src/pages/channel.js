import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  AppBar,
  Typography,
  Tabs,
  Tab
} from '@material-ui/core';
import {
  
} from '@material-ui/icons';
import axios from 'axios';
import Api from '../apiclient';
import AboutPage from './about';
import ChannelPlaylistsPage from './channelplaylists';
import ChannelFilesPage from './channelfiles';
import Error404Page from './pageNotFound';
import {
  Route,
  Switch
} from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  tabbedpage: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
}));

function TabContainer(props) {
  return (
    <Typography component="div" style={{ padding: 8 * 3 }}>
      {props.children}
    </Typography>
  );
}

export default function UserPage(props) {
  const classes = useStyles();
  const [tabIndex, setTabIndex] = useState('about');
  const [userID, setUserID] = useState(props.match.params.id);
  const [userInfo, setUserInfo] = useState({});
  let cancel = false;
  let curPath = props.match.url;
  console.log('channel',userID,props.match);

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

  // useEffect(() => {
  //TODO: match params?
  // });

  useEffect(() => {
    let requests = {list: [], labels: []};
    addRequest(requests, 'userInfo', Api.getData(`users/${userID}`));
    addRequest(requests, 'subscribers', Api.getData(`users/${userID}/subscribers`));

    axios.all(requests.list)
      .then(responses => {
        if(cancel) return;
        console.log('channel',responses);
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
        let tag = 'channel';
        // got response from server
        if(err.response) {
          console.log(tag,err.response);
        }
        // request sent but no response
        else if(err.request) {
          console.log(tag,err.request);
        }
        // catch all
        else {
          console.log(tag,err);
        }
      });
    
    return () => {
      cancel = true;
    }
  }, [userID]);

  let handleTabChange = (e, newValue) => {
    console.log('channel tab event',e);
    setTabIndex(newValue);
    props.history.push(`${curPath}/${newValue}`);
  }

  let {username,subscribers} = userInfo;
  
  return (
    <div>
      <div className={classes.header}>
        <Typography variant='h5'>{username}</Typography>
        <Typography variant='body1'>{subscribers} subscribers</Typography>
      </div>
      <div className={classes.tabbedpage}>
        <AppBar position="static">
          <Tabs value={tabIndex} onChange={handleTabChange}>
            <Tab label="About" value="about"/>
            <Tab label="Files" value="files"/>
            <Tab label="Playlists" value="playlists"/>
          </Tabs>
        </AppBar>
        <TabContainer>
          <Switch>
            <Route path={`${props.match.path}/`} exact render={() => <AboutPage userID={userID} />}/>
            <Route path={`${props.match.path}/about`} render={() => <AboutPage userID={userID} />}/>
            <Route path={`${props.match.path}/files`} render={() => <ChannelFilesPage userID={userID} />}/>
            <Route path={`${props.match.path}/playlists`} render={() => <ChannelPlaylistsPage userID={userID} />}/>
            <Route component={Error404Page}/>
          </Switch>
        </TabContainer>
      </div>
    </div>
  );
}
