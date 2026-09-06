// src/components/admin/PriorityCalculator.jsx
import React, { useState, useEffect } from 'react';
import { PriorityBadge } from '../common/PriorityBadge';
import { Calculator, ShieldAlert, Users, AlertTriangle } from 'lucide-react';

export const PriorityCalculator = ({
  initialSeverity = 'Medium',
  initialSafety = 'Moderate',
  initialPeople = 'Classroom (30-60 people)',
  onPriorityCalculated
}) => {
  const [severity, setSeverity] = useState(initialSeverity);
  const [safety, setSafety] = useState(initialSafety);
  const [people, setPeople] = useState(initialPeople);
  const [calculatedPriority, setCalculatedPriority] = useState('Medium');
  const [score, setScore] = useState(4.5);

  useEffect(() => {
    let currentScore = 0;
    if (severity === 'High') currentScore += 3;
    else if (severity === 'Medium') currentScore += 2;
    else currentScore += 1;

    if (safety === 'Hazardous') currentScore += 3;
    else if (safety === 'Moderate') currentScore += 1.5;
    else currentScore += 0;

    if (people.includes('Entire')) currentScore += 3;
    else if (people.includes('Floor')) currentScore += 2;
    else if (people.includes('Classroom')) currentScore += 1.5;
    else currentScore += 1;

    setScore(currentScore);

    let priority = 'Low';
    if (currentScore >= 7) priority = 'Urgent';
    else if (currentScore >= 5) priority = 'High';
    else if (currentScore >= 3.5) priority = 'Medium';

    setCalculatedPriority(priority);
    if (onPriorityCalculated) {
      onPriorityCalculated(priority, { severity, safetyImpact: safety, peopleAffected: people, score: currentScore });
    }
  }, [severity, safety, people]);

  return (
    <div
      style={{
        backgroundColor: 'var(--navy-50)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        marginBottom: '20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)' }}>
          <Calculator size={16} color="var(--primary)" />
          <span>Impact-Based Priority Matrix</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Score: {score}/9</span>
          <PriorityBadge priority={calculatedPriority} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {/* Severity */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--navy-700)', marginBottom: 4 }}>
            Technical Severity
          </label>
          <select
            className="select-field"
            style={{ fontSize: '12px', padding: '6px 8px' }}
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="Low">Low (Cosmetic/Minor)</option>
            <option value="Medium">Medium (Functional)</option>
            <option value="High">High (Critical failure)</option>
          </select>
        </div>

        {/* Safety Impact */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--navy-700)', marginBottom: 4 }}>
            Safety Risk Level
          </label>
          <select
            className="select-field"
            style={{ fontSize: '12px', padding: '6px 8px' }}
            value={safety}
            onChange={(e) => setSafety(e.target.value)}
          >
            <option value="None">None (No hazard)</option>
            <option value="Moderate">Moderate (Slip/Trip/Discomfort)</option>
            <option value="Hazardous">Hazardous (Active danger)</option>
          </select>
        </div>

        {/* People Affected */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--navy-700)', marginBottom: 4 }}>
            Population Impact
          </label>
          <select
            className="select-field"
            style={{ fontSize: '12px', padding: '6px 8px' }}
            value={people}
            onChange={(e) => setPeople(e.target.value)}
          >
            <option value="Individual (<5 people)">Individual (&lt; 5)</option>
            <option value="Classroom (30-60 people)">Classroom (30-60)</option>
            <option value="Floor (100+ students)">Floor (100+)</option>
            <option value="Entire Block (500+ students)">Entire Block (500+)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
