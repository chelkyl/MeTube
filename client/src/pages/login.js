import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress
} from '@material-ui/core';
import {
  blue,
  green
} from '@material-ui/core/colors';
import { withStyles } from '@material-ui/core/styles';
import axios from 'axios';
import { Redirect } from 'react-router-dom';

const styles = theme => ({
  container: {
    display: 'flex',
    justifyContent: 'center'
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    // justifyContent: 'center',
    // alignItems: 'center',
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
});

class LoginPage extends React.Component {
  state = {
    statusMessage: '',
    loading: false,
    success: false,
    redirect: false
  };

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  // TODO: make smaller components for inputs to reduce redraw?
  handleChange = (key) => (e) => {
    this.setState({[key]:e.currentTarget.value});
  }
  //FIXME: this attempt with TextInput doesn't work
  // handleChange = (key,value) => {
  //   this.setState({[key]:value});
  // }

  validateLogin = (creds) => {
    axios.post('http://localhost:5000/login', creds)
      .then(res => {
        console.log(res);
        this.setState(
          {
            loading: false,
            success: true
          },
          () => {
            this.timer = setTimeout(() => {
              this.setState({redirect: true})
            }, 1500);
          }
        );
      })
      .catch(err => {
        let msg = '';
        // got response from server
        if(err.response) {
          console.log(err.response);
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
          console.log(err.request);
          msg = err.message;
        }
        // catch all
        else {
          console.log(err);
          msg = 'Sorry, unknown error';
        }
        this.setState({
          statusMessage: msg,
          loading: false
        });
      });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    if(!this.state.loading) {
      const { username, password } = this.state;
      this.setState(
        {
          statusMessage:'',
          loading: true
        },
        () => this.validateLogin({username,password})
      );
    }
  }

  render() {
    const {classes} = this.props;
    const { statusMessage, loading, success, redirect } = this.state;
    const successButtonClass = classNames({
      [classes.buttonSuccess]: success
    });
    const loadingButton = <CircularProgress size={24} className={classes.buttonProgress}/>

    return (
      <div className={classes.container}>
        <Paper className={classes.root} elevation={1}>
          <Typography variant="h5">
            Login
          </Typography>
          <Typography variant="body1" color="error">
            {statusMessage}
          </Typography>
          <form className={classes.form} onSubmit={e => this.handleSubmit(e)}>
            {/* <TextInput id='username' label='Username' type='text' required={true}
              margin='normal' variant='outlined' handleChange={this.handleChange}/>
            <TextInput id='password' label='Password' type='password' required={true}
              margin='normal' variant='outlined' handleChange={this.handleChange}/> */}
            <TextField id='username' label='Username' type='text' required={true}
              className={classes.textField} margin='normal' variant='outlined'
              onChange={this.handleChange('username')}
              disabled={loading}
              autoFocus/>
            <TextField id='password' label='Password' type='password' required={true}
              className={classes.textField} margin='normal' variant='outlined' autoComplete='on'
              onChange={this.handleChange('password')}
              disabled={loading}/>
            <div className={classes.buttonWrapper}>
              <Button type='submit'
                size='large'
                color='primary'
                className={successButtonClass}
                variant='contained'
                disabled={loading}>
                Log In
              </Button>
              {loading && loadingButton}
            </div>
          </form>
          {redirect ? (
              <Redirect to="/"/>
            ) : null
          }
        </Paper>
      </div>
    );
  }
}

LoginPage.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(LoginPage);
