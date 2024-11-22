import React, { useState } from 'react';
import { Focus, Paperclip, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MainContentProps {
  isCollapsed: boolean;
}

export default function MainContent({ isCollapsed }: MainContentProps) {
  const [question, setQuestion] = useState('');
  const [isPro, setIsPro] = useState(false);
  const navigate = useNavigate();

  const handleSearch = () => {
    if (question.trim()) {
      navigate(`/search?q=${encodeURIComponent(question.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-8 py-12 mt-20">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-medium mb-6 animate-fade-in text-center">
            <span className="text-[#0095FF]">AI</span>
            <span className="text-white"> - Web Search</span>
          </h1>

          <div className="relative w-full">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-[#222222] text-white rounded-xl p-4 pr-32 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-[#0095FF] border border-gray-800 placeholder-gray-500"
              placeholder="Ask anything..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />

            {/* Bottom row with icons and buttons */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              {/* Left-side icons */}
              <div className="flex items-center gap-2">
                <button className="text-gray-400 hover:text-[#0095FF] transition-colors p-2 rounded-lg hover:bg-[#333333]">
                  <Focus size={18} />
                </button>
                <button className="text-gray-400 hover:text-[#0095FF] transition-colors p-2 rounded-lg hover:bg-[#333333]">
                  <Paperclip size={18} />
                </button>
              </div>

              {/* Right-side controls */}
              <div className="flex items-center gap-2">
                {/* Toggle Switch */}
                <button
                  onClick={() => setIsPro(!isPro)}
                  className="w-12 h-7 bg-[#333333] rounded-full relative cursor-pointer transition-colors border border-[#0095FF]"
                >
                  <div
                    className={`absolute top-1 left-1 w-5 h-5 bg-[#0095FF] rounded-full transition-transform duration-200 ${
                      isPro ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Arrow Button */}
                <button
                  onClick={handleSearch}
                  className="bg-[#0095FF] text-white p-2 rounded-lg hover:bg-[#0080FF] transition-colors"
                  disabled={!question.trim()}
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}