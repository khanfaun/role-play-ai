
import { SYSTEM_HEAVENLY_RULES } from '../constants';
import { GameState, Item, World, AIWorldGenerationResponse, Equipment, Location, Faction, Lore, Character, RarityLabels, ItemTypeLabels, SourceMaterialAnalysis, InitialAddons, Skill, InitialSkill } from '../types';
import { calculateTotalStats, formatStatsForAI } from '../components/shared/statUtils';

// A local copy of the Type enum, as we no longer import from @google/genai on the client
enum Type {
  TYPE_UNSPECIFIED = 'TYPE_UNSPECIFIED',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
  NULL = 'NULL',
}

/**
 * A helper function to call our new backend proxy.
 * @param payload The data to send to the Gemini API, matching the structure for generateContent.
 * @returns The text response from the API.
 */
async function callBackend(payload: { model: string; contents: any; config?: any }): Promise<{ text: string }> {
    try {
        const response = await fetch('/api/generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error calling backend:', error);
        // Return a structured error response that the UI can display
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred.';
        return { text: `[SYSTEM_ERROR] Lỗi kết nối đến server: ${errorMessage}` };
    }
}


/**
 * Tách chuỗi JSON từ văn bản thô do AI trả về.
 * Thường AI sẽ trả về markdown có chứa JSON, ví dụ: ```json\n{...}\n```
 * hoặc văn bản giải thích. Hàm này sẽ cố gắng trích xuất phần JSON hợp lệ.
 * @param text Văn bản thô từ AI.
 * @returns Chuỗi JSON đã được làm sạch.
 */
function extractJson(text: string): string {
    // Tìm vị trí bắt đầu của JSON, có thể là { hoặc [
    const jsonStart = text.indexOf('{');
    const arrayStart = text.indexOf('[');
    
    let startIndex = -1;

    if (jsonStart === -1 && arrayStart === -1) {
        console.warn("Không tìm thấy ký tự bắt đầu JSON ('{' hoặc '[') trong phản hồi của AI.");
        return text; // Trả về văn bản gốc để JSON.parse báo lỗi rõ ràng
    }
    
    if (jsonStart !== -1 && arrayStart !== -1) {
        startIndex = Math.min(jsonStart, arrayStart);
    } else {
        startIndex = Math.max(jsonStart, arrayStart);
    }
    
    // Tìm vị trí kết thúc của JSON
    const jsonEnd = text.lastIndexOf('}');
    const arrayEnd = text.lastIndexOf(']');
    
    let endIndex = Math.max(jsonEnd, arrayEnd);

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        console.warn("Không thể xác định chuỗi JSON hợp lệ trong phản hồi của AI.");
        return text;
    }

    return text.substring(startIndex, endIndex + 1);
}

