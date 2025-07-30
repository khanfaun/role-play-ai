import React, { useState, ChangeEvent } from 'react';
import { StorySummaryEntry } from '../../types';
import Button from '../shared/Button';
import { SYSTEM_HEAVENLY_RULES } from '../../constants';


interface ManagementModalProps {
    // Journal props
    summaries: StorySummaryEntry[];
    onUpdateSummary: (summaryId: number, newText: string) => void;
    onDeleteSummary: (summaryId: number) => void;
    // Core Memory props
    coreMemory: string[];
    onUpdateMemory: (rules: string[]) => void;
    // Heavenly Dao props
    dynamicRules: string[];
    onUpdateRules: (rules: string[]) => void;
}

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

// Reusable Form Component, moved locally to fix module resolution error
const InputField: React.FC<{ label: string, value: string | number, onChange: (e: ChangeEvent<HTMLInputElement>) => void, placeholder: string, type?: string, disabled?: boolean, name?: string, onBlur?: () => void, className?: string }> = 
    ({ label, value, onChange, placeholder, type = 'text', disabled = false, name, onBlur, className }) => (
    <div className={`form-field ${className || ''}`}>
        <label htmlFor={name}>{label}</label>
        <input id={name} type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className="form-input" name={name} onBlur={onBlur} />
    </div>
);

const JournalTab: React.FC<Pick<ManagementModalProps, 'summaries' | 'onUpdateSummary' | 'onDeleteSummary'>> = ({ summaries, onUpdateSummary, onDeleteSummary }) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');

    const handleStartEditing = (summary: StorySummaryEntry) => {
        setEditingId(summary.id);
        setEditingText(summary.summary);
    };
    const handleSaveEdit = () => {
        if (editingId !== null) onUpdateSummary(editingId, editingText);
        setEditingId(null);
        setEditingText('');
    };
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingText('');
    };

    const sortedSummaries = [...summaries].sort((a, b) => b.turn - a.turn);

    return (
        <div className="summary-list">
            {sortedSummaries.length > 0 ? (
                sortedSummaries.map(summary => (
                    <div key={summary.id} className="summary-item">
                        {editingId === summary.id ? (
                            <div className="summary-edit-form">
                                <div className="summary-header"><span className="summary-turn">Lượt {summary.turn}</span></div>
                                <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} className="form-textarea" rows={3} autoFocus />
                                <div className="rule-edit-actions">
                                    <Button variant="secondary" onClick={handleCancelEdit}>Hủy</Button>
                                    <Button variant="primary" onClick={handleSaveEdit}>Lưu</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="summary-header">
                                    <span className="summary-turn">Lượt {summary.turn}</span>
                                    <div className="rule-actions">
                                        <button onClick={() => handleStartEditing(summary)} className="rule-action-btn edit" aria-label="Sửa"><EditIcon /></button>
                                        <button onClick={() => onDeleteSummary(summary.id)} className="rule-action-btn delete" aria-label="Xóa"><DeleteIcon /></button>
                                    </div>
                                </div>
                                <p className="summary-text">{summary.summary}</p>
                            </>
                        )}
                    </div>
                ))
            ) : (
                <p className="empty-text">Chưa có tóm tắt nào được ghi lại.</p>
            )}
        </div>
    );
};

