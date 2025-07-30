export type Rarity = 'thường' | 'hiếm' | 'quý' | 'sử thi' | 'huyền thoại' | 'thần thoại';

export const RarityLabels: Record<Rarity, string> = {
    thường: 'Thường',
    hiếm: 'Hiếm',
    quý: 'Quý',
    'sử thi': 'Sử Thi',
    'huyền thoại': 'Huyền Thoại',
    'thần thoại': 'Thần Thoại'
};

export const RARITY_SLUGS: Record<Rarity, string> = {
    thường: 'thuong',
    hiếm: 'hiem',
    quý: 'quy',
    'sử thi': 'su-thi',
    'huyền thoại': 'huyen-thoai',
    'thần thoại': 'than-thoai'
};

export const QualityLabels: Record<number, string> = {
    1: 'Nhân Phẩm',
    2: 'Địa Phẩm',
    3: 'Thiên Phẩm',
    4: 'Huyền Phẩm',
    5: 'Hoàng Phẩm'
};

export const QualitySlugs: Record<number, string> = {
    1: 'nhan-pham',
    2: 'dia-pham',
    3: 'thien-pham',
    4: 'huyen-pham',
    5: 'hoang-pham'
};


export type EquipmentItemType = 'weapon' | 'magic' | 'cloak' | 'armor' | 'helmet' | 'gloves' | 'boots' | 'accessory';
export type RegularItemType = 'pill' | 'herb' | 'material' | 'ore' | 'book' | 'rune' | 'other';
export type ItemType = EquipmentItemType | RegularItemType;

export const EquipmentItemTypeKeys: EquipmentItemType[] = ['weapon', 'magic', 'cloak', 'armor', 'helmet', 'gloves', 'boots', 'accessory'];
export const RegularItemTypeKeys: RegularItemType[] = ['pill', 'herb', 'material', 'ore', 'book', 'rune', 'other'];


export const ItemTypeLabels: Record<ItemType, string> = {
    // Equipment
    weapon: 'Vũ khí',
    magic: 'Pháp Bảo',
    cloak: 'Áo choàng',
    armor: 'Giáp',
    helmet: 'Mũ',
    gloves: 'Găng tay',
    boots: 'Giày',
    accessory: 'Phụ kiện',
    // Regular Items
    pill: 'Đan dược',
    herb: 'Dược liệu',
    material: 'Vật liệu',
    ore: 'Khoáng thạch',
    book: 'Sách',
    rune: 'Phù chú',
    other: 'Khác',
};

export const ItemTypeEmojis: Record<ItemType, string> = {
    // Trang bị
    weapon: '🗡️',
    magic: '🔮',
    cloak: '🧥',
    armor: '👗',
    helmet: '👑',
    gloves: '🧤',
    boots: '👟',
    accessory: '💍',
    // Vật phẩm
    pill: '🔴',
    herb: '🌿',
    material: '🪵',
    ore: '🪨',
    rune: '🏷️',
    book: '📖',
    other: '❓',
};

export interface ActiveEffect {
  name: string;
  source: string; // Tên vật phẩm/kỹ năng gốc
  description: string;
  duration: number; // Số lượt còn lại, Infinity cho vĩnh viễn
  stats: Partial<Stats>;
}

export interface Skill {
  id: string; // Add ID for keying
  name: string;
  description: string; // Original description from player
  type: string; // Chủ động, Bị động, Thiên phú...
  manaCost: number;
  cooldown: number;
  effect: string; // Detailed game effect from AI
  currentCooldown: number;
}

export interface Location {
  id: number;
  name: string;
  description?: string;
  region?: string;
  isSafeZone?: boolean;
  isDiscovered?: boolean;
}

export interface Faction {
  id: number;
  name: string;
  description?: string;
  alignment?: 'Chính' | 'Tà' | 'Trung lập';
  reputation?: number;
  isDiscovered?: boolean;
}

export const FactionAlignmentLabels: Record<string, string> = {
    'Chính': 'Chính Đạo',
    'Tà': 'Ma Đạo',
    'Trung lập': 'Trung Lập'
};

export interface Lore {
  id: number;
  title: string;
  content: string;
}

export interface Stats {
  // Main pools
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stamina: number;
  maxStamina: number;

  // Progression
  exp: number;
  expr: number; // This is BONUS EXP
  level: number;
  nextLevelExp: number;

  // Universal
  killingIntent: number; // Sát Ý

  // Body Stats - Chỉ số Thể Chất
  constitution: number; // Căn Cốt (Affects HP, Stamina regen)
  spd: number; // Thân Pháp (Agility/Speed for turn order & dodge)
  burstPower: number; // Lực Bộc Phát
  def: number; // Phòng Ngự

  // Attack Stats - Chỉ số Công Kích
  atk: number; // Sức mạnh (Base for physical attacks)
  magicPower: number; // Pháp Lực (Base for magic attacks)
}

