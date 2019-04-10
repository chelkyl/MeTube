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
  sectionHeader: {
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
    height: 100,
    flexDirection: 'column',
    padding: `${theme.spacing.unit}px 0`,
    backgroundColor: theme.palette.background.paper,
    justifyContent: 'center'
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
  let {filters, sorters, name, type, subscribers} = props;
  let cancel = false;

  useEffect(() => {
    Api.getData('files',null,filters,sorters,start,count)
      .then(response => {
        console.log('section',response);
        if(!cancel) setFiles(response.data.response);
      })
      .catch(err => {
        let tag = 'section';
        // got response from server
        if(err.response) {
          console.log(tag,err.response);
        }
        // request sent but no response
        else if(err.request) {
          console.log(tag,err.request);
        }
        // catch all
        else {
          console.log(tag,err);
        }
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
      <Typography variant="h6" className={classes.resultError}>No results</Typography>
    </div>
  );

  return (
    <div className={classes.section}>
      <div className={classes.sectionHeader}>
        <Typography variant="h5" className={classes.sectionTitle}>
          {name}
        </Typography>
        {type === 'channel' && 
          <Typography variant="body1">
            {`${subscribers} ${subscribers === 1 ? 'subscriber' : 'subscribers'}`}
          </Typography>
        }
      </div>
      {contents}
    </div>
  );
}
