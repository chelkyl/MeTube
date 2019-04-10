import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  AppBar,
  Typography,
  Tabs,
  Tab
} from '@material-ui/core';
import {
  
} from '@material-ui/icons';
import Api from '../apiclient';

const useStyles = makeStyles(theme => ({
  container: {

  }
}));


export default function UploadPage(props) {
  const classes = useStyles();
  

  return (
    <div className={classes.container}>
      
      {/* {redirect && <Redirect to={`/${redirectPath}`}/>} */}
    </div>
  );
}
