import React from 'react';
import PropTypes from 'prop-types';
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
  Message,
  Delete
} from '@material-ui/icons';
import { withStyles } from '@material-ui/core/styles';

const options = [
  'Example Message',
  'Another Example Message',
  'Last Example Message'
];

const styles = theme => ({
  root: {
    display: 'flex',
  },
  grow: {
    flexGrow: 1
  },
  paper: {
    marginRight: theme.spacing.unit * 2,
  },
});

class PreviousMessagesList extends React.Component {
  state = {
    open: false,
  };

  deleteMessage = () => {
  };

  handleToggle = () => {
    this.setState(state => ({ open: !state.open }));
  };

  handleClose = event => {
    if (this.anchorEl.contains(event.target)) {
      return;
    }

    this.setState({ open: false });
  };

  render() {
    const { classes } = this.props;
    const { open } = this.state;

    return (
      <div className={classes.root}>
        <div>
          <IconButton
            buttonRef={node => {
              this.anchorEl = node;
            }}
            aria-label="More"
            aria-owns={open ? 'menu-list-grow' : undefined}
            aria-haspopup="true"
            onClick={this.handleToggle}
          >
            <Message/>
          </IconButton>
          <Popper open={open} anchorEl={this.anchorEl} transition disablePortal>
            {({ TransitionProps, placement }) => (
              <Grow
                {...TransitionProps}
                id="menu-list-grow"
                style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
              >
                <Paper>
                  <ClickAwayListener onClickAway={this.handleClose}>
                    <MenuList subheader={<ListSubheader component="div">Messages</ListSubheader>}>
                      {options.map(option => (
                        <MenuItem key={option} onClick={this.handleClose} >
                          {option}
                          <div className={classes.grow} />
                          <IconButton onClick={this.deleteMessage} >
                            <Delete/>
                          </IconButton>
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
}

PreviousMessagesList.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(PreviousMessagesList);
