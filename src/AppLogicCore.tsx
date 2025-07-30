import {
    GameSetupData,
    Item,
    Skill
} from './types';
import { ALL_AVATAR_TAGS, SYSTEM_HEAVENLY_RULES } from './constants';

export const resolveAIDecision = (value: string | undefined, fallbackTextForAI: string) => {
    if (!value || value.trim().toLowerCase() === 'ai quyết định' || value.trim() === '') {
        return fallbackTextForAI;
    }
    return `"${value}"`;
};

export const buildInitialPrompt = (setupData: GameSetupData, detailedSkills: Skill[], initialItems: Item[]): string => {
    const initialTraitsForAIString = [
        ...detailedSkills.map(s => `Loại: 'Kỹ năng', Tên: "${s.name}", Mô tả: "${s.description}", Type: "${s.type}", manaCost: ${s.manaCost}, cooldown: ${s.cooldown}, effect: "${s.effect}"`),
        ...initialItems.map(i => `Loại: 'Vật phẩm', Tên: "${i.name}", Mô tả: "${i.description}"`)
    ].join('; ') || 'Không có';

    const initialWorldElementsString = [
        ...setupData.initialAddons.npcs.map(n => `NPC: ${n.name} (Giới tính: ${n.gender})`),
        ...setupData.initialAddons.locations.map(l => `Địa điểm: ${l.name}`),
        ...setupData.initialAddons.factions.map(f => `Phe phái: ${f.name}`),
        ...setupData.initialAddons.lore.map(l => `Tri thức: ${l.title}`)
    ].join('; ') || 'Không có';

    const isNsfw = setupData.aiSupport.genMode === 'original' ? setupData.aiSupport.originalNsfw : setupData.aiSupport.fanficNsfw;
    let nsfwInstruction = isNsfw
        ? 'ĐÃ BẬT (Chỉ Gemini). Ngươi ĐƯỢỢC PHÉP và ĐƯỢC KHUYẾN KHÍCH mô tả các cảnh 18+ với phong cách truyện 18+, các đại từ chỉ bộ phận sinh dục sẽ được ẩn dụ thành cu tức là dương vật và lồn tức là âm đạo và là vú, ngoài ra đa dạng sử dụng ngôn từ biểu thị bộ phận sinh dục sao cho hấp dẫn và tự nhiên nhất, như dương vật, cặc, đầu khấc, hòn dái, bi, âm vật, lỗ đít, lỗ hậu, tử cung, bầu ngực..., và cảnh quan hệ được nói một cách nghệ thuật, các cảnh máu me giết chóc cũng sẽ nói trực diện. các cảnh máu me Không cần dùng thẻ [KOBOLD_NSFW_PROMPT].'
        : 'ĐÃ TẮT. Tránh xa các chủ đề nhạy cảm.';

    if (isNsfw) {
        if (setupData.character.gender === 'Nam') {
            nsfwInstruction += ' Vì nhân vật chính là Nam, hãy ưu tiên phát triển các tình tiết lãng mạn hoặc thân mật với các NPC nữ trong phân cảnh mở đầu và các lựa chọn.';
        } else if (setupData.character.gender === 'Nữ') {
            nsfwInstruction += ' Vì nhân vật chính là Nữ, hãy ưu tiên phát triển các tình tiết lãng mạn hoặc thân mật với các NPC nam trong phân cảnh mở đầu và các lựa chọn.';
        }
    }

    const playerPersonalityInstruction = resolveAIDecision(undefined, 'Tính cách nhân vật chính: (Do AI quyết định). YÊU CẦU QUAN TRỌNG: Ngươi PHẢI chọn một tính cách phù hợp cho nhân vật từ danh sách có sẵn (ví dụ: "Lạnh lùng & Quyết đoán", "Hài hước & Lạc quan",...) và thông báo nó bằng một thẻ duy nhất: [PERSONALITY_DEFINED: "Tên tính cách đã chọn"]');
    const characterGoalInstruction = resolveAIDecision(setupData.character.goal, "Nhân vật không có mục tiêu/động lực cụ thể ban đầu. Hãy để câu chuyện tự nhiên phát triển hoặc tạo ra một động lực ban đầu dựa trên tình huống khởi đầu.");
    
    const coreMemoryString = setupData.initialCoreMemory && setupData.initialCoreMemory.length > 0
        ? setupData.initialCoreMemory.map(r => `        - ${r}`).join('\n')
        : '        - Không có quy tắc nào.';


    if (setupData.aiSupport.genMode === 'fanfiction') {
        const systemRulesString = SYSTEM_HEAVENLY_RULES.map(r => `            - ${r}`).join('\n');
        return `
            **CHỈ DẪN CHO AI: CHẾ ĐỘ SÁNG TÁC ĐỒNG NHÂN (FANFICTION)**
            Ngươi là một người kể chuyện bậc thầy, đang sáng tác một bộ truyện Đồng Nhân (Fanfiction) dựa trên một tác phẩm gốc.
            
            **THÔNG TIN BỐI CẢNH (BẤT DI BẤT DỊCH):**
            - Tác phẩm gốc: "${setupData.aiSupport.fanficSourceTitle}"
            - Tóm tắt cốt truyện gốc và các quy tắc thế giới (dùng làm nguồn tham khảo chính): 
            ---
            ${setupData.aiSupport.fanficSummary || 'Không có tóm tắt chi tiết. Hãy dựa vào tên truyện và kiến thức của bạn.'}
            ---
            - Quy tắc NSFW: ${nsfwInstruction}

            **Ý TƯỞNG CỦA NGƯỜI DÙNG CHO CÂU CHUYỆN ĐỒNG NHÂN:**
            - Nhân vật chính: ${setupData.character.name}
            - Giới tính: ${setupData.character.gender}
            - Tiểu sử: ${resolveAIDecision(setupData.character.background, '(Do AI quyết định dựa trên ý tưởng đồng nhân)')}
            - Mục tiêu: ${resolveAIDecision(setupData.character.goal, '(Do AI quyết định dựa trên ý tưởng đồng nhân)')}
            - Ý tưởng chính của câu chuyện đồng nhân: "${setupData.aiSupport.fanficUserIdea}"

            **LUẬT LỆ CỦA THIÊN ĐẠO (BẮT BUỘC TUÂN THỦ):**
${systemRulesString}
${setupData.aiSupport.authorName ? `            - **VĂN PHONG (QUAN TRỌNG):** Ngươi PHẢI viết theo văn phong của tác giả '${setupData.aiSupport.authorName}'. TUYỆT ĐỐI không được nhắc đến tên tác giả trong lời kể.` : ''}
            1.  **NHẤT QUÁN VỚI NGUYÊN TÁC:** Các sự kiện, nhân vật, địa danh, và quy tắc trong thế giới phải nhất quán với thông tin từ tóm tắt cốt truyện gốc. Các nhân vật phụ từ nguyên tác phải hành xử đúng với tính cách của họ.
            2.  **TẬP TRUNG VÀO Ý TƯỞNG MỚI:** Câu chuyện phải xoay quanh nhân vật chính (${setupData.character.name}) và ý tưởng đồng nhân do người dùng cung cấp. Các sự kiện trong nguyên tác chỉ là bối cảnh.
            3.  **BẮT ĐẦU CÂU CHUYỆN:** Hãy viết một đoạn văn mở đầu, giới thiệu nhân vật chính (${setupData.character.name}) và tình huống khởi đầu của họ dựa trên "Ý tưởng chính của câu chuyện đồng nhân". **KHÔNG BAO GIỜ được viết tiêu đề cho câu chuyện.** Bắt đầu thẳng vào phần kể chuyện.
            4.  **QUY TẮC VỀ TAG:** Vẫn sử dụng các thẻ lệnh [STATS_UPDATE], [ITEM_ACQUIRED]... như bình thường để cập nhật trạng thái, vật phẩm, kỹ năng... cho nhân vật.
            5.  **QUY TẮC VỀ DANH TÍNH (TUYỆT ĐỐI KHÔNG VI PHẠM):**
                - Nhân vật có tên "${setupData.character.name}" chính là NHÂN VẬT CHÍNH do người chơi điều khiển.
                - Các thực thể được liệt kê trong "(${initialWorldElementsString})" là các cá nhân RIÊNG BIỆT, KHÔNG PHẢI là người chơi.
                - NGHIÊM CẤM nhầm lẫn người chơi với bất kỳ NPC nào trong danh sách.
            
            Sau khi viết xong đoạn mở đầu, hãy tạo ra 4 lựa chọn hành động đầu tiên cho người chơi.
            QUY TẮC VỀ ĐỊNH DẠNG LỰA CHỌN (BẮT BUỘC):
                - Mỗi lựa chọn PHẢI bắt đầu bằng một con số và dấu chấm (ví dụ: "1.", "2.").
                - Toàn bộ nội dung của MỘT lựa chọn, bao gồm cả mô tả, tỷ lệ thành công, và hậu quả, PHẢI được đặt trên CÙNG MỘT DÒNG.
                - Ví dụ định dạng tốt: 1. Khám phá khu rừng (Tỷ lệ thành công: Cao. Hậu quả: Tìm thấy thảo dược quý).
        `;
    }

    const systemRulesString = SYSTEM_HEAVENLY_RULES.map(r => `        - ${r}`).join('\n');
    const heavenlyRulesPromptSection = `
        **LUẬT LỆ THIÊN ĐẠO (BẮT BUỘC TUÂN THỦ):**
${systemRulesString}
`;

    // Default to original story
    return `
        **CHỈ DẪN CHO AI: CHẾ ĐỘ SÁNG TÁC TRUYỆN GỐC**
        Bạn là một Đại Năng kể chuyện, chuyên sáng tác tiểu thuyết mạng tiếng Việt, thể loại '${setupData.world.style}'. Nhiệm vụ của bạn là khởi tạo một thế giới sống động và bắt đầu cuộc hành trình cho nhân vật chính.

        **THÔNG TIN BỐI CẢNH:**
        - Chủ đề: ${setupData.world.style}
        - Bối cảnh: ${setupData.world.setting}
        - Thời Gian Hiện Tại: Ngày 1, Sáng sớm
        - Độ khó: ${setupData.world.difficulty || 'Bình thường'}
        - Nhân vật chính:
            - Tên: ${setupData.character.name}
            - Giới tính: ${setupData.character.gender}
            - Sơ lược: ${resolveAIDecision(setupData.character.background, '(Do AI quyết định)')}
        - Tính cách & Mục tiêu:
            - ${playerPersonalityInstruction}
            - ${characterGoalInstruction}
        - Quy tắc NSFW: ${nsfwInstruction}
        
        **BỘ NHỚ CỐT LÕI (Không bao giờ quên):**
${coreMemoryString}

        **NHIỆM VỤ CỦA BẠN:**
${heavenlyRulesPromptSection}
${setupData.aiSupport.authorName ? `        - **VĂN PHONG (QUAN TRỌNG):** Ngươi PHẢI viết theo văn phong của tác giả '${setupData.aiSupport.authorName}'. TUYỆT ĐỐI không được nhắc đến tên tác giả trong lời kể.` : ''}
        1.  **VIẾT PHÂN CẢNH MỞ ĐẦU:** Dựa vào tất cả thông tin bối cảnh, hãy viết một đoạn văn mở đầu thật hấp dẫn.
            - **QUAN TRỌNG:** **KHÔNG BAO GIỜ được viết tiêu đề cho câu chuyện.** Bắt đầu thẳng vào phần kể chuyện.
            - Đoạn văn phải thể hiện rõ tính cách và mục tiêu của nhân vật qua hành động, suy nghĩ hoặc lời thoại đầu tiên.
            - Nếu có "Các thực thể ban đầu trong thế giới" (${initialWorldElementsString}), hãy giới thiệu chúng một cách tự nhiên vào câu chuyện.
            
        2.  **SỬ DỤNG THẺ LỆNH (TAGS):** Trong quá trình viết, hãy sử dụng các thẻ lệnh sau để thiết lập trạng thái ban đầu cho game. Các thẻ này phải được đặt ở đầu phản hồi của bạn.
            - **Xác định vị trí:** Ngay khi giới thiệu địa điểm đầu tiên, dùng thẻ: [SET_LOCATION: name="Tên địa điểm bắt đầu"]. Đây là thẻ bắt buộc.
            - **Giới thiệu NPC:** [LORE_NPC: name="Tên", description="Mô tả", gender="Nam/Nữ", ...].
            - **Giới thiệu vật phẩm trong lore:** [LORE_KNOWLEDGE: title="Tên vật phẩm", content="Mô tả"].
            - **Trao vật phẩm ban đầu:** Với TỪNG vật phẩm trong danh sách (${initialItems.map(i => `"${i.name}"`).join(', ')}), hãy dùng thẻ [ITEM_ACQUIRED: name="${"Tên vật phẩm"}", ...].
            - **Dạy kỹ năng ban đầu:** Với TỪNG kỹ năng trong danh sách (${detailedSkills.map(s => `"${s.name}"`).join(', ')}), hãy dùng thẻ [SKILL_ACQUIRED: name="${"Tên kỹ năng"}", ...].

        3.  **ĐƯA RA LỰA CHỌN:** Kết thúc phản hồi bằng 4 lựa chọn hành động rõ ràng, đa dạng, phù hợp với tình huống mở đầu.
             QUY TẮC VỀ ĐỊNH DẠNG LỰA CHỌN (BẮT BUỘC):
                - Mỗi lựa chọn PHẢI bắt đầu bằng một con số và dấu chấm (ví dụ: "1.", "2.").
                - Toàn bộ nội dung của MỘT lựa chọn, bao gồm cả mô tả, tỷ lệ thành công, và hậu quả, PHẢI được đặt trên CÙNG MỘT DÒNG.
                - Ví dụ định dạng tốt: 1. Thử đột phá (50% thành công, thất bại có thể bị tẩu hỏa nhập ma).

        **QUY TẮC CHUNG:**
        - **Thời gian:** Sau khi mô tả, ước lượng thời gian đã trôi qua và dùng thẻ [TIME_UPDATE: minutesPassed=X].
        - **Danh tính:** Nhân vật có tên "${setupData.character.name}" là người chơi. KHÔNG được nhầm lẫn với các NPC khác.

        Bây giờ, hãy bắt đầu.
    `;
};