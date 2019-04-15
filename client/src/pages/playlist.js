import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slide,
  Typography,
  IconButton,
  TextField
} from '@material-ui/core';
import {
  Edit
} from '@material-ui/icons';
import {
  Link
} from 'react-router-dom'
import ViewerPlaylist from '../components/viewerplaylist';
import Api from '../apiclient';
import {basicRequestCatch} from '../utils';
import {useAuthCtx} from '../authentication';
import {getAuthenticatedUserID} from '../authutils';

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
  },
  extras: {
    display: 'grid',
    gridAutoRows: '1fr',
    gridAutoFlow: 'column',
    gridGap: theme.spacing.unit * 2
  },
  metrics: {
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column'
  }
}));

function SlideTransition(props) {
  return <Slide direction='down' {...props}/>;
}

export default function PlaylistPage(props) {
  const classes = useStyles();
  const [isLoggedIn] = useAuthCtx();
  const [playlistInfo,setPlaylistInfo] = useState({playlist_id:props.match.params.id});

  const initialEditState = {open:false,loading:false,error:{}};
  const [editState, setEditState] = useState(initialEditState);
  const [editInputs, setEditInputs] = useState({title:'',description:''});

  let cancel = false;

  useEffect(() => {
    let id = props.match.params.id;
    Api.request('get',`/playlists/${id}`)
      .then(res => {
        if(!cancel) {
          setPlaylistInfo(res.data.response);
          let {title,description} = res.data.response;
          setEditInputs({title,description});
        }
      })
      .catch(basicRequestCatch('playlist'));
  }, [props]);

  useEffect(() => {
    if(editState.loading) {
      console.log(editInputs)
      Api.request('patch',`playlists/${playlistInfo.playlist_id}`,editInputs,{},true)
        .then(res => {
          if(cancel) return;
          setPlaylistInfo({...playlistInfo,...res.data.response});
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
              msg = "Playlist not found";
            }
            else if (status === 401) {
              msg = "Not allowed";
            }
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

  const {title,playlist_id,description,username,user_id} = playlistInfo;

  let extras = [];
  if(isLoggedIn) {
    // TODO: maybe allow user copy other user's playlist, just link or full copy?
    // extras.push(
    //   <IconButton key='playlist-add' aria-label="Add to Playlist" onClick={openPlaylistMenu}>
    //     <PlaylistAdd />
    //   </IconButton>
    // );
    if(getAuthenticatedUserID() === String(user_id)) {
      extras.push(
        <IconButton key='edit-playlist' aria-label="Edit playlist" onClick={openEditDialog}>
          <Edit />
        </IconButton>
      )
    }
  }

  return (
    <div className={classes.container}>
      <div className={classes.playlistInfo}>
        <Typography variant="h5">{title}</Typography>
        <Typography variant="h6" component={Link} to={`/channel/${user_id}`} style={{textDecoration: 'none'}}>{username}</Typography>
        <div className={classes.extras}>
          <div className={classes.toolbar}>
            { extras }
          </div>
          {/* <div className={classes.metrics}>
            <Typography variant="body1">{`${typeof(views) === "number" ? views : "?"} views`}</Typography>
            <div className={classes.rating}>
              <Typography variant="body1"><ThumbUp className={classes.rateIcon}/>{`${typeof(upvotes) === "number" ? upvotes : "?"}`}</Typography>
              <Typography variant="body1"><ThumbDown className={classes.rateIcon}/>{`${typeof(downvotes) === "number" ? downvotes : "?"}`}</Typography>
            </div>
          </div> */}
        </div>
        <Typography variant="body1">{description}</Typography>
      </div>
      <ViewerPlaylist playlist_id={playlist_id}/>
      <Dialog open={editState.open}
          TransitionComponent={SlideTransition}
          keepMounted
          onClose={closeEditDialog}
          aria-labelledby="edit-title">
        <DialogTitle id="edit-title">Edit Playlist</DialogTitle>
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
            {/* <TextField id='permissions' label='Permissions' type='text' required={true}
              className={classes.textField} margin='normal' variant='outlined'
              onChange={handleEditChange('permissions')}
              disabled={editState.loading}
              value={editInputs.permissions || permissions || ''}
              error={editState.error['permissionsError']}
              helperText={editState.error['permissionsErrorMsg']}/> */}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog} color="primary">Cancel</Button>
            <Button type="submit" color="primary" variant="contained" disabled={editState.loading}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

