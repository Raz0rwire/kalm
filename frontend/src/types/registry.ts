export const UPDATE_REGISTRY = "UPDATE_REGISTRY";

export const PublicRegistriesList = [
  "docker.io",
  "gcr.io",
  "k8s.gcr.io",
  "us.gcr.io",
  "eu.gcr.io",
  "asia.gcr.io",
  "quay.io",
];

interface RepositoryTag {
  name: string;
  manifest: string;
  timeCreatedMs: string;
  timeUploadedMs: string;
}

export interface Repository {
  name: string;
  tags: RepositoryTag[];
}

export interface Registry {
  name: string;
  username: string;
  password: string;
  host: string;
  poolingIntervalSeconds: number;
  authenticationVerified: boolean;
  repositories: Repository[];
}

export interface RegistryFormType {
  name: string;
  username: string;
  password: string;
  host: string;
}

export const newEmptyRegistry = (): RegistryFormType => {
  return {
    name: "",
    username: "",
    password: "",
    host: "",
  };
};
interface UpdateRegistryAction {
  type: typeof UPDATE_REGISTRY;
  payload: {
    registry: Registry;
  };
}

export type RegistriesActions = UpdateRegistryAction;
