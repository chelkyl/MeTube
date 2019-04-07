import React, {useState,useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import Api from '../apiclient';
import Section from '../components/section';

const useStyles = makeStyles(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'left'
  }
}));

export default function HomePage() {
  const classes = useStyles();
  const [topChannels,setTopChannels] = useState([]);
  let cancel = false;

  useEffect(() => {
    const topChannelSorts = [
      {
        'column': 'subscribers',
        'descending': 'true'
      }
    ];
    Api.getData('users/subscribers', '', [], topChannelSorts)
      .then(response => {
        if(!cancel) setTopChannels(response.data.response);
      })
      .catch(err => {
        console.log('home',err);
      });
  }, []);

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
      {topChannels.map(user => {
        let {user_id, username} = user;
        return <Section key={`channel-${user_id}`} name={username}
          filters={[...trendingFilts, {
            'column': 'user_id',
            'value': user_id,
            'cmp': 'exact'
          }]}
          sorters={trendingSorts}/>
      })}
    </div>
  );
}
