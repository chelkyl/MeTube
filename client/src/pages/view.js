import React from 'react';
import PropTypes from 'prop-types';
import Player from '../components/player';
import { withStyles } from '@material-ui/core/styles';
import { ApiClient } from '../apiclient';

const styles = theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'left'
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    textAlign: 'left'
  }
});

class ViewPage extends React.Component {
  state = {
  };

  getData(tag, route, id) {
    ApiClient.get(`/${route}/${id}`)
      .then(res => {
        this.setState({[tag]:res.data.response});
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
        console.log(msg, err);
        this.setState({
          [tag]: null
        });
      });
  }

  componentDidMount() {
    this.getData('file_info', 'files', this.props.match.params.id);
  }

  render() {
    const { classes } = this.props;
    const { file_info } = this.state;

    console.log(file_info);
    if (file_info == null) {
      return (
        <div className={classes.container}>
          <p>File not Found</p>
        </div>
      );
    }

    const { title, description, upload_date, views, upvotes, downvotes } = file_info;

    return (
      <div className={classes.container}>
        <Player file_info={file_info}/>
        {file_info ? (
            <>
              <h1>{title}</h1>
              <h4>{description}</h4>
              <p>Date Uploaded: {upload_date}</p>
              <p>Views: {views}</p>
              <p>Upvotes: {upvotes}</p>
              <p>Downvotes: {downvotes}</p>
            </>
            /* 
            <Comments/>
            <Playlist/>
            <Recommended/>
            */
          ) : null
        }
      </div>
    );
  }
}

ViewPage.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(ViewPage);
