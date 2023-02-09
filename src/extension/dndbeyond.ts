import { NodeCG } from '../../../../types/server';
const nodecg: NodeCG = require('./nodecg-api-context').get();

import https from 'https';

const playerRep = nodecg.Replicant<Players>('players');

type DndCharacterData = {
	id: number;
	name: string;
	decorations: {
		avatarUrl: string | null;
	};
	baseHitPoints: number; //add con*level +
	bonusHitPoints: null | number;
	overrideHitPoints: null | number; //if non-null, ignore everything else
	removedHitPoints: number;
	temporaryHitPoints: number; //Not actual hit points: buffer hit points
	//conditions: ?[],
	/* deathSaves: {
		failCount: null | number;
		successCount: null | number;
		isStabilized: boolean;
	}; */
	stats: [
		{ id: 1; value: number }, //str
		{ id: 2; value: number }, //dex
		{ id: 3; value: number }, //con
		{ id: 4; value: number }, //int
		{ id: 5; value: number }, //wis
		{ id: 6; value: number } //cha
	];
	classes: { level: number }[];
	modifiers: {
		race: DndModifier[];
		class: DndModifier[];
		background: DndModifier[];
		item: DndModifier[];
		feat: DndModifier[];
		condition: DndModifier[];
	};
};

type DndModifier = {
	entityId: number | string | null; //'1475962' is hit points per level. Numbers 1,2,3,4,5,6 are stats
	value: null | number;
	type: string; //'bonus' is all we care about
	subType: string; //look at if entityId isn't 1-6
};

type DndResponse = {
	id: number;
	message: string;
	success: boolean;
	data: {
		[k: string]: any;
	};
};

function getCharacter(num: string): Promise<DndCharacterData> {
	return new Promise((res, rej) => {
		const url =
			'https://character-service.dndbeyond.com/character/v5/character/' + num;
		const request = https.request(url, (response) => {
			let data = '';
			response.on('data', (chunk) => {
				data = data + chunk.toString();
			});

			response.on('end', () => {
				let dndResp: unknown | null = null;
				try {
					dndResp = JSON.parse(data);
				} catch (err) {
					rej(err);
				}
				if (dndResp) {
					if (isDndResponse(dndResp)) {
						if (dndResp.success) {
							if (isDndCharacterData(dndResp.data)) {
								res(dndResp.data);
							} else rej('invalid character JSON data from DnDBeyond');
						} else rej(dndResp.data);
					} else rej('Unexpected JSON from DnDBeyond');
				} else rej('Bad JSON from DnDBeyond');
			});
		});

		request.on('error', (err) => {
			rej(err);
		});

		request.end();
	});
}

function dataToCharacter(data: DndCharacterData): Character {
	const rtn: Character = {
		id: data.id,
		name: data.name,
		avatarUrl: data.decorations.avatarUrl,
		level: data.classes
			.map((x) => {
				return x.level;
			})
			.reduce((x, y) => {
				return x + y;
			}),
		maxHitPoints: data.baseHitPoints,
		currentHitPoints: 0,
		tempHitPoints: data.temporaryHitPoints,
		stats: {
			str: data.stats[0].value,
			dex: data.stats[1].value,
			con: data.stats[2].value,
			int: data.stats[3].value,
			wis: data.stats[4].value,
			cha: data.stats[5].value,
		},
	};
	const allModifiers = [
		...data.modifiers.race,
		...data.modifiers.class,
		...data.modifiers.background,
		...data.modifiers.item,
		...data.modifiers.feat,
		...data.modifiers.condition,
	];

	for (let i = 0; i < allModifiers.length; i++) {
		const mod = allModifiers[i];
		if (mod.type === 'bonus') {
			switch (mod.entityId) {
				case 1:
					if (mod.value) rtn.stats.str += mod.value;
					break;
				case 2:
					if (mod.value) rtn.stats.dex += mod.value;
					break;
				case 3:
					if (mod.value) rtn.stats.con += mod.value;
					break;
				case 4:
					if (mod.value) rtn.stats.int += mod.value;
					break;
				case 5:
					if (mod.value) rtn.stats.wis += mod.value;
					break;
				case 6:
					if (mod.value) rtn.stats.cha += mod.value;
					break;
				default:
					if (mod.subType === 'hit-points-per-level' && mod.value) {
						//rtn.maxHitPoints += mod.value * rtn.level;
						nodecg.log.error('Mark: code item attunement checking');
					}
					break;
			}
		}
	}
	const conModifier = Math.floor((rtn.stats.con - 10) / 2);
	rtn.maxHitPoints += conModifier * rtn.level;
	if (data.bonusHitPoints !== null) rtn.maxHitPoints += data.bonusHitPoints;
	if (data.overrideHitPoints !== null)
		rtn.maxHitPoints = data.overrideHitPoints;
	rtn.currentHitPoints = rtn.maxHitPoints - data.removedHitPoints;

	return rtn;
}

