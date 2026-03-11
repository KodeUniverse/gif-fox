const API_KEY = process.env.GIF_API_KEY;

//limit is the number of images to fetch
async function fetchGIFs(query, apikey, limit) {
    print("Fetching GIFs from API...");
    try {
        const res = await fetch("https://g.tenor.com/v1/search?q="+query+"&key="+apikey+"&limit="+limit);

        if (!res.ok)
            throw new Error(`HTTP ${res.status}: Klipy GIFs API request failed.`)
        return res.json(); 
    } catch(error) {
        console.log(error);
    }
}


browser.runtime.onInstalled.addListener(() => { //getelement returning undefined
    const search_box = document.getElementById("search-box");
    search_box.addEventListener("change", function(event){
        fetchGIFs(search_box.textContent,API_KEY,9);
    });
});

