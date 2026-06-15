<script>
    import { fetchGIFs, fetchTrendingGIFs, saveApiKey } from './scripts/requests.js';

    let view = $state('loading');
    let apiKeyInput = $state('');
    let settingsError = $state(null);
    let saving = $state(false);
    let theme = $state('system');

    let query = $state('');
    let gifs = $state([]);
    let loading = $state(false);
    let error = $state(null);

    let page = $state(1);
    let hasMore = $state(false);
    let loadingMore = $state(false);
    let activeQuery = $state('');
    let sentinel = $state(null);
    let copiedUrl = $state(null);

    const FORMAT_PRIORITY = ['gif', 'webp', 'mp4', 'webm'];

    function extractGifs(response) {
        if (!response?.data?.data) return [];
        return response.data.data.map(gif => {
            const files = gif.file?.sm;
            if (!files) return null;
            for (const fmt of FORMAT_PRIORITY) {
                const file = files[fmt];
                if (file) return { url: file.url, width: file.width, height: file.height };
            }
            return null;
        }).filter(Boolean);
    }

    async function checkApiKey() {
        try {
            const { api_key, theme: savedTheme } = await browser.storage.local.get(['api_key', 'theme']);
            if (savedTheme) applyTheme(savedTheme);
            view = api_key ? 'main' : 'settings';
            if (api_key && !savedTheme) applyTheme('system');
            if (api_key) loadTrending();
        } catch {
            view = 'settings';
        }
    }

    async function handleSaveKey() {
        saving = true;
        settingsError = null;
        try {
            await saveApiKey(apiKeyInput);
            view = 'main';
            loadTrending();
        } catch (e) {
            settingsError = e.message;
        } finally {
            saving = false;
        }
    }

    async function openSettings() {
        const { api_key } = await browser.storage.local.get('api_key');
        apiKeyInput = api_key || '';
        view = 'settings';
    }

    function closeSettings() {
        view = 'main';
    }

    async function copyGifUrl(url) {
        try {
            await navigator.clipboard.writeText(url);
            copiedUrl = url;
            setTimeout(() => { if (copiedUrl === url) copiedUrl = null; }, 1500);
        } catch {
            // fallback for contexts where clipboard API is unavailable
        }
    }

    async function applyTheme(value) {
        theme = value;
        await browser.storage.local.set({ theme: value });
        const html = document.documentElement;
        if (value === 'system') {
            html.removeAttribute('data-theme');
        } else {
            html.setAttribute('data-theme', value);
        }
    }

    async function loadTrending() {
        page = 1;
        gifs = [];
        activeQuery = '';
        loading = true;
        error = null;
        try {
            const data = await fetchTrendingGIFs({ page: 1 });
            gifs = extractGifs(data);
            hasMore = data?.data?.has_next === true;
        } catch (e) {
            error = e.message;
            gifs = [];
        } finally {
            loading = false;
        }
    }

    async function handleSearch(e) {
        e.preventDefault();
        const q = query.trim();
        if (!q) return;

        page = 1;
        gifs = [];
        activeQuery = q;
        loading = true;
        error = null;
        try {
            const data = await fetchGIFs(q, { page: 1 });
            gifs = extractGifs(data);
            hasMore = data?.data?.has_next === true;
        } catch (e) {
            error = e.message;
            gifs = [];
        } finally {
            loading = false;
        }
    }

    async function loadMore() {
        if (loadingMore || !hasMore) return;
        loadingMore = true;
        const nextPage = page + 1;
        try {
            const data = activeQuery
                ? await fetchGIFs(activeQuery, { page: nextPage })
                : await fetchTrendingGIFs({ page: nextPage });
            const newGifs = extractGifs(data);
            gifs = [...gifs, ...newGifs];
            page = nextPage;
            hasMore = data?.data?.has_next === true;
        } catch (e) {
            console.error('Failed to load more:', e);
        } finally {
            loadingMore = false;
        }
    }

    $effect(() => {
        checkApiKey();
    });

    $effect(() => {
        const el = sentinel;
        if (!el) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                loadMore();
            }
        }, { rootMargin: '200px' });
        observer.observe(el);
        return () => observer.disconnect();
    });
</script>

