const { Waku } = require('js-waku');

async function startWaku() {
    // Create a Waku node
    const waku = await Waku.create({
        bootstrap: {
            default: true,
        },
    });

    console.log('Waku node created and started.');

    // Define a message payload
    const payload = new TextEncoder().encode('Hello, World!');

    // Send the message
    await waku.lightPush.push('your_topic_here', payload);

    console.log('Message sent!');
}

startWaku().catch((e) => {
    console.error('Error starting Waku node:', e);
});
