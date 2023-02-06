/// <reference path="../../../../types/browser.d.ts" />

const playerRep2 = nodecg.Replicant<Players>('players');
const battlePlayerRep = nodecg.Replicant<BattlePlayers>('battle-players');
const battleNPCRep = nodecg.Replicant<BattleNPC[]>('battle-npcs');

const monsterSelect = document.getElementById(
	'monster-select'
) as HTMLDivElement;
const monsterSelectModal = document.getElementById(
	'monster-selector'
) as HTMLDivElement;
const monsterSelectWindow = document.getElementById(
	'monster-selector-window'
) as HTMLDivElement;
const monsterModal = document.getElementById('monster-modal') as HTMLDivElement;
const monsterWindow = document.getElementById(
	'monster-window'
) as HTMLDivElement;
const editModal = document.getElementById('edit-modal') as HTMLDivElement;
const editWindow = document.getElementById('edit-window') as HTMLDivElement;
const pcsDiv = document.getElementById('pcs') as HTMLDivElement;
const npcsDiv = document.getElementById('npcs') as HTMLDivElement;
const combatDiv = document.getElementById('combat-players') as HTMLDivElement;
const addNPC = document.getElementById('add') as HTMLDivElement;
const minSelect = document.getElementById('min-challenge') as HTMLInputElement;
const minNum = document.getElementById('min-challenge-num') as HTMLInputElement;
const maxSelect = document.getElementById('max-challenge') as HTMLInputElement;
const maxNum = document.getElementById('max-challenge-num') as HTMLInputElement;
const searchInput = document.getElementById('search') as HTMLInputElement;

let monsterDb: null | SRDMonster[] = null;
let maxChallenge = 30;
let minChallenge = 0;
let searchStr = '';

addNPC.onclick = () => {
	monsterSelectModal.style.display = 'flex';
};

playerRep2.on('change', (newVal) => {
	if (newVal) {
		pcsDiv.innerHTML = '';
		for (let i = 0; i < newVal.length; i++) {
			const player = newVal[i];
			if (player) {
				pcsDiv.appendChild(playerDiv(player, 'staged', i));
			}
		}
	}
});

battlePlayerRep.on('change', (newVal) => {
	if (newVal) {
		combatDiv.innerHTML = '';
		combatDiv.style.opacity = newVal.length ? '1' : '0';
		for (let i = 0; i < newVal.length; i++) {
			const player = newVal[i];
			if (player) {
				combatDiv.appendChild(playerDiv(player, 'combat', i));
			}
		}
	}
});

battleNPCRep.on('change', (newVal) => {
	if (newVal) {
		npcsDiv.style.opacity = newVal.length ? '1' : '0';
		npcsDiv.innerHTML = '';
		for (let i = 0; i < newVal.length; i++) {
			const player = newVal[i];
			if (player) {
				npcsDiv.appendChild(playerDiv(player, 'staged', i));
			}
		}
	}
});

function playerDiv(
	player: BattlePlayer,
	kind: 'staged' | 'combat',
	index: number
): HTMLDivElement {
	const rtn = document.createElement('div');
	rtn.className = 'player';
	if (kind === 'staged') {
		const sendDiv = document.createElement('div');
		sendDiv.className = 'control-icon';
		sendDiv.innerHTML = '<';
		sendDiv.onclick = () => {
			NodeCG.waitForReplicants(battlePlayerRep)
				.then(() => {
					if (
						battlePlayerRep.value &&
						!containsPlayer(battlePlayerRep.value, player)
					)
						battlePlayerRep.value.push(player);
				})
				.catch((err) => {
					nodecg.log.error(err);
				});
		};
		rtn.appendChild(sendDiv);
	} else {
		rtn.appendChild(
			deleteIcon(() => {
				NodeCG.waitForReplicants(battlePlayerRep)
					.then(() => {
						if (battlePlayerRep.value) battlePlayerRep.value.splice(index, 1);
					})
					.catch((err) => {
						nodecg.log.error(err);
					});
			})
		);
	}
	const labelDiv = document.createElement('div');
	labelDiv.className = 'player-label';
	const b = document.createElement('b');
	let info = '';
	if (player.type === 'pc') {
		b.innerHTML = player.character ? player.character.name : player.realName;
		//if (player.initiative) info = ` Initiative: ${player.initiative}`;
	} else {
		b.innerHTML = player.name ? player.name : player.monsterName;
		info = ` ${player.currentHitPoints}/${player.maxHitPoints}`;
		//if (player.initiative) info += ` Initiative: ${player.initiative}`;
	}
	labelDiv.appendChild(b);
	labelDiv.innerHTML += info;
	rtn.appendChild(labelDiv);
	if (kind === 'combat' || player.type === 'npc') {
		const editDiv = document.createElement('div');
		editDiv.className = 'control-icon';
		editDiv.innerHTML = '&#x270E;';
		editDiv.onclick = () => {
			modifyPlayer(player, kind, index);
		};
		rtn.appendChild(editDiv);
	}
	if (player.type === 'npc') {
		const lookDiv = document.createElement('div');
		lookDiv.className = 'control-icon';
		lookDiv.innerHTML = '&#128269;';
		lookDiv.onclick = () => {
			showMonsterModal(player, 'view');
		};
		rtn.appendChild(lookDiv);
		if (kind === 'staged')
			rtn.appendChild(
				deleteIcon(() => {
					NodeCG.waitForReplicants(battleNPCRep)
						.then(() => {
							if (battleNPCRep.value) battleNPCRep.value.splice(index, 1);
						})
						.catch((err) => {
							nodecg.log.error(err);
						});
				})
			);
	}
	return rtn;
}

