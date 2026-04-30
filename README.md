# botine

AI Assistant using Zoho Cliq as channel, Venice AI as agent and Brave Search API as web search tool.

## Prerequisites
- Node.js
- PM2 installed globally (`npm install pm2 -g`)

## Installation

1. Clone the repository
2. Run `npm install` to install dependencies
3. Build the project `npm run build`

## Configuration

1. Copy the .env.example file `cp .env.example .env`
2. Modify the environment variables

## Start the server

- Run `pm2 start dist/index.js`

## Zoho Cliq Bot Setup

### Create a bot

1. Go to you user profile
2. Go to Bots & Tools
3. Click on Create Bot

### Setup bot handlers

1. Go over the created bot
2. Click on Edit Handlers

Add the following code to the Message Handler:

```
apiHeaders = Map();
apiHeaders.put("Authorization","Bearer <Your Botine API key>");
apiHeaders.put("Content-Type","application/json");
body_data = Map();
body_data.put("message",message);
apiResponse = invokeurl
[
	url :"https://<your url to the botine server>/api/v1/chat/"
	type :POST
	body:body_data.toString()
	headers:apiHeaders
];
return apiResponse;
```
