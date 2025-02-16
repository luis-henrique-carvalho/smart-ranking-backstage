export interface CommitAuthor {
  name: string;
  email: string;
  date: string;
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
