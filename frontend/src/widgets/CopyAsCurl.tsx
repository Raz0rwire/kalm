import { Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { setSuccessNotificationAction } from "actions/notification";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { HttpRoute } from "types/route";
import { isPrivateIP } from "utils/ip";
import copy from "copy-to-clipboard";
import { CopyIcon } from "./Icon";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {
    clusterInfo: state.get("cluster").get("info"),
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  route: HttpRoute;
  showIconButton?: boolean;
  host?: string;
}

class CopyAsCurlRaw extends React.PureComponent<Props> {
  private buildCurlCommand = (scheme: string, host: string, path: string, method: string) => {
    const { clusterInfo } = this.props;
    let extraArgs: string[] = [];
    if (isPrivateIP(clusterInfo.get("ingressIP"))) {
      if (scheme === "https") {
        if (!host.includes(":")) {
          host = host + ":" + clusterInfo.get("httpsPort");
        }
        extraArgs.push(`-k`);
      } else {
        if (!host.includes(":")) {
          extraArgs.push(`-H "Host: ${host}"`);
          host = host + ":" + clusterInfo.get("httpPort");
        }
      }
      extraArgs.push(`--resolve ${host}:${clusterInfo.get("ingressIP")}`);
    }
    const url = `${scheme}://${host}${path}`;
    return `curl -v -X ${method}${extraArgs.map((x) => " " + x).join("")} ${url}`;
  };

  private copyAsCurl = () => {
    const { dispatch, route, host } = this.props;

    const scheme = route.get("schemes").first("http");
    const hostValue = host ?? route.get("hosts").first("");

    const path = route.get("paths").first("/");
    const method = route.get("methods").first("GET");

    copy(this.buildCurlCommand(scheme, hostValue, path, method));
    dispatch(setSuccessNotificationAction("Copied successful!"));
  };

  public render() {
    const { showIconButton } = this.props;
    if (showIconButton) {
      return (
        <IconButtonWithTooltip
          size={"small"}
          tooltipTitle="Copy As Curl"
          onClick={this.copyAsCurl}
          style={{ marginLeft: 8 }}
        >
          <CopyIcon fontSize={"small"} />
        </IconButtonWithTooltip>
      );
    }

    return (
      <Button size="small" variant="outlined" onClick={this.copyAsCurl} style={{ marginLeft: 16 }}>
        Copy as curl
      </Button>
    );
  }
}

export const CopyAsCurl = withStyles(styles)(connect(mapStateToProps)(CopyAsCurlRaw));
