import React from "react";
import { FormControlLabel, Grid } from "@material-ui/core";
import { TDispatchProp } from "types";
import { withSSO, WithSSOProps } from "hoc/withSSO";
import { Field, FieldRenderProps } from "react-final-form";
import { Loading } from "widgets/Loading";
import { Alert } from "@material-ui/lab";
import sc from "../../utils/stringConstants";
import { BlankTargetLink } from "widgets/BlankTargetLink";
import Checkbox from "@material-ui/core/Checkbox";
import { AutoCompleteMultiValuesFreeSolo } from "forms/Final/autoComplete";
import { NormalizePorts, stringArrayTrimParse } from "forms/normalizer";
import { ComponentLike } from "types/componentTemplate";
import { FormApi } from "final-form";

interface Props extends WithSSOProps, TDispatchProp {
  ports: ComponentLike["ports"];
  protectedEndpoint: ComponentLike["protectedEndpoint"];
  change: FormApi["change"];
}

class ComponentAccessRaw extends React.PureComponent<Props> {
  private handleCheckBoxChangeClick = () => {
    const { change, protectedEndpoint } = this.props;
    change("protectedEndpoint", !!protectedEndpoint ? undefined : {});
  };

  public render() {
    const { ssoConfig, isSSOConfigLoaded, isSSOConfigLoading, ports } = this.props;

    if (isSSOConfigLoading && !isSSOConfigLoaded) {
      return <Loading />;
    }

    if (!ssoConfig || !ssoConfig.domain) {
      return (
        <Alert severity="info">
          <span>
            Your cluster doesn't have <strong>Single Sign-on</strong> configured. Component access feature is disabled.{" "}
            <BlankTargetLink href="/#">Learn More(TODO)</BlankTargetLink>
          </span>
        </Alert>
      );
    }

    let allGroups: string[] = [];

    ssoConfig.connectors?.forEach((x) => {
      if (x.config) {
        if ("orgs" in x.config) {
          x.config.orgs.forEach((org) => {
            org.teams.forEach((team) => {
              allGroups.push(`${org.name}:${team}`);
            });
          });
        } else if ("groups" in x.config) {
          allGroups = allGroups.concat(x.config.groups);
        }
      }
    });

    const ps = ports?.map((x) => x.containerPort) || [];

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControlLabel
            control={<Checkbox checked={!!this.props.protectedEndpoint} onChange={this.handleCheckBoxChangeClick} />}
            label="Only users authenticated by Single Sign-on can access"
          />
        </Grid>
        {!!this.props.protectedEndpoint && (
          <>
            <Grid item xs={12}>
              <Field
                render={(props: FieldRenderProps<number[]>) => (
                  <AutoCompleteMultiValuesFreeSolo<number> {...props} options={ps} />
                )}
                label="Ports"
                name="protectedEndpoint.ports"
                placeholder="Select specific ports"
                parse={NormalizePorts}
                helperText={sc.PROTECTED_ENDPOINT_PORT}
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                render={(props: FieldRenderProps<string[]>) => (
                  <AutoCompleteMultiValuesFreeSolo<string> {...props} options={allGroups} />
                )}
                label="Grant to specific groups"
                name="protectedEndpoint.groups"
                placeholder="e.g. my-github-org:a-team-name. a-gitlab-group-name"
                parse={stringArrayTrimParse}
                helperText={sc.PROTECTED_ENDPOINT_SPECIFIC_GROUPS}
              />
            </Grid>
          </>
        )}
      </Grid>
    );
  }
}

export const ComponentAccess = withSSO(ComponentAccessRaw) as any;
