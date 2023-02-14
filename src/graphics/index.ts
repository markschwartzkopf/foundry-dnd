/// <reference path="../../../../types/browser.d.ts" />
export {};

const shownImageRep = nodecg.Replicant<string | null>('show-image');
const showCombatRep = nodecg.Replicant<boolean>('show-combat');
const showHealthRep = nodecg.Replicant<boolean>('showHeath');
const playerRep = nodecg.Replicant<Players>('players');
const playerNameDivs = [
	document.getElementById('player-name-1') as HTMLDivElement,
	document.getElementById('player-name-2') as HTMLDivElement,
	document.getElementById('player-name-3') as HTMLDivElement,
	document.getElementById('player-name-4') as HTMLDivElement,
	document.getElementById('player-name-5') as HTMLDivElement,
	document.getElementById('player-name-6') as HTMLDivElement,
];
const playerPortraitDivs = [
	document.getElementById('player-portrait-1') as HTMLDivElement,
	document.getElementById('player-portrait-2') as HTMLDivElement,
	document.getElementById('player-portrait-3') as HTMLDivElement,
	document.getElementById('player-portrait-4') as HTMLDivElement,
	document.getElementById('player-portrait-5') as HTMLDivElement,
	document.getElementById('player-portrait-6') as HTMLDivElement,
];
const healthMeters = [
	document.getElementById('hp-1') as HTMLDivElement,
	document.getElementById('hp-2') as HTMLDivElement,
	document.getElementById('hp-3') as HTMLDivElement,
	document.getElementById('hp-4') as HTMLDivElement,
	document.getElementById('hp-5') as HTMLDivElement,
	document.getElementById('hp-6') as HTMLDivElement,
];
const root = document.documentElement;
const dmImage = document.getElementById('dm-image') as HTMLDivElement;
const flexCover = document.getElementById('flex-cover') as HTMLDivElement;
let animHealth: NodeJS.Timeout | null = null;
const animSpeed = 50;
const hpAnimLength = 20;
let hpAnimState = 0;

showHealthRep.on('change', (newVal) => {
	if (newVal) {
		if (animHealth) clearInterval(animHealth);
		animHealth = setInterval(() => {
			hpAnimState -= 1;
			setHpAnim();
			if (hpAnimState <= 0 && animHealth) clearInterval(animHealth);
		}, animSpeed);
	} else {
		if (animHealth) clearInterval(animHealth);
		animHealth = setInterval(() => {
			hpAnimState += 1;
			setHpAnim();
			if (hpAnimState >= hpAnimLength && animHealth) clearInterval(animHealth);
		}, animSpeed);
	}
});

function setHpAnim() {
	root.style.setProperty(
		'--hp-bar-width',
		`${hpAnimState <= 15 ? 15 - hpAnimState : 0}px`
	);
	root.style.setProperty(
		'--hp-shade-opacity',
		`${hpAnimState < 15 ? (15 - hpAnimState) / 15 : 0}`
	);
	/* root.style.setProperty(
    '--player-border',
    hpAnimState <= 15 ? '5px' : `${5 + hpAnimState - 15}px`
  ); */
	root.style.setProperty(
		'--hp-border-width',
		hpAnimState <= 15 ? '5px' : `${5 - ((hpAnimState - 15) * 3) / 5}px`
	);
}

playerRep.on('change', (newVal, oldVal) => {
	if (newVal) {
		for (let i = 0; i < newVal.length; i++) {
			const player = newVal[i];
			if (player && player.character && player.isPresent) {
				playerNameDivs[i].innerHTML = player.character.name;
				if (player.character.avatarUrl) {
					playerPortraitDivs[i].style.display = 'block';
					playerPortraitDivs[
						i
					].style.backgroundImage = `url('${player.character.avatarUrl}')`;
				} else {
					playerPortraitDivs[i].style.display = 'none';
				}
        (healthMeters[i].parentNode as HTMLDivElement).style.display = 'block';
				const newHealth =
					newVal[i]!.character!.currentHitPoints /
					newVal[i]!.character!.maxHitPoints;
				const newColor = healthToColor2(newHealth);
				if (oldVal && oldVal[i] && oldVal[i]!.character) {
					//animate
					const oldHealth =
						oldVal[i]!.character!.currentHitPoints /
						oldVal[i]!.character!.maxHitPoints;
					if (oldHealth !== newHealth) {
						const oldColor = healthToColor2(oldHealth);
						healthMeters[i].animate(
							[
								{ height: `${oldHealth * 100}%`, backgroundColor: oldColor },
								{ height: `${newHealth * 100}%`, backgroundColor: newColor },
							],
							{
								duration: 5000,
								direction: 'normal',
								fill: 'forwards',
							}
						);
					}
				} else {
					healthMeters[i].animate(
						[
							{ height: `${newHealth * 100}%`, backgroundColor: newColor },
							{ height: `${newHealth * 100}%`, backgroundColor: newColor },
						],
						{
							duration: 10,
							direction: 'normal',
							fill: 'forwards',
						}
					);
				}
			} else {
				playerPortraitDivs[i].style.display = 'none';
        (healthMeters[i].parentNode as HTMLDivElement).style.display = 'none';
        playerNameDivs[i].innerHTML = '';
			}
		}
	}
});

shownImageRep.on('change', (newVal) => {
	if (newVal) {
		dmImage.style.backgroundImage = `url(${newVal})`;
		dmImage.style.animation = 'show 1000ms forwards';
	} else dmImage.style.animation = 'hide 1000ms forwards';
});

showCombatRep.on('change', (newVal) => {
	console.log(newVal);
	if (newVal) {
		flexCover.style.animation = 'hide 5000ms forwards';
	} else flexCover.style.animation = 'show 5000ms forwards';
});

function healthToColor2(num: number) {
	if (num > 0.7) return 'var(--good-health)';
	if (num > 0.25) return 'var(--mid-health)';
	return 'var(--low-health)';
}
