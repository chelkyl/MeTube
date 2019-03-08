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
import { ApiClient } from '../apiclient';
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

class RegisterPage extends React.Component {
  state = {
    statusMessage: '',
    loading: false,
    success: false,
    redirect: false
  };

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  // TODO: validate inputs
  handleChange = (key) => (e) => {
    this.setState({[key]:e.currentTarget.value});
    this.setState({[key+'Error']:false});
    this.setState({[key+'ErrorMsg']:''});
  }

  validateRegister = (inputs) => {
    ApiClient.post('/users', inputs)
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
          if (status === 400) {
            let {error} = err.response.data;
            if(error['not unique']) {
              error['not unique'].forEach((tag, i, arr) => {
                this.setState({[tag+'Error']:true});
                this.setState({[tag+'ErrorMsg']:'Must be unique'});
              });
            }
            else msg = err.error;
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
      const { email, username, password } = this.state;
      this.setState(
        {
          statusMessage:'',
          loading: true
        },
        () => this.validateRegister({email,username,password})
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
            Register
          </Typography>
          <Typography variant="body1" color="error">
            {statusMessage}
          </Typography>
          <form className={classes.form} onSubmit={e => this.handleSubmit(e)}>
            <TextField id='email' label='Email' type='email' required={true}
              className={classes.textField} margin='normal' variant='outlined'
              onChange={this.handleChange('email')}
              disabled={loading}
              autoFocus
              error={this.state.emailError}
              helperText={this.state.emailErrorMsg}/>
            <TextField id='username' label='Username' type='text' required={true}
              className={classes.textField} margin='normal' variant='outlined'
              onChange={this.handleChange('username')}
              disabled={loading}
              error={this.state.usernameError}
              helperText={this.state.usernameErrorMsg}/>
            <TextField id='password' label='Password' type='password' required={true}
              className={classes.textField} margin='normal' variant='outlined' autoComplete='on'
              onChange={this.handleChange('password')}
              disabled={loading}
              error={this.state.passwordError}
              helperText={this.state.passwordErrorMsg}/>
            <div className={classes.buttonWrapper}>
              <Button type='submit'
                size='large'
                color='primary'
                className={successButtonClass}
                variant='contained'
                disabled={loading}>
                Register
              </Button>
              {loading && loadingButton}
            </div>
          </form>
          {redirect ? (
              <Redirect to="/login"/>
            ) : null
          }
        </Paper>
      </div>
    );
  }
}

RegisterPage.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(RegisterPage);
