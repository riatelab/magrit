import alasql from 'alasql';

// Add log function to alasql
alasql.fn.log = (x: any) => Math.log(x);
alasql.fn.LOG = alasql.fn.log;

export default alasql;
