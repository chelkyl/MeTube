import React, {useState, useEffect} from 'react';
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
import { useAuthCtx } from '../authentication';
import { Redirect } from 'react-router-dom';

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
  buttonWrapper: {
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
  }
}));

export default function RegisterPage(props) {
  const classes = useStyles();
  const params = new URLSearchParams(props.location.search);
  let redirectPath = params.get('redirect') || '';
  const [isLoggedIn, authActionDispatch, errorState,, regState] = useAuthCtx();
  const [redirect, setRedirect] = useState(false);
  const [inputs, setInputs] = useState({email:'', username:'', password:''});
  let timer = null;

  let handleChange = (key) => (e) => {
    setInputs({ ...inputs, [key]: e.currentTarget.value });
  }

  useEffect(() => {
    if(isLoggedIn) {
      setRedirect(true);
    }
  }, []);

  useEffect(() => {
    if(regState.success) {
      timer = setTimeout(() => {
        setRedirect(true);
      }, 800);
    }

    return () => {
      clearTimeout(timer);
    }
  }, [regState]);

  let handleSubmit = (e) => {
    e.preventDefault();
    if(!regState.loading) {
      authActionDispatch({
        type: 'register',
        credentials: inputs
      });
    }
  }

  const { loading, success } = regState;

  return (
    <div className={classes.container}>
      <Paper className={classes.root} elevation={1}>
        <Typography variant="h5">
          Register
        </Typography>
        <Typography variant="body1" color="error">
          {errorState.message}
        </Typography>
        <form className={classes.form} onSubmit={handleSubmit}>
          <TextField id='email' label='Email' type='email' required={true}
            className={classes.textField} margin='normal' variant='outlined'
            onChange={handleChange('email')}
            disabled={loading}
            autoFocus
            error={errorState.emailError}
            helperText={errorState.emailErrorMsg}/>
          <TextField id='username' label='Username' type='text' required={true}
            className={classes.textField} margin='normal' variant='outlined'
            onChange={handleChange('username')}
            disabled={loading}
            error={errorState.usernameError}
            helperText={errorState.usernameErrorMsg}/>
          <TextField id='password' label='Password' type='password' required={true}
            className={classes.textField} margin='normal' variant='outlined' autoComplete='on'
            onChange={handleChange('password')}
            disabled={loading}
            error={errorState.passwordError}
            helperText={errorState.passwordErrorMsg}/>
          <div className={classes.buttonWrapper}>
            <Button type='submit'
              size='large'
              color='primary'
              className={classNames({
                [classes.buttonSuccess]: success
              })}
              variant='contained'
              disabled={loading}>
              Register
            </Button>
            {loading && <CircularProgress size={24} className={classes.buttonProgress}/>}
          </div>
        </form>
        {redirect && <Redirect to={`/${redirectPath}`}/>}
      </Paper>
    </div>
  );
}
