import React from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
} from '@material-ui/core';
import {
  Book,
  PermIdentity,
  OndemandVideo,
  MusicVideo,
  Photo,
  VideoLibrary
} from '@material-ui/icons';
import { Link } from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  card: {
    width: 210,
    height: 205,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  media: {
    width: 210,
    height: 110,
    backgroundColor: theme.secondary
  },
  content: {
    height: 85
  },
  cardWide: {
    width: '100%',
    height: 100,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'start'
  },
  mediaWide: {
    width: 210,
    height: 110,
    backgroundColor: theme.secondary
  },
  contentWide: {
    width: '100%'
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '4em',
    color: theme.accentAlt
  }
}));

function ResultItemThumbnail(props) {
  const classes = useStyles();
  const {className:propClass, thumbnail, name, result_type, mimetype} = props;

  let getIconFromMimetype = (mime) => {
    if(mime.includes('video')) return <OndemandVideo fontSize="inherit"/>;
    if(mime.includes('audio')) return <MusicVideo fontSize="inherit"/>;
    if(mime.includes('image')) return <Photo fontSize="inherit"/>;
    return <Book fontSize="inherit"/>;
  };
  let getIconPlaceholder = (type) => {
    switch(type) {
      case 'users':
        return <PermIdentity fontSize="inherit"/>;
      case 'playlists':
        return <VideoLibrary fontSize="inherit"/>;
      case 'files':
        return getIconFromMimetype(mimetype);
      default:
        return;
    }
  };

  if(thumbnail) {
    return (
      <CardMedia className={propClass}
        title={name}
        image={thumbnail}/>
    );
  }
  else {
    return (
      <div className={propClass}>
        <div className={classes.thumbnailPlaceholder}>
          {getIconPlaceholder(result_type)}
        </div>
      </div>
    );
  }
}

export default function ResultItemCard(props) {
  const classes = useStyles();
  const { 
    className:propClass,
    variant,
    name,
    owner,
    id,
    result_type,
    mimetype,
    thumbnail
  } = props;

  let card = null;
  let getRouteFromResultType = (type) => {
    switch(type) {
      case 'users':
        return '/channel';
      case 'playlists':
        return '/playlist';
      case 'files':
      default:
        return '/view';
    }
  };
  switch(variant) {
    case 'wide':
      card = (
        <Card className={propClass}>
          <CardActionArea className={classes.cardWide} component={Link} to={`${getRouteFromResultType(result_type)}/${id}`}>
            <ResultItemThumbnail className={classes.mediaWide}
              {...{name, result_type, mimetype, thumbnail}}/>
            <CardContent className={classes.contentWide}>
              <Typography gutterBottom variant="subtitle1">{name}</Typography>
              <Typography variant="subtitle2">{owner}</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      )
      break;
    case 'small':
    default:
      card = (
        <Card>
          <CardActionArea className={classes.card} component={Link} to={`${getRouteFromResultType(result_type)}/${id}`}>
            <ResultItemThumbnail className={classes.media}
                {...{name, result_type, mimetype, thumbnail}}/>
            <CardContent className={classes.content}>
              <Typography gutterBottom variant="subtitle1">{name}</Typography>
              <Typography gutterBottom variant="subtitle2">{owner}</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      )
      break;
  }
  return card;
}
