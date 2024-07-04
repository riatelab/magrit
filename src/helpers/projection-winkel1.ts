const { cos } = Math;

export default function winkel1Raw(
  latTrueScale: number,
): (arg0: number, arg1: number) => [number, number] {
  const cosphi1 = cos(latTrueScale);

  function forward(lambda: number, phi: number): [number, number] {
    const x = lambda;
    const y = phi;
    return [0.5 * x * (cosphi1 + cos(phi)), y];
  }

  forward.invert = (x: number, y: number): [number, number] => {
    const lambda = x;
    const phi = y;
    return [(2 * lambda) / (cosphi1 + cos(phi)), phi];
  };

  return forward;
}