function modifyPlayer(
	player: BattlePlayer,
	kind: 'staged' | 'combat',
	index: number
) {
	editWindow.innerHTML = '';
	const initDiv = document.createElement('div');
	const b = document.createElement('b');
	b.className = 'red-text';
	b.innerHTML = 'Initiative:';
	initDiv.appendChild(b);
	const initInput = document.createElement('input');
	initInput.type = 'number';
	initInput.inputMode = 'numeric';
	initInput.style.width = '3em';
	if (player.initiative !== null)
		initInput.value = player.initiative.toString();
	initInput.onkeydown = (ev) => {
		if (
			parseInt(ev.key).toString() !== ev.key &&
			ev.key !== 'Delete' &&
			ev.key !== 'Backspace' &&
			ev.key !== '.' &&
			ev.key !== 'ArrowLeft' &&
			ev.key !== 'ArrowRight'
		)
			ev.preventDefault();
		if (ev.key === 'Enter') editModal.style.display = 'none';
	};
	initInput.oninput = () => {
		const val = parseFloat(initInput.value);
		if (!isNaN(val)) {
			if (kind === 'combat') {
				NodeCG.waitForReplicants(battlePlayerRep)
					.then(() => {
						if (battlePlayerRep.value) {
							const sortArr: typeof battlePlayerRep.value = JSON.parse(
								JSON.stringify(battlePlayerRep.value)
							);
							sortArr[index].initiative = val;
							const player = JSON.stringify(sortArr[index]);
							sortArr.sort((a, b) => {
								const aInit = a.initiative !== null ? a.initiative : -1000;
								const bInit = b.initiative !== null ? b.initiative : -1000;
								return aInit < bInit ? 1 : -1;
							});
							for (let i = 0; i < sortArr.length; i++) {
								if (JSON.stringify(sortArr[i]) === player) index = i;
							}
							battlePlayerRep.value = sortArr;
						}
					})
					.catch((err) => {
						nodecg.log.error(err);
					});
			} else if (player.type === 'npc') {
				NodeCG.waitForReplicants(battleNPCRep)
					.then(() => {
						if (battleNPCRep.value) battleNPCRep.value[index].initiative = val;
					})
					.catch((err) => {
						nodecg.log.error(err);
					});
			}
		}
	};
	initDiv.appendChild(initInput);
	editWindow.appendChild(initDiv);
	if (player.type === 'npc') {
		const hpDiv = document.createElement('div');
		let b = document.createElement('b');
		b.className = 'red-text';
		b.innerHTML = 'Hit Points:';
		hpDiv.appendChild(b);
		const hpInput = document.createElement('input');
		hpInput.type = 'number';
		hpInput.pattern = '[0-9]*';
		hpInput.style.width = '3em';
		hpInput.value = player.currentHitPoints.toString();
		hpInput.onkeydown = (ev) => {
			if (
				parseInt(ev.key).toString() !== ev.key &&
				ev.key !== 'Delete' &&
				ev.key !== 'Backspace' &&
				ev.key !== '.' &&
				ev.key !== 'ArrowLeft' &&
				ev.key !== 'ArrowRight'
			)
				ev.preventDefault();
			if (ev.key === 'Enter') editModal.style.display = 'none';
		};
		hpInput.oninput = () => {
			const val = parseInt(hpInput.value);
			if (!isNaN(val)) {
				const rep = kind === 'combat' ? battlePlayerRep : battleNPCRep;
				NodeCG.waitForReplicants(rep)
					.then(() => {
						if (rep.value) {
							(rep.value[index] as BattleNPC).currentHitPoints = val;
						}
					})
					.catch((err) => {
						nodecg.log.error(err);
					});
			}
		};
		hpDiv.appendChild(hpInput);
		hpDiv.appendChild(document.createTextNode(`/${player.maxHitPoints}`));
		editWindow.appendChild(hpDiv);

		const nameDiv = document.createElement('div');
		b = document.createElement('b');
		b.className = 'red-text';
		b.innerHTML = 'Name:';
		nameDiv.appendChild(b);
		const nameInput = document.createElement('input');
		nameInput.style.width = '10em';
		nameInput.value = player.name ? player.name : '';
		nameInput.onkeydown = (ev) => {
			if (ev.key === 'Enter') editModal.style.display = 'none';
		};
		nameInput.oninput = () => {
			const rep = kind === 'combat' ? battlePlayerRep : battleNPCRep;
			NodeCG.waitForReplicants(rep)
				.then(() => {
					if (rep.value) {
						(rep.value[index] as BattleNPC).name = nameInput.value;
					}
				})
				.catch((err) => {
					nodecg.log.error(err);
				});
		};
		nameDiv.appendChild(nameInput);
		editWindow.appendChild(nameDiv);
	}
	editModal.style.display = 'flex';
}

