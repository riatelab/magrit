// Imports from solid-js
import { createEffect } from 'solid-js';

// Import from other packages
import * as Plot from '@observablehq/plot';

export type PlotFigureProps = {
  id: string;
  options: Record<string, any>;
  style?: Record<string, string>;
};

export default function PlotFigure(props: PlotFigureProps) {
  let refElement: HTMLDivElement;

  createEffect(() => {
    const plot = Plot.plot(props.options);
    refElement.innerHTML = '';
    refElement.appendChild(plot);
  });

  return <div id={props.id} ref={refElement!} class={'plot-container'} style={props.style}></div>;
}
