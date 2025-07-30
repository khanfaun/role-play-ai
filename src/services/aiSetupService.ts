import {
    GameSetupData,
    AIWorldGenerationResponse,
    InitialAddons,
    SourceMaterialAnalysis
} from '../types';
import { analyzeSourceMaterial, generatePrimaryWorldDetails, generateInitialAddons } from './aiApiUtils';
import { getLevelForRealm, getRealmName } from './realmService';

// Type for the data needed to generate the primary story
type PrimaryStoryData = Pick<GameSetupData, 'aiSupport' | 'character' | 'world'>;

/**
 * Generates the core world details, character background, and story idea.
 * This combines the logic for both "original story" and "fanfiction" modes.
 * @param data The necessary setup data from the UI.
 * @returns An object containing the generated world details and optional fanfic analysis.
 */
export async function generatePrimaryStory(data: PrimaryStoryData): Promise<{
    analysisData: SourceMaterialAnalysis | null;
    worldDetails: AIWorldGenerationResponse | null;
}> {
    const { aiSupport } = data;
    let analysisPrompt = '';
    let fanficAnalysisData: SourceMaterialAnalysis | null = null;

    const authorInstruction = aiSupport.authorName.trim() ? `\n\nQUAN TRỌNG: Viết tất cả các mô tả, tạo ra nhân vật, kỹ năng, vật phẩm, v.v. theo đúng văn phong của tác giả "${aiSupport.authorName.trim()}". Đây là yêu cầu ưu tiên hàng đầu.` : "";
    const coreMemoryInstruction = `\n\nQUAN TRỌNG - BỘ NHỚ CỐT LÕI (initialCoreMemory): Hãy tạo ra từ 3 đến 5 quy tắc cốt lõi cho thế giới. Đây là những luật lệ nền tảng, bất biến mà mạch truyện PHẢI tuân theo. Yêu cầu định dạng RẤT NGHIÊM NGẶT:\n- Mỗi quy tắc PHẢI nằm trên một dòng riêng biệt.\n- Mỗi quy tắc PHẢI bắt đầu bằng một dấu gạch ngang và một dấu cách ('- ').\n- Mỗi quy tắc chỉ được dài từ 10 đến 20 từ.\n- Ví dụ:\n- Tu sĩ chỉ có thể đột phá Hóa Thần khi phi thăng.\n- Mọi sinh vật mang huyết mạch rồng đều bị săn lùng.\n- Ma pháp hệ hắc ám đã bị thất truyền và cấm đoán.`;
    const currencyInstruction = "\n\nHãy tạo ra từ 1 đến TỐI ĐA 3 loại tiền tệ chính cho thế giới (ví dụ: Linh thạch, Ma thạch, Vàng).";

    if (aiSupport.genMode === 'original') {
        if (aiSupport.originalStoryIdea.trim()) {
            // Case 1: User provided an idea.
            analysisPrompt = `Chế độ Sáng tạo truyện gốc.\nYêu cầu: Phát triển một thế giới game dựa trên ý tưởng sau: "${aiSupport.originalStoryIdea}".\n${aiSupport.originalNsfw ? 'Lưu ý: Người dùng yêu cầu tích hợp các yếu tố 18+ (đam dục, bạo lực) một cách tinh tế.' : ''}${authorInstruction}${coreMemoryInstruction}${currencyInstruction}`;
        } else {
            // Case 2: User did NOT provide an idea. AI must generate one.
            analysisPrompt = `Chế độ Sáng tạo truyện gốc TỰ ĐỘNG.\nYêu cầu: Hãy TỰ ĐỘNG SÁNG TẠO một ý tưởng cốt truyện gốc, ngẫu nhiên và hấp dẫn cho một game nhập vai. Sau đó, dựa trên ý tưởng BẠN VỪA TẠO RA, hãy phát triển một thế giới game. Điền ý tưởng bạn đã tạo vào trường "generatedOriginalStoryIdea".\n${aiSupport.originalNsfw ? 'Lưu ý: Người dùng yêu cầu tích hợp các yếu tố 18+ (đam dục, bạo lực) một cách tinh tế.' : ''}${authorInstruction}${coreMemoryInstruction}${currencyInstruction}`;
        }
    } else { // fanfiction mode
        if (!aiSupport.fanficSourceTitle.trim()) {
            throw new Error('Vui lòng nhập tên truyện gốc.');
        }
        
        fanficAnalysisData = await analyzeSourceMaterial(aiSupport.fanficSourceTitle, aiSupport.fanficSourceAuthor);
        if (!fanficAnalysisData) {
            throw new Error('AI không thể phân tích nguyên tác.');
        }

        const sourceMaterialAnalysisString = JSON.stringify(fanficAnalysisData, null, 2);
        const authorInfo = aiSupport.fanficSourceAuthor ? ` (Tác giả: ${aiSupport.fanficSourceAuthor})` : '';
        analysisPrompt = `Chế độ Sáng tạo Đồng nhân (Fanfiction).\nTruyện gốc: "${aiSupport.fanficSourceTitle}"${authorInfo}.\nBối cảnh và chi tiết nguyên tác đã được phân tích (dùng làm nguồn tham khảo chính):\n${sourceMaterialAnalysisString}\nYêu cầu: Tạo một kịch bản đồng nhân mới dựa trên ý tưởng của người dùng: "${aiSupport.fanficUserIdea}".\n${aiSupport.fanficNsfw ? 'Lưu ý: Người dùng yêu cầu tích hợp các yếu tố 18+ (đam dục, bạo lực) một cách tinh tế và phù hợp với nguyên tác.' : ''}${authorInstruction}${coreMemoryInstruction}${currencyInstruction}`;
    }

    const generatedData = await generatePrimaryWorldDetails(analysisPrompt);

    return {
        analysisData: fanficAnalysisData,
        worldDetails: generatedData,
    };
}


