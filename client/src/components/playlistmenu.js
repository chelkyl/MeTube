import React, { useState, useEffect, useReducer } from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  blue,
} from '@material-ui/core/colors';
import {
  Popper,
  Paper,
  Grow,
  ClickAwayListener,
  Divider,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Collapse,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Button,
  CircularProgress
} from '@material-ui/core';
import {
  Add as AddIcon
} from '@material-ui/icons';
import axios from 'axios';
import Api from '../apiclient';
import {getAuthenticatedUserID} from '../authutils';
import {deepCopyObject, basicRequestCatch} from '../utils';

const useStyles = makeStyles(theme => ({
  menuWrapper: {
    width: 260,
    zIndex: theme.zIndex.modal + 1
  },
  playlistMenu: {
    padding: theme.spacing.unit
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  playlistMenuTitle: {
    margin: `${theme.spacing.unit}px 0`,
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit
  },
  listItem: {
    height: '2.2em',
    paddingLeft: 0
  },
  listItemBox: {
    padding: 0,
    marginLeft: 12
  },
  buttonWrapper: {
    textAlign: 'right',
    paddingTop: theme.spacing.unit
  },
  buttonProgress: {
    color: blue[500],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12
  }
}));

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

const initialInputs = {
  name: '',
  description: '',
  privacy: 'private'
};

export default function PlaylistMenu(props) {
  const classes = useStyles();
  const [playlists, setPlaylists] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [inputs, setInputs] = useState(initialInputs);
  const [createPlaylistState, setCreatePlaylistState] = useReducer(createPlaylistReducer, initialCreatePlaylistState);
  let userID = getAuthenticatedUserID();
  let {file_id} = props;
  let cancel = false;

  useEffect(() => {
    Api.getData('playlists',null,[{column:'user_id',value:userID,cmp:'exact'}],[])
      .then(res => {
        console.log('playlistmenu get success',res);
        if(!cancel) setPlaylists(res.data.response);
      })
      .catch(basicRequestCatch('playlistmenu'));
  }, []);

  useEffect(() => {
    if(createPlaylistState.success) {
      closeForm();
      Api.getData('playlists',null,[{column:'user_id',value:userID,cmp:'exact'}],[])
        .then(res => {
          console.log('playlistmenu get refresh success',res);
          if(!cancel) setPlaylists(res.data.response);
        })
        .catch(basicRequestCatch('playlistmenu get error'));
    }
  }, [createPlaylistState]);

  useEffect(() => {
    let requests = [];
    if(playlists.length > 0) {
      playlists.forEach(playlist => {
        let {playlist_id:id} = playlist;
        requests.push(Api.getData(`playlists/${id}/files`,null,[{column:'file_id',value:file_id,cmp:'exact'}]));
      });
      axios.all(requests)
        .then(responses => {
          if(cancel) return;
          console.log('playlistmenu get files success',responses);
          let newInputs = deepCopyObject(inputs);
          responses.forEach((res, i) => {
            if(res.data.response.length) {
              newInputs[`checkbox-${playlists[i].playlist_id}`] = true;
            }
          });
          setInputs(newInputs);
        })
        .catch(basicRequestCatch('playlistmenu get file added error'));
    }
  }, [playlists]);

  let openForm = () => {
    setFormOpen(true);
  };
  let closeForm = () => {
    setFormOpen(false);
  };
  let submitForm = (e) => {
    e.preventDefault();
    setCreatePlaylistState('submit');
    let {name:title,description} = inputs; //TODO: add privacy setting?
    Api.request('post','playlists/create',{title,description,user_id:getAuthenticatedUserID()},{},true)
      .then(res => {
        console.log('playlistmenu post success',res);
        setCreatePlaylistState('success');
        let {playlist_id} = res.data.response;
        onClickPlaylist(playlist_id)();
      })
      .catch(err => {
        basicRequestCatch(`playlistmenu post`)(err);
        setCreatePlaylistState('error');
      });
  };

  let handleChange = (key) => (e) => {
    setInputs({...inputs, [key]: e.currentTarget.value});
  };
  let onClickPlaylist = (id) => () => {
    let key = `checkbox-${id}`;
    let isAdd = !inputs[key];
    let method = isAdd ? 'link' : 'unlink';
    if(id === 'favorites') {
      Api.request(method,`users/${userID}/favorites`, {file_id:file_id}, {}, true)
        .then(res => {
          console.log(`playlistmenu favorites ${method}`,res);
          setInputs({...inputs, [key]: isAdd});
        })
        .catch(basicRequestCatch(`playlistmenu favorites ${method}`));
    }
    else {
      Api.request(method,`playlists/${id}/file`, {file_id:file_id}, {}, true)
        .then(res => {
          console.log(`playlistmenu ${method}`,res);
          setInputs({...inputs, [key]: isAdd});
        })
        .catch(basicRequestCatch(`playlistmenu ${method}`));
    }
  };

  let plistItems = [
    <ListItem key={`plist-favorites`} button onClick={onClickPlaylist('favorites')} className={classes.listItem}>
      <Checkbox checked={inputs[`checkbox-favorites`] || false} tabIndex={-1} disableRipple className={classes.listItemBox}/>
      <ListItemText primary="Favorites" />
    </ListItem>
  ];
  if(playlists.length > 0) {
    plistItems.push(...playlists.map(result => {
      let {playlist_id, title} = result;
      return (
        <ListItem key={`plist-result-${playlist_id}`} button onClick={onClickPlaylist(playlist_id)} className={classes.listItem}>
          <Checkbox checked={inputs[`checkbox-${playlist_id}`] || false} tabIndex={-1} disableRipple className={classes.listItemBox}/>
          <ListItemText primary={title} />
        </ListItem>
      );
    }));
  }
  // else {
  //   plistItems = <ListItem><ListItemText primary="No playlists"></ListItemText></ListItem>;
  // }

  let {loading} = createPlaylistState;

  let {open, anchorEl, onClose} = props;

  let closeMenu = () => {
    closeForm();
    onClose();
  }

  return (
    <Popper open={open} anchorEl={anchorEl} transition className={classes.menuWrapper}>
      {({ TransitionProps, placement }) => (
        <Grow
          {...TransitionProps}
          id="menu-list-grow"
          style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
        >
          <Paper>
            <ClickAwayListener onClickAway={closeMenu}>
              <List className={classes.playlistMenu}>
                <Typography variant="body1" className={classes.playlistMenuTitle}>Add to...</Typography>
                <Divider/>
                {plistItems}
                <Divider/>
                {formOpen ? null :
                  <ListItem key="new-playlist" button onClick={openForm}>
                    <ListItemIcon><AddIcon/></ListItemIcon>
                    <ListItemText primary="Create new playlist"/>
                  </ListItem>
                }
                <Collapse in={formOpen} timeout="auto">
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
                    <FormControl className={classes.selectInput} disabled={loading}>
                      <InputLabel htmlFor="privacy">Privacy</InputLabel>
                      <Select native onChange={handleChange('privacy')}>
                        <option value="private">Private</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="public">Public</option>
                      </Select>
                    </FormControl>
                    <div className={classes.buttonWrapper}>
                      <Button type='submit'
                        size='large'
                        color='primary'
                        variant='text'
                        disabled={loading}>
                        Submit
                      </Button>
                      {loading && <CircularProgress size={24} className={classes.buttonProgress}/>}
                    </div>
                  </form>
                </Collapse>
              </List>
            </ClickAwayListener>
          </Paper>
        </Grow>
      )}
    </Popper>
  );
}
