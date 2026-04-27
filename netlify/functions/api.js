const serverless = require('serverless-http');
const { app } = require('../../server/index');

const handler = serverless(app, {
  request(request, event) {
    // Netlify pasa la ruta como /api/... — Express la maneja directo
    request.url = event.path;
  },
});

module.exports.handler = handler;
