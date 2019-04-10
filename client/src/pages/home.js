import React, {useState,useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import Api from '../apiclient';
import Section from '../components/section';
import { basicRequestCatch } from '../utils';

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
    Api.getData('users/subscribers', null, [], topChannelSorts)
      .then(response => {
        if(!cancel) setTopChannels(response.data.response);
      })
      .catch(basicRequestCatch('home'));
  }, []);

  const trendingFilts = [
    {
      'column': 'upload_date',
      'value': '0001-01-01',
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
        let {user_id, username, subscribers} = user;
        return <Section key={`channel-${user_id}`} name={username} type='channel' subscribers={subscribers}
          filters={[...trendingFilts,{column:'user_id',value:user_id,cmp:'exact'}]}
          sorters={trendingSorts}/>
      })}
    </div>
  );
}
