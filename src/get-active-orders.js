import { FusionSDK, NetworkEnum } from "@1inch/fusion-sdk";

const sdk = new FusionSDK({
  url: "https://fusion.1inch.io",
  network: NetworkEnum.ETHEREUM,
});

export const getFusionActiveOrders = async (page, limit) => {
  try {
    const res = await sdk.getActiveOrders({ page, limit });

    return res?.items
  } catch (e) {
    console.error("CANT GET ACTIVE ORDERS");
    console.error(e);
  }
};

export const syncOrderbookWithFusion = async (page, limit, orderbook) => {
  const ordersFromFusion = await getFusionActiveOrders(page, limit);
  console.log("ORDERS FROM FUSION", ordersFromFusion);

  // get orders from fusion that we don't have
  const missingFusionOrders = ordersFromFusion.filter(
    (fusionOrder) => !orderbook.some((order) => fusionOrder.order.salt === order.salt)
  );

  return orderbook.concat(missingFusionOrders);
};

export const syncFusionWithOrderbook = async (page, limit, orderbook) => {
  const ordersFromFusion = await getFusionActiveOrders(page, limit);
  console.log("ORDERS FROM FUSION", ordersFromFusion);

  // get orders from orderbook that fusion don't have
  const missingOrders = orderbook.filter(
    (order) =>
      !ordersFromFusion.some((fusionOrder) => fusionOrder.salt === order.salt)
  );

  return ordersFromFusion.concat(missingOrders);
};
