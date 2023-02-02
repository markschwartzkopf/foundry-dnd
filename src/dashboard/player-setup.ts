/// <reference path="../../../../types/browser.d.ts" />

const playerRep = nodecg.Replicant<Players>('players');

playerRep.on('change', (newVal) => {
	//helper function:

	if (newVal) redraw(newVal);
});

function redraw(newVal: Players) {
	document.body.innerHTML = '';
	const playersDiv = document.createElement('div');
	playersDiv.className = 'players';
	for (let i = 0; i < newVal.length; i++) {
		playersDiv.appendChild(divFrom(newVal[i], i));
	}
	document.body.appendChild(playersDiv);
}

function divFrom(player: Player | null, i: number) {
	const playerDiv = document.createElement('div');
	playerDiv.className = 'player';
	const btn = document.createElement('button');
	if (!player) {
		btn.innerHTML = 'Add Player';
		btn.onclick = () => {
			NodeCG.waitForReplicants(playerRep)
				.then(() => {
					if (playerRep.value)
						playerRep.value[i] = { realName: '', character: null };
				})
				.catch((err) => {
					nodecg.log.error(err);
				});
		};
		playerDiv.appendChild(btn);
	} else {
		const nameDiv = document.createElement('div');
		nameDiv.innerHTML = 'Player Name: ';
		const nameInput = document.createElement('input');
		nameInput.value = player.realName;
		nameInput.onkeyup = (ev) => {
			if (ev.key == 'Enter') {
				NodeCG.waitForReplicants(playerRep)
					.then(() => {
						if (playerRep.value) {
							if (playerRep.value[i]) {
								console.log('hey');
								playerRep.value[i]!.realName = nameInput.value;
							} else
								playerRep.value[i] = {
									realName: nameInput.value,
									character: null,
								};
						}
					})
					.catch((err) => {
						nodecg.log.error(err);
					});
			}
		};
		nameInput.onblur = () => {
			waitDraw();
		};
		nameDiv.appendChild(nameInput);
		playerDiv.appendChild(nameDiv);
		const idDiv = document.createElement('div');
		idDiv.innerHTML = 'Player ID No: ';
		const idInput = document.createElement('input');
		idInput.value = player.character ? player.character.id.toString() : '';
		idDiv.appendChild(idInput);
		idInput.onkeyup = (ev) => {
			if (ev.key == 'Enter') {
				if (idInput.value === parseInt(idInput.value).toString()) {
					nodecg
						.sendMessage('pullPC', { index: i, id: parseInt(idInput.value) })
						.catch((err) => {
							nodecg.log.error(err);
						});
				} else waitDraw();
			}
		};
		idInput.onblur = () => {
			waitDraw();
		};
		playerDiv.appendChild(idDiv);
		if (player.character) {
			const infoDiv = document.createElement('div');
			infoDiv.innerHTML = `Name: ${player.character.name} - Level: ${player.character.level} - HP: ${player.character.currentHitPoints}/${player.character.maxHitPoints}`;
			playerDiv.appendChild(infoDiv);
		}

		btn.innerHTML = 'Remove Player';
		btn.onclick = () => {
			if (confirm('Really remove this player?')) {
				NodeCG.waitForReplicants(playerRep)
					.then(() => {
						if (playerRep.value) playerRep.value[i] = null;
					})
					.catch((err) => {
						nodecg.log.error(err);
					});
			}
		};
		playerDiv.appendChild(btn);
	}
	return playerDiv;
}

function waitDraw() {
	NodeCG.waitForReplicants(playerRep)
		.then(() => {
			if (playerRep.value) redraw(playerRep.value);
		})
		.catch((err) => {
			nodecg.log.error(err);
		});
}
