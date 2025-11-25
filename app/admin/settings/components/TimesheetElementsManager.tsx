'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Check, X } from 'lucide-react';

interface TimesheetElement {
  id: number;
  title: string;
  key: string;
  employeeText: string;
  displayOrder: number;
  active: boolean;
}

interface TimesheetElementsManagerProps {
  elements: TimesheetElement[];
  onElementsChange: (elements: TimesheetElement[]) => void;
}

export default function TimesheetElementsManager({ elements, onElementsChange }: TimesheetElementsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingElement, setEditingElement] = useState<Partial<TimesheetElement>>({});
  const [newElement, setNewElement] = useState({
    title: '',
    key: '',
    employeeText: '',
    displayOrder: 1
  });

  const generateKey = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .trim();
  };

  const addElement = () => {
    if (newElement.title.trim() && newElement.employeeText.trim()) {
      const maxOrder = Math.max(...elements.map(el => el.displayOrder), 0);
      const elementToAdd: TimesheetElement = {
        ...newElement,
        id: Date.now(),
        key: newElement.key || generateKey(newElement.title),
        displayOrder: maxOrder + 1,
        active: true
      };
      onElementsChange([...elements, elementToAdd]);
      setNewElement({ title: '', key: '', employeeText: '', displayOrder: 1 });
      setShowForm(false);
    }
  };

  const startEditing = (element: TimesheetElement) => {
    setEditingId(element.id);
    setEditingElement(element);
  };

  const saveEdit = () => {
    if (editingElement.title?.trim() && editingElement.employeeText?.trim()) {
      onElementsChange(elements.map(el =>
        el.id === editingId ? { 
          ...el, 
          title: editingElement.title!.trim(),
          key: editingElement.key || generateKey(editingElement.title!),
          employeeText: editingElement.employeeText!.trim()
        } : el
      ));
    }
    setEditingId(null);
    setEditingElement({});
  };

  const moveElement = (id: number, direction: 'up' | 'down') => {
    const sortedElements = [...elements].sort((a, b) => a.displayOrder - b.displayOrder);
    const currentIndex = sortedElements.findIndex(el => el.id === id);
    
    if (
      (direction === 'up' && currentIndex > 0) ||
      (direction === 'down' && currentIndex < sortedElements.length - 1)
    ) {
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const currentElement = sortedElements[currentIndex];
      const targetElement = sortedElements[targetIndex];
      
      onElementsChange(elements.map(el => {
        if (el.id === currentElement.id) {
          return { ...el, displayOrder: targetElement.displayOrder };
        }
        if (el.id === targetElement.id) {
          return { ...el, displayOrder: currentElement.displayOrder };
        }
        return el;
      }));
    }
  };

  const toggleActive = (id: number) => {
    onElementsChange(elements.map(el =>
      el.id === id ? { ...el, active: !el.active } : el
    ));
  };

  const deleteElement = (id: number) => {
    onElementsChange(elements.filter(el => el.id !== id));
  };

  const sortedElements = [...elements].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-8">
      {/* Add New Element Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Adaugă Opțiune Pontaj</h2>
            <p className="text-sm text-neutral-600 mt-1">Creează noi opțiuni pentru pontajul angajaților</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adaugă Opțiune
            </button>
          )}
        </div>
        
        {showForm && (
          <div className="bg-neutral-50 p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-2">
                  Titlu Opțiune *
                </label>
                <input
                  type="text"
                  id="title"
                  value={newElement.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setNewElement({
                      ...newElement, 
                      title,
                      key: generateKey(title)
                    });
                  }}
                  placeholder="ex: Prezență, Update PR, Meeting"
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="key" className="block text-sm font-medium text-neutral-700 mb-2">
                  Cheia Câmp *
                </label>
                <input
                  type="text"
                  id="key"
                  value={newElement.key}
                  onChange={(e) => setNewElement({...newElement, key: e.target.value})}
                  placeholder="ex: present, update_pr, meeting"
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-neutral-500 mt-1">Se generează automat din titlu</p>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="employeeText" className="block text-sm font-medium text-neutral-700 mb-2">
                  Text pentru Angajați *
                </label>
                <input
                  type="text"
                  id="employeeText"
                  value={newElement.employeeText}
                  onChange={(e) => setNewElement({...newElement, employeeText: e.target.value})}
                  placeholder="ex: Am fost prezent în această zi, Am completat sarcinile"
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-neutral-500 mt-1">Textul afișat angajaților lângă checkbox</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={addElement}
                disabled={!newElement.title.trim() || !newElement.employeeText.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Adaugă Opțiunea
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setNewElement({ title: '', key: '', employeeText: '', displayOrder: 1 });
                }}
                className="btn-secondary"
              >
                Anulează
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Elements Management */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Gestionare Opțiuni</h2>
            <p className="text-sm text-neutral-600 mt-1">
              {elements.filter(el => el.active).length} din {elements.length} opțiuni active
            </p>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary flex items-center gap-2"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Ascunde Preview' : 'Arată Preview'}
          </button>
        </div>
        
        <div className="space-y-3">
          {sortedElements.map((element, index) => (
            <div key={element.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                {/* Order Controls */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded font-mono">
                    #{element.displayOrder}
                  </span>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveElement(element.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveElement(element.id, 'down')}
                      disabled={index === sortedElements.length - 1}
                      className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                
                {/* Active Toggle */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={element.active}
                    onChange={() => toggleActive(element.id)}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                </div>
                
                {/* Element Content */}
                {editingId === element.id ? (
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Titlu</label>
                        <input
                          type="text"
                          value={editingElement.title || ''}
                          onChange={(e) => setEditingElement({
                            ...editingElement, 
                            title: e.target.value,
                            key: generateKey(e.target.value)
                          })}
                          className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Cheie</label>
                        <input
                          type="text"
                          value={editingElement.key || ''}
                          onChange={(e) => setEditingElement({...editingElement, key: e.target.value})}
                          className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">Text Angajați</label>
                      <input
                        type="text"
                        value={editingElement.employeeText || ''}
                        onChange={(e) => setEditingElement({...editingElement, employeeText: e.target.value})}
                        className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={!editingElement.title?.trim() || !editingElement.employeeText?.trim()}
                        className="p-2 text-success-600 hover:bg-success-50 rounded disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingElement({});
                        }}
                        className="p-2 text-neutral-600 hover:bg-neutral-50 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-medium ${element.active ? 'text-neutral-900' : 'text-neutral-500'}`}>
                        {element.title}
                        {element.active && <span className="ml-2 text-xs bg-success-100 text-success-700 px-2 py-1 rounded-full">Activ</span>}
                      </h4>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditing(element)}
                          className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteElement(element.id)}
                          className="p-2 text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-neutral-600 space-y-1">
                      <p><span className="font-medium">Cheie:</span> <code className="bg-neutral-100 px-1 rounded">{element.key}</code></p>
                      <p><span className="font-medium">Text angajați:</span> {element.employeeText}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {sortedElements.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            <p>Nu există opțiuni de pontaj configurate.</p>
            <p className="text-sm">Adaugă prima opțiune folosind formularul de mai sus.</p>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Previzualizare Pontaj Angajat</h2>
          <div className="bg-neutral-50 p-6 rounded-lg">
            <h3 className="font-medium text-neutral-900 mb-4">Opțiunile vor apărea astfel pentru angajați:</h3>
            <div className="space-y-3">
              {sortedElements.filter(el => el.active).map((element) => (
                <label key={element.id} className="flex items-center gap-3 p-3 bg-white rounded border hover:shadow-sm transition-shadow cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    disabled
                  />
                  <span className="text-sm text-neutral-700">{element.employeeText}</span>
                </label>
              ))}
            </div>
            {sortedElements.filter(el => el.active).length === 0 && (
              <p className="text-neutral-500 text-sm italic">Nu există opțiuni active pentru pontaj.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}