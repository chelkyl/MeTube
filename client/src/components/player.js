import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { ApiClient } from '../apiclient';

const styles = theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'black'
  }
});

class Player extends React.Component {
  state = {
    files: []
  };

  getFile(tag, file_id) {
    ApiClient.get(`/files/${file_id}/g`,{responseType: 'blob'})
      .then(res => {
        console.log('Got file',res);
        let blob_url = URL.createObjectURL(res.data);
        console.log('blob_url is',blob_url);
        this.setState({[tag]:blob_url});
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
        this.setState({
          alertMessage: msg
        });
      });
  }

  componentDidMount() {
    if (this.props.file_info) {
      this.getFile('blob_url', this.props.file_info.file_id);
    }
  }

  render() {
    const { classes, file_info } = this.props;
    const { blob_url } = this.state;

    let viewer = null;
    if (file_info) {
      let {mimetype:mime} = file_info;
      console.log('player mime', mime);
      if (mime.includes('video')) {
        viewer = (
          <video src={blob_url} controls/>
        );
      }
      else if (mime.includes('audio')) {
        viewer = (
          <audio src={blob_url} controls/>
        )
      }
      /*else if (mime.includes('text')) {

      }*/
      else if (mime.includes('image')) {
        viewer = (
          <image src={blob_url}/>
        )
      }
      else {
        viewer = (
          <p>Viewer unavailable, unsupported format</p>
        );
      }
    }
    else {
      viewer = (
        <p>File not found</p>
      );
    }

    return (
      <div className={classes.container}>
        {viewer}
      </div>
    )
  }
}

Player.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Player);