export interface Item {
  id: number;
  name: string;
  quantity: number;
  description: string;
  itemType: 'Vật phẩm thường' | 'Trang bị' | 'Nhiệm vụ' | 'Công pháp';
  
  // UNIFIED FIELDS
  rarity: Rarity;
  quality: number; // 1-5
  type: ItemType;
  requiredLevel?: number; // Yêu cầu cấp độ tuyệt đối

  // CONSUMABLE FIELDS
  isConsumable?: boolean;
  uses?: number;
  duration?: number;
  stats?: Partial<Stats>;
  pillType?: 'Hồi Phục' | 'Cải tạo' | 'Bí Đan';
  effects?: string[];

  // EQUIPMENT FIELDS
  equipmentDetails?: {
    position: EquipmentSlot;
    stats: Partial<Stats>;
    effects: string[];
  };
}

export type EquipmentSlot = 'Vũ khí' | 'Pháp Bảo' | 'Áo choàng' | 'Giáp' | 'Mũ' | 'Găng tay' | 'Giày' | 'Phụ kiện' | 'gongfa1' | 'gongfa2' | 'gongfa3';

// New Maps for consistent translation between logic keys and display/AI names
export const EQUIPMENT_TYPE_TO_SLOT_MAP: Record<EquipmentItemType, EquipmentSlot> = {
    'weapon': 'Vũ khí',
    'magic': 'Pháp Bảo',
    'cloak': 'Áo choàng',
    'armor': 'Giáp',
    'helmet': 'Mũ',
    'gloves': 'Găng tay',
    'boots': 'Giày',
    'accessory': 'Phụ kiện'
};

export const EQUIPMENT_SLOT_TO_TYPE_MAP: Record<string, EquipmentItemType> = Object.fromEntries(
    Object.entries(EQUIPMENT_TYPE_TO_SLOT_MAP).map(([type, slot]) => [slot, type as EquipmentItemType])
);


export interface Equipment {
  slot: EquipmentSlot;
  item: Item | null;
}

export interface Quest {
  id: number;
  title: string;
  description: string;
  status: 'Chưa nhận' | 'Đã nhận' | 'Hoàn thành' | 'Không hoàn thành';
  type: 'Cốt truyện' | 'Phụ (có hẹn giờ)' | 'Phụ (vô hạn)';
  turnsToComplete?: number;
  reward?: string;
  penalty?: string;
}

export interface NPC {
  id: number;
  name:string;
  description?: string;
  relationship?: 'Thân thiện' | 'Trung lập' | 'Thù địch';
  // Optional fields to be discovered
  age?: number;
  realm?: string;
  gender?: 'Nam' | 'Nữ' | 'Không rõ';
  personality?: string;
  details?: string;
  avatarUrl?: string;
  avatarStoredLocally?: boolean;
  avatarError?: boolean;
  AvatarTags?: string;
  isDiscovered?: boolean;
}

export interface Companion {
    id: number;
    name: string;
    description: string;
}

export interface RecipeIngredient {
    name: string;
    quantity: number;
}

export interface Recipe {
    name: string; // e.g., "Công thức Hồi Phục Đan"
    type: 'alchemy' | 'smithing';
    description: string;
    ingredients: RecipeIngredient[];
    resultItem: Omit<Item, 'id' | 'quantity'>; // The full item object that is created
}

export interface Character {
  name: string;
  gender: 'Nam' | 'Nữ' | 'Không rõ';
  background: string;
  goal: string;
  personality?: string;
  stats: Stats;
  age: number;
  lifespan: number;
  realm: string;
  currencies: Record<string, number>;
  activeEffects: ActiveEffect[];
  skills: Skill[];
  playerAvatarUrl?: string;
}

export interface World {
  setting: string;
  style: string;
  realmSystem: string[];
  currencies: string[];
  nsfw: boolean;
  authorStyle?: string;
  difficulty?: string;
}

export interface StorySummaryEntry {
    id: number;
    turn: number;
    summary: string;
}

export interface GameState {
  character: Character;
  world: World;
  inventory: Item[];
  equipment: Equipment[];
  quests: Quest[];
  npcs: NPC[];
  companions: Companion[];
  location: string;
  storyLog: StoryEntry[];
  currentChoices: string[];
  turn: number;
  locations: Location[];
  factions: Faction[];
  lore: Lore[];
  knowledgeBase: {
    items: Item[];
    recipes: Recipe[];
  };
  heavenlyRules: string[];
  coreMemory: string[];
  storySummaries: StorySummaryEntry[];
}

export interface StoryEntry {
    id: number;
    type: 'player' | 'ai' | 'system' | 'user_custom_action';
    text: string;
    tags?: string; // AI responses have tags, player actions don't
}

// --- TYPES FOR SETUP SCREEN ---

