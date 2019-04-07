import React, { useState, useEffect, useReducer } from 'react';
import classNames from 'classnames';
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
  Divider,
  Menu,
  MenuItem,
  Popper,
  ListItemIcon,
  ListItemText,
  InputLabel,
  Collapse,
  TextField,
  FormControl,
  Select,
  CircularProgress
} from '@material-ui/core';
import {
  CloudDownload,
  PlaylistAdd,
  Add as AddIcon
} from '@material-ui/icons';
import Player from '../components/player';
import Api from '../apiclient';
import { saveAs } from 'file-saver';
import { useAuthCtx, getAuthenticatedUserID } from '../authentication';

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
    gridGap: theme.spacing.unit
  },
  metrics: {
  },
  description: {
    textAlign: 'left',
    marginTop: theme.spacing.unit * 2
  },
  playlistMenu: {
    padding: theme.spacing.unit
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  }
}));

function SlideTransition(props) {
  return <Slide direction='down' {...props}/>;
}

const initialCreatePlaylistState = {
  loading: false,
  success: false
};
const createPlaylistReducer = (state, action) => {
  switch(action) {
    case 'submit':
      return {
        loading: true,
        success: false
      }
    case 'success':
      return {
        loading: false,
        success: true
      }
    case 'error':
    case 'initial':
      return initialCreatePlaylistState;
    default:
      return state;
  }
};

function PlaylistMenu(props) {
  const classes = useStyles();
  const [results, setResults] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [inputs, setInputs] = useState({});
  const [createPlaylistState, setCreatePlaylistState] = useReducer(createPlaylistReducer, initialCreatePlaylistState);
  let cancel = false;

  useEffect(() => {
    let id = getAuthenticatedUserID();
    Api.getData('playlists','',[{column:'user_id',value:id,cmp:'exact'}],[])
      .then(res => {
        if(!cancel) setResults(res.data.response);
      })
      .catch(err => {
        console.log('view',err);
      })
    
    return () => {
      cancel = true
    };
  }, []);

  useEffect(() => {
    if(createPlaylistState.loading) {
      closeForm();
    }
  }, [createPlaylistState]);

  let openForm = () => {
    setFormOpen(true);
  };
  let closeForm = () => {
    setFormOpen(false);
  };
  let submitForm = (e) => {
    e.preventDefault();
    setCreatePlaylistState('submit');
  };

  let handleChange = (key) => (e) => {
    setInputs({...inputs, [key]: e.currentTarget.value});
  };

  let plistMenuItems = results.map(result => {
    let {playlist_id, title} = result;
    return <MenuItem key={`plist-result-${playlist_id}`} onClick={() => console.log('view',playlist_id)}>{title}</MenuItem>
  });

  let {loading, success} = createPlaylistState;

  return (
    <Popper {...props} className={classes.playlistMenu}>
      <Paper className={classes.menuContents}>
        <Typography variant="body1">Add to...</Typography>
        <Divider/>
        <DialogContent>
          {plistMenuItems}
        </DialogContent>
        <Divider/>
        <DialogActions>
          <Collapse in={formOpen} timeout="auto" unmountOnExit>
            <form className={classes.form} onSubmit={submitForm}>
              <TextField id='name' label='Playlist Name' type='text' required={true}
                className={classes.textField} margin='normal' variant='outlined'
                onChange={handleChange('name')}
                disabled={loading}
                autoFocus/>
              <TextField id='description' label='Description' type='text' required={false}
                className={classes.textField} margin='normal' variant='outlined'
                onChange={handleChange('description')}
                disabled={loading}/>
              <FormControl className={classes.selectInput}>
                <InputLabel htmlFor="privacy">Privacy</InputLabel>
                <Select value={inputs['privacy']} onChange={handleChange('privacy')}>
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="unlisted">Unlisted</MenuItem>
                  <MenuItem value="public">Public</MenuItem>
                </Select>
              </FormControl>
              <div className={classes.buttonWrapper}>
                <Button type='submit'
                  size='large'
                  color='primary'
                  className={classNames({
                    [classes.buttonSuccess]: success
                  })}
                  variant='text'
                  disabled={loading}>
                  Submit
                </Button>
                {loading && <CircularProgress size={24} className={classes.buttonProgress}/>}
              </div>
            </form>
          </Collapse>
        </DialogActions>
      </Paper>
    </Popper>
  );
  // return <Menu className={classes.playlistMenu} {...props}>
  //   <Typography variant="body1">Add to...</Typography>
  //   <Divider key='divider'/>
  //   {plistMenuItems}
  //   <Divider key='divider'/>
  //   <MenuItem key="new-playlist" onClick={openForm}>
  //     <ListItemIcon><AddIcon/></ListItemIcon>
  //     <ListItemText primary="Create new playlist"/>
  //   </MenuItem>
  //   <Collapse in={formOpen} timeout="auto" unmountOnExit>
  //     <form className={classes.form} onSubmit={submitForm}>
  //       <TextField id='name' label='Playlist Name' type='text' required={true}
  //         className={classes.textField} margin='normal' variant='outlined'
  //         onChange={handleChange('name')}
  //         disabled={loading}
  //         autoFocus/>
  //       <TextField id='description' label='Description' type='text' required={false}
  //         className={classes.textField} margin='normal' variant='outlined'
  //         onChange={handleChange('description')}
  //         disabled={loading}/>
  //       <FormControl className={classes.selectInput}>
  //         <InputLabel htmlFor="privacy">Privacy</InputLabel>
  //         <Select value={inputs['privacy']} onChange={handleChange('privacy')}>
  //           <MenuItem value="private">Private</MenuItem>
  //           <MenuItem value="unlisted">Unlisted</MenuItem>
  //           <MenuItem value="public">Public</MenuItem>
  //         </Select>
  //       </FormControl>
  //       <div className={classes.buttonWrapper}>
  //         <Button type='submit'
  //           size='large'
  //           color='primary'
  //           className={classNames({
  //             [classes.buttonSuccess]: success
  //           })}
  //           variant='text'
  //           disabled={loading}>
  //           Submit
  //         </Button>
  //         {loading && <CircularProgress size={24} className={classes.buttonProgress}/>}
  //       </div>
  //     </form>
  //   </Collapse>
  // </Menu>;
}

const initialAlertState = {
  open: false,
  title: '',
  message: ''
};

export default function ViewPage(props) {
  const classes = useStyles();
  const [isLoggedIn] = useAuthCtx();
  const [fileInfo,setFileInfo] = useState({file_id:props.match.params.id});
  const [alertState, setAlertState] = useState(initialAlertState);
  const [plistMenuAnchor, setPlistMenuAnchor] = useState(null);
  let cancel = false;

  useEffect(() => {
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
                <Typography variant="body1">{`${views !== null ? views : "?"} views`}</Typography>
                <Typography variant="body1">{`${upvotes !== null ? upvotes : "?"} upvotes`}</Typography>
                <Typography variant="body1">{`${downvotes !== null ? downvotes : "?"} downvotes`}</Typography>
              </div>
            </div>
          </div>
          <div className={classes.description}>
            <Typography variant="body1">{description}</Typography>
          </div>
        </div>
      </Paper>
      {
        /* 
        <Comments/>
        <Playlist/>
        <Recommended/>
        */
      }
      <PlaylistMenu anchorEl={plistMenuAnchor} open={isPlistMenuOpen} onClose={closePlistMenu}/>
    </div>
  );
}