function containsPlayer(rep: BattlePlayers, player: BattlePlayer) {
	let rtn = false;
	for (let i = 0; i < rep.length; i++) {
		if (JSON.stringify(rep[i]) === JSON.stringify(player)) rtn = true;
	}
	return rtn;
}

function deleteIcon(onclick?: (ev: MouseEvent) => void): HTMLDivElement {
	const deleteDiv = document.createElement('div');
	deleteDiv.className = 'control-icon';
	deleteDiv.innerHTML = '&#128465;';
	if (onclick) deleteDiv.onclick = onclick;
	return deleteDiv;
}

monsterSelectModal.onclick = () => {
	monsterSelectModal.style.display = 'none';
};

monsterSelectWindow.onclick = (ev) => {
	ev.stopPropagation();
};

monsterWindow.onclick = (ev) => {
	ev.stopPropagation();
};

monsterModal.onclick = () => {
	monsterModal.style.display = 'none';
};

editWindow.onclick = (ev) => {
	ev.stopPropagation();
};

editModal.onclick = () => {
	editModal.style.display = 'none';
};

searchInput.oninput = () => {
	searchStr = searchInput.value;
	populateMonsterSelect();
};

minSelect.oninput = () => {
	minNum.innerHTML = minSelect.value;
	if (parseInt(minSelect.value) > parseInt(maxSelect.value)) {
		maxSelect.value = minSelect.value;
		maxNum.innerHTML = maxSelect.value;
	}
	minChallenge = parseInt(minSelect.value);
	maxChallenge = parseInt(maxSelect.value);
	populateMonsterSelect();
};

maxSelect.oninput = () => {
	maxNum.innerHTML = maxSelect.value;
	if (parseInt(minSelect.value) > parseInt(maxSelect.value)) {
		minSelect.value = maxSelect.value;
		minNum.innerHTML = minSelect.value;
	}
	minChallenge = parseInt(minSelect.value);
	maxChallenge = parseInt(maxSelect.value);
	populateMonsterSelect();
};

