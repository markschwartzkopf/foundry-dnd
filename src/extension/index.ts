import { NodeCG } from '../../../../types/server';
import * as nodecgApiContext from './nodecg-api-context';

module.exports = function (nodecg: NodeCG) {
	nodecgApiContext.set(nodecg);
	const playerRep = nodecg.Replicant<Players>('players', {
		defaultValue: [null, null, null, null, null, null],
	});
	const battlePlayerRep = nodecg.Replicant<BattlePlayers>('battle-players', {
		defaultValue: [],
	});
	if (battlePlayerRep.value) {
		const sortArr: typeof battlePlayerRep.value = JSON.parse(
			JSON.stringify(battlePlayerRep.value)
		);
		sortArr.sort((a, b) => {
			const aInit = a.initiative !== null ? a.initiative : -1000;
			const bInit = b.initiative !== null ? b.initiative : -1000;
			return aInit < bInit ? 1 : -1;
		});
		battlePlayerRep.value = sortArr;
	}
	const battleNPCRep = nodecg.Replicant<BattleNPC[]>('battle-npcs', {
		defaultValue: [],
	});
	const showHealthRep = nodecg.Replicant<boolean>('showHeath', {
		defaultValue: false,
	});
  const showCombatRep = nodecg.Replicant<boolean>('show-combat', {
		defaultValue: false,
	});
	const shownImageRep = nodecg.Replicant<string | null>('show-image', {
		defaultValue: null,
	});
	require('./dndbeyond');
};
