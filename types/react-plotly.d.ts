declare module 'react-plotly.js' {
  import { Component } from 'react';
  import { PlotParams } from 'plotly.js';

  interface PlotParamsWithConfig extends PlotParams {
    config?: {
      displayModeBar?: boolean;
      responsive?: boolean;
      [key: string]: unknown;
    };
    style?: React.CSSProperties;
  }

  export default class Plot extends Component<PlotParamsWithConfig> {}

}