{#if view === 'settings'}
<div id="popup-window">
    <div id="settings-view">
        <div id="settings-header">
            <button id="back-btn" onclick={closeSettings} title="Back">
                &#8592;
            </button>
            <svg class="logo" viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
                <path d="M4 8 L8 4 L12 10 L10 14 Z" fill="var(--accent)"/>
                <path d="M28 8 L24 4 L20 10 L22 14 Z" fill="var(--accent)"/>
                <path d="M4 8 L2 18 L10 20 L16 28 L22 20 L30 18 L28 8 L24 4 L20 10 L16 6 L12 10 L8 4 Z" fill="var(--accent)" stroke="var(--accent)" stroke-width=".8"/>
                <path d="M10 20 L16 28 L22 20 L20 22 L16 24 L12 22 Z" fill="#f0ebe3"/>
                <circle cx="12" cy="14" r="1.5" fill="#000"/>
                <circle cx="20" cy="14" r="1.5" fill="#000"/>
                <circle cx="16" cy="19" r="1.2" fill="#222"/>
            </svg>
            <h2>Settings</h2>
        </div>
        <div id="settings-body">
            <p class="settings-desc">
                {apiKeyInput ? 'Update your Klipy API key below.' : 'Enter your Klipy API key to start searching GIFs.'}
            </p>
            <form onsubmit={handleSaveKey}>
                <div id="input-wrap">
                    <input
                        type="text"
                        id="api-key-input"
                        placeholder="Paste your API key here"
                        bind:value={apiKeyInput}
                    />
                </div>
                <button type="submit" id="save-btn" disabled={saving}>
                    {saving ? 'Saving...' : apiKeyInput ? 'Update' : 'Save'}
                </button>
            </form>
            {#if settingsError}
                <p class="status error">{settingsError}</p>
            {/if}
            <p class="settings-hint">
                Don't have a key?
                <a href="https://docs.klipy.com/" target="_blank" rel="noopener">Get one from Klipy</a>
            </p>
            <hr class="settings-divider">
            <div id="theme-section">
                <span class="settings-label">Theme</span>
                <div id="theme-options">
                    {#each ['system', 'light', 'dark'] as value}
                        <button
                            class="theme-btn"
                            class:active={theme === value}
                            onclick={() => applyTheme(value)}
                        >
                            {value.charAt(0).toUpperCase() + value.slice(1)}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>
{:else}
<div id="popup-window">
<div id="search-header">
    <svg class="logo" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <path d="M4 8 L8 4 L12 10 L10 14 Z" fill="var(--accent)"/>
        <path d="M28 8 L24 4 L20 10 L22 14 Z" fill="var(--accent)"/>
        <path d="M4 8 L2 18 L10 20 L16 28 L22 20 L30 18 L28 8 L24 4 L20 10 L16 6 L12 10 L8 4 Z" fill="var(--accent)" stroke="var(--accent)" stroke-width=".8"/>
        <path d="M10 20 L16 28 L22 20 L20 22 L16 24 L12 22 Z" fill="#f0ebe3"/>
        <circle cx="12" cy="14" r="1.5" fill="#000"/>
        <circle cx="20" cy="14" r="1.5" fill="#000"/>
        <circle cx="16" cy="19" r="1.2" fill="#222"/>
    </svg>
    <form onsubmit={handleSearch}>
        <input
            type="text"
            id="search-box"
            placeholder="Search for GIFs..."
            bind:value={query}
        />
    </form>
    <button id="settings-btn" onclick={openSettings} title="Settings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    </button>
</div>

<div id="result-window">
    {#if loading && gifs.length === 0}
        <p class="status">Loading...</p>
    {:else if error && gifs.length === 0}
        <p class="status error">{error}</p>
    {:else if gifs.length === 0}
        <p class="status">No GIFs found. Try a different search.</p>
    {:else}
        <div id="image-grid">
            {#each gifs as gif}
                <div class="gif-cell" class:copied={copiedUrl === gif.url} role="button" tabindex="0" onclick={() => copyGifUrl(gif.url)} onkeydown={(e) => e.key === 'Enter' && copyGifUrl(gif.url)}>
                    <img
                        src={gif.url}
                        alt="GIF"
                        loading="lazy"
                    />
                    {#if copiedUrl === gif.url}
                        <span class="copied-badge">Copied!</span>
                    {/if}
                </div>
            {/each}
        </div>
        <div bind:this={sentinel} class="sentinel">
            {#if loadingMore}
                <p class="status">Loading more...</p>
            {/if}
        </div>
    {/if}
</div>
</div>
{/if}

<style>
    :global(:root) {
        --bg: #ffffff;
        --text: #222222;
        --border: #dddddd;
        --status: #888888;
        --header-border: #e0e0e0;
        --shadow: rgba(0, 0, 0, 0.2);
        --accent: #6c63ff;
        --hover-bg: rgba(0, 0, 0, 0.06);
    }

    @media (prefers-color-scheme: dark) {
        :global(:root) {
            --bg: #1a1a2e;
            --text: #e0e0e0;
            --border: #444444;
            --status: #999999;
            --header-border: #333333;
            --shadow: rgba(0, 0, 0, 0.6);
            --accent: #8b83ff;
            --hover-bg: rgba(255, 255, 255, 0.08);
        }
    }

    :global(:root[data-theme="light"]) {
        --bg: #ffffff;
        --text: #222222;
        --border: #dddddd;
        --status: #888888;
        --header-border: #e0e0e0;
        --shadow: rgba(0, 0, 0, 0.2);
        --accent: #6c63ff;
        --hover-bg: rgba(0, 0, 0, 0.06);
    }

    :global(:root[data-theme="dark"]) {
        --bg: #1a1a2e;
        --text: #e0e0e0;
        --border: #444444;
        --status: #999999;
        --header-border: #333333;
        --shadow: rgba(0, 0, 0, 0.6);
        --accent: #8b83ff;
        --hover-bg: rgba(255, 255, 255, 0.08);
    }

    #popup-window {
        width: 400px;
        height: 500px;
        background: var(--bg);
        color: var(--text);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .logo {
        flex-shrink: 0;
        display: block;
    }

    #search-header {
        padding: 12px 16px;
        background: var(--bg);
        border-bottom: 1px solid var(--header-border);
        display: flex;
        align-items: center;
        gap: 8px;
    }

    #search-header form {
        flex: 1;
    }

    #search-box {
        width: 100%;
        font-size: 16px;
        padding: 10px 14px;
        border: 2px solid var(--border);
        border-radius: 8px;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.2s;
        background: var(--bg);
        color: var(--text);
    }

    #search-box::placeholder {
        color: var(--status);
    }

    #search-box:focus {
        border-color: var(--accent);
    }

    #settings-btn {
        background: none;
        border: none;
        font-size: 22px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        color: var(--status);
        transition: color 0.15s;
        line-height: 1;
    }

    #settings-btn:hover {
        color: var(--text);
    }

    #result-window {
        flex: 1;
        overflow-y: auto;
        padding: 12px 16px;
        background: var(--bg);
    }

    #settings-view {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    #settings-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--header-border);
    }

    #settings-header h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
    }

    #back-btn {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 6px;
        color: var(--text);
        transition: background 0.15s;
        line-height: 1;
    }

    #back-btn:hover {
        background: var(--hover-bg);
    }

    #settings-body {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        flex: 1;
    }

    .settings-desc {
        margin: 0;
        color: var(--status);
        font-size: 14px;
    }

    #settings-body form {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    #input-wrap {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    #api-key-input {
        font-size: 14px;
        padding: 10px 14px;
        border: 2px solid var(--border);
        border-radius: 8px;
        outline: none;
        background: var(--bg);
        color: var(--text);
        font-family: monospace;
        width: 100%;
        box-sizing: border-box;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    #api-key-input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
    }

    #save-btn {
        padding: 10px 20px;
        background: var(--accent);
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.15s, transform 0.1s;
    }

    #save-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    #save-btn:not(:disabled):hover {
        opacity: 0.9;
    }

    #save-btn:not(:disabled):active {
        transform: scale(0.98);
    }

    .settings-hint {
        margin: 0;
        font-size: 12px;
        color: var(--status);
    }

    .settings-hint a {
        color: var(--accent);
    }

    .settings-divider {
        border: none;
        border-top: 1px solid var(--border);
        margin: 0;
    }

    #theme-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .settings-label {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--status);
    }

    #theme-options {
        display: flex;
        gap: 6px;
    }

    .theme-btn {
        flex: 1;
        padding: 8px 12px;
        border: 2px solid var(--border);
        border-radius: 8px;
        background: transparent;
        color: var(--text);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
    }

    .theme-btn:hover {
        border-color: var(--accent);
    }

    .theme-btn.active {
        border-color: var(--accent);
        background: color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .status {
        text-align: center;
        color: var(--status);
        padding: 32px 16px;
        font-size: 14px;
    }

    .status.error {
        color: #d32f2f;
    }

    #image-grid {
        column-width: 160px;
        column-gap: 1em;
    }

    .gif-cell {
        break-inside: avoid;
        margin-bottom: 1em;
        position: relative;
        cursor: pointer;
    }

    .gif-cell img {
        width: 100%;
        height: auto;
        border-radius: 6px;
        display: block;
        transition: transform 0.15s, box-shadow 0.15s;
    }

    .gif-cell:hover img {
        transform: scale(1.03);
        box-shadow: 0 4px 12px var(--shadow);
    }

    .gif-cell.copied img {
        opacity: 0.5;
    }

    .copied-badge {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        color: #fff;
        background: var(--accent);
        border-radius: 6px;
        pointer-events: none;
    }

    .sentinel {
        height: 1px;
    }

    form {
        margin: 0;
    }
</style>
