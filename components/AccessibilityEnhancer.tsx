
import React, { useState } from 'react';
import { AccessibilitySettings } from '../types';
import { AccessibilityIcon, CloseIcon, SpeakerIcon, PlusIcon, MinusIcon } from './Icons';

interface AccessibilityEnhancerProps {
  settings: AccessibilitySettings;
  setSettings: React.Dispatch<React.SetStateAction<AccessibilitySettings>>;
}

const AccessibilityEnhancer: React.FC<AccessibilityEnhancerProps> = ({ settings, setSettings }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleFontSizeChange = (direction: 'increase' | 'decrease') => {
    setSettings(prev => ({
      ...prev,
      fontSize: direction === 'increase' ? Math.min(prev.fontSize + 2, 24) : Math.max(prev.fontSize - 2, 12),
    }));
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const speakPageContent = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any previous speech
      const mainContent = document.querySelector('main')?.innerText || 'No content to read.';
      const utterance = new SpeechSynthesisUtterance(mainContent);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Your browser does not support text-to-speech.");
    }
  };

  return (
    <>
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 bg-brand-light-blue text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-blue-600 transition-transform transform hover:scale-110"
        aria-label="Open Accessibility Panel"
      >
        <AccessibilityIcon />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleOpen}></div>
      )}

      <div
        className={`fixed bottom-24 right-6 bg-brand-dark-blue border border-brand-border rounded-lg shadow-2xl p-6 w-80 z-50 transition-transform transform ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Accessibility Enhancer</h3>
          <button onClick={toggleOpen} className="text-gray-400 hover:text-white">
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-4">
          {/* Font Size */}
          <div>
            <label className="block text-gray-300 mb-2">Font Size</label>
            <div className="flex items-center gap-2">
              <button onClick={() => handleFontSizeChange('decrease')} className="p-2 bg-brand-dark rounded-md hover:bg-brand-border"><MinusIcon/></button>
              <span className="flex-grow text-center text-white">{settings.fontSize}px</span>
              <button onClick={() => handleFontSizeChange('increase')} className="p-2 bg-brand-dark rounded-md hover:bg-brand-border"><PlusIcon /></button>
            </div>
          </div>

          {/* High Contrast */}
          <div className="flex justify-between items-center">
            <label className="text-gray-300">High Contrast</label>
            <button
              onClick={toggleHighContrast}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                settings.highContrast ? 'bg-brand-light-blue' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                  settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Text to Speech */}
          <button
            onClick={speakPageContent}
            className="w-full bg-brand-cyan text-white font-semibold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-colors duration-300 flex items-center justify-center gap-2"
          >
            <SpeakerIcon />
            Read Page Aloud
          </button>
        </div>
      </div>
    </>
  );
};

export default AccessibilityEnhancer;
