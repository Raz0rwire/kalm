import { OutlinedTextFieldProps, TextField, Theme, Typography } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import {
  AutocompleteProps,
  createFilterOptions,
  UseAutocompleteMultipleProps,
  UseAutocompleteSingleProps,
} from "@material-ui/lab";
import clsx from "clsx";
import React from "react";
import { theme } from "theme/theme";
import { FieldRenderProps } from "react-final-form";
import Chip from "@material-ui/core/Chip";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { KalmApplicationIcon, KalmLogoIcon } from "widgets/Icon";
import { Caption } from "widgets/Label";
import Divider from "@material-ui/core/Divider";

export interface AutoCompleteForRenderOption {
  value: string;
  label: string;
  group: string;
}

const FreeSoloStyles = makeStyles((theme: Theme) => ({
  root: {},
  error: {
    color: theme.palette.error.main,
    border: "1px solid " + theme.palette.error.main,
  },
}));

export const AutoCompleteSingleValueStyle = makeStyles((_theme: Theme) => ({
  groupLabel: {
    background: theme.palette.type === "light" ? theme.palette.grey[50] : theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingLeft: 12,
    display: "flex",
    alignItems: "center",
    fontSize: theme.typography.subtitle2.fontSize,
    textTransform: "capitalize",
    paddingTop: 4,
    paddingBottom: 4,
  },
  groupLabelDefault: {
    background: theme.palette.type === "light" ? theme.palette.grey[50] : theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingLeft: 12,
    display: "flex",
    alignItems: "center",
    fontSize: theme.typography.subtitle2.fontSize,
    textTransform: "capitalize",
    paddingTop: 4,
    paddingBottom: 4,
  },
  groupLabelCurrent: {
    color: theme.palette.type === "light" ? theme.palette.primary.dark : theme.palette.primary.light,
    fontWeight: 500,
  },
  groupIcon: {
    marginRight: theme.spacing(1),
  },
  logoIcon: {
    marginRight: theme.spacing(2),
    color: theme.palette.type === "light" ? theme.palette.getContrastText(grey[700]) : theme.palette.background.default,
    background: theme.palette.type === "light" ? grey[700] : "#FFFFFF",
  },

  groupUl: {
    marginLeft: 32,
  },
}));

export interface AutoCompleteMultiValuesFreeSoloProps<T>
  extends FieldRenderProps<T[]>,
    Omit<UseAutocompleteMultipleProps<T>, "multiple">,
    Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText"> {
  InputLabelProps?: {};
  disabled?: boolean;
  icons?: any[];
  normalize?: any;
}

interface X {
  <T>(props: AutoCompleteMultiValuesFreeSoloProps<T>): JSX.Element;
}

export const AutoCompleteMultiValuesFreeSolo: X = function <T>(props: AutoCompleteMultiValuesFreeSoloProps<T>) {
  const {
    id,
    label,
    options,
    icons,
    disabled,
    input: { value, onChange, onBlur },
    meta: { error, touched },
    placeholder,
    helperText,
  } = props;
  console.log(error);
  const classes = FreeSoloStyles();
  const errorsIsArray = Array.isArray(error);

  let errorText: string | undefined = undefined;

  if (errorsIsArray) {
    errorText = error.find((x: string | undefined) => x !== undefined);
  } else {
    errorText = error;
  }

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(x) => (x as any).toString()}
      multiple
      autoSelect
      clearOnEscape
      freeSolo
      disabled={disabled}
      size="small"
      id={id}
      onBlur={onBlur}
      value={value || []}
      onChange={(_, value) => {
        onChange(value);
      }}
      renderTags={(value, getTagProps) => {
        return value.map((option, index: number) => {
          return (
            <Chip
              icon={icons ? icons[index] : undefined}
              variant="outlined"
              label={option}
              classes={{ root: clsx({ [classes.error]: errorsIsArray && error[index] }) }}
              size="small"
              {...getTagProps({ index })}
            />
          );
        });
      }}
      renderInput={(params) => {
        return (
          <TextField
            {...params}
            margin="dense"
            variant="outlined"
            disabled={disabled}
            error={!!errorText && touched}
            label={label}
            placeholder={placeholder}
            helperText={errorText && touched ? errorText : helperText}
            InputLabelProps={{
              shrink: true,
            }}
          />
        );
      }}
    />
  );
};

export interface AutoCompleteSingleValueProps<T>
  extends FieldRenderProps<T>,
    Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText">,
    Pick<AutocompleteProps<T>, "noOptionsText">,
    UseAutocompleteSingleProps<T> {
  optionsForRender?: AutoCompleteForRenderOption[];
}

