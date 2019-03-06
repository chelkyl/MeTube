import React from 'react';
import PropTypes from 'prop-types';
import {
  TextField
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit
  }
});

class TextInput extends React.Component {
  constructor(props) {
    super(props);
    const { classes, handleChange, ...passProps} = props;
    this.passProps = passProps;
  }

  handleChange = (e) => {
    this.props.handleChange(this.props.id, e.currentTarget.value);
  }

  render() {
    const { classes } = this.props;

    return <TextField className={classes.textField} {...this.passProps} onChange={this.handleChange} />;
  }
}

TextInput.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(TextInput);
