import { httpRouter } from 'convex/server';
import { auth } from './auth';
import {
  authorizeProtectedPdf,
  bundle,
  configure,
  contact,
  envelope,
  event,
  revoke,
  storage,
  storageResolve,
  unlock,
  uploadAbort,
  uploadComplete,
  uploadReserve,
} from './profileAccessHttp';

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({ path: '/profile-access/envelope', method: 'POST', handler: envelope });
http.route({ path: '/profile-access/bundle', method: 'POST', handler: bundle });
http.route({
  path: '/profile-access/pdf-authorize',
  method: 'POST',
  handler: authorizeProtectedPdf,
});
http.route({ path: '/profile-access/configure', method: 'POST', handler: configure });
http.route({ path: '/profile-access/unlock', method: 'POST', handler: unlock });
http.route({ path: '/profile-access/revoke', method: 'POST', handler: revoke });
http.route({ path: '/profile-access/storage', method: 'POST', handler: storage });
http.route({
  path: '/profile-access/storage-resolve',
  method: 'POST',
  handler: storageResolve,
});
http.route({ path: '/profile-access/contact', method: 'POST', handler: contact });
http.route({ path: '/profile-access/event', method: 'POST', handler: event });
http.route({
  path: '/profile-access/upload-reserve',
  method: 'POST',
  handler: uploadReserve,
});
http.route({
  path: '/profile-access/upload-complete',
  method: 'POST',
  handler: uploadComplete,
});
http.route({
  path: '/profile-access/upload-abort',
  method: 'POST',
  handler: uploadAbort,
});

export default http;
