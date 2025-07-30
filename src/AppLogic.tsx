import React, { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { GameState, GameScreen, GameSetupData, StoryEntry, ActiveView, ViewState, TooltipState, EntityType, Item, Equipment, EquipmentSlot, Character, World, Stats, ActiveEffect, QualityLabels, Quest, Skill, InitialSkill, Recipe, StorySummaryEntry, Location, InitialNPC, InitialLocation, InitialFaction } from './types';
import { getInitialGameState, INITIAL_STATS, getInitialEquipment, ALL_AVATAR_TAGS, SYSTEM_HEAVENLY_RULES } from './constants';
import { callGeminiAPI, extractStateChangesFromText, fetchSkillDetailsFromAI, generateSummary } from './services/aiApiUtils';
import { applyTagsToState, discoverEntitiesFromText, postProcessGameState } from './services/gameStateUtils';
import { calculateTotalStats, formatStatsForAI, parseCurrency, STAT_METADATA } from './components/shared/statUtils';
import AppUI from './AppUI';
import { buildInitialPrompt } from './AppLogicCore';
import { getRealmName, getLevelForRealm, updateCharacterRealm } from './services/realmService';

// Helper function to parse bonus strings like "atk:5,hp:20"
const parseStatsBonus = (bonusString?: string): Partial<Stats> => {
    if (!bonusString) return {};
    const bonus: Partial<Stats> = {};
    bonusString.split(',').forEach(part => {
        const [key, value] = part.split(':');
        if (key && value) {
            const statKey = key.trim() as keyof Stats;
            bonus[statKey] = Number(value);
        }
    });
    return bonus;
};

const applyStatsBonus = (stats: Stats, bonus: Partial<Stats>): Stats => {
    const newStats = { ...stats };
    for (const key in bonus) {
        const statKey = key as keyof Stats;
        if (typeof newStats[statKey] === 'number' && typeof bonus[statKey] === 'number') {
            (newStats[statKey] as number) += bonus[statKey]!;
        }
    }
    return newStats;
};

const removeStatsBonus = (stats: Stats, bonus: Partial<Stats>): Stats => {
    const newStats = { ...stats };
    for (const key in bonus) {
        const statKey = key as keyof Stats;
        if (typeof newStats[statKey] === 'number' && typeof bonus[statKey] === 'number') {
            (newStats[statKey] as number) -= bonus[statKey]!;
        }
    }
    return newStats;
};

const calculateTheoreticalStats = (level: number, realm: string, realmProgressionList: any[]): Partial<Stats> => {
    const baseHp = 100 + (level * 10);
    const baseMana = 50 + (level * 5);
    const baseAtk = 10 + (level * 2);
    return { maxHp: baseHp, maxMp: baseMana, atk: baseAtk };
};

const formatKnowledgeBaseForAI = (items: Item[]): string => {
    if (items.length === 0) return 'Chưa có vật phẩm nào được biết đến.';
    const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));
    return sortedItems.map(item => {
        const stats = item.itemType === 'Trang bị' ? item.equipmentDetails?.stats : item.stats;
        const effects = (item.itemType === 'Trang bị' ? item.equipmentDetails?.effects : item.effects) || [];
        return `- Tên Gốc: "${item.name}", Loại: "${item.itemType}/${item.type}", Độ hiếm: "${item.rarity}", Hiệu ứng: "${effects.join('; ')}", Chỉ số đã biết: "${formatStatsForAI(stats)}"`;
    }).join('\n');
};

// -----------------------------
// === THÊM QUẢN LÝ API KEY ===
// -----------------------------

