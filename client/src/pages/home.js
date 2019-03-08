import React from 'react';
import PropTypes from 'prop-types';
import Section from '../components/section';
import { withStyles } from '@material-ui/core/styles';
import { ApiClient } from '../apiclient';

const styles = theme => ({
  container: {
    display: 'flex',
    justifyContent: 'center',
    textAlign: 'left'
  }
});

class HomePage extends React.Component {
  state = {
    topChannels: []
  };

  getData(tag, route, filters=[], sorters=[], start=0, count=10) {
    ApiClient.get(`/${route}?b=${start}&l=${count}`, {filters, sorters})
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
    const topChannelFilts = [];
    const topChannelSorts = [
      {
        'column': 'subscribers',
        'descending': 'true'
      }
    ];
    //this.getData('topChannels', 'users', topChannelFilts, topChannelSorts);
  }

  render() {
    const { classes } = this.props;
    const { topChannels } = this.state;

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

    return (
      <div className={classes.container}>
        <Section name='Trending' route='files'
          filters={trendingFilts}
          sorters={trendingSorts} />
        {/* {topChannels.map(user => {
          return <Section key={`channel-${user.user_id}`} name={user.channel_name}
            route='files'
            filters={[...trendingFilts, {
              'column': 'user_id',
              'value': user.user_id,
              'cmp': 'exact'
            }]}
            sorters={trendingSorts}/>
        })} */}
      </div>
    );
  }
}

HomePage.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(HomePage);
