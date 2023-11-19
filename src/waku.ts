import { createLightNode, waitForRemotePeer} from "@waku/sdk";

// Create and start a Light Node
async function createWaku() {
  const node = await createLightNode({ defaultBootstrap: true })
  await node.start()
  await waitForRemotePeer(node)
  return node
  //const encoder = createEncoder({ contentTopic })
  //const decoder = createDecoder(contentTopic)
}

export default createWaku