export async function fetchSkillDetailsFromAI(trait: InitialSkill, worldStyle: string): Promise<Skill> {
    const prompt = `
        Bạn là một chuyên gia thiết kế game nhập vai (Game Master). Dựa trên thông tin về một "Đặc điểm khởi đầu" do người chơi cung cấp, hãy phân tích và biến nó thành một "Kỹ năng" hoàn chỉnh trong game.
        Thông tin đầu vào:
            - Chủ đề thế giới: "${worldStyle || 'Chưa xác định'}"
            - Tên đặc điểm/kỹ năng: "${trait.name}"
            - Mô tả ngắn của người chơi: "${trait.description || '(Người chơi không cung cấp mô tả, hãy dựa vào Tên đặc điểm và Chủ đề thế giới để tự sáng tạo một mô tả phù hợp.)'}"

        Yêu cầu:
        Dựa vào Tên và Mô tả, hãy quyết định các thuộc tính sau:
        1.  "type": Phân loại kỹ năng (VD: Chủ động, Bị động, Thần thông, Tuyệt kỹ, Thiên phú, Nội tại...). Nếu nó giống một thiên phú hoặc kỹ năng bị động, hãy chọn "Thiên phú" hoặc "Bị động". Nếu nó giống một chiêu thức tấn công hãy chọn "Chủ động" hoặc "Tuyệt kỹ".
        2.  "manaCost": Lượng Mana tiêu hao. Nếu là kỹ năng bị động/thiên phú, giá trị là 0. Nếu là kỹ năng chủ động, hãy đặt một con số hợp lý (VD: 10, 25, 50).
        3.  "cooldown": Số lượt hồi chiêu. Nếu là kỹ năng bị động/thiên phú, giá trị là 0. Nếu là kỹ năng chủ động, hãy đặt một con số hợp lý (VD: 0 cho chiêu thường, 3-5 cho chiêu mạnh).
        4.  "effect": Mô tả chi tiết, rõ ràng về tác dụng của kỹ năng trong game, dựa trên mô tả gốc của người chơi nhưng cụ thể và rõ ràng hơn cho game.

        Chỉ trả về một đối tượng JSON duy nhất theo cấu trúc schema đã định, không thêm bất kỳ giải thích hay ký tự nào khác.
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, description: "Loại kỹ năng." },
            manaCost: { type: Type.NUMBER, description: "Lượng Mana tiêu hao." },
            cooldown: { type: Type.NUMBER, description: "Số lượt hồi chiêu." },
            effect: { type: Type.STRING, description: "Mô tả chi tiết tác dụng." },
        },
        required: ["type", "manaCost", "cooldown", "effect"],
    };

    try {
        const backendResponse = await callBackend({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonText = backendResponse.text;
        const details = JSON.parse(jsonText);
        
        return {
            id: trait.id.toString(),
            name: trait.name,
            description: trait.description,
            ...details,
            currentCooldown: 0,
        };

    } catch (error) {
        console.error(`Lỗi khi gọi AI cho kỹ năng "${trait.name}":`, error);
        // Fallback to a basic skill object on error
        return {
            id: trait.id.toString(),
            name: trait.name,
            description: trait.description,
            type: 'Bị động',
            manaCost: 0,
            cooldown: 0,
            effect: trait.description,
            currentCooldown: 0,
        };
    }
};

export async function generateSummary(storyText: string): Promise<string> {
    const prompt = `Tóm tắt lại đoạn văn sau trong khoảng 30-50 từ, tập trung vào những hành động và kết quả chính. Chỉ trả về đoạn văn tóm tắt, không thêm bất kỳ lời dẫn hay bình luận nào.\n\nĐoạn văn:\n"${storyText}"`;

    try {
        const response = await callBackend({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.5,
                topK: 40,
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Lỗi khi tạo tóm tắt:", error);
        // Trả về một bản tóm tắt cắt ngắn như một giải pháp dự phòng
        return storyText.slice(0, 100) + '...';
    }
}

export async function callGeminiAPI(prompt: string): Promise<{ story: string, choices: string[], tags: string }> {
    try {
        const response = await callBackend({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const rawText = response.text;
        
        if (rawText.startsWith('[SYSTEM_ERROR]')) {
             return {
                story: rawText,
                choices: ["1. Tải lại game", "2. Bắt đầu lại"],
                tags: ""
            };
        }

        const tagRegex = /\[([^\]]+)\]/g;
        const tags = (rawText.match(tagRegex) || []).join('\n');
        
        let storyContent = rawText.replace(tagRegex, '').trim();

        const choiceRegex = /^\s*(\d+\.\s*.*)/gm;
        const choices = (storyContent.match(choiceRegex) || []).map(c => c.trim());
        
        // Remove choices from the story content
        storyContent = storyContent.replace(choiceRegex, '').trim();
        
        return {
            story: storyContent || "AI không thể tạo ra câu chuyện. Hãy thử lại.",
            choices: choices.slice(0, 4), // Ensure max 4 choices
            tags: tags
        };
    } catch (error) {
        console.error("Lỗi khi gọi Gemini API:", error);
        return {
            story: "Đã xảy ra lỗi khi kết nối đến AI. Vui lòng kiểm tra lại API Key và thử lại.",
            choices: ["1. Tải lại game", "2. Bắt đầu lại"],
            tags: ""
        };
    }
}


export async function extractStateChangesFromText(text: string, currentState: GameState): Promise<string> {
    // This is a placeholder for a more complex implementation.
    // In a real scenario, this might involve another AI call to parse the narrative for state changes.
    // For now, we return an empty string as the logic is handled by explicit tags.
    return "";
}

export async function analyzeSourceMaterial(sourceTitle: string, sourceAuthor?: string): Promise<SourceMaterialAnalysis | null> {
    const authorInfo = sourceAuthor ? ` (Tác giả: ${sourceAuthor})` : '';
    const prompt = `
        Bạn là một chuyên gia phân tích văn học và game. Nhiệm vụ của bạn là phân tích tác phẩm "${sourceTitle}"${authorInfo} và trích xuất thông tin chi tiết.

        **YÊU CẦU CỰC KỲ QUAN TRỌNG:**
        1.  Toàn bộ phản hồi của bạn PHẢI là một đối tượng JSON duy nhất và hợp lệ.
        2.  KHÔNG được thêm bất kỳ văn bản giải thích, lời chào, hay định dạng markdown nào (như \`\`\`json) bên ngoài đối tượng JSON.
        3.  Tổng nội dung văn bản trong toàn bộ các trường của JSON phải nằm trong khoảng 1000-2000 từ.
        4.  Hãy điền đầy đủ và chi tiết vào CẤU TRÚC JSON sau đây:
            {
              "summary": "Tóm tắt/bối cảnh ngắn gọn (Khoảng 50-100 từ)",
              "realmSystem": [
                { "name": "Tên cảnh giới 1", "lifespanIncrease": "Ví dụ: (+200 năm)" },
                { "name": "Tên cảnh giới 2", "lifespanIncrease": "Ví dụ: (+500 năm)" }
              ],
              "majorArcs": [
                { "title": "Tên arc truyện 1", "summary": "Tóm tắt ngắn về arc (30-50 từ)" }
              ],
              "keyNpcs": [
                {
                  "name": "Tên NPC 1",
                  "gender": "Nam/Nữ/Không rõ",
                  "realm": "Cảnh giới của NPC",
                  "personality": "Tính cách (Giới hạn 50-100 từ)",
                  "bio": "Tiểu sử (Giới hạn 50-100 từ)"
                }
              ],
              "keySkills": [
                { "name": "Tên kỹ năng 1", "description": "Mô tả (Giới hạn 30-50 từ)" }
              ],
              "keyItems": [
                { "name": "Tên vật phẩm 1", "description": "Mô tả (Giới hạn 30-50 từ)" }
              ],
              "keyLocations": [
                { "name": "Tên địa điểm 1", "description": "Mô tả (Giới hạn 30-50 từ)" }
              ],
              "keyFactions": [
                { "name": "Tên phe phái 1", "description": "Mô tả (Giới hạn 30-50 từ)" }
              ],
              "keyLore": [
                { "title": "Tiêu đề tri thức 1", "content": "Nội dung (Giới hạn 30-50 từ)" }
              ]
            }
    `;

    const analysisSchema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "Tóm tắt cốt truyện chính (50-100 từ)." },
            realmSystem: {
                type: Type.ARRAY,
                description: "Danh sách các cảnh giới và tuổi thọ tăng thêm.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Tên cảnh giới." },
                        lifespanIncrease: { type: Type.STRING, description: "Mô tả sự gia tăng tuổi thọ, ví dụ: '(+200 năm)'." }
                    },
                    required: ["name", "lifespanIncrease"]
                }
            },
            majorArcs: {
                type: Type.ARRAY,
                description: "Danh sách các tuyến truyện (arc) chính.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "Tên của arc truyện." },
                        summary: { type: Type.STRING, description: "Tóm tắt ngắn gọn về arc truyện (30-50 từ)." }
                    },
                    required: ["title", "summary"]
                }
            },
            keyNpcs: {
                type: Type.ARRAY,
                description: "Danh sách các NPC quan trọng.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Tên NPC." },
                        gender: { type: Type.STRING, description: "Giới tính (Nam/Nữ/Không rõ)." },
                        realm: { type: Type.STRING, description: "Cảnh giới của NPC." },
                        personality: { type: Type.STRING, description: "Tính cách của NPC (50-100 từ)." },
                        bio: { type: Type.STRING, description: "Tiểu sử của NPC (50-100 từ)." }
                    },
                    required: ["name", "gender", "realm", "personality", "bio"]
                }
            },
            keySkills: {
                type: Type.ARRAY,
                description: "Danh sách các kỹ năng quan trọng.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Tên công pháp/kỹ năng." },
                        description: { type: Type.STRING, description: "Mô tả (30-50 từ)." }
                    },
                    required: ["name", "description"]
                }
            },
            keyItems: {
                type: Type.ARRAY,
                description: "Danh sách các vật phẩm/pháp bảo quan trọng.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Tên vật phẩm/pháp bảo." },
                        description: { type: Type.STRING, description: "Mô tả (30-50 từ)." }
                    },
                    required: ["name", "description"]
                }
            },
            keyLocations: {
                type: Type.ARRAY,
                description: "Danh sách các địa danh quan trọng.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Tên địa danh." },
                        description: { type: Type.STRING, description: "Mô tả địa danh (30-50 từ)." }
                    },
                    required: ["name", "description"]
                }
            },
            keyFactions: {
                type: Type.ARRAY,
                description: "Danh sách các phe phái quan trọng.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Tên phe phái." },
                        description: { type: Type.STRING, description: "Mô tả phe phái (30-50 từ)." }
                    },
                    required: ["name", "description"]
                }
            },
            keyLore: {
                type: Type.ARRAY,
                description: "Danh sách các tri thức quan trọng.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "Tiêu đề tri thức." },
                        content: { type: Type.STRING, description: "Nội dung tri thức (30-50 từ)." }
                    },
                    required: ["title", "content"]
                }
            }
        },
        required: ["summary", "realmSystem", "majorArcs", "keyNpcs", "keySkills", "keyItems", "keyLocations", "keyFactions", "keyLore"]
    };

    try {
        const response = await callBackend({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        });
        const jsonText = response.text;
        return JSON.parse(jsonText) as SourceMaterialAnalysis;
    } catch (error) {
        console.error(`Lỗi khi phân tích nguyên tác "${sourceTitle}" (Tác giả: ${sourceAuthor || 'Không rõ'}):`, error);
        return null;
    }
}

