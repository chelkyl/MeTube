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

const useStyles = makeStyles(theme => ({
}));
export default function AboutPage(props) {
  let [description, setDescription] = useState('');
useEffect(() => {
  Api.request('get',`/users/${props.user_id}` )
    .then(res =>{
      console.log('res',res, res.data);
      if(res.data.response) {
        setDescription(res.data.response.channel_description)
      }
    }).catch(err => {
      console.log('error',err)
    })
})
return (<div>actually there {description}</div>);

}
