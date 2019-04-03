import React from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  ClickAwayListener,
  Grow,
  Paper,
  Popper,
  MenuItem,
  MenuList,
  IconButton,
  ListSubheader
} from '@material-ui/core';
import {
  Message
} from '@material-ui/icons';

const useStyles = makeStyles(theme => ({
  grow: {
    flexGrow: 1
  },
  root: {
    display: 'flex',
  },
  paper: {
    marginRight: theme.spacing.unit * 2,
  }
}));

function PreviousConversations() {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const anchorEl = React.useRef(null);

  const options = [
    'Example Message',
    'Another Example Message',
    'Last Example Message'
  ];

  function handleToggle() {
    setOpen(!open);
    if(open){
      
    }
  }

  function handleClose(event) {
    if (anchorEl.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  }

  function openConversation() {
  }

  return (
    <div className={classes.root}>
      <div>
        <IconButton
          buttonRef={anchorEl}
          aria-owns={open ? 'menu-list-grow' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          <Message/>
        </IconButton>
        <Popper open={open} anchorEl={anchorEl.current} transition disablePortal>
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              id="menu-list-grow"
              style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                <MenuList subheader={<ListSubheader component="li">Messages</ListSubheader>}>
                  {options.map(option => (
                    <MenuItem key={option} onClick={openConversation} >
                      {option}
                      <div className={classes.grow} />
                    </MenuItem>
                  ))}
                </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
    </div>
  );
}

export default PreviousConversations;