function showMonsterModal(mon: Monster, type: 'add' | 'view') {
	monsterSelectModal.style.display = 'none';
	monsterWindow.innerHTML = '';
	const titleDiv = document.createElement('div');
	const nameDiv = document.createElement('div');
	nameDiv.className = 'monster-name';
	nameDiv.innerHTML = mon.monsterName;
	titleDiv.appendChild(nameDiv);
	let subtitle = mon.size ? mon.size : '';
	if (mon.monsterType)
		subtitle += !subtitle ? mon.monsterType : ' ' + mon.monsterType;
	if (mon.alignment)
		subtitle += !subtitle ? mon.alignment : ', ' + mon.alignment;
	if (subtitle) {
		const subtitleDiv = document.createElement('div');
		subtitleDiv.style.fontStyle = 'italic';
		subtitleDiv.innerHTML = subtitle;
		titleDiv.appendChild(subtitleDiv);
	}
	monsterWindow.appendChild(titleDiv);
	monsterWindow.appendChild(document.createElement('hr'));
	const acHpSpDiv = document.createElement('div');
	acHpSpDiv.className = 'red-text';
	let b = document.createElement('b');
	b.innerHTML = 'Armor Class';
	acHpSpDiv.appendChild(b);
	acHpSpDiv.innerHTML += ' ' + mon.armorClass.value;
	if (mon.armorClass.label) acHpSpDiv.innerHTML += ` (${mon.armorClass.label})`;
	acHpSpDiv.appendChild(document.createElement('br'));
	b = document.createElement('b');
	b.innerHTML = 'Hit Points';
	acHpSpDiv.appendChild(b);
	acHpSpDiv.innerHTML += ` ${mon.currentHitPoints}/${mon.maxHitPoints}`;
	if (mon.hitRoll) acHpSpDiv.innerHTML += ` (${mon.hitRoll})`;
	acHpSpDiv.appendChild(document.createElement('br'));
	b = document.createElement('b');
	b.innerHTML = 'Speed';
	acHpSpDiv.appendChild(b);
	acHpSpDiv.innerHTML += ` ${mon.speed}`;
	monsterWindow.appendChild(acHpSpDiv);
	monsterWindow.appendChild(document.createElement('hr'));
	const statsDiv = document.createElement('div');
	statsDiv.style.display = 'flex';
	statsDiv.className = 'stats-div';
	Object.keys(mon.stats).forEach((stat) => {
		const statDiv = document.createElement('div');
		statDiv.className = 'stat-div';
		b = document.createElement('b');
		b.innerHTML = stat.toUpperCase();
		statDiv.appendChild(b);
		const statNumDiv = document.createElement('div');
		statNumDiv.innerHTML = `${
			mon.stats[stat as keyof Monster['stats']]
		} (${statToModifier(mon.stats[stat as keyof Monster['stats']])})`;
		statDiv.appendChild(statNumDiv);
		statsDiv.appendChild(statDiv);
	});
	monsterWindow.appendChild(statsDiv);
	monsterWindow.appendChild(document.createElement('hr'));
	const attribsDiv = document.createElement('div');
	attribsDiv.className = 'red-text';
	if (mon.savingThrows) {
		const attribDiv = document.createElement('div');
		b = document.createElement('b');
		b.innerHTML = 'Saving Throws ';
		attribDiv.appendChild(b);
		attribDiv.innerHTML += mon.savingThrows
			.map(
				(x) =>
					`${x.stat.toUpperCase()} ${x.value >= 0 ? '+' + x.value : x.value}`
			)
			.join(', ');
		attribsDiv.appendChild(attribDiv);
	}
	if (mon.skills) {
		const attribDiv = document.createElement('div');
		b = document.createElement('b');
		b.innerHTML = 'Skills ';
		attribDiv.appendChild(b);
		attribDiv.innerHTML += mon.skills
			.map((x) => `${x.name} ${x.value >= 0 ? '+' + x.value : x.value}`)
			.join(', ');
		attribsDiv.appendChild(attribDiv);
	}
	if (mon.damageVulnerabilities) {
		const attribDiv = document.createElement('div');
		b = document.createElement('b');
		b.innerHTML = 'Damage Vulnerabilities ';
		attribDiv.appendChild(b);
		attribDiv.innerHTML += mon.damageVulnerabilities
			.map((x) => capitalize(x))
			.join(', ');
		attribsDiv.appendChild(attribDiv);
	}
	if (mon.damageResistances) {
		const attribDiv = document.createElement('div');
		b = document.createElement('b');
		b.innerHTML = 'Damage Resistances ';
		attribDiv.appendChild(b);
		attribDiv.innerHTML += mon.damageResistances
			.map((x) => capitalize(x))
			.join(', ');
		attribsDiv.appendChild(attribDiv);
	}
	if (mon.damageImmunities) {
		const attribDiv = document.createElement('div');
		b = document.createElement('b');
		b.innerHTML = 'Damage Immunities ';
		attribDiv.appendChild(b);
		attribDiv.innerHTML += mon.damageImmunities
			.map((x) => capitalize(x))
			.join(', ');
		attribsDiv.appendChild(attribDiv);
	}
	if (mon.conditionImmunities) {
		const attribDiv = document.createElement('div');
		b = document.createElement('b');
		b.innerHTML = 'Condition Immunities ';
		attribDiv.appendChild(b);
		attribDiv.innerHTML += mon.conditionImmunities
			.map((x) => capitalize(x))
			.join(', ');
		attribsDiv.appendChild(attribDiv);
	}
	if (mon.senses) {
		const attribDiv = document.createElement('div');
		b = document.createElement('b');
		b.innerHTML = 'Senses ';
		attribDiv.appendChild(b);
		attribDiv.innerHTML += mon.senses;
		attribsDiv.appendChild(attribDiv);
	}
	if (mon.languages) {
		const attribDiv = document.createElement('div');
		b = document.createElement('b');
		b.innerHTML = 'Languages ';
		attribDiv.appendChild(b);
		attribDiv.innerHTML += mon.languages;
		attribsDiv.appendChild(attribDiv);
	}
	if (mon.challengeRating) {
		const attribDiv = document.createElement('div');
		attribDiv.style.columnCount = '2';
		const crDiv = document.createElement('div');
		b = document.createElement('b');
		b.innerHTML = 'Challenge ';
		crDiv.appendChild(b);
		crDiv.innerHTML += mon.challengeRating;
		if (mon.xp) crDiv.innerHTML += ` (${mon.xp} XP)`;
		attribDiv.append(crDiv);

		const pbDiv = document.createElement('div');
		b = document.createElement('b');
		b.innerHTML = 'Proficiency Bonus ';
		pbDiv.appendChild(b);
		const pb = Math.ceil(mon.challengeRating / 4) + 1;
		pbDiv.innerHTML += pb >= 0 ? `+${pb}` : pb;
		attribDiv.append(pbDiv);
		attribsDiv.appendChild(attribDiv);
	}
	monsterWindow.appendChild(attribsDiv);
	monsterWindow.appendChild(document.createElement('hr'));
	if (mon.specialAbilities) {
		for (let i = 0; i < mon.specialAbilities.length; i++) {
			const saDiv = document.createElement('div');
			saDiv.appendChild(document.createElement('br'));
			const sa = mon.specialAbilities[i];
			b = document.createElement('b');
			b.innerHTML = `${sa.name}.`;
			saDiv.appendChild(b);
			saDiv.innerHTML += ` ${sa.desc}`;
			saDiv.appendChild(document.createElement('br'));
			monsterWindow.appendChild(saDiv);
		}
	}
	if (mon.actions && mon.actions.length > 0) {
		monsterWindow.appendChild(document.createElement('br'));
		const aTitleDiv = document.createElement('div');
		aTitleDiv.className = 'red-text';
		aTitleDiv.style.fontSize = '1.5em';
		aTitleDiv.innerHTML = `Actions`;
		const thinHr = document.createElement('hr');
		thinHr.style.height = '1px';
		aTitleDiv.appendChild(thinHr);
		monsterWindow.appendChild(aTitleDiv);
		for (let i = 0; i < mon.actions.length; i++) {
			if (i > 0) monsterWindow.appendChild(document.createElement('br'));
			const action = mon.actions[i];
			const aDiv = document.createElement('div');
			b = document.createElement('b');
			b.innerHTML = `${action.name}.`;
			aDiv.appendChild(b);
			aDiv.innerHTML += ` ${action.desc}`;
			aDiv.appendChild(document.createElement('br'));
			monsterWindow.appendChild(aDiv);
		}
	}
	if (mon.legendaryActions && mon.legendaryActions.length > 0) {
		monsterWindow.appendChild(document.createElement('br'));
		const aTitleDiv = document.createElement('div');
		aTitleDiv.className = 'red-text';
		aTitleDiv.style.fontSize = '1.5em';
		aTitleDiv.innerHTML = `Legendary Actions`;
		const thinHr = document.createElement('hr');
		thinHr.style.height = '1px';
		aTitleDiv.appendChild(thinHr);
		monsterWindow.appendChild(aTitleDiv);
		for (let i = 0; i < mon.legendaryActions.length; i++) {
			if (i > 0) monsterWindow.appendChild(document.createElement('br'));
			const action = mon.legendaryActions[i];
			const aDiv = document.createElement('div');
			b = document.createElement('b');
			b.innerHTML = `${action.name}.`;
			aDiv.appendChild(b);
			aDiv.innerHTML += ` ${action.desc}`;
			aDiv.appendChild(document.createElement('br'));
			monsterWindow.appendChild(aDiv);
		}
	}
	if (type === 'add') {
		const userActionDiv = document.createElement('div');
		userActionDiv.className = 'user-action';
		const checkDiv = document.createElement('div');
		checkDiv.className = 'user-action-icon';
		checkDiv.style.color = 'green';
		checkDiv.innerHTML = '&#x2714;';
		checkDiv.onclick = () => {
			NodeCG.waitForReplicants(battleNPCRep)
				.then(() => {
					if (battleNPCRep.value) {
						battleNPCRep.value.push({
							type: 'npc',
							name: '',
							initiative: null,
							...mon,
						});
						monsterModal.style.display = 'none';
					}
				})
				.catch((err) => {
					nodecg.log.error(err);
				});
		};
		userActionDiv.appendChild(checkDiv);
		const xDiv = document.createElement('div');
		xDiv.className = 'user-action-icon';
		xDiv.style.color = 'red';
		xDiv.innerHTML = '&#10006;';
		xDiv.onclick = () => {
			monsterModal.style.display = 'none';
		};
		userActionDiv.appendChild(xDiv);
		monsterWindow.appendChild(userActionDiv);
	}
	monsterModal.style.display = 'flex';
}

