import React from 'react';
import PropTypes from 'prop-types';
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

class BrowsePage extends React.Component {
  state = {
    results_files: [],
    results_users: [],
    results_playlists: []
  };

  getData(tag, route, filters=[], sorters=[], start=0, count=10) {
    ApiClient.get(`/${route}?b=${start}&l=${count}`, {filters, sorters})
      .then(res => {
        let data = res.data.response;
        console.log('browse data:',data);
        data.forEach((item) => {
          if(route === 'files') {
            item['id'] = item.file_id;
            item['display_name'] = item.title;
          }
          else if (route === 'users') {
            item['id'] = item.user_id;
            item['display_name'] = item.channel_name;
          }
          else if (route === 'playlists') {
            item['id'] = item.playlist_id;
            item['display_name'] = item.playlist_name;
          }
        })
        this.setState({[tag]:data});
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

  request_search(query) {
    //TODO: if category is files, channels, playlists or video/audio/image
    const searchFilts = [{
      'column': 'any',
      'value': query,
      'cmp': 'contains'
    }];
    //TODO: get sort opts from form or state
    const searchSorts = [];
    this.getData('result_files','files',searchFilts,searchSorts);
  }

  // componentDidUpdate(prevProps/*, prevState, snapshot*/) {
  //   if (this.props.location.search !== prevProps.location.search) {
  //     this.props.index(this.props.access_token, this.props.location.search);
  //   }
  // }

  componentDidMount() {
    // const topChannelFilts = [];
    // const topChannelSorts = [
    //   {
    //     'column': 'subscribers',
    //     'descending': 'true'
    //   }
    // ];
    const trendingFilts = [
      {
        'column': 'upload_date',
        'value': '01-01-0001',
        'cmp': 'max'
      }
    ];
    const trendingSorts = [
      {
        'column': 'views',
        'descending': 'true'
      }
    ];
    console.log('browse:',this.props);
    if(!this.props.query) {
      this.getData('results', 'files', trendingFilts, trendingSorts);
    }
    else {
      this.request_search(this.props.query);
    }
  }

  render() {
    const { classes } = this.props;
    const { results_files, results_users, results_playlists } = this.state;
    let results = [...results_files, ...results_users, ...results_playlists];

    return (
      <div className={classes.container}>
        {results.map(result => {
          return <fileItemCard key={`result-${result.id}`} name={result.display_name} owner={result.owner} id={result.id}/>
        })}
      </div>
    );
  }
}

BrowsePage.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(BrowsePage);
