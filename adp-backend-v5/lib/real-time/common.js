const _ = require('lodash');
const socketIo = require('socket.io');
const addDeviceToSocketRequest = require('express-device').capture();
const socketIoAuth = require('./socket-io-auth');
const { InvalidTokenError, ExpiredTokenError } = require('../errors');

function addAuthAndSubscriptions({ appLib, io, log, subscriptionManager }) {
  socketIoAuth(io, {
    debug: log.debug.bind(log),
    async authenticate(socket, cb) {
      try {
        const isWebsocketUpgradeRequest = socket.request.headers.upgrade === 'websocket';
        if (isWebsocketUpgradeRequest) {
          // According to socket.io docs (https://socket.io/docs/client-api/#With-extraHeaders):
          // "Custom headers will not be appended when using websocket as the transport."
          // This is why token is send in query for websocket handshake.
          socket.request.headers.authorization = socket.request._query.token;
        }

        addDeviceToSocketRequest(socket.request);

        const { user, roles, permissions } = await appLib.auth.authenticationCheck(socket.request);
        socket.userId = _.get(user, '_id', '').toString();
        socket.user = user;
        socket.roles = roles;
        socket.permissions = permissions;
        socket.accessToken = appLib.auth.extractJwtFromRequest(socket.request);

        log.trace(`User with id '${socket.userId}' connected via socket '${socket.id}'`);
        return cb(null, true);
      } catch (e) {
        if (e instanceof InvalidTokenError) {
          return cb({ message: 'Invalid user session, please login' });
        }
        if (e instanceof ExpiredTokenError) {
          return cb({ message: 'User session expired, please login again' });
        }
        log.error(e.stack);
        return cb({ message: `Error occurred during authentication process` });
      }
    },
    postAuthenticate(socket) {
      // subscribe socket on single 'message' event where all subscriptions are handled
      socket.on('message', (data) => {
        const type = _.get(data, 'type');
        if (!type) {
          return log.warn(`Invalid socket message without type field`);
        }
        const handler = subscriptionManager.subscriptions[type];
        if (!handler) {
          return log.warn(`Invalid socket subscription type ${type}`);
        }
        handler({ socket, data });
      });
    },
    disconnect(socket) {
      log.trace(`User with id '${socket.userId}' disconnected from socket '${socket.id}'`);
    },
  });
}

function getSocketIoServer(server, opts = {}) {
  return socketIo(server, {
    handlePreflightRequest(req, res) {
      // check whether req.headers.origin is passed cors
      res.writeHead(200, {
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Origin': req.headers.origin,
        'Access-Control-Allow-Credentials': true,
      });
      res.end();
    },
    ...opts,
  });
}
module.exports = {
  addAuthAndSubscriptions,
  getSocketIoServer,
};
