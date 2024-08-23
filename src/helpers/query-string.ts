export default function parseQueryString(search: string) {
  const args = search.substring(1).split('&');
  const argsParsed: { [key: string]: (string | true) } & { 'reload': string } = {
    reload: '',
  };
  let arg;
  let kvp;
  let key;
  for (let i = 0; i < args.length; i += 1) {
    arg = args[i];
    if (arg.indexOf('=') === -1) {
      argsParsed[decodeURIComponent(arg).trim()] = true;
    } else {
      kvp = arg.split('=');
      key = decodeURIComponent(kvp[0]).trim();
      argsParsed[key] = decodeURIComponent(kvp[1]).trim();
    }
  }
  return argsParsed;
}
