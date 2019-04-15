//TODO: lists all files in a playlist
//TODO: if playlist owned by logged in user, shows edit controls

import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  
} from '@material-ui/core/colors';
import {
  Typography
} from '@material-ui/core';
import {
  // Edit
} from '@material-ui/icons';
import Api from '../apiclient';
import {basicRequestCatch} from '../utils';
import ViewerPlaylist from '../components/viewerplaylist';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    textAlign: 'left'
  },
  playlistInfo: {
    width: 300
  },
  filesList: {
    flexGrow: 1
  }
}));


export default function PlaylistPage(props) {
  const classes = useStyles();
  const [playlistInfo,setPlaylistInfo] = useState({playlist_id:props.match.params.id});
  let cancel = false;

  useEffect(() => {
    let id = props.match.params.id;
    Api.request('get',`/playlists/${id}`)
      .then(res => {
        if(!cancel) setPlaylistInfo(res.data.response);
      })
      .catch(basicRequestCatch('playlist'));
  }, [props]);

  let {title,playlist_id,description,username} = playlistInfo;
  return (
    <div className={classes.container}>
      <div className={classes.playlistInfo}>
        <Typography variant="h5">{title}</Typography>
        <Typography variant="h6">{username}</Typography>
        <Typography variant="body1">{description}</Typography>
      </div>
      <ViewerPlaylist playlist_id={playlist_id}/>
    </div>
  );
}

