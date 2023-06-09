import { app } from './app';

app
  .listen({
    port: 3000,
  })
  .then(() => console.log(`HTTP Server is running on port 3000`));
