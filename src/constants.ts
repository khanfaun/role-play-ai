import { GameState, Equipment, EquipmentSlot, Stats, Character, World } from './types';

export const SYSTEM_HEAVENLY_RULES: string[] = [
    "Phải tuân thủ tuyệt đối logic của hệ thống cảnh giới đã được định nghĩa. Không thể đột phá khi chưa đủ điều kiện (cấp độ).",
    "Không được tự ý thay đổi hoặc phá hủy các vật phẩm nhiệm vụ cốt truyện quan trọng.",
    "Phải duy trì tính nhất quán về tính cách và mục tiêu của các NPC chủ chốt.",
    "Không thể làm những hành động hoàn toàn phi vật lý hoặc phi logic trong bối cảnh của thế giới (ví dụ: phàm nhân bay lên trời).",
    "Văn phong của AI phải luôn cố định và phù hợp với bối cảnh truyện (ví dụ: không dùng tiếng nước ngoài hoặc kiến thức hiện đại trong truyện tiên hiệp).",
    "Người chơi không được phép nhập hành động nhằm mục đích thay đổi trực tiếp chỉ số, cảnh giới, hoặc tua nhanh thời gian.",
    "Người chơi không được phép nhập hành động tự trao cho mình vật phẩm, trang bị, hay kỹ năng.",
    "Người chơi không được phép nhập hành động trực tiếp giết một NPC hoặc tự di chuyển đến một địa điểm không có trong lựa chọn hoặc bối cảnh.",
    "GIỚI TÍNH NPC (CỰC KỲ QUAN TRỌNG): Phải TUYỆT ĐỐI tuân thủ giới tính của các NPC đã được định nghĩa. Nếu NPC là 'Nam', phải dùng đại từ nhân xưng nam (hắn, y, chàng trai, gã,...). Nếu là 'Nữ', phải dùng đại từ nữ (nàng, cô ấy, nàng ta,...). NGHIÊM CẤM miêu tả một NPC nam với các đặc điểm của nữ giới (ngực, yểu điệu,...) và ngược lại."
];

export const ALL_AVATAR_TAGS: string[] = [
    "nam giới", "nữ giới", "lão già", "thiếu niên", "thiếu nữ", "trung niên", "cô gái", "chàng trai", "tiên tử", "ma nữ", "yêu nữ", "thánh nữ",
    "đẹp trai", "xinh đẹp", "khôi ngô", "tuấn tú", "mỹ nhân", "hấp dẫn", "quyến rũ", "thanh tú", "loli", "ngự tỷ",
    "tóc trắng", "tóc đen", "tóc vàng", "tóc đỏ", "tóc xanh", "tóc dài", "tóc ngắn", "mắt xanh", "mắt đỏ", "mắt vàng",
    "cổ trang", "hiện đại", "huyền huyễn", "tiên hiệp", "kiếm hiệp", "võ hiệp", "đô thị", "dị năng",
    "lạnh lùng", "nghiêm túc", "vui vẻ", "hoạt bát", "trầm mặc", "cao ngạo", "ôn nhu", "dịu dàng", "hung ác", "tà ác",
    "áo trắng", "áo đen", "áo đỏ", "áo xanh", "áo choàng", "giáp", "trường bào", "váy",
    "kiếm", "đao", "thương", "cung", "trượng", "sáo", "đàn", "quạt",
    "rồng", "phượng", "hồ ly", "yêu thú", "ma thú", "quái vật", "linh thú", "thú cưng",
    "nsfw", "hở hang", "ngực bự", "mông to", "gợi cảm",
];

export const INITIAL_STATS: Stats = {
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    stamina: 50,
    maxStamina: 50,
    exp: 0,
    expr: 0,
    level: 0,
    nextLevelExp: 100,
    atk: 5,
    def: 5,
    spd: 5,
    magicPower: 5,
    burstPower: 5,
    constitution: 5,
    killingIntent: 0,
};

export const INITIAL_EQUIPMENT_SLOTS: EquipmentSlot[] = ['Vũ khí', 'Pháp Bảo', 'Áo choàng', 'Giáp', 'Mũ', 'Găng tay', 'Giày', 'Phụ kiện', 'gongfa1', 'gongfa2', 'gongfa3'];

export const getInitialEquipment = (): Equipment[] => {
    return INITIAL_EQUIPMENT_SLOTS.map(slot => ({ slot, item: null }));
}

export const getInitialGameState = (character: Character, world: World): GameState => ({
    character,
    world,
    inventory: [],
    equipment: getInitialEquipment(),
    quests: [],
    npcs: [],
    companions: [],
    locations: [],
    factions: [],
    lore: [],
    knowledgeBase: {
        items: [],
        recipes: [],
    },
    heavenlyRules: [],
    coreMemory: [],
    storySummaries: [],
    location: 'Nơi chưa xác định', // AI will set this
    storyLog: [],
    currentChoices: [],
    turn: 0,
});
