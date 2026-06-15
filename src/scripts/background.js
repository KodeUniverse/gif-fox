browser.runtime.onInstalled.addListener((details) => {
    console.log(`GIF Fox installed. Reason: ${details.reason}`);
});
