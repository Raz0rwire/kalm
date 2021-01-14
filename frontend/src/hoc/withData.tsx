import { loadApplicationsAction } from "actions/application";
import {
  loadCertificateAcmeServerAction,
  loadCertificateIssuersAction,
  loadCertificatesAction,
} from "actions/certificate";
import { loadClusterInfoAction, loadCurrentTenantInfoAction, loadExtraInfoAction } from "actions/cluster";
import { loadDeployAccessTokensAction } from "actions/deployAccessToken";
import { loadDomainsAction } from "actions/domains";
import { loadNodesAction } from "actions/node";
import { setErrorNotificationAction } from "actions/notification";
import { loadPersistentVolumesAction, loadStorageClassesAction } from "actions/persistentVolume";
import { loadRegistriesAction } from "actions/registries";
import { loadRoutesAction } from "actions/routes";
import { loadServicesAction } from "actions/service";
import { loadProtectedEndpointAction, loadSSOConfigAction } from "actions/sso";
import { loadRoleBindingsAction } from "actions/user";
import { getWebsocketInstance } from "actions/websocket";
import { generateKalmImpersonation } from "api/api";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import throttle from "lodash/throttle";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { getHasSelectedTenant } from "selectors/tenant";
import { TDispatchProp } from "types";
import { AccessTokenToDeployAccessToken } from "types/deployAccessToken";
import {
  ResourceActionType,
  RESOURCE_TYPE_ACME_SERVER,
  RESOURCE_TYPE_APPLICATION,
  RESOURCE_TYPE_COMPONENT,
  RESOURCE_TYPE_DEPLOY_ACCESS_TOKEN,
  RESOURCE_TYPE_DOMAIN,
  RESOURCE_TYPE_HTTPS_CERT,
  RESOURCE_TYPE_HTTP_ROUTE,
  RESOURCE_TYPE_NODE,
  RESOURCE_TYPE_PROTECTED_ENDPOINT,
  RESOURCE_TYPE_REGISTRY,
  RESOURCE_TYPE_ROLE_BINDING,
  RESOURCE_TYPE_SERVICE,
  RESOURCE_TYPE_SSO,
  RESOURCE_TYPE_VOLUME,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";

export interface WatchResMessage {
  namespace: string;
  kind: string;
  action: ResourceActionType;
  data: any;
}

const mapStateToProps = (state: RootState) => {
  const hasSelectedTenant = getHasSelectedTenant(state);

  return {
    hasSelectedTenant,
  };
};

interface Props extends ReturnType<typeof mapStateToProps>, TDispatchProp, WithUserAuthProps {}

class WithDataRaw extends React.PureComponent<Props> {
  public componentDidMount() {
    if (!this.props.hasSelectedTenant) {
      return;
    }

    this.loadData();
    this.connectWebsocket();
  }

  private loadData() {
    const { dispatch, canViewTenant, canEditTenant, canViewCluster, canManageTenant } = this.props;

    dispatch(loadExtraInfoAction());
    dispatch(loadRoutesAction()); // all namespaces
    dispatch(loadApplicationsAction());
    dispatch(loadDeployAccessTokensAction());
    dispatch(loadProtectedEndpointAction());

    if (canViewTenant()) {
      dispatch(loadCertificatesAction());
      dispatch(loadRegistriesAction());
      dispatch(loadServicesAction("")); // for routes destinations
      dispatch(loadPersistentVolumesAction());
      dispatch(loadStorageClassesAction());
      dispatch(loadDomainsAction());
    }

    if (canEditTenant()) {
      dispatch(loadCurrentTenantInfoAction());
    }

    if (canManageTenant()) {
      dispatch(loadRoleBindingsAction());
    }

    if (canViewCluster()) {
      dispatch(loadCertificateIssuersAction());
      dispatch(loadCertificateAcmeServerAction());
      dispatch(loadSSOConfigAction());
      dispatch(loadNodesAction());
      dispatch(loadClusterInfoAction());
    }
  }

  private connectWebsocket() {
    const { dispatch, authToken, impersonation, impersonationType, canViewTenant } = this.props;
    const rws = getWebsocketInstance();
    rws.addEventListener("open", () => {
      const message = {
        method: "StartWatching",
        token: authToken,
        impersonation: generateKalmImpersonation(impersonation, impersonationType),
      };
      rws.send(JSON.stringify(message));
    });

    const reloadResources = () => {
      if (canViewTenant()) {
        dispatch(loadPersistentVolumesAction()); // is in use can't watch
        dispatch(loadServicesAction("")); // for routes destinations
      }
    };

    const throttledReloadResouces = throttle(reloadResources, 10000, { leading: true, trailing: true });

    rws.onmessage = async (event: any) => {
      const data: WatchResMessage = JSON.parse(event.data);

      switch (data.kind) {
        case "error": {
          dispatch(setErrorNotificationAction(data.data));
          break;
        }
        case RESOURCE_TYPE_APPLICATION: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_APPLICATION,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_COMPONENT: {
          throttledReloadResouces();
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_COMPONENT,
            payload: {
              namespace: data.namespace,
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_HTTP_ROUTE: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_HTTP_ROUTE,
            payload: {
              namespace: data.namespace,
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_NODE: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_NODE,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_HTTPS_CERT: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_HTTPS_CERT,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_REGISTRY: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_REGISTRY,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_VOLUME: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_VOLUME,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_SSO: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_SSO,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_PROTECTED_ENDPOINT: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_PROTECTED_ENDPOINT,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_DEPLOY_ACCESS_TOKEN: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_DEPLOY_ACCESS_TOKEN,
            payload: {
              action: data.action,
              data: AccessTokenToDeployAccessToken(data.data),
            },
          });
          break;
        }
        case RESOURCE_TYPE_SERVICE: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_SERVICE,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_ROLE_BINDING: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_ROLE_BINDING,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_ACME_SERVER: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_ACME_SERVER,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_DOMAIN: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_DOMAIN,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
      }
    };
  }

  public render() {
    return null;
  }
}

export const WithData = withUserAuth(connect(mapStateToProps)(WithDataRaw));
