

The middleware for a modern implementation of the historic ELIZA AI psycologist.

This repo contains 1 Cloudflare worker, which provides the following functionality

- Handles CORS handshake to prevent client-side errors
- Receives input from front-end, makes call to Llama LLM to extract facts related to user via Workers AI, stores facts in SQLite database via Durable Objects
- Loads all known facts about user from SQLite database via Durable Objects, combines with user's latest input, sets up 'system' of prompt to take a psychoanalyst tone, sends to Llama LLM
- Sends response back to user

__________

Front-end accessible here: https://cf-ai-eliza2.qdosgit3.workers.dev

Based on Cloudflare workers, Llama 3, Typescript.

Built in 1 day for a Cloudflare application.

See also:
https://github.com/qdosgit3/cf_ai_eliza2_frontend

