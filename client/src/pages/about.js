import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import {

} from '@material-ui/core';
import {
  
} from '@material-ui/icons';
import Api from '../apiclient';

const useStyles = makeStyles(theme => ({
  about: {
    textAlign: 'left'
  }
}));

export default function AboutPage(props) {
  const classes = useStyles();
  let [description, setDescription] = useState('');

  useEffect(() => {
    Api.request('get',`/users/${props.user_id}` )
      .then(res =>{
        console.log('res',res, res.data);
        if(res.data.response) {
          setDescription(res.data.response.channel_description)
        }
      })
      .catch(err => {
        let tag = 'about';
        // got response from server
        if(err.response) {
          console.log(tag,err.response);
        }
        // request sent but no response
        else if(err.request) {
          console.log(tag,err.request);
        }
        // catch all
        else {
          console.log(tag,err);
        }
      });
  });

  return (
    <div className={classes.about}>actually there {description}</div>
  );
}