const NO_GROUP = "__no__group__";

export const AutoCompleteSingleValue = function <T>(props: AutoCompleteSingleValueProps<string>): JSX.Element {
  const {
    label,
    helperText,
    input: { value, onChange, onBlur },
    meta: { touched, error },
    options,
    placeholder,
    noOptionsText,
    optionsForRender,
  } = props;

  const {
    groupLabelDefault,
    groupIcon,
    logoIcon,
    groupLabelCurrent,
    groupLabel,
    groupUl,
  } = AutoCompleteSingleValueStyle();

  return (
    <Autocomplete
      openOnFocus
      noOptionsText={noOptionsText}
      options={options}
      size="small"
      groupBy={(value) => {
        if (!optionsForRender) {
          return NO_GROUP;
        }

        const option = optionsForRender?.find((x) => x.value === value);

        if (!option) {
          return value;
        }

        return option.group;
      }}
      filterOptions={createFilterOptions({
        ignoreCase: true,
        matchFrom: "any",
        stringify: (value: string) => {
          if (!optionsForRender) {
            return value;
          }

          const option = optionsForRender?.find((x) => x.value === value);

          if (!option) {
            return value;
          }

          return option.label;
        },
      })}
      getOptionLabel={(value: string) => {
        if (!optionsForRender) {
          return value;
        }

        const option = optionsForRender?.find((x) => x.value === value);

        if (!option) {
          return value;
        }

        return option.label;
      }}
      renderOption={(value) => {
        if (!optionsForRender) {
          return value;
        }

        const option = optionsForRender?.find((x) => x.value === value);

        if (!option) {
          return null;
        }

        return (
          <div className={groupUl}>
            <Typography>{option!.label}</Typography>
          </div>
        );
      }}
      renderGroup={({ key, children }) => {
        if (key === NO_GROUP) {
          return children;
        }

        if (key === "default") {
          return (
            <div key={key}>
              <div className={groupLabelDefault}>
                <KalmLogoIcon className={clsx(groupIcon, logoIcon)} />
                <Caption>{key}</Caption>
              </div>
              {children}
              <Divider />
            </div>
          );
        } else {
          return (
            <div key={key}>
              <div className={groupLabel}>
                <KalmApplicationIcon className={groupIcon} />
                <Caption className={clsx(key.includes("Current") ? groupLabelCurrent : {})}>{key}</Caption>
              </div>
              {children}
              <Divider />
            </div>
          );
        }
      }}
      value={value}
      onBlur={onBlur}
      forcePopupIcon={true}
      onChange={(_: any, value: string | null) => {
        onChange(value);
      }}
      renderInput={(params) => {
        return (
          <TextField
            {...params}
            fullWidth
            variant="outlined"
            error={!!touched && !!error}
            label={label}
            placeholder={placeholder}
            helperText={(!!touched && error) || helperText}
          />
        );
      }}
    />
  );
};

interface AutoCompleteMultipleValuesProps<T>
  extends FieldRenderProps<T[]>,
    Omit<UseAutocompleteMultipleProps<T>, "multiple">,
    Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText"> {
  InputLabelProps?: {};
  disabled?: boolean;
  icons?: any[];
}

export const AutoCompleteMultipleValue = (props: AutoCompleteMultipleValuesProps<string>) => {
  const {
    placeholder,
    label,
    helperText,
    options,
    input: { onChange, value, onBlur },
    meta: { touched, error },
  } = props;

  return (
    <Autocomplete
      multiple
      size="small"
      options={options}
      // filterSelectedOptions
      openOnFocus
      // groupBy={(option): string => option.group}
      // renderGroup={({ key, children }) => (
      //   <div>
      //     {key}
      //     {children}
      //   </div>
      // )}
      // renderOption={(value) => {
      //   return <div>{value}</div>;
      // }}
      // filterOptions={createFilterOptions({
      //   ignoreCase: true,
      //   matchFrom: "any",
      //   stringify: (option): string => {
      //     return option.value;
      //   },
      // })}
      // getOptionLabel={(option): string => {
      //   return option.label;
      // }}
      renderTags={(value: string[], getTagProps) => {
        return value.map((option: string, index: number) => {
          return <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} />;
        });
      }}
      onBlur={onBlur}
      value={value || []}
      onChange={(e, value) => {
        onChange(value);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          InputLabelProps={{
            shrink: true,
          }}
          label={label}
          variant="outlined"
          placeholder={placeholder}
          error={!!touched && !!error}
          helperText={!!touched && !!error ? error : helperText}
        />
      )}
    />
  );
};
