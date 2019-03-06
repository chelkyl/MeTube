import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  TextField,
  Button
} from '@material-ui/core';
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
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit
  },
  button: {
    margin: theme.spacing.unit
  }
});

class RegisterPage extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {
      statusMessage: '',
      successRegister: false
    };
  }

  // TODO: validate inputs
  handleChange = (key) => (e) => {
    this.setState({[key]:e.currentTarget.value});
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const { email, username, password } = this.state;
    axios.post('http://localhost:5000/users', {email, username, password})
      .then(res => {
        console.log(res);
        this.setState({successRegister:true});
      })
      .catch(err => {
        if(err.response) {
          console.log(err.response);
          const { status } = err.response;
          if (status >= 500 && status < 600) {
            this.setState({statusMessage:`Server error ${status}, please contact the admins`});
          }
          else {
            this.setState({statusMessage:`Sorry, unknown error ${status}`});
          }
        }
        else if(err.request) {
          console.log(err.request);
          this.setState({statusMessage:err.message});
        }
        else {
          console.log(err);
          this.setState({statusMessage:'Sorry, unknown error'});
        }
      });
  }

  render() {
    const {classes} = this.props;
    const { statusMessage, successRegister } = this.state;

    return (
      <div className={classes.container}>
        <Paper className={classes.root} elevation={1}>
          <Typography variant="h5" component="h3">
            Register
          </Typography>
          <Typography variant="body1" color="error">
            {statusMessage}
          </Typography>
          <form className={classes.form} onSubmit={e => this.handleSubmit(e)}>
            <TextField id='email' label='Email' type='email' required={true}
              className={classes.textField} margin='normal' variant='outlined'
              onChange={this.handleChange('email')}
              autoFocus/>
            <TextField id='username' label='Username' type='text' required={true}
              className={classes.textField} margin='normal' variant='outlined'
              onChange={this.handleChange('username')}/>
            <TextField id='password' label='Password' type='password' required={true}
              className={classes.textField} margin='normal' variant='outlined' autoComplete='on'
              onChange={this.handleChange('password')}/>
            <Button type='submit' size='large' color='primary' className={classes.button} variant='contained'>
              Register
            </Button>
          </form>
          {successRegister ? (
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
