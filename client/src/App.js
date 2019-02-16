import React, { Component } from 'react';
// import logo from './logo.svg';
import Masthead from './components/masthead';
import Sidebar from './components/sidebar';
import Home from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import PageNotFound from './pages/pageNotFound';
import {
  BrowserRouter as Router,
  Route,
  Switch
} from 'react-router-dom';
import './App.css';

// TODO: better authentication, see https://stackoverflow.com/questions/49819183/react-what-is-the-best-way-to-handle-authenticated-logged-in-state
class App extends Component {
  constructor(props) {
    super(props);
    this.toggleDrawer = this.toggleDrawer.bind(this);
    this.state = {
      sidebarOpen: false,
      loggedIn: false
    }
  }

  toggleDrawer = (open) => {
    this.setState({sidebarOpen: open});
  }

  render() {
    const {sidebarOpen, loggedIn} = this.state;
    return (
      <div className="App">
        <Router>
          <>
            <Masthead isLoggedIn={loggedIn} onToggleDrawer={this.toggleDrawer}/>
            <Sidebar open={sidebarOpen} onToggleDrawer={this.toggleDrawer}/>
            <Switch>
              <Route path='/' exact component={Home}/>
              <Route path='/login' component={Login}/>
              <Route path='/register' component={Register}/>
              <Route component={PageNotFound}/>
            </Switch>
          </>
        </Router>
      </div>
    );
  }
}

export default App;
