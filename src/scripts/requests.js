let cachedApiKey = null;
let cachedCustomerId = null;

function buildGifApi(key) {
  return `https://api.klipy.com/api/v1/${key}/gifs/`;
}

async function getApiKey() {
  if (cachedApiKey) return cachedApiKey;

  try {
    const result = await browser.storage.local.get("api_key");
    if (result.api_key) {
      cachedApiKey = result.api_key;
      return cachedApiKey;
    }
  } catch {
    // storage unavailable
  }

  return null;
}

export async function saveApiKey(key) {
  const trimmed = key.trim();
  if (!trimmed) throw new Error("API key cannot be empty.");
  cachedApiKey = trimmed;
  await browser.storage.local.set({ api_key: trimmed });
}

async function getCustomerId() {
  if (cachedCustomerId) return cachedCustomerId;

  try {
    const result = await browser.storage.local.get("customer_id");
    if (result.customer_id) {
      cachedCustomerId = result.customer_id;
      return cachedCustomerId;
    }
  } catch {
    // storage unavailable
  }

  const id = crypto.randomUUID();
  cachedCustomerId = id;

  try {
    await browser.storage.local.set({ customer_id: id });
  } catch {
    // non-critical; id is still valid for this session
  }

  return id;
}

async function assertApiReady() {
  const key = await getApiKey();
  if (!key) throw new Error("API key not set. Open extension settings to add your Klipy API key.");
  return key;
}

export async function fetchGIFs(query, options = {}) {
  const apiKey = await assertApiReady();
  const {
    customer_id = await getCustomerId(),
    page = 1,
    per_page = 10,
    country_code = "us",
    content_filter = "off",
  } = options;

  const params = new URLSearchParams({
    per_page: String(per_page),
    q: query,
    customer_id,
    locale: country_code,
    content_filter,
  });

  if (page > 1) params.set("page", String(page));

  const reqURL = buildGifApi(apiKey) + `search?${params}`;

  const res = await fetch(reqURL);

  if (!res.ok)
    throw new Error(
      `HTTP ${res.status}: Klipy GIFs API request failed.\nRequest URL: ${reqURL}`,
    );

  return res.json();
}

export async function fetchTrendingGIFs(options = {}) {
  const apiKey = await assertApiReady();
  const {
    customer_id = await getCustomerId(),
    page = 1,
    country_code = "us",
    content_filter = "off",
    per_page = 10,
  } = options;

  const params = new URLSearchParams({
    customer_id,
    locale: country_code,
    content_filter,
    per_page: String(per_page),
  });

  if (page > 1) params.set("page", String(page));

  const reqURL = buildGifApi(apiKey) + `trending?${params}`;
  const res = await fetch(reqURL);

  if (!res.ok)
    throw new Error(
      `HTTP ${res.status}: Failed to fetch from Trending GIFs endpoint.`,
    );

  return res.json();
}
