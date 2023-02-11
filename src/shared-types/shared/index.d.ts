type Character = {
  id: number;
  name: string;
  avatarUrl: string | null;
  level: number;
  maxHitPoints: number;
  currentHitPoints: number;
  tempHitPoints: number;
  stats: Stats;
};

type Stats = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
};

type Stat = keyof Stats;

type Player = {
  type: 'pc';
  realName: string;
  character: Character | null;
  initiative: number | null;
};

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

type BattlePlayers = BattlePlayer[];

type BattlePlayer = BattleNPC | Player;

type BattleNPC =
  | ({
      type: 'monster';
      name?: string;
      initiative: number | null;
    } & Monster)
  | {
      type: 'npc';
      initiative: number | null;
      character: Character;
    };

type Monster = {
  monsterName: string;
  size?: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';
  monsterType?: string;
  alignment?: string;
  armorClass: { value: number; label?: string }; //armor_class
  maxHitPoints: number; //hit_points
  currentHitPoints: number;
  hitRoll?: string; //hit_points_roll
  speed: string;
  stats: Stats;
  savingThrows?: { stat: Stat; value: number }[];
  skills?: { name: string; value: number }[];
  damageVulnerabilities?: string[];
  damageResistances?: string[];
  damageImmunities?: string[];
  conditionImmunities?: string[];
  senses: string;
  languages?: string;
  challengeRating?: number; //proficiency bonus = Math.ceil(cr/4) + 1
  xp?: number;
  specialAbilities?: NameDesc[];
  actions?: NameDesc[];
  reactions?: NameDesc[];
  legendaryActions?: NameDesc[];
};

type SpecialAbility = {
  name: string;
  desc: string;
  usage?: string; //parse SpecialAbilityUsage data to create string
};

type DifficultyClass = {
  dc_type: Stat;
  dc_value?: number;
};

type NameDesc = {
  name: string;
  desc: string;
};
