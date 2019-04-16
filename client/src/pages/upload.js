import React, {useState, useEffect, useReducer} from 'react';
import classNames from 'classnames';
import { makeStyles } from '@material-ui/styles';
import { useAuthCtx } from '../authentication';
import { getAuthenticatedUserID } from '../authutils';
import { basicRequestCatch } from '../utils';

import {
  AppBar,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Tabs,
  Tab
} from '@material-ui/core';
import {
  blue,
  green
} from '@material-ui/core/colors';
import Api from '../apiclient';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
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

}));


export default function UploadPage(props) {
  const classes = useStyles();
  //FIXME: good start but should not be using useAuthCtx for keeping track of request state; regState is used for registration state
  //TODO: look at regState and its associated objects in authentication for an example of writing a reducer for handling state
  const [isLoggedIn] = useAuthCtx();
  let userID = getAuthenticatedUserID();
  let cancel = false;
  const [file, setFilesInfo] = useState([]);

  const [inputs, setInputs] = useState({file:'', user_id:'', title:'', description:'', keywords:'', categories:''});
  let handleFile = (e) => {
    const newfile = e;
    inputs.file = newfile;
    setFilesInfo(newfile);

    console.log(file);

  }

    let handleChange = (key) => (e) => {
    setInputs({ ...inputs, [key]: e.currentTarget.value });
  }

  //TODO: I recommend VSCode for linting and code formatting, it also has useful extensions

  //console.log(file);
    useEffect(() => {
      if(uploading && isLoggedIn) {

        //Api.request('post','files/upload',{inputs,user_id:{userID}},{},true);
        uploading = false;
      }

      return () => {
        cancel = true;
      };
    }, []);



    const initialReqState = {
      loading: false,
      success: false
    };
  const reqStateReducer = (state, action) => {
    switch(action) {
      case 'submit':
        return {
          uploading: true,
          success: false
        }
      case 'success':
        return {
          uploading: false,
          success: true
        }
      case 'error':
      case 'initial':
        return initialReqState;
      default:
        return state;
    }
  };
  const [reqState, reqStateDispatch] = useReducer(reqStateReducer,initialReqState);

  let uploading = false;

  let handleSubmit = (e) => {
    e.preventDefault();
    console.log(file);
    inputs.user_id = getAuthenticatedUserID();
    inputs.file_type = file.type;
    let data = new FormData();
    for(let key in inputs) {
      data.append(key, inputs[key]);
    }
    Api.request('post','files/upload',data,{},true);
    console.log(inputs);
    uploading = true;

  }
  const { loading, success } = reqState;


  return (
    <div className={classes.container}>
      <Typography variant="h5">
        Upload File Here
      </Typography>
      <form id="upload-form" className={classes.form} onSubmit={handleSubmit}>
        <TextField id='title' label='Title' type='text' required={true}
          className={classes.textField} margin='normal' variant='outlined'
          onChange={handleChange('title')}
          disabled={loading}
          autoFocus

        />
        <TextField id='description' label='Description' type='text' required={true}
          className={classes.textField} margin='normal' variant='outlined'
          onChange={handleChange('description')}
          disabled={loading}
        />
        <TextField id='keywords' label='Keywords' type='text' required={true}
          className={classes.textField} margin='normal' variant='outlined' autoComplete='on'
          onChange={handleChange('keywords')}
          disabled={loading}
        />
        <TextField id='categories' label='categories' type='text' required={true}
          className={classes.textField} margin='normal' variant='outlined' autoComplete='on'
          onChange={handleChange('categories')}
          disabled={loading}
        />
        <input type='file'
          className={classes.container}
          accept='image/*,video/*,audio/*'
          onChange={e => handleFile(e.currentTarget.files[0])}
          ></input>
        <div className={classes.buttonWrapper}>

          <Button type='submit'
            size='large'
            color='primary'
            //type='submit'
            className={classNames({
              [classes.buttonSuccess]: success
            })}
            variant='contained'
            disabled={loading}
            >
            Upload
          </Button>
          {loading && <CircularProgress size={24} className={classes.buttonProgress}/>}


        </div>
      </form>
      {/* {redirect && <Redirect to={`/${redirectPath}`}/>} */}
    </div>
  );
}
