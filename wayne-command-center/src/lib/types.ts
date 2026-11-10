import type {
  AgentStatus, Confidence, DecisionStatus, Priority, ProjectStatus, ResearchStatus, TaskStatus,
} from "@/lib/domain";

export type Profile = { id: string; full_name: string | null; timezone: string };

export type Department = {
  id: string; name: string; description: string | null; lead: string | null; created_at: string;
};

export type Project = {
  id: string; department_id: string | null; name: string; description: string | null;
  status: ProjectStatus; priority: Priority; progress: number;
  start_date: string | null; due_date: string | null; created_at: string; updated_at: string;
};

export type Milestone = {
  id: string; project_id: string; title: string; due_date: string | null; completed_at: string | null;
};

export type Task = {
  id: string; project_id: string | null; title: string; description: string | null;
  status: TaskStatus; priority: Priority; due_date: string | null; completed_at: string | null;
  created_at: string; updated_at: string;
};

export type ResearchEntry = {
  id: string; project_id: string | null; title: string; summary: string | null; source_url: string | null;
  tags: string[]; status: ResearchStatus; confidence: Confidence; created_at: string; updated_at: string;
};

export type Decision = {
  id: string; project_id: string | null; title: string; context: string | null; decision: string | null;
  alternatives: string | null; rationale: string | null; status: DecisionStatus; decided_at: string; created_at: string;
};

export type Agent = {
  id: string; department_id: string | null; name: string; role: string | null; skill_command: string | null;
  description: string | null; status: AgentStatus; created_at: string; updated_at: string;
};

export type WeeklyMetrics = {
  generated_at: string;
  week_start: string;
  week_end: string;
  timezone: string;
  tasks_completed: number;
  tasks_created: number;
  open_tasks: number;
  overdue_tasks: number;
  blocked_tasks: number;
  decisions_made: number;
  research_added: number;
  milestones_completed: number;
  active_projects: number;
  completed_task_titles: string[];
};

export type WeeklyReport = {
  id: string; week_start: string; summary: string | null; wins: string | null; blockers: string | null;
  next_steps: string | null; metrics: Partial<WeeklyMetrics>; created_at: string; updated_at: string;
};