fetch('5e-SRD-Monsters.json')
	.then((response) => {
		return response.json();
	})
	.then((data: unknown) => {
		if (Array.isArray(data)) {
			monsterDb = [];
			for (let i = 0; i < data.length; i++) {
				const monster: unknown = data[i];
				if (isSRDMonster(monster)) {
					//push to monsterDb after removing extra forms
					if (monster.forms) monster.name = monster.name.split(',')[0];
					if (monsterDb.map((x) => x.name).indexOf(monster.name) === -1)
						monsterDb.push(monster);
				} else {
					nodecg.log.error('Bad SRD monster:');
					nodecg.log.error(monster);
				}
			}
			populateMonsterSelect();
		} else nodecg.log.error('Bad monster JSON data');
	})
	.catch((err) => {
		nodecg.log.error(err);
	});

function populateMonsterSelect() {
	monsterSelect.innerHTML = '';
	if (monsterDb) {
		for (let i = 0; i < monsterDb.length; i++) {
			const monster = monsterDb[i];
			if (
				monster.challenge_rating <= maxChallenge &&
				monster.challenge_rating >= minChallenge &&
				monster.name.toLowerCase().indexOf(searchStr.toLowerCase()) !== -1
			) {
				const optDiv = document.createElement('div');
				optDiv.className = 'monster-option';
				optDiv.innerHTML = monster.name;
				optDiv.onclick = () => {
					monsterSelectModal.style.display = 'none';
					showMonsterModal(srdMonsterToMonster(monster), 'add');
				};
				monsterSelect.appendChild(optDiv);
			}
		}
	}
}

