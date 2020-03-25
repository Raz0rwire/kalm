import { Chip, createStyles, IconButton, Paper, TextField, Theme, withStyles } from "@material-ui/core";
import { WithStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import CloseIcon from "@material-ui/icons/Close";
import { Autocomplete, AutocompleteProps, UseAutocompleteProps } from "@material-ui/lab";
import { replace } from "connected-react-router";
import debug from "debug";
import React, { RefObject } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { SearchAddon } from "xterm-addon-search";
import "xterm/css/xterm.css";
import { k8sWsPrefix } from "../../actions/kubernetesApi";
import { Breadcrumb } from "../../widgets/Breadcrumbs";
import { Loading } from "../../widgets/Loading";
import { ApplicationItemDataWrapper, WithApplicationsDataProps } from "./ItemDataWrapper";
import queryString from "query-string";

const logger = debug("ws");
const detailedLogger = debug("ws:details");

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}>
      {children}
    </Typography>
  );
}

const autocompleteStyles = (_theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
      "& .MuiFormControl-root": {
        width: "100%",
        margin: "12px 0"
      }
    }
  });

const MyAutocomplete = withStyles(autocompleteStyles)(
  (props: AutocompleteProps<string> & UseAutocompleteProps<string>) => {
    return <Autocomplete {...props} />;
  }
);

interface XtermProps extends WithStyles<typeof xtermStyles> {
  podName: string;
  show: boolean;
}

interface XtermState {
  showSearch: boolean;
  searchValue: string;
}

const xtermStyles = (theme: Theme) =>
  createStyles({
    root: {
      position: "relative",
      "& .terminal.xterm": {
        padding: 10
      }
    },
    searchArea: {
      position: "absolute",
      top: 0,
      right: 0,
      padding: theme.spacing(1),
      zIndex: 999,
      display: "flex",
      alignItems: "center",
      background: "#f1f1f1",
      borderBottomLeftRadius: "3px",
      "& .MuiInputBase-root": {
        background: "white",
        width: 250,
        marginRight: theme.spacing(1)
      }
    }
  });

class XtermRaw extends React.PureComponent<XtermProps, XtermState> {
  private myRef: RefObject<HTMLDivElement>;
  public xterm: Terminal;
  public fitAddon: FitAddon;
  public searchAddon: SearchAddon;
  private shown: boolean = false;

  private searchInputRef: React.RefObject<HTMLInputElement> = React.createRef();

  constructor(props: any) {
    super(props);
    this.myRef = React.createRef();
    this.xterm = new Terminal({
      cursorBlink: false,
      disableStdin: true,
      convertEol: true,
      fontSize: 12,
      theme: { selection: "rgba(255, 255, 72, 0.5)" }
    });

    this.fitAddon = new FitAddon();
    this.searchAddon = new SearchAddon();
    this.xterm.loadAddon(this.fitAddon);
    this.xterm.loadAddon(this.searchAddon);

    this.state = {
      showSearch: false,
      searchValue: ""
    };
  }

  componentDidUpdate(_prevProps: XtermProps, prevState: XtermState) {
    if (this.props.show) {
      if (!this.shown) {
        this.xterm.open(this.myRef.current!);
        this.shown = true;
      }

      this.fitAddon.fit();
    }

    if (!prevState.showSearch && this.state.showSearch) {
      this.searchInputRef.current!.focus();
      this.searchInputRef.current!.select();
    }
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.keyDownHander as any);
  }

  componentDidMount() {
    if (this.props.show) {
      this.shown = true;
      this.xterm.open(this.myRef.current!);
      this.fitAddon.fit();
    }

    window.addEventListener("keydown", this.keyDownHander as any);
  }

  keyDownHander = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!this.props.show) {
      return;
    }

    if (e.keyCode === 70 && (e.ctrlKey || e.metaKey)) {
      if (this.state.showSearch) {
        this.searchInputRef.current!.focus();
        this.searchInputRef.current!.select();
      } else {
        this.setState({ showSearch: true });
      }

      e.preventDefault();
    } else if (e.keyCode === 27) {
      this.setState({ showSearch: false });
    }
  };

  closeSearch = () => {
    this.setState({ showSearch: false });
  };

  renderSearchInput = () => {
    const { classes } = this.props;
    const { showSearch, searchValue } = this.state;

    if (!showSearch) {
      return null;
    }

    return (
      <div className={classes.searchArea}>
        <TextField
          autoFocus
          variant="outlined"
          placeholder="Search in terminal"
          size="small"
          onChange={this.onSearch}
          value={searchValue}
          onKeyDown={this.onSearchInputKeyDown}
          inputRef={this.searchInputRef}
        />
        <IconButton size="small" onClick={this.closeSearch}>
          <CloseIcon />
        </IconButton>
      </div>
    );
  };

  onSearchInputKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.keyCode === 13) {
      this.searchAddon.findNext(this.state.searchValue, { caseSensitive: false, incremental: false });
    } else if (e.keyCode === 27) {
      this.setState({ showSearch: false });
    }
  };

  onSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    this.setState({ searchValue: newValue });
    this.searchAddon.findNext(newValue, { caseSensitive: false, incremental: true });

    const selectionText = this.xterm.getSelection();
    if (selectionText.toLocaleLowerCase() !== newValue.toLocaleLowerCase()) {
      this.xterm.clearSelection();
    }
  };

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        {this.renderSearchInput()}
        <div ref={this.myRef} style={{ height: 700 }}></div>
      </div>
    );
  }
}

