import React, {useState, useEffect} from 'react';
import {makeStyles} from '@material-ui/styles';
import {

} from '@material-ui/core';
import {
  Sort
} from '@material-ui/icons';
import Api from '../apiclient';
import ResultItemCard from '../components/resultItemCard';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  filesGrid: {

  }
}));

//TODO: goes in channel page, shows all files uploaded by channel's user (not current logged in user) with some sort (maybe also folder/group organization) controls
