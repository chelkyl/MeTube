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
  IconButton,
  TextField
} from '@material-ui/core';
import {
  CloudDownload,
  PlaylistAdd,
  ThumbUp,
  ThumbDown,
  Edit
} from '@material-ui/icons';
import {
  Link
} from 'react-router-dom';
import Player from '../components/player';
import PlaylistMenu from '../components/playlistmenu';
import ViewerPlaylist from '../components/viewerplaylist';
import Comments from '../components/comments';
import Api from '../apiclient';
import { saveAs } from 'file-saver';
import {useAuthCtx} from '../authentication';
import {getAuthenticatedUserID} from '../authutils';

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
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column'
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
  const [fileInfo, setFileInfo] = useState({file_id:props.match.params.id});
  const [alertState, setAlertState] = useState(initialAlertState);
  
  const [plistMenuAnchor, setPlistMenuAnchor] = useState(null);

  const initialEditState = {open:false,loading:false,error:{}};
  const [editState, setEditState] = useState(initialEditState);
  const [editInputs, setEditInputs] = useState({title:'',description:'',permissions:''});

  let cancel = false;

  useEffect(() => {
    const newParams = new URLSearchParams(props.location.search);
    const newPlaylistID = newParams.get('playlist') || null;
    if(newPlaylistID !== playlistID) setPlaylistID(newPlaylistID);

    let id = props.match.params.id;
    Api.request('get',`/files/${id}`)
      .then(res => {
        if(!cancel) {
          setFileInfo(res.data.response);
          let {title, description, permissions} = res.data.response;
          setEditInputs({title,description,permissions});
        }
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

  useEffect(() => {
    if(editState.loading) {
      Api.request('patch',`files/${fileInfo.file_id}`,editInputs,{},true)
        .then(res => {
          if(cancel) return;
          setFileInfo({...fileInfo,...res.data.response});
          setEditInputs(res.data.response);
          setEditState(initialEditState);
        })
        .catch(err => {
          let msg = '';
          // got response from server
          if(err.response) {
            const { status } = err.response;
            if (status >= 500 && status < 600) {
              msg = `Server error ${status}, please contact the admins`;
            }
            else if (status === 404) {
              msg = "File not found";
            }
            else if (status === 401) {
              msg = "Not allowed";
            }
            // else if (status === 400) {
            //   let {error} = err.response.data;
            //   if(error['not unique']) {
            //     error['not unique'].forEach((tag) => {
            //       err[tag+'Error'] = true;
            //       err[tag+'ErrorMsg'] = 'Must be unique';
            //     });
            //   }
            //   else msg = err.error;
            // }
            else {
              msg = `Sorry, unknown error ${status}`;
            }
          }
          // request sent but no response
          else if(err.request) {
            msg = 'Could not connect to the server';
          }
          // catch all
          else {
            msg = 'Sorry, unknown error';
          }
          if(cancel) return;
          setEditState({open:true,loading:false,error:{...err,message:msg}});
        });
    }
  }, [editState]);

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

  let openEditDialog = () => {
    setEditState({...initialEditState,open:true});
  };
  let closeEditDialog = () => {
    setEditState(initialEditState);
  };
  let handleEditChange = (key) => (e) => {
    setEditInputs({...editInputs,[key]:e.currentTarget.value});
  };
  let handleEditSubmit = (e) => {
    e.preventDefault();
    if(!editState.loading) {
      setEditState({...editState, loading: true});
    }
  }

  const { title, user_id, username, description, upload_date, views, upvotes, downvotes, permissions } = fileInfo;

  const isPlistMenuOpen = Boolean(plistMenuAnchor);

  let extras = [];
  if(isLoggedIn) {
    extras.push(
      <IconButton key='playlist-add' aria-label="Add to Playlist" onClick={openPlaylistMenu}>
        <PlaylistAdd />
      </IconButton>
    );
    if(getAuthenticatedUserID() === String(user_id)) {
      extras.push(
        <IconButton key='edit-file' aria-label="Edit file" onClick={openEditDialog}>
          <Edit />
        </IconButton>
      )
    }
  }

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
      <Dialog open={editState.open}
          TransitionComponent={SlideTransition}
          keepMounted
          onClose={closeEditDialog}
          aria-labelledby="edit-title">
        <DialogTitle id="edit-title">Edit File</DialogTitle>
        <form className={classes.editFormWrap} onSubmit={handleEditSubmit}>
          <DialogContent className={classes.editForm}>
            <Typography variant="body1" color="error">
              {editState.error.message}
            </Typography>
            <TextField id='title' label='Title' type='text' required={true}
              className={classes.textField} margin='normal' variant='outlined'
              onChange={handleEditChange('title')}
              disabled={editState.loading}
              value={editInputs.title || title || ''}
              autoFocus
              error={editState.error['titleError']}
              helperText={editState.error['titleErrorMsg']}/>
            <TextField id='description' label='Description' type='text' required={true}
              className={classes.textField} margin='normal' variant='outlined' multiline
              onChange={handleEditChange('description')}
              disabled={editState.loading}
              value={editInputs.description || description || ''}
              error={editState.error['descriptionError']}
              helperText={editState.error['descriptionErrorMsg']}/>
            <TextField id='permissions' label='Permissions' type='text' required={true}
              className={classes.textField} margin='normal' variant='outlined'
              onChange={handleEditChange('permissions')}
              disabled={editState.loading}
              value={editInputs.permissions || permissions || ''}
              error={editState.error['permissionsError']}
              helperText={editState.error['permissionsErrorMsg']}/>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog} color="primary">Cancel</Button>
            <Button type="submit" color="primary" variant="contained" disabled={editState.loading}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>
      <Player {...fileInfo}/>
      <ViewerPlaylist playlist_id={playlistID} />
      <Paper>
        <div className={classes.fileInfo}>
          <div className={classes.header}>
            <div className={classes.details}>
              <Typography variant="h6">{title}</Typography>
              <Typography variant="body1" component={Link} to={`/channel/${user_id}`} style={{textDecoration: 'none'}}>{username}</Typography>
              <Typography variant="body1">{upload_date}</Typography>
            </div>
            <div className={classes.extras}>
              <div className={classes.toolbar}>
                { extras }
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
      <PlaylistMenu file_id={fileInfo.file_id} anchorEl={plistMenuAnchor} open={isPlistMenuOpen} onClose={closePlistMenu}/>
    </div>
  );
}
