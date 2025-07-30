import { GameState, Item, Quest, NPC, Companion, Stats, ActiveEffect, Equipment, EquipmentSlot, Location, Faction, Lore, Character, QualityLabels, EQUIPMENT_TYPE_TO_SLOT_MAP, EquipmentItemType, Skill } from '../types';
import { INITIAL_STATS } from '../constants';
import { getRealmName, getLevelForRealm, updateCharacterRealm } from './realmService';
import { calculateTotalStats, STAT_METADATA } from '../components/shared/statUtils';

// Helper function to parse tag attributes
const parseAttributes = (attrString: string): Record<string, any> => {
    const attributes: Record<string, any> = {};
    const regex = /(\w+)=("([^"]*)"|'([^']*)'|([^,\]]+))/g;
    let match;
    while ((match = regex.exec(attrString)) !== null) {
        const key = match[1];
        const value = match[3] ?? match[4] ?? match[5]; // "string", 'string', or number/boolean
        
        // Attempt to convert to number if possible
        if (!isNaN(Number(value)) && !isNaN(parseFloat(value)) && value.trim() !== '') {
            attributes[key] = Number(value);
        } else if (value.toLowerCase() === 'true') {
            attributes[key] = true;
        } else if (value.toLowerCase() === 'false') {
            attributes[key] = false;
        } else {
            attributes[key] = value;
        }
    }
    return attributes;
};

const parseStatsFromString = (statsString: string): Partial<Stats> => {
    if (!statsString || typeof statsString !== 'string') return {};
    const stats: Partial<Stats> = {};
    statsString.split(',').forEach(part => {
        const [key, value] = part.split(':');
        if (key && value && !isNaN(Number(value))) {
            stats[key.trim() as keyof Stats] = Number(value);
        }
    });
    return stats;
}


const addItemToKnowledgeBase = (itemToAdd: Item, state: GameState) => {
    // Find the quality prefix (e.g., "Nhân Phẩm ") and remove it to get the base name.
    const qualityLabel = Object.values(QualityLabels).find(label => itemToAdd.name.startsWith(label + ' '));
    let baseName = itemToAdd.name;
    if (qualityLabel) {
        baseName = itemToAdd.name.substring(qualityLabel.length).trim();
    }

    const existingItemIndex = state.knowledgeBase.items.findIndex(i => i.name.toLowerCase() === baseName.toLowerCase());

    if (existingItemIndex === -1) {
        // If it doesn't exist, add a clean version with the base name.
        const cleanItem: Item = {
            ...JSON.parse(JSON.stringify(itemToAdd)),
            name: baseName, // Use the base name
            quantity: 1,     // Quantity in knowledge base is always 1
        };
        state.knowledgeBase.items.push(cleanItem);
        // Sort for consistent display and prompt generation
        state.knowledgeBase.items.sort((a,b) => a.name.localeCompare(b.name));
    }
};

export const discoverEntitiesFromText = (text: string, gameState: GameState): { newState: GameState; discovered: { type: string; name: string }[] } => {
    const newState = JSON.parse(JSON.stringify(gameState));
    const discovered: { type: string, name: string }[] = [];
    const lowercasedText = text.toLowerCase();

    // Discover NPCs
    newState.npcs.forEach((npc: NPC) => {
        if (!npc.isDiscovered && lowercasedText.includes(npc.name.toLowerCase())) {
            npc.isDiscovered = true;
            discovered.push({ type: 'nhân vật', name: npc.name });
        }
    });

    // Discover Locations
    newState.locations.forEach((location: Location) => {
        if (!location.isDiscovered && lowercasedText.includes(location.name.toLowerCase())) {
            location.isDiscovered = true;
            discovered.push({ type: 'địa điểm', name: location.name });
        }
    });

    // Discover Factions
    newState.factions.forEach((faction: Faction) => {
        if (!faction.isDiscovered && lowercasedText.includes(faction.name.toLowerCase())) {
            faction.isDiscovered = true;
            discovered.push({ type: 'phe phái', name: faction.name });
        }
    });

    return { newState, discovered };
};

