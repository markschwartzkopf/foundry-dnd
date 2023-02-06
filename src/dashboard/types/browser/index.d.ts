type SRDMonster = {
	index: string;
	name: string;
	type: string;
	subtype: string;
	challenge_rating: number;
	size: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';
	alignment: string;
	armor_class: SRDArmorClass[];
	hit_points: number;
	speed: {
		burrow?: string;
		climb?: string;
		fly?: string;
		hover?: true;
		swim?: string;
		walk?: string;
	};
	strength: number;
	dexterity: number;
	constitution: number;
	intelligence: number;
	wisdom: number;
	charisma: number;
	senses: {
		blindsight?: string;
		darkvision?: string;
		passive_perception: number;
		tremorsense?: string;
		truesight?: string;
	};
	hit_points_roll: string;
	forms: unknown;
	proficiencies: { value: number; proficiency: SRDRef }[];
	damage_immunities: string[];
	damage_resistances: string[];
	damage_vulnerabilities: string[];
	condition_immunities: SRDRef[];
	languages: string;
	challenge_rating: number;
	xp: number;
	special_abilities?: (NameDesc & { usage?: SRDSpecialAbilityUsage })[];
  actions?: (NameDesc & { usage?: SRDSpecialAbilityUsage })[];
  legendary_actions?: (NameDesc & { usage?: SRDSpecialAbilityUsage })[];
  reactions?: NameDesc[];
};

type SRDSpecialAbilityUsage =
	| {
			type: 'recharge on roll';
			min_value: number;
	  }
	| {
			type: 'recharge after rest';
			rest_types: ['short', 'long'];
	  }
	| {
			type: 'per day';
			times: number;
	  };

type SRDArmorClass = {
	value: number;
	type: string;
	armor?: SRDRef[];
	spell?: SRDRef;
	condition?: SRDRef;
};

type SRDRef = { name: string };
