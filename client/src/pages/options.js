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
import { useAuthCtx } from '../authentication';
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
  auth: false,
  edit: false,
  success: false,
  warn: false,
  delete: false,
  deletesuccess: false
};
const reqStateReducer = (state, action) => {
  switch (action) {
    case 'submit':
      return {...initialReqState, auth: true};
    case 'next':
      return {...initialReqState, edit: true};
    case 'authSuccess':
      return {...initialReqState, success: true};
    case 'deletebutton':
      return {...initialReqState, warn: true};
    case 'deleteconfirm':
      return {...initialReqState, delete: true};
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
  const [isLoggedIn] = useAuthCtx();
  const userID = getAuthenticatedUserID();
  const [reqState, reqStateDispatch] = useReducer(reqStateReducer, initialReqState);
  const [errorMessage, setErrorMessage] = useState('');
  const [inputs, setInputs] = useState({});
  const [deleteDialogOpen,setDeleteDialogOpen] = useState(false);
  let cancel = false;

  let handleChange = (key) => (e) => {
    setInputs({ ...inputs, [key]: e.currentTarget.value });
  }

  useEffect(() => {
    if(!isLoggedIn) {
      props.history.push('/login?redirect=options');
    }
    return () => {
      cancel = true;
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if(reqState.auth) {
      let {username, oldPassword:password} = inputs;
      Api.request('get','/login',{username,password})
        .then(res => {
          if(!cancel) reqStateDispatch('next');
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
    else if(reqState.warn) {
      setDeleteDialogOpen(true);
    }
    else if(reqState.edit) {
      let {username, password, email} = inputs;
      Api.request('patch',`/users/${userID}`,{password,username,email},{},true)
        .then(res => {
          if(!cancel) reqStateDispatch('success');
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
    else if(reqState.delete) {
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
  }, [reqState]);

  let handleSubmit = (e) => {
    e.preventDefault();
    if(!reqState.loading) {
      reqStateDispatch('submit');
    }
  }
  let handleDeleteButton = (e) => {
    reqStateDispatch('deletebutton');
  }

  const { auth, edit, success } = reqState;
  const loading = auth || edit;

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
          <TextField id='oldPassword' label='Current Password' type='password' required={true}
            className={classes.textField} margin='normal' variant='outlined' autoComplete='on'
            onChange={handleChange('oldPassword')}
            disabled={loading}
            autoFocus/>
          <TextField id='password' label='New Password' type='password' required={true}
            className={classes.textField} margin='normal' variant='outlined' autoComplete='on'
            onChange={handleChange('password')}
            disabled={loading}/>
          <TextField id='username' label='New Username' type='text' required={true}
            className={classes.textField} margin='normal' variant='outlined'
            onChange={handleChange('username')}
            disabled={loading}/>
          <TextField id='email' label='New Email' type='text' required={true}
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
                  [classes.buttonSuccess]: success
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
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" autoFocus>Cancel</Button>
          <Button onClick={handleDeleteButton} className={classes.deleteButton}>Delete</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={reqState.deletesuccess} onClose={() => props.history.push('/')}
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
