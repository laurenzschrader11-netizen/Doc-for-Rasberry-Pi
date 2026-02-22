export interface AppBlueprint {
  id: number;
  name: string;
  code?: string;
  file_name?: string;
  github_url?: string;
  deploy_type: 'code' | 'file' | 'github' | 'template';
  status: 'running' | 'stopped';
  env_vars: Record<string, string>;
  created_at: string;
  last_run: string | null;
  port?: number;
}
