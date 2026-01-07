"use client";

import { WorkoutConfig, formatTime, getTotalWorkoutTime } from "@/lib/presets";

interface PresetCardProps {
  preset: WorkoutConfig;
  onSelect: (preset: WorkoutConfig) => void;
  onUseAsTemplate?: (preset: WorkoutConfig) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  selected?: boolean;
}

export function PresetCard({
  preset,
  onSelect,
  onUseAsTemplate,
  onEdit,
  onDelete,
  selected
}: PresetCardProps) {
  const totalTime = getTotalWorkoutTime(preset);
  const hasActions = onUseAsTemplate || onEdit || onDelete;

  return (
    <button
      onClick={() => onSelect(preset)}
      className={`
        group relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-200
        ${
          selected
            ? "border-accent bg-accent/20 ring-4 ring-accent/40"
            : "border-border bg-card hover:border-accent/50 hover:bg-accent/5"
        }
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className={`text-lg font-semibold ${selected ? "text-accent" : "text-foreground"}`}>
          {preset.name}
        </h3>
        <span className={`text-xs font-mono px-2.5 py-1 rounded-full ${
          selected ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
        }`}>
          {formatTime(totalTime)}
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{preset.description}</p>

      <div className="flex gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-work" />
          <span className="text-foreground">{preset.workSeconds}s</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rest" />
          <span className="text-foreground">{preset.restSeconds}s</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">×</span>
          <span className="text-foreground">{preset.rounds}</span>
        </div>
        {preset.exerciseNames && preset.exerciseNames.some(n => n) && (
          <div className={`flex items-center gap-1.5 ${selected ? "text-accent" : "text-accent/70"}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Named</span>
          </div>
        )}
      </div>

      {/* Action buttons row - always visible on touch devices, hover on desktop */}
      {hasActions && (
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {onUseAsTemplate && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onUseAsTemplate(preset);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/5 text-muted-foreground sm:bg-transparent hover:bg-accent/10 hover:text-accent transition-all cursor-pointer active:scale-95"
              title="Use as template"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Template</span>
            </div>
          )}
          {onEdit && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/5 text-muted-foreground sm:bg-transparent hover:bg-accent/10 hover:text-accent transition-all cursor-pointer active:scale-95"
              title="Edit"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </div>
          )}
          {onDelete && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/5 text-muted-foreground sm:bg-transparent hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer active:scale-95"
              title="Delete"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete</span>
            </div>
          )}
        </div>
      )}
    </button>
  );
}
