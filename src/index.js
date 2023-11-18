import express from "express";
import { Waku, WakuMessage } from "js-waku";
import bodyParser from "body-parser";
import { createFusionOrder } from "./create-order.js";
import { syncOrderbookWithFusion } from "./get-active-orders.js";

const app = express();
const port = 3000;

// Initialize an array to store the orders
let orderBook = [];

app.use(bodyParser.json());

async function startWaku() {
  const waku = await Waku.create({
    bootstrap: {
      default: true,
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

      res.send("Order added to the orderbook");
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

      // const allActiveOrder = []
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

  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

startWaku().catch((e) => {
  console.error("Error starting Waku node:", e);
});