export function postProcessGameState(gameState: GameState): GameState {
    let newState = JSON.parse(JSON.stringify(gameState)); // Work on a copy

    // Level up check
    while (newState.character.stats.exp >= newState.character.stats.nextLevelExp && newState.character.stats.nextLevelExp > 0) {
        newState.character.stats.level += 1;
        newState.character.stats.exp -= newState.character.stats.nextLevelExp;
        newState.character.stats.nextLevelExp = Math.floor(INITIAL_STATS.nextLevelExp * Math.pow(1.5, newState.character.stats.level));
        newState.character = updateCharacterRealm(newState.character, newState.world.realmSystem);
        
        // Refill HP/MP on level up & apply base stat gains if any
        const totalStats = calculateTotalStats(newState.character, newState.equipment);
        newState.character.stats.hp = totalStats.maxHp;
        newState.character.stats.mp = totalStats.maxMp;
        newState.character.stats.stamina = totalStats.maxStamina;
    }

    // Timed quest check and penalty application
    const STAT_NAME_TO_KEY_MAP: Record<string, keyof Stats> = {};
    for (const key in STAT_METADATA) {
        const meta = STAT_METADATA[key as keyof Stats];
        if (meta) {
            STAT_NAME_TO_KEY_MAP[meta.label.toLowerCase()] = key as keyof Stats;
        }
    }
    STAT_NAME_TO_KEY_MAP['tinh lực giới hạn'] = 'maxHp';
    STAT_NAME_TO_KEY_MAP['thần thức giới hạn'] = 'maxMp';
    STAT_NAME_TO_KEY_MAP['thể lực giới hạn'] = 'maxStamina';

    newState.quests.forEach((quest: Quest) => {
        if (quest.status === 'Đã nhận' && quest.type === 'Phụ (có hẹn giờ)' && quest.turnsToComplete !== undefined && quest.turnsToComplete > 0) {
            quest.turnsToComplete -= 1;
            if (quest.turnsToComplete === 0) {
                quest.status = 'Không hoàn thành';
                if (quest.penalty) {
                    const penalties = quest.penalty.split(',').map(p => p.trim());
                    penalties.forEach(p => {
                        const durationMatch = p.match(/(.+?)\s+(-?\d+)\s*\(Trong vòng (\d+) lượt\)/i);
                        if (durationMatch) {
                            const [, name, valueStr, durationStr] = durationMatch;
                            const value = parseInt(valueStr, 10);
                            const duration = parseInt(durationStr, 10);
                            
                            const statKey = Object.keys(STAT_NAME_TO_KEY_MAP).find(key => name.toLowerCase().includes(key));

                            if (statKey) {
                                newState.character.activeEffects.push({
                                    name: `Hình Phạt: ${name.trim()}`,
                                    source: `Nhiệm vụ: ${quest.title}`,
                                    description: `Do thất bại nhiệm vụ "${quest.title}"`,
                                    duration,
                                    stats: { [STAT_NAME_TO_KEY_MAP[statKey]]: value }
                                });
                            }
                        } else {
                            const expMatch = p.match(/(?:bị giảm tu vi|EXP)\s*(-?\d+)/i);
                            if (expMatch) {
                                newState.character.stats.exp += parseInt(expMatch[1], 10);
                            } else {
                                const currencyMatch = p.match(/tiền tệ\s*(-?\d+)/i);
                                if (currencyMatch) {
                                    const value = parseInt(currencyMatch[1], 10);
                                    const currencyKeys = Object.keys(newState.character.currencies);
                                    if (currencyKeys.length > 0) {
                                        newState.character.currencies[currencyKeys[0]] = Math.max(0, newState.character.currencies[currencyKeys[0]] + value);
                                    }
                                }
                            }
                        }
                    });
                }
            }
        }
    });

    // De-leveling logic
    while (newState.character.stats.exp < 0 && newState.character.stats.level > 0) {
        const prevLevel = newState.character.stats.level - 1;
        const expForLevelFellFrom = Math.floor(INITIAL_STATS.nextLevelExp * Math.pow(1.5, prevLevel));
        
        newState.character.stats.exp += expForLevelFellFrom;
        newState.character.stats.level = prevLevel;
        newState.character.stats.nextLevelExp = expForLevelFellFrom;
        newState.character = updateCharacterRealm(newState.character, newState.world.realmSystem);
    }
    if (newState.character.stats.level === 0) {
        newState.character.stats.exp = Math.max(0, newState.character.stats.exp);
        newState.character.stats.nextLevelExp = INITIAL_STATS.nextLevelExp;
    }


    // Clamp HP/MP/Stamina with enhanced safety logic.
    const finalTotalStats = calculateTotalStats(newState.character, newState.equipment);

    // 1. Clamp all maximum stats to a minimum of 1. A living entity must have at least 1 max HP.
    const newMaxHp = Math.max(1, finalTotalStats.maxHp);
    const newMaxMp = Math.max(1, finalTotalStats.maxMp);
    const newMaxStamina = Math.max(1, finalTotalStats.maxStamina);

    // 2. Clamp current stats to be within [0, newMax].
    newState.character.stats.hp = Math.max(0, Math.min(newState.character.stats.hp, newMaxHp));
    newState.character.stats.mp = Math.max(0, Math.min(newState.character.stats.mp, newMaxMp));
    newState.character.stats.stamina = Math.max(0, Math.min(newState.character.stats.stamina, newMaxStamina));

    return newState;
}