// Type for the data needed to generate initial game elements (addons)
type InitialElementsData = Pick<GameSetupData, 'world' | 'character' | 'aiSupport'>;

/**
 * Generates the initial set of skills, items, NPCs, etc., based on the established world.
 * @param data The established world, character, and story context.
 * @returns The generated initial addons, or null on failure.
 */
export async function generateInitialGameElements(data: InitialElementsData): Promise<{ initialAddons: InitialAddons } | null> {
    const { world, character, aiSupport } = data;

    const isNsfw = aiSupport.genMode === 'original' ? aiSupport.originalNsfw : aiSupport.fanficNsfw;
    let nsfwInstruction = '';
    if (isNsfw) {
        nsfwInstruction = `\nLưu ý: Người dùng yêu cầu tích hợp các yếu tố 18+ (đam dục, bạo lực) một cách tinh tế. Hãy tạo ra các vật phẩm, kỹ năng, NPC có liên quan đến chủ đề này nếu phù hợp.`;
        if (character.gender === 'Nam') {
            nsfwInstruction += ` Đặc biệt, hãy tạo ra các NPC nữ có tiềm năng phát triển mối quan hệ lãng mạn/thân mật với nhân vật chính.`;
        } else if (character.gender === 'Nữ') {
            nsfwInstruction += ` Đặc biệt, hãy tạo ra các NPC nam có tiềm năng phát triển mối quan hệ lãng mạn/thân mật với nhân vật chính.`;
        }
    }

    const realmSystemString = (world.realmSystem || []).join(' - ');
    const realmMappingExplanation = `
Hệ thống cấp độ tuyệt đối được ánh xạ như sau:
- Cảnh giới "Phàm Nhân" (nếu có) luôn tương ứng với level 0.
- Cảnh giới tu luyện đầu tiên (ví dụ: Luyện Khí) kéo dài từ level 1 đến level 13. Tên hiển thị là "Tên Cảnh Giới Tầng X".
- Các cảnh giới tiếp theo (ví dụ: Trúc Cơ, Kim Đan...): Mỗi cảnh giới này tương ứng với 4 level, lần lượt là các kỳ: Sơ Kỳ, Trung Kỳ, Hậu Kỳ, Đại Viên Mãn.
- Ví dụ Mapping:
  - Phàm Nhân: level 0
  - Luyện Khí Tầng 1: level 1
  - ...
  - Luyện Khí Tầng 13: level 13
  - Trúc Cơ Sơ Kỳ: level 14
  - Trúc Cơ Trung Kỳ: level 15
  - ... và cứ thế tiếp tục.`;

    const itemCreationRules = `
# QUY TẮC TẠO VẬT PHẨM (RẤT QUAN TRỌNG):
- "rarity" (độ hiếm) PHẢI là một trong các giá trị sau: 'thường', 'hiếm', 'quý', 'sử thi', 'huyền thoại', 'thần thoại'.
- "itemType" là trường phân loại chính, chỉ có thể là một trong 3 giá trị: "Vật phẩm thường", "Trang bị", "Nhiệm vụ".
- Nếu "itemType" là "Trang bị":
  - "type" (loại trang bị) PHẢI là một trong các giá trị tiếng Anh sau: 'weapon', 'magic', 'cloak', 'armor', 'helmet', 'gloves', 'boots', 'accessory'.
  - PHẢI có "equipmentDetails" với "position". "position" PHẢI là giá trị tiếng Việt tương ứng với "type". Ví dụ: nếu type='weapon' thì position='Vũ khí'; nếu type='armor' thì position='Giáp'.
- Nếu "itemType" là "Vật phẩm thường":
  - "type" (loại vật phẩm) PHẢI là một trong các giá trị tiếng Anh sau: 'pill', 'herb', 'book', 'material', 'ore', 'rune', 'other'.
  - Nếu "type" là "pill", PHẢI có trường "pillType" là một trong: "Hồi Phục", "Cải tạo", "Bí Đan".
- Nếu "itemType" là "Nhiệm vụ":
  - "type" PHẢI là "other".
  - "rarity", "quality", và "requiredLevel" không quan trọng, có thể để mặc định.
- "isConsumable" phải là \`true\` cho các vật phẩm có thể sử dụng như đan dược ("pill"), và \`false\` cho nguyên liệu ("material", "herb", "ore").
- "isEquippedAtStart" chỉ nên là \`true\` cho một vài trang bị cơ bản nhất (tối đa 1-2 món).
- Hãy tạo ra một sự đa dạng hợp lý về các loại vật phẩm.

# QUY TẮC VỀ CHỈ SỐ, HIỆU ỨNG VÀ CẤP ĐỘ (BẮT BUỘC TUÂN THỦ):
- Mọi vật phẩm (trừ "Nhiệm vụ") PHẢI có trường "requiredLevel". Đây là yêu cầu BẮT BUỘC.
- Để xác định "requiredLevel":
  1. Chọn một cảnh giới phù hợp cho vật phẩm (ví dụ: "Trúc Cơ Trung Kỳ").
  2. Dựa vào hệ thống cảnh giới và logic ánh xạ đã cung cấp để tính ra cấp độ tuyệt đối tương ứng (ví dụ: Trúc Cơ Trung Kỳ = level 15).
  3. Gán con số đó vào "requiredLevel".
- **QUY TẮC CÂN BẰNG CHỈ SỐ (CỰC KỲ QUAN TRỌNG):** Các chỉ số ("stats", "equipmentDetails.stats") và hiệu ứng ("effects") của vật phẩm PHẢI tương xứng với cả ba yếu tố: "requiredLevel", "rarity" (độ hiếm), và "quality" (phẩm chất).
- **Logic So Sánh:**
  - **Cùng requiredLevel:** Vật phẩm có "rarity"/"quality" cao hơn sẽ có chỉ số cao hơn và/hoặc có hiệu ứng đặc biệt.
  - **Khác requiredLevel:** "requiredLevel" là yếu tố quyết định sức mạnh CƠ BẢN. Một vật phẩm 'thường' (rarity) yêu cầu cảnh giới cao (ví dụ: Hóa Thần) sẽ có chỉ số cơ bản cao hơn RẤT NHIỀU so với một vật phẩm 'huyền thoại' (rarity) yêu cầu cảnh giới thấp (ví dụ: Luyện Khí).
- **Ví dụ để học:**
  - *Hoàng Phẩm Thiết Kiếm* (quality: 5, rarity: 'thường', requiredLevel tương ứng Luyện Khí) có thể có stats: "atk:15".
  - *Nhân Phẩm Long Huyết Kiếm* (quality: 1, rarity: 'huyền thoại', requiredLevel tương ứng Luyện Khí) có thể có stats: "atk:20" và effects: "Gây hiệu ứng Thiêu Đốt". Sức mạnh chỉ nhỉnh hơn một chút nhưng có hiệu ứng đặc biệt.
  - *Nhân Phẩm Thiết Kiếm* (quality: 1, rarity: 'thường', requiredLevel tương ứng Nguyên Anh) phải có stats: "atk:150", cao hơn hẳn hai kiếm trên.
- **Gợi ý công thức tính toán sức mạnh:** Ngươi có thể tham khảo công thức sau để tạo chỉ số cân bằng: \`Chỉ số cơ bản = (Hệ số Cấp Độ Yêu Cầu) * (1 + (Hệ số Phẩm chất / 10) + (Hệ số Độ hiếm / 5))\`. Trong đó, Hệ số Cấp Độ Yêu Cầu tăng mạnh theo cấp. Hãy dựa vào công thức này để tạo ra các chỉ số cân bằng.
- Đối với "Trang bị", PHẢI điền vào "equipmentDetails.stats" các chỉ số phù hợp.
- Đối với "Vật phẩm thường" có thể sử dụng (đan dược, phù chú), PHẢI điền vào "stats" các hiệu ứng tương ứng.

# QUY TẮC NGHIÊM CẤM:
- **KHÔNG BAO GIỜ** tạo ra bất kỳ vật phẩm nào có tên chứa từ "Linh thạch". "Linh thạch" là tiền tệ, không phải là vật phẩm trong túi đồ.`;

    const contextPrompt = `Dựa trên bối cảnh thế giới và nhân vật đã được xác định sau, hãy tạo ra các yếu tố khởi đầu (kỹ năng, vật phẩm, NPC...) một cách logic và phù hợp.
# BỐI CẢNH ĐÃ XÁC ĐỊNH:
- THẾ GIỚI:
  - Bối cảnh: ${world.setting}
  - Phong cách: ${world.style}
  - Hệ thống cảnh giới: ${realmSystemString}
  - ${realmMappingExplanation}
  - Tiền tệ: ${world.currencies.join(', ')}
- NHÂN VẬT:
  - Tên: ${character.name}
  - Giới tính: ${character.gender}
  - Cảnh giới bắt đầu: ${character.startingRealm}
  - Tiểu sử: ${character.background}
  - Mục tiêu: ${character.goal}
- CỐT TRUYỆN:
  - Chế độ: ${aiSupport.genMode === 'original' ? 'Truyện gốc' : 'Đồng nhân'}
  - Ý tưởng chính: ${aiSupport.genMode === 'original' ? aiSupport.originalStoryIdea : `Truyện "${aiSupport.fanficSourceTitle}" - ${aiSupport.fanficUserIdea}`}
${nsfwInstruction}
${itemCreationRules}
`;

    return await generateInitialAddons(contextPrompt);
}