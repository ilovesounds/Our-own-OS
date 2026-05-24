import React, { useState } from 'react';

export default function PrompterTab({ setActiveTab, setSystemLogs }) {
  const [input, setInput] = useState('');
  const [consoleLines, setConsoleLines] = useState([
    'KERNEL :: PrompterOS Booted Successfully.',
    'Ready for natural language intent...'
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Print the user's typed command locally to the screen
    setConsoleLines(prev => [...prev, `user >> ${input}`]);
    const userPrompt = input;
    setInput('');

    try {
      setConsoleLines(prev => [...prev, 'KERNEL PARSER :: Analyzing intent...']);
      
      // 2. Send the prompt to your Python FastAPI backend
      const response = await fetch('http://127.0.0.1:8000/api/parse-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      });
      
      const data = await response.json();
      
      // 3. Print the resulting JSON Action Schema to the terminal
      setConsoleLines(prev => [
        ...prev, 
        `ACTION SCHEMA GENERATED :: ${data.action_type}`,
        `TARGET :: ${data.target}`,
        'HANDING OFF TO DEVFACTORY KERNEL...'
      ]);

      // [Optional] Automatically jump the user to the DevFactory tab to watch it run
      setTimeout(() => setActiveTab('devfactory'), 1500);

    } catch (error) {
      setConsoleLines(prev => [...prev, 'KERNEL ERROR :: Failed to connect to parser backend.']);
    }
  };

  return (
    <div className="bg-black text-green-400 font-mono p-6 rounded-lg h-[500px] flex flex-col justify-between border border-green-900 shadow-lg shadow-green-900/20">
      {/* Scrollable Console Output */}
      <div className="overflow-y-auto space-y-2 flex-grow mb-4">
        {consoleLines.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap">{line}</div>
        ))}
      </div>

      {/* Input Form Prompt */}
      <form onSubmit={handleSubmit} className="flex items-center border-t border-green-900 pt-4">
        <span className="text-green-500 mr-2 font-bold">&gt;&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Speak your intent (e.g., 'Scaffold a Python sorting script')..."
          className="bg-transparent text-green-400 focus:outline-none flex-grow font-mono caret-green-500"
          autoFocus
        />
      </form>
    </div>
  );
}