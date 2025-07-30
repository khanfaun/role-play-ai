import React from 'react';
import { Stats, Character, Equipment, StatKey, MaxStatKey, StatBreakdown } from '../../types';

export const STAT_METADATA: { [K in keyof Stats]?: {
    label: string;
    icon: JSX.Element;
    description: string;
    mechanism: string;
    isPrimaryPool?: boolean;
    colorClass?: string;
} } = {
    hp: { label: 'Tinh Lực', isPrimaryPool: true, colorClass: 'hp',
        icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
        description: "Sinh mệnh của nhân vật, thể hiện khả năng chịu đựng sát thương.",
        mechanism: "Giảm khi bị tấn công. Về 0 nhân vật sẽ trọng thương hoặc tử vong. Được tăng bởi Căn Cốt."
    },
    maxHp: { label: 'Tinh Lực Tối đa', icon: <></>, description: "Giới hạn sinh mệnh tối đa của nhân vật.", mechanism: "" },
    mp: { label: 'Thần Thức', isPrimaryPool: true, colorClass: 'mp',
        icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
        description: "Năng lượng tinh thần để thi triển pháp thuật, công pháp.",
        mechanism: "Tiêu hao khi sử dụng kỹ năng. Được tăng bởi Pháp Lực."
    },
    maxMp: { label: 'Thần Thức Tối đa', icon: <></>, description: "Giới hạn năng lượng tinh thần tối đa của nhân vật.", mechanism: "" },
    stamina: { label: 'Thể Lực', isPrimaryPool: true, colorClass: 'stamina',
        icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        description: "Sức bền cho các hành động thể chất như chạy, né tránh, sử dụng võ kỹ.",
        mechanism: "Tiêu hao khi thực hiện hành động tốn sức. Được tăng bởi Căn Cốt."
    },
    maxStamina: { label: 'Thể Lực Tối đa', icon: <></>, description: "Giới hạn sức bền tối đa của nhân vật.", mechanism: "" },
    exp: { 
        label: 'Kinh Nghiệm',
        icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.975-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.05 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
        description: "Điểm kinh nghiệm nhận được từ các hoạt động, dùng để lên cấp và mạnh mẽ hơn.",
        mechanism: "Khi thanh kinh nghiệm đầy, nhân vật sẽ lên cấp, nhận được các chỉ số cộng thêm và hồi đầy Tinh Lực, Thần Thức."
    },
    killingIntent: { label: 'Sát Ý',
        icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>,
        description: "Khí chất hung ác, quyết đoán toát ra từ nhân vật.",
        mechanism: "Ảnh hưởng đến tương tác với NPC, có thể mở khóa các lựa chọn hăm dọa hoặc gây hiệu ứng sợ hãi trong chiến đấu."
    },
    constitution: { label: 'Căn Cốt',
        icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.494v1.072a2 2 0 01-.822 1.636l-7 4.965a2 2 0 01-2.158 0l-7-4.965A2 2 0 012 9.572V8.494m18.018-2.198l-7.395-5.223a2 2 0 00-2.329 0L3.377 6.296m18.018-2.198v2.198m-18.018-2.198v2.198" /></svg>,
        description: "Nền tảng thể chất của nhân vật, quyết định tiềm năng luyện thể và khả năng chịu đựng.",
        mechanism: "Ảnh hưởng đến tốc độ hồi phục Tinh Lực và Thể Lực. Căn cốt tốt giúp giảm nguy cơ nội thương khi luyện công quá sức hoặc chịu đòn nặng."
    },
    spd: { label: 'Thân Pháp',
        icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>,
        description: "Sự nhanh nhẹn, tốc độ di chuyển và khả năng né tránh của nhân vật.",
        mechanism: "Quyết định thứ tự hành động trong chiến đấu. Thân pháp cao tăng khả năng né đòn tấn công của đối thủ."
    },
    burstPower: { label: 'Lực Bộc Phát',
        icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" style={{stroke: 'var(--atk-color)'}}/></svg>,
        description: "Khả năng tung ra sức mạnh đột ngột, vượt ngưỡng trong thời gian ngắn.",
        mechanism: "Tăng sát thương cho đòn đánh hoặc kỹ năng tiếp theo, thường đi kèm với thời gian hồi hoặc điều kiện kích hoạt."
    },
    def: { label: 'Phòng Ngự',
        icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        description: "Khả năng chống đỡ sát thương vật lý từ bên ngoài.",
        mechanism: "Giảm sát thương vật lý nhận vào. Bị ảnh hưởng bởi trang bị giáp trụ và các công pháp luyện thể."
    },
    atk: { label: 'Sức Mạnh',
        icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        description: "Đại diện cho sát thương vật lý cơ bản mà nhân vật có thể gây ra.",
        mechanism: "Là chỉ số chính để tính toán sát thương cho các đòn tấn công bằng vũ khí hoặc tay không."
    },
    magicPower: { label: 'Pháp Lực',
        icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.636 6.364l.707.707M6.343 6.343l-.707-.707m12.728 0l.707-.707M12 20.07V19M12 12a4 4 0 110-8 4 4 0 010 8z" /></svg>,
        description: "Cường độ và uy lực của các loại pháp thuật, thần thông.",
        mechanism: "Là chỉ số chính để tính toán sát thương và hiệu quả của các kỹ năng sử dụng Thần Thức (MP)."
    },
    expr: { 
        label: 'Bonus EXP',
        icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" style={{stroke: 'var(--exp-color)'}} /></svg>,
        description: "Điểm kinh nghiệm thưởng nhận được từ các nguồn đặc biệt như vật phẩm, hiệu ứng hoặc phần thưởng nhiệm vụ.",
        mechanism: "Được cộng trực tiếp vào thanh kinh nghiệm (EXP) của nhân vật khi tổng kết lượt hoặc khi nhận được."
    }
};

