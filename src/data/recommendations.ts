import type { BestModsRecommendation } from '../types/swgoh'

// ─── Role Templates ───────────────────────────────────────────────────────────
// slot primaries: 2=Arrow 3=Diamond 4=Triangle 5=Circle 6=Cross

type Role =
  | 'speed_attacker'     // Attaquant vitesse + dégâts
  | 'crit_attacker'      // Attaquant crit damage
  | 'speed_support'      // Support vitesse pure
  | 'potency_support'    // Support potency (debuffs)
  | 'tenacity_support'   // Support tenacity (buffs)
  | 'tank'               // Tank défensif
  | 'healer'             // Soigneur
  | 'gl_attacker'        // Galactic Legend offensif
  | 'gl_support'         // Galactic Legend support

const ROLE_TEMPLATES: Record<Role, Omit<BestModsRecommendation, 'base_id'>> = {
  speed_attacker: {
    sets: [{ set: 4, usage_pct: 60 }, { set: 6, usage_pct: 55 }, { set: 2, usage_pct: 40 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',          usage_pct: 92 }],
      3: [{ stat_id: 42, name: 'Defense %',       usage_pct: 65 }, { stat_id: 55, name: 'Health %', usage_pct: 30 }],
      4: [{ stat_id: 17, name: 'Crit Damage %',   usage_pct: 55 }, { stat_id: 41, name: 'Offense %', usage_pct: 40 }],
      5: [{ stat_id: 56, name: 'Protection %',    usage_pct: 55 }, { stat_id: 55, name: 'Health %',  usage_pct: 40 }],
      6: [{ stat_id: 41, name: 'Offense %',       usage_pct: 65 }, { stat_id: 56, name: 'Protection %', usage_pct: 25 }],
    },
    speed_priority: 260,
  },
  crit_attacker: {
    sets: [{ set: 6, usage_pct: 75 }, { set: 5, usage_pct: 60 }, { set: 2, usage_pct: 35 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',          usage_pct: 88 }],
      3: [{ stat_id: 42, name: 'Defense %',       usage_pct: 60 }, { stat_id: 55, name: 'Health %', usage_pct: 35 }],
      4: [{ stat_id: 17, name: 'Crit Damage %',   usage_pct: 75 }, { stat_id: 41, name: 'Offense %', usage_pct: 20 }],
      5: [{ stat_id: 56, name: 'Protection %',    usage_pct: 55 }, { stat_id: 55, name: 'Health %',  usage_pct: 40 }],
      6: [{ stat_id: 41, name: 'Offense %',       usage_pct: 70 }, { stat_id: 56, name: 'Protection %', usage_pct: 20 }],
    },
    speed_priority: 250,
  },
  speed_support: {
    sets: [{ set: 4, usage_pct: 85 }, { set: 1, usage_pct: 45 }, { set: 8, usage_pct: 35 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',          usage_pct: 95 }],
      3: [{ stat_id: 42, name: 'Defense %',       usage_pct: 60 }, { stat_id: 55, name: 'Health %', usage_pct: 35 }],
      4: [{ stat_id: 55, name: 'Health %',        usage_pct: 50 }, { stat_id: 56, name: 'Protection %', usage_pct: 45 }],
      5: [{ stat_id: 55, name: 'Health %',        usage_pct: 55 }, { stat_id: 56, name: 'Protection %', usage_pct: 40 }],
      6: [{ stat_id: 55, name: 'Health %',        usage_pct: 40 }, { stat_id: 56, name: 'Protection %', usage_pct: 35 }, { stat_id: 41, name: 'Offense %', usage_pct: 20 }],
    },
    speed_priority: 300,
  },
  potency_support: {
    sets: [{ set: 4, usage_pct: 70 }, { set: 7, usage_pct: 65 }, { set: 1, usage_pct: 30 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',          usage_pct: 92 }],
      3: [{ stat_id: 42, name: 'Defense %',       usage_pct: 60 }],
      4: [{ stat_id: 55, name: 'Health %',        usage_pct: 50 }, { stat_id: 56, name: 'Protection %', usage_pct: 45 }],
      5: [{ stat_id: 55, name: 'Health %',        usage_pct: 55 }, { stat_id: 56, name: 'Protection %', usage_pct: 40 }],
      6: [{ stat_id: 18, name: 'Potency %',       usage_pct: 65 }, { stat_id: 41, name: 'Offense %', usage_pct: 25 }],
    },
    speed_priority: 280,
  },
  tenacity_support: {
    sets: [{ set: 4, usage_pct: 70 }, { set: 8, usage_pct: 65 }, { set: 1, usage_pct: 30 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',          usage_pct: 92 }],
      3: [{ stat_id: 42, name: 'Defense %',       usage_pct: 60 }],
      4: [{ stat_id: 55, name: 'Health %',        usage_pct: 55 }, { stat_id: 56, name: 'Protection %', usage_pct: 40 }],
      5: [{ stat_id: 55, name: 'Health %',        usage_pct: 55 }, { stat_id: 56, name: 'Protection %', usage_pct: 40 }],
      6: [{ stat_id: 19, name: 'Tenacity %',      usage_pct: 65 }, { stat_id: 55, name: 'Health %', usage_pct: 25 }],
    },
    speed_priority: 275,
  },
  tank: {
    sets: [{ set: 4, usage_pct: 60 }, { set: 1, usage_pct: 60 }, { set: 3, usage_pct: 45 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',          usage_pct: 80 }, { stat_id: 55, name: 'Health %', usage_pct: 15 }],
      3: [{ stat_id: 42, name: 'Defense %',       usage_pct: 70 }, { stat_id: 55, name: 'Health %', usage_pct: 25 }],
      4: [{ stat_id: 55, name: 'Health %',        usage_pct: 50 }, { stat_id: 56, name: 'Protection %', usage_pct: 45 }],
      5: [{ stat_id: 56, name: 'Protection %',    usage_pct: 55 }, { stat_id: 55, name: 'Health %',  usage_pct: 40 }],
      6: [{ stat_id: 55, name: 'Health %',        usage_pct: 45 }, { stat_id: 56, name: 'Protection %', usage_pct: 45 }],
    },
    speed_priority: 230,
  },
  healer: {
    sets: [{ set: 4, usage_pct: 80 }, { set: 1, usage_pct: 55 }, { set: 7, usage_pct: 30 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',          usage_pct: 95 }],
      3: [{ stat_id: 42, name: 'Defense %',       usage_pct: 60 }, { stat_id: 55, name: 'Health %', usage_pct: 35 }],
      4: [{ stat_id: 55, name: 'Health %',        usage_pct: 60 }, { stat_id: 56, name: 'Protection %', usage_pct: 35 }],
      5: [{ stat_id: 55, name: 'Health %',        usage_pct: 65 }, { stat_id: 56, name: 'Protection %', usage_pct: 30 }],
      6: [{ stat_id: 18, name: 'Potency %',       usage_pct: 45 }, { stat_id: 55, name: 'Health %', usage_pct: 40 }],
    },
    speed_priority: 285,
  },
  gl_attacker: {
    sets: [{ set: 4, usage_pct: 70 }, { set: 6, usage_pct: 65 }, { set: 2, usage_pct: 45 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',          usage_pct: 90 }],
      3: [{ stat_id: 42, name: 'Defense %',       usage_pct: 65 }],
      4: [{ stat_id: 17, name: 'Crit Damage %',   usage_pct: 60 }, { stat_id: 41, name: 'Offense %', usage_pct: 35 }],
      5: [{ stat_id: 56, name: 'Protection %',    usage_pct: 55 }, { stat_id: 55, name: 'Health %',  usage_pct: 40 }],
      6: [{ stat_id: 41, name: 'Offense %',       usage_pct: 70 }],
    },
    speed_priority: 310,
  },
  gl_support: {
    sets: [{ set: 4, usage_pct: 80 }, { set: 1, usage_pct: 50 }, { set: 8, usage_pct: 35 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',          usage_pct: 95 }],
      3: [{ stat_id: 42, name: 'Defense %',       usage_pct: 65 }],
      4: [{ stat_id: 55, name: 'Health %',        usage_pct: 55 }, { stat_id: 56, name: 'Protection %', usage_pct: 40 }],
      5: [{ stat_id: 55, name: 'Health %',        usage_pct: 55 }, { stat_id: 56, name: 'Protection %', usage_pct: 40 }],
      6: [{ stat_id: 55, name: 'Health %',        usage_pct: 45 }, { stat_id: 41, name: 'Offense %', usage_pct: 35 }],
    },
    speed_priority: 320,
  },
}

// ─── Character → Role mapping ────────────────────────────────────────────────
const CHARACTER_ROLES: Record<string, Role> = {
  // ── Galactic Legends ──
  SUPREMELEADERKYLO:             'gl_attacker',
  REYJAKKU:                      'gl_attacker',
  JEDIMASTERLUKE:                'gl_support',
  SITHETERNALEMPEROR:            'gl_attacker',
  STARKILLER:                    'gl_attacker',
  LORDVADER:                     'gl_attacker',
  JABBATHEHUTTLEGENDARY:         'gl_support',
  MAUL:                          'gl_attacker',
  APOTHEOSISLUKE:                'gl_support',
  IMPERIALSENNATORPALPATINE:     'gl_support',

  // ── Sith ──
  DARTHREVAN:                    'speed_attacker',
  MALAK:                         'crit_attacker',
  DARTHNIHILUS:                  'potency_support',
  DARTHTRAYA:                    'speed_support',
  DARTHSION:                     'speed_attacker',
  DARTHMALAK:                    'crit_attacker',
  DARTHSIDIOUS:                  'potency_support',
  DARTHVADER:                    'speed_attacker',
  EMPERORPALPATINE:              'potency_support',
  SITHMARAUDER:                  'crit_attacker',
  SITHTROOPER:                   'tank',
  DARTHTALON:                    'crit_attacker',
  SAVAGE:                        'crit_attacker',
  ASAJVENTRESS:                  'crit_attacker',
  COUNTDOOKU:                    'potency_support',
  GRIEVOUS:                      'potency_support',
  NINTHSISTER:                   'tank',
  SECONDSISTER:                  'speed_attacker',
  GRANDINFACTOR:                 'potency_support',

  // ── Jedi / Light Side ──
  COMMANDERLUKESKYWALKER:        'speed_attacker',
  JEDIKNIGHTLUKE:                'speed_attacker',
  GRANDMASTERYODA:               'speed_support',
  MASTERKENOBI:                  'speed_support',
  GENERALSKYWALKER:              'speed_attacker',
  PADMEAMIDALA:                  'speed_support',
  KITFISTO:                      'crit_attacker',
  MACEWINDU:                     'crit_attacker',
  SHAAKTI:                       'healer',
  AAYLA:                         'speed_attacker',
  BARRISOFFEE:                   'healer',
  EETHKOTH:                      'healer',
  JOCASTANU:                     'speed_support',
  LUMINARA:                      'healer',
  BASTILA:                       'speed_support',
  BASTILAFALLENORDER:            'speed_attacker',
  JKANAKIN:                      'speed_attacker',
  AHSOKATANO:                    'speed_attacker',
  AHSOKATANOSNIPS:               'speed_attacker',
  EZRABRIDGER:                   'speed_attacker',
  KANANJARRUS:                   'tank',
  SABINEWREN:                    'speed_attacker',

  // ── Rebel / Resistance ──
  HANSOLO:                       'speed_attacker',
  CHEWBACCA:                     'tank',
  C3POHERO:                      'potency_support',
  BB8:                           'speed_support',
  R2D2:                          'potency_support',
  LANDO:                         'crit_attacker',
  LOBOT:                         'speed_support',
  CASSIANANDOR:                  'potency_support',
  K2SO:                          'tank',
  JYNEERSO:                      'potency_support',
  HOTHHAN:                       'speed_attacker',
  HOTHLEIA:                      'speed_support',
  HOTHREBELSCOUT:                'speed_attacker',
  HOTHREBELSOLDIER:              'tank',
  WEDGE:                         'crit_attacker',
  BIGGS:                         'speed_attacker',
  FINALORDERTIEPILOT:            'crit_attacker',
  POE:                           'speed_attacker',
  FINN:                          'speed_attacker',
  ROSE:                          'potency_support',
  ZORI:                          'speed_attacker',

  // ── Empire / First Order ──
  GRANDMOFFTARKIN:               'potency_support',
  DIRECTORKRENNIC:               'potency_support',
  DEATHTROOPERS:                 'speed_attacker',
  RANGETROOPER:                  'speed_attacker',
  SNOWTROOPER:                   'speed_attacker',
  STORMTROOPER:                  'tank',
  ROYALGUARD:                    'tank',
  MAGMATROOPER:                  'tank',
  SHORETROOPER:                  'tank',
  TFPFOE:                        'tank',
  KYLORENUNMASKED:               'speed_attacker',
  KYLOREN:                       'speed_attacker',
  CAPTAINPHASMA:                 'speed_support',
  GENERALPRYDE:                  'speed_support',
  FOO:                           'speed_attacker',
  FOSF:                          'speed_attacker',

  // ── Clone Wars / Republic ──
  CLONESERGEANTPHASEII:         'crit_attacker',
  CLONETROOPER:                  'crit_attacker',
  ARCCLONE:                      'crit_attacker',
  CLONEWARSCHEWBACCA:            'tank',
  REX:                           'speed_support',
  FIVES:                         'speed_attacker',
  ECHO:                          'speed_support',
  WRECKER:                       'tank',
  CROSSHAIR:                     'crit_attacker',
  TECHBADGUY:                    'potency_support',
  HUNTERBADGUY:                  'speed_attacker',
  OMEGABADGUY:                   'speed_support',

  // ── Mandalorian ──
  THEMANDALORIAN:                'speed_attacker',
  THEMANDALORIANJETTROOPER:      'speed_attacker',
  GREEF:                         'speed_support',
  CARASUNA:                      'tank',
  MOFFGIDEON:                    'potency_support',
  BOKATAN:                       'speed_attacker',
  FENNEC:                        'crit_attacker',
  COBBVANTH:                     'tank',
  PAZVIZSLA:                     'tank',
  AXEWOVES:                      'speed_attacker',

  // ── Bounty Hunters ──
  BOBAFETT:                      'crit_attacker',
  BOBAFETTNEW:                   'crit_attacker',
  DEATHTROOPER:                  'speed_attacker',
  EMBO:                          'crit_attacker',
  GREEDO:                        'crit_attacker',
  HK47:                          'speed_attacker',
  JANGOFETT:                     'crit_attacker',
  DENGAR:                        'speed_attacker',
  AURRA:                         'crit_attacker',
  CADSANE:                       'potency_support',
  CARINABLACK:                   'potency_support',
  IG88:                          'crit_attacker',
  BOSSK:                         'potency_support',
  ZAM:                           'potency_support',
  HONDO:                         'potency_support',

  // ── Galactic Republic ──
  GENERALKENOBI:                 'tank',
  QUIGONJINN:                    'potency_support',
  JARMELO:                       'healer',
  PLOKOON:                       'healer',
  MONNALA:                       'tank',

  // ── Nightsisters ──
  MOTHERTALZIN:                  'potency_support',
  DAKA:                          'healer',
  ZOMBIE:                        'tank',
  SPIRIT:                        'speed_attacker',
  MORGANKLAUDE:                  'speed_attacker',

  // ── Scoundrels ──
  YOUNGHAN:                      'crit_attacker',
  YOUNGLANDOCALRISSIAN:          'crit_attacker',
  QIRA:                          'speed_support',
  BECKETT:                       'potency_support',
  ENFYSNEST:                     'speed_attacker',
  RANGETROOPERHOTH:              'speed_attacker',

  // ── Separatists ──
  B1BATTLEDROID:                 'potency_support',
  B2SUPERBATTLEDROID:            'tank',
  DROIDEKA:                      'crit_attacker',
  MAGNADROID:                    'tank',
  NUTE:                          'speed_support',
  SAN:                           'potency_support',
  POGGLE:                        'potency_support',
  GEONOSIANSPY:                  'crit_attacker',
  GEONOSIANSOLDIER:              'crit_attacker',
  GEONOSIANSUN:                  'crit_attacker',
  GENOSIANQUEEN:                 'potency_support',

  // ── Ewoks ──
  CHIEFCHIRPA:                   'speed_support',
  LOGRAY:                        'potency_support',
  PAPLOO:                        'tank',
  WICKET:                        'speed_attacker',
  TEEBO:                         'potency_support',
  EWOKSCOUT:                     'speed_attacker',
  EWOKELDERLUMANARA:             'healer',

  // ── Tusken ──
  TUSKENRAIDER:                  'speed_attacker',
  TUSKENCHIEF:                   'speed_support',
  TUSKENSHAMAN:                  'healer',
  TUSKENURSA:                    'tank',

  // ── Droids ──
  IG11:                          'speed_support',
  IG86:                          'crit_attacker',
  L3:                            'tank',
  LOBOT2:                        'speed_support',

  // ── Old Republic ──
  REVAN:                         'speed_support',
  JOLEEBINDO:                    'healer',
  ZAALBAR:                       'tank',
  MISSIONVAO:                    'speed_attacker',
  CARTH:                         'speed_attacker',
  CANDEROUS:                     'tank',
  T3M4:                          'potency_support',
  VISAS:                         'healer',
  HANHARR:                       'tank',

  // ── Galactic Legend support chars ──
  SITHPALPATINE:                 'potency_support',
  WAMPA:                         'crit_attacker',
  RANCOR:                        'tank',
  GEONOSIANBROODALPHA:           'speed_support',
  HERMITYODA:                    'speed_support',
  CHANCELLORPALPATINE:           'potency_support',
  IMPERIALSUPERCOMMANDO:         'speed_attacker',
  SCARIFREBEL:                   'speed_support',
  ADMIRALPIETT:                  'speed_support',
  ADMIRALRADDUS:                 'speed_support',
  MONMOTHMA:                     'speed_support',
  CHIRRUT:                       'speed_support',
  BAZE:                          'tank',
  SAW:                           'speed_attacker',
  STORMTROOPERHANS:              'potency_support',
}

// ─── Build recommendation from role ──────────────────────────────────────────
function fromRole(base_id: string, role: Role): BestModsRecommendation {
  return { base_id, ...ROLE_TEMPLATES[role] }
}

// ─── Specific overrides (persos avec builds non-standard) ────────────────────
const SPECIFIC: Record<string, Omit<BestModsRecommendation, 'base_id'>> = {
  // Darth Nihilus — plein de potency + speed
  DARTHNIHILUS: {
    sets: [{ set: 4, usage_pct: 75 }, { set: 7, usage_pct: 70 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',     usage_pct: 95 }],
      3: [{ stat_id: 42, name: 'Defense %', usage_pct: 65 }],
      4: [{ stat_id: 56, name: 'Protection %', usage_pct: 55 }, { stat_id: 55, name: 'Health %', usage_pct: 40 }],
      5: [{ stat_id: 56, name: 'Protection %', usage_pct: 55 }, { stat_id: 55, name: 'Health %', usage_pct: 40 }],
      6: [{ stat_id: 18, name: 'Potency %', usage_pct: 75 }],
    },
    speed_priority: 295,
  },
  // General Kenobi — tank mais speed important pour les taunts
  GENERALKENOBI: {
    sets: [{ set: 4, usage_pct: 65 }, { set: 1, usage_pct: 60 }, { set: 3, usage_pct: 40 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',     usage_pct: 85 }],
      3: [{ stat_id: 42, name: 'Defense %', usage_pct: 75 }],
      4: [{ stat_id: 56, name: 'Protection %', usage_pct: 60 }, { stat_id: 55, name: 'Health %', usage_pct: 35 }],
      5: [{ stat_id: 56, name: 'Protection %', usage_pct: 60 }, { stat_id: 55, name: 'Health %', usage_pct: 35 }],
      6: [{ stat_id: 55, name: 'Health %',  usage_pct: 50 }, { stat_id: 56, name: 'Protection %', usage_pct: 45 }],
    },
    speed_priority: 255,
  },
  // Palpatine Sith Eternal — max speed + potency
  SITHETERNALEMPEROR: {
    sets: [{ set: 4, usage_pct: 80 }, { set: 7, usage_pct: 65 }, { set: 6, usage_pct: 40 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',     usage_pct: 95 }],
      3: [{ stat_id: 42, name: 'Defense %', usage_pct: 65 }],
      4: [{ stat_id: 17, name: 'Crit Damage %', usage_pct: 55 }, { stat_id: 41, name: 'Offense %', usage_pct: 40 }],
      5: [{ stat_id: 56, name: 'Protection %', usage_pct: 55 }, { stat_id: 55, name: 'Health %', usage_pct: 40 }],
      6: [{ stat_id: 41, name: 'Offense %', usage_pct: 60 }, { stat_id: 18, name: 'Potency %', usage_pct: 35 }],
    },
    speed_priority: 335,
  },
  // SLKR — speed max
  SUPREMELEADERKYLO: {
    sets: [{ set: 4, usage_pct: 90 }, { set: 6, usage_pct: 55 }, { set: 2, usage_pct: 35 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',     usage_pct: 98 }],
      3: [{ stat_id: 42, name: 'Defense %', usage_pct: 70 }],
      4: [{ stat_id: 17, name: 'Crit Damage %', usage_pct: 65 }, { stat_id: 41, name: 'Offense %', usage_pct: 30 }],
      5: [{ stat_id: 56, name: 'Protection %', usage_pct: 60 }, { stat_id: 55, name: 'Health %', usage_pct: 35 }],
      6: [{ stat_id: 41, name: 'Offense %', usage_pct: 70 }],
    },
    speed_priority: 350,
  },
  // Rey — speed max
  REYJAKKU: {
    sets: [{ set: 4, usage_pct: 88 }, { set: 6, usage_pct: 50 }, { set: 2, usage_pct: 35 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',     usage_pct: 97 }],
      3: [{ stat_id: 42, name: 'Defense %', usage_pct: 70 }],
      4: [{ stat_id: 17, name: 'Crit Damage %', usage_pct: 60 }, { stat_id: 41, name: 'Offense %', usage_pct: 35 }],
      5: [{ stat_id: 56, name: 'Protection %', usage_pct: 55 }, { stat_id: 55, name: 'Health %', usage_pct: 40 }],
      6: [{ stat_id: 41, name: 'Offense %', usage_pct: 70 }],
    },
    speed_priority: 345,
  },
  // CLS — speed max + offense
  COMMANDERLUKESKYWALKER: {
    sets: [{ set: 4, usage_pct: 85 }, { set: 2, usage_pct: 55 }, { set: 6, usage_pct: 45 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',     usage_pct: 96 }],
      3: [{ stat_id: 42, name: 'Defense %', usage_pct: 68 }],
      4: [{ stat_id: 17, name: 'Crit Damage %', usage_pct: 55 }, { stat_id: 41, name: 'Offense %', usage_pct: 40 }],
      5: [{ stat_id: 56, name: 'Protection %', usage_pct: 55 }, { stat_id: 55, name: 'Health %', usage_pct: 40 }],
      6: [{ stat_id: 41, name: 'Offense %', usage_pct: 72 }],
    },
    speed_priority: 325,
  },
  // JML — speed max
  JEDIMASTERLUKE: {
    sets: [{ set: 4, usage_pct: 90 }, { set: 1, usage_pct: 55 }, { set: 8, usage_pct: 35 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',     usage_pct: 98 }],
      3: [{ stat_id: 42, name: 'Defense %', usage_pct: 68 }],
      4: [{ stat_id: 55, name: 'Health %',  usage_pct: 55 }, { stat_id: 56, name: 'Protection %', usage_pct: 40 }],
      5: [{ stat_id: 55, name: 'Health %',  usage_pct: 55 }, { stat_id: 56, name: 'Protection %', usage_pct: 40 }],
      6: [{ stat_id: 55, name: 'Health %',  usage_pct: 50 }, { stat_id: 41, name: 'Offense %', usage_pct: 40 }],
    },
    speed_priority: 360,
  },
  // Darth Revan — speed max
  DARTHREVAN: {
    sets: [{ set: 4, usage_pct: 85 }, { set: 7, usage_pct: 60 }, { set: 6, usage_pct: 40 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',     usage_pct: 96 }],
      3: [{ stat_id: 42, name: 'Defense %', usage_pct: 65 }],
      4: [{ stat_id: 17, name: 'Crit Damage %', usage_pct: 55 }, { stat_id: 41, name: 'Offense %', usage_pct: 40 }],
      5: [{ stat_id: 56, name: 'Protection %', usage_pct: 55 }],
      6: [{ stat_id: 41, name: 'Offense %', usage_pct: 65 }],
    },
    speed_priority: 340,
  },
  // Padmé — speed + potency
  PADMEAMIDALA: {
    sets: [{ set: 4, usage_pct: 80 }, { set: 7, usage_pct: 65 }, { set: 1, usage_pct: 30 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',     usage_pct: 96 }],
      3: [{ stat_id: 42, name: 'Defense %', usage_pct: 65 }],
      4: [{ stat_id: 55, name: 'Health %',  usage_pct: 55 }, { stat_id: 56, name: 'Protection %', usage_pct: 40 }],
      5: [{ stat_id: 55, name: 'Health %',  usage_pct: 55 }, { stat_id: 56, name: 'Protection %', usage_pct: 40 }],
      6: [{ stat_id: 18, name: 'Potency %', usage_pct: 60 }, { stat_id: 41, name: 'Offense %', usage_pct: 35 }],
    },
    speed_priority: 315,
  },
  // Lord Vader — speed max + offense
  LORDVADER: {
    sets: [{ set: 4, usage_pct: 85 }, { set: 2, usage_pct: 55 }, { set: 6, usage_pct: 45 }],
    primaries: {
      2: [{ stat_id: 5,  name: 'Speed',     usage_pct: 96 }],
      3: [{ stat_id: 42, name: 'Defense %', usage_pct: 65 }],
      4: [{ stat_id: 17, name: 'Crit Damage %', usage_pct: 60 }, { stat_id: 41, name: 'Offense %', usage_pct: 35 }],
      5: [{ stat_id: 56, name: 'Protection %', usage_pct: 55 }, { stat_id: 55, name: 'Health %', usage_pct: 40 }],
      6: [{ stat_id: 41, name: 'Offense %', usage_pct: 72 }],
    },
    speed_priority: 355,
  },
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function getRecommendation(base_id: string): BestModsRecommendation {
  // Specific override
  if (SPECIFIC[base_id]) return { base_id, ...SPECIFIC[base_id] }
  // Role-based
  const role = CHARACTER_ROLES[base_id]
  if (role) return fromRole(base_id, role)
  // Default fallback: speed attacker
  return fromRole(base_id, 'speed_attacker')
}

// URL for live updates — points to the raw JSON on GitHub
export const RECOMMENDATIONS_UPDATE_URL =
  'https://raw.githubusercontent.com/darthjen76/swgoh-mods/main/public/recommendations.json'

export type { Role }
