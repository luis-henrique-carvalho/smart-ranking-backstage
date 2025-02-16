// Tipos para representar os dados da API do Azure DevOps
export interface CommitAuthor {
  name: string;
  email: string;
  date: string; // Data no formato ISO 8601
}

export interface Commit {
  commitId: string;
  author: CommitAuthor;
  committer: CommitAuthor;
  comment: string;
  changeCounts: {
    Add: number;
    Edit: number;
    Delete: number;
  };
  url: string;
  remoteUrl: string;
}

export interface CommitResponse {
  count: number;
  value: Commit[];
}
