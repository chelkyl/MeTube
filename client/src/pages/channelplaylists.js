import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Typography,
  Divider
} from '@material-ui/core';
import {

} from '@material-ui/icons';
import Api from '../apiclient';
// import { getAuthenticatedUserID } from '../authutils';
import { basicRequestCatch } from '../utils';
import ResultItemCard from '../components/resultItemCard';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column'
  },
  header: {

  },
  sectionTitle: {
    marginBottom: 4
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, 210px)',
    gridColumnGap: theme.spacing.unit,
    gridRowGap: theme.spacing.unit
  },
  resultItem: {
    marginBottom: theme.spacing.unit
  }
}));

export default function ChannelPlaylistsPage(props) {
  const classes = useStyles();
  const [playlists, setPlaylistsInfo] = useState([]);
  let {userID} = props;
  // let canEdit = userID === getAuthenticatedUserID(); TODO: allows create, select and delete
  let cancel = false;

  useEffect(() => {
    Api.getData('playlists',null,[{column:'user_id',value:userID,cmp:'exact'}])
      .then(res => {
        console.log('playlists get',res);
        if(!cancel) setPlaylistsInfo(res.data.response);
      })
      .catch(basicRequestCatch('playlists get'));

    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className={classes.container}>
      <div className={classes.header}>
      </div>
      <Divider/>
      <Typography variant="h5" className={classes.sectionTitle}>
        Created Playlists
      </Typography>
      <div className={classes.itemsGrid}>
        <ResultItemCard key={`playlist-favorites`}
          className={classes.resultItem}
          name="Favorites"
          result_type="favorites"
          id={userID}
          variant="small"/>
        {playlists.map(playlist => {
          let {playlist_id,title,username} = playlist;
          return <ResultItemCard key={`playlist-${playlist_id}`}
            className={classes.resultItem}
            name={title}
            owner={username}
            result_type="playlists"
            id={playlist_id}
            variant="small"/>
        })}
      </div>
    </div>
  );
}

