import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import axios from 'axios';
import Api from '../apiclient';
import { Typography, Divider } from '@material-ui/core';
import ResultItemCard from '../components/resultItemCard';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'left'
  },
  results: {
    marginTop: theme.spacing.unit
  },
  resultItem: {
    marginBottom: theme.spacing.unit
  }
}));

const trendingFileSorts = [
  {
    'column': 'views',
    'descending': 'true'
  }
];
const trendingUserSorts = [
  {
    'column': 'subscribers',
    'descending': 'true'
  }
];
const trendingListSorts = [
  {
    'column': 'views',
    'descending': 'true'
  }
];

let getSearchType = (s) => {
  switch(s) {
    case 'channels':
      return 'users';
    case 'files':
    case 'playlists':
      return s;
    default:
      return '';
  }
};
let getFormFilters = () => {
  return false;
};
let getFormSorters = () => {
  return {
    'files': trendingFileSorts,
    'users': trendingUserSorts,
    'playlists': trendingListSorts
  };
};

export default function BrowsePage(props) {
  const classes = useStyles();
  const params = new URLSearchParams(props.location.search);
  const [query, setQuery] = useState(params.get('q') || '');
  const [searchType, setSearchType] = useState(getSearchType(params.get('just')));
  const [filters, setFilters] = useState(getFormFilters());
  const [sorters, setSorters] = useState(getFormSorters());
  const [results, setResults] = useState([]);
  let cancelSearch = false;

  useEffect(() => {
    console.log('setting query');
    const newParams = new URLSearchParams(props.location.search);
    setQuery(newParams.get('q') || '');
  }, [props]);

  let getRankedResults = (results) => {
    return results.flat(1);
  };

  useEffect(() => {
    console.log('submitting for query:',query);
    let requests = [];
    let reqTypes = [];
    if (searchType) {
      requests.push(Api.getData(searchType, query, filters[searchType], sorters[searchType]));
      reqTypes.push(searchType);
    }
    else {
      ['files','users','playlists'].forEach((sType) => {
        requests.push(Api.getData(sType, query, filters[sType], sorters[sType]));
        reqTypes.push(sType);
      });
    }
    axios.all(requests)
      .then(responses => {
        console.log('all res',responses);
        if(cancelSearch) return;
        let reqResults = responses.map((res,i) => {
          let resType = reqTypes[i];
          let data = res.data.response;
          data.forEach((item) => {
            item['resultType'] = resType;
            switch(resType) {
              case 'files':
                item['id'] = item.file_id;
                item['display_name'] = item.title;
                break;
              case 'users':
                item['id'] = item.user_id;
                item['display_name'] = item.username;
                break;
              case 'playlists':
                item['id'] = item.playlist_id;
                item['display_name'] = item.title;
                break;
              default:
                break;
            }
          });
          return data;
        });
        let rankedResults = getRankedResults(reqResults);
        setResults(rankedResults);
      })
      .catch(err => {
        console.log(err);
        // got response from server
        if(err.response) {
          console.log(err.response);
        }
        // request sent but no response
        else if(err.request) {
          console.log(err.request);
        }
        // catch all
        else {
          console.log(err);
        }
      });

    return () => {
      cancelSearch = true;
    }
  }, [query]);

  return (
    <div className={classes.container}>
      <Typography variant="h5">Results</Typography>
      <div className={classes.results}>
        {results.map(result => {
          return (
            <ResultItemCard key={`result-${result.resultType}-${result.id}`}
              className={classes.resultItem}
              name={result.display_name}
              owner={result.owner}
              result_type={result.resultType}
              mimetype={result.mimetype}
              id={result.id}
              variant="wide"/>
          )
        })}
      </div>
    </div>
  );
}
