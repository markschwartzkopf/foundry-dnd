/// <reference path="../../../../types/browser.d.ts" />

const shownImageRep = nodecg.Replicant<string | null>('show-image');

shownImageRep.on('change', (newVal) => {
	if (newVal) {
		document.body.style.backgroundImage = `url(${newVal})`;
	} else document.body.style.backgroundImage = ``;
});
