// Below code was ported from Proj (v4.3, back in 2016)
/*
eslint-disable no-console, no-plusplus, no-param-reassign, no-return-assign,
    no-multi-assign, prefer-destructuring, one-var
*/
const NITER = 20,
  EPS = 1e-7,
  ONETOL = 1.000001,
  CN = 2.67595,
  CS = 2.43763,
  RCN = 0.37369906014686373063, // eslint-disable-line @typescript-eslint/no-loss-of-precision
  RCS = 0.41023453108141924738, // eslint-disable-line @typescript-eslint/no-loss-of-precision
  FYCN = 1.75859,
  FYCS = 1.93052,
  RYCN = 0.56863737426006061674, // eslint-disable-line @typescript-eslint/no-loss-of-precision
  RYCS = 0.51799515156538134803, // eslint-disable-line @typescript-eslint/no-loss-of-precision
  FXC = 0.85,
  RXC = 1.17647058823529411764, // eslint-disable-line @typescript-eslint/no-loss-of-precision
  M_HALFPI = Math.PI / 2,
  sin = Math.sin,
  asin = Math.asin,
  abs = Math.abs,
  cos = Math.cos;

export default function hatanoRaw(lambda: number, phi: number): [number, number] {
  const c = sin(phi) * (phi < 0 ? CS : CN);
  let th1;
  let i;
  for (i = NITER; i; --i) {
    phi -= th1 = (phi + sin(phi) - c) / (1 + cos(phi));
    if (abs(th1) < EPS) break;
  }
  return [
    FXC * lambda * cos((phi *= 0.5)),
    sin(phi) * (phi < 0 ? FYCS : FYCN),
  ];
}

hatanoRaw.invert = function (x: number, y: number): [number, number] {
  let th = y * (y < 0 ? RYCS : RYCN);
  if (abs(th) > 1) {
    if (abs(th) > ONETOL) {
      console.error('Error');
    } else {
      th = th > 0 ? M_HALFPI : -M_HALFPI;
    }
  } else {
    th = asin(th);
  }
  x = (RXC * x) / cos(th);
  th += th;
  y = (th + sin(th)) * (y < 0 ? RCS : RCN);
  if (abs(y) > 1) {
    if (abs(y) > ONETOL) {
      console.error('Error');
    } else {
      y = y > 0 ? M_HALFPI : -M_HALFPI;
    }
  } else {
    y = asin(y);
  }
  return [x, y];
};
/*
eslint-enable no-console, no-plusplus, no-param-reassign, no-return-assign,
    no-multi-assign, prefer-destructuring, one-var
*/
