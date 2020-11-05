import { CallHistoryMethodAction } from "connected-react-router";
import { VariantType } from "notistack";
import { SettingObject } from "reducers/settings";
import { LoginStatus } from "./authorization";
import { NamespaceActions } from "./namespace";

export const LOAD_LOGIN_STATUS_PENDING = "LOAD_LOGIN_STATUS_PENDING";
export const LOAD_LOGIN_STATUS_FULFILLED = "LOAD_LOGIN_STATUS_FULFILLED";
export const LOAD_LOGIN_STATUS_FAILED = "LOAD_LOGIN_STATUS_FAILED";
export const SET_AUTH_TOKEN = "SET_AUTH_TOKEN";
export const SET_AUTH_METHODS = "SET_AUTH_METHODS";
export const LOGOUT = "LOGOUT";

export const SET_NOTIFICATION_MESSAGE = "SET_NOTIFICATION_MESSAGE";
export const SET_SETTINGS = "SET_SETTINGS";

export const INIT_CONTROLLED_DIALOG = "INIT_CONTROLLED_DIALOG";
export const DESTROY_CONTROLLED_DIALOG = "DESTROY_CONTROLLED_DIALOG";
export const OPEN_CONTROLLED_DIALOG = "OPEN_CONTROLLED_DIALOG";
export const CLOSE_CONTROLLED_DIALOG = "CLOSE_CONTROLLED_DIALOG";
export const CLEAR_CONTROLLED_DIALOG_DATA = "CLEAR_CONTROLLED_DIALOG_DATA";

export const EnvTypeExternal = "external";
export const EnvTypeStatic = "static";
export const EnvTypeLinked = "linked";

export type ControlledDialogParams<T> = {
  open: boolean;
  data: T;
};

export type MetricItem = {
  x: number;
  y: number;
};

export type MetricList = MetricItem[];

export type Metrics = {
  isMetricServerEnabled: boolean;
  cpu: MetricList;
  memory: MetricList;
};

export const StatusTypeRunning = "RUNNING";
export const StatusTypePending = "PENDING";
export const StatusTypeCreating = "CREATING";
export const StatusTypeError = "Error";

export type Status =
  | typeof StatusTypeRunning
  | typeof StatusTypePending
  | typeof StatusTypeCreating
  | typeof StatusTypeError;

export interface SetNotificationMessageAction {
  type: typeof SET_NOTIFICATION_MESSAGE;
  payload: {
    message: string;
    variant: VariantType;
  };
}

export interface SetSettingsAction {
  type: typeof SET_SETTINGS;
  payload: Partial<SettingObject>;
}

export interface InitControlledDialogAction {
  type: typeof INIT_CONTROLLED_DIALOG;
  payload: {
    dialogID: string;
  };
}

export interface DestroyControlledDialogAction {
  type: typeof DESTROY_CONTROLLED_DIALOG;
  payload: {
    dialogID: string;
  };
}

export interface OpenControlledDialogAction {
  type: typeof OPEN_CONTROLLED_DIALOG;
  payload: {
    dialogID: string;
    data: any;
  };
}

export interface CloseControlledDialogAction {
  type: typeof CLOSE_CONTROLLED_DIALOG;
  payload: {
    dialogID: string;
  };
}

export interface ClearControlledDialogAction {
  type: typeof CLEAR_CONTROLLED_DIALOG_DATA;
  payload: {
    dialogID: string;
  };
}

export interface LoadLoginStatusAction {
  type: typeof LOAD_LOGIN_STATUS_FULFILLED;
  payload: {
    loginStatus: LoginStatus;
  };
}

export interface SetAuthTokenAction {
  type: typeof SET_AUTH_TOKEN;
  payload: {
    token: string;
  };
}

export interface LogoutAction {
  type: typeof LOGOUT;
}

export interface LoadStatusAction {
  type: typeof LOAD_LOGIN_STATUS_FAILED | typeof LOAD_LOGIN_STATUS_PENDING;
}

export interface PermissionMethods {
  can: (action: string, scope: string, object: string) => boolean;

  canView: (scope: string, resource: string) => boolean;
  canEdit: (scope: string, resource: string) => boolean;
  canManage: (scope: string, resource: string) => boolean;

  canViewNamespace: (scope: string) => boolean;
  canEditNamespace: (scope: string) => boolean;
  canManageNamespace: (scope: string) => boolean;

  canViewTenant: () => boolean;
  canEditTenant: () => boolean;
  canManageTenant: () => boolean;

  canEditAnyNamespace: () => boolean;

  canViewCluster: () => boolean;
  canEditCluster: () => boolean;
  canManageCluster: () => boolean;
}

export const emptyPermissionMethods: PermissionMethods = {
  can: (action: string, scope: string, object: string) => false,

  canView: (scope: string, resource: string) => false,
  canEdit: (scope: string, resource: string) => false,
  canManage: (scope: string, resource: string) => false,

  canViewNamespace: (scope: string) => false,
  canEditNamespace: (scope: string) => false,
  canManageNamespace: (scope: string) => false,

  canViewCluster: () => false,
  canEditCluster: () => false,
  canManageCluster: () => false,

  canViewTenant: () => false,
  canEditTenant: () => false,
  canManageTenant: () => false,

  canEditAnyNamespace: () => false,
};

export interface SetAuthMethodsAction {
  type: typeof SET_AUTH_METHODS;
  payload: PermissionMethods;
}

export type CommonActions =
  | LogoutAction
  | LoadStatusAction
  | SetAuthTokenAction
  | LoadLoginStatusAction
  | SetNotificationMessageAction
  | CallHistoryMethodAction
  | SetSettingsAction
  | InitControlledDialogAction
  | DestroyControlledDialogAction
  | OpenControlledDialogAction
  | CloseControlledDialogAction
  | ClearControlledDialogAction
  | NamespaceActions
  | SetAuthMethodsAction;