function srdMonsterToMonster(srdMon: SRDMonster): Monster {
	const rtn: Monster = {
		monsterName: srdMon.name,
		size: srdMon.size,
		monsterType: capitalize(srdMon.type),
		alignment: capitalize(srdMon.alignment),
		armorClass: srdArmorClassTranslate(srdMon.armor_class),
		maxHitPoints: srdMon.hit_points,
		currentHitPoints: srdMon.hit_points,
		hitRoll: srdMon.hit_points_roll,
		speed: srdSpeedTranslate(srdMon.speed),
		stats: {
			str: srdMon.strength,
			dex: srdMon.dexterity,
			con: srdMon.constitution,
			int: srdMon.intelligence,
			wis: srdMon.wisdom,
			cha: srdMon.charisma,
		},
		senses: srdSensesTranslate(srdMon.senses),
		languages: srdMon.languages ? capitalize(srdMon.languages) : '--',
		challengeRating: srdMon.challenge_rating,
		xp: srdMon.xp,
	};
	if (srdMon.subtype) rtn.monsterType += ` (${capitalize(srdMon.subtype)})`;
	const prof = processSRDProficiencies(srdMon.proficiencies);
	if (prof.savingThrows) rtn.savingThrows = prof.savingThrows;
	if (prof.skills) rtn.skills = prof.skills;
	if (srdMon.damage_vulnerabilities.length > 0)
		rtn.damageVulnerabilities = srdMon.damage_vulnerabilities;
	if (srdMon.damage_resistances.length > 0)
		rtn.damageResistances = srdMon.damage_resistances;
	if (srdMon.damage_immunities.length > 0)
		rtn.damageImmunities = srdMon.damage_immunities;
	if (srdMon.condition_immunities.length > 0)
		rtn.conditionImmunities = srdMon.condition_immunities.map((x) => x.name);
	if (srdMon.special_abilities)
		rtn.specialAbilities = processSRDSpecialAbilities(srdMon.special_abilities);
	if (srdMon.actions && srdMon.actions.length > 0)
		rtn.actions = processSRDSpecialAbilities(srdMon.actions);
	if (srdMon.legendary_actions && srdMon.legendary_actions.length > 0)
		rtn.legendaryActions = processSRDSpecialAbilities(srdMon.legendary_actions);
	if (srdMon.reactions && srdMon.reactions.length > 0)
		rtn.reactions = srdMon.reactions.map((x) => {
			return { name: x.name, desc: x.desc.replace(/(?:\r\n|\r|\n)/g, '<br>') };
		});
	return rtn;
}

function processSRDSpecialAbilities(
	arr: (NameDesc & { usage?: SRDSpecialAbilityUsage })[]
): NameDesc[] {
	function isSRDSpecialAbilityWUsage(
		abil: any
	): abil is NameDesc & { usage: SRDSpecialAbilityUsage } {
		return !!abil.usage;
	}
	const rtn: NameDesc[] = [];
	for (let i = 0; i < arr.length; i++) {
		const abil = arr[i];
		if (isSRDSpecialAbilityWUsage(abil)) {
			let usage = '';
			switch (abil.usage.type) {
				case 'recharge on roll':
					usage = 'Recharge ' + abil.usage.min_value + '-6';
					break;
				case 'recharge after rest':
					usage = 'Recharges after a Short or Long Rest';
					break;
				case 'per day':
					usage = abil.usage.times + '/Day';
					break;
			}
			rtn.push({
				name: `${abil.name} (${usage})`,
				desc: abil.desc.replace(/(?:\r\n|\r|\n)/g, '<br>'),
			});
		} else
			rtn.push({
				name: abil.name,
				desc: abil.desc.replace(/(?:\r\n|\r|\n)/g, '<br>'),
			});
	}
	return rtn;
}

function processSRDProficiencies(arr: SRDMonster['proficiencies']): {
	savingThrows?: Monster['savingThrows'];
	skills?: Monster['skills'];
} {
	const rtn: {
		savingThrows?: { stat: Stat; value: number }[];
		skills?: Monster['skills'];
	} = {};
	for (let i = 0; i < arr.length; i++) {
		const prof = arr[i];
		const splitName = prof.proficiency.name.split(': ');
		if (splitName.length !== 2) {
			nodecg.log.error('Bad SRD proficiency name format');
		} else {
			switch (splitName[0]) {
				case 'Saving Throw':
					{
						const stat = splitName[1].toLowerCase();
						if (isStat(stat)) {
							if (!rtn.savingThrows) {
								rtn.savingThrows = [{ stat: stat, value: prof.value }];
							} else rtn.savingThrows.push({ stat: stat, value: prof.value });
						} else nodecg.log.error('Unknown stat type: ' + stat);
					}
					break;
				case 'Skill':
					if (!rtn.skills) {
						rtn.skills = [{ name: splitName[1], value: prof.value }];
					} else rtn.skills.push({ name: splitName[1], value: prof.value });
					break;
				default:
					nodecg.log.error('Unknown proficiency type: ' + splitName[0]);
					break;
			}
		}
	}
	return rtn;
}