export async function generatePrimaryWorldDetails(prompt: string): Promise<AIWorldGenerationResponse | null> {
     const schema: any = {
        type: Type.OBJECT,
        properties: {
            world: {
                type: Type.OBJECT,
                properties: {
                    setting: { type: Type.STRING, description: "Bối cảnh chính của thế giới, ví dụ: 'Lục địa tu tiên Huyền Thiên'" },
                    style: { type: Type.STRING, description: "Phong cách truyện, ví dụ: 'Tiên hiệp', 'Huyền huyễn'" },
                    realmSystem: { type: Type.STRING, description: "Chuỗi cảnh giới, phân cách bởi ' - ', ví dụ: 'Phàm Nhân - Luyện Khí - Trúc Cơ'" },
                    currencies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách các loại tiền tệ" }
                },
                required: ["setting", "style", "realmSystem", "currencies"]
            },
            character: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    gender: { type: Type.STRING },
                    background: { type: Type.STRING, description: "Tiểu sử chi tiết do AI tạo ra" },
                    goal: { type: Type.STRING, description: "Mục tiêu cuộc đời do AI tạo ra" },
                    age: { type: Type.NUMBER },
                    lifespan: { type: Type.NUMBER },
                    startingRealm: { type: Type.STRING, description: "Cảnh giới khởi đầu, phải có trong chuỗi realmSystem" }
                },
                required: ["name", "gender", "background", "goal", "age", "lifespan", "startingRealm"]
            },
            generatedOriginalStoryIdea: { type: Type.STRING, description: "Ý tưởng truyện gốc đã được AI phát triển chi tiết hơn", nullable: true },
            generatedFanficIdea: { type: Type.STRING, description: "Ý tưởng đồng nhân đã được AI phát triển chi tiết hơn", nullable: true },
            initialCoreMemory: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Danh sách 3-5 quy tắc cốt lõi, bất biến của thế giới. Ví dụ: 'Trong thế giới này, ma pháp hệ Hỏa không tồn tại.', 'Lời tiên tri về Đứa Con Của Rồng là có thật.'"
            }
        },
        required: ["world", "character"]
    };

    try {
        const response = await callBackend({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            },
        });
        const jsonText = extractJson(response.text);
        const parsed = JSON.parse(jsonText);
        return { ...parsed, initialAddons: { skills: [], items: [], npcs: [], lore: [], locations: [], factions: [] } };
    } catch (error) {
        console.error("Lỗi khi tạo chi tiết thế giới chính:", error);
        return null;
    }
}

