import React from "react";
import clsx from "clsx";
import {
  createStyles,
  makeStyles,
  useTheme,
  Theme
} from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import CssBaseline from "@material-ui/core/CssBaseline";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Icon from "@material-ui/core/Icon";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import InstallPage from "./pages/Install";
import { Sidenav, SidenavGroupProps } from "./widgets/Sidenav";

const sidenavGroups: SidenavGroupProps[] = [
  {
    text: "Application",
    items: [
      {
        text: "Application",
        items: [
          {
            text: "Overview",
            to: "/apps",
            icon: "reorder",
            type: "normal"
          },
          {
            text: "Add",
            to: "/apps/new",
            icon: "add",
            type: "normal"
          }
        ],
        type: "dropdown",
        icon: "apps"
      },
      {
        text: "Plugins",
        items: [
          {
            text: "Overview",
            to: "/plugins",
            icon: "reorder",
            type: "normal"
          },
          {
            text: "Add",
            to: "/plugins/new",
            icon: "add",
            type: "normal"
          }
        ],
        type: "dropdown",
        icon: "library_add"
      }
    ]
  },
  {
    text: "Monitoring",
    items: [
      {
        text: "Nodes",
        to: "/monitoring/node",
        type: "normal",
        icon: "settings"
      }
    ]
  },
  {
    text: "Settings",
    items: [
      {
        text: "Install",
        to: "/install",
        type: "normal",
        icon: "settings"
      }
    ]
  }
];

const drawerWidth = 280;

const useStyles = makeStyles((theme: Theme) => {
  return createStyles({
    root: {
      display: "flex"
    },
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
      transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      })
    },
    appBarShift: {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    menuButton: {
      marginRight: 24
    },
    hide: {
      display: "none"
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
      whiteSpace: "nowrap"
    },
    drawerOpen: {
      width: drawerWidth,
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    drawerClose: {
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      }),
      overflowX: "hidden",
      width: theme.spacing(7) + 1,
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9) + 1
      }
    },
    paper: {
      color: "white",
      backgroundColor: "#2e323d",
      border: 0
    },
    list: {
      paddingTop: 0,
      paddingBottom: 0
    },
    listItemSelected: {
      backgroundColor: "#039be5 !important"
    },
    listItemGutters: {
      [theme.breakpoints.up("sm")]: {
        paddingLeft: 24,
        paddingRight: 24
      }
    },
    listItemIcon: {
      color: "white"
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: theme.spacing(0, 3),
      background: "#1e2129",
      color: "white",
      ...theme.mixins.toolbar
    },
    toolbarTitle: {
      display: "flex",
      alignItems: "center"
    },
    toolbarTitleImg: {
      marginRight: 6
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3)
    },
    nested: {
      paddingLeft: theme.spacing(4)
    }
  });
});

export default function MiniDrawer() {
  const theme = useTheme();
  const classes = useStyles(theme);
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  console.log(classes);
  return (
    <Router>
      <div className={classes.root}>
        <CssBaseline />
        <AppBar
          position="fixed"
          className={clsx(classes.appBar, {
            [classes.appBarShift]: open
          })}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              className={clsx(classes.menuButton, {
                [classes.hide]: open
              })}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              Mini variant drawer
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          className={clsx(classes.drawer, {
            [classes.drawerOpen]: open,
            [classes.drawerClose]: !open
          })}
          classes={{
            paper: clsx({
              [classes.drawerOpen]: open,
              [classes.drawerClose]: !open
            })
          }}
          PaperProps={{ className: classes.paper }}
        >
          <div className={classes.toolbar}>
            <div className={classes.toolbarTitle}>
              <img
                src="http://via.placeholder.com/24x24"
                className={classes.toolbarTitleImg}
                alt="logo"
              />
              Name PLaceholder
            </div>

            <IconButton onClick={handleDrawerClose} color="inherit">
              <Icon color="inherit">chevron_left_icon</Icon>
            </IconButton>
          </div>
          <Sidenav groups={sidenavGroups} isFolded={!open} />
        </Drawer>
        <main className={classes.content}>
          <div className={classes.content}></div>
          <Switch>
            <Route exact path="/install">
              <InstallPage />
            </Route>
            <Route exact path="/1">
              <Typography paragraph>
                Consequat mauris nunc congue nisi vitae suscipit. Fringilla est
                ullamcorper eget nulla facilisi etiam dignissim diam. Pulvinar
                elementum integer enim neque volutpat ac tincidunt. Ornare
                suspendisse sed nisi lacus sed viverra tellus. Purus sit amet
                volutpat consequat mauris. Elementum eu facilisis sed odio
                morbi. Euismod lacinia at quis risus sed vulputate odio. Morbi
                tincidunt ornare massa eget egestas purus viverra accumsan in.
                In hendrerit gravida rutrum quisque non tellus orci ac.
                Pellentesque nec nam aliquam sem et tortor. Habitant morbi
                tristique senectus et. Adipiscing elit duis tristique
                sollicitudin nibh sit. Ornare aenean euismod elementum nisi quis
                eleifend. Commodo viverra maecenas accumsan lacus vel facilisis.
                Nulla posuere sollicitudin aliquam ultrices sagittis orci a.
              </Typography>
            </Route>
          </Switch>
        </main>
      </div>
    </Router>
  );
}
