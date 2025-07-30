import { Character } from '../types';

export const MINOR_REALMS = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Đại Viên Mãn'];
const FIRST_CULTIVATION_LEVELS = 13;

/**
 * Chuyển đổi một cấp độ (level) thành tên Cảnh giới tương ứng.
 * @param level Cấp độ tuyệt đối của nhân vật.
 * @param realmSystem Mảng chuỗi định nghĩa hệ thống cảnh giới.
 * @returns Tên Cảnh giới dưới dạng chuỗi.
 */
export function getRealmName(level: number, realmSystem: string[]): string {
    if (!realmSystem || realmSystem.length === 0) return 'Phàm Nhân';

    const cleanLevel = Math.max(0, Math.floor(level));

    const hasMortalRealm = realmSystem[0].toLowerCase().includes('phàm');
    const firstCultivationIndex = hasMortalRealm ? 1 : 0;
    
    if (cleanLevel === 0 && hasMortalRealm) {
        return realmSystem[0];
    }
    
    // If level is 0 without mortal realm, or < 1, it's considered level 1 for naming.
    const effectiveLevel = (cleanLevel < 1 && !hasMortalRealm) ? 1 : cleanLevel;

    const firstCultivationStartLevel = 1;
    const firstCultivationEndLevel = FIRST_CULTIVATION_LEVELS;
    if (effectiveLevel >= firstCultivationStartLevel && effectiveLevel <= firstCultivationEndLevel) {
        if (firstCultivationIndex >= realmSystem.length) return 'Cảnh giới không xác định';
        const realmName = realmSystem[firstCultivationIndex];
        return `${realmName} Tầng ${effectiveLevel}`;
    }

    const subsequentRealmsStartLevel = FIRST_CULTIVATION_LEVELS + 1; // 14
    if (effectiveLevel >= subsequentRealmsStartLevel) {
        const adjustedLevel = effectiveLevel - subsequentRealmsStartLevel; // Level 14 becomes 0 for calculation
        const majorRealmIndexInSystem = Math.floor(adjustedLevel / MINOR_REALMS.length) + firstCultivationIndex + 1;
        const minorRealmIndex = adjustedLevel % MINOR_REALMS.length;

        if (majorRealmIndexInSystem < realmSystem.length) {
            const majorRealmName = realmSystem[majorRealmIndexInSystem];
            const minorRealmName = MINOR_REALMS[minorRealmIndex];
            return `${majorRealmName} ${minorRealmName}`;
        }
    }
    
    // Fallback for any other case, including levels beyond the defined system
    const lastMajorRealm = realmSystem[realmSystem.length - 1];
    return `${lastMajorRealm} ${MINOR_REALMS[MINOR_REALMS.length - 1]} (Đỉnh Phong)`;
}

/**
 * Chuyển đổi tên Cảnh giới thành cấp độ (level) tuyệt đối tương ứng.
 * @param realmName Tên cảnh giới (ví dụ: "Trúc Cơ", "Trúc Cơ Sơ Kỳ").
 * @param realmSystem Mảng chuỗi định nghĩa hệ thống cảnh giới.
 * @returns Cấp độ tuyệt đối dưới dạng số, hoặc null nếu không tìm thấy.
 */
export function getLevelForRealm(realmName: string, realmSystem: string[]): number | null {
    if (!realmName || !realmSystem || realmSystem.length === 0) return null;

    const trimmedName = realmName.trim().toLowerCase();
    const hasMortalRealm = realmSystem[0].toLowerCase().includes('phàm');
    const firstCultivationIndex = hasMortalRealm ? 1 : 0;
    
    if (hasMortalRealm && trimmedName === realmSystem[0].toLowerCase()) {
        return 0;
    }

    if (firstCultivationIndex < realmSystem.length) {
        const firstCultivationName = realmSystem[firstCultivationIndex].toLowerCase();
        if (trimmedName.startsWith(firstCultivationName)) {
            const match = trimmedName.match(/tầng (\d+)/i);
            if (match && match[1]) {
                const tier = parseInt(match[1], 10);
                if (tier >= 1 && tier <= FIRST_CULTIVATION_LEVELS) {
                    return tier;
                }
            }
            return 1; // Default to Tầng 1
        }
    }

    const subsequentRealmsStartLevel = FIRST_CULTIVATION_LEVELS + 1;
    for (let i = firstCultivationIndex + 1; i < realmSystem.length; i++) {
        const majorRealmName = realmSystem[i].toLowerCase();
        for (let j = 0; j < MINOR_REALMS.length; j++) {
            const minorRealmName = MINOR_REALMS[j].toLowerCase();
            if (trimmedName === `${majorRealmName} ${minorRealmName}`) {
                const majorRealmOffset = (i - (firstCultivationIndex + 1)) * MINOR_REALMS.length;
                return subsequentRealmsStartLevel + majorRealmOffset + j;
            }
        }
        if (trimmedName === majorRealmName) {
            const majorRealmOffset = (i - (firstCultivationIndex + 1)) * MINOR_REALMS.length;
            return subsequentRealmsStartLevel + majorRealmOffset; // Default to Sơ Kỳ
        }
    }

    return null;
}


/**
 * Cập nhật cảnh giới của nhân vật dựa trên cấp độ hiện tại của họ.
 * @param character Đối tượng nhân vật để cập nhật.
 * @param realmSystem Mảng chuỗi định nghĩa hệ thống cảnh giới.
 * @returns Đối tượng nhân vật đã được cập nhật.
 */
export function updateCharacterRealm(character: Character, realmSystem: string[]): Character {
    const newRealm = getRealmName(character.stats.level, realmSystem);
    if (newRealm !== character.realm) {
        character.realm = newRealm;
    }
    return character;
}

/**
 * Tạo danh sách các tùy chọn Cảnh giới/Cấp độ để sử dụng trong UI, ví dụ như dropdown.
 * @param realmSystem Mảng chuỗi định nghĩa hệ thống cảnh giới.
 * @returns Một mảng các đối tượng chứa cấp độ và tên hiển thị tương ứng.
 */
export function generateRealmLevelOptions(realmSystem: string[]): { level: number; name: string }[] {
    const options: { level: number; name: string }[] = [];
    if (!realmSystem || realmSystem.length === 0) {
        return [{ level: 0, name: 'Phàm Nhân' }];
    }

    const maxLevelToGenerate = 100; 

    for (let level = 0; level <= maxLevelToGenerate; level++) {
        const realmName = getRealmName(level, realmSystem);
        
        if (realmName.includes('(Đỉnh Phong)')) {
            if (!options.some(opt => opt.name === realmName)) {
                 options.push({ level, name: realmName });
            }
            break; 
        }
        
        options.push({ level, name: realmName });
    }
    
    return options;
}
