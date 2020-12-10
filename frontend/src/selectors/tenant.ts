import { RootState } from "reducers";

export const getHasSelectedTenant = (state: RootState) => {
  return state.auth.tenant.length > 0;
};

export const getUserEmail = (state: RootState) => {
  return state.auth.email;
};

export const getUserAvatar = (state: RootState) => {
  return state.auth.avatarUrl;
};

export const isSameTenant = (tenantName: string, clusterTenantName: string) => {
  return tenantName === clusterTenantName || clusterTenantName.includes(tenantName);
};

const kTenantIdPlaceholder = "__TENANTID__";
const kTenantLinkTemplate = `https://${kTenantIdPlaceholder}.asia-northeast3.kapp.live/`;

export const composeTenantLink = (clusterTenantName: string) => {
  if (clusterTenantName.includes("/")) {
    const tenantId = clusterTenantName.split("/")[1];
    return kTenantLinkTemplate.replace(kTenantIdPlaceholder, tenantId);
  } else {
    return kTenantLinkTemplate.replace(kTenantIdPlaceholder, clusterTenantName);
  }
};
