import React from 'react';
import PropTypes from 'prop-types';
import FileItemCard from '../components/fileItemCard';
import {
  Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import axios from 'axios';

const styles = theme => ({
  container: {
    display: 'flex',
    justifyContent: 'center',
    textAlign: 'left'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  },
  sectionTitle: {
    marginBottom: 4
  },
  videosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, 210px)',
    gridColumnGap: '4px',
    gridRowGap: '24px'
  }
});

class HomePage extends React.Component {
  state = {
    alertMessage: '',
    trending: []
  };

  getSection(tag='trending', start=0, count=10) {
    axios.get(`http://localhost:5000/files?tag=${tag}&start=${start}&limit=${count}`)
      .then(res => {
        console.log(res);
        this.setState({[tag]:res.response});
      })
      .catch(err => {
        let msg = '';
        // got response from server
        if(err.response) {
          console.log(err.response);
          const { status } = err.response;
          if(status === 401) {
            msg = 'Invalid login';
          }
          else if (status >= 500 && status < 600) {
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
  }

  render() {
    const { classes } = this.props;
    const { trending } = this.state;

    return (
      <div className={classes.container}>
        <div className={classes.section}>
          <Typography variant="h5" className={classes.sectionTitle}>
            Trending
          </Typography>
          <div className={classes.videosGrid}>
            {/* {trending.map(file => {
              return <FileItemCard key={`file-${file.file_id}`} name={file.title} owner={file.owner} file_id={file.file_id}/>
            })} */}
          </div>
        </div>
      </div>
    );
  }
}

HomePage.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(HomePage);
