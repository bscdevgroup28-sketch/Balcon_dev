declare module 'json2csv' {
  interface Json2CsvOptions {
    fields?: string[];
    delimiter?: string;
    eol?: string;
    header?: boolean;
  }
  class Parser<T = any> {
    constructor(opts?: Json2CsvOptions);
    parse(data: T[]): string;
  }
  export { Parser };
}