export const EMOJI_CURRENCY_MAP: Record<string, string> = {
    // From user's new list
    'linh thạch': '💎',
    'kim tệ': '🪙',
    'bạc tệ': '🥈',
    'đồng tệ': '🟠',
    'ngọc': '🟩',
    'xu': '🪙',
    'cống hiến': '🎖️',
    'hồn lực': '👻',
    'hồn tu': '👻',
    'ma khí': '🟣',
    'ma thạch': '🟣',
    'yêu khí': '🐲',
    'yêu tệ': '🐲',
    'linh khí': '✨',
    'danh vọng': '🏆',
    'uy danh': '🏆',
    'chân nguyên': '🌀',
    'chân khí': '🌀',
    'kỹ năng': '🧠',
    'skill point': '🧠',
    'thiện': '😇',
    'ác': '👿',
    'ngộ đạo': '🧘‍♂️',
    'nguyên tố': '🔥',
    'hỏa': '🔥',
    'băng': '❄️',
    'lôi': '⚡',

    // Merged from old map, keeping consistency
    'tiên ngọc': '❇️',
    'hồn thạch': '🔮',
    'huyết tinh': '🩸',
    'linh hồn': '✨',
    'vàng': '🟡',
    'bạc': '⚪',
    'đồng': '🟤',
    'điểm cống hiến': '🏅',
};


// This regex will match any emoji at the start of the string.
// The 'u' flag is necessary for Unicode property escapes like \p{Emoji}.
const EMOJI_REGEX = /^\p{Emoji}/u;

export function addEmojiToCurrency(name: string): string {
    const trimmedName = name.trim();
    // If it already has an emoji, return it as is.
    if (EMOJI_REGEX.test(trimmedName)) {
        return trimmedName;
    }

    const lowerCaseName = trimmedName.toLowerCase();
    for (const key in EMOJI_CURRENCY_MAP) {
        if (lowerCaseName.includes(key)) {
            return `${EMOJI_CURRENCY_MAP[key]} ${trimmedName}`;
        }
    }
    // If no match found, return the original name without an emoji.
    return trimmedName;
}

export function parseCurrency(name: string): { emoji: string | null, text: string } {
    const trimmedName = name.trim();
    const match = trimmedName.match(EMOJI_REGEX);
    if (match) {
        const emoji = match[0];
        const text = trimmedName.substring(emoji.length).trim();
        return { emoji, text };
    }
    return { emoji: null, text: trimmedName };
}

