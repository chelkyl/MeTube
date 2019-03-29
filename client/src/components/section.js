import React from 'react';
import PropTypes from 'prop-types';
import FileItemCard from '../components/fileItemCard';
import {
  Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Api from '../apiclient';

const styles = theme => ({
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

class Section extends React.Component {
  state = {
    files: []
  };

  getFiles(route, filters=[], sorters=[], start=0, count=10) {
    // ApiClient.get(`/${route}?b=${start}&l=${count}`, {filters, sorters})
    //   .then(res => {
    //     console.log(res);
    //     this.setState({files:res.data.response});
    //   })
    //   .catch(err => {
    //     let msg = '';
    //     // got response from server
    //     if(err.response) {
    //       console.log(err.response);
    //       const { status } = err.response;
    //       if (status >= 500 && status < 600) {
    //         msg = `Server error ${status}, please contact the admins`;
    //       }
    //       else {
    //         msg = `Sorry, unknown error ${status}`;
    //       }
    //     }
    //     // request sent but no response
    //     else if(err.request) {
    //       console.log(err.request);
    //       msg = err.message;
    //     }
    //     // catch all
    //     else {
    //       console.log(err);
    //       msg = 'Sorry, unknown error';
    //     }
    //     this.setState({
    //       alertMessage: msg
    //     });
    //   });
  }

  componentDidMount() {
    const { route, filters, sorters } = this.props;
    this.getFiles(route, filters, sorters);
  }

  render() {
    const { classes, name } = this.props;
    const { files } = this.state;

    return (
      <div className={classes.section}>
        <Typography variant="h5" className={classes.sectionTitle}>
          {name}
        </Typography>
        <div className={classes.videosGrid}>
          {files.map(file => {
            return <FileItemCard key={`file-${file.file_id}`} name={file.title} owner={file.owner} file_id={file.file_id}/>
          })}
        </div>
      </div>
    )
  }
}

Section.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Section);