function isStat(stat: any): stat is Stat {
	return (
		stat === 'str' ||
		stat === 'dex' ||
		stat === 'con' ||
		stat === 'int' ||
		stat === 'wis' ||
		stat === 'cha'
	);
}

function srdSensesTranslate(sns: SRDMonster['senses']): string {
	let rtn = '';
	if (sns.blindsight) rtn += 'Blindsight ' + sns.blindsight;
	if (sns.darkvision)
		rtn += rtn
			? ', Darkvision ' + sns.darkvision
			: 'Darkvision ' + sns.darkvision;
	if (sns.tremorsense)
		rtn += rtn
			? ', Tremorsense ' + sns.tremorsense
			: 'Tremorsense ' + sns.tremorsense;
	if (sns.truesight)
		rtn += rtn ? ', Truesight ' + sns.truesight : 'Truesight ' + sns.truesight;
	rtn += rtn
		? ', Passive Perception ' + sns.passive_perception
		: 'Passive Perception ' + sns.passive_perception;
	return rtn;
}

function srdSpeedTranslate(spd: SRDMonster['speed']): string {
	let rtn = '';
	if (spd.walk) rtn = spd.walk;
	if (spd.burrow)
		rtn += rtn ? ', burrow ' + spd.burrow : 'burrow ' + spd.burrow;
	if (spd.fly) rtn += rtn ? ', fly ' + spd.fly : 'fly ' + spd.fly;
	if (spd.swim) rtn += rtn ? ', swim ' + spd.swim : 'swim ' + spd.swim;
	if (spd.hover) rtn += ' (hover)';
	return rtn;
}

function srdArmorClassTranslate(
	srdAc: SRDMonster['armor_class']
): Monster['armorClass'] {
	const first = srdAc[0];
	const rtn: Monster['armorClass'] = { value: first.value };
	let label = '';
	if (first.type === 'natural') label = 'natural armor';
	if (first.armor) label = first.armor.map((x) => x.name).join(', ');
	if (srdAc.length > 1) {
		for (let i = 1; i < srdAc.length; i++) {
			const nextAc = srdAc[i];
			let nextLabel = '';
			if (nextAc.armor) nextLabel = nextAc.armor.map((x) => x.name).join(', ');
			if (nextAc.spell) nextLabel = `${nextAc.value} with ${nextAc.spell.name}`;
			if (nextAc.condition)
				nextLabel = `${nextAc.value} while ${nextAc.condition.name}`;
			if (!label) {
				label = nextLabel;
			} else label += ', ' + nextLabel;
		}
	}
	if (label) rtn.label = label.toLowerCase();
	return rtn;
}

function isSRDMonster(monster: any): monster is SRDMonster {
	return (
		monster &&
		typeof monster.index === 'string' &&
		typeof monster.name === 'string' &&
		typeof monster.challenge_rating === 'number' &&
		(monster.size === 'Tiny' ||
			monster.size === 'Small' ||
			monster.size === 'Medium' ||
			monster.size === 'Large' ||
			monster.size === 'Huge' ||
			monster.size === 'Gargantuan') &&
		typeof monster.alignment === 'string' &&
		isSRDArmorClassArray(monster.armor_class) &&
		typeof monster.hit_points === 'number' &&
		isSRDSpeed(monster.speed) &&
		typeof monster.strength === 'number' &&
		typeof monster.dexterity === 'number' &&
		typeof monster.constitution === 'number' &&
		typeof monster.intelligence === 'number' &&
		typeof monster.wisdom === 'number' &&
		typeof monster.charisma === 'number' &&
		isSRDSenses(monster.senses) &&
		typeof monster.type === 'string' &&
		(monster.subtype === undefined || typeof monster.subtype === 'string') &&
		typeof monster.hit_points_roll === 'string' &&
		isSRDProficienciesArray(monster.proficiencies) &&
		isStringArray(monster.damage_immunities) &&
		isStringArray(monster.damage_resistances) &&
		isStringArray(monster.damage_vulnerabilities) &&
		isSRDRefArray(monster.condition_immunities) &&
		typeof monster.languages === 'string' &&
		typeof monster.challenge_rating === 'number' &&
		typeof monster.xp === 'number' &&
		(isSRDSpecialAbilitiesArray(monster.special_abilities) ||
			!monster.special_abilities) &&
		(!monster.actions || isSRDSpecialAbilitiesArray(monster.actions)) &&
		(!monster.legendary_actions ||
			isSRDSpecialAbilitiesArray(monster.legendary_actions)) &&
		(isNameDescArray(monster.reactions) || !monster.reactions)
	);
}