// --- STAT CALCULATION LOGIC ---

/**
 * Tính toán tổng chỉ số cuối cùng của nhân vật từ chỉ số gốc, trang bị và hiệu ứng.
 */
export function calculateTotalStats(character: Character, equipment: Equipment[]): Stats {
    // Start with a clean copy of base stats.
    const finalStats: Stats = JSON.parse(JSON.stringify(character.stats));

    // Define which stats can be modified by equipment and effects.
    const modifiableStats: (keyof Stats)[] = [
        'maxHp', 'maxMp', 'maxStamina', 'atk', 'def', 'spd', 'expr',
        'magicPower', 'burstPower', 'constitution', 'killingIntent'
    ];

    // For each modifiable stat, calculate the total from all sources.
    for (const key of modifiableStats) {
        // Get the character's base value for this stat, default to 0 if not a number or NaN.
        const baseValue = (typeof character.stats[key] === 'number' && !isNaN(character.stats[key])) ? (character.stats[key] as number) : 0;
        
        // Calculate total bonus from all equipped items.
        const equipmentBonus = equipment.reduce((total, slot) => {
            if (!slot.item?.equipmentDetails?.stats) return total;
            const statValue = slot.item.equipmentDetails.stats[key];
            return total + ((typeof statValue === 'number' && !isNaN(statValue)) ? statValue : 0);
        }, 0);

        // Calculate total bonus from all active effects.
        const effectBonus = character.activeEffects.reduce((total, effect) => {
             if (!effect.stats) return total;
            const statValue = effect.stats[key];
            return total + ((typeof statValue === 'number' && !isNaN(statValue)) ? statValue : 0);
        }, 0);

        // The final stat is the base value plus all bonuses.
        (finalStats[key] as number) = baseValue + equipmentBonus + effectBonus;
    }

    return finalStats;
}

/**
 * Tính toán và phân rã một chỉ số cụ thể thành (gốc, cộng thêm, tổng) để hiển thị trên UI.
 */
export const calculateStatBreakdown = (
    character: Character,
    equipment: Equipment[],
    key: StatKey | MaxStatKey
): StatBreakdown => {
    const base = character.stats[key] as number;
    let modifier = 0;

    equipment.forEach(slot => {
        if (slot.item?.equipmentDetails?.stats?.[key]) {
            modifier += slot.item.equipmentDetails.stats[key] || 0;
        }
    });

    character.activeEffects.forEach(effect => {
        if (effect.stats[key]) {
            modifier += effect.stats[key] || 0;
        }
    });

    return { key, base, modifier, total: base + modifier };
};

/**
 * Một hàm helper chuyên dụng để tính toán phân rã cho các chỉ số dạng thanh (HP, MP, Stamina).
 */
export const calculatePoolStatBreakdown = (
    character: Character,
    equipment: Equipment[],
    statType: 'hp' | 'mp' | 'stamina'
): StatBreakdown => {
    const maxStatKey: 'maxHp' | 'maxMp' | 'maxStamina' = statType === 'hp' ? 'maxHp' : statType === 'mp' ? 'maxMp' : 'maxStamina';
    const breakdown = calculateStatBreakdown(character, equipment, maxStatKey);
    return { ...breakdown, key: statType }; // Trả về key là 'hp', 'mp' thay vì 'maxHp', 'maxMp'
};

/**
 * Định dạng một đối tượng chỉ số thành một chuỗi dễ đọc cho AI trong prompt.
 */
export const formatStatsForAI = (stats: Partial<Stats> | undefined): string => {
    if (!stats || Object.keys(stats).length === 0) return 'Không có';
    return Object.entries(stats)
        .map(([key, value]) => {
            if (value === undefined || value === null || value === 0) return null;
            const label = STAT_METADATA[key as keyof Stats]?.label || key;
            const numValue = Number(value);
            return `${label}: ${numValue > 0 ? '+' : ''}${numValue}`;
        })
        .filter(Boolean)
        .join(', ');
};
