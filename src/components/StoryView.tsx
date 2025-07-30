import React, { useRef, useEffect } from 'react';
import { GameState, EntityType } from '../types';
import Button from './shared/Button';
import InteractiveTextRenderer from './shared/InteractiveTextRenderer';

interface StoryViewProps {
  gameState: GameState;
  onPlayerAction: (action: string, sourceType: 'choice' | 'custom') => void;
  isLoading: boolean;
  onShowTooltip: (type: EntityType, entityName: string, position: { x: number; y: number }) => void;
}

const StoryView: React.FC<StoryViewProps> = ({ gameState, onPlayerAction, isLoading, onShowTooltip }) => {
    const { storyLog, currentChoices } = gameState;
    const [customAction, setCustomAction] = React.useState('');
    const logEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the latest message
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [storyLog, isLoading]);

    const handleCustomActionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customAction.trim() && !isLoading) {
            onPlayerAction(customAction.trim(), 'custom');
            setCustomAction('');
        }
    };

    const handleChoiceClick = (choice: string) => {
        onPlayerAction(choice, 'choice');
    };

    return (
        <div className="story-view-container">
            <div className="story-log">
                {storyLog.map((entry) => (
                    <div key={entry.id} className={`story-bubble-${entry.type}-container`}>
                        <div className={`story-bubble-${entry.type}`}>
                           <InteractiveTextRenderer
                                text={entry.text}
                                gameState={gameState}
                                onShowTooltip={onShowTooltip}
                            />
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="typing-indicator-container">
                        <div className="typing-indicator">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                        </div>
                    </div>
                )}
                <div ref={logEndRef} />
            </div>

            <div className="input-area">
                {currentChoices.length > 0 && !isLoading && (
                    <div className="choices-grid">
                        {currentChoices.map((choice, index) => (
                            <Button
                                key={index}
                                variant="secondary"
                                onClick={() => handleChoiceClick(choice)}
                                disabled={isLoading}
                            >
                                <InteractiveTextRenderer 
                                    text={choice} 
                                    gameState={gameState} 
                                    onShowTooltip={onShowTooltip} 
                                />
                            </Button>
                        ))}
                    </div>
                )}
                <div className="custom-action-container">
                    <div className="turn-counter">
                        Lượt: {gameState.turn}
                    </div>
                    <form onSubmit={handleCustomActionSubmit} className="custom-action-form">
                        <input
                            type="text"
                            value={customAction}
                            onChange={(e) => setCustomAction(e.target.value)}
                            placeholder="Hoặc tự do hành động..."
                            className="form-input"
                            disabled={isLoading}
                        />
                        <Button type="submit" isLoading={isLoading} disabled={!customAction.trim()}>
                            Gửi
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StoryView;
