declare module 'bcryptjs';
declare module 'cors';
declare module '@mapbox/sphericalmercator';
declare module 'geojson-vt';
declare module 'vt-pbf';

declare module 'socket.io' {
  export class Server {
    constructor(...args: any[]);
    on(...args: any[]): any;
    off(...args: any[]): any;
    emit(...args: any[]): any;
    to(...args: any[]): any;
  }
}
