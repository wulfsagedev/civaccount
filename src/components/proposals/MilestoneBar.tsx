'use client';

import { MILESTONES, getCurrentMilestone, getNextMilestone } from '@/lib/proposals';

interface MilestoneBarProps {
  score: number;
}

export default function MilestoneBar({ score }: MilestoneBarProps) {
  const current = getCurrentMilestone(score);
  const next = getNextMilestone(score);
  const maxMilestone = MILESTONES[MILESTONES.length - 1].votes;

  // Progress as percentage of the highest milestone
  const progress = Math.min((score / maxMilestone) * 100, 100);

  return (
    <div className="mt-3">
      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-foreground/60 transition-all"
          style={{ width: `${progress}%` }}
        />
        {/* Milestone markers */}
        {MILESTONES.map((m) => (
          <div
            key={m.votes}
            className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-background ${
              score >= m.votes ? 'bg-foreground' : 'bg-muted-foreground/30'
            }`}
            style={{ left: `${(m.votes / maxMilestone) * 100}%`, transform: 'translate(-50%, -50%)' }}
          />
        ))}
      </div>

      {/* Label */}
      <p className="type-body-sm text-muted-foreground mt-1.5">
        {current ? (
          <span className="font-medium text-foreground">{current.label}</span>
        ) : next ? (
          <>{next.votes - score} more vote{next.votes - score !== 1 ? 's' : ''} to reach {next.label.toLowerCase()}</>
        ) : null}
      </p>
    </div>
  );
}
