import express from "express";
import { Waku, WakuMessage, PageDirection } from "js-waku";
import bodyParser from "body-parser";
import { createFusionOrder } from "./create-order.js";
import { syncOrderbookWithFusion } from "./get-active-orders.js";
import { FusionSDK, NetworkEnum } from "@1inch/fusion-sdk"
import cron from "node-cron"
const app = express();
const port = 3000;
const sdk = new FusionSDK({
  url: 'https://fusion.1inch.io',
  network: NetworkEnum.ETHEREUM
})
// Initialize an array to store the orders
let orderBook = [];

app.use(bodyParser.json());

const decodeWakuMessage = (wakuMessage) => {
  // No need to attempt to decode a message if the payload is absent
  if (!wakuMessage.payload) return;

  const { date, title, body } = proto.SimpleChatMessage.decode(
    wakuMessage.payload
  );

  // In protobuf, fields are optional so best to check
  if (!date || !title || !body) return;

  const publishDate = new Date();
  publishDate.setTime(date);

  return { publishDate, title, body };
}

async function startWaku() {
  const waku = await Waku.create({
    bootstrap: {
      default: true
    },
  });

  console.log("Waku node created and started.");

  // Listen for messages on the /orderbook topic
  waku.relay.addObserver(
    (msg) => {
      if (msg.contentTopic === "/orderbook") {
        const messageText = new TextDecoder().decode(msg.payload);
        try {
          const order = JSON.parse(messageText);
          orderBook.push(order);
          console.log("Order added to orderBook:", order);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      }
    },
    ["/orderbook"]
  );
  
  const initScheduledJobs = () => {
    const scheduledJobFunction = cron.schedule("*/5 * * * *", async () => {
      console.log("I'm executed on a schedule!");
      const orders = await sdk.getActiveOrders()
      for (const order of orders.items){
        const payload = new TextEncoder().encode(JSON.stringify(order));
        await waku.relay.send(await WakuMessage.fromBytes(payload, "/fusionorderbook"));
        console.log('order sent to waku')
      }
    })
  
    scheduledJobFunction.start()
  }
  // Handle POST request to /create-order
  app.post("/create-order", async (req, res) => {
    console.log("Handle POST request to /create-order");

    try {
      const orderInfo = req.body;
      console.log("Request body: ", orderInfo);

      const order = await createFusionOrder(orderInfo);
      console.log("Received order:", order);

      const payload = new TextEncoder().encode(JSON.stringify(order));
      await waku.relay.send(await WakuMessage.fromBytes(payload, "/orderbook"));

      // Push new order to orderBook
      orderBook.push(order);

      res.send(`Order added to the orderbook: maker: ${order.order.maker}, salt: ${order.order.salt}`);
    } catch (e) {
      console.error(e);
      console.error("ERROR MESSAGE:  ", e.messageText);
    }
  });

  // Handle GET request to /orderbook
  app.get("/orderbook", async (req, res) => {
    try {
      const { page, limit } = req.query;
      console.log("Request body /orderbook: ", req.query);

      const allActiveOrder = await syncOrderbookWithFusion(
        Number(page),
        Number(limit),
        orderBook
      );

      res.json(allActiveOrder);
    } catch (e) {
      console.error("ERROR GET /orderbook");
      console.error(e);
    }
  });
  
  //app.get(`/orders/v1.0/${NetworkEnum.ETHEREUM}/order/active/`, async (req, res) => {
  app.get(`/test/`, async (req, res) => {
    try {
      const queryParams = req.query // Assuming the parameters are passed in the request body
      const params = { 
        page: queryParams.page ? Number(queryParams.page) : 1,
        limit: queryParams.limit ? Number(queryParams.limit) : 10,
      }

      // const node = await createWaku()
      // await waitForRemotePeer(node, [Protocols.Store])
      // const contentTopic = "/fusionOrderBook"
      // Create a message decoder
      //const decoder = createDecoder(contentTopic)
      // Create the store query
      const storeQuery = await waku.store.queryHistory(["/fusionorderbook"], {
        pageSize: 1,
        pageDirection: PageDirection.BACKWARD,
        callback: function (msgs) {
          return msgs
        },
      })
      console.log(storeQuery)
      const items = []
      // Process the messages
      for await (const messagesPromises of storeQuery) {
          // Fulfil the messages promises
          const messages = await Promise.all(messagesPromises
              .map(async (p) => {
                  const msg = await p
                  // Render the message/payload in your application
                  if (msg) {
                    items.push(msg.payload)
                  }
              })
          )
      }
      //The queryGenerator() function always returns the oldest messages in a page first.
      const filteredOrders = paginate(items.reverse(), params.limit, params.page)
      const orders = {items: filteredOrders, meta: {totalItems: items.length, currentPage: params.page, itemsPerPage: params.limit, totalPages: Math.ceil(items.length / params.limit)}}
      res.json(orders) // Return the response as JSON
    } catch (e) {
        console.error("ERROR GET fusion orders");
        console.error(e);
    }
  });
  initScheduledJobs()
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

startWaku().catch((e) => {
  console.error("Error starting Waku node:", e);
});
