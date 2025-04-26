import app from './app';
import { env } from './config/app.config';
import http from 'http'; // Import Node.js http module
import { setupSocketIO } from './socket';
import { Logger } from './utils/Logger'; //

const logger = Logger.getInstance(); //

// Create HTTP server from Express app
const server = http.createServer(app); //

// Setup Socket.IO by calling the function from src/socket.ts
setupSocketIO(server); // Pass the http server instance

// Start the Server using the http server instance
server.listen(env.PORT, () => {
  logger.info(`Server (including Socket.IO) is running on port ${env.PORT}`); //
});
