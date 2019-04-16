import React, {useState, useEffect} from 'react';
import {makeStyles} from '@material-ui/styles';
import {
  Typography,
  Divider,
  Menu,
  MenuItem,
  Button
} from '@material-ui/core';
import {
  Sort
} from '@material-ui/icons';
import Api from '../apiclient';
// import { getAuthenticatedUserID } from '../authutils';
import { basicRequestCatch } from '../utils';
import ResultItemCard from '../components/resultItemCard';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left'
  },
  header: {

  },
  optionsTitle: {
    fontSize: 15,
    fontWeight: theme.typography.fontWeightRegular,
    marginLeft: theme.spacing.unit
  },
  sectionTitle: {
    marginBottom: 4
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, 210px)',
    gridColumnGap: theme.spacing.unit,
    gridRowGap: theme.spacing.unit
  },
  resultItem: {
    marginBottom: theme.spacing.unit
  }
}));

//TODO: goes in channel page, shows all files uploaded by channel's user (not current logged in user) with some sort (maybe also folder/group organization) controls

export default function ChannelFilesPage(props) {
  const classes = useStyles();
  const [files, setFilesInfo] = useState([]);
  const [sortKey, setSortKey] = useState('upload_date');
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  let {userID} = props;
  // let canEdit = userID === getAuthenticatedUserID();
  let cancel = false;

  useEffect(() => {
    let sorter = {
      column: sortKey,
      descending: true
    };
    Api.getData('files',null,[{column:'user_id',value:userID,cmp:'exact'}],[sorter])
      .then(res => {
        if(!cancel) setFilesInfo(res.data.response);
      })
      .catch(basicRequestCatch('files get'));

    return () => {
      cancel = true;
    };
  }, [sortKey]);

  let openSortMenu = (e) => {
    setSortMenuAnchor(e.target);
  };
  let closeSortMenu = (e) => {
    setSortMenuAnchor(null);
  };
  let handleSortMenu = (key) => (e) => {
    setSortKey(key);
    closeSortMenu();
  };

  let isSortMenuOpen = Boolean(sortMenuAnchor);
  
  let sortMenu = (
    <Menu anchorEl={sortMenuAnchor} open={isSortMenuOpen} onClose={closeSortMenu}>
      <MenuItem key='upload_date' onClick={handleSortMenu('upload_date')}>Most Recent</MenuItem>
      <MenuItem key='views' onClick={handleSortMenu('views')}>Most Views</MenuItem>
      <MenuItem key='likes' onClick={handleSortMenu('upvotes')}>Most Likes</MenuItem>
    </Menu>
  );

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Button variant="text" onClick={openSortMenu}>
          <Sort /><Typography className={classes.optionsTitle}>Sort</Typography>
        </Button>
      </div>
      <Divider/>
      <Typography variant="h5" className={classes.sectionTitle}>
        Uploaded Files
      </Typography>
      <div className={classes.itemsGrid}>
        {files.length > 0 ? files.map((fileInfo) => {
          let {file_id,title,mimetype,username} = fileInfo;
          return <ResultItemCard key={`file-${file_id}`}
            className={classes.resultItem}
            name={title}
            owner={username}
            result_type="files"
            mimetype={mimetype}
            id={file_id}
            variant="small"/>
        }) : 
          <Typography variant="h6">No Files</Typography>
        }
      </div>
      {sortMenu}
    </div>
  );
}

