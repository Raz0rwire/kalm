import {
  createStyles,
  Link,
  Theme,
  Typography,
  withStyles,
  WithStyles
} from "@material-ui/core";
import { push, replace } from "connected-react-router";
import React, { Component } from "react";
import { connect, DispatchProp } from "react-redux";

interface NoMatchRawProps extends DispatchProp {}

class NoMatchRaw extends Component<NoMatchRawProps> {
  componentWillMount() {
    this.props.dispatch(replace("/404"));
  }

  render = () => null;
}

export const NoMatch = connect()(NoMatchRaw);

const styles = (theme: Theme) =>
  createStyles({
    root: {
      backgroundColor: "rgb(245, 245, 245);",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column"
    },
    title: {
      fontSize: 124
    },
    subTitle: {
      fontSize: 24
    }
  });

class Page404Raw extends Component<WithStyles<typeof styles> & DispatchProp> {
  private jumpToDashBoard = (event: React.MouseEvent) => {
    event.preventDefault();
    this.props.dispatch(push("/"));
  };

  render = () => {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <Typography variant="h1" className={classes.title}>
          404
        </Typography>
        <Typography variant="subtitle1" className={classes.subTitle}>
          Sorry but we could not find the page you are looking for
        </Typography>
        <Link href="" onClick={this.jumpToDashBoard}>
          Go back to dashboard
        </Link>
      </div>
    );
  };
}

export const Page404 = connect()(withStyles(styles)(Page404Raw));
