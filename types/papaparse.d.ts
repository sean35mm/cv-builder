declare module 'papaparse' {
  export type ParseError = { message: string; row?: number };
  export type ParseResult<T> = { data: T[]; errors: ParseError[] };
  export type ParseStepResult<T> = { data: T; errors: ParseError[] };
  export type Parser = { abort: () => void };
  export function parse<T>(
    input: string,
    config?: {
      skipEmptyLines?: boolean | 'greedy';
      step?: (result: ParseStepResult<T>, parser: Parser) => void;
    }
  ): ParseResult<T>;

  const Papa: { parse: typeof parse };
  export default Papa;
}
