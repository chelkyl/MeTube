import React, {useState, useEffect, useReducer} from 'react';
import classNames from 'classnames';
import {
  blue,
  green,
  red
} from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/styles';
import {
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@material-ui/core';
import {
  ExpandMore
} from '@material-ui/icons';
import Api from '../apiclient';
import { useAuthCtx, authenticate } from '../authentication';
import {getAuthenticatedUserID} from '../authutils';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttons: {
    display: 'flex'
  },
  buttonWrapper: {
    display: 'flex',
    alignItems: 'center',
    margin: theme.spacing.unit,
    position: 'relative'
  },
  buttonSuccess: {
    backgroundColor: green[500],
    '&:hover': {
      backgroundColor: green[700]
    }
  },
  buttonProgress: {
    color: blue[500],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12
  },
  cancelLink: {
    textDecoration: 'none',
    marginTop: theme.spacing.unit * 2
  },
  etcOptsHeading: {

  },
  deleteButton: {
    backgroundColor: red[700],
    '&:hover': {
      backgroundColor: red[900]
    }
  }
}));

const initialReqState = {
  edit: false,
  editsuccess: false,
  authsuccess: false,
  warn: false,
  deleteloading: false,
  deletesuccess: false
};
const reqStateReducer = (state, action) => {
  switch (action) {
    case 'submit':
      return {...initialReqState, edit: true};
    case 'editsuccess':
      return {...initialReqState, editsuccess: true};
    case 'authsuccess':
      return {...initialReqState, authsuccess: true};
    case 'deletebutton':
      return {...initialReqState, warn: true};
    case 'deleteconfirm':
      return {...initialReqState, deleteloading: true};
    case 'deletesuccess':
      return {...initialReqState, deletesuccess: true};
    case 'deletecancel':
    case 'error':
    case 'initial':
      return initialReqState;
    default:
      return state;
  }
};

