import express from 'express';
import { Waku, WakuMessage } from 'js-waku';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

// Initialize an array to store the orders
let orderBook  = [];

app.use(bodyParser.json());

async function startWaku() {
	const waku = await Waku.create({
		bootstrap: {
			default: true,
		},
	});

	console.log('Waku node created and started.');

	// Listen for messages on the /orderbook topic
	waku.relay.addObserver((msg) => {
		if (msg.contentTopic === '/orderbook') {
			const messageText = new TextDecoder().decode(msg.payload);
			try {
				const order = JSON.parse(messageText);
				orderBook.push(order);
				console.log('Order added to orderBook:', order);
			} catch (error) {
				console.error('Error parsing message:', error);
			}
		}
	}, ['/orderbook']);

	// Handle POST request to /create-order
	app.post('/create-order', async (req, res) => {
		const order = req.body;
		console.log('Received order:', order);

		const payload = new TextEncoder().encode(JSON.stringify(order));
		await waku.relay.send(await WakuMessage.fromBytes(payload, '/orderbook'));

		res.send('Order added to the orderbook');
	});

	// Handle GET request to /orderbook
	app.get('/orderbook', (req, res) => {
		res.json(orderBook);
	});

	app.listen(port, () => {
		console.log(`Server listening at http://localhost:${port}`);
	});
}

startWaku().catch((e) => {
	console.error('Error starting Waku node:', e);
});
