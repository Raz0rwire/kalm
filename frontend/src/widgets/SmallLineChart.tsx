import { Theme, withTheme, WithTheme } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { createStyles, withStyles, WithStyles } from "@material-ui/styles";
import * as chartjs from "chart.js";
import { format } from "date-fns";
import { KTooltip } from "forms/Application/KTooltip";
import React from "react";
// @ts-ignore
import { ChartData, Line } from "react-chartjs-2";
import { MetricList } from "types/common";
import { TimestampFilter, getStartTimestamp } from "utils/date";

const smallLineChartStyles = (theme: Theme) =>
  createStyles({
    root: {
      position: "relative",
      display: "inline-block",
      verticalAlign: "middle",
      border: `1px solid ${theme.palette.type === "light" ? grey[300] : grey[700]}`,
    },
    text: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      position: "absolute",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
    },
  });

interface Props extends WithStyles<typeof smallLineChartStyles>, WithTheme {
  data: MetricList;
  hoverText?: string;
  width: number | string;
  height: number | string;
  formatValue?: (value: number) => string;
  borderColor?: string;
  backgroundColor?: string;
}

const emptyChartDataX = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const emptyChartDataY = [1, 3, 1, 5, 2, 7, 2, 5, 8];

class SmallLineChartRaw extends React.PureComponent<Props> {
  private generateData = (): ChartData<chartjs.ChartData> => {
    const { data, borderColor, backgroundColor, theme } = this.props;

    let dataX = emptyChartDataX;
    let dataY = emptyChartDataY;
    let backgroundColorFixed = backgroundColor;
    let borderColorFixed = borderColor;
    if (data && data.length > 0) {
      dataY = data.map((n) => n.y);
      dataX = data.map((n) => n.x);
    } else {
      backgroundColorFixed = theme.palette.type === "light" ? grey[400] : grey[800];
      borderColorFixed = theme.palette.type === "light" ? grey[400] : grey[800];
    }

    return {
      labels: dataX,
      datasets: [
        {
          lineTension: 0.1,
          borderColor: borderColorFixed || "#DDD",
          borderWidth: 1,
          backgroundColor: backgroundColorFixed || "rgba(75,192,192,0.4)",
          pointHoverRadius: 0,
          pointRadius: 0,
          pointHitRadius: 0,
          data: dataY,
        },
      ],
    };
  };

  private renderText() {
    const { data, formatValue } = this.props;
    // let text = "Data available soon";
    let text = "";

    if (data && data.length > 0) {
      if (formatValue) {
        text = formatValue(data[data.length - 1]!.y);
      } else {
        text = data[data.length - 1]!.y.toString();
      }
    }

    return <div className={this.props.classes.text}>{text}</div>;
  }

  private hasData = () => {
    const { data } = this.props;
    return data && data.length > 0;
  };

  public render() {
    const { classes, width, height, hoverText } = this.props;
    const hasData = this.hasData();

    const line = (
      <div style={{ width, height }} className={classes.root}>
        {this.renderText()}
        <Line
          legend={{ display: false }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            tooltips: {
              enabled: false,
            },
            scales: {
              yAxes: [
                {
                  display: false,
                  gridLines: {
                    display: false,
                  },
                  ticks: {
                    beginAtZero: true,
                  },
                },
              ],
              xAxes: [
                {
                  display: false,
                  gridLines: {
                    display: false,
                  },
                },
              ],
            },
            animation: {
              duration: 0,
              animateScale: false,
              animateRotate: false,
            },
          }}
          data={this.generateData()}
        />
      </div>
    );

    if (hasData) {
      return line;
    }

    return <KTooltip title={hoverText || "Data available soon"}>{line}</KTooltip>;
  }
}

export const SmallLineChart = withStyles(smallLineChartStyles)(withTheme(SmallLineChartRaw));

const lineChartStyles = (theme: Theme) =>
  createStyles({
    root: {
      position: "relative",
      // background: "white",
      display: "inline-block",
    },
    text: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      position: "absolute",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
    },
  });

interface LineChartProps extends WithStyles<typeof lineChartStyles> {
  data: MetricList;
  filter?: TimestampFilter;
  title?: string;
  width: number | string;
  height: number | string;
  yAxesWidth?: number;
  formatValue?: (value: number) => string;
  borderColor?: string;
  backgroundColor?: string;
}

class LineChartRaw extends React.PureComponent<LineChartProps> {
  private generateData = (): ChartData<chartjs.ChartData> => {
    const { data, borderColor, backgroundColor, filter } = this.props;

    const startTimestamp = getStartTimestamp(filter);

    return {
      labels: data
        ? data
            .filter((item) => {
              if (!filter || filter === "all") {
                return true;
              }
              return item.x >= startTimestamp;
            })
            .map((n) => n.x)
        : [],
      datasets: [
        {
          lineTension: 0.1,
          borderColor: borderColor,
          borderWidth: 1,
          backgroundColor: backgroundColor,
          pointRadius: 1,
          data: data
            ? data
                .filter((item) => {
                  if (!filter || filter === "all") {
                    return true;
                  }
                  return item.x >= startTimestamp;
                })
                .map((n) => n.y)
            : [],
        },
      ],
    };
  };

