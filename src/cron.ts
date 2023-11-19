import cron from 'node-cron'
import { FusionSDK, NetworkEnum } from '@1inch/fusion-sdk';
import createWaku from './waku';
import { waitForRemotePeer, Protocols, createDecoder, createEncoder } from "@waku/sdk";
import protobuf from "protobufjs"

const Order = new protobuf.Type("Order")
  .add(new protobuf.Field("allowedSender", 1, "string"))
  .add(new protobuf.Field("interactions", 2, "string"))
  .add(new protobuf.Field("maker", 3, "string"))
  .add(new protobuf.Field("makerAsset", 4, "string"))
  .add(new protobuf.Field("makingAmount", 5, "string"))
  .add(new protobuf.Field("offsets", 6, "string"))
  .add(new protobuf.Field("receiver", 7, "string"))
  .add(new protobuf.Field("salt", 8, "string"))
  .add(new protobuf.Field("takerAsset", 9, "string"))
  .add(new protobuf.Field("takingAmount", 10, "string"))

const Outer = new protobuf.Type("Outer")
  .add(new protobuf.Field("orderHash", 1, "string"))
  .add(new protobuf.Field("signature", 2, "string"))
  .add(new protobuf.Field("deadline", 3, "string"))
  .add(new protobuf.Field("auctionStartDate", 4, "string"))
  .add(new protobuf.Field("auctionEndDate", 5, "string"))
  .add(new protobuf.Field("order", 6, "Order")) // Use the Order type defined earlier
  .add(new protobuf.Field("remainingMakerAmount", 7, "string"));

const sdk = new FusionSDK({
  url: 'https://fusion.1inch.io',
  network: NetworkEnum.ETHEREUM
})

const initScheduledJobs = () => {
  const scheduledJobFunction = cron.schedule("*/5 * * * *", async () => {
    console.log("I'm executed on a schedule!");
    const orders = await sdk.getActiveOrders()
    const node = await createWaku()
    // Wait for peer connections with specific protocols
    await waitForRemotePeer(node, [
      Protocols.LightPush,
      Protocols.Filter,
    ])
    // Choose a content topic
    const contentTopic = "/fusionOrderBook";
    // Create a message encoder and decoder
    const decoder = createDecoder(contentTopic);
    const encoder = createEncoder({
      contentTopic: contentTopic, // message content topic
      ephemeral: true, // allows messages to be persisted or not
    })
    for (const order of orders.items){
      const protoOuter = Outer.create(order)
      const serializedOuter = Outer.encode(protoOuter).finish()
      await node.lightPush.send(encoder, {
        payload: serializedOuter,
      })
      console.log('order sent to waku')
    }
  })

  scheduledJobFunction.start()
}

export default initScheduledJobs