const AppLogic: React.FC = () => {
    const [userApiKey, setUserApiKey] = useState<string>(() => localStorage.getItem('userApiKey') || '');
    // Hàm lưu userApiKey vào state + localStorage
    const handleSaveUserApiKey = useCallback((key: string) => {
        setUserApiKey(key);
        localStorage.setItem('userApiKey', key);
    }, []);

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [currentScreen, setCurrentScreen] = useState<GameScreen>(GameScreen.MainMenu);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [activeView, setActiveView] = useState<ViewState | null>({ type: ActiveView.Story });
    const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);
    const [popupMessage, setPopupMessage] = useState<{ title: string; content: string } | null>(null);
    const [confirmation, setConfirmation] = useState<{ title: string; content: string; onConfirm: () => void; } | null>(null);
    const [newQuestNotification, setNewQuestNotification] = useState<Quest | null>(null);
    const [hasStoryStarted, setHasStoryStarted] = useState<boolean>(false);

    const [alchemyMaterials, setAlchemyMaterials] = useState<{ item: Item; quantity: number }[]>([]);
    const [smithingMaterials, setSmithingMaterials] = useState<{ item: Item; quantity: number }[]>([]);
    const [aiExperimentGoal, setAiExperimentGoal] = useState('');
    const [showCraftingModal, setShowCraftingModal] = useState(false);
    const [usedAvatarUrls, setUsedAvatarUrls] = useState(new Set());
    const [predefinedAvatars, setPredefinedAvatars] = useState<any[]>([]);

    useEffect(() => {
        if (popupMessage && popupMessage.title.includes('Thành Công')) {
            const timer = setTimeout(() => {
                setPopupMessage(null);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [popupMessage]);
    const handleNewGame = useCallback(() => {
        setCurrentScreen(GameScreen.Setup);
    }, []);

    const handleLoadGame = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                if (!text) throw new Error("File rỗng.");
                let loadedData = JSON.parse(text);

                if (loadedData.initialAddons || (loadedData.world && typeof loadedData.turn === 'undefined')) {
                    throw new Error("File không hợp lệ. Đây là file 'Thiết Lập Thế Giới', không phải file save game. Vui lòng sử dụng chức năng 'Nhập Thiết Lập Thế Giới' trong màn hình tạo cuộc phiêu lưu mới.");
                }
                const essentialKeys = ['character', 'world', 'turn', 'storyLog'];
                const missingEssentialKeys = essentialKeys.filter(key => !(key in loadedData));
                if (missingEssentialKeys.length > 0) {
                    throw new Error(`File save không hợp lệ. Thiếu các trường cốt lõi: ${missingEssentialKeys.join(', ')}.`);
                }

                if (loadedData.character && loadedData.world) {
                    loadedData.character.realm = getRealmName(loadedData.character.stats.level, loadedData.world.realmSystem);
                }

                setGameState(loadedData);
                setCurrentScreen(GameScreen.Gameplay);
                setActiveView({ type: ActiveView.Story });
                setHasStoryStarted(true);
                setPopupMessage({ title: 'Tải Game Thành Công', content: `Chào mừng trở lại, ${loadedData.character.name}!` });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Định dạng file không đúng hoặc file bị lỗi.";
                setPopupMessage({ title: 'Lỗi Tải Game', content: errorMessage });
            } finally {
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.readAsText(file);
    }, []);

    const handleSaveGame = useCallback(() => {
        if (!gameState) {
            setPopupMessage({ title: 'Lỗi', content: 'Không có dữ liệu game để lưu.' });
            return;
        }
        try {
            const gameStateString = JSON.stringify(gameState, null, 2);
            const blob = new Blob([gameStateString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
            link.download = `rpa-save-${gameState.character.name.replace(/\s+/g, '_')}-${timestamp}.json`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setPopupMessage({ title: 'Lưu Game Thành Công', content: `Game đã được lưu với tên:\n${link.download}` });
        } catch (error) {
            console.error("Error saving game:", error);
            setPopupMessage({ title: 'Lỗi Lưu Game', content: 'Đã có lỗi xảy ra khi lưu game.' });
        }
    }, [gameState]);

    const handleExitToMenu = useCallback(() => {
        setConfirmation({
            title: 'Thoát về Menu Chính?',
            content: 'Mọi tiến trình chưa được lưu sẽ bị mất. Bạn có chắc chắn muốn thoát?',
            onConfirm: () => {
                setGameState(null);
                setCurrentScreen(GameScreen.MainMenu);
                setActiveView({ type: ActiveView.Story });
                setHasStoryStarted(false);
            }
        });
    }, []);

    // KHỞI TẠO GAME: luôn truyền userApiKey vào fetchSkillDetailsFromAI
    const handleGameStart = useCallback(async (setupData: GameSetupData) => {
        setIsLoading(true);
        try {
            const character: Character = {
                ...setupData.character,
                stats: { ...INITIAL_STATS },
                realm: setupData.character.startingRealm,
                activeEffects: [],
                skills: [],
                currencies: setupData.world.currencies.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
            };
            const world: World = {
                ...setupData.world,
                nsfw: setupData.aiSupport.genMode === 'original' ? setupData.aiSupport.originalNsfw : setupData.aiSupport.fanficNsfw,
                authorStyle: setupData.aiSupport.authorName,
            };
            const initialLevel = getLevelForRealm(character.realm, world.realmSystem);
            if (initialLevel !== null) {
                character.stats.level = initialLevel;
            }
            character.realm = getRealmName(character.stats.level, world.realmSystem);

            let initialState = getInitialGameState(character, world);
            initialState.coreMemory = setupData.initialCoreMemory || [];
            initialState.heavenlyRules = [];

            // Tích hợp userApiKey vào hàm gọi AI
            const detailedSkills: Skill[] = await Promise.all(
                setupData.initialAddons.skills.map(skill => fetchSkillDetailsFromAI(skill, world.style, userApiKey))
            );
            initialState.character.skills.push(...detailedSkills);

            setupData.initialAddons.items.forEach(initialItem => {
                const effectsArray = (initialItem.effects || '').split(';').map(e => e.trim()).filter(Boolean);
                const equipmentEffectsArray = (initialItem.equipmentDetails?.effects || '').split(';').map(e => e.trim()).filter(Boolean);
                const newItem: Item = {
                    id: initialItem.id,
                    name: initialItem.name,
                    quantity: initialItem.quantity,
                    description: initialItem.description,
                    itemType: initialItem.itemType,
                    rarity: initialItem.rarity,
                    quality: initialItem.quality,
                    type: initialItem.type,
                    requiredLevel: initialItem.requiredLevel,
                    isConsumable: initialItem.isConsumable,
                    uses: initialItem.uses,
                    duration: initialItem.duration,
                    stats: initialItem.stats,
                    pillType: initialItem.pillType,
                    effects: effectsArray,
                    equipmentDetails: initialItem.equipmentDetails ? {
                        position: initialItem.equipmentDetails.position,
                        stats: initialItem.equipmentDetails.stats || {},
                        effects: equipmentEffectsArray
                    } : undefined,
                };
                const canEquip = newItem.requiredLevel == null || character.stats.level >= (newItem.requiredLevel || 0);
                if (initialItem.isEquippedAtStart && newItem.equipmentDetails && canEquip) {
                    const slot = initialState.equipment.find(s => s.slot === newItem.equipmentDetails!.position);
                    if (slot) {
                        slot.item = newItem;
                    } else {
                        initialState.inventory.push(newItem);
                    }
                } else {
                    initialState.inventory.push(newItem);
                }
                addItemToKnowledgeBase(newItem, initialState);
            });

            initialState.npcs = setupData.initialAddons.npcs.map(n => ({
                id: n.id,
                name: n.name,
                gender: n.gender,
                personality: n.personality,
                realm: n.realm,
                details: n.details,
                relationship: 'Trung lập',
                isDiscovered: false,
            }));
            initialState.locations = setupData.initialAddons.locations.map(l => ({
                id: l.id,
                name: l.name,
                description: l.description,
                isSafeZone: l.isSafeZone,
                region: l.region,
                isDiscovered: false,
            }));
            initialState.factions = setupData.initialAddons.factions.map(f => ({
                id: f.id,
                name: f.name,
                description: f.description,
                alignment: f.alignment,
                reputation: f.reputation,
                isDiscovered: false,
            }));
            initialState.lore = setupData.initialAddons.lore.map(l => ({
                id: l.id,
                title: l.title,
                content: l.content,
            }));

            setGameState(initialState);
            setCurrentScreen(GameScreen.Gameplay);
            setActiveView({ type: ActiveView.Story });
            setHasStoryStarted(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Đã có lỗi không xác định xảy ra.';
            setPopupMessage({ title: 'Lỗi Bắt Đầu Game', content: `Không thể bắt đầu game. Lỗi: ${errorMessage}` });
        } finally {
            setIsLoading(false);
        }
    }, [userApiKey]);
    // BẮT ĐẦU CÂU CHUYỆN ĐẦU TIÊN: gọi callGeminiAPI và generateSummary phải truyền userApiKey
    const handleStartInitialStory = useCallback(async () => {
        if (!gameState) return;

        setIsLoading(true);
        try {
            const detailedSkills: Skill[] = gameState.character.skills.map(s => ({
                ...s,
                id: s.id ?? String(Date.now() + Math.random()),
                description: s.description ?? '',
                type: s.type ?? 'Bị động',
                manaCost: s.manaCost ?? 0,
                cooldown: s.cooldown ?? 0,
                effect: s.effect ?? '',
                currentCooldown: 0,
            }));

            const initialItems: Item[] = [
                ...gameState.inventory,
                ...gameState.equipment.map(e => e.item).filter((i): i is Item => i !== null)
            ];

            const tempSetupData: GameSetupData = {
                world: gameState.world,
                character: { ...gameState.character, startingRealm: gameState.character.realm },
                initialAddons: {
                    skills: [],
                    items: [],
                    npcs: gameState.npcs.map((n): InitialNPC => ({ id: n.id, name: n.name, gender: n.gender || 'Không rõ', personality: n.personality || '', favorability: 0, realm: n.realm || '', details: n.details || '', avatarUrl: n.avatarUrl || '' })),
                    lore: gameState.lore,
                    locations: gameState.locations.map((l): InitialLocation => ({ id: l.id, name: l.name, description: l.description || '', isSafeZone: l.isSafeZone || false, region: l.region || '' })),
                    factions: gameState.factions.map((f): InitialFaction => ({ id: f.id, name: f.name, description: f.description || '', alignment: f.alignment || 'Trung lập', reputation: f.reputation || 0 })),
                },
                aiSupport: {
                    genMode: 'original', authorName: gameState.world.authorStyle || '',
                    originalStoryIdea: '', originalNsfw: gameState.world.nsfw,
                    fanficSourceTitle: '', fanficSourceAuthor: '', fanficUserIdea: '', fanficSummary: '', fanficNsfw: gameState.world.nsfw,
                },
                initialCoreMemory: gameState.coreMemory,
            };

            const prompt = buildInitialPrompt(tempSetupData, detailedSkills, initialItems);

            // Truyền userApiKey vào các hàm AI
            const { story, choices, tags } = await callGeminiAPI(prompt, userApiKey);
            const summaryText = await generateSummary(story, userApiKey);

            const newEntry: StoryEntry = { id: Date.now(), type: 'ai', text: story, tags };

            setGameState(prevState => {
                if (!prevState) return null;
                let updatedState = applyTagsToState(tags, prevState);

                const textAndChoices = story + ' ' + choices.join(' ');
                const { newState: discoveredState, discovered } = discoverEntitiesFromText(textAndChoices, updatedState);
                updatedState = discoveredState;

                const discoveryMessages: StoryEntry[] = discovered.map(d => ({
                    id: Date.now() + Math.random(),
                    type: 'system',
                    text: `[Hệ thống] Bạn đã có dữ liệu về ${d.type}: ${d.name}`
                }));

                const newSummaryEntry: StorySummaryEntry = { id: Date.now() + 1, turn: 1, summary: summaryText };
                const newLog = [...updatedState.storyLog, newEntry, ...discoveryMessages];

                return {
                    ...updatedState,
                    storyLog: newLog,
                    currentChoices: choices,
                    turn: 1,
                    storySummaries: [newSummaryEntry, ...updatedState.storySummaries],
                };
            });
            setHasStoryStarted(true);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Đã có lỗi không xác định xảy ra.';
            setPopupMessage({ title: 'Lỗi Bắt Đầu Game', content: `Không thể bắt đầu câu chuyện. Lỗi: ${errorMessage}` });
        } finally {
            setIsLoading(false);
        }
    }, [gameState, userApiKey]);

    // XỬ LÝ HÀNH ĐỘNG NGƯỜI CHƠI: truyền userApiKey khi gọi AI
    const processPlayerAction = useCallback(async (action: string, stateToUse?: GameState) => {
        const currentState = stateToUse || gameState;
        if (!currentState) return;

        setIsLoading(true);

        const lastFiftyEntries = currentState.storyLog.slice(-50);
        const storyContext = lastFiftyEntries.map(entry => {
            if (entry.type === 'player' || entry.type === 'user_custom_action') {
                return `Người chơi: "${entry.text}"`;
            } else if (entry.type === 'system') {
                return `Hệ thống: "${entry.text}"`;
            }
            return `AI: "${entry.text}"`;
        }).join('\n');

        const totalStats = calculateTotalStats(currentState.character, currentState.equipment);

        const discoveredNpcs = currentState.npcs.filter(npc => npc.isDiscovered);
        const npcContext = discoveredNpcs.length > 0
            ? discoveredNpcs.map(npc => `- ${npc.name} (Giới tính: ${npc.gender || 'Không rõ'}, Cảnh giới: ${npc.realm || 'Chưa rõ'}, Tính cách: ${npc.personality || 'Chưa rõ'})`).join('\n')
            : 'Chưa gặp NPC nào.';

        const systemRulesString = SYSTEM_HEAVENLY_RULES.map(r => `        - ${r}`).join('\n');
        const creationRules = `
**QUY TẮC TẠO DỮ LIỆU MỚI (CỰC KỲ QUAN TRỌNG):**
- Khi ngươi giới thiệu một NPC, địa điểm, phe phái, hoặc tri thức MỚI LẦN ĐẦU TIÊN trong truyện, ngươi BẮT BUỘC phải sử dụng thẻ lệnh tương ứng để tạo dữ liệu cho nó.
    - NPC Mới: Dùng [LORE_NPC: name="Tên", gender="Nam/Nữ", ...].
    - Địa điểm Mới: Dùng [LORE_LOCATION: name="Tên", description="Mô tả", ...].
    - Phe phái Mới: Dùng [LORE_FACTION: name="Tên", alignment="Chính/Tà/Trung lập", ...].
    - Tri thức Mới: Dùng [LORE_KNOWLEDGE: title="Tiêu đề", content="Nội dung"].
- Khi nhân vật nhận được vật phẩm MỚI hoặc đã biết, BẮT BUỘC dùng [ITEM_ACQUIRED: name="Tên", ...].
- Việc này đảm bảo hệ thống game ghi nhận sự tồn tại của các thực thể mới.`;

        const prompt = `
            **BỐI CẢNH HIỆN TẠI:**
            - Thế giới: ${currentState.world.setting}, phong cách ${currentState.world.style}.
            - Địa điểm hiện tại: ${currentState.location}
            - Lượt: ${currentState.turn}
            - Nhân vật: ${currentState.character.name} (Cấp ${currentState.character.stats.level}, ${currentState.character.realm})
            - Chỉ số Hiện tại (gốc + trang bị + hiệu ứng):
                - Tinh Lực: ${Math.round(currentState.character.stats.hp)}/${totalStats.maxHp}
                - Thần Thức: ${Math.round(currentState.character.stats.mp)}/${totalStats.maxMp}
                - Thể Lực: ${Math.round(currentState.character.stats.stamina)}/${totalStats.maxStamina}
            
            **CÁC NPC ĐÃ BIẾT (TUÂN THỦ GIỚI TÍNH):**
            ${npcContext}

            **BỘ NHỚ CỐT LÕI (Không bao giờ quên):**
            ${currentState.coreMemory.map(r => `- ${r}`).join('\n')}

            **LỊCH SỬ GẦN ĐÂY:**
            ${storyContext}

            **HÀNH ĐỘNG CỦA NGƯỜI CHƠI:**
            "${action}"
            
            ${creationRules}

            **LUẬT LỆ THIÊN ĐẠO (BẮT BUỘC TUÂN THỦ):**
${systemRulesString}

            **NHIỆM VỤ CỦA BẠN:**
            1.  Viết một đoạn văn tiếp nối câu chuyện, phản hồi lại hành động của người chơi.
            2.  Sử dụng các thẻ lệnh [TAG] để cập nhật trạng thái game.
            3.  Kết thúc bằng 4 lựa chọn hành động mới cho người chơi.
        `;

        const { story, choices, tags } = await callGeminiAPI(prompt, userApiKey);

        let summaryText = '';
        if (currentState.turn > 0 && (currentState.turn + 1) % 5 === 0) {
            const combinedTextForSummary = currentState.storyLog.slice(-4).map(e => e.text).join(' ') + ' ' + story;
            summaryText = await generateSummary(combinedTextForSummary, userApiKey);
        }

        setGameState(prevState => {
            const baseState = stateToUse || prevState;
            if (!baseState) return null;
            let workingState = JSON.parse(JSON.stringify(baseState));
            const isSystemAction = action.startsWith('[Hành động hệ thống]');
            if (!isSystemAction) {
                const userEntry: StoryEntry = { id: Date.now(), type: 'player', text: action };
                workingState.storyLog.push(userEntry);
            }
            let newState = applyTagsToState(tags, workingState);
            const textAndChoices = story + ' ' + choices.join(' ');
            const { newState: discoveredState, discovered } = discoverEntitiesFromText(textAndChoices, newState);
            newState = discoveredState;
            const discoveryMessages: StoryEntry[] = discovered.map(d => ({
                id: Date.now() + Math.random(),
                type: 'system',
                text: `[Hệ thống] Bạn đã có dữ liệu về ${d.type}: ${d.name}`
            }));
            const aiEntry: StoryEntry = { id: Date.now() + 1, type: 'ai', text: story, tags };
            newState.storyLog.push(aiEntry, ...discoveryMessages);
            newState.currentChoices = choices;
            newState.turn += 1;
            if (summaryText) {
                const newSummaryEntry: StorySummaryEntry = { id: Date.now() + 1, turn: newState.turn, summary: summaryText };
                newState.storySummaries = [newSummaryEntry, ...newState.storySummaries];
            }
            return newState;
        });
        setIsLoading(false);
    }, [gameState, userApiKey]);

    const handlePlayerAction = useCallback((action: string, sourceType: 'choice' | 'custom') => {
        if (isLoading || !gameState) return;
        processPlayerAction(action);
    }, [isLoading, gameState, processPlayerAction]);

        // --- ITEM & EQUIPMENT HANDLERS ---
    const handleUseItem = useCallback((item: Item, quantity: number) => {
        const currentState = gameState;
        if (!currentState || isLoading) return;

        let newState = JSON.parse(JSON.stringify(currentState));
        const itemIndex = newState.inventory.findIndex((i: Item) => i.id === item.id);

        if (itemIndex === -1 || newState.inventory[itemIndex].quantity < quantity) {
            setPopupMessage({ title: 'Lỗi', content: `Không thể sử dụng ${item.name}. Không đủ số lượng.` });
            return;
        }

        const itemToUse = newState.inventory[itemIndex];
        let totalStatsApplied: Partial<Stats> = {};

        for (let i = 0; i < quantity; i++) {
            if (itemToUse.stats && (!itemToUse.duration || itemToUse.duration <= 0)) {
                Object.entries(itemToUse.stats).forEach(([key, value]) => {
                    const statKey = key as keyof Stats;
                    const currentValue = newState.character.stats[statKey] as number | undefined;
                    if (typeof value === 'number' && typeof currentValue === 'number') {
                        (newState.character.stats[statKey] as number) += value;
                        totalStatsApplied[statKey] = (totalStatsApplied[statKey] || 0) + value;
                    }
                });
            }
            if (itemToUse.stats && itemToUse.duration && itemToUse.duration > 0) {
                const existingEffectIndex = newState.character.activeEffects.findIndex((e: ActiveEffect) => e.source === itemToUse.name);
                if (existingEffectIndex > -1) {
                    newState.character.activeEffects[existingEffectIndex].duration = itemToUse.duration;
                } else {
                    newState.character.activeEffects.push({
                        name: `Hiệu ứng: ${itemToUse.name}`,
                        source: itemToUse.name,
                        description: itemToUse.description || `Hiệu ứng từ ${itemToUse.name}`,
                        duration: itemToUse.duration,
                        stats: itemToUse.stats,
                    });
                }
                if (i === 0) {
                    totalStatsApplied = { ...totalStatsApplied, ...itemToUse.stats };
                }
            }
        }

        itemToUse.quantity -= quantity;
        if (itemToUse.quantity <= 0) {
            newState.inventory.splice(itemIndex, 1);
        }

        newState.storyLog.push({ id: Date.now(), type: 'system', text: `[Hệ thống] Bạn đã sử dụng ${quantity} x ${item.name}.` });
        if (Object.keys(totalStatsApplied).length > 0) {
            const statsLog = Object.entries(totalStatsApplied)
                .map(([key, value]) => {
                    if (value === 0 || value === null || value === undefined) return null;
                    const label = STAT_METADATA[key as keyof Stats]?.label || key;
                    return `${label} ${Number(value) > 0 ? '+' : ''}${value}`;
                })
                .filter(Boolean)
                .join(', ');
            if (statsLog) {
                newState.storyLog.push({ id: Date.now() + 1, type: 'system', text: `[Hệ thống] ${statsLog}.` });
            }
        }

        newState = postProcessGameState(newState);

        setPopupMessage({ title: 'Vật phẩm đã dùng', content: `Bạn đã sử dụng ${quantity} x ${item.name}.` });
        setActiveView({ type: ActiveView.Story });

        let effectsDescription = '';
        if (item.stats && Object.keys(item.stats).length > 0) {
            effectsDescription = `Hiệu ứng: ${formatStatsForAI(item.stats)}.`;
        }
        if (item.duration) {
            effectsDescription += ` Kéo dài trong ${item.duration} lượt.`;
        }
        const actionText = `[Hành động hệ thống] Người chơi vừa sử dụng ${quantity} x "${item.name}". ${effectsDescription}. Hãy mô tả lại hành động này và những gì xảy ra tiếp theo. Không cần dùng tag [ITEM_USED] hay [STATS_UPDATE] nữa vì hệ thống đã tự xử lý.`;

        processPlayerAction(actionText, newState);

    }, [gameState, isLoading, processPlayerAction]);

    const handleDropItem = useCallback((item: Item, quantity: number) => {
        if (!gameState) return;

        const currentItem = gameState.inventory.find(i => i.id === item.id);
        if (!currentItem) return;

        const dropAmount = Math.min(quantity, currentItem.quantity);

        setGameState(prevState => {
            if (!prevState) return null;
            const newState = JSON.parse(JSON.stringify(prevState));
            const itemIndex = newState.inventory.findIndex((i: Item) => i.id === item.id);
            if (itemIndex === -1) return newState;

            const invItem = newState.inventory[itemIndex];
            invItem.quantity -= dropAmount;

            if (invItem.quantity <= 0) {
                newState.inventory.splice(itemIndex, 1);
            }

            newState.storyLog.push({ id: Date.now(), type: 'system', text: `[Hệ thống] Bạn đã vứt bỏ ${dropAmount} x ${item.name}.` });
            return newState;
        });

        setPopupMessage({ title: 'Vật phẩm đã vứt', content: `Bạn đã vứt bỏ ${dropAmount} x ${item.name}.` });
        setActiveView({ type: ActiveView.Story });
    }, [gameState]);

    const handleRenameItem = (itemId: number, newName: string) => {
        setGameState(prevState => {
            if (!prevState) return null;
            const newInventory = prevState.inventory.map(item =>
                item.id === itemId ? { ...item, name: newName } : item
            );
            return { ...prevState, inventory: newInventory };
        });
    };

    const handleEquipItem = useCallback((item: Item) => {
        if (!gameState || !item.equipmentDetails) return;

        if (item.requiredLevel && gameState.character.stats.level < item.requiredLevel) {
            setPopupMessage({ title: 'Không thể trang bị', content: `Cảnh giới không đủ để trang bị ${item.name}.` });
            return;
        }

        setGameState(prevState => {
            if (!prevState) return null;
            let newState = JSON.parse(JSON.stringify(prevState));

            const itemToEquip = item;
            const targetSlotName = itemToEquip.equipmentDetails!.position;

            const targetSlot = newState.equipment.find((s: Equipment) => s.slot === targetSlotName);
            if (!targetSlot) return newState;

            const itemIndexInInventory = newState.inventory.findIndex((i: Item) => i.id === itemToEquip.id);
            if (itemIndexInInventory === -1) return newState;

            if (targetSlot.item) {
                const oldItem = targetSlot.item;
                const existingInInventory = newState.inventory.find((i: Item) => i.name === oldItem.name);
                if (existingInInventory) {
                    existingInInventory.quantity += 1;
                } else {
                    newState.inventory.push({ ...oldItem, quantity: 1 });
                }
            }

            targetSlot.item = { ...itemToEquip, quantity: 1 };

            const invItem = newState.inventory[itemIndexInInventory];
            if (invItem.quantity > 1) {
                invItem.quantity -= 1;
            } else {
                newState.inventory.splice(itemIndexInInventory, 1);
            }

            newState.storyLog.push({ id: Date.now(), type: 'system', text: `[Hệ thống] Bạn đã trang bị ${itemToEquip.name}.` });

            return postProcessGameState(newState);
        });

        setPopupMessage({ title: 'Trang bị', content: `Bạn đã trang bị ${item.name}.` });
        setActiveView({ type: ActiveView.Story });
    }, [gameState]);

    const handleUnequipItem = useCallback((slot: EquipmentSlot) => {
        if (!gameState) return;

        const targetSlot = gameState.equipment.find((s: Equipment) => s.slot === slot);
        const itemName = targetSlot?.item?.name;

        if (!itemName) return;

        setGameState(prevState => {
            if (!prevState) return null;
            let newState = JSON.parse(JSON.stringify(prevState));
            const targetSlotInState = newState.equipment.find((s: Equipment) => s.slot === slot);
            if (!targetSlotInState || !targetSlotInState.item) return newState;

            const itemToUnequip = targetSlotInState.item;

            const existingInInventory = newState.inventory.find((i: Item) => i.name === itemToUnequip.name);
            if (existingInInventory) {
                existingInInventory.quantity += 1;
            } else {
                newState.inventory.push({ ...itemToUnequip, quantity: 1 });
            }

            targetSlotInState.item = null;

            newState.storyLog.push({ id: Date.now(), type: 'system', text: `[Hệ thống] Bạn đã tháo ${itemToUnequip.name}.` });

            return postProcessGameState(newState);
        });

        setPopupMessage({ title: 'Tháo trang bị', content: `Bạn đã tháo ${itemName}.` });
        setActiveView({ type: ActiveView.Story });
    }, [gameState]);


       // --- TOOLTIP HANDLERS ---
    const handleShowTooltip = useCallback((type: EntityType, entityName: string, position: { x: number; y: number; }) => {
        if (!gameState) return;
        let entity: any = null;

        const findEntity = (collection: any[], nameKey: string, name: string) =>
            collection.find(e => e[nameKey].toLowerCase() === name.toLowerCase());

        switch (type) {
            case 'npc':
                entity = findEntity(gameState.npcs, 'name', entityName);
                break;
            case 'item':
            case 'equipment':
                entity = findEntity(gameState.knowledgeBase.items, 'name', entityName);
                break;
            case 'skill':
                entity = findEntity(gameState.character.skills, 'name', entityName);
                break;
            case 'location':
                entity = findEntity(gameState.locations, 'name', entityName);
                break;
            case 'faction':
                entity = findEntity(gameState.factions, 'name', entityName);
                break;
            case 'lore':
                entity = findEntity(gameState.lore, 'title', entityName);
                break;
            case 'quest':
                entity = findEntity(gameState.quests, 'title', entityName);
                break;
        }

        if (entity) {
            const tooltipWidth = 320;
            const tooltipHeight = 250;
            const newPos = {
                left: position.x + tooltipWidth > window.innerWidth ? position.x - tooltipWidth - 10 : position.x + 10,
                top: position.y + tooltipHeight > window.innerHeight ? position.y - tooltipHeight - 10 : position.y + 10,
            };
            setTooltipState({ type, entity, position: newPos });
        }
    }, [gameState]);

    const handleCloseTooltip = useCallback(() => {
        setTooltipState(null);
    }, []);

    // --- QUEST HANDLERS ---
    const handleAcceptQuest = useCallback((questId: number) => {
        setGameState(prevState => {
            if (!prevState) return null;
            const newQuests = prevState.quests.map((q): Quest => {
                if (q.id === questId) {
                    return { ...q, status: 'Đã nhận' };
                }
                return q;
            });
            return { ...prevState, quests: newQuests };
        });
    }, []);

    const handleDeclineQuest = useCallback((questId: number) => {
        setGameState(prevState => {
            if (!prevState) return null;
            const newQuests = prevState.quests.filter(q => q.id !== questId);
            return { ...prevState, quests: newQuests };
        });
    }, []);

    const handleAcceptNewQuest = useCallback((questId: number) => {
        handleAcceptQuest(questId);
        setNewQuestNotification(null);
    }, [handleAcceptQuest]);

    const handleDeclineNewQuest = useCallback((questId: number) => {
        handleDeclineQuest(questId);
        setNewQuestNotification(null);
    }, [handleDeclineQuest]);

    const handleIgnoreNewQuest = useCallback(() => {
        setNewQuestNotification(null);
    }, []);

    // --- JOURNAL, CORE MEMORY, LOCATION, SUMMARY HANDLERS ---
    const handleUpdateHeavenlyRules = (rules: string[]) => {
        setGameState(prevState => prevState ? { ...prevState, heavenlyRules: rules } : null);
    };
    const handleUpdateCoreMemory = (rules: string[]) => {
        setGameState(prevState => prevState ? { ...prevState, coreMemory: rules } : null);
    };
    const handleUpdateStorySummary = (summaryId: number, newSummary: string) => {
        setGameState(prevState => {
            if (!prevState) return null;
            const newSummaries = prevState.storySummaries.map(s => s.id === summaryId ? { ...s, summary: newSummary } : s);
            return { ...prevState, storySummaries: newSummaries };
        });
    };
    const handleDeleteStorySummary = (summaryId: number) => {
        setGameState(prevState => {
            if (!prevState) return null;
            const newSummaries = prevState.storySummaries.filter(s => s.id !== summaryId);
            return { ...prevState, storySummaries: newSummaries };
        });
    };
    const handleUpdateLocation = (location: Location) => {
        setGameState(prevState => {
            if (!prevState) return null;
            const newLocations = prevState.locations.map(l => l.id === location.id ? location : l);
            return { ...prevState, locations: newLocations };
        });
    };
    const handleDeleteLocation = (locationId: number) => {
        setGameState(prevState => {
            if (!prevState) return null;
            const newLocations = prevState.locations.filter(l => l.id !== locationId);
            return { ...prevState, locations: newLocations };
        });
    };

    // --- ADD TO KNOWLEDGE BASE ---
    const addItemToKnowledgeBase = (itemToAdd: Item, state: GameState) => {
        const qualityLabel = Object.values(QualityLabels).find(label => itemToAdd.name.startsWith(label + ' '));
        let baseName = itemToAdd.name;
        if (qualityLabel) {
            baseName = itemToAdd.name.substring(qualityLabel.length).trim();
        }
        const existingItemIndex = state.knowledgeBase.items.findIndex(i => i.name.toLowerCase() === baseName.toLowerCase());
        if (existingItemIndex === -1) {
            const cleanItem: Item = {
                ...JSON.parse(JSON.stringify(itemToAdd)),
                name: baseName,
                quantity: 1,
            };
            state.knowledgeBase.items.push(cleanItem);
            state.knowledgeBase.items.sort((a, b) => a.name.localeCompare(b.name));
        }
    };

    return (
        <AppUI
            gameState={gameState}
            currentScreen={currentScreen}
            isLoading={isLoading}
            activeView={activeView}
            tooltipState={tooltipState}
            popupMessage={popupMessage}
            confirmation={confirmation}
            newQuestNotification={newQuestNotification}
            onNewGame={handleNewGame}
            onLoadGame={handleLoadGame}
            onSaveGame={handleSaveGame}
            onExitToMenu={handleExitToMenu}
            onShowPopup={(title, content) => setPopupMessage({ title, content })}
            onShowTooltip={handleShowTooltip}
            onCloseTooltip={handleCloseTooltip}
            onGameStart={handleGameStart}
            onPlayerAction={handlePlayerAction}
            onUseItem={handleUseItem}
            onDropItem={handleDropItem}
            onRenameItem={handleRenameItem}
            onEquipItem={handleEquipItem}
            onUnequipItem={handleUnequipItem}
            onAcceptQuest={handleAcceptQuest}
            onDeclineQuest={handleDeclineQuest}
            onAcceptNewQuest={handleAcceptNewQuest}
            onDeclineNewQuest={handleDeclineNewQuest}
            onIgnoreNewQuest={handleIgnoreNewQuest}
            onSetActiveView={setActiveView}
            setPopupMessage={setPopupMessage}
            setConfirmation={setConfirmation}
            onUpdateHeavenlyRules={handleUpdateHeavenlyRules}
            onUpdateCoreMemory={handleUpdateCoreMemory}
            onUpdateStorySummary={handleUpdateStorySummary}
            onDeleteStorySummary={handleDeleteStorySummary}
            onUpdateLocation={handleUpdateLocation}
            onDeleteLocation={handleDeleteLocation}
            hasStoryStarted={hasStoryStarted}
            onStartStory={handleStartInitialStory}
            userApiKey={userApiKey}
            onSaveUserApiKey={handleSaveUserApiKey}
        />
    );
};

export default AppLogic;