export async function generateInitialAddons(prompt: string): Promise<{ initialAddons: InitialAddons } | null> {
    const statsSchema: any = {
        type: Type.OBJECT,
        properties: {
            hp: { type: Type.NUMBER, nullable: true }, maxHp: { type: Type.NUMBER, nullable: true },
            mp: { type: Type.NUMBER, nullable: true }, maxMp: { type: Type.NUMBER, nullable: true },
            stamina: { type: Type.NUMBER, nullable: true }, maxStamina: { type: Type.NUMBER, nullable: true },
            atk: { type: Type.NUMBER, nullable: true }, def: { type: Type.NUMBER, nullable: true },
            spd: { type: Type.NUMBER, nullable: true }, magicPower: { type: Type.NUMBER, nullable: true },
            burstPower: { type: Type.NUMBER, nullable: true }, constitution: { type: Type.NUMBER, nullable: true },
            killingIntent: { type: Type.NUMBER, nullable: true }, expr: { type: Type.NUMBER, nullable: true },
        },
        nullable: true
    };

    const schema: any = {
        type: Type.OBJECT,
        properties: {
            initialAddons: {
                type: Type.OBJECT,
                properties: {
                    skills: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["name", "description"] } },
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING }, quantity: { type: Type.NUMBER }, itemType: { type: Type.STRING },
                                rarity: { type: Type.STRING }, quality: { type: Type.NUMBER }, type: { type: Type.STRING },
                                description: { type: Type.STRING }, isConsumable: { type: Type.BOOLEAN, nullable: true },
                                isEquippedAtStart: { type: Type.BOOLEAN, nullable: true }, uses: { type: Type.NUMBER, nullable: true },
                                duration: { type: Type.NUMBER, nullable: true }, stats: statsSchema,
                                pillType: { type: Type.STRING, nullable: true }, effects: { type: Type.STRING, nullable: true },
                                equipmentDetails: {
                                    type: Type.OBJECT, properties: { position: { type: Type.STRING }, stats: statsSchema, effects: { type: Type.STRING } },
                                    nullable: true, required: ["position"]
                                }
                            },
                             required: ["name", "quantity", "itemType", "rarity", "quality", "type", "description"]
                        }
                    },
                    npcs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, gender: { type: Type.STRING }, personality: { type: Type.STRING }, favorability: { type: Type.NUMBER }, realm: { type: Type.STRING }, details: { type: Type.STRING }, avatarUrl: { type: Type.STRING } }, required: ["name", "gender", "personality", "favorability", "realm", "details"] } },
                    lore: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } }, required: ["title", "content"] } },
                    locations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, isSafeZone: { type: Type.BOOLEAN }, region: { type: Type.STRING } }, required: ["name", "description", "isSafeZone", "region"] } },
                    factions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, alignment: { type: Type.STRING }, reputation: { type: Type.NUMBER } }, required: ["name", "description", "alignment", "reputation"] } },
                },
                 required: ["skills", "items", "npcs", "lore", "locations", "factions"]
            }
        },
        required: ["initialAddons"]
    };

    try {
        const response = await callBackend({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            },
        });
        const jsonText = extractJson(response.text);
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Lỗi khi tạo các yếu tố khởi đầu:", error);
        return null;
    }
}
