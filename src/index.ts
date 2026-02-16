/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */


import { DurableObject } from "cloudflare:workers";


export class MyDurableObjectx extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    // Required, as we're extending the base class.
      super(ctx, env)

      // The SQLite database is accessed via ctx.storage.sql
    this.sql = ctx.storage.sql;

    // Initialize the table if it doesn't exist
    // In production, strictly prefer using Wrangler migrations instead of running DDL here.
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  }

    async getFullTable() {
    // const cursor = this.sql.exec("DELETE FROM kv_store");
    const cursor = this.sql.exec("SELECT * FROM kv_store");

    const allRows = cursor.toArray();

    // 3. Return as JSON
    return allRows
    }
    
    
  // 2. The PUT method (Insert or Overwrite)
    async put(key: string, value: string): Promise<string> {
    // We use 'INSERT OR REPLACE' which is the SQLite standard for KV updates
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)", 
      key, 
      value
    );
    return "OK";
  }

  // 3. The GET method
    async get(key: string): Promise<string> {
    // Prepare the query
const result = this.ctx.storage.sql
        .exec("SELECT value FROM kv_store WHERE key = ?", key)

    const row = result.next();

    // If result.done is true, no row was found
    if (row.done) {
      return null;
    }
    
    // Return the 'value' column
    return row.value.value;
  }
    

}


export interface Env {
    // If you set another name in the Wrangler config file as the value for 'binding',
    // replace "AI" with the variable name you defined.
    AI: Ai;
}


export default {
    async fetch(request, env, ctx): Promise<Response> {
	
	const { url } = request;

	console.log(url);

	//  https://developers.cloudflare.com/workers/examples/read-post/
	
	async function readRequestBody(request: Request) {
	    const contentType = request.headers.get("content-type");
	    if (contentType.includes("application/json")) {
		return (await request.json());
	    } else if (contentType.includes("application/text")) {
		return request.text();
	    } else if (contentType.includes("text/html")) {
		return request.text();
	    } else if (contentType.includes("form")) {
		const formData = await request.formData();
		const body = {};
		for (const entry of formData.entries()) {
		    body[entry[0]] = entry[1];
		}
		return JSON.stringify(body);

	    } else {
		// Perhaps some other type of data was submitted in the form
		// like an image, or some other binary data.
		return "a file";
	    }
	}
	
	//  https://developers.cloudflare.com/workers/examples/cors-header-proxy/

	const corsHeaders = {
	    "Access-Control-Allow-Origin": "*",
	    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
	    "Access-Control-Max-Age": "86400",
	    Allow: "GET, HEAD, POST, OPTIONS",
	};

	const url_req = new URL(request.url);

	if (request.method === "OPTIONS") {
	    
            // Handle CORS preflight requests
	    
	    return new Response(null, {
		headers: {
		    ...corsHeaders,
		    "Access-Control-Allow-Headers": request.headers.get(
			"Access-Control-Request-Headers",
		    ),
		},
	    });
	    
	} else if (request.method === "POST") {

	    const reqBody = await readRequestBody(request);

	    const name = reqBody["username"];

	    console.log(name)

	    const history = await deduce_history(name, reqBody["prompt"], env, ctx);
	    
	    const padded_prompt = `My name is ${name}. Here is my long-term history (full history within upcoming brackets): ( ${history} ). ${reqBody["prompt"]}.`

	    console.log(padded_prompt)

	    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
		messages: [
		    { 
			role: "system", 
			content: "You are a psycologist, so psychoanalyse this. You must be as short as possible." 
		    },
		    { 
			role: "user", 
			content: padded_prompt
		    }]
	    });
	    
	    console.log(response)
	    
	    return new Response(JSON.stringify(response), {
		headers: corsHeaders
	    })
	}

	return Response(url_req);

    }
}satisfies ExportedHandler<Env>;


async function deduce_history(name: string, prompt: string, env, ctx) {

    if (name !== "anonymous") {

	const id = env.MY_DURABLE_OBJECT.idFromName("global-store");

	const stub = env.MY_DURABLE_OBJECT.get(id);

	const full_table = await stub.getFullTable()

	console.log(full_table)
	
	const [history_new, history_prev] = await Promise.all([
	    env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
		messages: [
		    { 
			role: "system", 
			content: "You only extract information. Extract all facts provided, or if there are none, say: 'MATCH_NOT_FOUND'." 
		    },
		    { 
			role: "user", 
			content: `${prompt}` 
		    }]
	    }),
	    stub.get(name)
	])
	
	console.log("history1", history_new["response"], "history2", history_prev)

	let history_accumulated = '';

	if (history_new["response"].includes( "MATCH_NOT_FOUND") === false) {

	    history_accumulated = history_new["response"];

	}

	if (history_prev) {

	    history_accumulated = history_accumulated + history_prev;
	    
	}

	const status = await stub.put(name, history_accumulated)

	console.log(status)

	const full_table_2 = await stub.getFullTable()

	console.log(full_table_2)

	return history_accumulated;
	
    } else {

	const history = "";

    }

    
}
