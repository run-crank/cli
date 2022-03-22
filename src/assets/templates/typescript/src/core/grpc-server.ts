import * as grpc from 'grpc';
import { CogServiceService as CogService } from '../proto/cog_grpc_pb';
import { Cog } from './cog';
import { CachingClientWrapper } from '../client/caching-client-wrapper';

const server = new grpc.Server();
const port = process.env.PORT || 28866;
const host = process.env.HOST || '0.0.0.0';
const redisUrl = process.env.REDIS_URL || null;
const mailgunApiKey = process.env.MAILGUN_API_KEY || null;
const mailgunDomain = process.env.MAILGUN_DOMAIN || null;
const mailgunAlertEmail = process.env.MAILGUN_ALERT_EMAIL || null;
let credentials: grpc.ServerCredentials;
let mailgunCredentials = {};

if (process.env.USE_SSL) {
  credentials = grpc.ServerCredentials.createSsl(
    Buffer.from(process.env.SSL_ROOT_CRT, 'base64'), [{
      cert_chain: Buffer.from(process.env.SSL_CRT, 'base64'),
      private_key: Buffer.from(process.env.SSL_KEY, 'base64'),
    }],
    true,
  );
} else {
  credentials = grpc.ServerCredentials.createInsecure();
}

if (mailgunApiKey && mailgunDomain && mailgunAlertEmail) {
  mailgunCredentials = {
    apiKey: mailgunApiKey,
    domain: mailgunDomain,
    alertEmail: mailgunAlertEmail,
  };
}

server.addService(CogService, new Cog(CachingClientWrapper, {}, redisUrl, mailgunCredentials));
server.bind(`${host}:${port}`, credentials);
server.start();
console.log(`Server started, listening: ${host}:${port}`);

// Export server for testing.
export default server;
