import React, { Component } from 'react';
import classNames from 'classnames';
// import logo from './logo.svg';
import Masthead from './components/masthead';
import Sidebar from './components/sidebar';
import HomePage from './pages/home';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import BrowsePage from './pages/browse';
import ViewPage from './pages/view';
import Error404Page from './pages/pageNotFound';
import {
  Route,
  Switch
} from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';

const drawerWidth = 240;

const styles = theme => ({
  root: {
    display: 'block'
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0
    }
  },
  content: {
    flexGrow: 1,
    flexShrink: 0,
    padding: theme.spacing.unit * 3,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginLeft: 0,
    textAlign: 'center'
  },
  contentShift: {
    [theme.breakpoints.up('sm')]: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen
      }),
      marginLeft: drawerWidth
    }
  },
  toolbar: theme.mixins.toolbar
});

// TODO: better authentication, see https://stackoverflow.com/questions/49819183/react-what-is-the-best-way-to-handle-authenticated-logged-in-state
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sidebarOpen: false,
      loggedIn: false
    }
  }

  toggleDrawer = (open) => {
    if (open === true || open === false) {
      this.setState({sidebarOpen: open});
    }
    else {
      this.setState({sidebarOpen: !this.state.sidebarOpen});
    }
  }

  render() {
    const {sidebarOpen, loggedIn} = this.state;
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <Masthead isLoggedIn={loggedIn} onToggleDrawer={this.toggleDrawer}/>
        <Sidebar className={classes.drawer} isOpen={sidebarOpen}
          isLoggedIn={loggedIn} onToggleDrawer={this.toggleDrawer}/>
        <main className={classNames(classes.content, {
              [classes.contentShift]: sidebarOpen
            })}>
          <Switch>
            <Route path='/' exact component={HomePage}/>
            <Route path='/login' component={LoginPage}/>
            <Route path='/register' component={RegisterPage}/>
            <Route path='/browse' exact component={BrowsePage}/>
            <Route path='/view/:id' component={ViewPage}/>
            <Route component={Error404Page}/>
          </Switch>
        </main>
      </div>
    );
  }
}

export default withStyles(styles)(App);
