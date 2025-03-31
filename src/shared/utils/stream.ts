import { Readable } from 'stream';

export const bufferToStream = (buffer: any) => {
  const stream = new Readable();

  stream.push(buffer);
  stream.push(null);

  return stream;
};
