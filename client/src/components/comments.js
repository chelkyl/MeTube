import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  Divider,
  Toolbar,
  Typography,
  Slide,
} from '@material-ui/core';
import {
  AccountCircle,
  Send
} from '@material-ui/icons';
import Api from '../apiclient';
import {useAuthCtx} from '../authentication';
import {getAuthenticatedUserID} from '../authutils';

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
    gridGap: theme.spacing.unit * 2
  },
  metrics: {
  },
  description: {
    textAlign: 'left',
    marginTop: theme.spacing.unit * 2
  },
  rating: {
    marginTop: theme.spacing.unit
  },
  rateIcon: {
    marginRight: theme.spacing.unit * 2
  },
  comment: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'left',
    marginTop: theme.spacing.unit * 2
  },
  comments: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'left',
    marginTop: theme.spacing.unit * 2
  },
  rightIcon: {
    marginLeft: theme.spacing.unit,
  },
  button: {
    margin: theme.spacing.unit,
  },
  grow: {
    flexGrow: 1
  }
}));


export default function Comments(props) {
  const classes = useStyles();
  const fileId = props.file_id;
  const [commentsChanged, setCommentsChanged] = useState(true);
  const [isLoggedIn] = useAuthCtx();
  const [comments, setComments] = useState([]);
  const initialAlertState = {
    open: false,
    title: '',
    message: ''
  };
  const [alertState, setAlertState] = useState(initialAlertState);
  const initialCommentState = {
    comment: '',
  };
  const [newComment, setNewComment] = useState(initialCommentState)

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

  let cancel = false;

  function SlideTransition(props) {
    return <Slide direction='down' {...props}/>;
  }

  async function sendComment() {
    if(isLoggedIn) {
      newComment.file_id = fileId;
      newComment.user_id = parseInt(getAuthenticatedUserID());
      console.log('comment uploading', newComment);
      try {
        const response = await Api.request('post','/comments/add_comment',newComment,{},true);
        console.log('comment upload',response);
        const res = response.data;
        setCommentsChanged(true);
        setNewComment(initialCommentState);
        return res;
      }
      catch(err) {
        console.log('messages send',err);
        throw err;
      }
    }
  }

  useEffect(() => {
    if(commentsChanged){
      Api.request('get',`/comments/${fileId}`)
        .then(res => {
          console.log('comments: ',res.data.response);
          if(!cancel) {
            setCommentsChanged(false);
            setComments(res.data.response);
          }
        })
        .catch(err => {
          let msg = '';
          let title = '';
          // got response from server
          if(err.response) {
            const { status } = err.response;
            title = 'Send report?';
          if (status >= 500 && status < 600) {
            msg = `Server error ${status}, please contact the admins`;
          }
          else if (status === 404) {
            msg = "Comments not found";
          }
          else if (status === 403) {
            msg = "Comments permission blocked";
          }
          else {
            msg = `Sorry, unknown error ${status}`;
          }
        }
        // request sent but no response
        else if(err.request) {
          title = 'Check connection';
          msg = 'Could not connect to the server';
        }
        // catch all
        else {
          title = 'Send report?';
          msg = 'Sorry, unknown error';
        }
        setCommentsChanged(false);
        console.log('view',err);
        if(cancel) return;
        setAlertState({title: title, message: msg, open: true});
      });
    }

      return () => {
        cancel = true;
      }
  }, [commentsChanged]);

  const handleChange = prop => event => {
    setNewComment({ ...newComment, [prop]: event.target.value });
  };

  return (
    <div className={classes.root}>
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
      <Divider/>
      <div className={classes.comment}>
        <TextField
          id="standard-multiline-flexible"
          label= {isLoggedIn ? "Add a public comment. . ." : "Please login to comment. . ."}
          value={newComment.comment}
          onChange={handleChange('comment')}
          multiline
          rowsMax="4"
          className={classes.textField}
          variant="outlined"
        />
        <Toolbar>
          <div className={classes.grow} />
          <Button color="primary">
            Cancel
          </Button>
          <Button variant="contained" color="primary" className={classes.button} onClick={sendComment}>
            Comment
            <Send className={classes.rightIcon}>send</Send>
          </Button>
        </Toolbar>
      </div>
      <Divider/>
      {
        comments.length === 1 ? (
          <Typography variant="body1">{comments.length+" comment"}</Typography>
        ):
          <Typography variant="body1">{comments.length+" comments"}</Typography>
      }
      <div className={classes.comments}>
        <List>
          {comments.map((comment) => (
            <ListItem key={comment.comment_id}>
              <AccountCircle/>
              <ListItemText
                primary={comment.username + ": " + comment.comment}
                />
            </ListItem>
          ))}
        </List>
      </div>
    </div>
  );
}
