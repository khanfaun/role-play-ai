import React, { useState, useCallback, ChangeEvent, useRef, useMemo } from 'react';
import { GameSetupData, Character, World, InitialSkill, InitialItem, InitialNPC, InitialLore, InitialLocation, InitialFaction, InitialAddons, SourceMaterialAnalysis, AIWorldGenerationResponse, Stats, Rarity, RarityLabels, ItemType, ItemTypeLabels, EquipmentItemType, RegularItemTypeKeys, EquipmentSlot, RegularItemType, ItemTypeEmojis, QualityLabels, EQUIPMENT_TYPE_TO_SLOT_MAP, EQUIPMENT_SLOT_TO_TYPE_MAP } from '../types';
import { generatePrimaryStory, generateInitialGameElements } from '../services/aiSetupService';
import Button from './shared/Button';
import Spinner from './shared/Spinner';
import { STAT_METADATA } from './shared/statUtils';
import { generateRealmLevelOptions } from '../services/realmService';

const DEFAULT_REALM_SYSTEM = "Phàm Nhân - Luyện Khí - Trúc Cơ - Kim Đan - Nguyên Anh - Hóa Thần - Luyện Hư - Hợp Thể - Đại Thừa - Độ Kiếp";
type ActiveTab = 'ai_support' | 'world_setup' | 'character_story' | 'initial_elements';

// --- Reusable Form Components ---
const InputField: React.FC<{
    label: string,
    value: string | number,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void,
    placeholder: string,
    type?: string,
    disabled?: boolean,
    name?: string,
    onBlur?: () => void,
    className?: string,
    preIcon?: React.ReactNode
}> = ({ label, value, onChange, placeholder, type = 'text', disabled = false, name, onBlur, className, preIcon }) => (
    <div className={`form-field ${className || ''}`}>
        <label htmlFor={name}>{label}</label>
        <div className={`input-wrapper ${preIcon ? 'has-icon' : ''}`}>
            {preIcon && <span className="field-icon">{preIcon}</span>}
            <input id={name} type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className="form-input" name={name} onBlur={onBlur} />
        </div>
    </div>
);

const TextAreaField: React.FC<{ label: string, value: string, onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void, placeholder: string, rows?: number, disabled?: boolean, name?: string }> = 
    ({ label, value, onChange, placeholder, rows = 3, disabled = false, name }) => (
    <div className="form-field">
        <label htmlFor={name}>{label}</label>
        <textarea id={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows} disabled={disabled} className="form-textarea" name={name} />
    </div>
);

