export interface Workflow {
  id: string;
  name: string;
}

export const deserialize = function (data: any): Workflow {
  const workflow: Workflow = {
    id: data['id'],
    name: data['name']
  };
  return workflow;
};
