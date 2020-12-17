import { Box } from "@material-ui/core";
import { setSuccessNotificationAction } from "actions/notification";
import { createRouteAction } from "actions/routes";
import { push } from "connected-react-router";
import { RouteForm } from "forms/Route";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { AllHttpMethods, HttpRoute, methodsModeAll, newEmptyRouteForm } from "types/route";
import { BasePage } from "../BasePage";

const mapStateToProps = (state: RootState) => {
  return {
    domains: state.domains.domains,
  };
};
interface Props extends WithNamespaceProps, ReturnType<typeof mapStateToProps> {}

class RouteNewRaw extends React.PureComponent<Props> {
  private onSubmit = async (route: HttpRoute) => {
    const { dispatch } = this.props;

    try {
      if (route.methodsMode === methodsModeAll) {
        route.methods = AllHttpMethods;
      }

      await dispatch(createRouteAction(route));
      await dispatch(setSuccessNotificationAction("Create route successfully"));
      dispatch(push("/routes"));
    } catch (e) {
      console.log(e);
    }
  };
  private getDefaultDomain = () => {
    const { domains } = this.props;
    let targetDomain = "";
    if (domains.length === 1) {
      targetDomain = domains[0].domain;
    }
    // TODO: how about more than one domains or more than one wildcards domains?
    // if (domains.length > 1) {
    //   domains.forEach((d) => {
    //     targetDomain = d.domain;
    //   });
    // }

    return targetDomain;
  };

  public render() {
    const defaultDomain = this.getDefaultDomain();
    return (
      <BasePage>
        <Box p={2}>
          <RouteForm onSubmit={this.onSubmit} initial={newEmptyRouteForm(defaultDomain)} />
        </Box>
      </BasePage>
    );
  }
}

export const RouteNewPage = withNamespace(connect(mapStateToProps)(RouteNewRaw));
