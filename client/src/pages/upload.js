import React, {useState, useEffect, useReducer} from 'react';
import classNames from 'classnames';
import { makeStyles } from '@material-ui/styles';
import {
  Paper,
  TextField,
  Typography,
  Button,
  CircularProgress,
} from '@material-ui/core';
import {
  blue,
  green
} from '@material-ui/core/colors';
import {
  CloudUpload, CloudDone
} from '@material-ui/icons';
import Api from '../apiclient';
import { useAuthCtx } from '../authentication';
import { getAuthenticatedUserID } from '../authutils';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  formWrapper: {
    minWidth: '80%'
  },
  form: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridGap: theme.spacing.unit * 2,
    padding: theme.spacing.unit * 2,
    [theme.breakpoints.down('xs')]: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr 1fr'
    }
  },
  fileUploadWrapper: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: theme.background,
    color: theme.primary,
    border: `4px dashed ${theme.primary}`,
    '&:hover': {
      backgroundColor: theme.secondary,
      color: theme.background,
      border: `4px dashed ${theme.accent}`
    }
  },
  fileUploadChildren: {
    pointerEvents: 'none'
  },
  fileDragOver: {
    backgroundColor: theme.secondary,
    color: theme.background,
    border: `4px dashed ${theme.accent}`
  },
  fileUploadIcon: {
    fontSize: '5em'
  },
  fileUpload: {
    visibility: 'hidden'
  },
  formTextFields: {
    display: 'flex',
    flexDirection: 'column'
  },
  errorMessage: {
    textTransform: 'capitalize'
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

export default function UploadPage(props) {
  const classes = useStyles();
  const [isLoggedIn] = useAuthCtx();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [reqState, reqStateDispatch] = useReducer(reqStateReducer,initialReqState);
  const [errorMessage, setErrorMessage] = useState(null);
  const [inputs, setInputs] = useState({file_type:'', user_id:'', title:'', description:'', keywords:'', categories:''});
  let timer = null;
  let cancel = false;

  let handleFile = (newFile) => {
    console.log('got file',newFile);
    if(newFile) {
      setFile(newFile);
      let {name:filename} = newFile;
      let basename = filename.slice(0,filename.lastIndexOf('.'));
      let {title} = inputs;
      setInputs({...inputs, file_type:newFile.type, title: title || basename});
      document.getElementById('title').select();
    }
  };
  let handleFileSelect = (e) => {
    handleFile(e.currentTarget.files[0]);
  };
  let handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if(e.dataTransfer.items) {
      let item = e.dataTransfer.items[0];
      if(item.kind === 'file') {
        console.log('items drag');
        document.getElementById('fileUpload').files = e.dataTransfer.files;
        handleFile(item.getAsFile());
      }
    }
    else if (e.dataTransfer.files) {
      console.log('files drag');
      document.getElementById('fileUpload').files = e.dataTransfer.files;
      handleFile(e.dataTransfer.files[0]);
    }
  };
  let handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  let handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  let handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  let handleChange = (key) => (e) => {
    setInputs({ ...inputs, [key]: e.currentTarget.value });
  };

  useEffect(() => {
    if(!isLoggedIn) {
      // redirect to login
      props.history.push('/login?redirect=upload');
    }

    return () => {
      cancel = true;
    }
  }, [isLoggedIn]);

  useEffect(() => {
    console.log('useeffect');
    if(reqState.success) {
      timer = setTimeout(() => {
        props.history.push(`/channel/${getAuthenticatedUserID()}/files`);
      }, 800);
    }
    else if(reqState.loading) {
      console.log('is loading')
      let data = new FormData();
      // append user id to form data
      data.append('user_id',getAuthenticatedUserID());
      // append file to form data
      data.append('file',file);
  
      // append the rest of inputs to form data
      for (let key in inputs){
        data.append(key,inputs[key]);
      }
      console.log(data);
      
      // send request
      Api.request('post', 'files/upload', data, {}, true)
        .then(res => {
          if(!cancel) reqStateDispatch('success');
        })
        .catch(err => {
          let msg = '';
          // got response from server
          if(err.response) {
            const { status } = err.response;
            if (status >= 500 && status < 600) {
              msg = `Server error ${status}, please contact the admins`;
            }
            else if (status === 400) {
              msg = err.response.data.error;
            }
            else if (status === 401) {
              msg = "You must be logged in";
            }
            else {
              msg = `Sorry, unknown error ${status}`;
            }
          }
          // request sent but no response
          else if(err.request) {
            msg = 'Could not connect to the server';
          }
          // catch all
          else {
            msg = 'Sorry, unknown error';
          }
          if(cancel) return;
          setErrorMessage(msg);
          reqStateDispatch('error');
        });
    }

    return () => {
      clearTimeout(timer);
    }
  }, [reqState]);

  let handleSubmit = (e) => {
    console.log('onsubmit',reqState);
    e.preventDefault();
    if(!reqState.loading) reqStateDispatch('submit');
  }

  const { loading, success } = reqState;

  return (
    <div className={classes.container}>
      <Paper className={classes.formWrapper}>
        <form className={classes.form} onSubmit={handleSubmit}>
          <label className={classNames(classes.fileUploadWrapper,{[classes.fileDragOver]:dragOver})}
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            {file ?
              <div className={classes.fileUploadChildren}>
                <CloudDone className={classes.fileUploadIcon} fontSize="inherit"/>
                <Typography variant="h5" color="inherit">File Ready</Typography>
                <Typography variant="body1" color="inherit">{file.name}</Typography>
              </div> :
              <div className={classes.fileUploadChildren}>
                <CloudUpload className={classes.fileUploadIcon} fontSize="inherit"/>
                <Typography variant="h5" color="inherit">Upload File</Typography>
              </div>
            }
            <input id="fileUpload" type='file' className={classes.fileUpload}
              accept='image/*,video/*,audio/*'
              onChange={handleFileSelect}
              required={true}
            />
          </label>
          <div className={classes.formTextFields}>
            <Typography className={classes.errorMessage} variant="body1" color="error">
              {errorMessage}
            </Typography>
            <TextField id='title' label='Title' type='text' required={true}
              className={classes.textField} margin='normal' variant='outlined'
              value={inputs['title']}
              onChange={handleChange('title')}
              disabled={loading}
              autoFocus
            />
            <TextField id='description' label='Description' type='text'
              className={classes.textField} margin='normal' variant='outlined'
              value={inputs['description']}
              onChange={handleChange('description')}
              disabled={loading}
            />
            <TextField id='keywords' label='Keywords' type='text'
              className={classes.textField} margin='normal' variant='outlined'
              value={inputs['keywords']}
              onChange={handleChange('keywords')}
              disabled={loading}
            />
            <TextField id='categories' label='Categories' type='text'
              className={classes.textField} margin='normal' variant='outlined'
              value={inputs['categories']}
              onChange={handleChange('categories')}
              disabled={loading}
            />
            <div className={classes.buttonWrapper}>
              <Button type='submit'
                size='large'
                color='primary'
                className={classNames({
                  [classes.buttonSuccess]: success
                })}
                variant='contained'
                disabled={loading || !file}
                >
                Upload
              </Button>
              {loading && <CircularProgress size={24} className={classes.buttonProgress}/>}
            </div>
          </div>
        </form>
      </Paper>
    </div>
  );
}