  public render() {
    const { classes, width, height, formatValue, title, yAxesWidth } = this.props;
    return (
      <div style={{ width, height }} className={classes.root}>
        <Line
          legend={{ display: false }}
          options={{
            title: {
              display: title ? true : false,
              text: title,
            },
            responsive: true,
            maintainAspectRatio: false,
            tooltips: {
              intersect: false,
              callbacks: {
                label: (tooltipItem: chartjs.ChartTooltipItem, data: chartjs.ChartData): string => {
                  // @ts-ignore
                  const value: number = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                  // @ts-ignore
                  return formatValue ? formatValue(value) : value;
                },
                title: (tooltipItem: chartjs.ChartTooltipItem[], data: chartjs.ChartData): string => {
                  // @ts-ignore
                  return format(tooltipItem[0].xLabel, "yyyy-MM-dd HH:mm");
                },
              },
            },
            scales: {
              yAxes: [
                {
                  afterFit: yAxesWidth
                    ? (scaleInstance) => {
                        scaleInstance.width = 80; // sets the width to 100px
                      }
                    : undefined,
                  ticks: {
                    maxTicksLimit: 5,
                    beginAtZero: true,
                    callback: formatValue,
                  },
                },
              ],
              xAxes: [
                {
                  ticks: {
                    maxTicksLimit: 10,
                    callback: (value) => {
                      return format(value, "HH:mm");
                    },
                  },
                },
              ],
            },
          }}
          data={this.generateData()}
        />
      </div>
    );
  }
}

export const LineChart = withStyles(lineChartStyles)(LineChartRaw);

export const formatMemory = (value: number, si?: boolean): string => {
  // const thresh = si ? 1000 : 1024;
  // if (Math.abs(value) < thresh) {
  //   return value + " B";
  // }
  // const units = si ? ["k", "M", "G", "T", "P", "E", "Z", "Y"] : ["Ki", "Mi", "Gi", "Ti", "Pi", "Ei", "Zi", "Yi"];
  // let u = -1;
  // do {
  //   value /= thresh;
  //   ++u;
  // } while (Math.abs(value) >= thresh && u < units.length - 1);
  // return value.toFixed(1) + " " + units[u];

  const MiBytes = 1024 * 1024;
  return (value / MiBytes).toFixed(0) + " Mi";
};

export const formatNumerical = (value: number): string => {
  return value.toString();
};

const formatCPU = (value: number): string => {
  return value + " m";
  // return value / 1000 + " Core";
};

export const BigCPULineChart = (props: Pick<LineChartProps, "data" | "yAxesWidth" | "filter">) => {
  return (
    <LineChart
      {...props}
      title={"CPU"}
      formatValue={formatCPU}
      height={170}
      width={"100%"}
      borderColor="rgba(33, 150, 243, 1)"
      backgroundColor="rgba(33, 150, 243, 0.5)"
    />
  );
};

export const BigMemoryLineChart = (props: Pick<LineChartProps, "data" | "yAxesWidth" | "filter">) => {
  return (
    <LineChart
      title="Memory"
      {...props}
      formatValue={formatMemory}
      height={170}
      width={"100%"}
      borderColor="rgba(75,192,192, 1)"
      backgroundColor="rgba(75,192,192,0.5)"
    />
  );
};

export const SmallMemoryLineChart = (props: Pick<Props, "data" | "hoverText">) => {
  return (
    <SmallLineChart
      {...props}
      formatValue={formatMemory}
      width={120}
      height={24}
      borderColor="rgba(75,192,192, 1)"
      backgroundColor="rgba(75,192,192,0.5)"
    />
  );
};

export const SmallCPULineChart = (props: Pick<Props, "data" | "hoverText">) => {
  return (
    <SmallLineChart
      {...props}
      formatValue={formatCPU}
      width={120}
      height={24}
      borderColor="rgba(33, 150, 243, 1)"
      backgroundColor="rgba(33, 150, 243, 0.5)"
    />
  );
};

export const CardMemoryLineChart = (props: Pick<Props, "data" | "hoverText">) => {
  return (
    <SmallLineChart
      {...props}
      formatValue={formatMemory}
      width={200}
      height={24}
      borderColor="rgba(75,192,192, 1)"
      backgroundColor="rgba(75,192,192,0.5)"
    />
  );
};

export const CardCPULineChart = (props: Pick<Props, "data" | "hoverText">) => {
  return (
    <SmallLineChart
      {...props}
      formatValue={formatCPU}
      width={200}
      height={24}
      borderColor="rgba(33, 150, 243, 1)"
      backgroundColor="rgba(33, 150, 243, 0.5)"
    />
  );
};
