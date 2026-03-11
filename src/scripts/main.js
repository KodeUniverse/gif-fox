import "dotenv/config";

const API_KEY = process.env.GIF_API_KEY;

if (API_KEY == null){
    throw new Error("Could not read API key from .env file.");
}

const API_GIF_SEARCH = `https://api.klipy.com/api/v1/${API_KEY}/gifs/search`


//limit is the number of images to fetch
async function fetchGIFs(query, options = {
    per_page: 9,
    country_code: "us",
    content_filter: "off",
    customer_id: 1337 // any value works, there is only one customer since user is expected to have their own free API key.
}) { 

    console.log("Fetching GIFs from API...");
    try {
        
        const {per_page, locale, country_code, content_filter, customer_id} = options;
        
        const reqURL = API_GIF_SEARCH + 
            `?per_page=${per_page}&q=${query}&customer_id=${customer_id}&locale=${country_code}&content_filter=${content_filter}`

        const res = await fetch(reqURL);

        if (!res.ok)
            throw new Error(`HTTP ${res.status}: Klipy GIFs API request failed. \nRequest URL:${reqURL}`)
        console.log("GIF Search API request completed!");
        return res.json(); 
    } catch(error) {
        console.log(error);
    }
}

//browser.runtime.onInstalled.addListener(() => { //getelement returning undefined
//    const search_box = document.getElementById("search-box");
//    search_box.addEventListener("change", function(event){
//        fetchGIFs(search_box.textContent,API_KEY,9);
//    });
//});
//
