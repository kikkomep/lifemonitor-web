export interface Job {
  id: string;
  type: string;
  status: string;
  data?: any;
  created: number;
  modified: number;
  error?: any;
}
