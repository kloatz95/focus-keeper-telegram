// src/App.js - Полный код приложения
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Plus, Settings, BarChart3, FolderPlus, Clock, Target, Zap, Trash2 } from 'lucide-react';

const FocusKeeperApp = () => {
  const [currentView, setCurrentView] = useState('timer');
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Веб-разработка',
      color: '#6366f1',
      subprojects: [
        { id: 11, name: 'React приложение', timeSpent: 1200 },
        { id: 12, name: 'API интеграция', timeSpent: 800 }
      ],
      totalTime: 2000
    },
    {
      id: 2,
      name: 'Изучение языков',
      color: '#10b981',
      subprojects: [
        { id: 21, name: 'Английский', timeSpent: 900 },
        { id: 22, name: 'Немецкий', timeSpent: 600 }
      ],
      totalTime: 1500
    }
  ]);
  
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSubproject, setSelectedSubproject] = useState(null);
  const [timerSettings, setTimerSettings] = useState({
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4
  });
  
  const [timerState, setTimerState] = useState({
    timeLeft: 25 * 60,
    isRunning: false,
    mode: 'focus',
    sessionsCompleted: 0
  });
  
  const [newProjectName, setNewProjectName] = useState('');
  const [newSubprojectName, setNewSubprojectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewSubproject, setShowNewSubproject] = useState(false);
  
  const intervalRef = useRef(null);

  // Telegram Web App integration
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#1a1a2e');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
      
      tg.MainButton.setText('Начать фокус');
      tg.MainButton.onClick(() => {
        if (selectedProject && selectedSubproject && !timerState.isRunning) {
          toggleTimer();
        }
      });
      
      if (selectedProject && selectedSubproject && currentView === 'timer') {
        tg.MainButton.show();
      } else {
        tg.MainButton.hide();
      }

      tg.BackButton.onClick(() => {
        if (currentView !== 'timer') {
          setCurrentView('timer');
        }
      });

      if (currentView !== 'timer') {
        tg.BackButton.show();
      } else {
        tg.BackButton.hide();
      }

      const addHapticFeedback = () => {
        if (tg.HapticFeedback) {
          tg.HapticFeedback.impactOccurred('medium');
        }
      };

      document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', addHapticFeedback);
      });

      return () => {
        document.querySelectorAll('button').forEach(button => {
          button.removeEventListener('click', addHapticFeedback);
        });
      };
    }
  }, [currentView, selectedProject, selectedSubproject, timerState.isRunning]);

  useEffect(() => {
    if (timerState.isRunning && timerState.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (timerState.timeLeft === 0) {
      handleTimerComplete();
    } else {
      clearInterval(intervalRef.current);
    }
    
    return () => clearInterval(intervalRef.current);
  }, [timerState.isRunning, timerState.timeLeft]);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      if (timerState.isRunning) {
        tg.MainButton.setText('Пауза');
        tg.MainButton.color = '#ef4444';
      } else if (selectedProject && selectedSubproject) {
        tg.MainButton.setText('Начать фокус');
        tg.MainButton.color = '#6366f1';
      }
      
      if (selectedProject && selectedSubproject && currentView === 'timer') {
        tg.MainButton.show();
      } else {
        tg.MainButton.hide();
      }
    }
  }, [timerState.isRunning, selectedProject, selectedSubproject, currentView]);
  
  const handleTimerComplete = () => {
    setTimerState(prev => ({ ...prev, isRunning: false }));
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    
    if (timerState.mode === 'focus') {
      const newSessions = timerState.sessionsCompleted + 1;
      const nextMode = newSessions % timerSettings.sessionsUntilLongBreak === 0 ? 'longBreak' : 'shortBreak';
      const nextTime = nextMode === 'longBreak' ? timerSettings.longBreak : timerSettings.shortBreak;
      
      setTimerState(prev => ({
        ...prev,
        mode: nextMode,
        timeLeft: nextTime * 60,
        sessionsCompleted: newSessions
      }));
      
      if (selectedProject && selectedSubproject) {
        updateProjectTime(selectedProject.id, selectedSubproject.id, timerSettings.focusTime * 60);
      }
    } else {
      setTimerState(prev => ({
        ...prev,
        mode: 'focus',
        timeLeft: timerSettings.focusTime * 60
      }));
    }
  };
  
  const updateProjectTime = (projectId, subprojectId, timeToAdd) => {
    setProjects(prev => prev.map(project => {
      if (project.id === projectId) {
        const updatedSubprojects = project.subprojects.map(sub => 
          sub.id === subprojectId 
            ? { ...sub, timeSpent: sub.timeSpent + timeToAdd }
            : sub
        );
        const newTotalTime = updatedSubprojects.reduce((sum, sub) => sum + sub.timeSpent, 0);
        return { ...project, subprojects: updatedSubprojects, totalTime: newTotalTime };
      }
      return project;
    }));
  };
  
  const toggleTimer = () => {
    setTimerState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };
  
  const resetTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      timeLeft: timerSettings.focusTime * 60,
      mode: 'focus'
    }));
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}ч ${mins}м`;
    }
    return `${mins}м`;
  };
  
  const getTimerColor = () => {
    switch (timerState.mode) {
      case 'focus': return 'from-indigo-500 to-purple-600';
      case 'shortBreak': return 'from-emerald-500 to-teal-600';
      case 'longBreak': return 'from-amber-500 to-orange-600';
      default: return 'from-indigo-500 to-purple-600';
    }
  };
  
  const getTimerText = () => {
    switch (timerState.mode) {
      case 'focus': return 'Фокус';
      case 'shortBreak': return 'Короткий перерыв';
      case 'longBreak': return 'Длинный перерыв';
      default: return 'Фокус';
    }
  };
  
  const addProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: Date.now(),
        name: newProjectName,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        subprojects: [],
        totalTime: 0
      };
      setProjects(prev => [...prev, newProject]);
      setNewProjectName('');
      setShowNewProject(false);
    }
  };
  
  const addSubproject = () => {
    if (newSubprojectName.trim() && selectedProject) {
      const newSubproject = {
        id: Date.now(),
        name: newSubprojectName,
        timeSpent: 0
      };
      setProjects(prev => prev.map(project => 
        project.id === selectedProject.id 
          ? { ...project, subprojects: [...project.subprojects, newSubproject] }
          : project
      ));
      setNewSubprojectName('');
      setShowNewSubproject(false);
    }
  };
  
  const deleteProject = (projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
      setSelectedSubproject(null);
    }
  };
  
  const deleteSubproject = (projectId, subprojectId) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { 
            ...project, 
            subprojects: project.subprojects.filter(sub => sub.id !== subprojectId),
            totalTime: project.subprojects
              .filter(sub => sub.id !== subprojectId)
              .reduce((sum, sub) => sum + sub.timeSpent, 0)
          }
        : project
    ));
    if (selectedSubproject?.id === subprojectId) {
      setSelectedSubproject(null);
    }
  };

  const renderTimer = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent mb-2">
            Focus Keeper
          </h1>
          <p className="text-purple-200">Достигайте больше с методом Pomodoro</p>
        </div>

        {selectedProject && selectedSubproject && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
              <div 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: selectedProject.color }}
              ></div>
              <span className="text-lg font-medium">
                {selectedProject.name} → {selectedSubproject.name}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-center mb-12">
          <div className="relative">
            <div className={`w-80 h-80 rounded-full bg-gradient-to-br ${getTimerColor()} p-2 shadow-2xl shadow-purple-500/20`}>
              <div className="w-full h-full rounded-full bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="text-6xl font-mono font-bold mb-4">
                  {formatTime(timerState.timeLeft)}
                </div>
                <div className="text-xl text-purple-300 mb-2">
                  {getTimerText()}
                </div>
                <div className="text-sm text-purple-400">
                  Сессия {timerState.sessionsCompleted + 1}
                </div>
              </div>
            </div>
            
            <div className="absolute inset-0">
              <svg className="w-80 h-80 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2"
                />
                <circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${288.88 * (1 - timerState.timeLeft / (timerSettings.focusTime * 60))} 288.88`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-6 mb-8">
          <button
            onClick={toggleTimer}
            className={`w-16 h-16 rounded-full bg-gradient-to-r ${getTimerColor()} shadow-lg shadow-purple-500/30 flex items-center justify-center hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
          >
            {timerState.isRunning ? <Pause size={28} /> : <Play size={28} />}
          </button>
          <button
            onClick={resetTimer}
            className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
          >
            <Square size={24} />
          </button>
        </div>

        {!selectedProject && (
          <div className="text-center">
            <p className="text-purple-300 mb-4">Выберите проект для начала:</p>
            <button
              onClick={() => setCurrentView('projects')}
              className="inline-flex items-center bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
            >
              <Target className="mr-2" size={20} />
              Выбрать проект
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Проекты</h2>
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 rounded-full flex items-center hover:from-emerald-600 hover:to-teal-700 transition-all duration-300"
          >
            <Plus size={20} className="mr-2" />
            Новый проект
          </button>
        </div>

        {showNewProject && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-4">Создать новый проект</h3>
            <div className="flex space-x-4">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Название проекта"
                className="flex-1 bg-white/10 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500"
                onKeyPress={(e) => e.key === 'Enter' && addProject()}
              />
              <button
                onClick={addProject}
                className="bg-emerald-500 px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Создать
              </button>
              <button
                onClick={() => {
                  setShowNewProject(false);
                  setNewProjectName('');
                }}
                className="bg-gray-600 px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          {projects.map(project => (
            <div key={project.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div 
                    className="w-6 h-6 rounded-full mr-4"
                    style={{ backgroundColor: project.color }}
                  ></div>
                  <div>
                    <h3 className="text-xl font-semibold">{project.name}</h3>
                    <p className="text-white/70">
                      Общее время: {formatDuration(project.totalTime)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {project.subprojects.map(subproject => (
                  <div key={subproject.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div className="flex items-center">
                      <span className="font-medium">{subproject.name}</span>
                      <span className="text-white/60 text-sm ml-3">
                        {formatDuration(subproject.timeSpent)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setSelectedSubproject(subproject);
                          setCurrentView('timer');
                        }}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1 rounded-full text-sm hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
                      >
                        Начать
                      </button>
                      <button
                        onClick={() => deleteSubproject(project.id, subproject.id)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {showNewSubproject === project.id ? (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newSubprojectName}
                    onChange={(e) => setNewSubprojectName(e.target.value)}
                    placeholder="Название подпроекта"
                    className="flex-1 bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:border-emerald-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setSelectedProject(project);
                        addSubproject();
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      setSelectedProject(project);
                      addSubproject();
                    }}
                    className="bg-emerald-500 px-4 py-2 rounded-lg text-sm hover:bg-emerald-600 transition-colors"
                  >
                    Добавить
                  </button>
                  <button
                    onClick={() => {
                      setShowNewSubproject(false);
                      setNewSubprojectName('');
                    }}
                    className="bg-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewSubproject(project.id)}
                  className="w-full bg-white/5 border-2 border-dashed border-white/30 rounded-lg p-3 text-white/70 hover:bg-white/10 hover:border-white/50 transition-all duration-300"
                >
                  <Plus size={20} className="inline mr-2" />
                  Добавить подпроект
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 text-white pb-20">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Статистика</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Всего сессий</p>
                <p className="text-3xl font-bold text-emerald-400">{timerState.sessionsCompleted}</p>
              </div>
              <Zap className="text-emerald-400" size={32} />
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Общее время</p>
                <p className="text-3xl font-bold text-blue-400">
                  {formatDuration(projects.reduce((sum, p) => sum + p.totalTime, 0))}
                </p>
              </div>
              <Clock className="text-blue-400" size={32} />
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Активных проектов</p>
                <p className="text-3xl font-bold text-purple-400">{projects.length}</p>
              </div>
              <Target className="text-purple-400" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold mb-6">Время по проектам</h3>
          <div className="space-y-4">
            {projects.map(project => (
              <div key={project.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: project.color }}
                  ></div>
                  <span className="font-medium">{project.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatDuration(project.totalTime)}</p>
                  <p className="text-sm text-white/60">{project.subprojects.length} подпроектов</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 text-white pb-20">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Настройки</h2>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold mb-6">Настройки таймера</h3>
          
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Время фокуса (минуты)</label>
              <input
                type="number"
                value={timerSettings.focusTime}
                onChange={(e) => setTimerSettings(prev => ({ ...prev, focusTime: parseInt(e.target.value) || 25 }))}
                className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                min="1"
                max="120"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Короткий перерыв (минуты)</label>
              <input
                type="number"
                value={timerSettings.shortBreak}
                onChange={(e) => setTimerSettings(prev => ({ ...prev, shortBreak: parseInt(e.target.value) || 5 }))}
                className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                min="1"
                max="30"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Длинный перерыв (минуты)</label>
              <input
                type="number"
                value={timerSettings.longBreak}
                onChange={(e) => setTimerSettings(prev => ({ ...prev, longBreak: parseInt(e.target.value) || 15 }))}
                className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                min="1"
                max="60"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Сессий до длинного перерыва</label>
              <input
                type="number"
                value={timerSettings.sessionsUntilLongBreak}
                onChange={(e) => setTimerSettings(prev => ({ ...prev, sessionsUntilLongBreak: parseInt(e.target.value) || 4 }))}
                className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                min="2"
                max="10"
              />
            </div>
          </div>
          
          <button
            onClick={() => {
              setTimerState(prev => ({
                ...prev,
                timeLeft: timerSettings.focusTime * 60,
                isRunning: false,
                mode: 'focus'
              }));
            }}
            className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-600 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-300"
          >
            Применить настройки
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {currentView === 'timer' && renderTimer()}
      {currentView === 'projects' && renderProjects()}
      {currentView === 'stats' && renderStats()}
      {currentView === 'settings' && renderSettings()}

      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-white/10">
        <div className="flex justify-around py-3">
          <button
            onClick={() => setCurrentView('timer')}
            className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${
              currentView === 'timer' 
                ? 'text-purple-400 bg-purple-400/20' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Clock size={24} />
            <span className="text-xs mt-1">Таймер</span>
          </button>
          
          <button
            onClick={() => setCurrentView('projects')}
            className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${
              currentView === 'projects' 
                ? 'text-indigo-400 bg-indigo-400/20' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            <FolderPlus size={24} />
            <span className="text-xs mt-1">Проекты</span>
          </button>
          
          <button
            onClick={() => setCurrentView('stats')}
            className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${
              currentView === 'stats' 
                ? 'text-emerald-400 bg-emerald-400/20' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BarChart3 size={24} />
            <span className="text-xs mt-1">Статистика</span>
          </button>
          
          <button
            onClick={() => setCurrentView('settings')}
            className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${
              currentView === 'settings' 
                ? 'text-orange-400 bg-orange-400/20' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Settings size={24} />
            <span className="text-xs mt-1">Настройки</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusKeeperApp;