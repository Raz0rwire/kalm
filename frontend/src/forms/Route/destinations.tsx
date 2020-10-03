import { Box, Grid } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import Warning from "@material-ui/icons/Warning";
import { Alert, AlertTitle } from "@material-ui/lab";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import {
  PortProtocolGRPC,
  PortProtocolGRPCWEB,
  PortProtocolHTTP,
  PortProtocolHTTP2,
  PortProtocolHTTPS,
} from "types/componentTemplate";
import { HttpRouteDestination } from "types/route";
import { AddIcon, DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { ValidatorArrayNotEmpty, ValidatorRequired } from "../validator";
import { Field, FieldRenderProps } from "react-final-form";
import Button from "@material-ui/core/Button";
import Collapse from "@material-ui/core/Collapse";
import { FieldArray, FieldArrayRenderProps } from "react-final-form-arrays";
import { AutoCompleteForRenderOption, AutoCompleteSingleValue } from "forms/Final/autoComplete";
import { FinialSliderRender } from "forms/Final/slicer";

const mapStateToProps = (state: RootState) => {
  return {
    activeNamespace: state.namespaces.active,
    services: state.services.services,
  };
};

interface Props extends ReturnType<typeof mapStateToProps> {}

class RenderHttpRouteDestinationsRaw extends React.PureComponent<Props> {
  public render() {
    const { services, activeNamespace } = this.props;

    const options: AutoCompleteForRenderOption[] = [];
    services
      .filter((x) => {
        const ns = x.namespace;

        return (
          ns !== "default" &&
          ns !== "kalm-operator" &&
          ns !== "kalm-imgconv" &&
          ns !== "kube-system" &&
          ns !== "istio-system" &&
          ns !== "cert-manager" &&
          ns !== "istio-operator"
        );
      })
      .forEach((svc) => {
        svc.ports
          .filter((p) => {
            const appProtocol = p.appProtocol;
            return (
              appProtocol === PortProtocolHTTP ||
              appProtocol === PortProtocolHTTP2 ||
              appProtocol === PortProtocolHTTPS ||
              appProtocol === PortProtocolGRPC ||
              appProtocol === PortProtocolGRPCWEB
            );
          })
          .forEach((port) => {
            options.push({
              value: `${svc.name}.${svc.namespace}.svc.cluster.local:${port.port}`,
              label: svc.name + ":" + port.port + `(${port.appProtocol})`,
              group: svc.namespace === activeNamespace ? `${svc.namespace} (Current)` : svc.namespace,
            });
          });
      });

    return (
      <FieldArray
        validate={ValidatorArrayNotEmpty}
        name="destinations"
        render={({ fields, meta: { error, touched } }: FieldArrayRenderProps<HttpRouteDestination, any>) => (
          <div>
            <Box mt={2} mr={2} mb={2}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                size="small"
                id="add-target-button"
                onClick={() =>
                  fields.push({
                    host: "",
                    weight: 1,
                  })
                }
              >
                Add a target
              </Button>
            </Box>
            {touched && error && typeof error === "string" ? <Alert severity="error">{error}</Alert> : null}
            <Collapse in={fields.value && fields.value.length > 1}>
              <Alert className="alert" severity="info">
                There are more than one target, traffic will be forwarded to each target by weight.
              </Alert>
            </Collapse>
            {fields.value &&
              fields.value.map((destination, index) => (
                <Grid container spacing={2} key={index} alignItems="center">
                  <Grid item xs={8} sm={8} md={6} lg={4} xl={4}>
                    <Field
                      name={`destinations.${index}.host`}
                      render={(props: FieldRenderProps<string>) => (
                        <AutoCompleteSingleValue
                          {...props}
                          options={options.map((x) => x.value)}
                          optionsForRender={options}
                        />
                      )}
                      label="Choose a target"
                      validate={ValidatorRequired}
                      options={options}
                      noOptionsText={
                        <Alert severity="warning">
                          <AlertTitle>No valid targets found.</AlertTitle>
                          <Typography>
                            If you can't find the target you want, please check if you have configured ports on the
                            component. Only components that have ports will appear in the options.
                          </Typography>
                        </Alert>
                      }
                    />
                  </Grid>
                  {fields.value.length > 1 ? (
                    <Grid item md={2}>
                      <Field
                        name={`destinations.${index}.weight`}
                        render={(props: FieldRenderProps<number>) => (
                          <FinialSliderRender {...props} step={1} min={0} max={10} />
                        )}
                        label="Weight"
                      />
                    </Grid>
                  ) : null}
                  <Grid item md={1}>
                    <IconButtonWithTooltip
                      tooltipPlacement="top"
                      tooltipTitle="Delete"
                      aria-label="delete"
                      onClick={() => fields.remove(index)}
                    >
                      <DeleteIcon />
                    </IconButtonWithTooltip>
                  </Grid>
                  {destination.weight === 0 ? (
                    <Grid item md={3}>
                      <Warning /> Requests won't go into this target since it has 0 weight.
                    </Grid>
                  ) : null}
                </Grid>
              ))}{" "}
          </div>
        )}
      />
    );
  }
}

export const RenderHttpRouteDestinations = connect(mapStateToProps)(RenderHttpRouteDestinationsRaw);
