import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slide,
  Paper,
  Typography,
  IconButton
} from '@material-ui/core';
import {
  CloudDownload,
  PlaylistAdd,
  ThumbUp,
  ThumbDown
} from '@material-ui/icons';
import Player from '../components/player';
import PlaylistMenu from '../components/playlistmenu';
import ViewerPlaylist from '../components/viewerplaylist';
import Comments from '../components/comments';
import Api from '../apiclient';
import { saveAs } from 'file-saver';
import {useAuthCtx} from '../authentication';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'left'
  },
  fileInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    textAlign: 'left',
    padding: theme.spacing.unit * 2
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    alignItems: 'end',
    justifyContent: 'space-between',
    textAlign: 'left'
  },
  details: {
  },
  extras: {
    display: 'grid',
    gridAutoRows: '1fr',
    gridAutoFlow: 'column',
    gridGap: theme.spacing.unit * 2
  },
  metrics: {
  },
  description: {
    textAlign: 'left',
    marginTop: theme.spacing.unit * 2
  },
  rating: {
    marginTop: theme.spacing.unit
  },
  rateIcon: {
    marginRight: theme.spacing.unit * 2
  },
  rightIcon: {
    marginLeft: theme.spacing.unit,
  },
  button: {
    margin: theme.spacing.unit,
  },
  grow: {
    flexGrow: 1
  }
}));

function SlideTransition(props) {
  return <Slide direction='down' {...props}/>;
}

const initialAlertState = {
  open: false,
  title: '',
  message: ''
};

export default function ViewPage(props) {
  const classes = useStyles();
  const [isLoggedIn] = useAuthCtx();
  const params = new URLSearchParams(props.location.search);
  const [playlistID, setPlaylistID] = useState(params.get('playlist') || null);
  const [fileInfo,setFileInfo] = useState({file_id:props.match.params.id});
  const [alertState, setAlertState] = useState(initialAlertState);
  const [plistMenuAnchor, setPlistMenuAnchor] = useState(null);

  let cancel = false;

  useEffect(() => {
    const newParams = new URLSearchParams(props.location.search);
    const newPlaylistID = newParams.get('playlist') || null;
    if(newPlaylistID !== playlistID) setPlaylistID(newPlaylistID);

    let id = props.match.params.id;
    Api.request('get',`/files/${id}`)
      .then(res => {
        if(!cancel) setFileInfo(res.data.response);
      })
      .catch(err => {
        let msg = '';
        let title = '';
        // got response from server
        if(err.response) {
          const { status } = err.response;
          title = 'Send report?';
          if (status >= 500 && status < 600) {
            msg = `Server error ${status}, please contact the admins`;
          }
          else if (status === 404) {
            msg = "File not found";
          }
          else if (status === 403) {
            msg = "File permission blocked";
          }
          else {
            msg = `Sorry, unknown error ${status}`;
          }
        }
        // request sent but no response
        else if(err.request) {
          title = 'Check connection';
          msg = 'Could not connect to the server';
        }
        // catch all
        else {
          title = 'Send report?';
          msg = 'Sorry, unknown error';
        }
        console.log('view',err);
        if(cancel) return;
        setAlertState({title: title, message: msg, open: true});
        setFileInfo({file_id:id});
      });

      return () => {
        cancel = true;
      }
  }, [props]);


  let openPlaylistMenu = (e) => {
    setPlistMenuAnchor(e.currentTarget);
  };
  let closePlistMenu = () => {
    setPlistMenuAnchor(null);
  };

  let downloadFile = () => {
    saveAs(`${Api.baseURL}/files/${fileInfo.file_id}/g`,fileInfo.title);
  };

  let handleDialogButton = (type) => (e) => {
    switch(type) {
      case 'close':
        setAlertState(initialAlertState);
        break;
      case 'report':
        // props.history.push(`mailto:${process.env.REACT_APP_DEV_EMAIL}`);
        setAlertState(initialAlertState);
        break;
      default:
        break;
    }
  };

  const { title, username, description, upload_date, views, upvotes, downvotes } = fileInfo;

  const isPlistMenuOpen = Boolean(plistMenuAnchor);

  return (
    <div className={classes.container}>
      <Dialog open={alertState.open}
          TransitionComponent={SlideTransition}
          keepMounted
          onClose={() => setAlertState(initialAlertState)}
          aria-labelledby="alert-title"
          aria-describedby="alert-description">
        <DialogTitle id="alert-title">{alertState.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-description">{alertState.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogButton('close')} color="primary">Close</Button>
          <Button onClick={handleDialogButton('report')} color="primary" variant="contained" autoFocus>Send Report</Button>
        </DialogActions>
      </Dialog>
      <Player {...fileInfo}/>
      <ViewerPlaylist playlist_id={playlistID} />
      <Paper>
        <div className={classes.fileInfo}>
          <div className={classes.header}>
            <div className={classes.details}>
              <Typography variant="h6">{title}</Typography>
              <Typography variant="body1">{username}</Typography>
              <Typography variant="body1">{upload_date}</Typography>
            </div>
            <div className={classes.extras}>
              <div className={classes.toolbar}>
                { isLoggedIn &&
                  <IconButton aria-label="Add to Playlist" onClick={openPlaylistMenu}>
                    <PlaylistAdd />
                  </IconButton>
                }
                <IconButton aria-label="Download" onClick={downloadFile}>
                  <CloudDownload />
                </IconButton>
              </div>
              <div className={classes.metrics}>
                <Typography variant="body1">{`${typeof(views) === "number" ? views : "?"} views`}</Typography>
                <div className={classes.rating}>
                  <Typography variant="body1"><ThumbUp className={classes.rateIcon}/>{`${typeof(upvotes) === "number" ? upvotes : "?"}`}</Typography>
                  <Typography variant="body1"><ThumbDown className={classes.rateIcon}/>{`${typeof(downvotes) === "number" ? downvotes : "?"}`}</Typography>
                </div>
              </div>
            </div>
          </div>
          <div className={classes.description}>
            <Typography variant="body1">{description}</Typography>
          </div>
          <Comments file_id={props.match.params.id}/>
        </div>
      </Paper>
      {
        /*
        <Comments/>
        <Playlist/>
        <Recommended/>
        */
      }
      <PlaylistMenu file_id={fileInfo.file_id} anchorEl={plistMenuAnchor} open={isPlistMenuOpen} onClose={closePlistMenu}/>
    </div>
  );
}
