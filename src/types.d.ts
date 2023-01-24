export interface GitLabWebhookBody {
  project_id: number;
  ref: string;
  sha: string;
  build_id: number;
  build_name: string;
  build_status: string;
  build_duration: number;
  build_allow_failure: boolean;
  repository: { git_http_url: string; },
}
