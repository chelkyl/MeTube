import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';

const styles = theme => ({
  card: {
    width: 210,
    height: 205
  },
  media: {
    width: 210,
    height: 110
  }
});

class FileItemCard extends React.Component {
  render() {
    const { classes, name, owner, file_id } = this.props;

    return (
      <Card className={classes.card}>
        <CardActionArea component={Link} to={`/file/${file_id}`}>
          <CardMedia className={classes.media}
            title={name}/>
          <CardContent>
            <Typography gutterBottom variant="subtitle1">
              {name}
            </Typography>
            <Typography gutterBottom variant="subtitle2">
              {owner}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }
}

FileItemCard.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(FileItemCard);
