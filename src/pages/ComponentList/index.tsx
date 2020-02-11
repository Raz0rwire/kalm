import React from "react";
import { BasePage } from "../BasePage";
import MaterialTable from "material-table";
import { connect, DispatchProp } from "react-redux";
import { RootState } from "../../reducers";
import {
  IconButton,
  Paper,
  WithStyles,
  Theme,
  createStyles,
  withStyles
} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { push } from "connected-react-router";
import { deleteComponentAction } from "../../actions/component";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../actions";

const mapStateToProps = (state: RootState) => {
  console.log(state);
  return {
    components: state
      .get("components")
      .get("components")
      .toList()
  };
};

type StateProps = ReturnType<typeof mapStateToProps>;

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
    }
  });

interface Props extends StateProps, WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class List extends React.PureComponent<Props> {
  public render() {
    const { dispatch, components, classes } = this.props;

    const data = components.map(component => {
      return {
        action: (
          <>
            <IconButton
              aria-label="edit"
              onClick={() => {
                dispatch(push(`/components/${component.get("id")}/edit`));
              }}
            >
              <EditIcon />
            </IconButton>

            <IconButton
              aria-label="edit"
              onClick={() => {
                dispatch(push(`/components/${component.get("id")}/duplicate`));
              }}
            >
              <FileCopyIcon />
            </IconButton>

            <IconButton
              aria-label="delete"
              onClick={() => {
                // TODO delete confirmation
                dispatch(deleteComponentAction(component.get("id")));
              }}
            >
              <DeleteIcon />
            </IconButton>
          </>
        ),
        name: component.get("name"),
        image: component.get("image"),
        cpu: component.get("cpu"),
        memory: component.get("memory")
      };
    });
    return (
      <BasePage title="Components">
        <div className={classes.root}>
          <MaterialTable
            options={{
              padding: "dense"
            }}
            columns={[
              { title: "Name", field: "name", sorting: false },
              { title: "Image", field: "image", sorting: false },
              { title: "CPU", field: "cpu", searchable: false },
              { title: "Memory", field: "memory", searchable: false },
              {
                title: "Action",
                field: "action",
                sorting: false,
                searchable: false
              }
            ]}
            data={data.toArray()}
            title=""
          />
        </div>
      </BasePage>
    );
  }
}

export default withStyles(styles)(connect(mapStateToProps)(List));
