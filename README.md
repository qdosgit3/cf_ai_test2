

The middleware for a modern implementation of the historic ELIZA AI psycologist.

This repo contains 1 Cloudflare worker, which provides the following functionality

- Handles CORS handshake to prevent client-side errors
- Receives input from front-end, makes call to Llama LLM with 'system' of prompt instructed to extract facts from input related to user or respond 'MATCH_NOT_FOUND' (to prevent storing waffley equivalent) via Workers AI
- Stores new and old facts in SQLite database associated with user name via Durable Objects
- Loads all known facts about user from SQLite database via Durable Objects, combines with user's latest input, sets up 'system' of prompt to take a psychoanalyst tone, sends to Llama LLM
- Sends response back to user

```
npx wrangler dev
curl http://localhost:8787 -H "Content-type: application/json" -d '{"username": "amelia", "prompt": "please help because..."}'
npx wrangler deploy
curl https://hello-ai.qdosgit3.workers.dev -H "Content-type: application/json" -d '{"username": "amelia", "prompt": "please help because..."}'
```

Note that the LLM does not always extract the facts correctly, so the statefulness can be a little his and miss. Example of when it does work:

```
@qdosgit $ curl http://localhost:8787 -H "Content-type: application/json" -d '{"username": "john of london", "prompt": "please help i got a divorce 3 times. all my ex-wives hates apples. now i cannot eat apples"}'

{"response":"The classic case of the \"Symbolic Repetition Compulsion.\" \n\nIt appears that your unconscious mind is replaying the same pattern of relationships, where you're drawn to women who dislike apples, and in turn, you develop an aversion to them yourself. This may be a manifestation of your unresolved feelings towards your past relationships.\n\nThe repeated divorces suggest a pattern of self-sabotage or an inability to work through conflicts. The apple aversion could be a symbolic representation of the \"forbidden fruit\" or a trigger for your unconscious guilt and anxiety.\n\nTo break this cycle, we need to explore the underlying reasons behind your relationships and your aversion to apples. Are you running from intimacy or commitment? Are there unresolved issues from your past that are influencing your present?\n\nLet's work together to uncover the underlying dynamics driving your behavior.","usage":{"prompt_tokens":142,"completion_tokens":170,"total_tokens":312}}

@qdosgit $ curl http://localhost:8787 -H "Content-type: application/json" -d '{"username": "john of london", "prompt": "what cant i eat again? i have amnesia"}'

{"response":"An intriguing case, John of London. Considering your history, it appears that there's a strong emotional connection between your ex-wives' dislike of apples and your own inability to eat them. This could be a manifestation of a deeper psychological issue, such as a fear of rejection or a desire to identify with your partners.\n\nIn light of your amnesia, I'd like to explore this further. Can you recall any specific incidents or emotions associated with apples or your ex-wives?","usage":{"prompt_tokens":129,"completion_tokens":96,"total_tokens":225}}

```

__________

Front-end accessible here:
https://cf-ai-eliza2.qdosgit3.workers.dev

Based on Cloudflare workers, Llama 3, Typescript.

Built in 1 day for a Cloudflare application.

See also:
https://github.com/qdosgit3/cf_ai_eliza2_frontend

