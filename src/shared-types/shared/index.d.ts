type Character = {
	id: number;
	name: string;
	avatarUrl: string | null;
	level: number;
	maxHitPoints: number;
	currentHitPoints: number;
	tempHitPoints: number;
	stats: {
		str: number;
		dex: number;
		con: number;
		int: number;
		wis: number;
		cha: number;
	};
};

type Player = {realName: string, character: Character | null}

type Players = [
	Player | null,
	Player | null,
	Player | null,
	Player | null,
	Player | null,
	Player | null
];

type Asset = {
	base: string;
	namespace: string;
	category: string;
	ext: string;
	name: string;
	sum: string;
	url: string;
};