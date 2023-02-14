/// <reference path="../../../../types/browser.d.ts" />
export {};

const showHealthRep = nodecg.Replicant<boolean>('showHeath');
const shownImageRep = nodecg.Replicant<string | null>('show-image');
const showCombatRep = nodecg.Replicant<boolean>('show-combat');
const playerRep = nodecg.Replicant<Players>('players');

const showHpButton = document.getElementById('hp-meters') as HTMLButtonElement;
const hideImageButton = document.getElementById(
	'hide-image'
) as HTMLButtonElement;
const showCombatButton = document.getElementById(
	'combat-cam'
) as HTMLButtonElement;
const playersPresentDiv = document.getElementById(
	'players-present'
) as HTMLDivElement;

playerRep.on('change', (newVal) => {
	if (newVal) {
		playersPresentDiv.innerHTML = '';
		for (let i = 0; i < newVal.length; i++) {
			const player = newVal[i];
			const playerDiv = document.createElement('div');
			const checkBox = document.createElement('input');
			checkBox.type = 'checkbox';
			checkBox.checked = false;
			checkBox.onclick = () => {
				NodeCG.waitForReplicants(playerRep)
					.then(() => {
						if (playerRep.value && playerRep.value[i]) {
							playerRep.value[i]!.isPresent = checkBox.checked;
						} else checkBox.checked = false;
					})
					.catch((err) => {
						nodecg.log.error(err);
					});
			};
			if (player && player.isPresent) checkBox.checked = true;
			playerDiv.appendChild(checkBox);
			const label = document.createElement('span');
			if (player)
				label.innerHTML = `${player.realName} - ${player.character?.name}`;
			playerDiv.appendChild(label);
			playersPresentDiv.appendChild(playerDiv);
		}
	}
});

showHealthRep.on('change', (newVal) => {
	if (newVal !== undefined) {
		if (newVal) {
			showHpButton.innerHTML = 'Hide HP';
			showHpButton.onclick = () => {
				showHealthRep.value = false;
			};
		} else {
			showHpButton.innerHTML = 'Show HP';
			showHpButton.onclick = () => {
				showHealthRep.value = true;
			};
		}
	}
});

hideImageButton.onclick = () => {
	shownImageRep.value = null;
};

showCombatRep.on('change', (newVal) => {
	if (newVal !== undefined) {
		if (newVal) {
			showCombatButton.innerHTML = 'Hide Combat';
			showCombatButton.onclick = () => {
				showCombatRep.value = false;
			};
		} else {
			showCombatButton.innerHTML = 'Show Combat';
			showCombatButton.onclick = () => {
				showCombatRep.value = true;
			};
		}
	}
});
