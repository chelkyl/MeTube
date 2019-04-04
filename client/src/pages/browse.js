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
  Radio,
  Button,
  Switch
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
  },
  optionsToggle: {
  },
  optionsTitle: {
    fontSize: 15,
    fontWeight: theme.typography.fontWeightRegular,
    marginLeft: theme.spacing.unit
  },
  options: {
    display: 'grid',
    gridAutoRows: '1fr',
    gridAutoFlow: 'column'
  },
  optionGroupLabel: {
    marginBottom: theme.spacing.unit
  },
  optionLabel: {
    height: '2.2em',
    marginRight: theme.spacing.unit * 3
  },
  optionRadio: {
    padding: '0 12px 0 0',
    marginLeft: 12
  }
}));

let getSearchType = (s) => {
  switch(s) {
    case 'video':
    case 'audio':
    case 'image':
      return s;
    default:
      return '';
  }
};

const initialInputs = {
  'category': 'all',
  'type': 'all',
  'sort': 'views',
  'sortDsc': true
};

export default function BrowsePage(props) {
  const classes = useStyles();
  const params = new URLSearchParams(props.location.search);
  const [query, setQuery] = useState(params.get('q') || '');
  const [results, setResults] = useState([]);
  const [inputs, setInputs]   = useState({...initialInputs, 'type': getSearchType(params.get('type'))});
  let cancelSearch = false;

  let makeFilters = (category) => {
    let queryFilters = [];
    if(category === 'files') {
      if(inputs.type !== 'all') {
        queryFilters.push({
          'column': 'mimetype',
          'value': inputs.type,
          'cmp': 'contains'
        });
      }
    }
    return queryFilters;
  };
  let makeSorters = (category) => {
    let querySorters = [];
    if(category === 'files') {
      switch(inputs.sort) {
        case 'likes':
          querySorters.push({
            'column': 'upvotes',
            'descending': inputs.sortDsc
          });
          break;
        case 'downloads':
          //TODO: need column or table in db
          break;
        case 'subscribers':
          querySorters.push({
            'column': 'subscribed',
            'descending': inputs.sortDsc
          });
          break;
        case 'views':
        default:
          querySorters.push({
            'column': 'views',
            'descending': inputs.sortDsc
          });
          break;
      }
    }
    return querySorters;
  };
  let deepCopyObject = (obj) => {
    let cpy = {};
    for(let key in obj) {
      if(obj[key] !== undefined && typeof(obj[key]) === 'object') cpy[key] = deepCopyObject(obj[key]);
      else cpy[key] = obj[key];
    }
    return cpy;
  };
  let handleInputs = (key) => (e) => {
    let value = e.currentTarget.value;
    let newInputs = deepCopyObject(inputs);
    newInputs[key] = value;
    switch(key) {
      case 'category':
        switch(value) {
          case 'all':
          case 'files':
          case 'playlists':
            if(newInputs['sort'] === 'subscribers') newInputs['sort'] = initialInputs['sort'];
            break;
          case 'users':
            newInputs['sort'] = 'subscribers';
            newInputs['type'] = '';
            break;
          default:
            break;
        }
        break;
      case 'type':
        if(newInputs['category'] === 'users') newInputs['category'] = initialInputs['category'];
        if(newInputs['sort'] === 'subscribers') newInputs['sort'] = initialInputs['sort'];
        break;
      case 'sort':
        if (value === 'subscribers') {
          newInputs['category'] = 'users';
          newInputs['type'] = '';
        }
        else if (newInputs['category'] === 'users') newInputs['category'] = initialInputs['category'];
        break;
      default:
        break;
    }
    setInputs(newInputs);
  };

  useEffect(() => {
    console.log('setting query');
    const newParams = new URLSearchParams(props.location.search);
    setQuery(newParams.get('q') || '');
    setInputs({...inputs, 'type': newParams.get('type') || ''});
  }, [props]);

  let getRankedResults = (results) => {
    return results.flat(1);
  };

  useEffect(() => {
    console.log('submitting for query:',query);
    let requests = [];
    let reqTypes = [];
    console.log('browse',inputs);
    if (inputs.category == 'all') {
      ['files','playlists','users'].forEach((cat) => {
        requests.push(Api.getData(cat, query, makeFilters(cat), makeSorters(cat)));
        reqTypes.push(cat);
      });
    }
    else {
      requests.push(Api.getData(inputs.category, query, makeFilters(inputs.category), makeSorters(inputs.category)));
      reqTypes.push(inputs.category);
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
  }, [query,inputs]);

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
        <ExpansionPanelSummary expandIcon={null}>
          <Button variant="text">
            <Tune /><Typography className={classes.optionsTitle}>Search Options</Typography>
          </Button>
          <div></div>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.options}>
          <FormControl component="fieldset">
            <FormLabel component="legend" className={classes.optionGroupLabel}>Category</FormLabel>
            <RadioGroup name="category" value={inputs['category']} onChange={handleInputs('category')} aria-label="category">
              <FormControlLabel control={<Radio/>} label="All"      value="all"       className={classes.optionLabel}/>
              <FormControlLabel control={<Radio/>} label="File"     value="files"     className={classes.optionLabel}/>
              <FormControlLabel control={<Radio/>} label="Playlist" value="playlists" className={classes.optionLabel}/>
              <FormControlLabel control={<Radio/>} label="Channel"  value="users"     className={classes.optionLabel}/>
            </RadioGroup>
          </FormControl>
          <FormControl component="fieldset">
            <FormLabel component="legend" className={classes.optionGroupLabel}>Type</FormLabel>
            <RadioGroup name="type" value={inputs['type']} onChange={handleInputs('type')} aria-label="type">
              <FormControlLabel control={<Radio/>} label="All"   value="all"   className={classes.optionLabel}/>
              <FormControlLabel control={<Radio/>} label="Video" value="video" className={classes.optionLabel}/>
              <FormControlLabel control={<Radio/>} label="Audio" value="audio" className={classes.optionLabel}/>
              <FormControlLabel control={<Radio/>} label="Image" value="image" className={classes.optionLabel}/>
            </RadioGroup>
          </FormControl>
          <FormControl component="fieldset">
            <FormLabel component="legend" className={classes.optionGroupLabel}>Sort</FormLabel>
            <RadioGroup name="sort" value={inputs['sort']} onChange={handleInputs('sort')} aria-label="sort">
              <FormControlLabel control={<Radio/>} label="Most Likes"       value="likes"       className={classes.optionLabel}/>
              <FormControlLabel control={<Radio/>} label="Most Viewed"      value="views"       className={classes.optionLabel}/>
              <FormControlLabel control={<Radio/>} label="Most Downloaded"  value="downloads"   className={classes.optionLabel}/>
              <FormControlLabel control={<Radio/>} label="Most Subscribers" value="subscribers" className={classes.optionLabel}/>
            </RadioGroup>
            <FormControlLabel label={inputs['sortDsc'] ? "Descending" : "Ascending"} className={classes.optionLabel} control={
                <Switch checked={inputs['sortDsc']} onChange={() => setInputs({...inputs,'sortDsc':!inputs['sortDsc']})}/>
              }/>
          </FormControl>
        </ExpansionPanelDetails>
      </ExpansionPanel>
      <div className={classes.results}>
        {contents}
      </div>
    </div>
  );
}
