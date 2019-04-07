import React, {useState,useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Typography,
} from '@material-ui/core';
import Api from '../apiclient';
import ResultItemCard from '../components/resultItemCard';

const useStyles = makeStyles(theme => ({
  section: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    margin: `${theme.spacing.unit*2}px 0`
  },
  sectionTitle: {
    marginBottom: 4
  },
  filesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, 210px)',
    gridColumnGap: theme.spacing.unit,
    gridRowGap: theme.spacing.unit
  },
  resultErrorWrap: {
    display: 'flex',
    flexDirection: 'column',
    padding: `${theme.spacing.unit}px 0`
  },
  resultError: {
    textAlign: 'left',
    paddingLeft: theme.spacing.unit
  }
}));

export default function Section(props) {
  const classes = useStyles();
  const [files, setFiles] = useState([]);
  let start = 0, count = 10;
  let cancel = false;

  useEffect(() => {
    Api.getData('files','',props.filters,props.sorters,start,count)
      .then(response => {
        if(!cancel) setFiles(response.data.response);
      })
      .catch(err => {
        console.log('section',err);
      });
  }, []);

  let contents;
  if(files.length > 0) {
    contents = (
      <div className={classes.filesGrid}>
        {
          files.map(result => {
            let {file_id,title,username,mimetype} = result;
            return (
              <ResultItemCard key={`result-files-${file_id}`}
                className={classes.resultItem}
                name={title}
                owner={username}
                result_type="files"
                mimetype={mimetype}
                id={file_id}
                variant="small"/>
            )
          })
        }
      </div>
    );
  }
  else contents = (
    <div className={classes.resultErrorWrap}>
      <Typography variant="h5" className={classes.resultError}>No results</Typography>
    </div>
  );

  return (
    <div className={classes.section}>
      <Typography variant="h5" className={classes.sectionTitle}>
        {props.name}
      </Typography>
      {contents}
    </div>
  );
}
