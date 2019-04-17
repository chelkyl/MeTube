import React from 'react';
import classNames from 'classnames';
import { makeStyles, useTheme } from '@material-ui/styles';
import {
  unstable_useMediaQuery as useMediaQuery
} from '@material-ui/core/useMediaQuery';
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
  VideoLibrary,
  StarBorder
} from '@material-ui/icons';
import { Link } from 'react-router-dom';

let dimensions = {
  normal: {
    card: {
      w: 210,
      h: 205
    },
    media: {
      w: 210,
      h: 118
    },
    content: {
      w: 210,
      h: 85
    }
  },
  wide: {
    card: {
      w: '100%',
      h: 118
    },
    media: {
      w: 210,
      h: 118
    },
    content: {
      w: '100%',
      h: '100%'
    }
  }
}

const useStyles = makeStyles(theme => ({
  cardWrap: {
    width: dimensions.normal.card.w
  },
  card: {
    width: dimensions.normal.card.w,
    height: dimensions.normal.card.h,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  mediaWrap: {
    width: dimensions.normal.media.w,
    height: dimensions.normal.media.h
  },
  media: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.secondary
  },
  content: {
    height: dimensions.normal.content.h
  },

  cardWrapMed: {
    width: 210
  },
  cardMed: {
    width: 210,
    height: 205,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  mediaWrapMed: {
    width: 210,
    height: 118
  },
  mediaMed: {
    width: 210,
    height: 118,
    backgroundColor: theme.secondary
  },
  contentMed: {
    height: 85
  },

  cardWrapWide: {
    width: dimensions.wide.card.w
  },
  cardWide: {
    width: dimensions.wide.card.w,
    height: dimensions.wide.card.h,
    display: 'grid',
    gridTemplateColumns: '210px 1fr'
  },
  mediaWrapWide: {
    width: dimensions.wide.media.w,
    height: dimensions.wide.media.h
  },
  mediaWide: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.secondary
  },
  contentWide: {
    width: dimensions.wide.content.w
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '4em',
    color: theme.accentAlt
  },
  contentText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
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
      case 'favorites':
        return <StarBorder fontSize="inherit"/>;
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
  const theme = useTheme();
  const isMobileWidth = useMediaQuery(theme.breakpoints.down('xs')) || document.body.clientWidth < theme.breakpoints.values.xs;
  const { 
    className:propClass,
    variant,
    name,
    owner,
    id,
    result_type,
    mimetype,
    thumbnail,
    playlist_id
  } = props;

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

  let getRoute = (resultType, id, playlistID) => {
    if(resultType === 'favorites') {
      return `/channel/${id}/playlists/favorites`;
    }
    let extras = '';
    if(playlistID) extras = `?playlist=${playlistID}`;
    return `${getRouteFromResultType(resultType)}/${id}${extras}`;
  }
  
  let card = null; //FIXME: name and owner needs to be cutoff when too wide
  if(variant === 'small' || isMobileWidth) {
    card = (
      <Card className={classNames(propClass,classes.cardWrap)}>
        <CardActionArea className={classes.card} component={Link} to={getRoute(result_type,id,playlist_id)}>
          <div className={classes.mediaWrap}>
            <ResultItemThumbnail className={classes.media}
              {...{name, result_type, mimetype, thumbnail}}/>
          </div>
          <CardContent className={classes.content}>
            <Typography gutterBottom variant="subtitle1" className={classes.contentText}>{name}</Typography>
            <Typography gutterBottom variant="subtitle2" className={classes.contentText}>{owner}</Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    )
  }
  else if (variant === 'wide') {
    card = (
      <Card className={classNames(propClass,classes.cardWrapWide)}>
        <CardActionArea className={classes.cardWide} component={Link} to={getRoute(result_type,id,playlist_id)}>
          <div className={classes.mediaWrapWide}>
            <ResultItemThumbnail className={classes.mediaWide}
              {...{name, result_type, mimetype, thumbnail}}/>
          </div>
          <CardContent className={classes.contentWide}>
            <Typography gutterBottom variant="subtitle1" className={classes.contentText}>{name}</Typography>
            <Typography variant="subtitle2" className={classes.contentText}>{owner}</Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    )
  }
  
  return card;
}
