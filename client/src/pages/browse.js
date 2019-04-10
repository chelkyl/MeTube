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
import {deepCopyObject, basicRequestCatch} from '../utils';
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
  resultError: {
    textAlign: 'center'
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
    case 'all':
      return s;
    default:
      return '';
  }
};

const initialInputs = {
  'category': 'all',
  'type': '',
  'sort': 'views',
  'sortDsc': true
};

export default function BrowsePage(props) {
  const classes = useStyles();
  //FIXME: maybe reset sort and filters when search query changes?
  const params = new URLSearchParams(props.location.search);
  const [query, setQuery] = useState(params.get('q') || null);
  const [results, setResults] = useState([]);
  let initialInputsWithType = {
    ...initialInputs,
    'type': getSearchType(params.get('type'))
  };
  const [inputs, setInputs]   = useState({...initialInputsWithType, 'category': initialInputsWithType['type'] !== '' ? 'files' : initialInputs['category']});
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
            'column': 'subscribers',
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
  let updateInputs = (key,value) => {
    let newInputs = deepCopyObject(inputs);
    newInputs[key] = value;
    switch(key) {
      case 'category':
        switch(value) {
          case 'all':
          case 'playlists':
            if(newInputs['sort'] === 'subscribers') newInputs['sort'] = initialInputs['sort'];
            newInputs['type'] = '';
            break;
          case 'files':
            if(newInputs['type'] === '') newInputs['type'] = 'all';
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
        if(value !== '') {
          newInputs['category'] = 'files';
          if(newInputs['sort'] === 'subscribers') newInputs['sort'] = initialInputs['sort'];
        }
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
  let handleInputs = (key) => (e) => {
    let value = e.currentTarget.value;
    if(key === 'type') {
      params.set('type',value);
      props.history.push(`/browse?${params.toString()}`);
    }
    updateInputs(key,value);
  };

  useEffect(() => {
    const newParams = new URLSearchParams(props.location.search);
    const newQuery = newParams.get('q') || null;
    const newType  = newParams.get('type') || '';
    if(query !== newQuery) setQuery(newQuery);
    if(inputs['type'] !== newType) updateInputs('type',newType);
  }, [props]);

  let getRankedResults = (results) => {
    return results.reduce((acc, val) => acc.concat(val),[]);
  };

  useEffect(() => {
    let requests = [];
    let reqTypes = [];
    if (inputs.category === 'all') {
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
        if(cancelSearch) return;
        let reqResults = responses.map((res,i) => {
          let resType = reqTypes[i];
          let data = res.data.response;
          if(data.length === 0) return null;
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
        reqResults = reqResults.filter((i) => {
          return i !== null;
        });
        let rankedResults = getRankedResults(reqResults);
        if(!cancelSearch) setResults(rankedResults);
      })
      .catch(basicRequestCatch('browse'));

    return () => {
      cancelSearch = true;
    }
  }, [query,inputs]);

  let contents;
  if(results.length > 0) {
    contents = results.map(result => {
      let {resultType, id, display_name, username, mimetype} = result;
      return (
        <ResultItemCard key={`result-${resultType}-${id}`}
          className={classes.resultItem}
          name={display_name}
          owner={username}
          result_type={resultType}
          mimetype={mimetype}
          id={id}
          variant="wide"/>
      )
    });
  }
  else contents = <Typography variant="h5" className={classes.resultError}>No results</Typography>;

  return (
    <div className={classes.container}>
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={null}>
          <Button variant="text">
            <Tune /><Typography className={classes.optionsTitle}>Search Options</Typography>
          </Button>
          <div key="placeholder_for_icon" name="necessary_for_styling"></div>
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
              <FormControlLabel control={<Radio/>} label="Most Views"       value="views"       className={classes.optionLabel}/>
              <FormControlLabel control={<Radio/>} label="Most Downloads"   value="downloads"   className={classes.optionLabel}/>
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
