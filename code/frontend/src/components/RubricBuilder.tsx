/**
 * Rubric Builder Component
 * Allows teachers to create and edit grading rubrics with multiple criteria
 */

import { useState, useEffect } from 'react';
import { useRubricActions } from '../hooks/useRubric';
import type { Rubric, RubricCriterion } from '../services/rubricService';

interface RubricBuilderProps {
  rubric?: Rubric;
  activity_id?: number;
  onSave?: (rubric: Rubric) => void;
  onCancel?: () => void;
}

export default function RubricBuilder({ rubric, activity_id, onSave, onCancel }: RubricBuilderProps) {
  const [title, setTitle] = useState(rubric?.title || '');
  const [description, setDescription] = useState(rubric?.description || '');
  const [criteria, setCriteria] = useState<RubricCriterion[]>(rubric?.criteria || []);
  const [isActive, setIsActive] = useState(rubric?.is_active ?? true);
  
  const { create, update, loading, error } = useRubricActions();

  useEffect(() => {
    if (rubric) {
      setTitle(rubric.title);
      setDescription(rubric.description);
      setCriteria(rubric.criteria);
      setIsActive(rubric.is_active);
    }
  }, [rubric]);

  const addCriterion = () => {
    setCriteria([
      ...criteria,
      {
        name: '',
        description: '',
        max_points: 10,
        weight: 1.0,
        order: criteria.length,
      },
    ]);
  };

  const updateCriterion = (index: number, updates: Partial<RubricCriterion>) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };
    setCriteria(newCriteria);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const moveCriterion = (index: number, direction: 'up' | 'down') => {
    const newCriteria = [...criteria];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= criteria.length) return;
    
    [newCriteria[index], newCriteria[targetIndex]] = [newCriteria[targetIndex], newCriteria[index]];
    newCriteria.forEach((c, i) => c.order = i);
    
    setCriteria(newCriteria);
  };

  const calculateTotalPoints = () => {
    return criteria.reduce((sum, c) => sum + (c.max_points || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rubricData: Rubric = {
      title,
      description,
      activity_id,
      is_active: isActive,
      total_points: calculateTotalPoints(),
      criteria: criteria.map((c, i) => ({ ...c, order: i })),
    };

    try {
      const result = rubric?.id
        ? await update(rubric.id, rubricData)
        : await create(rubricData);
      
      if (onSave) onSave(result);
    } catch (err) {
      console.error('Failed to save rubric:', err);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h2>{rubric?.id ? 'Edit Rubric' : 'Create New Rubric'}</h2>
      
      {error && (
        <div style={{ padding: '10px', background: '#fee', border: '1px solid #fcc', borderRadius: '5px', marginBottom: '15px' }}>
          Error: {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>Rubric Information</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Title <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
              placeholder="e.g., Lab Report Rubric"
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px' }}
              placeholder="Optional description of this rubric"
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>Active (visible to students)</span>
            </label>
          </div>
        </div>

        {/* Criteria */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Grading Criteria</h3>
            <div>
              <strong>Total Points:</strong> {calculateTotalPoints()}
            </div>
          </div>

          {criteria.length === 0 && (
            <p style={{ padding: '15px', background: '#f9f9f9', borderRadius: '5px', textAlign: 'center' }}>
              No criteria added yet. Click "Add Criterion" to get started.
            </p>
          )}

          {criteria.map((criterion, index) => (
            <div
              key={index}
              style={{
                marginBottom: '15px',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                background: '#f9f9f9',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong>Criterion {index + 1}</strong>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    type="button"
                    onClick={() => moveCriterion(index, 'up')}
                    disabled={index === 0}
                    style={{ padding: '5px 10px' }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCriterion(index, 'down')}
                    disabled={index === criteria.length - 1}
                    style={{ padding: '5px 10px' }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCriterion(index)}
                    style={{ padding: '5px 10px', background: '#fee', border: '1px solid #fcc' }}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '14px' }}>
                    Name <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={criterion.name}
                    onChange={(e) => updateCriterion(index, { name: e.target.value })}
                    required
                    placeholder="e.g., Accuracy, Completeness, Clarity"
                    style={{ width: '100%', padding: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '14px' }}>
                    Max Points <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={criterion.max_points}
                    onChange={(e) => updateCriterion(index, { max_points: parseInt(e.target.value) || 0 })}
                    required
                    min="1"
                    style={{ width: '100%', padding: '6px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '3px', fontSize: '14px' }}>
                  Description
                </label>
                <textarea
                  value={criterion.description}
                  onChange={(e) => updateCriterion(index, { description: e.target.value })}
                  rows={2}
                  placeholder="What to look for in this criterion"
                  style={{ width: '100%', padding: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontSize: '14px' }}>
                  Weight (0.0 - 1.0)
                </label>
                <input
                  type="number"
                  value={criterion.weight}
                  onChange={(e) => updateCriterion(index, { weight: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                  min="0"
                  max="1"
                  style={{ width: '150px', padding: '6px' }}
                />
                <span style={{ marginLeft: '10px', fontSize: '13px', color: '#666' }}>
                  Optional: for weighted grading
                </span>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addCriterion}
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            + Add Criterion
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !title || criteria.length === 0}
            style={{
              padding: '10px 20px',
              background: loading ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Saving...' : rubric?.id ? 'Update Rubric' : 'Create Rubric'}
          </button>
        </div>
      </form>
    </div>
  );
}