export const applyTagsToState = (tags: string, gameState: GameState): GameState => {
    let newState = JSON.parse(JSON.stringify(gameState)); // Deep copy
    const tagRegex = /\[([^\]]+)\]/g;
    let match;
    const allTags = [];
    while ((match = tagRegex.exec(tags)) !== null) {
        allTags.push(match[0]);
    }
    
    if (allTags.length === 0 || tags.includes('[NO_CHANGES]')) {
        return postProcessGameState(newState);
    }

    let localIdCounter = Date.now();

    allTags.forEach(tagWithBrackets => {
        const tagContent = tagWithBrackets.slice(1, -1);
        const [command, ...attrsParts] = tagContent.split(/:\s*/);
        const attrString = attrsParts.join(':');
        
        // Special case for simple value tags like [COMMAND: "Value"]
        if (command.toUpperCase() === 'PERSONALITY_DEFINED') {
            const personality = attrString.replace(/"/g, '').trim();
            if (personality) {
                newState.character.personality = personality;
            }
            return; // Use `return` instead of `continue` because we are in a forEach loop
        }

        const attrs = parseAttributes(attrString);
        
        switch (command.toUpperCase()) {
            case 'STATS_UPDATE':
                Object.keys(attrs).forEach(key => {
                    const statKey = Object.keys(newState.character.stats).find(sKey => sKey.toLowerCase() === key.toLowerCase()) as keyof Stats;
                    if (statKey) {
                        const currentValue = newState.character.stats[statKey] ?? 0;
                        const changeValue = Number(attrs[key]);
                        if (typeof currentValue === 'number' && !isNaN(changeValue)) {
                            newState.character.stats[statKey] = currentValue + changeValue;
                        }
                    }
                });
                break;
            
            case 'CURRENCY_CHANGED': {
                const { name, amount } = attrs;
                if (name && typeof amount === 'number') {
                    // The name from the tag is the key.
                    if (newState.character.currencies[name] !== undefined) {
                        newState.character.currencies[name] = Math.max(0, newState.character.currencies[name] + amount);
                    } else if (amount > 0) {
                        // If the currency doesn't exist and we're adding, create it.
                        newState.character.currencies[name] = amount;
                    }
                }
                break;
            }

             case 'ITEM_ACQUIRED': {
                const { 
                    name, 
                    quantity = 1, 
                    description, 
                    itemType, 
                    type, 
                    rarity, 
                    quality, 
                    stats: statsString, 
                    effects, 
                    pillType, 
                    position, // for equipment
                    requiredLevel
                } = attrs;
                if (!name) break;
            
                const existingItem = newState.inventory.find((i: Item) => i.name === name);
            
                if (existingItem && itemType !== 'Trang bị') { // Stack regular items
                    existingItem.quantity += Number(quantity);
                    addItemToKnowledgeBase(existingItem, newState);
                } else { // Add new item or non-stackable equipment
                    const finalStats = parseStatsFromString(statsString);
                    
                    const newItem: Item = {
                        id: localIdCounter++,
                        name: name,
                        quantity: Number(quantity),
                        description: description || 'AI quyết định',
                        itemType: itemType || 'Vật phẩm thường',
                        rarity: rarity || 'thường',
                        quality: Number(quality) || 1,
                        type: type || 'other',
                        requiredLevel: requiredLevel != null ? Number(requiredLevel) : undefined,
                        stats: (itemType !== 'Trang bị') ? finalStats : {},
                        effects: (effects || '').split(';').map((e: string) => e.trim()).filter(Boolean),
                        pillType: pillType || undefined,
                        isConsumable: !['material', 'ore', 'herb', 'book'].includes(type) && itemType !== 'Trang bị',
                    };
            
                    if (newItem.itemType === 'Trang bị') {
                        // Infer position from type if not provided by AI, as a safety measure.
                        const finalPosition = position || EQUIPMENT_TYPE_TO_SLOT_MAP[newItem.type as EquipmentItemType] || 'Vũ khí';

                        newItem.equipmentDetails = {
                            position: finalPosition,
                            stats: finalStats,
                            effects: newItem.effects || [],
                        };
                        // Clear base stats/effects for equipment to avoid duplication
                        newItem.stats = {};
                        newItem.effects = [];
                    }
            
                    newState.inventory.push(newItem);
                    addItemToKnowledgeBase(newItem, newState);
                }
                const qualityLabel = QualityLabels[quality] || '';
                const displayName = (qualityLabel && itemType !== 'Nhiệm vụ' && !name.startsWith(qualityLabel)) ? `${qualityLabel} ${name}` : name;
                newState.storyLog.push({
                    id: localIdCounter++,
                    type: 'system',
                    text: `[Hệ thống] Bạn đã nhận được vật phẩm: ${displayName} (x${quantity})`
                });
                break;
            }

            case 'ITEM_REMOVED': {
                const { name, quantity = 1 } = attrs;
                if (!name) break;
                const itemIndex = newState.inventory.findIndex((i: Item) => i.name === name);
                if (itemIndex > -1) {
                    newState.inventory[itemIndex].quantity -= quantity;
                    if (newState.inventory[itemIndex].quantity <= 0) {
                        newState.inventory.splice(itemIndex, 1);
                    }
                }
                break;
            }
            
            case 'ITEM_USED': {
                const { name } = attrs;
                if (!name) break;
                const itemIndex = newState.inventory.findIndex((i: Item) => i.name === name);
                if (itemIndex > -1) {
                    const item = newState.inventory[itemIndex];

                    // Apply instant stats directly if there is no duration
                    if (item.stats && (!item.duration || item.duration <= 0)) {
                        Object.keys(item.stats).forEach(key => {
                            const statKey = key as keyof Stats;
                            const value = item.stats![statKey];
                            const currentValue = newState.character.stats[statKey] as number | undefined;
                            if (typeof value === 'number' && typeof currentValue === 'number') {
                                (newState.character.stats[statKey] as number) += value;
                            }
                        });
                    }
                    
                    // Apply active effects if there is a duration
                    if (item.stats && item.duration && item.duration > 0) {
                        const existingEffectIndex = newState.character.activeEffects.findIndex((e: ActiveEffect) => e.source === item.name);
                        
                        if (existingEffectIndex > -1) {
                            newState.character.activeEffects[existingEffectIndex].duration = item.duration;
                            newState.character.activeEffects[existingEffectIndex].stats = item.stats;
                            newState.character.activeEffects[existingEffectIndex].description = item.description || `Hiệu ứng từ ${item.name}`;
                        } else {
                            newState.character.activeEffects.push({
                                name: `Hiệu ứng: ${item.name}`,
                                source: item.name,
                                description: item.description || `Hiệu ứng từ ${item.name}`,
                                duration: item.duration,
                                stats: item.stats,
                            });
                        }
                    }

                    item.quantity -= 1;
                    if (item.quantity <= 0) {
                        newState.inventory.splice(itemIndex, 1);
                    }
                }
                break;
            }

            case 'EQUIPMENT_CHANGED': {
                const { slot, name } = attrs as { slot: EquipmentSlot, name: string };
                const equipmentSlot = newState.equipment.find((e: Equipment) => e.slot === slot);
                if (!equipmentSlot) break;
                
                if (equipmentSlot.item) {
                    const itemToAddBack = { ...equipmentSlot.item, quantity: 1 };
                    addItemToKnowledgeBase(itemToAddBack, newState);
                    const existingInInventory = newState.inventory.find((i: Item) => i.name === itemToAddBack.name && i.itemType === itemToAddBack.itemType);
                    if (existingInInventory) {
                        existingInInventory.quantity += 1;
                    } else {
                        newState.inventory.push(itemToAddBack);
                    }
                    equipmentSlot.item = null;
                }

                if (name) {
                    const itemIndex = newState.inventory.findIndex((i: Item) => i.name === name && i.itemType === 'Trang bị');
                    if (itemIndex > -1) {
                        const itemToEquip = newState.inventory[itemIndex];
                        addItemToKnowledgeBase(itemToEquip, newState);
                        equipmentSlot.item = { ...itemToEquip, quantity: 1 };
                        if (itemToEquip.quantity > 1) {
                            itemToEquip.quantity -= 1;
                        } else {
                            newState.inventory.splice(itemIndex, 1);
                        }
                    }
                }
                break;
            }

            case 'QUEST_ASSIGNED': {
                const { title, description = '', reward = '', type = 'Phụ (vô hạn)', turnsToComplete, penalty } = attrs;
                if (title && !newState.quests.some((q: Quest) => q.title === title)) {
                    newState.quests.push({
                        id: localIdCounter++,
                        title,
                        description,
                        reward,
                        status: 'Chưa nhận',
                        type,
                        turnsToComplete: type === 'Phụ (có hẹn giờ)' ? Number(turnsToComplete) || undefined : undefined,
                        penalty: type === 'Phụ (có hẹn giờ)' ? penalty : undefined,
                    });
                }
                break;
            }
            
            case 'QUEST_UPDATED': {
                const { title, status, description } = attrs;
                if (!title) break;
                const quest = newState.quests.find((q: Quest) => q.title === title);
                if (quest) {
                    if (status && ['Chưa nhận', 'Đã nhận', 'Hoàn thành', 'Không hoàn thành'].includes(status)) {
                        quest.status = status as Quest['status'];
                    }
                    if (description) {
                        quest.description = description;
                    }
                }
                break;
            }
            
            case 'COMPANION_ADD': {
                const { name, description = '' } = attrs;
                if (name && !newState.companions.some((c: Companion) => c.name === name)) {
                    newState.companions.push({ id: localIdCounter++, name, description });
                }
                break;
            }

            case 'COMPANION_REMOVE': {
                const { name } = attrs;
                if (name) newState.companions = newState.companions.filter((c: Companion) => c.name !== name);
                break;
            }

            case 'SET_LOCATION': {
                if (attrs.name) newState.location = attrs.name;
                break;
            }

            case 'SKILL_ACQUIRED': {
                 const { name, description = '', type = 'Bị động', manaCost = 0, cooldown = 0, effect } = attrs;
                 if (name && !newState.character.skills.some((s: any) => s.name === name)) {
                     newState.character.skills.push({
                        id: String(localIdCounter++),
                        name,
                        description,
                        type,
                        manaCost,
                        cooldown,
                        effect: effect || description,
                        currentCooldown: 0,
                     });
                     newState.storyLog.push({
                         id: localIdCounter++,
                         type: 'system',
                         text: `[Hệ thống] Bạn đã học được kỹ năng: ${name}`
                     });
                 }
                 break;
            }

            case 'CHARACTER_SET_REALM': {
                const { name } = attrs;
                if (!name) break;
                const level = getLevelForRealm(name, newState.world.realmSystem);
                if (level !== null) {
                    newState.character.stats.level = level;
                    newState.character.realm = getRealmName(level, newState.world.realmSystem);
                }
                break;
            }

            case 'LORE_KNOWLEDGE': {
                const { title, content } = attrs;
                if (title && content && !newState.lore.some((l: Lore) => l.title === title)) {
                    newState.lore.push({ id: localIdCounter++, title, content });
                    newState.storyLog.push({
                        id: localIdCounter++,
                        type: 'system',
                        text: `[Hệ thống] Bạn đã có dữ liệu về tri thức: ${title}`
                    });
                }
                break;
            }

            case 'LORE_LOCATION': {
                 const { name, description, region, isSafeZone } = attrs;
                 if (!name) break;
                 const existing = newState.locations.find((l: Location) => l.name === name);
                 if (existing) {
                     existing.isDiscovered = true;
                     if (description) existing.description = description;
                     if (region) existing.region = region;
                     if (isSafeZone !== undefined) existing.isSafeZone = isSafeZone;
                 } else {
                     newState.locations.push({ id: localIdCounter++, name, description, region, isSafeZone, isDiscovered: true });
                     newState.storyLog.push({
                         id: localIdCounter++,
                         type: 'system',
                         text: `[Hệ thống] Bạn đã khám phá ra địa điểm mới: ${name}`
                     });
                 }
                 break;
            }

            case 'LORE_FACTION': {
                const { name, description, alignment } = attrs;
                if (!name) break;
                const existing = newState.factions.find((f: Faction) => f.name === name);
                if (existing) {
                    existing.isDiscovered = true;
                    if (description) existing.description = description;
                    if (alignment) existing.alignment = alignment;
                } else {
                    newState.factions.push({ id: localIdCounter++, name, description, alignment, reputation: 0, isDiscovered: true });
                    newState.storyLog.push({
                        id: localIdCounter++,
                        type: 'system',
                        text: `[Hệ thống] Bạn đã có dữ liệu về phe phái: ${name}`
                    });
                }
                break;
            }

            case 'REPUTATION_CHANGED': {
                const { name, change } = attrs;
                if (!name || !change) break;
                const faction = newState.factions.find((f: Faction) => f.name === name);
                if (faction) {
                    faction.reputation = (faction.reputation || 0) + Number(change);
                }
                break;
            }
            
            case 'LORE_NPC': {
                const { name, description, relationship, age, realm, personality, gender } = attrs;
                if (!name) break;
                const existing = newState.npcs.find((n: NPC) => n.name === name);
                if (existing) {
                    existing.isDiscovered = true;
                    if (description) existing.description = description;
                    if (relationship) existing.relationship = relationship;
                    if (age) existing.age = age;
                    if (realm) existing.realm = realm;
                    if (personality) existing.personality = personality;
                    if (gender) existing.gender = gender;
                } else {
                    newState.npcs.push({ id: localIdCounter++, name, description, relationship, age, realm, personality, gender, isDiscovered: true });
                    newState.storyLog.push({
                        id: localIdCounter++,
                        type: 'system',
                        text: `[Hệ thống] Bạn đã có dữ liệu về nhân vật: ${name}`
                    });
                }
                break;
            }

            case 'EFFECT_APPLIED': {
                const { name, source, description, duration = -1, stats: statsJson } = attrs;
                if (!name || !source) break;
                let stats = {};
                try {
                    if (statsJson) stats = JSON.parse(statsJson);
                } catch(e) { console.error("Could not parse stats JSON in EFFECT_APPLIED", statsJson); }
                const durationNum = Number(duration);
                newState.character.activeEffects.push({ name, source, description: description || '', duration: durationNum === -1 ? Infinity : durationNum, stats });
                break;
            }

            case 'SYSTEM_LOG': {
                const { message } = attrs;
                if (message) {
                    newState.storyLog.push({
                        id: localIdCounter++,
                        type: 'system',
                        text: `[Hệ thống] ${message}`
                    });
                }
                break;
            }

            default:
                break;
        }
    });
    
    return postProcessGameState(newState);
}
