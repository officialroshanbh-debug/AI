declare module 'react-plotly.js' {
  import { Component, CSSProperties } from 'react';

  interface PlotParams {
    data: Array<{
      x?: unknown[];
      y?: unknown[];
      type?: string;
      marker?: { color?: string };
      name?: string;
      [key: string]: unknown;
    }>;
    layout?: {
      autosize?: boolean;
      margin?: { l?: number; r?: number; t?: number; b?: number };
      paper_bgcolor?: string;
      plot_bgcolor?: string;
      font?: { color?: string; size?: number };
      xaxis?: { gridcolor?: string; color?: string };
      yaxis?: { gridcolor?: string; color?: string };
      title?: string;
      [key: string]: unknown;
    };
    config?: {
      displayModeBar?: boolean;
      responsive?: boolean;
      [key: string]: unknown;
    };
    style?: CSSProperties;
    [key: string]: unknown;
  }

  export default class Plot extends Component<PlotParams> {}
}

