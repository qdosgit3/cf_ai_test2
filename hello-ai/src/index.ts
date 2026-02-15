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


export class superstore extends DurableObject<Env> {
    constructor(ctx: DurableObjectState, env: Env) {
	// Required, as we're extending the base class.
	super(ctx, env)
    }

    async update_history(name:string, history: string): Promise<string> {
	
	ctx.waitUntil(this.ctx.storage.kv.put(name, history))
	
    }

    async read_history(name: string): Promise<string> {
	
	let result = this.ctx.storage.kv.get(name);
	
	return result;
	
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

	    const name = deduce_name(reqBody["prompt"]);

	    const history = deduce_history(name);
	    
	    console.log(name)

	    const padded_prompt = `My name is ${name}. Here is my long-term history (full history within upcoming brackets): ( ${history} ). ${reqBody["prompt"]}. You are a psycologist, so please psychoanalyse this.`

	    console.log(padded_prompt)

	    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
		prompt: padded_prompt,
	    });
	    
	    console.log(response)
	    
	    return new Response(JSON.stringify(response), {
		headers: corsHeaders
	    })
	}

	return Response(url_req);

    }
}satisfies ExportedHandler<Env>;


function deduce_name(prompt: string) {

    const name_split = prompt.split("My name is ")

    if (name_split.length > 1) {

	// console.log(name_split)

	//  Store or lookup name.

	const name = name_split[1].split(' ').slice(0, 2).join(" ")

	console.log(name)

	return name

	//  If no history, store new person.

	//  Else concatenate history and send to LLM.

    } else {

	return "anonymous"

    }
}


async function deduce_history(name: string) {

    if (name !== "anonymous") {

	const stub = env.MY_DURABLE_OBJECT.getByName("superstore");
	
	const history_new = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
	    prompt: `Extract facts and history about writer of the following: ${reqBody["prompt"]}`
	});
	
	const history_prev = await stub.read_history(name);

	const history_accumulated = history_new + history_prev;

	const status = await stub.update_history(name, history_accumulated)

	console.log(status)

	return history_accumulated;
	
    } else {

	const history = "";

    }

    
}
