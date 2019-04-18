import React, {useState, useEffect, useReducer} from 'react';
import classNames from 'classnames';
import {
  blue,
  green
} from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/styles';
import {
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress
} from '@material-ui/core';
import Api from '../apiclient';
import { useAuthCtx } from '../authentication';
import {getAuthenticatedUserID} from '../authutils';
import { Link } from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  root: {
    display: 'block',
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
  }
}));

const initialReqState = {
  auth: false,
  edit: false,
  success: false
};
const reqStateReducer = (state, action) => {
  switch (action) {
    case 'submit':
      return {
        auth: true,
        edit: false,
        success: false
      };
    case 'next':
      return {
        auth: false,
        edit: true,
        success: false
      }
    case 'authSuccess':
      return {
        auth: false,
        edit: false,
        success: true
      };
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
  }, [reqState]);

  let handleSubmit = (e) => {
    e.preventDefault();
    if(!reqState.loading) {
      reqStateDispatch('submit');
    }
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
      </Paper>
    </div>
  );
}
