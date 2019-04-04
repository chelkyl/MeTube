import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slide,
  Paper,
  Typography,
  IconButton
} from '@material-ui/core';
import {
  CloudDownload
} from '@material-ui/icons';
import Player from '../components/player';
import Api from '../apiclient';
import { saveAs } from 'file-saver';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'left'
  },
  fileInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    textAlign: 'left',
    padding: theme.spacing.unit * 2
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    alignItems: 'end',
    justifyContent: 'space-between',
    textAlign: 'left'
  },
  details: {
  },
  extras: {
    display: 'grid',
    gridAutoRows: '1fr',
    gridAutoFlow: 'column',
    gridGap: theme.spacing.unit
  },
  metrics: {
  },
  description: {
    textAlign: 'left',
    marginTop: theme.spacing.unit * 2
  }
}));

function SlideTransition(props) {
  return <Slide direction='down' {...props}/>;
}

const initialAlertState = {
  open: false,
  title: '',
  message: ''
};

export default function ViewPage(props) {
  const classes = useStyles();
  const [fileInfo,setFileInfo] = useState({file_id:props.match.params.id});
  const [alertState, setAlertState] = useState(initialAlertState);
  let cancel = false;

  useEffect(() => {
    let id = props.match.params.id;
    Api.request('get',`/files/${id}`)
      .then(res => {
        console.log('view',res.data.response);
        if(!cancel) setFileInfo(res.data.response);
      })
      .catch(err => {
        let msg = '';
        let title = '';
        // got response from server
        if(err.response) {
          console.log(err.response);
          const { status } = err.response;
          title = 'Send report?';
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
          title = 'Check connection';
          msg = 'Could not connect to the server';
        }
        // catch all
        else {
          console.log(err);
          title = 'Send report?';
          msg = 'Sorry, unknown error';
        }
        console.log(msg, err);
        if(cancel) return;
        setAlertState({title: title, message: msg, open: true});
        setFileInfo({file_id:id});
      });

      return () => {
        cancel = true;
      }
  }, [props]);

  let downloadFile = () => {
    saveAs(`${Api.baseURL}/files/${fileInfo.file_id}/g`,fileInfo.title);
  };

  let handleDialogButton = (type) => (e) => {
    switch(type) {
      case 'close':
        setAlertState(initialAlertState);
        break;
      case 'report':
        // props.history.push(`mailto:${process.env.REACT_APP_DEV_EMAIL}`);
        setAlertState(initialAlertState);
        break;
      default:
        break;
    }
  };

  const { title, username, description, upload_date, views, upvotes, downvotes } = fileInfo;

  return (
    <div className={classes.container}>
      <Dialog open={alertState.open}
          TransitionComponent={SlideTransition}
          keepMounted
          onClose={() => setAlertState(initialAlertState)}
          aria-labelledby="alert-title"
          aria-describedby="alert-description">
        <DialogTitle id="alert-title">{alertState.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-description">{alertState.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogButton('close')} color="primary">Close</Button>
          <Button onClick={handleDialogButton('report')} color="primary" variant="contained" autoFocus>Send Report</Button>
        </DialogActions>
      </Dialog>
      <Player {...fileInfo}/>
      <Paper>
        <div className={classes.fileInfo}>
          <div className={classes.header}>
            <div className={classes.details}>
              <Typography variant="h6">{title}</Typography>
              <Typography variant="body1">{username}</Typography>
              <Typography variant="body1">{upload_date}</Typography>
            </div>
            <div className={classes.extras}>
              <div className={classes.toolbar}>
                <IconButton aria-label="Download" onClick={downloadFile}>
                  <CloudDownload />
                </IconButton>
              </div>
              <div className={classes.metrics}>
                <Typography variant="body1">{`${views !== null ? views : "?"} views`}</Typography>
                <Typography variant="body1">{`${upvotes !== null ? upvotes : "?"} upvotes`}</Typography>
                <Typography variant="body1">{`${downvotes !== null ? downvotes : "?"} downvotes`}</Typography>
              </div>
            </div>
          </div>
          <div className={classes.description}>
            <Typography variant="body1">{description}</Typography>
          </div>
        </div>
      </Paper>
      {
        /* 
        <Comments/>
        <Playlist/>
        <Recommended/>
        */
      }
    </div>
  );
}
