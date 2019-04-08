import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Typography,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Switch
} from '@material-ui/core';
import {
  Sort
} from '@material-ui/icons';
import Api from '../apiclient';
import {useAuthCtx} from '../authentication';
import {getAuthenticatedUserID} from '../authutils';
import { basicRequestCatch } from '../utils';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column'
  },
  itemsGrid: {

  }
}));

//TODO: goes in channel page, shows all playlists created by channel's user (not current logged in user) with some sort (maybe also folder/group organization) controls

export default function ChannelPlaylistPage(props) {
  const classes = useStyles();
  const [isLoggedIn] = useAuthCtx();
  const [playlists, setPlaylistsInfo] = useState([]);
  let cancel = false;

  useEffect(() => {
    if(isLoggedIn) {
      Api.getData(`playlists/${getAuthenticatedUserID()}`)
        .then(res => {
          console.log('playlists get',res);
          if(!cancel) setPlaylistsInfo(res);
        })
        .catch(basicRequestCatch('playlists get'));
    }
  }, []);

  return (
    <div className={classes.playlists}>
      {playlists.map((playlist) => {
        return null; //FIXME: return resultItemCard
      })}
    </div>
  );
}

