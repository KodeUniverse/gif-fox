import "dotenv/config";

const API_KEY = process.env.GIF_API_KEY;

if (API_KEY == null){
    throw new Error("Could not read API key from .env file.");
}

const GIF_API = `https://api.klipy.com/api/v1/${API_KEY}/gifs/`

export async function fetchGIFs(query, customer_id, options = {
    country_code: "us",
    content_filter: "off"
}) { 

    console.log("Fetching GIFs from API...");
    const { locale, country_code, content_filter } = options;
    
    const reqURL = GIF_API + 
        `search?per_page=${per_page}&q=${query}&customer_id=${customer_id}&locale=${country_code}&content_filter=${content_filter}`

    const res = await fetch(reqURL);

    if (!res.ok)
        throw new Error(`HTTP ${res.status}: Klipy GIFs API request failed. \nRequest URL:${reqURL}`)
    console.log("GIF Search API request completed!");
    return res.json(); 
}

export async function fetchTrendingGIFs(customer_id, options = {
    country_code: 'us',
    content_filter: 'off'
}){
    const { country_code, content_filter } = options;

    const reqURL = GIF_API + `trending?customer_id=${customer_id}&locale=${country_code}&content_filter=${content_filter}`;
    const res = await fetch(reqURL);
    if (!res.ok)
        throw new Error(`HTTP ${res.status}: Failed to fetch from Trending GIFs endpoint.`);
    return res.json();
}

