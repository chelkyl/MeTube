import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Typography,
  IconButton,
  TextField
} from '@material-ui/core';
import {
  Edit,
  Check,
  Close
} from '@material-ui/icons';
import Api from '../apiclient';
import {basicRequestCatch} from '../utils';
import {useAuthCtx} from '../authentication';
import {getAuthenticatedUserID} from '../authutils';

const useStyles = makeStyles(theme => ({
  about: {
    textAlign: 'left'
  },
  headerWrap: {
    display: 'flex'
  },
  headerTitle: {
    flexGrow: 1
  },
  extras: {
    display: 'grid',
    gridAutoRows: '1fr',
    gridAutoFlow: 'column',
    gridGap: theme.spacing.unit * 2
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column'
  }
}));

export default function AboutPage(props) {
  const classes = useStyles();
  const [isLoggedIn] = useAuthCtx();
  const {userID} = props;
  const [description, setDescription] = useState('');

  const canEdit = isLoggedIn && getAuthenticatedUserID() === String(userID);
  const initialEditState = {active:false,loading:false,error:{}};
  const [editState, setEditState] = useState(initialEditState);
  const [newDescription, setNewDescription] = useState('');
  let cancel = false;

  useEffect(() => {
    Api.request('get',`/users/${userID}` )
      .then(res =>{
        if(cancel) return;
        let {channel_description=''} = res.data.response;
        setDescription(channel_description);
        setNewDescription(channel_description);
      })
      .catch(basicRequestCatch('about'));
  }, [props]);

  useEffect(() => {
    if(editState.loading) {
      Api.request('patch',`/users/${userID}`,{channel_description:newDescription},{},true)
        .then(res => {
          if(cancel) return;
          let {channel_description=''} = res.data.response;
          setDescription(channel_description);
          setNewDescription(channel_description);
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
              msg = "User not found";
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
          setEditState({active:true,loading:false,error:{...err,message:msg}});
        });
    }
  }, [editState]);

  let activateEdit = () => {
    setEditState({...initialEditState,active:true});
  }
  let deactivateEdit = () => {
    setEditState({...initialEditState});
  }
  let saveEdits = () => {
    setEditState({...editState,loading:true});
  }
  let handleEditChange = (e) => {
    setNewDescription(e.currentTarget.value);
  }
  
  let extras = [];
  if(canEdit) {
    if(editState.active) {
      extras.push(
        <IconButton key='edit-cancel' aria-label="Cancel" onClick={deactivateEdit}>
          <Close />
        </IconButton>
      );
      extras.push(
        <IconButton key='edit-save' aria-label="Save" onClick={saveEdits}>
          <Check />
        </IconButton>
      );
    }
    else {
      extras.push(
        <IconButton key='edit-description' aria-label="Edit Description" onClick={activateEdit}>
          <Edit />
        </IconButton>
      );
    }
  }

  return (
    <div className={classes.about}>
      <div className={classes.headerWrap}>
        <Typography variant="h6" className={classes.headerTitle}>Description</Typography>
        <div className={classes.extras}>
          {extras}
        </div>
      </div>
      {editState.active ? (
          <div className={classes.editForm}>
            <Typography variant="body1" color="error">
              {editState.error.message}
            </Typography>
            <TextField id='description' label='Description' type='text' required={true}
              className={classes.textField} margin='normal' multiline
              onChange={handleEditChange}
              disabled={editState.loading}
              value={newDescription || ''}
              autoFocus/>
          </div>
        ) : (
          <Typography variant="body1">{description || 'No description'}</Typography>
        )
      }
    </div>
  );
}
