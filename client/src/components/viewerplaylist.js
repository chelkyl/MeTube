import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Paper,
  Divider,
  Typography
} from '@material-ui/core';
import {
} from '@material-ui/icons';
import Api from '../apiclient';
import {basicRequestCatch} from '../utils';
import ResultItemCard from './resultItemCard';
import axios from 'axios';

const useStyles = makeStyles(theme => ({
  viewerPlaylist: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1
  },
  resultItem: {
    marginTop: theme.spacing.unit
  },
  filesList: {
    overflowY: 'auto'
  }
}));

export default function ViewerPlaylist(props) {
  const classes = useStyles();
  let {playlist_id, title:list_title, variant} = props;
  const [fileIDs, setFileIDs] = useState([]);
  const [files, setFiles]     = useState([]);
  let cancel = false;

  useEffect(() => {
    if(playlist_id) {
      Api.getData(`playlists/${playlist_id}/files`)
        .then(res => {
          console.log('viewerplaylist',res.data.response);
          let data = res.data.response;
          let newFileIDs = data.map(p_f_item => {
            return p_f_item.file_id;
          });
          if(!cancel) setFileIDs(newFileIDs);
        })
        .catch(basicRequestCatch('viewerplaylist'));
    }

    return () => {
      cancel = true;
    }
  }, [playlist_id]);

  useEffect(() => {
    let requests = [];
    fileIDs.forEach(id => {
      requests.push(Api.request('get',`files/${id}`));
    });
    axios.all(requests)
      .then(responses => {
        if(cancel) return;
        console.log('viewerplaylist get files:',responses);
        let reqResults = responses.map(res => {
          console.log(res.data.response);
          return res.data.response;
        })
        console.log(reqResults);
        setFiles(reqResults);
      })
      .catch(basicRequestCatch('viewerplaylist get files'));
  }, [fileIDs]);

  return (
    <div className={classes.viewerPlaylist}>
      <Paper>
        <Typography variant="h6">{list_title}</Typography>
        <Divider/>
        <div className={classes.filesList} styles={{
          height: variant === 'player' ? 118*3 : '100%' 
        }}>
          {files.map((file) => {
            let {file_id, title, username, mimetype} = file;
            return <ResultItemCard key={`file-${file_id}`}
                className={classes.resultItem}
                name={title}
                owner={username}
                result_type="files"
                mimetype={mimetype}
                id={file_id}
                playlist_id={playlist_id}
                variant="wide"/>
          })}
        </div>
      </Paper>
    </div>
  )
}

