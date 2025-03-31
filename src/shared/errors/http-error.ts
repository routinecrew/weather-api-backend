import { getResponsePhrase } from '../utils';

export class HttpError extends Error {
  constructor(readonly statusCode: number, readonly customMessage?: string) {
    super(customMessage ?? getResponsePhrase(statusCode));
    this.name = HttpError.name;
  }
}