export interface InitialSkill {
  id: number;
  name: string;
  description: string;
}

export interface InitialItem {
  id: number;
  name: string;
  quantity: number;
  itemType: 'Vật phẩm thường' | 'Trang bị' | 'Nhiệm vụ' | 'Công pháp';
  
  // UNIFIED FIELDS
  rarity: Rarity;
  quality: number;
  type: ItemType;
  requiredLevel?: number; // Yêu cầu cấp độ tuyệt đối
  
  description: string;
  isConsumable?: boolean;
  isEquippedAtStart?: boolean;
  uses?: number;
  duration?: number;
  stats?: Partial<Stats>;
  pillType?: 'Hồi Phục' | 'Cải tạo' | 'Bí Đan';
  effects?: string;
  equipmentDetails?: {
    position: EquipmentSlot;
    stats: Partial<Stats>;
    effects: string;
  };
}

export interface InitialNPC {
  id: number;
  name: string;
  gender: 'Nam' | 'Nữ' | 'Không rõ';
  personality: string;
  favorability: number;
  realm: string;
  details: string;
  avatarUrl: string;
}

export interface InitialLore {
  id: number;
  title: string;
  content: string;
}

export interface InitialLocation {
  id: number;
  name: string;
  description: string;
  isSafeZone: boolean;
  region: string;
}

export interface InitialFaction {
  id: number;
  name: string;
  description: string;
  alignment: 'Chính' | 'Tà' | 'Trung lập';
  reputation: number;
}


export interface InitialAddons {
  skills: InitialSkill[];
  items: InitialItem[];
  npcs: InitialNPC[];
  lore: InitialLore[];
  locations: InitialLocation[];
  factions: InitialFaction[];
}

export interface GameSetupData {
    // Tab "Thiết Lập Thế Giới"
    world: Pick<World, 'setting' | 'style' | 'currencies' | 'difficulty'> & { realmSystem: string[] };
    // Tab "Nhân Vật & Cốt Truyện"
    character: Omit<Character, 'stats' | 'realm' | 'activeEffects' | 'skills' | 'currencies'> & { startingRealm: string };
    // Tab "Yếu Tố Khởi Đầu"
    initialAddons: InitialAddons;
    // Tab "AI Hỗ Trợ"
    aiSupport: {
        genMode: 'original' | 'fanfiction';
        authorName: string; // Optional author style for any mode
        originalStoryIdea: string;
        originalNsfw: boolean;
        fanficSourceTitle: string;
        fanficSourceAuthor: string;
        fanficUserIdea: string;
        fanficSummary: string;
        fanficNsfw: boolean;
    };
    initialCoreMemory: string[];
}


export enum GameScreen {
    MainMenu,
    Setup,
    Gameplay
}

export enum ActiveView {
    Story,
    Inventory,
    Equipment,
    CharacterSheet,
    Crafting,
    Lore,
    Quests,
    Management, // Renamed from Journal, contains Journal, Core Memory, Heavenly Dao
    Relationships,
}

export interface ViewState {
  type: ActiveView;
}

// New state for the info tooltip
export type EntityType = 'npc' | 'item' | 'equipment' | 'skill' | 'location' | 'faction' | 'lore' | 'quest';

export interface TooltipState {
    type: EntityType;
    entity: any; // The actual object for the entity
    position: { top: number; left: number; };
}

export interface AIWorldGenerationResponse {
    world: {
        setting: string;
        style: string;
        realmSystem: string;
        currencies: string[];
    };
    character: Omit<Character, 'stats' | 'realm' | 'activeEffects' | 'skills' | 'currencies'> & { startingRealm: string };
    initialAddons: InitialAddons;
    generatedOriginalStoryIdea?: string;
    generatedFanficIdea?: string;
    initialCoreMemory?: string[];
}

export interface SourceMaterialAnalysis {
    summary: string;
    realmSystem: { name: string; lifespanIncrease: string; }[];
    majorArcs: { title: string; summary: string; }[];
    keyNpcs: { name: string; gender: 'Nam' | 'Nữ' | 'Không rõ'; realm: string; personality: string; bio: string; }[];
    keyLocations: { name: string; description: string }[];
    keyFactions: { name: string; description: string }[];
    keySkills: { name: string; description: string }[];
    keyItems: { name: string; description: string }[];
    keyLore: { title: string; content: string; }[];
}

// --- STAT CALCULATION TYPES ---
export type StatKey = keyof Omit<Stats, 'hp' | 'mp' | 'exp' | 'level' | 'nextLevelExp' | 'stamina'>;
export type MaxStatKey = 'maxHp' | 'maxMp' | 'maxStamina';

export interface StatBreakdown {
    key: StatKey | MaxStatKey | 'hp' | 'mp' | 'stamina';
    base: number;
    modifier: number;
    total: number;
}
