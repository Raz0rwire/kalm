import { Box, Button, Grid } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { setSuccessNotificationAction } from "actions/notification";
import copy from "copy-to-clipboard";
import { Field, Form, Formik, FormikProps } from "formik";
import { KFreeSoloFormikAutoCompleteMultiValues } from "forms/Basic/autoComplete";
import { KFormikRadioGroupRender } from "forms/Basic/radio";
import { KRenderDebounceFormikTextField } from "forms/Basic/textfield";
import { FormikUploader } from "forms/Basic/uploader";
import { CERTIFICATE_FORM_ID } from "forms/formIDs";
import { ValidateHost } from "forms/validator";
import { extractDomainsFromCertificateContent } from "permission/utils";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { FormMidware } from "tutorials/formMidware";
import { TDispatchProp } from "types";
import { issuerManaged, selfManaged, CertificateForm as CertificateFormType } from "types/certificate";
import DomainStatus from "widgets/DomainStatus";
import { KPanel } from "widgets/KPanel";
import { Caption } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import sc from "../../utils/stringConstants";

const mapStateToProps = (state: RootState) => {
  return {
    certificateIssuers: state.certificates.certificateIssuers,
    ingressIP: state.cluster.info.ingressIP,
  };
};

interface OwnProps {
  isEdit?: boolean;
  onSubmit: any;
  initialValues: CertificateFormType;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
    },
    fileInput: {},
    label: {
      fontSize: 12,
      marginBottom: 18,
      display: "block",
    },
    editBtn: {
      marginLeft: 8,
    },
  });

export interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp, OwnProps {}

interface State {
  isEditCertificateIssuer: boolean;
}

class CertificateFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isEditCertificateIssuer: false,
    };
  }

  private renderSelfManagedFields = (formikProps: FormikProps<CertificateFormType>) => {
    const { classes } = this.props;
    const { setFieldValue, values, errors, touched } = formikProps;

    return (
      <>
        <Grid item md={12}>
          <FormikUploader
            touched={touched.selfManagedCertContent}
            errorText={errors.selfManagedCertContent}
            inputlabel="Certificate file"
            inputid="upload-certificate"
            className={classes.fileInput}
            name="selfManagedCertContent"
            margin="normal"
            id="certificate-selfManagedCertContent"
            handleChange={(value: string) => {
              setFieldValue("selfManagedCertContent", value);
              const domains = extractDomainsFromCertificateContent(values.selfManagedCertContent);
              setFieldValue("domains", domains);
            }}
            multiline={true}
            rows={12}
            value={values.selfManagedCertContent}
          />
        </Grid>
        <Grid item md={12}>
          <FormikUploader
            touched={touched.selfManagedCertPrivateKey}
            errorText={errors.selfManagedCertPrivateKey}
            inputlabel="Private Key"
            inputid="upload-private-key"
            multiline={true}
            className={classes.fileInput}
            rows={12}
            id="certificate-selfManagedCertPrivateKey"
            name="selfManagedCertPrivateKey"
            margin="normal"
            handleChange={(value: string) => {
              setFieldValue("selfManagedCertPrivateKey", value);
            }}
            value={values.selfManagedCertPrivateKey}
          />
        </Grid>
      </>
    );
  };

  private validate = async (values: CertificateFormType) => {
    let errors: any = {};

    if (values.managedType === selfManaged && (!values.domains || values.domains.length < 1)) {
      errors.selfManagedCertContent = "Invalid Certificate";
      return errors;
    }

    errors.domains = values.domains.map(ValidateHost);
    if (errors.domains.filter((e: string | undefined) => e).length < 1) {
      delete errors.domains;
    }

    if (values.domains.length < 1) {
      errors.domains = "Required";
      return errors;
    }

    return errors;
  };

  public render() {
    const { onSubmit, initialValues, classes, isEdit, ingressIP, dispatch } = this.props;
    return (
      <Formik
        onSubmit={onSubmit}
        initialValues={initialValues}
        validate={this.validate}
        enableReinitialize={false}
        handleReset={console.log}
      >
        {(formikProps) => {
          const { values, dirty, handleChange, touched, errors, setFieldValue, isSubmitting } = formikProps;
          const icons = values.domains.map((domain, index) =>
            Array.isArray(errors.domains) && errors.domains[index] ? undefined : <DomainStatus domain={domain} />,
          );
          if (!dirty && values.selfManagedCertContent && values.domains.length <= 0) {
            const domains = extractDomainsFromCertificateContent(values.selfManagedCertContent);
            setFieldValue("domains", domains);
          }
          return (
            <Form className={classes.root} tutorial-anchor-id="certificate-form" id="certificate-form">
              <FormMidware values={values} form={CERTIFICATE_FORM_ID} />
              <Prompt when={dirty && !isSubmitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
              <KPanel
                content={
                  <Box p={2}>
                    <Grid container spacing={2}>
                      {isEdit ? null : (
                        <Grid item md={12}>
                          <KFormikRadioGroupRender
                            title=""
                            error={!!errors.managedType && touched.managedType}
                            name="managedType"
                            value={values.managedType}
                            onChange={handleChange}
                            options={[
                              {
                                value: issuerManaged,
                                label: sc.CERT_AUTO,
                                explain: sc.CERT_AUTO_DESC,
                              },
                              {
                                value: selfManaged,
                                label: sc.CERT_UPLOAD,
                                explain: sc.CERT_UPLOAD_DESC,
                              },
                            ]}
                          />
                        </Grid>
                      )}
                      <Grid item md={12}>
                        <Field
                          component={KRenderDebounceFormikTextField}
                          label="Certificate name"
                          name="name"
                          disabled={isEdit}
                          placeholder="Please type a certificate name"
                          id="certificate-name"
                          helperText={!!errors.name && touched.name ? errors.name : " "}
                        />
                      </Grid>
                      <Grid item md={12}>
                        <Field
                          component={KFreeSoloFormikAutoCompleteMultiValues}
                          disabled={values.managedType === selfManaged}
                          name="domains"
                          icons={icons}
                          id="certificate-domains"
                          placeholder={
                            values.managedType === selfManaged
                              ? "Extract domains information when you upload a certificate file"
                              : "Please type domains"
                          }
                          helperText={
                            <Caption color="textSecondary">
                              Your cluster ip is{" "}
                              <Link
                                to="#"
                                onClick={() => {
                                  copy(ingressIP);
                                  dispatch(setSuccessNotificationAction("Copied successful!"));
                                }}
                              >
                                {ingressIP}
                              </Link>
                              . {sc.ROUTE_HOSTS_INPUT_HELPER}
                            </Caption>
                          }
                        />
                      </Grid>
                    </Grid>
                    {values.managedType === selfManaged ? this.renderSelfManagedFields(formikProps) : null}
                  </Box>
                }
              />
              <Box pt={2}>
                <Button id="save-certificate-button" type="submit" color="primary" variant="contained">
                  {isEdit ? "Update" : "Create"}
                </Button>
              </Box>
            </Form>
          );
        }}
      </Formik>
    );
  }
}

export const CertificateForm = connect(mapStateToProps)(withStyles(styles)(CertificateFormRaw));
