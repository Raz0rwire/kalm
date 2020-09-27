import { Box, Button, Grid } from "@material-ui/core";
import { FinalSelectField } from "forms/Final/select";
import { FinalTextField } from "forms/Final/textfield";
import React from "react";
import { Field } from "react-final-form";
import { FieldArray } from "react-final-form-arrays";
import { HttpRouteCondition } from "types/route";
import { AddIcon, DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { ValidatorRequired } from "../validator";

export interface Props {}

export class RenderHttpRouteConditions extends React.PureComponent<Props> {
  public render() {
    return (
      <FieldArray<HttpRouteCondition, any>
        name="conditions"
        render={({ fields }) => (
          <div>
            <Box display="flex">
              <Box mt={2} mr={2} mb={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => {
                    fields.push({
                      type: "header",
                      operator: "equal",
                      name: "",
                      value: "",
                    });
                  }}
                >
                  Add Header Rule
                </Button>
              </Box>
              <Box mt={2} mr={2} mb={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => {
                    fields.push({
                      type: "query",
                      operator: "equal",
                      name: "",
                      value: "",
                    });
                  }}
                >
                  Add Query Rule
                </Button>
              </Box>
            </Box>
            {fields.value.map((condition, index) => (
              <Grid container spacing={1} key={index}>
                <Grid item md={2}>
                  <div style={{ padding: "12px 0" }}>{condition.type} Rule</div>
                </Grid>
                <Grid item md={2}>
                  <Field
                    name={`conditions.${index}.name`}
                    component={FinalTextField}
                    label="Name"
                    validate={ValidatorRequired}
                  />
                </Grid>
                <Grid item md={2}>
                  <Field
                    name={`conditions.${index}.operator`}
                    component={FinalSelectField}
                    label="operator"
                    validate={ValidatorRequired}
                    options={[
                      { value: "equal", text: "Equal" },
                      { value: "withPrifix", text: "With Prifix" },
                      { value: "matchRegexp", text: "Match Regexp" },
                    ]}
                  ></Field>
                </Grid>
                <Grid item md={2}>
                  <Field
                    name={`conditions.${index}.value`}
                    component={FinalTextField}
                    label="Value"
                    validate={ValidatorRequired}
                  />
                </Grid>
                <Grid item md={2}>
                  <IconButtonWithTooltip
                    tooltipPlacement="top"
                    tooltipTitle="Delete"
                    aria-label="delete"
                    onClick={() => fields.remove(index)}
                  >
                    <DeleteIcon />
                  </IconButtonWithTooltip>
                </Grid>
              </Grid>
            ))}
          </div>
        )}
      />
    );
  }
}
