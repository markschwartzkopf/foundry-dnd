/// <reference path="../../../../types/browser.d.ts" />

const playerRep = nodecg.Replicant<Players>('players');
const showHealthRep = nodecg.Replicant<boolean>('showHeath');
const shownImageRep2 = nodecg.Replicant<string | null>('show-image');
const dmImg = document.getElementById('dm-img') as HTMLDivElement;

shownImageRep2.on('change', (newVal) => {
	if (newVal) {
		dmImg.style.backgroundImage = `url(${newVal})`;
	} else dmImg.style.backgroundImage = ``;
});

playerRep.on('change', (newVal, oldVal) => {
	for (let i = 0; i < 6; i++) {
		const meter = document.getElementById('meter-' + (i + 1)) as HTMLDivElement;
		if (newVal[i] && newVal[i]!.character) {
			const newHealth =
				newVal[i]!.character!.currentHitPoints /
				newVal[i]!.character!.maxHitPoints;
			const newTransform = healthToTransform(newHealth);
			const newColor = healthToColor(newHealth);
			if (oldVal && oldVal[i] && oldVal[i]!.character) {
				//animate
				const oldHealth =
					oldVal[i]!.character!.currentHitPoints /
					oldVal[i]!.character!.maxHitPoints;
				if (oldHealth !== newHealth) {
					const oldTransform = healthToTransform(oldHealth);
					const oldColor = healthToColor(oldHealth);
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
					{ transform: healthToTransform(0), backgroundColor: 'green' },
					{ transform: healthToTransform(0), backgroundColor: 'green' },
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

showHealthRep.on('change', (newVal) => {
	if (newVal) document.getElementById('right')!.style.opacity = '1';
});

function healthToTransform(num: number) {
	return `translateY(-${num * 100}%)`;
}

function healthToColor(num: number) {
	console.log(num);
	if (num > 0.7) return '#006000';
	if (num > 0.25) return '#AA9900';
	return '#990000';
}
