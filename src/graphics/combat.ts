/// <reference path="../../../../types/browser.d.ts" />

const playerRepC = nodecg.Replicant<Players>('players');
const shownImageRep3 = nodecg.Replicant<string | null>('show-image');
const dmImg2 = document.getElementById('dm-img') as HTMLDivElement;

shownImageRep3.on('change', (newVal) => {
	if (newVal) {
		dmImg2.style.backgroundImage = `url(${newVal})`;
	} else dmImg2.style.backgroundImage = ``;
});

playerRepC.on('change', (newVal, oldVal) => {
	for (let i = 0; i < 6; i++) {
		const meter = document.getElementById('meter-' + (i + 1)) as HTMLDivElement;
		if (newVal[i] && newVal[i]!.character) {
			const newHealth =
				newVal[i]!.character!.currentHitPoints /
				newVal[i]!.character!.maxHitPoints;
			const newTransform = healthToTransform2(newHealth);
			const newColor = healthToColor2(newHealth);
			if (oldVal && oldVal[i] && oldVal[i]!.character) {
				//animate
				const oldHealth =
					oldVal[i]!.character!.currentHitPoints /
					oldVal[i]!.character!.maxHitPoints;
				if (oldHealth !== newHealth) {
					const oldTransform = healthToTransform2(oldHealth);
					const oldColor = healthToColor2(oldHealth);
					meter.animate(
						[
							{ transform: oldTransform, backgroundColor: oldColor },
							{ transform: newTransform, backgroundColor: newColor },
						],
						{
							duration: 5000,
							direction: 'normal',
							fill: 'forwards',
						}
					);
				}
			} else {
				meter.animate(
					[
						{ transform: newTransform, backgroundColor: newColor },
						{ transform: newTransform, backgroundColor: newColor },
					],
					{
						duration: 10,
						direction: 'normal',
						fill: 'forwards',
					}
				);
			}
		} else {
			meter.animate(
				[
					{ transform: healthToTransform2(0), backgroundColor: 'green' },
					{ transform: healthToTransform2(0), backgroundColor: 'green' },
				],
				{
					duration: 10,
					direction: 'normal',
					fill: 'forwards',
				}
			);
		}
	}
});

function healthToTransform2(num: number) {
	return `translateY(-${num * 100}%)`;
}

function healthToColor2(num: number) {
	console.log(num);
	if (num > 0.7) return '#006000';
	if (num > 0.25) return '#AA9900';
	return '#990000';
}
