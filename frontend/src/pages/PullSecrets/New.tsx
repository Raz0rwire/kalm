import { Grid } from "@material-ui/core";
import { createRegistryAction } from "actions/registries";
import { push } from "connected-react-router";
import { RegistryForm } from "forms/Registry";
import { BasePage } from "pages/BasePage";
import React, { FC } from "react";
import { useDispatch } from "react-redux";
import { newEmptyRegistry, RegistryFormType } from "types/registry";
import { H6 } from "widgets/Label";

const PullSecretsNewPageRaw: FC = () => {
  const dispatch = useDispatch();

  const submit = async (registryValue: RegistryFormType) => {
    await dispatch(createRegistryAction(registryValue));
    dispatch(push("/cluster/pull-secrets"));
  };

  return (
    <BasePage secondHeaderRight={<H6>{"Add Registry"}</H6>}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={12} md={8}>
          <RegistryForm onSubmit={submit} initial={newEmptyRegistry()} />
        </Grid>
      </Grid>
    </BasePage>
  );
};

export const PullSecretsNewPage = PullSecretsNewPageRaw;
