import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Typography
} from '@material-ui/core';
import Api from '../apiclient';

const useStyles = makeStyles(theme => ({
  player: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  videoContainer: {
    width: '100%',
    backgroundColor: 'black'
  },
  video: {
    width: '100%',
    maxHeight: '80vh'
  },
  audioContainer: {
    width: '100%',
    backgroundColor: 'black'
  },
  audio: {
    width: '100%'
  },
  imageContainer: {
    width: '100%',
    backgroundColor: 'black'
  },
  image: {
    width: '100%'
  },
  errorContainer: {
    display: 'flex',
    width: '68vw',
    height: '20vw',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black'
  },
}));

const initialErrorState = {
  show: false,
  primary: '',
  secondary: ''
};

export default function Player(props) {
  const classes = useStyles();
  const [fileID, setFileID] = useState(props.file_id);
  const [blobURL, setBlobURL] = useState(null);
  const [errorMessage,setErrorMessage] = useState(initialErrorState);
  let {mimetype='', name=''} = props;
  let cancel = false;

  useEffect(() => {
    setFileID(props.file_id);
  }, [props]);

  useEffect(() => {
    console.log('player init',fileID);
    if(fileID) {
      Api.request('get',`/files/${fileID}/g`,{},{responseType: 'blob'})
        .then(res => {
          mimetype = res.data.type;
          if(mimetype.includes('video') || mimetype.includes('audio') || mimetype.includes('image')) {
            console.log('player', mimetype, res);
            let blob_url = URL.createObjectURL(res.data);
            console.log('file blob url is',blob_url);
            if(cancel) return;
            setBlobURL(blob_url);
            if(errorMessage.show) setErrorMessage(initialErrorState);
          }
          else {
            if(cancel) return;
            setErrorMessage({
              show: true,
              primary: 'Viewer unavailable',
              secondary: `Unsupported mimetype ${mimetype}`
            });
          }
        })
        .catch(err => {
          let msg = '';
          // got response from server
          if(err.response) {
            console.log(err.response);
            const { status } = err.response;
            if (status >= 500 && status < 600) {
              msg = `Server error ${status}, please contact the admins`;
            }
            else if (status === 404) {
              msg = "File not found";
            }
            else if (status === 403) {
              msg = "File permission blocked";
            }
            else {
              msg = `Sorry, unknown error ${status}`;
            }
          }
          // request sent but no response
          else if(err.request) {
            console.log(err.request);
            msg = err.message;
          }
          // catch all
          else {
            console.log(err);
            msg = 'Sorry, unknown error';
          }
          if(cancel) return;
          setErrorMessage({
            show: true,
            primary: msg
          });
        })
    }
    else {
      setErrorMessage({
        show: true,
        primary: "Viewer unavailable",
        secondary: "File not found"
      });
    }

    return () => {
      cancel = true;
    }
  }, [fileID]);

  let viewer = null;
  if(errorMessage.show) {
    viewer = (
      <div className={classes.errorContainer}>
        <Typography variant="h6">{errorMessage.primary}</Typography>
        <Typography variant="h6">{errorMessage.secondary}</Typography>
      </div>
    );
  }
  else if (blobURL) {
    if (mimetype.includes('video')) {
      viewer = (
        <div className={classes.videoContainer}>
          <video className={classes.video} src={blobURL} controls/>
        </div>
      );
    }
    else if (mimetype.includes('audio')) {
      viewer = (
        <div className={classes.audioContainer}>
          <audio className={classes.audio} src={blobURL} controls/>
        </div>
      )
    }
    /*else if (mimetype.includes('text')) {

    }*/
    else if (mimetype.includes('image')) {
      viewer = (
        <div className={classes.imageContainer}>
          <img className={classes.image} src={blobURL} alt={name}/>
        </div>
      )
    }
  }

  return (
    <div className={classes.player}>
      {viewer}
    </div>
  )
}
