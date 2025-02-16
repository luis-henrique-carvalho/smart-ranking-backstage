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

interface Creator {
  displayName: string;
  url: string;
  _links: {
    avatar: {
      href: string;
    };
  };
  id: string;
  uniqueName: string;
  imageUrl: string;
  descriptor: string;
}

export interface CommitResponse {
  count: number;
  value: Commit[];
}

export interface Branch {
  name: string;
  objectId?: string;
  creator?: Creator;
  url?: string;
}

export interface BranchsResponse {
  value: Branch[];
  count: number;
}
