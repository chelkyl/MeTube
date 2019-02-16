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

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {
      invalidLogin: false,
      successLogin: false
    };
  }

  handleChange = (key) => (e) => {
    this.setState({[key]:e.currentTarget.value});
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const { username, password } = this.state;
    axios.post('http://localhost:5000/login', {username, password})
      .then(res => {
        console.log(res);
        this.setState({invalidLogin:false})
        this.setState({successLogin:true})
      })
      .catch(err => {
        this.setState({invalidLogin:true})
      });
  }

  render() {
    const {classes} = this.props;
    const { invalidLogin, successLogin } = this.state;

    return (
      <div className={classes.container}>
        <Paper className={classes.root} elevation={1}>
          <Typography variant="h5">
            Login
          </Typography>
          {invalidLogin ? (
              <Typography variant="body1" color="error">
                Invalid credentials
              </Typography>
            ) : null
          }
          {successLogin ? (
              <Redirect to="/"/>
            ) : null
          }
          <form className={classes.form} onSubmit={e => this.handleSubmit(e)}>
            <TextField id='username' label='Username' type='text' required={true}
              className={classes.textField} margin='normal' variant='outlined'
              onChange={this.handleChange('username')}/>
            <TextField id='password' label='Password' type='password' required={true}
              className={classes.textField} margin='normal' variant='outlined' autoComplete='on'
              onChange={this.handleChange('password')}/>
            <Button type='submit' size='large' color='primary' className={classes.button} variant='contained'>
              Log In
            </Button>
          </form>
        </Paper>
      </div>
    );
  }
}

Login.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Login);
