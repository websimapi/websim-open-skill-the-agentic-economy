import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, GitFork, DollarSign, Activity, Search, Plus, User, Shield, Zap, MessageSquare, ChevronRight } from 'lucide-react';
import { DataManager } from './data.js';
import { AgentSystem } from './agent.js';

const dataManager = new DataManager();

// --- Components ---

const FocusMeter = ({ amount, max = 500, size = "md" }) => {
    const percentage = Math.min((amount / max) * 100, 100);
    const isHot = percentage > 80;
    
    return (
        <div className={`relative ${size === 'lg' ? 'w-full h-4' : 'w-24 h-2'} bg-gray-800 rounded-full overflow-hidden`}>
            <div 
                className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${isHot ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-neon-blue to-neon-purple'}`}
                style={{ width: `${percentage}%` }}
            />
            {isHot && (
                <div className="absolute top-0 left-0 w-full h-full animate-pulse bg-white opacity-20"></div>
            )}
        </div>
    );
};

const SkillCard = ({ skill, onClick }) => {
    return (
        <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-panel-bg border border-border-color rounded-xl p-6 cursor-pointer hover:border-neon-blue transition-colors group relative overflow-hidden"
            onClick={onClick}
        >
            <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="text-xs font-mono text-neon-green flex items-center gap-1">
                    <Activity size={14} />
                    Active
                </div>
            </div>
            
            <h3 className="text-xl font-bold mb-2 group-hover:text-neon-blue transition-colors">{skill.title}</h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2 h-10">{skill.description}</p>
            
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                    <img src={skill.authorAvatar} className="w-6 h-6 rounded-full border border-gray-600" alt={skill.author} />
                    <span className="text-xs text-gray-400 font-mono">@{skill.author}</span>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Focus Pool</div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-neon-green font-bold">${skill.focus_pool}</span>
                        <FocusMeter amount={skill.focus_pool} />
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </motion.div>
    );
};

const ChatInterface = ({ skill }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: `Greetings. I am the autonomous manager for ${skill.title}. Current Focus Pool is $${skill.focus_pool}. How can I assist you with the roadmap today?` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const newMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setLoading(true);

        const response = await AgentSystem.chatWithSkillAgent([...messages, newMsg], skill);
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-[400px] bg-dark-bg border border-border-color rounded-lg overflow-hidden">
            <div className="p-3 bg-panel-bg border-b border-border-color flex justify-between items-center">
                <span className="font-mono text-sm text-neon-blue flex items-center gap-2">
                    <Cpu size={16} /> MANAGER_AGENT_v1.0
                </span>
                <span className="text-xs text-gray-500">Connected</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-blue-900/30 text-blue-100 border border-blue-800' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {loading && <div className="text-xs text-gray-500 animate-pulse font-mono ml-2">Processing logic...</div>}
            </div>
            <div className="p-3 bg-panel-bg border-t border-border-color flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about roadmap or features..."
                    className="flex-1 bg-dark-bg border border-border-color rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-blue font-mono"
                />
                <button onClick={handleSend} className="bg-neon-blue/20 hover:bg-neon-blue/40 text-neon-blue px-3 py-2 rounded transition-colors">
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

const CreateSkillModal = ({ onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [content, setContent] = useState('# My New Skill\n\nDescribe your agentic skill here...');
    const [generating, setGenerating] = useState(false);

    const handleSubmit = async () => {
        if (!title || !desc) return;
        setGenerating(true);
        
        // Simulate "Platform Audit"
        const analysis = await AgentSystem.analyzeSkill(content);
        
        const newSkill = {
            title,
            description: desc,
            content,
            tags: analysis.tags,
            audit: analysis,
            version: "1.0.0"
        };
        
        await dataManager.addSkill(newSkill);
        setGenerating(false);
        onSuccess();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-panel-bg border border-border-color rounded-xl w-full max-w-2xl p-6 shadow-2xl shadow-neon-blue/10"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Terminal className="text-neon-green" /> 
                        Deploy New Skill
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">&times;</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-mono text-gray-500 mb-1">SKILL_NAME</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-dark-bg border border-border-color rounded p-2 text-white focus:border-neon-green outline-none font-mono" placeholder="e.g. Legal Document Reviewer" />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-gray-500 mb-1">MANIFEST_DESCRIPTION</label>
                        <input value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-dark-bg border border-border-color rounded p-2 text-white focus:border-neon-green outline-none" placeholder="Short description for the marketplace" />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-gray-500 mb-1">SOURCE_CODE (.md)</label>
                        <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full h-48 bg-dark-bg border border-border-color rounded p-2 text-white font-mono text-sm focus:border-neon-green outline-none" />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded hover:bg-white/5 text-gray-300">Cancel</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={generating}
                        className="bg-neon-green text-black font-bold px-6 py-2 rounded hover:bg-green-400 disabled:opacity-50 flex items-center gap-2"
                    >
                        {generating ? <Activity className="animate-spin" size={18}/> : <Zap size={18}/>}
                        {generating ? 'Auditing...' : 'Deploy to Ledger'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const SkillDetail = ({ skill, onBack }) => {
    const [tipAmount, setTipAmount] = useState(10);
    const [showTipModal, setShowTipModal] = useState(false);

    const handleTip = async () => {
        const audio = new Audio('/tip_sound.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
        
        await dataManager.tipSkill(skill.author, skill.id, parseInt(tipAmount));
        setShowTipModal(false);
        // Optimistic update handled by subscriber, but we can force refresh if needed
    };

    const renderedMarkdown = DOMPurify.sanitize(marked.parse(skill.content || ''));

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <span className="text-xl">←</span> Back to Ledger
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-panel-bg border border-border-color rounded-xl p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{skill.title}</h1>
                                <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
                                    <span className="bg-gray-800 px-2 py-1 rounded">v{skill.version}</span>
                                    <span className="flex items-center gap-1"><GitFork size={14}/> {skill.maintainers.length} Maintainers</span>
                                    <span className="flex items-center gap-1"><Activity size={14}/> 98% Uptime</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500 mb-1">Total Focus</div>
                                <div className="text-3xl font-mono text-neon-green font-bold text-shadow-neon">${skill.focus_pool}</div>
                            </div>
                        </div>

                        <div className="border-t border-border-color my-6"></div>

                        <div className="markdown-body text-gray-300" dangerouslySetInnerHTML={{ __html: renderedMarkdown }}></div>
                    </div>

                    <div className="bg-panel-bg border border-border-color rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><GitFork size={18}/> Active Forks</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-dark-bg p-3 rounded border border-border-color hover:border-gray-600 transition-colors cursor-pointer">
                                <div>
                                    <div className="font-mono text-sm text-neon-blue">feature/semantic-search</div>
                                    <div className="text-xs text-gray-500">by @cyber_ninja • 2 days ago</div>
                                </div>
                                <div className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-900">Passed Audit</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Actions & Agent */}
                <div className="space-y-6">
                    <div className="bg-panel-bg border border-border-color rounded-xl p-6 sticky top-6">
                        <div className="mb-6">
                            <h3 className="text-sm font-mono text-gray-500 mb-2 uppercase">Funding Status</h3>
                            <FocusMeter amount={skill.focus_pool} size="lg" />
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>Dormant</span>
                                <span>Active</span>
                                <span>Trending</span>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <button 
                                onClick={() => setShowTipModal(!showTipModal)}
                                className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold py-3 rounded-lg shadow-lg shadow-neon-blue/20 hover:scale-[1.02] transition-transform flex justify-center items-center gap-2"
                            >
                                <DollarSign size={20} /> Fund This Focus
                            </button>
                            <button className="w-full bg-dark-bg border border-border-color text-gray-300 py-3 rounded-lg hover:bg-white/5 transition-colors flex justify-center items-center gap-2">
                                <GitFork size={20} /> Fork & Earn
                            </button>
                        </div>

                        {showTipModal && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="bg-dark-bg p-4 rounded-lg border border-border-color mb-6 overflow-hidden"
                            >
                                <div className="text-sm text-gray-400 mb-3">Amount to tip:</div>
                                <div className="flex gap-2 mb-3">
                                    {[5, 10, 50, 100].map(amt => (
                                        <button 
                                            key={amt}
                                            onClick={() => setTipAmount(amt)}
                                            className={`flex-1 py-2 rounded text-sm font-mono transition-colors ${tipAmount === amt ? 'bg-neon-green text-black font-bold' : 'bg-gray-800 hover:bg-gray-700'}`}
                                        >
                                            ${amt}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={handleTip}
                                    className="w-full bg-neon-green/20 text-neon-green py-2 rounded border border-neon-green/50 hover:bg-neon-green/30"
                                >
                                    Confirm Transaction
                                </button>
                            </motion.div>
                        )}

                        <div className="border-t border-border-color pt-6">
                            <h3 className="text-sm font-mono text-gray-500 mb-4 uppercase">Project Agent</h3>
                            <ChatInterface skill={skill} />
                        </div>
                    </div>

                    <div className="bg-panel-bg border border-border-color rounded-xl p-6">
                        <h3 className="text-sm font-mono text-gray-500 mb-4 uppercase">Maintainers</h3>
                        <div className="flex -space-x-2">
                            {skill.maintainers.map((m, i) => (
                                <div key={i} className="w-10 h-10 rounded-full bg-gray-700 border-2 border-panel-bg flex items-center justify-center text-xs font-bold" title={m}>
                                    {m[0].toUpperCase()}
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-panel-bg flex items-center justify-center text-xs text-gray-400">
                                +3
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main App ---

const App = () => {
    const [data, setData] = useState(null);
    const [view, setView] = useState('home'); // home, skill, profile
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        dataManager.init().then(() => {
            setData(dataManager.getData());
        });
        return dataManager.subscribe((newData) => setData(newData));
    }, []);

    if (!data) return (
        <div className="h-screen w-full flex items-center justify-center bg-dark-bg text-neon-blue font-mono animate-pulse">
            INITIALIZING_AGENT_LEDGER...
        </div>
    );

    const skills = dataManager.getAllSkills();

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-dark-bg/80 border-b border-border-color">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => { setView('home'); setSelectedSkill(null); }}
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-neon-blue to-neon-purple rounded flex items-center justify-center text-white font-bold">O</div>
                        <span className="font-bold text-xl tracking-tight text-white">Open<span className="text-neon-blue">Skill</span></span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 bg-panel-bg px-3 py-1.5 rounded-full border border-border-color text-xs font-mono text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
                            NETWORK_ONLINE
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-xs text-gray-500 font-mono">BALANCE</div>
                                <div className="text-neon-green font-bold font-mono">${data.me?.col4?.balance || 0}</div>
                            </div>
                            <img 
                                src={data.currentUser?.avatar_url || 'https://via.placeholder.com/40'} 
                                className="w-10 h-10 rounded-full border border-gray-600 cursor-pointer"
                                onClick={() => setView('profile')}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>
                {view === 'home' && (
                    <div className="max-w-7xl mx-auto px-4 py-8">
                        {/* Hero Section */}
                        <div className="mb-12 text-center py-10 relative overflow-hidden rounded-2xl border border-border-color bg-panel-bg">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://websim.ai/assets/images/grid.svg')] opacity-10"></div>
                            <div className="relative z-10">
                                <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-white">
                                    The Economic Infrastructure<br/>for the Agentic Era
                                </h1>
                                <p className="text-gray-400 max-w-2xl mx-auto mb-8 text-lg">
                                    Code is free. Focus is scarce. Tip maintainers to guarantee future-proofing.
                                </p>
                                <div className="flex justify-center gap-4">
                                    <button 
                                        onClick={() => setShowCreateModal(true)}
                                        className="bg-neon-blue text-black font-bold px-6 py-3 rounded-lg hover:bg-cyan-400 transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={20} /> Publish Skill
                                    </button>
                                    <button className="bg-dark-bg border border-border-color text-white px-6 py-3 rounded-lg hover:bg-white/5 transition-colors">
                                        View Documentation
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Search & Filter */}
                        <div className="flex flex-col md:flex-row gap-4 mb-8">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Search skills (e.g. 'Legal', 'Python', 'SEO')..." 
                                    className="w-full bg-panel-bg border border-border-color rounded-lg pl-10 pr-4 py-3 text-white focus:border-neon-blue focus:outline-none"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select className="bg-panel-bg border border-border-color rounded-lg px-4 py-3 text-gray-300 focus:outline-none">
                                    <option>Most Funded</option>
                                    <option>Newest</option>
                                    <option>Trending</option>
                                </select>
                            </div>
                        </div>

                        {/* Skills Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {skills.map(skill => (
                                <SkillCard 
                                    key={skill.id} 
                                    skill={skill} 
                                    onClick={() => {
                                        setSelectedSkill(skill);
                                        setView('skill');
                                    }} 
                                />
                            ))}
                        </div>
                        
                        {skills.length === 0 && (
                            <div className="text-center py-20 text-gray-500 font-mono">
                                NO_SKILLS_FOUND_ON_LEDGER
                                <br/><br/>
                                <button onClick={() => setShowCreateModal(true)} className="text-neon-blue underline">Deploy the first one</button>
                            </div>
                        )}
                    </div>
                )}

                {view === 'skill' && selectedSkill && (
                    <SkillDetail 
                        skill={selectedSkill} 
                        onBack={() => {
                            setView('home');
                            setSelectedSkill(null);
                        }} 
                    />
                )}

                {view === 'profile' && (
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <button onClick={() => setView('home')} className="mb-6 text-gray-400 hover:text-white">← Back</button>
                        <div className="bg-panel-bg border border-border-color rounded-xl p-8 mb-8">
                            <div className="flex items-center gap-6">
                                <img src={data.currentUser.avatar_url} className="w-24 h-24 rounded-full border-2 border-neon-blue" />
                                <div>
                                    <h1 className="text-3xl font-bold text-white">{data.currentUser.username}</h1>
                                    <p className="text-gray-400 mt-1">{data.me.col1.bio}</p>
                                    <div className="flex gap-4 mt-4 font-mono text-sm">
                                        <div className="flex items-center gap-1 text-neon-green">
                                            <Shield size={16}/> Lvl 4 Contributor
                                        </div>
                                        <div className="flex items-center gap-1 text-neon-purple">
                                            <Zap size={16}/> {data.me.col1.focus_capacity}% Capacity
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold mb-4 text-white">Transaction History</h2>
                        <div className="bg-panel-bg border border-border-color rounded-xl overflow-hidden">
                            {(data.me.col4.history || []).length === 0 ? (
                                <div className="p-6 text-center text-gray-500 font-mono">NO_TRANSACTIONS</div>
                            ) : (
                                <div className="divide-y divide-border-color">
                                    {[...(data.me.col4.history)].reverse().map((tx, i) => (
                                        <div key={i} className="p-4 flex justify-between items-center">
                                            <div>
                                                <div className="text-white font-medium">{tx.reason}</div>
                                                <div className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</div>
                                            </div>
                                            <div className={`font-mono font-bold ${tx.type === 'credit' ? 'text-neon-green' : 'text-red-400'}`}>
                                                {tx.type === 'credit' ? '+' : '-'}${tx.amount}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {showCreateModal && (
                <CreateSkillModal 
                    onClose={() => setShowCreateModal(false)} 
                    onSuccess={() => setShowCreateModal(false)} 
                />
            )}
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);