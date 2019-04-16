import React, {useState, useEffect, useReducer} from 'react';
import classNames from 'classnames';
import { makeStyles } from '@material-ui/styles';
import { useAuthCtx } from '../authentication';
import { getAuthenticatedUserID } from '../authutils';

import {
  TextField,
  Typography,
  Button,
  CircularProgress,
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
  input:{
      position:'center'
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
  const [file, setFilesInfo] = useState([]);

  const [inputs, setInputs] = useState({file_type:'', user_id:'', title:'', description:'', keywords:'', categories:''});

    let handleFile = (e) => {
      const newFile = e[0];
      console.log(newFile);
      setFilesInfo(newFile);
      console.log(file);
      const reader = new FileReader();
      reader.readAsDataURL(e[0]);
      reqStateDispatch('submit');

      reader.onloadend = () => {
      reqStateDispatch('success');

      setInputs({...inputs, file_type:newFile.type});
    }
    };


    let handleChange = (key) => (e) => {
    setInputs({ ...inputs, [key]: e.currentTarget.value });
  };

  //TODO: I recommend VSCode for linting and code formatting, it also has useful extensions

  //console.log(file);
    useEffect(() => {
      if(isLoggedIn) {

      }

      return () => {
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
        loading: true,
        success: false
      }
    case 'success':
      return {
        loading: false,
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

      let handleSubmit = (e) => {
        const uID = getAuthenticatedUserID();//append userID
        setInputs({...inputs, user_id: uID});

        let data = new FormData();//append file to form data
        data.append('file',file);

        for (let key in inputs){//append the rest of inputs to form data
          data.append(key,inputs[key]);
        }
        console.log(data);

        if (!Api.request('post', 'files/upload', data, {}, true))//send request
        reqStateDispatch('error');

  }

  const { loading, success } = reqState;


  return (
    <div className={classes.container}>
      <Typography variant="h5">
        Upload File Here
      </Typography>
      <form className={classes.form} onSubmit={handleSubmit}>
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
        <div className={classes.container}>
          <input type='file'
            content-type='multipart/FormData'
            accept='image/*,video/*,audio/*'
            onChange={e => handleFile(e.currentTarget.files)}
          />
          </div>
        <div className={classes.buttonWrapper}>

          <Button
            size='large'
            color='primary'
            onClick={()=>handleSubmit()}
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
