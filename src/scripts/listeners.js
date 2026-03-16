import { fetchGIFs, fetchTrendingGIFs } from "./requests.js";
import { displayGIFs } from "./loadContent.js";

browser.runtime.onInstalled.addListener(async () => {
    try {
        const trendingGIFs = await fetchTrendingGIFs();
        displayGIFs(trendingGIFs);
    } catch(error) {
        console.log(error);
    }

});

