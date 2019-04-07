import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Typography,
  AppBar,
  Tabs,
  Tab
} from '@material-ui/core';
import {
  Tune
} from '@material-ui/icons';
import axios from 'axios';
import Api from '../apiclient';
import AboutPage from './about';

const useStyles = makeStyles(theme => ({
  tabbedpage: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
}));
function TabContainer(props) {
  return (
    <Typography component="div" style={{ padding: 8 * 3 }}>
      {props.children}
    </Typography>
  );
}
export default function UserPage(props) {
  const classes = useStyles();
  let cancel = false;


/*


  useEffect(() => {
    console.log('setting query');
    const newParams = new URLSearchParams(props.location.search);
    setQuery(newParams.get('q') || '');
    setInputs({...inputs, 'type': newParams.get('type') || ''});
  }, [props]);

  let getRankedResults = (results) => {
    return results;
  };
*/
const [value, setValue] = React.useState(0);

 function handleChange(event, newValue) {
   setValue(newValue);
 }



  return (
  <div>
    <div className={classes.header}>
      <Typography variant='h5'>bob</Typography>
      <Typography variant='body1'>three</Typography>
    </div>
    <div className={classes.tabbedpage}>
      <AppBar position="static">
        <Tabs value={value} onChange={handleChange}>
          <Tab label="About" />
          <Tab label="Videos" />
          <Tab label="Playlist" />
        </Tabs>
      </AppBar>
      {value === 0 && <TabContainer> <AboutPage user_id={2}/> </TabContainer>}
      {value === 1 && <TabContainer>Item Two</TabContainer>}
      {value === 2 && <TabContainer>Item Three</TabContainer>}
    </div>
  </div>
  );
}