function isNameDescArray(arr: any): arr is NameDesc[] {
	if (!Array.isArray(arr)) return false;
	let rtn = true;
	for (let i = 0; i < arr.length; i++) {
		if (
			typeof arr[i] !== 'object' ||
			typeof arr[i].name !== 'string' ||
			typeof arr[i].desc !== 'string'
		)
			rtn = false;
	}
	return rtn;
}

function isSRDSpecialAbilitiesArray(
	arr: any
): arr is NameDesc & { usage?: SRDSpecialAbilityUsage }[] {
	if (!Array.isArray(arr)) return false;
	let rtn = true;
	for (let i = 0; i < arr.length; i++) {
		const ability = arr[i];
		if (
			typeof ability.name === 'string' &&
			typeof ability.desc === 'string' &&
			(ability.usage === undefined || typeof ability.usage === 'object')
		) {
			if (ability.usage) {
				switch (ability.usage.type) {
					case 'recharge on roll':
						if (typeof ability.usage.min_value !== 'number') rtn = false;
						break;
					case 'recharge after rest':
						if (
							!Array.isArray(ability.usage.rest_types) ||
							ability.usage.rest_types[0] !== 'short' ||
							ability.usage.rest_types[1] !== 'long'
						)
							rtn = false;
						break;
					case 'per day':
						if (typeof ability.usage.times !== 'number') rtn = false;
						break;
					case undefined:
						break;
					default:
						nodecg.log.warn('unknown ability usage: ' + ability.type);
						rtn = false;
						break;
				}
			}
		} else rtn = false;
	}
	return rtn;
}

function isStringArray(arr: any): arr is string[] {
	if (!Array.isArray(arr)) return false;
	let rtn = true;
	for (let i = 0; i < arr.length; i++) {
		if (typeof arr[i] !== 'string') rtn = false;
	}
	return rtn;
}

function isSRDProficienciesArray(
	arr: any
): arr is { value: number; proficiency: SRDRef } {
	if (!Array.isArray(arr)) return false;
	let rtn = true;
	for (let i = 0; i < arr.length; i++) {
		const prof = arr[i];
		if (
			typeof prof !== 'object' ||
			typeof prof.value !== 'number' ||
			!isSRDRef(prof.proficiency)
		)
			rtn = false;
	}
	return rtn;
}

function isSRDSenses(sns: any): sns is SRDMonster['senses'] {
	return (
		typeof sns === 'object' &&
		typeof sns.passive_perception === 'number' &&
		(sns.blindsight === undefined || typeof sns.blindsight === 'string') &&
		(sns.darkvision === undefined || typeof sns.darkvision === 'string') &&
		(sns.tremorsense === undefined || typeof sns.tremorsense === 'string') &&
		(sns.truesight === undefined || typeof sns.truesight === 'string')
	);
}

function isSRDSpeed(spd: any): spd is SRDMonster['speed'] {
	return (
		typeof spd === 'object' &&
		(spd.burrow === undefined || typeof spd.burrow === 'string') &&
		(spd.climb === undefined || typeof spd.climb === 'string') &&
		(spd.fly === undefined || typeof spd.fly === 'string') &&
		(spd.hover === undefined || spd.hover === true) &&
		(spd.swim === undefined || typeof spd.swim === 'string') &&
		(spd.walk === undefined || typeof spd.walk === 'string')
	);
}

function isSRDArmorClassArray(arr: any): arr is SRDArmorClass[] {
	if (!Array.isArray(arr)) return false;
	if (arr.length === 0) return false;
	let rtn = true;
	for (let i = 0; i < arr.length; i++) {
		const armorClass = arr[i];
		if (typeof armorClass === 'object') {
			if (
				typeof armorClass.value !== 'number' ||
				typeof armorClass.type !== 'string'
			)
				rtn = false;
			if (armorClass.armor && !isSRDRefArray(armorClass.armor)) rtn = false;
			if (armorClass.spell && !isSRDRef(armorClass.spell)) rtn = false;
			if (armorClass.condition && !isSRDRef(armorClass.condition)) rtn = false;
		} else rtn = false;
	}
	return rtn;
}

function isSRDRefArray(arr: any): arr is SRDRef[] {
	if (!Array.isArray(arr)) return false;
	let rtn = true;
	for (let i = 0; i < arr.length; i++) {
		if (!isSRDRef(arr[i])) rtn = false;
	}
	return rtn;
}

function isSRDRef(ref: any): ref is SRDRef {
	return typeof ref === 'object' && typeof ref.name === 'string';
}

function capitalize(str: string): string {
	const words = str.split(' ');
	for (let i = 0; i < words.length; i++) {
		words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
	}
	return words.join(' ');
}

function statToModifier(stat: number): string {
	const mod = Math.floor((stat - 10) / 2);
	if (mod >= 0) {
		return `+${mod}`;
	} else return mod.toString();
}
