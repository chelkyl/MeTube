import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Typography,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@material-ui/core';
import {
  Tune
} from '@material-ui/icons';
import axios from 'axios';
import Api from '../apiclient';
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
const initialFilters = {
  'files': [],
  'users': [],
  'playlists': []
};
const initialSorters = {
  'files': trendingFileSorts,
  'users': trendingUserSorts,
  'playlists': trendingListSorts
};

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

export default function BrowsePage(props) {
  const classes = useStyles();
  const params = new URLSearchParams(props.location.search);
  const [query, setQuery] = useState(params.get('q') || '');
  const [searchType, setSearchType] = useState(''); //FIXME: searchType is files/playlists/users, get mixed up with audio/video/docs
  const [filters, setFilters] = useState([]);
  const [sorters, setSorters] = useState([]);
  const [results, setResults] = useState([]);
  // const [inputs, setInputs]   = useState({});
  let inputs = {};
  let cancelSearch = false;

  let getFormFilters = () => {
    let newFilters = [];
    
    return newFilters;
  };
  let getFormSorters = () => {
    return initialSorters;
  };
  let handleInputs = (label) => (e) => {
    // setInputs({...inputs, [label]:e.currentTarget.value});
    console.log('browse',e.currentTarget, e.currentTarget.value);
    inputs[label] = e.currentTarget.value;
  };

  useEffect(() => {
    console.log('setting query');
    const newParams = new URLSearchParams(props.location.search);
    setQuery(newParams.get('q') || '');
    setSearchType(newParams.get('type') || '');
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

  let contents;
  if(results === []) contents = <Typography variant="h5">No results</Typography>;
  else {
    contents = results.map(result => {
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
    });
  }

  return (
    <div className={classes.container}>
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<Tune/>}>
          <Typography className={classes.optionsTitle}>Search Options</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.options}>
          <FormControl component="fieldset" className={classes.optionGroupWrap}>
            <FormLabel component="legend">Category</FormLabel>
            <RadioGroup name="category" className={classes.optionGroup}
              value={inputs['category']} onChange={handleInputs('category')} aria-label="category">
              <FormControlLabel control={<Radio/>} label="File"     value="files"/>
              <FormControlLabel control={<Radio/>} label="Channel"  value="users"/>
              <FormControlLabel control={<Radio/>} label="Playlist" value="playlists"/>
            </RadioGroup>
          </FormControl>
          <FormControl component="fieldset" className={classes.optionGroupWrap}>
            <FormLabel component="legend">Type</FormLabel>
            <RadioGroup name="type" className={classes.optionGroup}
              value={inputs['type']} onChange={handleInputs('type')} aria-label="type">
              <FormControlLabel control={<Radio/>} label="Video" value="video"/>
              <FormControlLabel control={<Radio/>} label="Audio" value="audio"/>
              <FormControlLabel control={<Radio/>} label="Image" value="image"/>
            </RadioGroup>
          </FormControl>
        </ExpansionPanelDetails>
      </ExpansionPanel>
      <div className={classes.results}>
        {contents}
      </div>
    </div>
  );
}