nodecg.listenFor('pullPC', (args: { index: number; id: number }) => {
	getCharacter(args.id.toString())
		.then((data) => {
			console.log(dataToCharacter(data));
			if (playerRep.value[args.index]) {
				playerRep.value[args.index]!.character = dataToCharacter(data);
			} else
				playerRep.value[args.index] = {
					realName: '',
					character: dataToCharacter(data),
					type: 'pc',
					initiative: null,
				};
		})
		.catch(console.error);
});

nodecg.listenFor('getNPCdata', (id: number, ack) => {
	console.log('getNPC');
});

let playerUpdateIndex = 0;
setInterval(() => {
	const i = playerUpdateIndex;
	if (playerRep.value[i] && playerRep.value[i]!.character) {
		getCharacter(playerRep.value[i]!.character!.id.toString())
			.then((data) => {
				if (playerRep.value[i]) {
					const newCharacter = dataToCharacter(data);
					if (
						JSON.stringify(newCharacter) !==
						JSON.stringify(playerRep.value[i]!.character)
					)
						playerRep.value[i]!.character = dataToCharacter(data);
				} else
					playerRep.value[i] = {
						realName: '',
						character: dataToCharacter(data),
						type: 'pc',
						initiative: null,
					};
			})
			.catch((err) => {
				nodecg.log.error(err);
			});
	}
	playerUpdateIndex++;
	if (playerUpdateIndex >= playerRep.value.length) playerUpdateIndex = 0;
}, 2000);

function isDndResponse(resp: any): resp is DndResponse {
	return (
		typeof resp === 'object' &&
		typeof resp.id === 'number' &&
		typeof resp.message === 'string' &&
		typeof resp.success === 'boolean' &&
		typeof resp.data === 'object' &&
		!Array.isArray(resp.data) &&
		resp.data !== null
	);
}

function isDndCharacterData(data: any): data is DndCharacterData {
	if (
		typeof data === 'object' &&
		typeof data.id === 'number' &&
		typeof data.name === 'string' &&
		typeof data.decorations === 'object' &&
		(typeof data.decorations.avatarUrl === 'string' ||
			data.decorations.avatarUrl === null) &&
		typeof data.baseHitPoints === 'number' &&
		(typeof data.bonusHitPoints === 'number' || data.bonusHitPoints === null) &&
		(typeof data.overrideHitPoints === 'number' ||
			data.overrideHitPoints === null) &&
		typeof data.removedHitPoints === 'number' &&
		typeof data.temporaryHitPoints === 'number' &&
		isDndStats(data.stats) &&
		isDndClasses(data.classes) &&
		typeof data.modifiers === 'object' &&
		isDndModifierArray(data.modifiers.race) &&
		isDndModifierArray(data.modifiers.class) &&
		isDndModifierArray(data.modifiers.background) &&
		isDndModifierArray(data.modifiers.item) &&
		isDndModifierArray(data.modifiers.feat) &&
		isDndModifierArray(data.modifiers.condition)
	) {
		//conditions: ?[],
		/* deathSaves: {
		failCount: null | number;
		successCount: null | number;
		isStabilized: boolean;
	  }; */
		//check more
		return true;
	} else {
		if (typeof data === 'object') {
			if (typeof data.name !== 'string')
				nodecg.log.warn('dndResponse.data.name is not string');
			if (typeof data.id !== 'number')
				nodecg.log.warn('dndResponse.data.id is not number');
			if (typeof data.decorations !== 'object') {
				nodecg.log.warn('dndResponse.data.decorations is not object');
			} else {
				if (
					typeof data.decorations.avatarUrl !== 'string' &&
					data.decorations.avatarUrl !== null
				)
					nodecg.log.warn(
						'dndResponse.data.decorations.avatarUrl is not string or null'
					);
			}
			if (typeof data.baseHitPoints !== 'number')
				nodecg.log.warn(
					`dndResponse.data.baseHitPoints is ${data.baseHitPoints}, not number`
				);
			if (
				typeof data.bonusHitPoints !== 'number' &&
				data.bonusHitPoints !== null
			)
				nodecg.log.warn(
					`dndResponse.data.bonusHitPoints is ${data.bonusHitPoints} not number or null`
				);
			if (
				typeof data.overrideHitPoints !== 'number' &&
				data.overrideHitPoints !== null
			)
				nodecg.log.warn(
					'dndResponse.data.overrideHitPoints is not number or null'
				);
			if (typeof data.removedHitPoints !== 'number')
				nodecg.log.warn('dndResponse.data.removedHitPoints is not number');
			if (typeof data.temporaryHitPoints !== 'number')
				nodecg.log.warn('dndResponse.data.temporaryHitPoints is not number');
			if (!isDndStats(data.stats))
				nodecg.log.warn('dndResponse.data.stats is not DndStats');
			if (!isDndClasses(data.classes))
				nodecg.log.warn('dndResponse.data.classes is not DndClasses');
			if (typeof data.modifiers !== 'object') {
				nodecg.log.warn('dndResponse.data.modifiers is not object');
			} else {
				if (!isDndModifierArray(data.modifiers.race))
					nodecg.log.warn(
						'dndResponse.data.modifiers.race is not DndModifier array'
					);
				if (!isDndModifierArray(data.modifiers.class))
					nodecg.log.warn(
						'dndResponse.data.modifiers.class is not DndModifier array'
					);
				if (!isDndModifierArray(data.modifiers.background))
					nodecg.log.warn(
						'dndResponse.data.modifiers.background is not DndModifier array'
					);
				if (!isDndModifierArray(data.modifiers.item))
					nodecg.log.warn(
						'dndResponse.data.modifiers.item is not DndModifier array'
					);
				if (!isDndModifierArray(data.modifiers.feat))
					nodecg.log.warn(
						'dndResponse.data.modifiers.feat is not DndModifier array'
					);
				if (!isDndModifierArray(data.modifiers.condition))
					nodecg.log.warn(
						'dndResponse.data.modifiers.condition is not DndModifier array'
					);
			}
		} else nodecg.log.warn('dndResponse.data is not object');

		return false;
	}
}