const SelectField: React.FC<{ label: string, value: string | number, onChange: (e: ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode, name?: string, disabled?: boolean }> =
    ({ label, value, onChange, children, name, disabled = false }) => (
    <div className="form-field">
        <label htmlFor={name}>{label}</label>
        <select id={name} value={value} onChange={onChange} disabled={disabled} className="form-select" name={name}>{children}</select>
    </div>
);

const CheckboxField: React.FC<{ label: string, checked: boolean, onChange: (e: ChangeEvent<HTMLInputElement>) => void, name: string, disabled?: boolean }> =
    ({ label, checked, onChange, name, disabled = false }) => (
    <div className="form-field-checkbox">
        <input type="checkbox" id={name} checked={checked} onChange={onChange} className="form-checkbox" name={name} disabled={disabled} />
        <label htmlFor={name}>{label}</label>
    </div>
);

const StatInputGroup: React.FC<{ stats: Partial<Stats>, onStatChange: (key: keyof Stats, value: string) => void, prefix: string, isEquipment?: boolean, allowedStats?: (keyof Stats)[] }> = ({ stats, onStatChange, prefix, isEquipment = false, allowedStats }) => {
  const allStats: (keyof Stats)[] = [
    'hp', 'maxHp', 'mp', 'maxMp', 'stamina', 'maxStamina',
    'atk', 'def', 'spd', 'magicPower', 'burstPower', 'constitution', 'killingIntent', 'expr'
  ];

  let statOrder = allowedStats || allStats;

  if (isEquipment) {
    statOrder = statOrder.filter(key => !['hp', 'mp', 'stamina'].includes(key));
  }
  return (
    <div className="stat-input-group">
      {statOrder.map(key => {
        let isDisabled = false;
        if (!isEquipment) {
            if (key === 'hp' && (stats.maxHp ?? 0) !== 0) isDisabled = true;
            if (key === 'mp' && (stats.maxMp ?? 0) !== 0) isDisabled = true;
            if (key === 'stamina' && (stats.maxStamina ?? 0) !== 0) isDisabled = true;
        }
        return (
            <InputField
              key={`${prefix}-${key}`}
              label={STAT_METADATA[key]?.label || key.toUpperCase()}
              type="number" name={`${prefix}-${key}`}
              value={stats?.[key] ?? ''}
              onChange={(e) => onStatChange(key, e.target.value)}
              placeholder="0" disabled={isDisabled}
            />
        );
      })}
    </div>
  );
};

const AccordionItem: React.FC<{
    title: string;
    count: number;
    children: React.ReactNode;
    name: string;
    isOpen: boolean;
    onToggle: (name: string) => void;
}> = ({ title, count, children, name, isOpen, onToggle }) => {
    return (
        <div className="accordion-item">
            <button
                className="accordion-header"
                onClick={() => onToggle(name)}
                aria-expanded={isOpen}
                aria-controls={`accordion-content-${name}`}
            >
                <span className="accordion-title">{title} ({count})</span>
                <span className={`accordion-icon ${isOpen ? 'open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>
            {isOpen && (
                <div id={`accordion-content-${name}`} className="accordion-content">
                    {children}
                </div>
            )}
        </div>
    );
};

const getInitialGameSetupData = (): GameSetupData => ({
    world: {
        setting: 'Lục địa tu tiên Huyền Thiên',
        style: 'Tiên hiệp',
        realmSystem: DEFAULT_REALM_SYSTEM.split(' - '),
        currencies: ['Linh thạch'],
        difficulty: 'Bình thường',
    },
    character: {
        name: 'Mặc Vô Trần',
        gender: 'Nam',
        background: 'Một thiếu niên bình thường ở một ngôi làng hẻo lánh, tình cờ nhặt được một pháp bảo bí ẩn.',
        goal: 'Trở thành cường giả mạnh nhất, khám phá bí mật của pháp bảo.',
        age: 16,
        lifespan: 100,
        startingRealm: 'Phàm Nhân',
    },
    initialAddons: {
        skills: [], items: [], npcs: [], lore: [], locations: [], factions: []
    },
    aiSupport: {
        genMode: 'original',
        authorName: '',
        originalStoryIdea: '',
        originalNsfw: false,
        fanficSourceTitle: '',
        fanficSourceAuthor: '',
        fanficUserIdea: '',
        fanficSummary: '',
        fanficNsfw: false,
    },
    initialCoreMemory: ['', '', ''],
});

interface SetupScreenProps {
  onGameStart: (setupData: GameSetupData) => void;
  isLoading: boolean;
  onExitToMenu: () => void;
  onShowPopup: (title: string, content: string) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onGameStart, isLoading, onExitToMenu, onShowPopup }) => {
    const [gameSetupData, setGameSetupData] = useState<GameSetupData>(getInitialGameSetupData());
    const [activeTab, setActiveTab] = useState<ActiveTab>('ai_support');
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    
    const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
        skills: true, items: false, npcs: false, lore: false, locations: false, factions: false,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const realmLevelOptions = useMemo(
        () => generateRealmLevelOptions(gameSetupData.world.realmSystem),
        [gameSetupData.world.realmSystem]
    );

    const handleAccordionToggle = (name: string) => {
        setOpenAccordions(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
    };

    const handleWorldChange = useCallback((field: keyof World | 'realmSystemString', value: any) => {
        setGameSetupData(prev => {
            if (field === 'realmSystemString') {
                return { ...prev, world: { ...prev.world, realmSystem: value.split(/[-–—,]/).map((s: string) => s.trim()).filter(Boolean) } };
            }
            return { ...prev, world: { ...prev.world, [field]: value } };
        });
    }, []);

    const handleAddCurrency = () => {
        setGameSetupData(prev => ({
            ...prev,
            world: {
                ...prev.world,
                currencies: [...prev.world.currencies, '']
            }
        }));
    };
    const handleCurrencyChange = (index: number, value: string) => {
        const newCurrencies = [...gameSetupData.world.currencies];
        newCurrencies[index] = value;
        setGameSetupData(prev => ({ ...prev, world: { ...prev.world, currencies: newCurrencies } }));
    };

    const handleRemoveCurrency = (index: number) => {
        setGameSetupData(prev => ({
            ...prev,
            world: { ...prev.world, currencies: prev.world.currencies.filter((_, i) => i !== index) }
        }));
    };

    const handleCharacterChange = useCallback((field: keyof Character | 'startingRealm', value: any) => {
        setGameSetupData(prev => ({ ...prev, character: { ...prev.character, [field]: value } }));
    }, []);

    const handleAISupportChange = (field: keyof GameSetupData['aiSupport'], value: any) => {
        setGameSetupData(prev => ({ ...prev, aiSupport: { ...prev.aiSupport, [field]: value } }));
    };

    const handleCoreMemoryChange = (index: number, value: string) => {
        const newMemory = [...gameSetupData.initialCoreMemory];
        newMemory[index] = value;
        setGameSetupData(prev => ({ ...prev, initialCoreMemory: newMemory }));
    };
    const handleAddCoreMemory = () => {
        setGameSetupData(prev => ({ ...prev, initialCoreMemory: [...prev.initialCoreMemory, ''] }));
    };
    const handleRemoveCoreMemory = (index: number) => {
        setGameSetupData(prev => ({ ...prev, initialCoreMemory: prev.initialCoreMemory.filter((_, i) => i !== index) }));
    };

    const handleAddInitialAddon = <T extends keyof InitialAddons>(type: T, newItem: InitialAddons[T][number]) => {
        setGameSetupData(prev => ({
            ...prev,
            initialAddons: {
                ...prev.initialAddons,
                [type]: [...prev.initialAddons[type], newItem]
            }
        }));
    };
    const handleRemoveInitialAddon = <T extends keyof InitialAddons>(type: T, index: number) => {
        setGameSetupData(prev => ({
            ...prev,
            initialAddons: {
                ...prev.initialAddons,
                [type]: (prev.initialAddons[type] as any[]).filter((_, i) => i !== index)
            }
        }));
    };

    const handleInitialSkillChange = (index: number, field: keyof InitialSkill, value: string) => {
        const newSkills = [...gameSetupData.initialAddons.skills];
        newSkills[index] = { ...newSkills[index], [field]: value };
        setGameSetupData(prev => ({ ...prev, initialAddons: { ...prev.initialAddons, skills: newSkills } }));
    };
    
    const handleInitialItemChange = (index: number, field: keyof InitialItem, value: any) => {
        const newItems = [...gameSetupData.initialAddons.items];
        let updatedItem = { ...newItems[index], [field]: value };
        const equipmentDetails = updatedItem.equipmentDetails || { position: 'Vũ khí', stats: {}, effects: '' };

        if (field === 'itemType' && value === 'Trang bị') {
            updatedItem.type = 'weapon'; // Default to weapon when switching to equipment
            equipmentDetails.position = EQUIPMENT_TYPE_TO_SLOT_MAP['weapon'];
            updatedItem.equipmentDetails = equipmentDetails;
        } else if (field === 'itemType' && value !== 'Trang bị') {
            updatedItem.isEquippedAtStart = false; // Cannot equip non-equipment
        }
        
        // When TYPE (e.g., 'weapon') changes, update POSITION (e.g., 'Vũ khí')
        if (field === 'type' && updatedItem.itemType === 'Trang bị') {
            const newPos = EQUIPMENT_TYPE_TO_SLOT_MAP[value as EquipmentItemType];
            if (newPos) {
                 equipmentDetails.position = newPos;
                 updatedItem.equipmentDetails = equipmentDetails;
            }
        }
        
        newItems[index] = updatedItem;
        setGameSetupData(prev => ({ ...prev, initialAddons: { ...prev.initialAddons, items: newItems } }));
    };
    
    const handleInitialItemStatChange = (itemIndex: number, statKey: keyof Stats, statValue: string, isEquipment: boolean) => {
        const newItems = [...gameSetupData.initialAddons.items];
        const item = newItems[itemIndex];
        const numericValue = statValue === '' ? undefined : Number(statValue);
        
        if(isEquipment) {
            item.equipmentDetails = {
                ...item.equipmentDetails,
                position: item.equipmentDetails?.position || 'Vũ khí',
                effects: item.equipmentDetails?.effects || '',
                stats: {
                    ...item.equipmentDetails?.stats,
                    [statKey]: numericValue,
                }
            }
        } else {
            item.stats = { ...item.stats, [statKey]: numericValue };
        }
        
        setGameSetupData(prev => ({ ...prev, initialAddons: { ...prev.initialAddons, items: newItems } }));
    };
    
    const handleInitialNPCChange = (index: number, field: keyof InitialNPC, value: any) => {
        const newNPCs = [...gameSetupData.initialAddons.npcs];
        newNPCs[index] = { ...newNPCs[index], [field]: value };
        setGameSetupData(prev => ({ ...prev, initialAddons: { ...prev.initialAddons, npcs: newNPCs } }));
    };
    
    const handleInitialLoreChange = (index: number, field: keyof InitialLore, value: string) => {
        const newLore = [...gameSetupData.initialAddons.lore];
        newLore[index] = { ...newLore[index], [field]: value };
        setGameSetupData(prev => ({ ...prev, initialAddons: { ...prev.initialAddons, lore: newLore } }));
    };

    const handleInitialLocationChange = (index: number, field: keyof InitialLocation, value: any) => {
        const newLocations = [...gameSetupData.initialAddons.locations];
        newLocations[index] = { ...newLocations[index], [field]: value };
        setGameSetupData(prev => ({ ...prev, initialAddons: { ...prev.initialAddons, locations: newLocations } }));
    };
    
    const handleInitialFactionChange = (index: number, field: keyof InitialFaction, value: any) => {
        const newFactions = [...gameSetupData.initialAddons.factions];
        newFactions[index] = { ...newFactions[index], [field]: value };
        setGameSetupData(prev => ({ ...prev, initialAddons: { ...prev.initialAddons, factions: newFactions } }));
    };

    const handleGeneratePrimaryStory = async () => {
        setIsLoadingAI(true);
        try {
            const primaryData: Pick<GameSetupData, 'aiSupport' | 'character' | 'world'> = {
                aiSupport: gameSetupData.aiSupport,
                character: gameSetupData.character,
                world: gameSetupData.world,
            };
            const { analysisData, worldDetails } = await generatePrimaryStory(primaryData);

            if (worldDetails) {
                setGameSetupData(prev => ({
                    ...prev,
                    world: { ...prev.world, ...worldDetails.world, realmSystem: worldDetails.world.realmSystem.split(/[-–—,]/).map(s => s.trim()).filter(Boolean) },
                    character: { ...prev.character, ...worldDetails.character },
                    aiSupport: {
                        ...prev.aiSupport,
                        originalStoryIdea: worldDetails.generatedOriginalStoryIdea || prev.aiSupport.originalStoryIdea,
                        fanficUserIdea: worldDetails.generatedFanficIdea || prev.aiSupport.fanficUserIdea,
                    },
                    initialCoreMemory: worldDetails.initialCoreMemory || prev.initialCoreMemory,
                }));
            }
            if (analysisData) {
                 const formattedSummary = `
TÓM TẮT:
${analysisData.summary}

HỆ THỐNG CẢNH GIỚI:
${analysisData.realmSystem.map(r => `- ${r.name}: ${r.lifespanIncrease}`).join('\n')}

CÁC ARC TRUYỆN CHÍNH:
${analysisData.majorArcs.map(a => `- ${a.title}: ${a.summary}`).join('\n')}

NHÂN VẬT CHỦ CHỐT:
${analysisData.keyNpcs.map(n => `- ${n.name} (${n.gender}, ${n.realm}):\n  Tính cách: ${n.personality}\n  Tiểu sử: ${n.bio}`).join('\n\n')}

KỸ NĂNG/CÔNG PHÁP CHỦ CHỐT:
${analysisData.keySkills.map(s => `- ${s.name}: ${s.description}`).join('\n')}

VẬT PHẨM/PHÁP BẢO CHỦ CHỐT:
${analysisData.keyItems.map(i => `- ${i.name}: ${i.description}`).join('\n')}

ĐỊA DANH CHỦ CHỐT:
${analysisData.keyLocations.map(l => `- ${l.name}: ${l.description}`).join('\n')}

PHE PHÁI CHỦ CHỐT:
${analysisData.keyFactions.map(f => `- ${f.name}: ${f.description}`).join('\n')}

TRI THỨC (LORE) CHỦ CHỐT:
${analysisData.keyLore.map(l => `- ${l.title}: ${l.content}`).join('\n')}
                `.trim();
                setGameSetupData(prev => ({ ...prev, aiSupport: { ...prev.aiSupport, fanficSummary: formattedSummary }}));
            }
            setActiveTab('world_setup');
            onShowPopup('Thành Công', 'AI đã tạo thành công các chi tiết chính của thế giới và nhân vật!');
        } catch (error) {
            console.error(error);
            onShowPopup('Lỗi AI', error instanceof Error ? error.message : 'Đã có lỗi xảy ra.');
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleGenerateInitialElements = async () => {
        setIsLoadingAI(true);
        try {
            const dataForAddons: Pick<GameSetupData, 'world' | 'character' | 'aiSupport'> = {
                world: gameSetupData.world,
                character: gameSetupData.character,
                aiSupport: gameSetupData.aiSupport,
            };
            const result = await generateInitialGameElements(dataForAddons);
            if (result) {
                setGameSetupData(prev => ({
                    ...prev,
                    initialAddons: {
                        skills: result.initialAddons.skills.map((s, i) => ({ ...s, id: i })),
                        items: result.initialAddons.items.map((item, i) => ({ ...item, id: i })),
                        npcs: result.initialAddons.npcs.map((n, i) => ({ ...n, id: i })),
                        lore: result.initialAddons.lore.map((l, i) => ({ ...l, id: i })),
                        locations: result.initialAddons.locations.map((l, i) => ({ ...l, id: i })),
                        factions: result.initialAddons.factions.map((f, i) => ({ ...f, id: i })),
                    }
                }));
                 onShowPopup('Thành Công', 'AI đã tạo thành công các yếu tố khởi đầu!');
            }
        } catch (error) {
            console.error(error);
            onShowPopup('Lỗi AI', error instanceof Error ? error.message : 'Đã có lỗi xảy ra.');
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleSaveSetup = () => {
        try {
            const setupString = JSON.stringify(gameSetupData, null, 2);
            const blob = new Blob([setupString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `rpa-setup-${gameSetupData.character.name.replace(/\s+/g, '_')}.json`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            onShowPopup('Lưu Thành Công', `Thiết lập đã được lưu với tên:\n${link.download}`);
        } catch (error) {
            console.error("Error saving setup:", error);
            onShowPopup('Lỗi Lưu', 'Đã có lỗi xảy ra khi lưu thiết lập.');
        }
    };

    const handleLoadSetup = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                if (!text) throw new Error("File rỗng.");
                const loadedData = JSON.parse(text);

                if (!loadedData.world || !loadedData.character || !loadedData.initialAddons) {
                    throw new Error("File không hợp lệ. Đây có vẻ là file save game, không phải file thiết lập. Vui lòng sử dụng chức năng 'Tải Game' ở menu chính.");
                }

                setGameSetupData(loadedData);
                onShowPopup('Thành Công', 'Tải thiết lập thành công!');
            } catch (error) {
                console.error("Error loading setup:", error);
                 const errorMessage = error instanceof Error ? error.message : "Không thể tải file. File có thể bị lỗi hoặc không đúng định dạng.";
                onShowPopup('Lỗi Tải Thiết Lập', errorMessage);
            } finally {
                 if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const isStartDisabled = isLoading || isLoadingAI;

    return (
        <div className="setup-screen">
            <div className="setup-container">
                <header className="setup-header">
                    <button className="setup-back-button" onClick={onExitToMenu}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        Về Menu Chính
                    </button>
                    <h1>Kiến Tạo Cuộc Phiêu Lưu</h1>
                    <div className="setup-actions">
                        <Button variant="secondary" onClick={handleSaveSetup}>Lưu Thiết Lập</Button>
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                            Nhập Thiết Lập
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleLoadSetup} style={{ display: 'none' }} accept=".json" />
                        <Button variant="primary" className="start-game-btn" onClick={() => onGameStart(gameSetupData)} isLoading={isStartDisabled}>
                            Bắt Đầu
                        </Button>
                    </div>
                </header>

                <nav className="tab-nav">
                    <button className={`tab-button ${activeTab === 'ai_support' ? 'active' : ''}`} onClick={() => handleTabChange('ai_support')}>1. AI Hỗ Trợ</button>
                    <button className={`tab-button ${activeTab === 'world_setup' ? 'active' : ''}`} onClick={() => handleTabChange('world_setup')}>2. Thiết Lập Thế Giới</button>
                    <button className={`tab-button ${activeTab === 'character_story' ? 'active' : ''}`} onClick={() => handleTabChange('character_story')}>3. Nhân Vật & Cốt Truyện</button>
                    <button className={`tab-button ${activeTab === 'initial_elements' ? 'active' : ''}`} onClick={() => handleTabChange('initial_elements')}>4. Yếu Tố Khởi Đầu</button>
                </nav>

                <main className="tab-content">
                    {activeTab === 'ai_support' && (
                        <AISupportTab
                            aiSupport={gameSetupData.aiSupport}
                            onAISupportChange={handleAISupportChange}
                            onGenerate={handleGeneratePrimaryStory}
                            isLoadingAI={isLoadingAI}
                        />
                    )}
                    {activeTab === 'world_setup' && (
                         <WorldSetupTab
                            world={gameSetupData.world}
                            onWorldChange={handleWorldChange}
                            currencies={gameSetupData.world.currencies}
                            onAddCurrency={handleAddCurrency}
                            onCurrencyChange={handleCurrencyChange}
                            onRemoveCurrency={handleRemoveCurrency}
                            coreMemory={gameSetupData.initialCoreMemory}
                            onCoreMemoryChange={handleCoreMemoryChange}
                            onAddCoreMemory={handleAddCoreMemory}
                            onRemoveCoreMemory={handleRemoveCoreMemory}
                        />
                    )}
                    {activeTab === 'character_story' && (
                        <CharacterStoryTab
                            character={gameSetupData.character}
                            onCharacterChange={handleCharacterChange}
                            realmSystem={gameSetupData.world.realmSystem}
                        />
                    )}
                    {activeTab === 'initial_elements' && (
                       <InitialElementsTab
                            setupData={gameSetupData}
                            realmLevelOptions={realmLevelOptions}
                            onAddAddon={handleAddInitialAddon}
                            onRemoveAddon={handleRemoveInitialAddon}
                            onSkillChange={handleInitialSkillChange}
                            onItemChange={handleInitialItemChange}
                            onItemStatChange={handleInitialItemStatChange}
                            onNPCChange={handleInitialNPCChange}
                            onLoreChange={handleInitialLoreChange}
                            onLocationChange={handleInitialLocationChange}
                            onFactionChange={handleInitialFactionChange}
                            onGenerate={handleGenerateInitialElements}
                            isLoadingAI={isLoadingAI}
                            openAccordions={openAccordions}
                            onAccordionToggle={handleAccordionToggle}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

// --- TAB COMPONENTS ---

const AISupportTab: React.FC<{
    aiSupport: GameSetupData['aiSupport'],
    onAISupportChange: (field: keyof GameSetupData['aiSupport'], value: any) => void,
    onGenerate: () => void,
    isLoadingAI: boolean
}> = ({ aiSupport, onAISupportChange, onGenerate, isLoadingAI }) => {
    return (
        <div className="ai-support-tab">
            <InputField label="Phong cách tác giả (Tùy chọn)" value={aiSupport.authorName} onChange={e => onAISupportChange('authorName', e.target.value)} placeholder="Ví dụ: Ngã Cật Tây Hồng Thị, Thiên Tằm Thổ Đậu..." className="author-style-input" />

            <div className="ai-support-columns">
                <div className={`ai-option-box ${aiSupport.genMode === 'original' ? 'active' : ''} ${aiSupport.genMode !== 'original' ? 'disabled' : ''}`}>
                    <div className="ai-option-header">
                        <h4>Sáng tác truyện gốc</h4>
                        <input type="radio" name="genMode" value="original" checked={aiSupport.genMode === 'original'} onChange={e => onAISupportChange('genMode', e.target.value)} />
                    </div>
                    <div className="ai-option-content">
                        <TextAreaField label="Ý tưởng truyện (tùy chọn)" value={aiSupport.originalStoryIdea} onChange={e => onAISupportChange('originalStoryIdea', e.target.value)} placeholder="Nhập ý tưởng của bạn, hoặc để trống cho AI tự sáng tạo..." rows={4} disabled={aiSupport.genMode !== 'original'} />
                        <CheckboxField label="Bật nội dung NSFW (18+)" checked={aiSupport.originalNsfw} onChange={e => onAISupportChange('originalNsfw', e.target.checked)} name="originalNsfw" disabled={aiSupport.genMode !== 'original'} />
                    </div>
                </div>

                <div className={`ai-option-box ${aiSupport.genMode === 'fanfiction' ? 'active' : ''} ${aiSupport.genMode !== 'fanfiction' ? 'disabled' : ''}`}>
                    <div className="ai-option-header">
                        <h4>Sáng tác Đồng nhân (Fanfiction)</h4>
                        <input type="radio" name="genMode" value="fanfiction" checked={aiSupport.genMode === 'fanfiction'} onChange={e => onAISupportChange('genMode', e.target.value)} />
                    </div>
                    <div className="ai-option-content">
                        <InputField label="Tên truyện/tác phẩm gốc" value={aiSupport.fanficSourceTitle} onChange={e => onAISupportChange('fanficSourceTitle', e.target.value)} placeholder="Ví dụ: Phàm Nhân Tu Tiên" disabled={aiSupport.genMode !== 'fanfiction'} />
                        <InputField label="Tác giả truyện gốc (Tùy chọn)" value={aiSupport.fanficSourceAuthor} onChange={e => onAISupportChange('fanficSourceAuthor', e.target.value)} placeholder="Ví dụ: Vong Ngữ" disabled={aiSupport.genMode !== 'fanfiction'} />
                        <TextAreaField label="Ý tưởng đồng nhân" value={aiSupport.fanficUserIdea} onChange={e => onAISupportChange('fanficUserIdea', e.target.value)} placeholder="Ví dụ: Một nhân vật xuyên không mang theo hệ thống vào thế giới..." rows={2} disabled={aiSupport.genMode !== 'fanfiction'} />
                        <TextAreaField
                            label="Tóm tắt cốt truyện nguyên tác"
                            value={aiSupport.fanficSummary}
                            onChange={e => onAISupportChange('fanficSummary', e.target.value)}
                            placeholder="Dán tóm tắt truyện gốc vào đây để AI có ngữ cảnh tốt hơn. Nếu để trống, AI sẽ tự phân tích dựa vào tên truyện (nếu là truyện phổ biến)."
                            rows={10}
                            disabled={aiSupport.genMode !== 'fanfiction'}
                            name="fanficSummary"
                        />
                        <CheckboxField label="Bật nội dung NSFW (18+)" checked={aiSupport.fanficNsfw} onChange={e => onAISupportChange('fanficNsfw', e.target.checked)} name="fanficNsfw" disabled={aiSupport.genMode !== 'fanfiction'} />
                    </div>
                </div>
            </div>

            <Button variant="primary" onClick={onGenerate} isLoading={isLoadingAI} className="self-center">
                <span className="ai-button-icon">✨</span>
                Nhờ AI tạo chi tiết
            </Button>
        </div>
    );
};

const WorldSetupTab: React.FC<{
    world: GameSetupData['world'],
    onWorldChange: (field: keyof World | 'realmSystemString', value: any) => void,
    currencies: string[],
    onAddCurrency: () => void,
    onCurrencyChange: (index: number, value: string) => void,
    onRemoveCurrency: (index: number) => void,
    coreMemory: string[],
    onCoreMemoryChange: (index: number, value: string) => void,
    onAddCoreMemory: () => void,
    onRemoveCoreMemory: (index: number) => void
}> = ({ world, onWorldChange, currencies, onAddCurrency, onCurrencyChange, onRemoveCurrency, coreMemory, onCoreMemoryChange, onAddCoreMemory, onRemoveCoreMemory }) => {
    const coreMemoryPlaceholders = [
        "Ví dụ: Nhân vật chính bị nguyền rủa từ Thiên đạo",
        "Ví dụ: Mọi sinh vật mang huyết mạch rồng đều bị săn lùng",
        "Ví dụ: Cứ mỗi 100 năm, đại kiếp nạn sẽ giáng xuống Lục địa"
    ];
    return (
        <div className="form-field-grid">
            <fieldset className="setup-fieldset">
                <legend>Thông Tin Thế Giới</legend>
                <div className="fieldset-content">
                    <InputField label="Bối cảnh" name="setting" value={world.setting} onChange={e => onWorldChange('setting', e.target.value)} placeholder="Ví dụ: Lục địa Huyền Thiên" />
                    <InputField label="Phong cách" name="style" value={world.style} onChange={e => onWorldChange('style', e.target.value)} placeholder="Ví dụ: Tiên hiệp, Huyền huyễn" />
                    <TextAreaField label="Hệ thống Cảnh giới (phân cách bởi dấu -)" name="realmSystemString" value={world.realmSystem.join(' - ')} onChange={e => onWorldChange('realmSystemString', e.target.value)} placeholder={DEFAULT_REALM_SYSTEM} rows={3} />
                    <SelectField label="Độ khó" name="difficulty" value={world.difficulty || 'Bình thường'} onChange={e => onWorldChange('difficulty', e.target.value)}>
                        <option>Dễ</option>
                        <option>Bình thường</option>
                        <option>Khó</option>
                        <option>Địa ngục</option>
                    </SelectField>
                </div>
            </fieldset>

            <div className="right-column-stack">
                <fieldset className="setup-fieldset">
                    <legend>Tiền Tệ</legend>
                    <div className="fieldset-content">
                        <div className="form-field">
                            <div className="currency-inputs">
                                {currencies.map((currency, index) => {
                                    return (
                                        <div key={index} className="currency-input-group">
                                            <InputField
                                                label="" name={`currency-${index}`}
                                                value={currency}
                                                onChange={(e) => onCurrencyChange(index, e.target.value)}
                                                placeholder={`Tên tiền tệ ${index + 1}`}
                                            />
                                            {currencies.length > 1 && (
                                                <button onClick={() => onRemoveCurrency(index)} className="remove-currency-btn" title="Xóa tiền tệ">×</button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {currencies.length < 3 && <Button variant="secondary" onClick={onAddCurrency} className="add-currency-btn">Thêm Tiền tệ</Button>}
                        </div>
                    </div>
                </fieldset>
                <fieldset className="setup-fieldset">
                    <legend>Bộ nhớ Cốt lõi (AI sẽ luôn ghi nhớ)</legend>
                    <div className="fieldset-content">
                         <div className="form-field">
                             <div className="core-memory-input-group currency-inputs">
                                {coreMemory.map((rule, index) => (
                                    <div key={index} className="core-memory-input-group">
                                        <TextAreaField
                                            label=""
                                            name={`core-memory-${index}`}
                                            value={rule}
                                            onChange={(e) => onCoreMemoryChange(index, e.target.value)}
                                            placeholder={coreMemoryPlaceholders[index] || `Quy tắc cốt lõi ${index + 1}`}
                                            rows={1}
                                        />

                                        <button onClick={() => onRemoveCoreMemory(index)} className="remove-currency-btn" title="Xóa quy tắc">×</button>
                                    </div>
                                ))}
                            </div>
                            {coreMemory.length < 10 && <Button variant="secondary" onClick={onAddCoreMemory} className="add-currency-btn">Thêm Quy tắc</Button>}
                        </div>
                    </div>
                </fieldset>
            </div>
        </div>
    );
};

const CharacterStoryTab: React.FC<{
    character: GameSetupData['character'],
    onCharacterChange: (field: keyof Character | 'startingRealm', value: any) => void,
    realmSystem: string[]
}> = ({ character, onCharacterChange, realmSystem }) => {
    return (
        <div className="form-field-grid">
            <fieldset className="setup-fieldset">
                <legend>Thông Tin Nhân Vật</legend>
                 <div className="fieldset-content">
                    <InputField label="Tên Nhân vật" name="name" value={character.name} onChange={e => onCharacterChange('name', e.target.value)} placeholder="Nhập tên" />
                     <SelectField label="Giới tính" name="gender" value={character.gender} onChange={e => onCharacterChange('gender', e.target.value)}>
                        <option>Nam</option>
                        <option>Nữ</option>
                        <option>Không rõ</option>
                    </SelectField>
                    <div className="form-field-grid">
                        <InputField label="Tuổi" type="number" name="age" value={character.age} onChange={e => onCharacterChange('age', Number(e.target.value))} placeholder="16" />
                        <InputField label="Tuổi thọ" type="number" name="lifespan" value={character.lifespan} onChange={e => onCharacterChange('lifespan', Number(e.target.value))} placeholder="100" />
                    </div>
                     <SelectField label="Cảnh giới Khởi đầu" name="startingRealm" value={character.startingRealm} onChange={e => onCharacterChange('startingRealm', e.target.value)}>
                         {realmSystem.map(realm => <option key={realm} value={realm}>{realm}</option>)}
                    </SelectField>
                 </div>
            </fieldset>
             <fieldset className="setup-fieldset">
                <legend>Cốt Truyện & Tính Cách</legend>
                 <div className="fieldset-content">
                    <TextAreaField label="Tiểu sử" name="background" value={character.background} onChange={e => onCharacterChange('background', e.target.value)} placeholder="Để trống để AI quyết định" rows={4} />
                    <TextAreaField label="Mục tiêu" name="goal" value={character.goal} onChange={e => onCharacterChange('goal', e.target.value)} placeholder="Để trống để AI quyết định" rows={2} />
                 </div>
            </fieldset>
        </div>
    );
};

const InitialElementsTab: React.FC<{
    setupData: GameSetupData;
    realmLevelOptions: { level: number; name: string }[];
    onAddAddon: <T extends keyof InitialAddons>(type: T, newItem: InitialAddons[T][number]) => void;
    onRemoveAddon: <T extends keyof InitialAddons>(type: T, index: number) => void;
    onSkillChange: (index: number, field: keyof InitialSkill, value: string) => void;
    onItemChange: (index: number, field: keyof InitialItem, value: any) => void;
    onItemStatChange: (itemIndex: number, statKey: keyof Stats, statValue: string, isEquipment: boolean) => void;
    onNPCChange: (index: number, field: keyof InitialNPC, value: any) => void;
    onLoreChange: (index: number, field: keyof InitialLore, value: string) => void;
    onLocationChange: (index: number, field: keyof InitialLocation, value: any) => void;
    onFactionChange: (index: number, field: keyof InitialFaction, value: any) => void;
    onGenerate: () => void;
    isLoadingAI: boolean;
    openAccordions: Record<string, boolean>;
    onAccordionToggle: (name: string) => void;
}> = ({ setupData, realmLevelOptions, onAddAddon, onRemoveAddon, onSkillChange, onItemChange, onItemStatChange, onNPCChange, onLoreChange, onLocationChange, onFactionChange, onGenerate, isLoadingAI, openAccordions, onAccordionToggle }) => {
    return (
        <div className="addons-container">
            <div className="addon-generation-control">
                <p>Bạn có thể tự thêm các yếu tố khởi đầu, hoặc để AI tự động tạo ra một bộ khởi đầu hợp lý dựa trên bối cảnh thế giới và nhân vật của bạn.</p>
                <Button variant="primary" onClick={onGenerate} isLoading={isLoadingAI}>
                    <span className="ai-button-icon">✨</span>
                    Nhờ AI tạo Yếu Tố Khởi Đầu
                </Button>
            </div>

            <div className="accordion-container">
                <AccordionItem title="Kỹ năng/Thiên phú Khởi đầu" count={setupData.initialAddons.skills.length} name="skills" isOpen={openAccordions.skills} onToggle={onAccordionToggle}>
                    <div className="addon-grid">
                        {setupData.initialAddons.skills.map((skill, index) => (
                            <div key={skill.id} className="addon-item">
                                <InputField label="Tên Kỹ năng" name={`skill-name-${index}`} value={skill.name} onChange={(e) => onSkillChange(index, 'name', e.target.value)} placeholder="Ví dụ: Hỏa Cầu Thuật"/>
                                <TextAreaField label="Mô tả" name={`skill-desc-${index}`} value={skill.description} onChange={(e) => onSkillChange(index, 'description', e.target.value)} placeholder="Mô tả ngắn về kỹ năng" rows={2}/>
                                <div className="addon-item-actions">
                                    <Button variant="danger" onClick={() => onRemoveAddon('skills', index)}>Xóa</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button variant="secondary" onClick={() => onAddAddon('skills', { id: Date.now(), name: '', description: '' })}>Thêm Kỹ năng</Button>
                </AccordionItem>
                <AccordionItem title="Vật phẩm khởi đầu" count={setupData.initialAddons.items.length} name="items" isOpen={openAccordions.items} onToggle={onAccordionToggle}>
                    <div className="addon-grid addon-grid-items">
                         {setupData.initialAddons.items.map((item, index) => (
                            <div key={item.id} className="addon-item item-addon">
                                <InputField label="Tên vật phẩm" name={`item-name-${index}`} value={item.name} onChange={(e) => onItemChange(index, 'name', e.target.value)} placeholder="Ví dụ: Tiểu Linh Đan"/>
                                <div className="form-field-grid">
                                    <InputField label="Số lượng" type="number" name={`item-quantity-${index}`} value={item.quantity} onChange={(e) => onItemChange(index, 'quantity', Number(e.target.value))} placeholder="1"/>
                                    <SelectField label="Phẩm chất" name={`item-quality-${index}`} value={item.quality} onChange={(e) => onItemChange(index, 'quality', Number(e.target.value))}>
                                        {Object.entries(QualityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                                    </SelectField>
                                </div>
                                 <div className="form-field-grid">
                                    <SelectField label="Độ hiếm" name={`item-rarity-${index}`} value={item.rarity} onChange={(e) => onItemChange(index, 'rarity', e.target.value)}>
                                        {(Object.keys(RarityLabels) as Rarity[]).map(key => <option key={key} value={key}>{RarityLabels[key]}</option>)}
                                    </SelectField>
                                    <SelectField
                                        label="Yêu cầu Cấp độ"
                                        name={`item-requiredLevel-${index}`}
                                        value={item.requiredLevel ?? ''}
                                        onChange={(e) => onItemChange(index, 'requiredLevel', e.target.value ? Number(e.target.value) : undefined)}
                                    >
                                        <option value="">Không yêu cầu</option>
                                        {realmLevelOptions.map(option => (
                                            <option key={option.level} value={option.level}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </SelectField>
                                </div>
                                <TextAreaField label="Mô tả" name={`item-desc-${index}`} value={item.description} onChange={(e) => onItemChange(index, 'description', e.target.value)} placeholder="Mô tả vật phẩm" rows={2}/>

                                <div className="item-addon-section">
                                    <h4>Phân Loại</h4>
                                    <div className="form-field-grid">
                                        <SelectField label="Loại chính" name={`item-itemType-${index}`} value={item.itemType} onChange={(e) => onItemChange(index, 'itemType', e.target.value)}>
                                            <option value="Vật phẩm thường">Vật phẩm thường</option>
                                            <option value="Trang bị">Trang bị</option>
                                            <option value="Nhiệm vụ">Nhiệm vụ</option>
                                        </SelectField>
                                         <SelectField label="Loại phụ" name={`item-type-${index}`} value={item.type} onChange={(e) => onItemChange(index, 'type', e.target.value)}>
                                             {item.itemType === 'Trang bị' ?
                                                 (Object.keys(EQUIPMENT_TYPE_TO_SLOT_MAP) as EquipmentItemType[]).map(key => <option key={key} value={key}>{ItemTypeLabels[key]}</option>) :
                                                 RegularItemTypeKeys.map(key => <option key={key} value={key}>{ItemTypeLabels[key]}</option>)
                                             }
                                        </SelectField>
                                    </div>
                                    {item.type === 'pill' && item.itemType === 'Vật phẩm thường' && (
                                        <SelectField label="Loại đan dược" name={`item-pillType-${index}`} value={item.pillType || 'Hồi Phục'} onChange={(e) => onItemChange(index, 'pillType', e.target.value)}>
                                            <option>Hồi Phục</option><option>Cải tạo</option><option>Bí Đan</option>
                                        </SelectField>
                                    )}
                                </div>
                                
                                {item.itemType === 'Vật phẩm thường' && (
                                     <div className="item-addon-section">
                                        <h4>Thuộc tính vật phẩm thường</h4>
                                        <CheckboxField label="Có thể sử dụng?" checked={!!item.isConsumable} onChange={e => onItemChange(index, 'isConsumable', e.target.checked)} name={`item-isConsumable-${index}`} />
                                        <div className="form-field-grid">
                                            <InputField label="Số lần dùng" type="number" name={`item-uses-${index}`} value={item.uses ?? ''} onChange={(e) => onItemChange(index, 'uses', e.target.value ? Number(e.target.value) : undefined)} placeholder="1"/>
                                            <InputField label="Số lượt tác dụng" type="number" name={`item-duration-${index}`} value={item.duration ?? ''} onChange={(e) => onItemChange(index, 'duration', e.target.value ? Number(e.target.value) : undefined)} placeholder="3"/>
                                        </div>
                                        <h5>Chỉ số khi sử dụng</h5>
                                        <StatInputGroup stats={item.stats || {}} onStatChange={(k, v) => onItemStatChange(index, k, v, false)} prefix={`item-${index}-vp`} />
                                     </div>
                                )}
                                
                                {item.itemType === 'Trang bị' && (
                                    <div className="item-addon-section">
                                        <h4>Thuộc tính trang bị</h4>
                                        <h5>Chỉ số trang bị</h5>
                                        <StatInputGroup stats={item.equipmentDetails?.stats || {}} onStatChange={(k, v) => onItemStatChange(index, k, v, true)} prefix={`item-${index}-tb`} isEquipment={true}/>
                                    </div>
                                )}

                                <div className="addon-item-actions">
                                    <Button variant="danger" onClick={() => onRemoveAddon('items', index)}>Xóa</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button variant="secondary" onClick={() => onAddAddon('items', { id: Date.now(), name: '', quantity: 1, itemType: 'Vật phẩm thường', rarity: 'thường', quality: 1, type: 'other', description: '', requiredLevel: undefined })}>Thêm Vật phẩm</Button>
                </AccordionItem>
                 <AccordionItem title="NPC Khởi đầu" count={setupData.initialAddons.npcs.length} name="npcs" isOpen={openAccordions.npcs} onToggle={onAccordionToggle}>
                    <div className="addon-grid">
                         {setupData.initialAddons.npcs.map((npc, index) => (
                            <div key={npc.id} className="addon-item">
                                <InputField label="Tên NPC" name={`npc-name-${index}`} value={npc.name} onChange={(e) => onNPCChange(index, 'name', e.target.value)} placeholder="Tên NPC"/>
                                 <div className="form-field-grid">
                                     <SelectField label="Giới tính" name={`npc-gender-${index}`} value={npc.gender} onChange={(e) => onNPCChange(index, 'gender', e.target.value)}>
                                        <option>Nam</option><option>Nữ</option><option>Không rõ</option>
                                    </SelectField>
                                    <InputField label="Cảnh giới" name={`npc-realm-${index}`} value={npc.realm} onChange={(e) => onNPCChange(index, 'realm', e.target.value)} placeholder="Ví dụ: Trúc Cơ"/>
                                </div>
                                <InputField label="Tính cách" name={`npc-personality-${index}`} value={npc.personality} onChange={(e) => onNPCChange(index, 'personality', e.target.value)} placeholder="Ví dụ: Lạnh lùng, ít nói"/>
                                <TextAreaField label="Chi tiết/Tiểu sử" name={`npc-details-${index}`} value={npc.details} onChange={(e) => onNPCChange(index, 'details', e.target.value)} rows={3} placeholder="Mô tả về NPC này"/>
                                <div className="addon-item-actions">
                                    <Button variant="danger" onClick={() => onRemoveAddon('npcs', index)}>Xóa</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button variant="secondary" onClick={() => onAddAddon('npcs', { id: Date.now(), name: '', gender: 'Nam', personality: '', favorability: 0, realm: '', details: '', avatarUrl: '' })}>Thêm NPC</Button>
                </AccordionItem>
                <AccordionItem title="Tri thức/Lore Khởi đầu" count={setupData.initialAddons.lore.length} name="lore" isOpen={openAccordions.lore} onToggle={onAccordionToggle}>
                    <div className="addon-grid">
                        {setupData.initialAddons.lore.map((lore, index) => (
                            <div key={lore.id} className="addon-item">
                                <InputField label="Tiêu đề" name={`lore-title-${index}`} value={lore.title} onChange={(e) => onLoreChange(index, 'title', e.target.value)} placeholder="Ví dụ: Đại chiến Chính-Tà lần thứ nhất"/>
                                <TextAreaField label="Nội dung" name={`lore-content-${index}`} value={lore.content} onChange={(e) => onLoreChange(index, 'content', e.target.value)} placeholder="Nội dung về tri thức này" rows={3}/>
                                <div className="addon-item-actions">
                                    <Button variant="danger" onClick={() => onRemoveAddon('lore', index)}>Xóa</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button variant="secondary" onClick={() => onAddAddon('lore', { id: Date.now(), title: '', content: '' })}>Thêm Tri thức</Button>
                </AccordionItem>
                <AccordionItem title="Địa điểm Khởi đầu" count={setupData.initialAddons.locations.length} name="locations" isOpen={openAccordions.locations} onToggle={onAccordionToggle}>
                     <div className="addon-grid">
                        {setupData.initialAddons.locations.map((loc, index) => (
                            <div key={loc.id} className="addon-item">
                                <InputField label="Tên Địa điểm" name={`loc-name-${index}`} value={loc.name} onChange={(e) => onLocationChange(index, 'name', e.target.value)} placeholder="Ví dụ: Thanh Vân Môn"/>
                                <InputField label="Vùng/Khu vực" name={`loc-region-${index}`} value={loc.region} onChange={(e) => onLocationChange(index, 'region', e.target.value)} placeholder="Ví dụ: Đông Vực"/>
                                <TextAreaField label="Mô tả" name={`loc-desc-${index}`} value={loc.description} onChange={(e) => onLocationChange(index, 'description', e.target.value)} placeholder="Mô tả địa điểm" rows={2}/>
                                <CheckboxField label="Là khu vực an toàn?" checked={loc.isSafeZone} onChange={e => onLocationChange(index, 'isSafeZone', e.target.checked)} name={`loc-safe-${index}`} />
                                <div className="addon-item-actions">
                                    <Button variant="danger" onClick={() => onRemoveAddon('locations', index)}>Xóa</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button variant="secondary" onClick={() => onAddAddon('locations', { id: Date.now(), name: '', description: '', isSafeZone: false, region: '' })}>Thêm Địa điểm</Button>
                </AccordionItem>
                <AccordionItem title="Phe phái Khởi đầu" count={setupData.initialAddons.factions.length} name="factions" isOpen={openAccordions.factions} onToggle={onAccordionToggle}>
                    <div className="addon-grid">
                        {setupData.initialAddons.factions.map((faction, index) => (
                             <div key={faction.id} className="addon-item">
                                <InputField label="Tên Phe phái" name={`faction-name-${index}`} value={faction.name} onChange={(e) => onFactionChange(index, 'name', e.target.value)} placeholder="Ví dụ: Ma Giáo"/>
                                <SelectField label="Lập trường" name={`faction-alignment-${index}`} value={faction.alignment} onChange={(e) => onFactionChange(index, 'alignment', e.target.value)}>
                                    <option>Chính</option><option>Tà</option><option>Trung lập</option>
                                </SelectField>
                                <TextAreaField label="Mô tả" name={`faction-desc-${index}`} value={faction.description} onChange={(e) => onFactionChange(index, 'description', e.target.value)} placeholder="Mô tả phe phái" rows={3}/>
                                <div className="addon-item-actions">
                                    <Button variant="danger" onClick={() => onRemoveAddon('factions', index)}>Xóa</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                     <Button variant="secondary" onClick={() => onAddAddon('factions', { id: Date.now(), name: '', description: '', alignment: 'Trung lập', reputation: 0 })}>Thêm Phe phái</Button>
                </AccordionItem>
            </div>
        </div>
    );
};