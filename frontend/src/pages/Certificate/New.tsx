import { createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { createCertificateAction } from "actions/certificate";
import { push } from "connected-react-router";
import { CertificateForm } from "forms/Certificate";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { CertificateForm as CertificateFormType, newEmptyCertificateForm } from "types/certificate";
import { H6 } from "widgets/Label";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

export interface Props extends WithStyles<typeof styles>, TDispatchProp {}

class CertificateNewRaw extends React.PureComponent<Props> {
  private submit = async (certificate: CertificateFormType) => {
    try {
      const { dispatch } = this.props;
      await dispatch(createCertificateAction(certificate, false));
      dispatch(push("/certificates"));
    } catch (e) {
      console.log(e);
    }
  };

  public render() {
    const { classes } = this.props;
    return (
      <BasePage secondHeaderRight={<H6>New Certificate</H6>}>
        <div className={classes.root}>
          <Grid container spacing={2}>
            <Grid item xs={8} sm={8} md={8}>
              <CertificateForm onSubmit={this.submit} initialValues={newEmptyCertificateForm} />
            </Grid>
          </Grid>
        </div>
      </BasePage>
    );
  }
}

export const CertificateNewPage = withStyles(styles)(connect()(CertificateNewRaw));