function isDndStats(stats: any): stats is DndCharacterData['stats'] {
	//helper function:
	function isDndStat(stat: any): stat is DndCharacterData['stats'][number] {
		return (
			typeof stat === 'object' &&
			typeof stat.id === 'number' &&
			typeof stat.value === 'number'
		);
	}
	if (Array.isArray(stats) && stats.length === 6) {
		let rtn = true;
		for (let i = 0; i < stats.length; i++) {
			if (isDndStat(stats[i])) {
				if (stats[i].id !== i + 1) rtn = false;
			} else rtn = false;
		}
		return rtn;
	} else return false;
}

function isDndClasses(
	classes: DndCharacterData['classes']
): classes is DndCharacterData['classes'] {
	if (!Array.isArray(classes)) {
		nodecg.log.warn('dndClasses is not array');
		return false;
	}
	let rtn = true;
	for (let i = 0; i < classes.length; i++) {
		const clas = classes[i];
		if (typeof clas !== 'object' || typeof clas.level !== 'number') rtn = false;
	}
	return rtn;
}

function isDndModifierArray(arr: any): arr is DndModifier[] {
	//helper function:
	function isDndModifier(mod: any): mod is DndModifier {
		if (
			typeof mod === 'object' &&
			(typeof mod.entityId === 'number' || mod.entityId === null) &&
			(typeof mod.value === 'number' || mod.value === null) &&
			typeof mod.type === 'string' &&
			typeof mod.subType === 'string'
		) {
			return true;
		} else {
			if (typeof mod !== 'object') {
				nodecg.log.warn(`dndModifier is not object`);
			} else {
				if (typeof mod.entityId !== 'number' && mod.entityId !== null)
					nodecg.log.warn(
						`dndModifier.entityId is ${mod.entityId}, not number or string or null`
					);
				if (typeof mod.value !== 'number' && mod.value !== null)
					nodecg.log.warn(`dndModifier.value is not number or null`);
				if (typeof mod.type !== 'string')
					nodecg.log.warn(`dndModifier.type is not string`);
				if (typeof mod.subType !== 'string')
					nodecg.log.warn(`dndModifier.subType is not string`);
			}
			return false;
		}
	}
	let rtn = true;
	if (Array.isArray(arr)) {
		for (let i = 0; i < arr.length; i++) {
			if (!isDndModifier(arr[i])) {
				nodecg.log.warn(`dndModifier[${i}] is not dndModifier`);
				rtn = false;
			}
		}
	} else {
		nodecg.log.warn('dndModifier[] is not array');
		rtn = false;
	}
	return rtn;
}
