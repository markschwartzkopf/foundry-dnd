/// <reference path="../../../../types/browser.d.ts" />

const logosRep = nodecg.Replicant<Asset[]>('assets:dm-images');
const shownImageRep = nodecg.Replicant<string | null>('show-image');

const imageDiv = document.getElementById('dm-images') as HTMLDivElement;

const showImg = document.createElement('div');
showImg.id = 'show-img';

showImg.onclick = () => {
  shownImageRep.value = null;
};
//document.body.appendChild(showImg);

logosRep.on('change', (newVal) => {
	imageDiv.innerHTML = '';
	if (newVal) {
		for (let i = 0; i < newVal.length; i++) {
			const asset = newVal[i];
			const img = document.createElement('img');
			img.style.minHeight = '25vh';
      img.style.maxHeight = '25vh';
			img.src = asset.url;
			img.onclick = () => {
				shownImageRep.value = asset.url;
			};
			imageDiv.appendChild(img);
			console.log(asset);
		}
	}
});

shownImageRep.on('change', (newVal) => {
	if (newVal) {
		showImg.style.backgroundImage = `url(${newVal})`;
    if (!document.body.contains(showImg)) document.body.appendChild(showImg);
	} else if (document.body.contains(showImg)) document.body.removeChild(showImg);
});
