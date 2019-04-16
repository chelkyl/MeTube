import React, {useState, useEffect} from 'react';
import {makeStyles} from '@material-ui/styles';
import {
  Typography,
  Divider,
  Menu,
  MenuItem,
  Button,
  InputBase,
  // Checkbox
} from '@material-ui/core';
import {
  Sort
} from '@material-ui/icons';
import Api from '../apiclient';
import { getAuthenticatedUserID } from '../authutils';
import { basicRequestCatch } from '../utils';
import {useAuthCtx} from '../authentication';
import ResultItemCard from '../components/resultItemCard';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  grow: {
    flexGrow: 1
  },
  optionsTitle: {
    fontSize: 15,
    fontWeight: theme.typography.fontWeightRegular,
    marginLeft: theme.spacing.unit
  },
  sectionTitle: {
    marginBottom: 4
  },
  inputRoot: {
    color: 'inherit'
  },
  inputInput: {
    padding: theme.spacing.unit,
    paddingRight: 0
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, 210px)',
    gridColumnGap: theme.spacing.unit,
    gridRowGap: theme.spacing.unit,
    paddingTop: theme.spacing.unit
  },
  resultItem: {
    marginBottom: theme.spacing.unit
  }
}));

export default function ChannelContactsPage(props) {
  const classes = useStyles();
  const [contacts, setContactsInfo] = useState([]);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [searchQuery,setSearchQuery] = useState('');
  let {userID} = props;
  const [isLoggedIn] = useAuthCtx();
  let canView = isLoggedIn && userID === getAuthenticatedUserID();
  // let canEdit = canView;
  let searchTimer = null;
  let cancel = false;

  let doSearch = () => {
    Api.getData(`users/${userID}/contacts`,searchQuery)
      .then(res => {
        console.log('contacts get',res);
        if(cancel) return;
        setContactsInfo(res.data.response);
      })
      .catch(err => {
        basicRequestCatch('contacts get')(err);
      });
  };

  useEffect(() => {
    if(canView) {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(doSearch, 800);
    }

    return () => {
      cancel = true;
    };
  }, [searchQuery]);

  let handleSearchChange = (e) => {
    setSearchQuery(e.currentTarget.value);
  };
  let catchSearchEnter = (e) => {
    if(e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(searchTimer);
      doSearch();
    }
  }

  let openSortMenu = (e) => {
    setSortMenuAnchor(e.target);
  };
  let closeSortMenu = (e) => {
    setSortMenuAnchor(null);
  };
  let handleSortMenu = (key) => (e) => {
    let sorter = {
      column: key,
      descending: true
    };
    Api.getData(`users/${userID}/contacts`,searchQuery,null,[sorter])
      .then(res => {
        console.log('contacts get',res);
        if(!cancel) setContactsInfo(res.data.response);
      })
      .catch(basicRequestCatch('contacts get'));
    closeSortMenu();
  };

  let isSortMenuOpen = Boolean(sortMenuAnchor);
  
  let sortMenu = (
    <Menu anchorEl={sortMenuAnchor} open={isSortMenuOpen} onClose={closeSortMenu}>
      <MenuItem key='name' onClick={handleSortMenu('username')}>Username</MenuItem>
      <MenuItem key='subscribers' onClick={handleSortMenu('subscribed')}>Most Subscribers</MenuItem>
    </Menu>
  );

  return (
    <div className={classes.container}>
      {canView ? (
        <>
          <div className={classes.header}>
            <Typography variant="h5" className={classes.sectionTitle}>
              Contacts
            </Typography>
            <div className={classes.grow} />
            <InputBase placeholder="Search..." classes={{
                root: classes.inputRoot,
                input: classes.inputInput
              }}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={catchSearchEnter}/>
            <Button variant="text" onClick={openSortMenu}>
              <Sort /><Typography className={classes.optionsTitle}>Sort</Typography>
            </Button>
          </div>
          <Divider/>
          <div className={classes.itemsGrid}>
            {contacts.length !== 0 ? contacts.map((contactInfo) => {
              let {contacted_id,username} = contactInfo;
              console.log(contactInfo);
              return (
                <ResultItemCard key={`user-${contacted_id}`}
                  className={classes.resultItem}
                  name={username}
                  owner={username}
                  result_type="users"
                  id={contacted_id}
                  variant="small"/>
              );
            }) : <Typography variant="h6">No Contacts</Typography>
            }
          </div>
          {sortMenu}
        </>
      ) : (
        <Typography variant="h6">Private Content</Typography>
      )}
    </div>
  );
}