const CoreMemoryTab: React.FC<Pick<ManagementModalProps, 'coreMemory' | 'onUpdateMemory'>> = ({ coreMemory, onUpdateMemory }) => {
    const [newRule, setNewRule] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');

    const handleAddRule = () => {
        if (newRule.trim()) { onUpdateMemory([...coreMemory, newRule.trim()]); setNewRule(''); }
    };
    const handleDeleteRule = (index: number) => { onUpdateMemory(coreMemory.filter((_, i) => i !== index)); };
    const handleStartEditing = (index: number, text: string) => { setEditingIndex(index); setEditingText(text); };
    const handleSaveEdit = () => {
        if (editingIndex !== null && editingText.trim()) {
            const updatedRules = [...coreMemory];
            updatedRules[editingIndex] = editingText.trim();
            onUpdateMemory(updatedRules);
        }
        setEditingIndex(null); setEditingText('');
    };
    const handleCancelEdit = () => { setEditingIndex(null); setEditingText(''); };

    return (
        <div className="rules-section">
            {coreMemory.length > 0 ? (
                <ul className="rules-list">
                    {coreMemory.map((rule, index) => (
                        <li key={`core-${index}`} className="rule-item dynamic-rule">
                            {editingIndex === index ? (
                                <div className="rule-edit-form">
                                    <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} className="form-input" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }} />
                                    <div className="rule-edit-actions">
                                        <Button variant="secondary" onClick={handleCancelEdit}>Hủy</Button>
                                        <Button variant="primary" onClick={handleSaveEdit}>Lưu</Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="rule-text">{rule}</p>
                                    <div className="rule-actions">
                                        <button onClick={() => handleStartEditing(index, rule)} className="rule-action-btn edit" aria-label="Sửa"><EditIcon /></button>
                                        <button onClick={() => handleDeleteRule(index)} className="rule-action-btn delete" aria-label="Xóa"><DeleteIcon /></button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="empty-text">Chưa có quy tắc cốt lõi nào. Hãy thêm vào những luật lệ bất biến của thế giới bạn!</p>
            )}
            <div className="add-rule-form">
                <InputField label="Thêm quy tắc cốt lõi mới" name="new-core-rule" value={newRule} onChange={(e) => setNewRule(e.target.value)} placeholder="Ví dụ: Nhân vật chính không bao giờ phản bội bằng hữu..." />
                <Button onClick={handleAddRule} disabled={!newRule.trim()}>Thêm</Button>
            </div>
        </div>
    );
};

const HeavenlyDaoTab: React.FC<Pick<ManagementModalProps, 'dynamicRules' | 'onUpdateRules'>> = ({ dynamicRules, onUpdateRules }) => {
    const [newRule, setNewRule] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');

    const handleAddRule = () => {
        if (newRule.trim()) { onUpdateRules([...dynamicRules, newRule.trim()]); setNewRule(''); }
    };
    const handleDeleteRule = (index: number) => { onUpdateRules(dynamicRules.filter((_, i) => i !== index)); };
    const handleStartEditing = (index: number, text: string) => { setEditingIndex(index); setEditingText(text); };
    const handleSaveEdit = () => {
        if (editingIndex !== null && editingText.trim()) {
            const updatedRules = [...dynamicRules];
            updatedRules[editingIndex] = editingText.trim();
            onUpdateRules(updatedRules);
        }
        setEditingIndex(null); setEditingText('');
    };
    const handleCancelEdit = () => { setEditingIndex(null); setEditingText(''); };

    return (
        <>
            <div className="rules-section">
                <h3 className="rules-section-title">Quy Tắc Hệ Thống (Bất biến)</h3>
                <ul className="rules-list">
                    {SYSTEM_HEAVENLY_RULES.map((rule, index) => (
                        <li key={`system-${index}`} className="rule-item system-rule"><p className="rule-text">{rule}</p></li>
                    ))}
                </ul>
            </div>
            <div className="rules-section">
                <h3 className="rules-section-title">Quy Tắc Người Chơi (Tùy chỉnh)</h3>
                {dynamicRules.length > 0 ? (
                    <ul className="rules-list">
                        {dynamicRules.map((rule, index) => (
                            <li key={`dynamic-${index}`} className="rule-item dynamic-rule">
                                {editingIndex === index ? (
                                    <div className="rule-edit-form">
                                        <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} className="form-input" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}/>
                                        <div className="rule-edit-actions">
                                            <Button variant="secondary" onClick={handleCancelEdit}>Hủy</Button>
                                            <Button variant="primary" onClick={handleSaveEdit}>Lưu</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="rule-text">{rule}</p>
                                        <div className="rule-actions">
                                            <button onClick={() => handleStartEditing(index, rule)} className="rule-action-btn edit" aria-label="Sửa"><EditIcon /></button>
                                            <button onClick={() => handleDeleteRule(index)} className="rule-action-btn delete" aria-label="Xóa"><DeleteIcon /></button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="empty-text">Chưa có quy tắc nào do người chơi thêm.</p>
                )}
                <div className="add-rule-form">
                    <InputField label="Thêm quy tắc mới" name="new-rule" value={newRule} onChange={(e) => setNewRule(e.target.value)} placeholder="Nhập nội dung quy tắc..." />
                    <Button onClick={handleAddRule} disabled={!newRule.trim()}>Thêm Quy Tắc</Button>
                </div>
            </div>
        </>
    );
};

const ManagementModal: React.FC<ManagementModalProps> = (props) => {
    type Tab = 'journal' | 'coreMemory' | 'heavenlyDao';
    const [activeTab, setActiveTab] = useState<Tab>('journal');
    
    return (
        <div className="view-container">
            <h2 className="view-header">Quản Lý AI</h2>
            <div className="view-filters">
                <button onClick={() => setActiveTab('journal')} className={`filter-button ${activeTab === 'journal' ? 'active' : ''}`}>Nhật Ký</button>
                <button onClick={() => setActiveTab('coreMemory')} className={`filter-button ${activeTab === 'coreMemory' ? 'active' : ''}`}>Bộ Nhớ Cốt Lõi</button>
                <button onClick={() => setActiveTab('heavenlyDao')} className={`filter-button ${activeTab === 'heavenlyDao' ? 'active' : ''}`}>Thiên Đạo</button>
            </div>
            <div className="rules-content-view">
                {activeTab === 'journal' && <JournalTab {...props} />}
                {activeTab === 'coreMemory' && <CoreMemoryTab {...props} />}
                {activeTab === 'heavenlyDao' && <HeavenlyDaoTab {...props} />}
            </div>
        </div>
    );
};

export default ManagementModal;