const Xterm = withStyles(xtermStyles)(XtermRaw);

interface Props extends WithApplicationsDataProps, WithStyles<typeof styles> {}

interface State {
  value: any;
  subscribedPodNames: Set<string>;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    paper: {
      padding: theme.spacing(2)
    }
  });

export class LogStream extends React.PureComponent<Props, State> {
  private ws: ReconnectingWebSocket;
  private wsQueueMessages: any[] = [];
  private terminals: Map<string, XtermRaw> = new Map();
  private initalizedFromQuery: boolean = false;

  constructor(props: Props) {
    super(props);

    this.state = {
      value: "",
      subscribedPodNames: new Set()
    };

    this.ws = this.connectWs();
  }

  private saveTerminal = (name: string, el: XtermRaw | null) => {
    if (el) {
      this.terminals.set(name, el);
    } else {
      this.terminals.delete(name);
    }
  };

  componentWillUnmount() {
    if (this.ws) {
      this.ws.close();
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { podNames } = this.props;

    if (
      prevState.subscribedPodNames.size !== this.state.subscribedPodNames.size ||
      this.state.value !== prevState.value
    ) {
      // save selected pods in query
      const search = {
        pods: this.state.subscribedPodNames.size > 0 ? Array.from(this.state.subscribedPodNames) : undefined,
        active: !!this.state.value ? this.state.value : undefined
      };

      this.props.dispatch(
        replace({
          search: queryString.stringify(search, { arrayFormat: "comma" })
        })
      );
    }

    if (podNames && !this.initalizedFromQuery) {
      // load selected pods from query, this is useful when first loaded.
      const queries = queryString.parse(window.location.search, { arrayFormat: "comma" }) as {
        pods: string[] | string | undefined;
        active: string | undefined;
      };
      let validPods: string[] = [];
      let validValue: string = "";

      if (queries.pods) {
        if (typeof queries.pods === "object") {
          validPods = queries.pods.filter(x => podNames.includes(x));
        } else {
          validPods = [queries.pods];
        }
      }

      if (queries.active) {
        validValue = podNames.includes(queries.active) ? queries.active : "";
      }

      if (this.state.value !== validValue) {
        this.setState({
          value: validValue
        });
      }

      if (this.state.subscribedPodNames.size !== validPods.length) {
        this.setState({
          subscribedPodNames: new Set(validPods)
        });
      }

      this.initalizedFromQuery = true;
    }
  }

  connectWs = () => {
    const ws = new ReconnectingWebSocket(`${k8sWsPrefix}/v1alpha1/logs`);

    ws.onopen = evt => {
      logger("WS Connection connected.");
      ws.send(
        JSON.stringify({
          type: "authStatus",
          requestId: "checkAuthStatus"
        })
      );
    };

    const afterWsAuthSuccess = () => {
      const { subscribedPodNames } = this.state;

      if (subscribedPodNames.size > 0) {
        Array.from(subscribedPodNames).forEach(this.subscribe);
      }

      while (this.wsQueueMessages.length > 0) {
        ws.send(this.wsQueueMessages.shift());
      }
    };

    ws.onmessage = evt => {
      detailedLogger("Received Message: " + evt.data);
      const data = JSON.parse(evt.data);

      if (data.type === "logStream") {
        const terminal = this.terminals.get(data.podName);
        if (terminal && terminal.xterm) {
          terminal.xterm.write(data.data);
        }
        return;
      }

      if (data.type === "podDisconnected") {
        const terminal = this.terminals.get(data.podName);
        if (terminal && terminal.xterm) {
          terminal.xterm.writeln(data.data);
          terminal.xterm.writeln("Please reload later");
        }
        return;
      }

      // TODO use more meaningful type
      if (data.type === "common") {
        if (data.requestId === "sendAuthToken" && data.status === 0) {
          afterWsAuthSuccess();
          return;
        }

        if (data.requestId === "checkAuthStatus") {
          if (data.status === -1) {
            ws.send(
              JSON.stringify({
                type: "auth",
                requestId: "sendAuthToken",
                authToken: window.localStorage.AUTHORIZED_TOKEN_KEY
              })
            );
          } else {
            afterWsAuthSuccess();
          }
        }
      }
    };

    ws.onclose = evt => {
      logger("WS Connection closed.");
    };

    return ws;
  };

  subscribe = (podName: string) => {
    logger("subscribe", podName);
    const { namespace } = this.props;
    this.sendOrQueueMessage(
      JSON.stringify({
        type: "subscribePodLog",
        requestID: "sub-" + podName,
        podName: podName,
        namespace: namespace
      })
    );
  };

  unsubscribe = (podName: string) => {
    const { namespace } = this.props;
    this.sendOrQueueMessage(
      JSON.stringify({
        type: "unsubscribePodLog",
        requestID: "sub-" + podName,
        podName: podName,
        namespace: namespace
      })
    );
  };

  sendOrQueueMessage = (msg: any) => {
    if (this.ws.readyState !== 1) {
      this.wsQueueMessages.push(msg);
    } else {
      this.ws.send(msg);
    }
  };

  onInputChange = (_event: React.ChangeEvent<{}>, x: string[]) => {
    const currentSet = new Set(x);
    const needSub = Array.from(currentSet).filter(x => !this.state.subscribedPodNames.has(x));
    const needUnsub = Array.from(this.state.subscribedPodNames).filter(x => !currentSet.has(x));
    const intersection = Array.from(currentSet).filter(x => this.state.subscribedPodNames.has(x));

    needSub.forEach(this.subscribe);
    needUnsub.forEach(this.unsubscribe);

    const { value } = this.state;
    let newValue = value;
    if (needUnsub.includes(value)) {
      if (needSub.length > 0) {
        newValue = needSub[0];
      } else if (intersection.length > 0) {
        newValue = intersection[0];
      } else {
        newValue = "";
      }
    } else if (value === "" && needSub.length > 0) {
      newValue = needSub[0];
    } else if (needSub.length === 1 && needUnsub.length === 0) {
      newValue = needSub[0];
    }

    this.setState({ subscribedPodNames: currentSet, value: newValue });
  };

  private renderInput() {
    const { podNames } = this.props;
    const { value, subscribedPodNames } = this.state;
    const names = podNames!.toArray().filter(x => !subscribedPodNames.has(x));

    return (
      <MyAutocomplete
        multiple
        id="tags-filled"
        options={names}
        onChange={this.onInputChange}
        value={Array.from(subscribedPodNames)}
        renderTags={(options: string[], getTagProps) =>
          options.map((option: string, index: number) => {
            return (
              <Chip
                variant="outlined"
                label={option}
                size="small"
                onClick={event => {
                  this.setState({ value: option });
                  event.stopPropagation();
                }}
                color={option === value ? "primary" : "default"}
                {...getTagProps({ index })}
              />
            );
          })
        }
        renderInput={params => (
          <TextField
            {...params}
            variant="outlined"
            label="Select the pod you want to view logs"
            size="small"
            placeholder="Select the pod you want to view logs"
          />
        )}
      />
    );
  }

  public render() {
    const { isLoading, application, classes } = this.props;
    const { value, subscribedPodNames } = this.state;

    return (
      <Paper elevation={2} classes={{ root: classes.paper }}>
        <Breadcrumb />
        {isLoading || !application ? (
          <Loading />
        ) : (
          <>
            {this.renderInput()}
            <div>
              {Array.from(subscribedPodNames).map(x => {
                return (
                  <TabPanel value={value} key={x} index={x}>
                    <Xterm innerRef={el => this.saveTerminal(x, el)} podName={x} show={value === x} />
                  </TabPanel>
                );
              })}
            </div>
          </>
        )}
      </Paper>
    );
  }
}

export const Log = withStyles(styles)(ApplicationItemDataWrapper(LogStream));