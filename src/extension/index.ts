import { NodeCG } from '../../../../types/server';
import * as nodecgApiContext from './nodecg-api-context';

module.exports = function (nodecg: NodeCG) {
	nodecgApiContext.set(nodecg);
	const playerRep = nodecg.Replicant<Players>('players', {
		defaultValue: [null, null, null, null, null, null],
	});
	const showHealthRep = nodecg.Replicant<boolean>('showHeath', {
		defaultValue: false,
	});
	const shownImageRep = nodecg.Replicant<string | null>('show-image', {
		defaultValue: null,
	});
	require('./dndbeyond');
};