export default function OptionsPage(props) {
  const classes = useStyles();
  const [isLoggedIn,authActionDispatch] = useAuthCtx();
  const userID = getAuthenticatedUserID();
  const [reqState, reqStateDispatch] = useReducer(reqStateReducer, initialReqState);
  const [errorMessage, setErrorMessage] = useState('');
  const [inputs, setInputs] = useState({});
  const [deleteDialogOpen,setDeleteDialogOpen] = useState(false);
  const [deleteSuccessDialogOpen,setDeleteSuccessDialogOpen] = useState(false);
  let cancel = false;

  let handleChange = (key) => (e) => {
    setInputs({ ...inputs, [key]: e.currentTarget.value });
  }

  useEffect(() => {
    if(!isLoggedIn && !reqState.deletesuccess) {
      props.history.push('/login?redirect=options');
    }
    return () => {
      cancel = true;
    }
  }, [isLoggedIn]);

  let try_auth = async () => {
    try {
      let {username, password} = inputs;
      let response = await authenticate({username,password});
      if(response.error) {
        reqStateDispatch('error');
        setErrorMessage(response.error);
      }
      else {
        reqStateDispatch('authsuccess');
        setErrorMessage('');
      }
    }
    catch(err) {
      if(!cancel) return;
      let msg = '';
      // got response from server
      if(err.response) {
        const { status } = err.response;
        if(status === 401) {
          msg = 'Invalid login';
        }
        else if (status >= 500 && status < 600) {
          msg = `Server error ${status}, please contact the admins`;
        }
        else {
          msg = `Sorry, unknown error ${status}`;
        }
      }
      // request sent but no response
      else if(err.request) {
        msg = err.message;
      }
      // catch all
      else {
        msg = 'Sorry, unknown error';
      }
      reqStateDispatch('error');
      setErrorMessage(msg);
    }
  }

  useEffect(() => {
    let {edit, editsuccess, authsuccess, warn, deleteloading, deletesuccess} = reqState;
    if(edit) {
      let {oldUsername, oldPassword, username, password, email} = inputs;
      Api.request('patch',`/users/${userID}`,{password,username,email},{auth:{'username':oldUsername,'password':oldPassword}})
        .then(res => {
          console.log('patch',res,cancel);
          if(cancel) return;
          reqStateDispatch('editsuccess');
        })
        .catch(err => {
          if(cancel) return;
          let msg = '';
          // got response from server
          if(err.response) {
            const { status } = err.response;
            if(status === 401) {
              msg = 'Invalid login';
            }
            else if (status >= 500 && status < 600) {
              msg = `Server error ${status}, please contact the admins`;
            }
            else {
              msg = `Sorry, unknown error ${status}`;
            }
          }
          // request sent but no response
          else if(err.request) {
            msg = err.message;
          }
          // catch all
          else {
            msg = 'Sorry, unknown error';
          }
          setErrorMessage(msg);
          reqStateDispatch('error');
        });
    }
    else if(editsuccess) {
      try_auth();
    }
    else if(authsuccess) {

    }
    else if(warn) {
      setDeleteDialogOpen(true);
    }
    else if(deleteloading) {
      Api.request('delete',`/users/${userID}`,{},{},true)
        .then(res => {
          if(!cancel) reqStateDispatch('deletesuccess');
        })
        .catch(err => {
          if(cancel) return;
          let msg = '';
          // got response from server
          if(err.response) {
            const { status } = err.response;
            if(status === 401) {
              msg = 'Invalid login';
            }
            else if (status >= 500 && status < 600) {
              msg = `Server error ${status}, please contact the admins`;
            }
            else {
              msg = `Sorry, unknown error ${status}`;
            }
          }
          // request sent but no response
          else if(err.request) {
            msg = err.message;
          }
          // catch all
          else {
            msg = 'Sorry, unknown error';
          }
          setErrorMessage(msg);
          reqStateDispatch('error');
        });
    }
    else if(deletesuccess) {
      console.log('deletesuccess');
      setDeleteDialogOpen(false);
      authActionDispatch({type:'logout'});
      setDeleteSuccessDialogOpen(true);
    }
  }, [reqState]);

  let handleSubmit = (e) => {
    e.preventDefault();
    let {username, password, email} = inputs;
    if(username === '' && password === '' && email === '') {
      setErrorMessage('Nothing to change');
    }
    else if(!reqState.loading) {
      reqStateDispatch('submit');
    }
  }
  let handleDeleteButton = (e) => {
    reqStateDispatch('deletebutton');
  }
  let handleDeleteConfirmButton = (e) => {
    reqStateDispatch('deleteconfirm');
  }

  const { edit, authsuccess, deleteloading } = reqState;
  const loading = deleteloading || edit;

  return (
    <div className={classes.container}>
      <Paper className={classes.root} elevation={1}>
        <Typography variant="h5">
          Options
        </Typography>
        <Typography variant="body1" color="error">
          {errorMessage}
        </Typography>
        <form className={classes.form} onSubmit={handleSubmit}>
          <TextField id='oldUsername' label='Current Username' type='text' required={true}
            className={classes.textField} margin='normal' variant='outlined'
            onChange={handleChange('oldUsername')}
            disabled={loading}
            autoFocus/>
          <TextField id='oldPassword' label='Current Password' type='password' required={true}
            className={classes.textField} margin='normal' variant='outlined' autoComplete='on'
            onChange={handleChange('oldPassword')}
            disabled={loading}/>
          <TextField id='password' label='New Password' type='password'
            className={classes.textField} margin='normal' variant='outlined' autoComplete='on'
            onChange={handleChange('password')}
            disabled={loading}/>
          <TextField id='username' label='New Username' type='text'
            className={classes.textField} margin='normal' variant='outlined'
            onChange={handleChange('username')}
            disabled={loading}/>
          <TextField id='email' label='New Email' type='text'
            className={classes.textField} margin='normal' variant='outlined' autoComplete='on'
            onChange={handleChange('email')}
            disabled={loading}/>
          <div className={classes.buttons}>
            <div className={classes.buttonWrapper}>
              <Button type='button'
                size='medium'
                color='primary'
                variant='text'
                onClick={() => props.history.push(`/channel/${userID}`)}
                disabled={loading}>
                Cancel
              </Button>
            </div>
            <div className={classes.buttonWrapper}>
              <Button type='submit'
                size='large'
                color='primary'
                className={classNames({
                  [classes.buttonSuccess]: authsuccess
                })}
                variant='contained'
                disabled={loading}>
                Save
              </Button>
              {loading && <CircularProgress size={24} className={classes.buttonProgress}/>}
            </div>
          </div>
        </form>
        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMore />}>
            <Typography className={classes.etcOptsHeading}>More Options</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <div className={classes.buttonWrapper}>
              <Button type='button'
                size='large'
                className={classes.deleteButton}
                variant='contained'
                onClick={handleDeleteButton}
                disabled={loading}>
                Delete Account
              </Button>
            </div>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </Paper>
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="deleteconfirm-dialog-title" aria-describedby='deleteconfirm-dialog-desc'>
        <DialogTitle id="deleteconfirm-dialog-title">Confirm Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText id="deleteconfirm-dialog-description">
            Are you sure you want to delete your account?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary" autoFocus>Cancel</Button>
          <Button onClick={handleDeleteConfirmButton} className={classes.deleteButton}>Delete</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteSuccessDialogOpen} onClose={() => props.history.push('/')}
        aria-labelledby="delete-dialog-title" aria-describedby='delete-dialog-desc'>
        <DialogTitle id="delete-dialog-title">Account Deleted</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Your account has been deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => props.history.push('/')} color="primary" autoFocus>Back to home</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
