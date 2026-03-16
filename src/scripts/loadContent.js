
export function displayGIFs(gifs, page = 1, quality = 'hd') {
    if (gifs.result){
        const gifObj = gifs.data.data[0].file[quality];
        
        if (gifObj == null){
            console.log('gifObj is null');
            return;
        }

        for (const [ filetype, imgData ] of Object.entries(gifObj)){
            const { url, width, height, size } = imgData;
            
            const imgGrid = document.getElementById("image-grid");
            const img = new Image(width, height);
            img.src = url;
            imgGrid.appendChild(img);
        }

    } else {
        console.log("Error: gifs object seems to be empty.");
    }
}
